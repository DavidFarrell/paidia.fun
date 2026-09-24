#!/usr/bin/env python3
"""Soundtrack, sound effects and final mix for the Raccoon Rampage explainer film.

USAGE (from the project directory, animations/raccoon-rampage-explainer):

    node render/render.mjs --timeline out/timeline.json   # 1. export scenes + SFX cues (~20 s)
    python3 audio/make_audio.py                            # 2. synthesise music + SFX and mix (~1 min CPU)

    python3 audio/make_audio.py --export       # run step 1 first (needs node + playwright)
    python3 audio/make_audio.py --test-cues    # also sprinkle one cue of EVERY sfx across the film
    python3 audio/make_audio.py --no-plots     # skip the PNGs (faster)
    python3 audio/make_audio.py --no-cache     # force re-synthesis of the music bed
    python3 audio/make_audio.py --timeline other.json --out out/audio/alt

Requires Python 3.9+, numpy and scipy (pip install scipy); matplotlib is optional (PNGs only).
Everything is synthesised from code (no samples) with fixed seeds: reruns are bit-identical.
Validation printed and saved in report.json: integrated loudness (ITU-R BS.1770 K-weighting and
gating), sample and 4x true peak, clipped samples, DC offset, stereo correlation, per-scene RMS/peak/
LUFS and spectral balance, 100 ms windows where the music drops below -50 dBFS (intended gaps are
listed separately), and a harmony check of long on-beat melody notes against the chord symbols.

OUTPUTS (in --out, default out/audio/):
    mix.wav          48 kHz stereo 16-bit final mix, exactly `duration` seconds
    music.wav        the music bed as it sits in the mix (ducked, same master gain)
    sfx_track.wav    all SFX cues on their own (same master gain)
    sfx/<name>.wav   each sound effect as a one-shot, pre-master level (the mix adds ~+6 dB, x cue vol)
    report.json      validation numbers: loudness, peaks, DC, per-section RMS/peak/spectrum, silences
    png/             spectrograms (mix, music, every SFX + contact sheet), level/ducking plot,
                     piano roll of the score with chord symbols
    cache/           the rendered music bed, keyed by a hash of the score + this script, so a
                     rerun where only SFX cues changed skips the synthesis (about 5 s instead of ~1 min)
    With --test-cues the mix / sfx_track / report / png get a "_testcues" suffix so the real
    mix is not overwritten.

TIMELINE (out/timeline.json, written by render.mjs from each scene's `cues` and `dur`):
    {fps, bpm, duration, scenes: [{id, start, dur, music}], cues: [{t, sfx, vol, scene}]}
    Scene start/dur are always taken from the file. Moods are mapped by scene id (s01..s12,
    falling back to the `music` name, then to a generic groove). A few musical hits follow the
    cues when they exist: the PASS resolution in s07 (first stamp/ding), the comic turn in s08
    (first pop in the second half), the outcomes in s11 (sad / scratch / cheer; a drumroll cue
    replaces the music's own roll) and the final button in s12 (clang in the last 2 s).

MUSIC DESIGN (120 BPM, 4/4, 1 bar = 2 s; all scenes start on bar lines)
    s01 D minor sneaky: pizzicato raccoon motif + bassoon, bouncy bass, run-up into the whip-pan
    s02 F major storybook: celesta tune, pizz arpeggios, vibes, legato sine bass
    s03 F major MAIN THEME on marimba, off-beat pizz, bouncy bass, light kit, stab tag
    s04 theme variations, one colour per role: DE oompah tuba+marimba, FR musette accordion,
        Animal Rights sweet vibes + glock, Hunter horn call over a gallop
    s05 Bb major steady (tick-tock woodblock, pizz ostinato)
    s06 Bb major light groove; s07 ii-V vamp that resolves brightly on the PASS (theme in Bb)
    s08 D minor low pulsing tension, turning comic (raccoon motif, pizz + bassoon)
    s09 Bb swing: sly vibes line, walking pizz bass, brushes (negotiation)
    s10 D minor sneaky staccato raccoon motif
    s11 build on a C pedal with roll -> deflated wah (outcome A) -> raccoon party cut by a
        tape stop + rewind -> F major triumph (outcome B) -> D7 pivot
    s12 G major reprise of the theme, raccoon steals the trophy, button on the last beat
"""

import argparse
import bisect
import json
import math
import os
import re
import subprocess
import sys
import time
import wave
import zlib
from dataclasses import dataclass, field
from functools import lru_cache

import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)
TWO_PI = 2 * np.pi


# ============================================================================ small helpers

def seed_of(*parts):
    return zlib.crc32('|'.join(map(str, parts)).encode()) & 0xFFFFFFFF


def rng_of(*parts):
    return np.random.default_rng(seed_of(*parts))


def dbv(x):
    return 20 * math.log10(max(float(x), 1e-12))


def undb(d):
    return 10 ** (d / 20)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tvec(n):
    return np.arange(n) / SR


def warn(msg):
    print('WARNING:', msg, file=sys.stderr)


@lru_cache(maxsize=None)
def _sos(kind, fc, order):
    if kind == 'band':
        return signal.butter(order, [fc[0], min(fc[1], SR * 0.45)], btype='bandpass', fs=SR, output='sos')
    return signal.butter(order, min(fc, SR * 0.45), btype=kind, fs=SR, output='sos')


def lp(x, fc, order=2):
    return signal.sosfilt(_sos('low', float(fc), order), x, axis=0)


def hp(x, fc, order=2):
    return signal.sosfilt(_sos('high', float(fc), order), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos('band', (float(lo), float(hi)), order), x, axis=0)


def one_pole_lp(x, fc):
    a = math.exp(-TWO_PI * fc / SR)
    return signal.lfilter([1 - a], [1, -a], x, axis=0)


def attack_env(n, a):
    """Raised-cosine fade-in of `a` seconds (1 afterwards)."""
    e = np.ones(n)
    k = min(n, max(1, int(a * SR)))
    e[:k] = 0.5 - 0.5 * np.cos(np.pi * np.arange(k) / k)
    return e


def release_at(n, start_s, rel_s):
    """1 until start_s, cosine fade over rel_s, 0 after."""
    e = np.ones(n)
    i0 = int(start_s * SR)
    k = max(1, int(rel_s * SR))
    if i0 >= n:
        return e
    seg = 0.5 + 0.5 * np.cos(np.pi * np.arange(k) / k)
    j = min(n, i0 + k)
    e[i0:j] = seg[:j - i0]
    e[j:] = 0
    return e


def edge_fade(y, a=0.001, r=0.004):
    n = len(y)
    ka, kr = min(n, int(a * SR)), min(n, int(r * SR))
    if ka > 1:
        y[:ka] *= np.linspace(0, 1, ka)[:, None] if y.ndim == 2 else np.linspace(0, 1, ka)
    if kr > 1:
        y[-kr:] *= np.linspace(1, 0, kr)[:, None] if y.ndim == 2 else np.linspace(1, 0, kr)
    return y


def pan2(y, p=0.0):
    """Mono -> stereo, constant power pan p in -1..1."""
    th = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.stack([y * math.cos(th), y * math.sin(th)], axis=1)


def svf(x, fc, q=0.7, mode='bp'):
    """Time-varying TPT state-variable filter (per-sample loop; only used for short SFX)."""
    n = len(x)
    fc = np.broadcast_to(np.asarray(fc, dtype=float), (n,))
    g = np.tan(np.pi * np.clip(fc, 20, SR * 0.45) / SR)
    k = 1.0 / q
    a1 = 1.0 / (1.0 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    xs, A1, A2, A3 = x.tolist(), a1.tolist(), a2.tolist(), a3.tolist()
    out = [0.0] * n
    ic1 = ic2 = 0.0
    for i in range(n):
        v3 = xs[i] - ic2
        v1 = A1[i] * ic1 + A2[i] * v3
        v2 = ic2 + A2[i] * ic1 + A3[i] * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        if mode == 'bp':
            out[i] = k * v1
        elif mode == 'lp':
            out[i] = v2
        else:
            out[i] = xs[i] - k * v1 - v2
    return np.array(out)


def modal(n, freqs, amps, taus, rng=None, attack=0.0008):
    """Sum of exponentially decaying sinusoids (bars, bells, blocks, lids)."""
    t = tvec(n)
    y = np.zeros(n)
    for f, a, tau in zip(freqs, amps, taus):
        if f >= SR * 0.42:
            continue
        ph = rng.uniform(0, TWO_PI) if rng is not None else 0.0
        y += a * np.exp(-t / tau) * np.sin(TWO_PI * f * t + ph)
    return y * attack_env(n, attack)


def norm_peak(y, peak=1.0):
    m = np.max(np.abs(y))
    return y * (peak / m) if m > 0 else y


# ============================================================================ notes and chords

NOTE_PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def pc_of(name):
    return (NOTE_PC[name[0]] + name[1:].count('#') - name[1:].count('b')) % 12


def nn(s):
    m = re.fullmatch(r'([A-G])([b#]*)(-?\d)', s)
    if not m:
        raise ValueError('bad note ' + s)
    return 12 * (int(m[3]) + 1) + NOTE_PC[m[1]] + m[2].count('#') - m[2].count('b')


QUAL = {
    '': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10), 'maj7': (0, 4, 7, 11), 'm7': (0, 3, 7, 10),
    '6': (0, 4, 7, 9), 'm6': (0, 3, 7, 9), 'sus4': (0, 5, 7), '7sus4': (0, 5, 7, 10),
    'm7b5': (0, 3, 6, 10), 'dim': (0, 3, 6), 'aug': (0, 4, 8), 'add9': (0, 4, 7, 2),
}
PC_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']


@dataclass(frozen=True)
class Chord:
    name: str
    root: int
    ivs: tuple
    bass: int

    @property
    def pcs(self):
        return [(self.root + i) % 12 for i in self.ivs]

    @property
    def fifth_iv(self):
        for i in self.ivs:
            if i in (6, 7, 8):
                return i
        return 7

    def priority_pcs(self):
        """Chord tones in voicing priority order: 3rd/sus, 7th/6th, root, 5th."""
        order = []
        for want in ((3, 4, 5), (10, 11, 9), (0,), (6, 7, 8), (2,)):
            for i in self.ivs:
                if i in want and (self.root + i) % 12 not in order:
                    order.append((self.root + i) % 12)
        return order


def parse_chord(sym, tr=0):
    main, _, bass = sym.partition('/')
    m = re.fullmatch(r'([A-G][b#]?)(.*)', main)
    if not m or m[2] not in QUAL:
        raise ValueError('bad chord ' + sym)
    root = (pc_of(m[1]) + tr) % 12
    bpc = (pc_of(bass) + tr) % 12 if bass else root
    name = PC_NAMES[root] + m[2] + ('/' + PC_NAMES[bpc] if bass else '')
    return Chord(name, root, QUAL[m[2]], bpc)


def parse_prog(spec, tr=0):
    """'F | Bb | Gm7 C7 | F' or 'F:4 C7:4' -> [(beat_offset, beats, Chord)], total beats."""
    spans, pos = [], 0.0
    for bar in spec.split('|'):
        toks = bar.split()
        if not toks:
            continue
        items = []
        for tok in toks:
            sym, _, d = tok.partition(':')
            items.append((sym, float(d) if d else None))
        explicit = sum(d for _, d in items if d)
        free = [i for i in items if i[1] is None]
        share = (4.0 - explicit) / len(free) if free else 0
        for sym, d in items:
            L = d if d is not None else share
            spans.append((pos, L, parse_chord(sym, tr)))
            pos += L
    return spans, pos


def parse_mel(spec):
    """'A4:.5 C5:.5! r:1 [F4,A4]:1.' -> [(beat_offset, beats, [midi...], flags)], total beats.
    Flags: '!' accent, '.' staccato."""
    out, pos = [], 0.0
    for tok in spec.replace('|', ' ').split():
        name, _, rest = tok.partition(':')
        flags = ''
        while rest and rest[-1] in '!.' and not re.fullmatch(r'\d*\.?\d+', rest):
            flags += rest[-1]
            rest = rest[:-1]
        d = float(rest) if rest else 1.0
        if name != 'r':
            notes = [nn(x) for x in name[1:-1].split(',')] if name.startswith('[') else [nn(name)]
            out.append((pos, d, notes, flags))
        pos += d
    return out, pos


def swing_pos(pos, amt):
    whole = math.floor(pos + 1e-9)
    frac = pos - whole
    if abs(frac - 0.5) < 1e-6:
        return whole + amt
    return pos


def fit(pc, lo):
    """Lowest MIDI note >= lo with pitch class pc."""
    return lo + ((pc - lo) % 12)


def voicing(ch, center, n=3):
    pcs = ch.priority_pcs()[:n]
    notes = []
    for pc in pcs:
        cands = [m for m in range(center - 7, center + 8) if m % 12 == pc]
        notes.append(min(cands, key=lambda m: abs(m - center)))
    return sorted(notes)


def ladder(ch, lo, n=10):
    out, m = [], lo
    pcs = set(ch.pcs)
    while len(out) < n:
        if m % 12 in pcs:
            out.append(m)
        m += 1
    return out


# ============================================================================ the arranger

@dataclass
class Note:
    inst: str
    t: float
    dur: float
    midi: int
    vel: float
    pan: float = None
    var: int = 0
    kw: dict = field(default_factory=dict)


class Arr:
    """Collects note events and chord spans on an absolute beat grid (t = 0 is a bar line)."""

    def __init__(self, bpm, dur, seed=20240117):
        self.bpm = bpm
        self.b = 60.0 / bpm
        self.bar = 4 * self.b
        self.dur = dur
        self.notes = []
        self.spans = []
        self._starts = None
        self.rng = np.random.default_rng(seed)
        self.gaps = []        # intended music silences (t0, t1)
        self.post = []        # post-render effects on the music bus
        self.marks = {}       # named musical moments (for the report)
        self.labels = []      # (t, text) for plots

    # ---- time
    def snap(self, t, grid=None):
        g = grid or self.b
        return round(t / g) * g

    def bar_floor(self, t):
        return math.floor(t / self.bar + 1e-6) * self.bar

    def grid(self, t0, t1, step, off=0.0):
        st, o = step * self.b, off * self.b
        out = []
        k = math.ceil((t0 - o) / st - 1e-6)
        while True:
            p = k * st + o
            if p >= t1 - 1e-6:
                break
            if p >= t0 - 1e-6:
                out.append(p)
            k += 1
        return out

    # ---- chords
    def add_span(self, a, e, ch):
        # later spans override earlier ones in the same range
        keep = []
        for (x0, x1, c) in self.spans:
            if x1 <= a + 1e-9 or x0 >= e - 1e-9:
                keep.append((x0, x1, c))
            else:
                if x0 < a:
                    keep.append((x0, a, c))
                if x1 > e:
                    keep.append((e, x1, c))
        keep.append((a, e, ch))
        keep.sort(key=lambda s: s[0])
        self.spans = keep
        self._starts = [s[0] for s in keep]

    def chord_at(self, t):
        if not self.spans:
            return parse_chord('F')
        i = bisect.bisect_right(self._starts, t + 1e-6) - 1
        return self.spans[max(0, i)][2]

    # ---- events
    def note(self, inst, t, dur, midi, vel, pan=None, var=None, tight=False, **kw):
        if not tight:
            t += float(self.rng.normal(0, 0.0025))
            vel *= 1 + float(self.rng.normal(0, 0.05))
        if var is None:
            var = int(self.rng.integers(0, 3))
        if t >= self.dur or dur <= 0:
            return
        self.notes.append(Note(inst, max(0.0, t), dur, int(midi), float(np.clip(vel, 0.02, 1.0)), pan, var, kw))

    def place(self, t0, t1, prog=None, mels=(), align='start', tr=0):
        """Lay a chord progression and melodies into [t0, t1): repeated from t0 (align='start')
        or ending exactly at t1 (align='end'); truncated at the window edges."""
        spans, L = parse_prog(prog, tr) if prog else ([], 0.0)
        parsed = []
        for m in mels:
            ev, ml = parse_mel(m['spec'])
            parsed.append((m, ev))
            L = max(L, ml)
        if L <= 0 or t1 <= t0 + 1e-6:
            return
        Ls = L * self.b
        starts = []
        if align == 'start':
            s = t0
            while s < t1 - 1e-6:
                starts.append(s)
                s += Ls
        else:
            s = t1 - Ls
            while s + Ls > t0 + 1e-6:
                starts.append(s)
                s -= Ls
        for s in starts:
            for off, ln, ch in spans:
                a, e = max(t0, s + off * self.b), min(t1, s + (off + ln) * self.b)
                if e > a + 1e-6:
                    self.add_span(a, e, ch)
            for m, ev in parsed:
                sw = m.get('swing', 0)
                ramp = m.get('ramp')
                for off, d, notes, flags in ev:
                    on, end = off, off + d
                    if sw:
                        on, end = swing_pos(on, sw), swing_pos(end, sw)
                    t = s + on * self.b
                    if t < t0 - 1e-6 or t >= t1 - 1e-6:
                        continue
                    dd = (end - on) * self.b * m.get('legato', 1.0) * (0.45 if '.' in flags else 1.0)
                    if m.get('stacc'):
                        dd = min(dd, m['stacc'] * self.b)
                    dd = min(dd, t1 - t + m.get('overhang', 0.6))
                    v = m.get('vel', 0.7) * (1.15 if '!' in flags else 1.0) * (0.9 if abs(on % 1) > 1e-6 else 1.0)
                    if ramp:
                        u = (t - t0) / max(1e-6, t1 - t0)
                        v *= ramp[0] + (ramp[1] - ramp[0]) * u
                    for x in notes:
                        mm = x + tr + m.get('tr', 0)
                        self.note(m['inst'], t, dd, mm, v, m.get('pan'))
                        for (dinst, semi, vm) in m.get('double', ()):
                            self.note(dinst, t, dd, mm + semi, v * vm)

    # ---- accompaniment generators
    BASS_PATS = {
        'bouncy': [(0, 'R', .8, 1.0), (1.5, '5', .4, .7), (2, 'R', .8, .9), (3, '5', .45, .75), (3.5, 'A', .4, .72)],
        'half': [(0, 'R', 1.9, .9), (2, '5', 1.9, .75)],
        'whole': [(0, 'R', 3.8, .9)],
        'oompah': [(0, 'R', .7, 1.0), (2, '5', .7, .85)],
        'tiptoe': [(0, 'R', .3, .9), (1, '5', .3, .7), (2, 'R', .3, .85), (3, '5', .3, .7)],
        'pulse8': [(i * .5, 'R', .38, 1.0 if i == 0 else (.8 if i % 2 == 0 else .62)) for i in range(8)],
        'gallop': [(bt + o, 'R' if bt % 2 == 0 else '5', ln, v) for bt in range(4)
                   for (o, ln, v) in ((0, .4, 1.0), (.5, .2, .65), (.75, .2, .72))],
    }

    def _bass_midi(self, t, kind, lo, bar_t):
        ch = self.chord_at(t + 1e-4)
        r = fit(ch.bass, lo)
        if kind == 'R':
            return r
        if kind == '5':
            f = fit((ch.root + ch.fifth_iv) % 12, lo)
            if f == r:
                f += 12
            return f
        if kind == 'A':  # chromatic approach to the next bar's bass note
            nx = fit(self.chord_at(bar_t + self.bar + 1e-4).bass, lo)
            if nx == r:
                return self._bass_midi(t, '5', lo, bar_t)
            return nx - 1 if int(round(bar_t / self.bar)) % 2 == 0 else nx + 1
        return r

    def bass(self, t0, t1, style='bouncy', vel=0.7, inst='bass', lo=36, ramp=None):
        if style == 'walk':
            return self.walk(t0, t1, vel, inst, lo)
        pat = self.BASS_PATS[style]
        bt = self.bar_floor(t0)
        while bt < t1 - 1e-6:
            for (beat, kind, ln, vm) in pat:
                t = bt + beat * self.b
                if t < t0 - 1e-6 or t >= t1 - 1e-6:
                    continue
                v = vel * vm
                if ramp:
                    v *= ramp[0] + (ramp[1] - ramp[0]) * (t - t0) / max(1e-6, t1 - t0)
                self.note(inst, t, min(ln * self.b, t1 - t + 0.05), self._bass_midi(t, kind, lo, bt), v)
            bt += self.bar

    def walk(self, t0, t1, vel, inst, lo):
        prev = None
        for i, t in enumerate(self.grid(t0, t1, 1)):
            ch = self.chord_at(t + 1e-4)
            prv = self.chord_at(t - self.b + 1e-4)
            nxt = self.chord_at(t + self.b + 1e-4)
            r = fit(ch.bass, lo)
            if ch != prv or i == 0:
                m = r
            elif nxt != ch or t + self.b >= t1 - 1e-6:
                target = fit(nxt.bass, lo)
                m = target + (1 if (prev or r) > target else -1)
            else:
                opts = [fit((ch.root + ch.fifth_iv) % 12, lo), fit(ch.pcs[1], lo), fit(ch.pcs[-1], lo)]
                m = opts[i % len(opts)]
            if prev is not None and abs(m - prev) > 9:
                m += -12 if m > prev else 12
            m = int(np.clip(m, lo - 5, lo + 16))
            prev = m
            self.note(inst, t, 0.9 * self.b, m, vel * (1.0 if i % 2 == 0 else 0.85))

    def comp(self, t0, t1, style, inst='pizz', vel=0.5, center=62, n=3, swing=0, ramp=None, pan=None):
        b = self.b

        def vv(t, v):
            if ramp:
                v *= ramp[0] + (ramp[1] - ramp[0]) * (t - t0) / max(1e-6, t1 - t0)
            return v

        if style == 'sustain':
            for (a, e, ch) in list(self.spans):
                a2, e2 = max(a, t0), min(e, t1)
                if e2 > a2 + 0.05:
                    for m in voicing(ch, center, 4 if len(ch.ivs) > 3 else 3):
                        self.note(inst, a2, e2 - a2 + 0.08, m, vv(a2, vel), pan)
            return
        if style in ('offbeat', 'stabs24', 'quarter', 'charleston'):
            if style == 'offbeat':
                pos, ln = self.grid(t0, t1, 1, 0.5), 0.35
            elif style == 'stabs24':
                pos, ln = self.grid(t0, t1, 2, 1), 0.6
            elif style == 'quarter':
                pos, ln = self.grid(t0, t1, 1), 0.4
            else:
                pos = sorted(self.grid(t0, t1, 4, 0) + self.grid(t0, t1, 4, swing_pos(1.5, swing) if swing else 1.5))
                ln = 0.55
            for t in pos:
                ch = self.chord_at(t + 1e-4)
                for j, m in enumerate(voicing(ch, center, n)):
                    self.note(inst, t + j * 0.006, ln * b, m, vv(t, vel) * (0.9 if j else 1.0), pan)
            return
        pats = {'arp8': [0, 1, 2, 3, 4, 3, 2, 1], 'ostinato': [0, 2, 3, 2, 1, 2, 3, 2]}
        pat = pats[style]
        lo = center - (7 if style == 'arp8' else 12)
        for k, t in enumerate(self.grid(t0, t1, 0.5)):
            ch = self.chord_at(t + 1e-4)
            lad = ladder(ch, lo)
            i = pat[int(round((t / b) * 2)) % 8]
            acc = 1.0 if int(round(t / b * 2)) % 2 == 0 else 0.82
            self.note(inst, t, (1.2 if style == 'arp8' else 0.45) * b, lad[i], vv(t, vel) * acc, pan)

    DRUM_PATS = {
        'light': [('kick', 0, 1.0), ('kick', 2, .8)] + [('shaker', i * .5, .55 if i % 2 == 0 else .85) for i in range(8)],
        'soft': [('kick', 0, .8)] + [('shaker', i * .5, .45 if i % 2 == 0 else .7) for i in range(8)],
        'groove': [('kick', 0, 1.0), ('kick', 1.5, .55), ('kick', 2, .85), ('snare', 1, .7), ('snare', 3, .75),
                   ('wood', 3.5, .35, 1)] + [('shaker', i * .25, (.8, .35, .65, .35)[i % 4]) for i in range(16)],
        'swing': [('kick', 0, .55), ('kick', 2, .5), ('snare', 1, .45), ('snare', 3, .5),
                  ('hat', 0, .6), ('hat', 1, .75), ('hat', 1 + 2 / 3, .5), ('hat', 2, .6), ('hat', 3, .75),
                  ('hat', 3 + 2 / 3, .5), ('brush', 0, .5), ('brush', 2, .45)],
        'sneaky': [('kick', 0, .8), ('wood', .5, .45, 0), ('wood', 1.5, .4, 1), ('wood', 2.5, .45, 0), ('wood', 3.5, .4, 1)],
        'tick': [('kick', 0, .6), ('wood', 0, .5, 1), ('wood', 1, .42, 0), ('wood', 2, .5, 1), ('wood', 3, .42, 0)],
        'heartbeat': [('kick', 0, 1.0), ('kick', .45, .6), ('kick', 2, .9), ('kick', 2.45, .55)],
        'pulse': [('kick', 0, .9), ('kick', 1, .6), ('kick', 2, .8), ('kick', 3, .6)] +
                 [('shaker', i * .25, (.6, .3, .45, .3)[i % 4]) for i in range(16)],
        'build': [('kick', i, .7 + .1 * (i % 2 == 0)) for i in range(4)] +
                 [('shaker', i * .25, (.8, .4, .6, .4)[i % 4]) for i in range(16)],
        'brushq': [('hat', i, .5 if i % 2 == 0 else .65) for i in range(4)],
        'comic': [('kick', 0, .9), ('kick', 2, .8), ('wood', 1, .5, 1), ('wood', 3, .5, 0)] +
                 [('shaker', i * .5, .45 if i % 2 == 0 else .7) for i in range(8)],
        'gallop': [('kick', 0, .8), ('kick', 2, .7)] +
                  [('wood', bt + o, v, (bt + (o > 0)) % 2) for bt in range(4) for (o, v) in ((0, .5), (.5, .32), (.75, .38))],
    }

    def drums(self, t0, t1, style, vel=0.6, ramp=None):
        pat = self.DRUM_PATS[style]
        bt = self.bar_floor(t0)
        while bt < t1 - 1e-6:
            for item in pat:
                inst, beat, vm = item[:3]
                t = bt + beat * self.b
                if t < t0 - 1e-6 or t >= t1 - 1e-6:
                    continue
                v = vel * vm
                if ramp:
                    v *= ramp[0] + (ramp[1] - ramp[0]) * (t - t0) / max(1e-6, t1 - t0)
                self.note(inst, t, 0.3, item[3] if len(item) > 3 else 0, v)
            bt += self.bar

    def fill(self, t_end, kind='wood3', vel=0.5):
        b = self.b
        if kind == 'wood3':
            for j, o in enumerate((0, 1 / 3, 2 / 3)):
                self.note('wood', t_end - b + o * b, .2, (1, 0, 1)[j], vel * (0.8 + 0.1 * j))
        elif kind == 'snare16':
            for j in range(4):
                self.note('snare', t_end - b + j * b / 4, .2, 0, vel * (0.5 + 0.15 * j))
        elif kind == 'kick2':
            self.note('kick', t_end - b / 2, .3, 0, vel)

    def stab(self, t, insts=('pizz', 'marimba'), vel=0.8, center=64, beats=0.5, bass=False, kick=False):
        """Chord hit. Voices are scaled down (their attacks line up); bass/kick only where no pattern plays."""
        ch = self.chord_at(t + 1e-3)
        for inst in insts:
            c = center + (24 if inst == 'glock' else 0) - (12 if inst in ('pizzlow',) else 0)
            vs = voicing(ch, c, 4 if inst != 'glock' else 2)
            for j, m in enumerate(vs):
                self.note(inst, t + j * 0.009, beats * self.b, m, vel * (0.62 if j == len(vs) - 1 else 0.5), tight=True)
        if bass:
            self.note('bass', t, beats * self.b, fit(ch.bass, 36), vel, tight=True)
        if kick:
            self.note('kick', t, 0.3, 0, vel, tight=True)

    def swell(self, t0, t1, vel=0.4):
        self.note('swell', t0, t1 - t0, 0, vel, tight=True)

    def splash(self, t, vel=0.4):
        self.note('splash', t, 1.2, 0, vel, tight=True)

    def roll(self, t0, t1, vel=0.5):
        self.note('roll', t0, t1 - t0, 0, vel, tight=True)


# ============================================================================ musical material

THEME = ("A4:.5 C5:.5 F5:.75 E5:.25 F5:.5 G5:.5 A5:1 | Bb5:.5 A5:.5 G5:.75 F5:.25 D5:1 r:1 | "
         "G4:.5 Bb4:.5 D5:.75 C5:.25 Bb4:.5 A4:.5 G4:1 | A4:.5 C5:.5 F5:1.5 r:1.5")
THEME_B = "A4:.5 C5:.5 F5:.75 E5:.25 F5:.5 A5:.5 D6:1 | D6:.5 C6:.5 Bb5:.75 A5:.25 G5:.5 E5:.5 C5:1"
THEME_TAG = "A5:.5! r:1.5 C5:.25 E5:.25 F5:.5! r:1"
PROG_A = "F | Bb | Gm7 C7 | F"
PROG_B = "Dm | Bb C7"
RACCOON = [
    "D4:.5 r:.5 F4:.5 r:.5 A4:.5 G#4:.5 A4:.5 r:.5",            # m1 over Dm
    "Bb4:.5 r:.5 A4:.5 r:.5 G4:.25 F4:.25 E4:.5 D4:.5 r:.5",    # m2 over Dm
    "G4:.5 r:.5 Bb4:.5 r:.5 D5:.5 C#5:.5 D5:.5 r:.5",           # m3 over Gm
    "E5:.5 r:.25 C#5:.25 A4:.5 G4:.5 F4:.5 E4:.5 C#4:.5 r:.5",  # m4 over A7
]


def cue_time(cues, scene_id, names, lo, hi):
    for c in cues:
        if c.get('scene') == scene_id and c['sfx'] in names and lo <= c['t'] <= hi:
            return c['t']
    return None


def has_cue(cues, scene_id, name):
    return any(c.get('scene') == scene_id and c['sfx'] == name for c in cues)


def c_s01(A, t0, t1, sec, cues):
    B = A.bar
    A.place(t0, t1, "Dm | Dm | Gm | A7 | Bb C7")
    # bar 1: the bin rattles - tiptoe pizz and a hushed pad
    A.bass(t0, t0 + B, 'tiptoe', vel=.6, inst='pizzlow', lo=45)
    A.comp(t0, t0 + B, 'sustain', 'pad', vel=.35, center=57)
    A.drums(t0 + B / 2, t0 + B, 'sneaky', vel=.4)
    # the raccoon pops out: stab, then the sneaky raccoon motif with a bouncy bass
    A.stab(t0 + B, ('pizz', 'marimba'), vel=.75, center=62)
    A.note('glock', t0 + B, .5, 86, .45, tight=True)
    A.place(t0 + B, t0 + 4 * B, mels=[dict(inst='pizz', spec=RACCOON[0] + '|' + RACCOON[2] + '|' + RACCOON[3],
                                            vel=.85, double=[('bassoon', -12, .6), ('marimba', 12, .3)])])
    A.bass(t0 + B, t0 + 4 * B, 'bouncy', vel=.7)
    A.drums(t0 + B, t0 + 4 * B, 'sneaky', vel=.55)
    A.comp(t0 + B, t0 + 4 * B, 'sustain', 'pad', vel=.26, center=55)
    A.comp(t0 + B, t0 + 4 * B, 'stabs24', 'pizzlow', vel=.3, center=57)
    # bar 5: run up into the whip-pan
    run = "F4:.5 G4:.5 A4:.5 Bb4:.5 C5:.5 D5:.5 E5:.5 G5:.5"
    A.place(t0 + 4 * B, t1, mels=[dict(inst='marimba', spec=run, vel=.75, ramp=(.6, 1.0)),
                                   dict(inst='pizz', spec=run, vel=.55, tr=-12, ramp=(.6, 1.0))])
    A.bass(t0 + 4 * B, t1, 'half', vel=.7)
    A.note('kick', t0 + 4 * B, .3, 0, .6, tight=True)
    A.drums(t0 + 4 * B, t1, 'soft', vel=.45, ramp=(.6, 1.2))
    A.swell(t1 - 1.2, t1, .45)


def c_s02(A, t0, t1, sec, cues):
    B = A.bar
    mel = ("A5:1.5 G5:.5 F5:1 C5:1 | D5:1.5 E5:.5 F5:1 A5:1 | F5:1.5 A5:.5 D5:1 F5:1 | "
           "E5:1 F5:1 C5:2 | D5:1 F5:1 Bb5:1 A5:1 | G5:2 E5:1 r:1")
    A.place(t0, t1, "F | Dm7 | Bbmaj7 | F/A | Gm7 | C7sus4 C7",
            mels=[dict(inst='celesta', spec=mel, vel=.62), dict(inst='vibes', spec=mel, vel=.3, tr=-12)])
    A.bass(t0, t1, 'half', vel=.55)
    A.comp(t0, t1, 'arp8', 'pizz', vel=.36, center=60)
    A.comp(t0, t1, 'sustain', 'pad', vel=.3, center=60)
    A.drums(t0 + 2 * B, t1, 'brushq', vel=.35)
    A.swell(t1 - 1.5, t1, .3)


def c_s03(A, t0, t1, sec, cues):
    B, b = A.bar, A.b
    body = t1 - B
    A.place(t0, t1, PROG_A + ' | ' + PROG_B + ' | F',
            mels=[dict(inst='marimba', spec=THEME + ' | ' + THEME_B + ' | ' + THEME_TAG, vel=.88)])
    A.place(t0 + 4 * B, body, mels=[dict(inst='glock', spec=THEME_B, vel=.26, tr=12)])
    A.bass(t0, body, 'bouncy', vel=.75)
    A.comp(t0, body, 'offbeat', 'pizz', vel=.45, center=63)
    A.comp(t0, body, 'sustain', 'pad', vel=.22, center=60)
    A.drums(t0, body, 'light', vel=.6)
    A.fill(t0 + 4 * B, 'wood3', .5)
    A.place(t0 + 3 * B + 2.5 * b, t0 + 4 * B,
            mels=[dict(inst='glock', spec="C6:.25 F6:.25 A6:.25 C7:.25 A6:.25 F6:.25", vel=.3)])
    A.splash(t0, .35)
    for bt in (0, 2.5):
        A.stab(body + bt * b, ('pizz', 'vibes'), vel=.85, center=65, bass=True, kick=True)
    A.labels.append((t0, 'main theme'))


ROLES = [
    ('DE oompah', "F:4 C7:4",
     dict(inst='marimba', vel=.82, spec="A4:.5 C5:.5 F5:.75 E5:.25 F5:.5 G5:.5 A5:1 G5:.5 E5:.5 C5:.75 D5:.25 E5:.5 G5:.5 C5:1")),
    ('FR musette', "Bb:4 Gm7:2 C7:2 F:2",
     dict(inst='reed', vel=.72, spec="D5:.5 F5:.5 Bb5:.75 A5:.25 G5:.5 F5:.5 D5:1 G5:.5 F5:.5 E5:.5 D5:.5 "
                                     "C5:.5 D5:.25 C5:.25 Bb4:.5 A4:.5 F4:1 r:1")),
    ('AR sweet', "Dm:4 Bb:4 C:2",
     dict(inst='vibes', vel=.78, spec="F5:1.5 E5:.5 D5:1 A4:1 D5:1.5 C5:.5 Bb4:1 F5:1 E5:2")),
    ('HU horn', "F:4 Bb:2 C:2 F:2",
     dict(inst='horn', vel=.75, spec="C5:.75 C5:.25 F5:1 C5:.5 A4:.5 F4:1 D5:.5 F5:.5 Bb5:1 G5:.5 E5:.5 C5:1 F5:1.5 r:.5")),
]


def c_s04(A, t0, t1, sec, cues):
    d = t1 - t0
    st = [t0 + A.snap(d * f) for f in (0.05, 0.25, 0.5, 0.75)] + [t1]
    A.place(t0, st[0], "F:4")
    A.stab(t0, ('pizz', 'marimba'), vel=.7, center=62, bass=True)
    A.comp(t0, st[0], 'sustain', 'pad', vel=.25, center=60)
    A.drums(t0, st[0], 'soft', .45)
    for i, (name, prog, mel) in enumerate(ROLES):
        a, e = st[i], st[i + 1]
        A.place(a, e, prog, mels=[mel])
        A.labels.append((a, name))
        if i == 0:
            A.bass(a, e, 'oompah', vel=.8, inst='tuba', lo=36)
            A.comp(a, e, 'stabs24', 'pizz', vel=.5, center=62)
            A.drums(a, e, 'light', .55)
        elif i == 1:
            A.bass(a, e, 'bouncy', vel=.65)
            A.comp(a, e, 'offbeat', 'pizz', vel=.4, center=64)
            A.comp(a, e, 'sustain', 'pad', vel=.15, center=60)
            A.drums(a, e, 'light', .5)
        elif i == 2:
            A.bass(a, e, 'half', vel=.6)
            A.comp(a, e, 'arp8', 'pizz', vel=.34, center=60)
            A.comp(a, e, 'sustain', 'pad', vel=.28, center=60)
            A.drums(a, e, 'soft', .4)
            A.place(a, a + A.b, mels=[dict(inst='glock', spec="A6:.25 D7:.75", vel=.35)])
        else:
            A.bass(a, e, 'gallop', vel=.6)
            A.drums(a, e, 'gallop', .5)
            A.comp(a, e, 'offbeat', 'marimba', vel=.3, center=64)
    lineup = min(t1 - A.b, st[3] + 8 * A.b)
    A.stab(lineup, ('pizz', 'marimba', 'vibes'), vel=.8, center=65)
    A.splash(lineup, .3)


def c_s05(A, t0, t1, sec, cues):
    mel = "D5:1 F5:1 Bb5:2 | A5:1 C6:1 F5:2 | Bb5:1 A5:1 G5:1 D5:1 | Eb5:1 G5:1 Bb5:1 G5:1 | F5:1 Bb5:1 A5:1 C6:1"
    A.place(t0, t1, "Bb | F/A | Gm | Eb | F7sus4 F7",
            mels=[dict(inst='vibes', spec=mel, vel=.65, double=[('celesta', 12, .22)])])
    A.bass(t0, t1, 'half', vel=.62)
    A.comp(t0, t1, 'ostinato', 'pizz', vel=.4, center=62)
    A.drums(t0, t1, 'tick', .42)


def c_s06(A, t0, t1, sec, cues):
    B = A.bar
    mel = ("D5:1 F5:.5 D5:.5 C5:.5 Bb4:1.5 | D5:.5 F5:.5 G5:1 F5:.5 D5:.5 Bb4:1 | G5:1 Bb5:.5 G5:.5 F5:.5 Eb5:1.5 | "
           "F5:.5 A5:.5 C6:1 A5:1 r:1 | D5:1 F5:.5 D5:.5 C5:.5 Bb4:.5 C5:.5 D5:.5 | Bb5:1 A5:.5 G5:.5 F5:1 D5:1 | "
           "Eb5:.5 D5:.5 C5:1 A4:.5 C5:.5 Eb5:1")
    A.place(t0, t1, "Bb | Gm7 | Eb | F | Bb | Gm7 | Cm7 F7", mels=[dict(inst='vibes', spec=mel, vel=.72)])
    A.bass(t0, t1, 'bouncy', vel=.7)
    A.comp(t0, t1, 'ostinato', 'marimba', vel=.42, center=60)
    A.drums(t0, t1, 'groove', .55)
    A.fill(t0 + 4 * B, 'wood3', .45)
    A.fill(t1, 'snare16', .45)


def c_s07(A, t0, t1, sec, cues):
    B, b = A.bar, A.b
    hit = t0 + 3 * B
    c = cue_time(cues, sec['id'], ('stamp',), t0 + 1.5, t1 - 4) or cue_time(cues, sec['id'], ('ding',), t0 + 1.5, t1 - 4)
    if c is not None:
        hit = A.snap(c)
    A.marks['pass'] = hit
    A.labels.append((hit, 'PASS'))
    # counting: a ii-V vamp that ends exactly on the PASS
    A.place(t0, hit, "Gm7 | Cm7 | F7sus4 | F7", align='end')
    A.comp(t0, hit, 'arp8', 'marimba', vel=.4, center=62, ramp=(.8, 1.3))
    A.bass(t0, hit, 'tiptoe', vel=.6, ramp=(.8, 1.2))
    A.drums(t0, hit, 'soft', .4)
    A.drums(max(t0, hit - B), hit, 'tick', .45)
    A.swell(hit - 1.5, hit, .45)
    # PASS: bright resolution, then the main theme in Bb from the next bar line
    th = hit if abs(hit / B - round(hit / B)) < 1e-6 else A.bar_floor(hit) + B
    if th > hit:
        A.place(hit, th, "Bb:4")
    A.place(th, t1, PROG_A + ' | Fmaj7', tr=5,
            mels=[dict(inst='marimba', spec=THEME + ' | r:4', vel=.85, double=[('glock', 0, .22)])])
    A.stab(hit, ('pizz', 'vibes'), vel=.85, center=65)
    A.place(hit, hit + 2 * b, mels=[dict(inst='glock', spec="D6:.25 F6:.25 Bb6:.25 D7:1.25", vel=.4)])
    A.splash(hit, .45)
    tag = t1 - B
    A.bass(hit, tag, 'bouncy', vel=.75)
    A.comp(hit, tag, 'offbeat', 'pizz', vel=.45, center=65)
    A.drums(hit, tag, 'groove', .58)
    A.bass(tag, t1, 'whole', vel=.55)
    A.comp(tag, t1, 'sustain', 'vibes', vel=.4, center=65)
    A.place(tag, t1, mels=[dict(inst='glock', spec="r:1 A6:.5 F6:.5 D6:.5 A5:1.5", vel=.25)])


def c_s08(A, t0, t1, sec, cues):
    B = A.bar
    comic = t0 + 8 * B if t1 - t0 >= 12 * B else A.bar_floor(t0 + (t1 - t0) * 2 / 3)
    c = cue_time(cues, sec['id'], ('pop',), t0 + 0.4 * (t1 - t0), t1 - 2 * B)
    if c is not None:
        comic = min(max(A.bar_floor(c + A.b), t0 + 4 * B), t1 - 2 * B)
    A.marks['spread_comic'] = comic
    A.labels.append((t0, 'tension'))
    A.labels.append((comic, 'comic'))
    tension = ("A4:2 Bb4:2 | A4:3 r:1 | D5:2 C5:1 Bb4:1 | A4:2 C#5:2 | D5:2 E5:1 F5:1 | G5:2 F5:1 D5:1 | "
               "Eb5:2 D5:1 Bb4:1 | A4:2 C#5:1 E5:1")
    A.place(t0, comic, "Dm | Dm | Bb | A7 | Dm | Gm | Eb | A7", align='end',
            mels=[dict(inst='vibes', spec=tension, vel=.55, tr=-12, double=[('horn', 0, .35)])])
    mid = A.bar_floor(t0 + (comic - t0) / 2)
    A.bass(t0, comic, 'pulse8', vel=.52, lo=38, ramp=(.8, 1.15))
    A.comp(t0, comic, 'ostinato', 'marimba', vel=.34, center=57, ramp=(.8, 1.2))
    A.comp(t0, comic, 'sustain', 'pad', vel=.32, center=55)
    A.drums(t0, mid, 'heartbeat', .55)
    A.drums(mid, comic, 'pulse', .5, ramp=(.8, 1.1))
    A.swell(comic - 1.0, comic, .35)
    comic_mel = ("D5:.5 r:.5 F5:.5 r:.5 A5:.5 G#5:.5 A5:.5 r:.5 | Bb4:.5 r:.5 D5:.5 r:.5 G5:.5 F#5:.5 G5:.5 r:.5 | "
                 "E5:.5 r:.25 C#5:.25 A4:.5 G4:.5 F4:.5 E4:.5 C#4:.5 r:.5 | D4:.5 r:.5 A4:.5 r:.5 C5:.5 Eb5:.5 F5:.5 A5:.5")
    A.place(comic, t1, "Dm | Gm | A7 | Dm:2 F7:2", align='end',
            mels=[dict(inst='pizz', spec=comic_mel, vel=.82, double=[('bassoon', -12, .55)])])
    A.bass(comic, t1, 'bouncy', vel=.7)
    A.comp(comic, t1, 'offbeat', 'marimba', vel=.32, center=62)
    A.drums(comic, t1, 'comic', .58)
    A.stab(comic, ('pizz',), vel=.7, center=62, bass=False)


def c_s09(A, t0, t1, sec, cues):
    B, b = A.bar, A.b
    sw = 2 / 3
    mel = ("D5:.5 C#5:.5 D5:.5 F5:.5 G5:1 r:1 | F5:.5 E5:.5 D5:.5 B4:.5 D5:1 r:1 | Eb5:.5 D5:.5 Eb5:.5 G5:.5 Bb5:1 r:1 | "
           "A5:.5 Ab5:.5 G5:.5 F5:.5 Eb5:1 C5:1 | D5:.5 C#5:.5 D5:.5 F5:.5 G5:.5 F5:.5 D5:1 | Ab5:1 G5:.5 F5:.5 D5:1 r:1 | "
           "G5:.5 F#5:.5 G5:.5 Bb5:.5 C6:1 r:1 | Gb5:1 F5:.5 Eb5:.5 C5:1 r:1 | Eb5:.5 G5:.5 Bb5:1 A5:.5 F5:.5 Eb5:1 | "
           "D5:.5 E5:.5 G5:1 C#5:.5 E5:.5 A4:1")
    A.place(t0, t1, "Bb6 | G7 | Cm7 | F7 | Bb6 | Bb7 | Eb6 | Ebm6 | Cm7 F7 | Em7b5 A7",
            mels=[dict(inst='vibes', spec=mel, vel=.72, swing=sw)])
    A.bass(t0, t1, 'walk', vel=.72, inst='upright', lo=36)
    A.comp(t0, t1, 'charleston', 'pizz', vel=.32, center=62, swing=sw)
    A.drums(t0, t1, 'swing', .55)
    # sly answers in the melody's rests (the other players' offers)
    for i in (0, 1, 2, 5, 6, 7):
        t = t0 + i * B + 3 * b
        if t >= t1:
            continue
        lad = ladder(A.chord_at(t), 62)
        A.note('pizz', t, .4, lad[2], .42)
        A.note('pizz', t + sw * b, .4, lad[1], .36)


def c_s10(A, t0, t1, sec, cues):
    mel = (RACCOON[0] + ' | ' + RACCOON[1] + ' | ' + RACCOON[2] + ' | ' + RACCOON[3] + ' | ' +
           "D4:.5 r:.5 F4:.5 r:.5 A4:.5 D5:.5 F5:.5 r:.5 | F5:.5 D5:.5 Bb4:.5 D5:.5 E5:.5 G5:.5 Bb5:.5 C6:.5")
    A.place(t0, t1, "Dm | Dm | Gm | A7 | Dm | Bb C7",
            mels=[dict(inst='pizz', spec=mel, vel=.9, stacc=.4, double=[('bassoon', -12, .6), ('marimba', 12, .22)])])
    A.bass(t0, t1, 'tiptoe', vel=.68)
    A.comp(t0, t1, 'sustain', 'pad', vel=.34, center=52)
    A.comp(t0, t1, 'stabs24', 'pizzlow', vel=.3, center=57)
    A.drums(t0, t1, 'sneaky', .55)
    A.drums(t1 - A.bar, t1, 'soft', .4, ramp=(.6, 1.3))


def c_s11(A, t0, t1, sec, cues):
    B, b = A.bar, A.b
    sid = sec['id']
    tA, tB = t0 + 3 * B, t0 + 5 * B
    c = cue_time(cues, sid, ('sad',), tA - 2, tA + 2)
    if c is not None:
        tA = A.snap(c)
    c = cue_time(cues, sid, ('cheer',), tB - 2, tB + 2)
    if c is not None:
        tB = max(tA + 2 * b + 1.0, A.snap(c))
    scr = cue_time(cues, sid, ('scratch',), tA + 0.5, tB)
    scr = A.snap(scr, b / 4) if scr is not None else tB - 0.5
    scr = min(max(scr, tA + 1.0), tB - 0.25)
    party = min(tA + B, scr - b)
    tEnd = min(t1 - B, tB + 2 * B) if t1 - tB >= 3 * B else t1
    A.marks.update(outcomeA=tA, scratch=scr, outcomeB=tB)
    for tt, s in ((t0, 'build'), (tA, 'deflate'), (party, 'party'), (tB, 'triumph')):
        A.labels.append((tt, s))
    # --- build on a C pedal, ending on C7 right before outcome A
    build = ("C5:.5 F5:.5 A5:.5 G5:.5 F5:.5 A5:.5 C6:.5 Bb5:.5 | D5:.5 G5:.5 Bb5:.5 A5:.5 F5:.5 Bb5:.5 D6:.5 C6:.5 | "
             "F5:1 G5:1 E5:.5 G5:.5 Bb5:.5 C6:.5")
    A.place(t0, tA, "F/C | Gm/C Bb/C | C7sus4 C7", align='end',
            mels=[dict(inst='marimba', spec=build, vel=.72, ramp=(.8, 1.15))])
    A.bass(t0, tA, 'pulse8', vel=.65, ramp=(.8, 1.2))
    A.comp(t0, tA, 'offbeat', 'pizz', vel=.42, center=63, ramp=(.8, 1.2))
    A.comp(t0, tA, 'sustain', 'pad', vel=.25, center=62)
    A.drums(t0, tA, 'build', .5, ramp=(.7, 1.2))
    if not has_cue(cues, sid, 'drumroll'):
        A.roll(max(t0, tA - B), tA, .55)
    A.swell(tA - 1.5, tA, .4)
    # --- outcome A: deflated wah (lighter if the scene already plays the 'sad' sfx)
    A.place(tA, scr, "Gm")
    if has_cue(cues, sid, 'sad'):
        A.place(tA, party, mels=[dict(inst='vibes', spec="Bb4:1 A4:1 Ab4:1 G4:1", vel=.45)])
    else:
        seq = [(0, 1, 58), (1, 1, 57), (2, 1, 56), (3, 1.6, 55)]
        for (o, ln, m) in seq:
            t = tA + o * b
            if t < party - 1e-6:
                last = o == 3
                A.note('wah', t, min(ln * b, party - t), m, .8, tight=True, sag=(-45 if last else 0), vib=last)
                A.note('pizzlow', t, .3, m - 12, .55, tight=True)
    A.comp(tA, party, 'sustain', 'pad', vel=.3, center=55)
    A.note('kick', tA, .3, 0, .5, tight=True)
    # --- raccoons party (G minor raccoon motif), cut by the record scratch
    A.place(party, scr, mels=[dict(inst='pizz', spec=RACCOON[0], vel=.85, tr=5, double=[('bassoon', -12, .5)])])
    A.bass(party, scr, 'bouncy', vel=.7)
    A.comp(party, scr, 'offbeat', 'marimba', vel=.35, center=62)
    A.drums(party, scr, 'comic', .6)
    A.post.append(('scratchcut', scr, tB, max(t0, party - 0.6)))
    A.gaps.append((scr + 0.15, tB))
    # --- outcome B: triumph in F, then a D7 pivot to the G major finale
    fan = "F5:.5 A5:.5 C6:1 A5:.5 C6:.5 F6:1 | D6:.5 C6:.5 Bb5:1 G5:.5 A5:.5 Bb5:.5 C6:.5"
    A.place(tB, tEnd, "F | Bb C", mels=[dict(inst='marimba', spec=fan, vel=.9, double=[('glock', 0, .28), ('horn', -12, .4)])])
    A.stab(tB, ('pizz', 'vibes'), vel=.9, center=65)
    A.splash(tB, .5)
    A.bass(tB, tEnd, 'bouncy', vel=.8)
    A.comp(tB, tEnd, 'offbeat', 'pizz', vel=.5, center=65)
    A.comp(tB, tEnd, 'sustain', 'pad', vel=.28, center=62)
    A.drums(tB, tEnd, 'groove', .62)
    if tEnd < t1 - 1e-6:
        A.place(tEnd, t1, "D7", mels=[dict(inst='marimba', spec="D6:.5 C6:.5 A5:.5 F#5:.5 E5:.5 D5:.5 C5:.5 A4:.5",
                                              vel=.7, ramp=(1.0, .8), double=[('pizz', 0, .5)])])
        A.bass(tEnd, t1, 'half', vel=.6)
        A.comp(tEnd, t1, 'sustain', 'vibes', vel=.35, center=64)
        A.drums(tEnd, t1, 'soft', .45)
        A.swell(t1 - 1.5, t1, .4)


def c_s12(A, t0, t1, sec, cues):
    B, b = A.bar, A.b
    button = t1 - b
    c = cue_time(cues, sec['id'], ('clang',), t1 - 2.0, t1 - 0.05)
    if c is not None:
        button = A.snap(c, b / 2)
    A.marks['button'] = button
    A.labels.append((button, 'button'))
    end_bar = A.bar_floor(button)
    tr = 2
    # bar 1: the winner lifts the trophy (theme in G)
    b1 = min(t0 + B, end_bar)
    A.place(t0, b1, "F", tr=tr, mels=[dict(inst='marimba', spec=THEME.split('|')[0], vel=.9, double=[('glock', 0, .25)])])
    A.stab(t0, ('pizz', 'vibes'), vel=.8, center=66)
    A.splash(t0, .4)
    A.bass(t0, b1, 'bouncy', vel=.8)
    A.comp(t0, b1, 'offbeat', 'pizz', vel=.45, center=66)
    A.drums(t0, b1, 'light', .6)
    # bars 2-3: the raccoon swipes it (sneaky motif in E minor) and dives into the bin
    b3 = min(t0 + 3 * B, end_bar)
    A.place(b1, b3, "Em | B7", mels=[dict(inst='pizz', spec=RACCOON[0] + ' | ' + RACCOON[3], vel=.82, tr=2,
                                            double=[('bassoon', -12, .55)])])
    A.bass(b1, b3, 'tiptoe', vel=.66)
    A.drums(b1, b3, 'sneaky', .5)
    A.comp(b1, b3, 'sustain', 'pad', vel=.32, center=54)
    # end card: the theme's answer phrase in G, then the button
    A.place(b3, end_bar, PROG_B, tr=tr, align='end',
            mels=[dict(inst='marimba', spec=THEME_B, vel=.88, double=[('glock', 0, .22)])])
    A.bass(b3, end_bar, 'bouncy', vel=.78)
    A.comp(b3, end_bar, 'offbeat', 'pizz', vel=.48, center=66)
    A.comp(b3, end_bar, 'sustain', 'pad', vel=.25, center=62)
    A.drums(b3, end_bar, 'light', .6)
    A.splash(b3, .3)
    hold = max(end_bar + b, button - b)
    A.place(end_bar, t1, "G")
    A.note('marimba', end_bar, hold - end_bar, 79, .85, tight=True)
    A.note('bass', end_bar, hold - end_bar, 43, .7, tight=True)
    for m in voicing(parse_chord('G'), 67, 3):
        A.note('vibes', end_bar, hold - end_bar, m, .45, tight=True)
    A.place(end_bar, hold, mels=[dict(inst='glock', spec="B5:.25 D6:.25 G6:.25 B6:.25 D7:1", vel=.3)])
    A.drums(end_bar, hold, 'soft', .45)
    A.note('pizz', button - b / 2, .12, 74, .6, tight=True)
    A.note('marimba', button - b / 2, .12, 74, .55, tight=True)
    A.note('pizz', button - b / 4, .12, 78, .65, tight=True)
    A.note('marimba', button - b / 4, .12, 78, .6, tight=True)
    A.stab(button, ('pizz', 'marimba', 'vibes'), vel=.9, center=67, beats=0.45, bass=True, kick=True)
    A.note('glock', button, .3, 91, .45, tight=True)
    A.note('pizzlow', button, .2, 43, .9, tight=True)
    A.splash(button, .35)


def c_generic(A, t0, t1, sec, cues):
    A.place(t0, t1, "F | Dm | Bb | C7")
    A.bass(t0, t1, 'bouncy', vel=.65)
    A.comp(t0, t1, 'ostinato', 'marimba', vel=.4, center=62)
    A.drums(t0, t1, 'light', .5)


COMPOSERS = {'s01': c_s01, 's02': c_s02, 's03': c_s03, 's04': c_s04, 's05': c_s05, 's06': c_s06,
             's07': c_s07, 's08': c_s08, 's09': c_s09, 's10': c_s10, 's11': c_s11, 's12': c_s12}
MUSIC_ALIASES = {'intro': 's01', 'history': 's02', 'board': 's03', 'roles': 's04', 'rounds': 's05',
                 'queue': 's06', 'pass': 's07', 'spread': 's08', 'main': 's09', 'actions': 's10',
                 'endgame': 's11', 'finale': 's12'}


def compose(tl, cues):
    A = Arr(tl.get('bpm', 120), tl['duration'])
    for sec in tl['scenes']:
        t0, t1 = float(sec['start']), float(sec['start']) + float(sec['dur'])
        key = sec['id'][:3]
        fn = COMPOSERS.get(key) or COMPOSERS.get(MUSIC_ALIASES.get(sec.get('music', ''), ''))
        if fn is None:
            warn(f"no music mood for scene {sec['id']!r}: using a generic groove")
            fn = c_generic
        if abs(t0 / A.bar - round(t0 / A.bar)) > 1e-6:
            warn(f"scene {sec['id']} starts at {t0} s, not on a bar line")
        fn(A, t0, t1, sec, cues)
    A.notes = [n for n in A.notes if n.t < A.dur]
    A.notes.sort(key=lambda n: n.t)
    return A


# ============================================================================ instruments

def syn_pluck(m, dur, vel, var, kind='pizz'):
    """Karplus-Strong string: loop delay N + lowpass (0.5, 0.5) + first-order allpass tuning,
    run as one IIR filter with scipy.signal.lfilter."""
    f = mtof(m)
    low = kind != 'pizz'
    t60 = float(np.clip(0.95 * (220 / f) ** 0.45, 0.22, 1.5)) * (1.7 if low else 1.0)
    ring = min(t60, 0.3)
    n = int((dur + ring) * SR) + 64
    P = SR / f
    N = int(math.floor(P - 1.0))
    d = P - 0.5 - N
    c = (1 - d) / (1 + d)
    g = 10 ** (-3.0 / (t60 * f))
    r = rng_of('pluck', kind, m, var)
    L = N + 1
    exc = r.uniform(-1, 1, L)
    pole = float(np.clip(0.62 - 0.4 * vel + (0.18 if low else 0.0), 0.05, 0.93))
    exc = signal.lfilter([1 - pole], [1, -pole], exc)
    k = max(1, int(L * 0.18))
    exc[k:] -= 0.55 * exc[:-k].copy()
    exc -= exc.mean()
    x = np.zeros(n)
    x[:L] = exc
    a = np.zeros(N + 3)
    a[0], a[1] = 1.0, c
    a[N] -= 0.5 * g * c
    a[N + 1] -= 0.5 * g * (1 + c)
    a[N + 2] -= 0.5 * g
    y = signal.lfilter([1.0, c], a, x)
    y = lp(y, min(7500.0, f * (8 if low else 14)))
    y *= release_at(n, dur, 0.05)
    y = norm_peak(y)
    if kind == 'upright':
        t = tvec(n)
        sub = np.sin(TWO_PI * f * t) * np.exp(-t / 0.5) * attack_env(n, 0.004) * release_at(n, dur, 0.05)
        y = norm_peak(y * 0.8 + sub * 0.6)
    return edge_fade(y, 0.0005, 0.003)


def syn_marimba(m, dur, vel, var):
    f = mtof(m)
    tau = float(np.clip(0.5 * (262 / f) ** 0.6, 0.1, 0.9))
    n = int(min(4.6 * tau, max(dur, 0.12) + 3 * tau) * SR)
    r = rng_of('mar', m, var)
    y = modal(n, [f, 3.98 * f, 9.9 * f], [1.0, 0.18 + 0.22 * vel, 0.04 + 0.06 * vel],
              [tau, tau * 0.2, tau * 0.07], r, attack=0.0012)
    t = tvec(n)
    click = lp(r.standard_normal(n) * np.exp(-t / 0.0012), 2500) * 0.04 * vel
    y = y + click
    y *= release_at(n, max(dur, 0.12) + 2.5 * tau, 0.05)
    return norm_peak(lp(y, 9000))


def syn_vibes(m, dur, vel, var):
    f = mtof(m)
    tau = float(np.clip(2.2 * (262 / f) ** 0.5, 0.6, 3.0))
    n = int(min(dur + 0.3, 4 * tau) * SR)
    r = rng_of('vib', m, var)
    y = modal(n, [f, 4.0 * f, 10.0 * f], [1.0, 0.06 + 0.08 * vel, 0.015], [tau, tau * 0.15, tau * 0.05], r, attack=0.003)
    t = tvec(n)
    y *= 1 - 0.26 * (0.5 - 0.5 * np.cos(TWO_PI * 5.3 * t + var))
    y *= release_at(n, dur, 0.18)
    return norm_peak(y)


def syn_glock(m, dur, vel, var):
    f = mtof(m)
    tau = float(np.clip(1.0 * (1047 / f) ** 0.5, 0.35, 1.2))
    n = int(3.0 * tau * SR)
    r = rng_of('glk', m, var)
    y = modal(n, [f, 2.76 * f, 5.40 * f, 8.93 * f], [1.0, 0.2, 0.06, 0.02],
              [tau, tau * 0.3, tau * 0.12, tau * 0.06], r, attack=0.0006)
    y = y * (np.abs(y).max() > 0)
    y = lp(y, 9000)
    return norm_peak(y)


def syn_celesta(m, dur, vel, var):
    f = mtof(m)
    tau = float(np.clip(0.9 * (523 / f) ** 0.5, 0.3, 1.4))
    n = int(min(dur + 0.5, 3.5 * tau) * SR)
    r = rng_of('cel', m, var)
    y = modal(n, [f, 2 * f, 3 * f, 4.2 * f], [1.0, 0.2, 0.05, 0.03], [tau, tau * 0.4, tau * 0.2, tau * 0.1], r, attack=0.0015)
    y *= release_at(n, dur + 0.25, 0.2)
    return norm_peak(lp(y, 8000))


def syn_bass(m, dur, vel, var):
    f = mtof(m)
    n = int((dur + 0.09) * SR)
    t = tvec(n)
    fr = f * (1 + 0.025 * np.exp(-t / 0.015))
    ph = TWO_PI * np.cumsum(fr) / SR
    y = (np.sin(ph) + (0.2 + 0.12 * vel) * np.sin(2 * ph) + 0.1 * np.sin(3 * ph + 0.3)
         + 0.035 * np.sin(4 * ph) + 0.02 * np.sin(5 * ph))
    env = (1 - np.exp(-t / 0.004)) * (0.6 + 0.4 * np.exp(-t / 0.18)) * np.exp(-t / 2.5)
    y *= env * release_at(n, dur, 0.07)
    return norm_peak(y)


def harm_tone(f0, amps_fn, fmax, rng):
    """Additive harmonic tone. f0: per-sample Hz array; amps_fn(k) -> scalar or array."""
    ph = TWO_PI * np.cumsum(f0) / SR
    K = max(1, int(fmax // float(np.max(f0))))
    y = np.zeros(len(f0))
    for k in range(1, K + 1):
        y += amps_fn(k) * np.sin(k * ph + rng.uniform(0, TWO_PI))
    return y


def table_tone(f, n, amps_fn, fmax, rng, size=4096):
    """Constant-spectrum harmonic tone via a single-cycle wavetable (cheap for long notes)."""
    ph = np.arange(size) / size * TWO_PI
    tab = np.zeros(size)
    for k in range(1, max(1, int(fmax // f)) + 1):
        tab += amps_fn(k) * np.sin(k * ph + rng.uniform(0, TWO_PI))
    tab = np.append(tab, tab[0])
    idx = (np.arange(n) * (f * size / SR)) % size
    return np.interp(idx, np.arange(size + 1), tab)


def syn_brass(m, dur, vel, var, kind='horn', sag=0, vib=False):
    f = mtof(m)
    att = {'horn': 0.045, 'tuba': 0.03, 'wah': 0.03}[kind]
    rel = 0.09
    n = int((dur + rel + 0.02) * SR)
    t = tvec(n)
    env = np.minimum(1.0, t / att) ** 1.5 * (0.85 + 0.15 * np.exp(-t / 0.25)) * release_at(n, dur, rel)
    cents = -28 * np.exp(-t / 0.04)
    if vib or kind == 'horn':
        cents = cents + (14 if vib else 6) * np.sin(TWO_PI * 5.2 * t) * np.clip((t - 0.2) / 0.3, 0, 1)
    if sag:
        cents = cents + sag * np.clip((t - dur * 0.35) / (dur * 0.65), 0, 1) ** 1.5
    f0 = f * 2 ** (cents / 1200)
    r = rng_of('brass', kind, m, var)
    if kind == 'wah':
        # muted trumpet with a closing/opening mute: brightness exponent follows a wah curve
        u = np.clip(t / max(dur, 0.05), 0, 1)
        wah = np.sin(np.pi * np.clip(u * 1.6, 0, 1)) ** 0.8
        p = 3.0 - 1.6 * wah * env
        y = harm_tone(f0, lambda k: np.exp(-p * math.log(k)) / (1 + (k * f / 2600) ** 2), 5000, r)
    else:
        bright = env * (0.55 + 0.45 * vel)
        p = (2.7 if kind == 'horn' else 2.9) - 1.1 * bright
        fmax = 3500 if kind == 'horn' else 1500
        y = harm_tone(f0, lambda k: np.exp(-p * math.log(k)) / (1 + (k * f / 1800) ** 2), fmax, r)
    y *= env
    return norm_peak(y)


def syn_reed(m, dur, vel, var, kind='accordion'):
    f = mtof(m)
    n = int((dur + 0.08) * SR)
    t = tvec(n)
    r = rng_of('reed', kind, m, var)
    if kind == 'accordion':
        env = attack_env(n, 0.03) * (0.9 + 0.1 * np.sin(TWO_PI * 0.7 * t)) * release_at(n, dur, 0.06)
        amp = lambda k: k ** -0.8 * (1 + 1.2 * math.exp(-((k * f - 1400) / 800) ** 2))
        y = sum(table_tone(f * 2 ** (c / 1200), n, amp, 4000, r) for c in (-7, 7))
    else:  # bassoon, staccato and nasal
        env = attack_env(n, 0.012) * (0.75 + 0.25 * np.exp(-t / 0.12)) * release_at(n, dur, 0.04)
        amp = lambda k: 0.25 / k + math.exp(-((k * f - 480) / 320) ** 2)
        y = table_tone(f, n, amp, 3200, r)
    return norm_peak(lp(y * env, 5000))


def syn_pad(m, dur, vel, var):
    f = mtof(m)
    n = int((dur + 0.6) * SR)
    t = tvec(n)
    r = rng_of('pad', m, var)
    env = attack_env(n, min(0.4, dur * 0.5)) * release_at(n, dur, 0.55)
    amp = lambda k: math.exp(-k * f / 1300) / k
    C = 0.7 * table_tone(f, n, amp, 3000, r)
    L = table_tone(f * 2 ** (-6 / 1200), n, amp, 3000, r) + C
    R = table_tone(f * 2 ** (6 / 1200), n, amp, 3000, r) + C
    y = np.stack([L, R], axis=1) * env[:, None] * (1 + 0.08 * np.sin(TWO_PI * 0.3 * t + var))[:, None]
    return norm_peak(y)


def syn_kick(m, dur, vel, var):
    n = int(0.4 * SR)
    t = tvec(n)
    f = 46 + 75 * np.exp(-t / 0.03)
    y = np.sin(TWO_PI * np.cumsum(f) / SR) * np.exp(-t / 0.14)
    r = rng_of('kick', var)
    y += lp(r.standard_normal(n) * np.exp(-t / 0.002), 3000) * 0.08
    return norm_peak(y * attack_env(n, 0.0015))


def syn_shaker(m, dur, vel, var):
    n = int(0.12 * SR)
    t = tvec(n)
    r = rng_of('shaker', var)
    y = lp(bp(r.standard_normal(n), 2400, 7000), 8500, 4) * np.minimum(1, t / 0.007) * np.exp(-t / 0.035)
    return norm_peak(y)


def syn_hat(m, dur, vel, var):
    n = int(0.1 * SR)
    t = tvec(n)
    r = rng_of('hat', var)
    y = lp(bp(r.standard_normal(n), 4000, 9000), 9500, 4) * np.exp(-t / 0.025) * attack_env(n, 0.001)
    return norm_peak(y)


def syn_snare(m, dur, vel, var):
    """Brushed snare slap: soft noise with a little drum tone."""
    n = int(0.25 * SR)
    t = tvec(n)
    r = rng_of('snare', var)
    y = lp(bp(r.standard_normal(n), 900, 5000), 6000, 4) * np.minimum(1, t / 0.004) * np.exp(-t / 0.07)
    y += 0.35 * np.sin(TWO_PI * 196 * t) * np.exp(-t / 0.03)
    return norm_peak(y)


def syn_brush(m, dur, vel, var):
    n = int(0.45 * SR)
    t = tvec(n)
    r = rng_of('brush', var)
    y = bp(r.standard_normal(n), 1500, 5000) * np.sin(np.pi * np.clip(t / 0.42, 0, 1)) ** 2
    return norm_peak(y)


def syn_wood(m, dur, vel, var):
    f = 1040.0 if m == 1 else 760.0
    n = int(0.12 * SR)
    r = rng_of('wood', m, var)
    y = modal(n, [f, 2.3 * f, 3.9 * f], [1.0, 0.3, 0.1], [0.04, 0.018, 0.01], r, attack=0.0005)
    t = tvec(n)
    y += lp(r.standard_normal(n) * np.exp(-t / 0.001), 4000) * 0.15
    return norm_peak(y)


def syn_roll(m, dur, vel, var):
    n = int((dur + 0.3) * SR)
    y = np.zeros(n)
    r = rng_of('roll', var)
    strokes = [syn_snare(0, 0, 0, v) for v in range(4)]
    t, i = 0.0, 0
    while t < dur:
        u = t / dur
        a = (0.12 + 0.88 * u ** 1.6)
        s = strokes[i % 4] * a * (0.85 + 0.15 * r.random())
        j = int(t * SR)
        k = min(n - j, len(s))
        y[j:j + k] += s[:k]
        t += 1 / 26.0 + r.normal(0, 0.002)
        i += 1
    return norm_peak(lp(y, 7000))


def syn_swell(m, dur, vel, var):
    n = int((dur + 0.25) * SR)
    t = tvec(n)
    r = rng_of('swell', var)
    env = np.clip(t / max(dur, 0.05), 0, 1) ** 2.5 * release_at(n, dur, 0.2)
    L = bp(r.standard_normal(n), 3000, 9000) + 0.5 * bp(r.standard_normal(n), 1000, 3000)
    R = bp(r.standard_normal(n), 3000, 9000) + 0.5 * bp(r.standard_normal(n), 1000, 3000)
    return norm_peak(np.stack([L * env, R * env], axis=1))


def syn_splash(m, dur, vel, var):
    n = int(1.4 * SR)
    t = tvec(n)
    r = rng_of('splash', var)
    y = bp(r.standard_normal(n), 3000, 9000) * np.exp(-t / 0.3) * attack_env(n, 0.002)
    y += 0.3 * modal(n, [3150, 4420, 5230], [1, .7, .5], [.25, .2, .15], r)
    return norm_peak(y)


# name: (synth, gain dB, pan, reverb send)
INST = {
    'pizz': (lambda m, d, v, r, **k: syn_pluck(m, d, v, r, 'pizz'), -5, -0.38, 0.22),
    'pizzlow': (lambda m, d, v, r, **k: syn_pluck(m, d, v, r, 'low'), -4, -0.12, 0.15),
    'upright': (lambda m, d, v, r, **k: syn_pluck(m, d, v, r, 'upright'), -7, 0.0, 0.06),
    'marimba': (lambda m, d, v, r, **k: syn_marimba(m, d, v, r), -6, 0.25, 0.24),
    'vibes': (lambda m, d, v, r, **k: syn_vibes(m, d, v, r), -9, -0.3, 0.34),
    'glock': (lambda m, d, v, r, **k: syn_glock(m, d, v, r), -13, 0.45, 0.34),
    'celesta': (lambda m, d, v, r, **k: syn_celesta(m, d, v, r), -9, 0.3, 0.38),
    'bass': (lambda m, d, v, r, **k: syn_bass(m, d, v, r), -10, 0.0, 0.03),
    'tuba': (lambda m, d, v, r, **k: syn_brass(m, d, v, r, 'tuba'), -10, -0.05, 0.1),
    'horn': (lambda m, d, v, r, **k: syn_brass(m, d, v, r, 'horn'), -11, -0.2, 0.3),
    'wah': (lambda m, d, v, r, sag=0, vib=False, **k: syn_brass(m, d, v, r, 'wah', sag, vib), -9, 0.08, 0.22),
    'reed': (lambda m, d, v, r, **k: syn_reed(m, d, v, r, 'accordion'), -13, 0.2, 0.22),
    'bassoon': (lambda m, d, v, r, **k: syn_reed(m, d, v, r, 'bassoon'), -12, -0.1, 0.15),
    'pad': (lambda m, d, v, r, **k: syn_pad(m, d, v, r), -19, 0.0, 0.4),
    'kick': (lambda m, d, v, r, **k: syn_kick(m, d, v, r), -11, 0.0, 0.03),
    'shaker': (lambda m, d, v, r, **k: syn_shaker(m, d, v, r), -15, 0.5, 0.1),
    'hat': (lambda m, d, v, r, **k: syn_hat(m, d, v, r), -15, 0.3, 0.1),
    'snare': (lambda m, d, v, r, **k: syn_snare(m, d, v, r), -14, -0.1, 0.16),
    'brush': (lambda m, d, v, r, **k: syn_brush(m, d, v, r), -18, 0.2, 0.1),
    'wood': (lambda m, d, v, r, **k: syn_wood(m, d, v, r), -14, -0.45, 0.15),
    'roll': (lambda m, d, v, r, **k: syn_roll(m, d, v, r), -14, -0.05, 0.15),
    'swell': (lambda m, d, v, r, **k: syn_swell(m, d, v, r), -20, 0.0, 0.4),
    'splash': (lambda m, d, v, r, **k: syn_splash(m, d, v, r), -19, 0.25, 0.3),
}
NO_CACHE = {'roll', 'swell'}


QUANT_DUR = {'marimba': 0.25, 'glock': 0.25, 'celesta': 0.125, 'splash': 1.0, 'kick': 1.0, 'shaker': 1.0,
             'hat': 1.0, 'snare': 1.0, 'brush': 1.0, 'wood': 1.0}
USES_VAR = {'pizz', 'pizzlow', 'upright', 'shaker', 'hat', 'snare', 'kick', 'vibes', 'pad', 'roll', 'swell', 'splash'}


def render_score(notes, n_total):
    """Synthesise every note, one instrument at a time, into a dry bus and a reverb-send bus."""
    tail = int(4 * SR)
    dry = np.zeros((n_total + tail, 2))
    send = np.zeros((n_total + tail, 2))
    stem_rms = {}
    by_inst = {}
    for nt in notes:
        by_inst.setdefault(nt.inst, []).append(nt)
    for inst in sorted(by_inst):
        spec = INST.get(inst)
        if spec is None:
            warn('unknown instrument ' + inst)
            continue
        fn, gdb, pan0, rsend = spec
        lst = by_inst[inst]
        a = max(0, int(min(n.t for n in lst) * SR) - 16)
        e = min(n_total + tail, int(max(n.t + n.dur for n in lst) * SR) + tail)
        buf = np.zeros((e - a, 2))
        cache = {}
        q = QUANT_DUR.get(inst)
        for nt in lst:
            d = max(q, round(nt.dur / q) * q) if q else round(nt.dur, 2)
            var = nt.var if inst in USES_VAR else 0
            key = (nt.midi, d, round(nt.vel, 1), var, tuple(sorted(nt.kw.items())))
            y = cache.get(key)
            if y is None:
                y = fn(nt.midi, d, round(nt.vel, 1), var, **nt.kw)
                if inst not in NO_CACHE:
                    cache[key] = y
            amp = nt.vel ** 1.4 * undb(gdb)
            i0 = int(round(nt.t * SR)) - a
            k = min(len(y), len(buf) - i0)
            if k <= 0:
                continue
            if y.ndim == 1:
                p = pan0 if nt.pan is None else nt.pan
                if inst in ('pizz', 'marimba', 'glock', 'celesta') and nt.pan is None:
                    p += ((nt.midi % 5) - 2) * 0.05   # tiny per-pitch spread
                th = (np.clip(p, -1, 1) + 1) * np.pi / 4
                buf[i0:i0 + k, 0] += y[:k] * (math.cos(th) * amp)
                buf[i0:i0 + k, 1] += y[:k] * (math.sin(th) * amp)
            else:
                buf[i0:i0 + k] += y[:k] * amp
        dry[a:e] += buf
        send[a:e] += buf * rsend
        stem_rms[inst] = round(dbv(np.sqrt((buf[:max(0, min(e, n_total) - a)] ** 2).sum() / (2 * n_total))), 1)
    return dry, send, stem_rms


def make_ir(seconds=2.2, rt=(1.7, 1.35, 0.6), seed=7):
    """Synthetic stereo room: early reflections + band-wise exponentially decaying noise."""
    n = int(seconds * SR)
    t = tvec(n)
    r = rng_of('ir', seed)
    ir = np.zeros((n, 2))
    pre = int(0.018 * SR)
    for ch in range(2):
        w = r.standard_normal(n)
        lo = lp(w, 400)
        hi = hp(w, 4000)
        mid = w - lo - hi
        tail = (lo * np.exp(-6.91 * t / rt[0]) + mid * np.exp(-6.91 * t / rt[1]) + hi * np.exp(-6.91 * t / rt[2]))
        tail *= 1 - np.exp(-t / 0.03)
        ir[pre:, ch] = tail[:n - pre] * 0.5
        for _ in range(9):
            d = int(r.uniform(0.004, 0.045) * SR)
            ir[d, ch] += r.uniform(0.25, 0.7) * r.choice([-1, 1])
    ir /= np.sqrt((ir ** 2).sum(axis=0, keepdims=True))
    return ir


def reverb(send, ir):
    x = hp(lp(send.mean(axis=1), 7000), 180)
    wet = np.stack([signal.oaconvolve(x, ir[:, c])[:len(send)] for c in range(2)], axis=1)
    return wet


# gentle per-section level trims (dB) on the music bed, crossfaded over 0.6 s at scene changes
SECTION_TRIM_DB = {'s01': 0.0, 's02': 1.0, 's03': -1.0, 's04': 0.0, 's05': 0.5, 's06': -1.0, 's07': 0.0,
                   's08': 0.0, 's09': 0.0, 's10': 1.5, 's11': 0.0, 's12': 0.0}


def section_trim(tl, n_total):
    ctl = 100
    tt = np.arange(int(n_total / SR * ctl) + 2) / ctl
    d = np.zeros(len(tt))
    for sc in tl['scenes']:
        d[(tt >= sc['start']) & (tt < sc['start'] + sc['dur'])] = SECTION_TRIM_DB.get(sc['id'][:3], 0.0)
    d = uniform_filter1d(d, size=int(0.6 * ctl), mode='nearest')
    return undb(np.interp(np.arange(n_total) / SR, tt, d))


def harmony_check(A):
    """Melody notes that start on a beat, last >= 1 beat and are not chord tones (should be rare)."""
    lead = {'marimba', 'vibes', 'celesta', 'reed', 'horn', 'pizz', 'wah'}
    out, n = [], 0
    for nt in A.notes:
        if nt.inst not in lead or nt.dur < A.b * 0.95:
            continue
        on_beat = abs(nt.t / A.b - round(nt.t / A.b)) < 0.03
        if not on_beat:
            continue
        n += 1
        ch = A.chord_at(nt.t + 0.01)
        if nt.midi % 12 not in ch.pcs:
            out.append((round(nt.t, 2), nt.inst, PC_NAMES[nt.midi % 12] + str(nt.midi // 12 - 1), ch.name))
    return dict(checked=n, non_chord_tones=len(out), list=out)


def score_hash(A, n_total):
    h = zlib.crc32(open(os.path.abspath(__file__), 'rb').read())
    items = [(n.inst, round(n.t, 6), round(n.dur, 6), n.midi, round(n.vel, 6), n.var, sorted(n.kw.items())) for n in A.notes]
    h = zlib.crc32(repr((items, A.post, n_total)).encode(), h)
    return f'{h:08x}'


def render_music(A, n_total, cache_dir, use_cache=True):
    """Music bed (dry + reverb, EQ, post effects) as float32; cached by a hash of the score."""
    key = score_hash(A, n_total)
    path = os.path.join(cache_dir, f'music_{key}.npy')
    meta = os.path.join(cache_dir, f'music_{key}.json')
    if use_cache and os.path.exists(path) and os.path.exists(meta):
        return np.load(path).astype(np.float64), json.load(open(meta)), True
    dry, send, stem_rms = render_score(A.notes, n_total)
    wet = reverb(send, make_ir()) * 0.85
    stem_rms['_reverb_wet'] = round(rms_db(wet[:n_total]), 1)
    stem_rms['_dry_total'] = round(rms_db(dry[:n_total]), 1)
    music = dry + wet
    del dry, send, wet
    music = hp(music, 28)
    lpm = one_pole_lp(music, 7500)
    music = lpm + 0.89 * (music - lpm)          # gentle high shelf, about -1 dB above 8 kHz
    music = apply_post(music[:n_total].copy(), A)
    music = music.astype(np.float32)
    if use_cache:
        os.makedirs(cache_dir, exist_ok=True)
        for f in os.listdir(cache_dir):
            if f.startswith('music_'):
                os.remove(os.path.join(cache_dir, f))
        np.save(path, music)
        json.dump(stem_rms, open(meta, 'w'))
    return music.astype(np.float64), stem_rms, False


def apply_post(music, A):
    for fx in A.post:
        if fx[0] != 'scratchcut':
            continue
        ts, tb, src0 = fx[1], fx[2], fx[3]
        i0, i1 = int(ts * SR), int(tb * SR)
        if i1 - i0 < int(0.1 * SR):
            continue
        # tape stop: the next 0.18 s of audio slows to a halt
        L = int(0.18 * SR)
        speed = np.linspace(1, 0, L) ** 1.3
        pos = i0 + np.cumsum(speed)
        stop = np.stack([np.interp(pos, np.arange(len(music)), music[:, c]) for c in range(2)], axis=1)
        stop *= np.linspace(1, 0, L)[:, None] ** 0.7
        # rewind: the last second of the party reversed and squeezed into the gap
        a = i0 + L + int(0.03 * SR)
        e = i1 - int(0.015 * SR)
        src = music[int(src0 * SR):i0][::-1]
        out = np.zeros((i1 - i0, 2))
        out[:L] = stop
        if e - a > 200 and len(src) > 200:
            idx = np.linspace(0, len(src) - 1, e - a) ** 1.0
            rew = np.stack([np.interp(idx, np.arange(len(src)), src[:, c]) for c in range(2)], axis=1)
            rew = lp(rew, 3500)
            env = np.minimum(1, np.linspace(0, 1, e - a) / 0.5) * np.minimum(1, np.linspace(1, 0, e - a) / 0.15)
            out[a - i0:e - i0] = rew * env[:, None] * 0.35
        music[i0:i1] = out
    return music


# ============================================================================ sound effects

SFX_NAMES = ['rattle', 'pop', 'boing', 'clang', 'chitter', 'brush', 'paper', 'bite', 'whoosh', 'flip', 'slide',
             'deal', 'tock', 'ding', 'buzz', 'stamp', 'dice', 'poof', 'sparkle', 'drumroll', 'cheer', 'sad',
             'scratch', 'tick', 'thud', 'pencil', 'crumple', 'hop']


def _place(y, x, t, gain=1.0):
    i = int(t * SR)
    k = min(len(x), len(y) - i)
    if k > 0:
        y[i:i + k] += x[:k] * gain


def sfx_rattle(r):
    n = int(0.62 * SR)
    y = np.zeros((n, 2))
    times = np.array([0, .065, .14, .205, .29, .35, .44, .50]) + r.uniform(-.008, .008, 8)
    amps = [.9, .6, 1.0, .55, .8, .5, .65, .35]
    base = np.array([523, 1187, 1742, 2519, 3310])
    for t0, a in zip(np.clip(times, 0, None), amps):
        L = int(0.14 * SR)
        tt = tvec(L)
        s = modal(L, base * r.uniform(.97, 1.03), [1, .7, .5, .35, .2], [.07, .05, .04, .03, .022], r, 0.0003)
        s += 0.5 * lp(r.standard_normal(L) * np.exp(-tt / .003), 6000)
        s += 0.5 * np.sin(TWO_PI * 170 * tt) * np.exp(-tt / .03)
        _place(y, pan2(s, r.uniform(-.25, .25)), t0, a)
    return lp(y, 7000)


def sfx_pop(r):
    n = int(0.2 * SR)
    t = tvec(n)
    f = 330 + 800 * (1 - np.exp(-t / 0.012))
    y = np.sin(TWO_PI * np.cumsum(f) / SR) * np.exp(-t / 0.035) * attack_env(n, 0.001)
    y += lp(r.standard_normal(n) * np.exp(-t / 0.0015), 3000) * 0.4
    return pan2(y)


def sfx_boing(r):
    n = int(0.75 * SR)
    t = tvec(n)
    f = 165 * (1 + 0.4 * np.exp(-t / 0.04)) * (1 + 0.28 * np.exp(-t / 0.22) * np.sin(TWO_PI * 13 * t))
    ph = TWO_PI * np.cumsum(f) / SR
    y = np.sin(ph) + 0.35 * np.sin(2 * ph) * np.exp(-t / 0.15) + 0.15 * np.sin(3 * ph) * np.exp(-t / 0.08)
    y *= np.exp(-t / 0.22) * attack_env(n, 0.003)
    return pan2(lp(y, 4000))


def sfx_clang(r):
    n = int(1.4 * SR)
    t = tvec(n)
    modes = [247, 561, 893, 1302, 1748, 2311, 2957, 3620]
    amps = [1, .8, .7, .5, .45, .3, .2, .12]
    taus = [.9, .7, .55, .45, .35, .28, .2, .15]
    L = modal(n, modes, amps, taus, r) + modal(n, [m * 1.004 for m in modes], amps, taus, r)
    R = modal(n, [m * 0.998 for m in modes], amps, taus, r) + modal(n, [m * 1.006 for m in modes], amps, taus, r)
    hit = lp(r.standard_normal(n) * np.exp(-t / 0.006), 5000) * 1.2 + np.sin(TWO_PI * 90 * t) * np.exp(-t / 0.06) * 1.5
    y = np.stack([L + hit, R + hit], axis=1)
    return lp(y, 6000)


def sfx_chitter(r):
    n = int(0.62 * SR)
    y = np.zeros((n, 2))
    t0 = 0.0
    for i in range(9):
        L = int(r.uniform(.028, .042) * SR)
        tt = tvec(L)
        f0, f1 = r.uniform(1300, 1900), r.uniform(1700, 2500)
        if i % 3 == 2:
            f0, f1 = f1, f0
        f = f0 + (f1 - f0) * tt / tt[-1]
        s = np.sin(TWO_PI * np.cumsum(f) / SR + 2.0 * np.sin(TWO_PI * 90 * tt))
        win = np.abs(np.sin(np.pi * tt / tt[-1]))
        s *= (0.6 + 0.4 * np.sin(TWO_PI * 70 * tt)) * win ** 1.5
        s += 0.25 * bp(r.standard_normal(L), 2000, 4500) * win
        _place(y, pan2(s, r.uniform(-.15, .15)), t0, r.uniform(.6, 1.0))
        t0 += r.uniform(.052, .07)
    return lp(y, 6500)


def sfx_brush(r):
    n = int(0.45 * SR)
    t = tvec(n)
    x = r.standard_normal(n)
    fc = 1200 + 1400 * t / t[-1]
    y = svf(x, fc, 0.8)
    grain = 0.6 + 0.4 * np.abs(lp(r.standard_normal(n), 60)) / 0.3
    env = np.minimum(1, t / 0.06) * np.minimum(1, (t[-1] - t) / 0.14)
    y = lp(y * grain * env, 7000)
    p = np.linspace(-0.2, 0.2, n)
    return np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)], axis=1)


def grains(n, rate_fn, r, bands, dur_ms=(1, 6), amp=(.3, 1.0)):
    y = np.zeros(n)
    t = 0.0
    T = n / SR
    bursts = []
    for i in range(16):
        L = int(r.uniform(*dur_ms) / 1000 * SR) + 8
        lo, hi = bands[i % len(bands)]
        b = bp(r.standard_normal(L), lo, hi) * np.exp(-tvec(L) / (L / SR / 3))
        bursts.append(b)
    while True:
        rate = max(rate_fn(t), 1e-3)
        t += r.exponential(1 / rate)
        if t >= T - 0.01:
            break
        _place(y, bursts[int(r.integers(0, 16))], t, r.uniform(*amp))
    return y


def sfx_paper(r):
    n = int(0.5 * SR)
    t = tvec(n)
    env = np.sin(np.pi * t / t[-1]) ** 0.8
    y = grains(n, lambda u: 160 * math.sin(math.pi * min(u / 0.5, 1)) + 5, r, [(1500, 4000), (2500, 6000), (1000, 2500)])
    y += 0.25 * bp(r.standard_normal(n), 800, 4000) * env
    y = lp(y, 7500)
    return np.stack([y, np.roll(y, 40) * 0.9 + 0.1 * y], axis=1)


def sfx_bite(r):
    n = int(0.3 * SR)
    t = tvec(n)
    y = modal(n, [2500, 900], [1, .6], [.012, .02], r, 0.0003)
    crunch = grains(n, lambda u: 260 if 0.02 < u < 0.2 else 1, r, [(1000, 3000), (1800, 4500)], (2, 7))
    y += 0.9 * crunch + 0.8 * np.sin(TWO_PI * 150 * t) * np.exp(-t / 0.04)
    return pan2(lp(y, 6500))


def sfx_whoosh(r):
    n = int(0.6 * SR)
    t = tvec(n)
    u = t / t[-1]
    fc = 350 + 1500 * np.sin(np.pi * np.clip(u / 0.75, 0, 1)) ** 1.5 + 300 * u
    y = svf(r.standard_normal(n), fc, 1.1) + 0.5 * svf(r.standard_normal(n), fc * 1.8, 1.4)
    env = np.abs(np.sin(np.pi * u)) ** 1.6
    y = lp(y * env, 6000)
    p = -0.7 + 1.4 * u
    return np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)], axis=1)


def sfx_flip(r):
    n = int(0.15 * SR)
    t = tvec(n)
    fc = 900 + 2400 * np.clip(t / 0.08, 0, 1)
    y = svf(r.standard_normal(n), fc, 0.9) * np.minimum(1, t / 0.012) * np.exp(-np.maximum(0, t - 0.03) / 0.03)
    snap = np.zeros(n)
    snap[int(0.07 * SR)] = 1
    y += bp(snap, 2000, 5000) * 6 * np.exp(-np.maximum(0, t - 0.07) / 0.004)
    return pan2(lp(y, 7000), 0.1)


def sfx_slide(r):
    n = int(0.42 * SR)
    t = tvec(n)
    env = np.minimum(1, t / 0.05) * np.minimum(1, (0.36 - t).clip(0) / 0.08)
    flutter = 0.7 + 0.3 * np.sin(TWO_PI * 32 * t + r.uniform(0, 6))
    y = bp(r.standard_normal(n), 400, 2500) * env * flutter
    tap = modal(n, [700, 1600], [1, .4], [.015, .008], r)
    y += 0.8 * np.roll(tap, int(0.35 * SR)) * (t > 0.35)
    return pan2(lp(y, 6000), -0.1)


def sfx_deal(r):
    n = int(0.2 * SR)
    t = tvec(n)
    fc = 1500 + 2000 * np.clip(t / 0.06, 0, 1)
    y = svf(r.standard_normal(n), fc, 1.0) * np.minimum(1, t / 0.01) * np.exp(-t / 0.03)
    tap = modal(n, [720, 1500], [1, .35], [.012, .007], r) + lp(r.standard_normal(n) * np.exp(-t / .001), 4000) * .3
    y += 0.9 * np.roll(tap, int(0.085 * SR)) * (t > 0.085)
    return pan2(lp(y, 7000), 0.15)


def sfx_tock(r):
    n = int(0.1 * SR)
    t = tvec(n)
    y = modal(n, [1150, 2480, 380], [1, .4, .5], [.025, .012, .03], r, 0.0003)
    y += lp(r.standard_normal(n) * np.exp(-t / 0.0008), 5000) * 0.3
    return pan2(y)


def sfx_ding(r):
    n = int(1.3 * SR)
    f = 880.0
    y = modal(n, [f, 2 * f, 3 * f, 5.4 * f, 2 * f * 1.002], [1, .22, .07, .04, .12], [.9, .5, .25, .1, .6], r, 0.001)
    return np.stack([y, np.roll(y, 25)], axis=1)


def sfx_buzz(r):
    def tone(f0, f1, d):
        n = int(d * SR)
        t = tvec(n)
        f = f0 * (f1 / f0) ** (t / d)
        ph = TWO_PI * np.cumsum(f) / SR
        y = sum(np.sin(k * ph) / k for k in range(1, 16, 2) if k * f0 < 1800)
        y *= (0.85 + 0.15 * np.sin(TWO_PI * 30 * t)) * attack_env(n, 0.008) * release_at(n, d - 0.03, 0.03)
        return y
    y = np.concatenate([tone(147, 147, .15), np.zeros(int(.05 * SR)), tone(139, 128, .3)])
    return pan2(lp(y, 1600))


def sfx_stamp(r):
    n = int(0.32 * SR)
    t = tvec(n)
    thump = np.sin(TWO_PI * np.cumsum(55 + 45 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.07)
    knock = np.sin(TWO_PI * 230 * t) * np.exp(-t / 0.03) * 0.6
    contact = lp(r.standard_normal(n) * np.exp(-t / 0.008), 2500) * 0.7
    y = np.zeros(n)
    pre = int(0.02 * SR)
    y[pre:] = (thump + knock + contact)[:n - pre]
    y[:pre + 200] += lp(r.standard_normal(pre + 200) * np.exp(-tvec(pre + 200) / 0.002), 4000) * 0.2
    return pan2(y * attack_env(n, 0.0005))


def sfx_dice(r):
    n = int(0.75 * SR)
    y = np.zeros((n, 2))
    for die, off, pan in ((0, 0.0, -0.15), (1, 0.035, 0.15)):
        times = np.array([0, .11, .2, .27, .33, .38, .42, .455]) * r.uniform(.95, 1.05) + off
        amps = np.array([1, .8, .75, .55, .5, .35, .3, .2]) * (1 if die == 0 else .8)
        for t0, a in zip(times, amps):
            L = int(0.06 * SR)
            tt = tvec(L)
            s = modal(L, np.array([1900, 3100, 4100]) * r.uniform(.9, 1.1), [1, .5, .25], [.018, .012, .008], r, 0.0002)
            s += 0.6 * np.sin(TWO_PI * 300 * tt) * np.exp(-tt / 0.02)
            _place(y, pan2(s, pan), t0, a)
    return lp(y, 7000)


def sfx_poof(r):
    n = int(0.55 * SR)
    t = tvec(n)
    fc = 500 + 2600 * np.exp(-t / 0.1)
    y = svf(r.standard_normal(n), fc, 0.6, 'lp') * np.minimum(1, t / 0.008) * np.exp(-t / 0.12)
    y += 0.5 * np.sin(TWO_PI * 80 * t) * np.exp(-t / 0.06)
    w = svf(r.standard_normal(n), fc, 0.6, 'lp') * np.minimum(1, t / 0.008) * np.exp(-t / 0.12)
    return np.stack([y, 0.7 * y + 0.3 * w], axis=1)


def sfx_sparkle(r):
    n = int(1.0 * SR)
    y = np.zeros((n, 2))
    notes = [86, 91, 93, 96, 98, 93, 98]
    for i, m in enumerate(notes):
        s = syn_glock(m, .2, .6, i) * (0.9 - 0.06 * i)
        _place(y, pan2(s[:int(0.5 * SR)] * release_at(min(len(s), int(0.5 * SR)), 0.35, 0.15), r.uniform(-.5, .5)), i * 0.06)
    t = tvec(n)
    shimmer = hp(r.standard_normal((n, 2)), 6000) * (np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 2)[:, None] * 0.02
    return y + shimmer


def sfx_drumroll(r):
    y = syn_roll(0, 1.9, 1, 3)
    n = len(y)
    fin = syn_snare(0, 0, 0, 1)
    out = np.zeros(n + int(0.1 * SR))
    out[:n] = y
    _place(out, fin * 0.9, 1.9)
    return pan2(out, -0.05)


def sfx_cheer(r):
    n = int(1.45 * SR)
    y = np.zeros((n, 2))
    for i, (f0, on, pan) in enumerate(zip([290, 335, 365, 405, 315, 385], [0, .03, .07, .05, .1, .12],
                                          [-.6, -.3, .1, .4, .6, -.1])):
        d = r.uniform(.75, 1.0)
        L = int(d * SR)
        t = tvec(L)
        f = f0 * (0.86 + 0.28 * (1 - np.exp(-t / 0.1)) - 0.14 * (t / d) ** 2) * (1 + 0.012 * np.sin(TWO_PI * 5.6 * t + i))
        ph = TWO_PI * np.cumsum(f) / SR
        u = np.clip(t / d * 1.4, 0, 1)
        F1, F2, F3 = 800 - 330 * u, 1250 + 900 * u, 2800
        v = np.zeros(L)
        for k in range(1, int(4500 // f0) + 1):
            fk = k * f
            g = (np.exp(-((fk - F1) / 150) ** 2) + 0.7 * np.exp(-((fk - F2) / 220) ** 2)
                 + 0.3 * np.exp(-((fk - F3) / 300) ** 2) + 0.03) / k ** 0.7
            v += g * np.sin(k * ph + r.uniform(0, 6))
        v += 0.05 * bp(r.standard_normal(L), 1500, 4500)
        v *= np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / (0.35 * d))
        _place(y, pan2(norm_peak(v), pan), on, r.uniform(.6, .9))
    claps = np.zeros(n)
    tc = 0.15
    while tc < 1.3:
        L = int(0.03 * SR)
        c = np.zeros(L)
        for j, dt in enumerate((0, .008, .017)):
            burst = bp(r.standard_normal(L), 900, 2800) * np.exp(-tvec(L) / 0.006)
            c[int(dt * SR):] += burst[:L - int(dt * SR)] * (1, .7, .5)[j]
        _place(claps, c, tc, r.uniform(.3, .6))
        tc += r.uniform(.04, .09)
    y += pan2(claps, 0) * 0.5 + pan2(np.roll(claps, 300), 0.3) * 0.3
    return lp(y, 7000)


def sfx_sad(r):
    a = syn_brass(58, 0.32, .8, 0, 'wah')
    b = syn_brass(57, 0.85, .8, 1, 'wah', sag=-40, vib=True)
    y = np.zeros(int(1.35 * SR))
    _place(y, a * 0.9, 0.0)
    _place(y, b, 0.36)
    return pan2(y)


def sfx_scratch(r):
    n_src = SR
    ts = tvec(n_src)
    src = sum(np.sin(TWO_PI * f * ts) * a for f, a in ((220, 1), (277, .7), (330, .8), (440, .5), (660, .3)))
    src += 0.6 * bp(r.standard_normal(n_src), 500, 3000)
    n = int(0.4 * SR)
    t = tvec(n)
    v = np.interp(t, [0, .02, .09, .11, .19, .21, .3, .38, .4], [0, 3.0, 3.0, -2.6, -2.6, 2.2, 2.2, 0.2, 0])
    pos = 0.3 * SR + np.cumsum(v)
    y = np.interp(pos, np.arange(n_src), src) * np.clip(np.abs(v) / 1.5, 0, 1)
    y += 0.1 * bp(r.standard_normal(n), 2000, 6000) * np.exp(-t / 0.2)
    return pan2(lp(y, 6000))


def sfx_tick(r):
    n = int(0.05 * SR)
    t = tvec(n)
    y = modal(n, [2000, 4100], [1, .3], [.006, .003], r, 0.0002) + lp(r.standard_normal(n) * np.exp(-t / .0006), 6000) * .3
    return pan2(y)


def sfx_thud(r):
    n = int(0.35 * SR)
    t = tvec(n)
    y = np.sin(TWO_PI * np.cumsum(45 + 40 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.09)
    y += lp(r.standard_normal(n) * np.exp(-t / 0.02), 600) * 0.5
    return pan2(y * attack_env(n, 0.002))


def sfx_pencil(r):
    n = int(0.8 * SR)
    t = tvec(n)
    env = np.zeros(n)
    for s0 in (0, .12, .245, .37, .5, .61):
        d = r.uniform(.085, .11)
        u = (t - s0) / d
        env += np.where((u >= 0) & (u <= 1), np.sin(np.pi * np.clip(u, 0, 1)) ** 0.7, 0) * r.uniform(.6, 1)
    grain = 0.5 + np.abs(lp(r.standard_normal(n), 150)) * 4
    y = (bp(r.standard_normal(n), 2000, 6500) + 0.4 * bp(r.standard_normal(n), 800, 2000)) * env * grain
    return pan2(lp(y, 7500), 0.1)


def sfx_crumple(r):
    n = int(0.7 * SR)
    t = tvec(n)
    y = grains(n, lambda u: 320 * math.exp(-u / 0.25) + 25, r, [(800, 2500), (1500, 4000), (2500, 6000)], (1, 6))
    y += 0.2 * bp(r.standard_normal(n), 300, 1500) * np.exp(-t / 0.3)
    y = lp(y, 7000)
    return np.stack([y, np.roll(y, 60)], axis=1)


def sfx_hop(r):
    n = int(0.16 * SR)
    t = tvec(n)
    f = 260 * (620 / 260) ** np.clip(t / 0.07, 0, 1)
    ph = TWO_PI * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.2 * np.sin(2 * ph)) * np.minimum(1, t / 0.005) * np.exp(-t / 0.045)
    return pan2(y)


SFX_FN = {name: globals()['sfx_' + name] for name in SFX_NAMES}
# per-SFX level trim (dB) relative to a common loudness reference, set by ear-proxy (see report)
SFX_TRIM = {'rattle': -2, 'pop': -3, 'boing': -3, 'clang': -4, 'chitter': -4, 'brush': -7, 'paper': -6, 'bite': -3,
            'whoosh': -5, 'flip': -6, 'slide': -7, 'deal': -6, 'tock': -5, 'ding': -5, 'buzz': -6, 'stamp': -2,
            'dice': -4, 'poof': -5, 'sparkle': -6, 'drumroll': -5, 'cheer': -3, 'sad': -3, 'scratch': -3,
            'tick': -7, 'thud': -3, 'pencil': -8, 'crumple': -6, 'hop': -4}
SFX_REF_DB = -12.0     # K-weighted RMS of each SFX's loudest 100 ms before its trim
SFX_PEAK_DB = -7.0     # per-SFX sample-peak ceiling (pre-master; the master adds about +6 dB)
VARY = {'tock', 'pop', 'tick', 'hop', 'deal', 'flip', 'stamp', 'thud', 'dice', 'bite', 'boing', 'rattle', 'chitter'}


def kweight(x):
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)


def max_window_rms_db(x, win=0.1):
    y = kweight(x)
    ms = (y ** 2).sum(axis=1) if y.ndim == 2 else y ** 2
    w = max(1, min(len(ms), int(win * SR)))
    cs = np.concatenate([[0], np.cumsum(ms)])
    return 10 * math.log10(max(np.max((cs[w:] - cs[:-w]) / w), 1e-20))


def make_sfx():
    lib, info = {}, {}
    for name in SFX_NAMES:
        y = SFX_FN[name](rng_of('sfx', name))
        if y.ndim == 1:
            y = pan2(y)
        y = lp(hp(y, 30), 10000, 4)
        y = edge_fade(np.nan_to_num(y), 0.0005, 0.01)
        lvl = max_window_rms_db(y)
        g = undb(SFX_REF_DB + SFX_TRIM.get(name, -4) - lvl)
        y, _, _, _ = limiter(y * g, SFX_PEAK_DB, hold=0.005)   # tame extreme crest before the bus
        lib[name] = y
        info[name] = dict(dur=round(len(y) / SR, 3), peak_dbfs=round(dbv(np.abs(y).max()), 1),
                          loud100ms_db=round(max_window_rms_db(y), 1))
    return lib, info


def fallback_tick(lib):
    return lib['tick'] * 0.6


def build_sfx_track(cues, lib, n_total):
    y = np.zeros((n_total, 2))
    counts = {}
    for i, c in enumerate(cues):
        name = c['sfx']
        s = lib.get(name)
        if s is None:
            warn(f"unknown sfx {name!r} at {c['t']} s: using a soft tick")
            s = fallback_tick(lib)
        k = counts.get(name, 0)
        counts[name] = k + 1
        if name in VARY and k > 0:
            h = rng_of('var', name, k)
            rate = 1 + h.uniform(-0.03, 0.03)
            idx = np.arange(0, len(s) - 1, rate)
            s = np.stack([np.interp(idx, np.arange(len(s)), s[:, ch]) for ch in range(2)], axis=1) * undb(h.uniform(-1, 1))
        _place(y, s, max(0.0, float(c['t'])), float(c.get('vol', 1) if c.get('vol') is not None else 1))
    return y


def duck_curve(cues, n_total, max_db=5.0, slope=2.0, thresh=0.6):
    """Music gain (linear, per sample): about -0.8 dB under a lone cue, -3 to -5 dB where cues cluster
    (cue density = sum of vol-weighted 1.6 s raised-cosine windows)."""
    ctl = 200
    m = int(n_total / SR * ctl) + 2
    tt = np.arange(m) / ctl
    dens = np.zeros(m)
    for c in cues:
        v = float(c.get('vol', 1) if c.get('vol') is not None else 1)
        d = np.abs(tt - c['t'])
        dens += v * np.where(d < 0.8, 0.5 + 0.5 * np.cos(np.pi * d / 0.8), 0)
    target = -np.minimum(max_db, slope * np.maximum(0, dens - thresh))
    # asymmetric smoothing: fast down (60 ms), slow up (350 ms); run forwards then backwards
    out = np.zeros(m)
    g = 0.0
    a_dn, a_up = math.exp(-1 / (0.06 * ctl)), math.exp(-1 / (0.35 * ctl))
    for i in range(m):
        a = a_dn if target[i] < g else a_up
        g = a * g + (1 - a) * target[i]
        out[i] = g
    g = 0.0
    for i in range(m - 1, -1, -1):  # pre-duck slightly ahead of the cue
        a = a_dn if out[i] < g else math.exp(-1 / (0.03 * ctl))
        g = a * g + (1 - a) * out[i]
        out[i] = min(out[i], g)
    db_curve = np.interp(np.arange(n_total) / SR, tt, out)
    return undb(db_curve), tt, out


# ============================================================================ loudness, limiting, analysis

def kcum(x):
    """Cumulative K-weighted energy (summed over channels): slice it for any block or section."""
    y = kweight(x)
    return np.concatenate([[0.0], np.cumsum((y ** 2).sum(axis=1))])


def blocks_from_cum(cs, a=0, e=None, win=0.4, hop=0.1):
    e = len(cs) - 1 if e is None else min(e, len(cs) - 1)
    w, h = int(win * SR), int(hop * SR)
    st = np.arange(a, e - w + 1, h)
    return (st + w / 2) / SR, (cs[st + w] - cs[st]) / w


def loudness_blocks(x, win=0.4, hop=0.1):
    return blocks_from_cum(kcum(x), win=win, hop=hop)


def gated_lufs(z):
    """ITU-R BS.1770-4 integrated loudness from 400 ms block mean squares."""
    l = -0.691 + 10 * np.log10(z + 1e-20)
    g1 = z[l > -70]
    if not len(g1):
        return -99.0
    rel = -0.691 + 10 * math.log10(g1.mean()) - 10
    g2 = z[(l > -70) & (l > rel)]
    return -0.691 + 10 * math.log10(g2.mean())


def integrated_lufs(x, cs=None, a=0, e=None):
    return gated_lufs(blocks_from_cum(kcum(x) if cs is None else cs, a, e)[1])


def limiter(x, ceiling_db=-1.0, hold=0.02):
    c = undb(ceiling_db)
    pk = np.abs(x).max(axis=1)
    g = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    if g.min() >= 1.0:
        return x, 0.0, 0, np.ones(len(x))
    H = int(hold * SR)
    gm = minimum_filter1d(g, size=2 * H + 1, mode='nearest')
    gs = uniform_filter1d(gm, size=H, mode='nearest')
    gs = np.minimum(gs, g)
    return x * gs[:, None], dbv(gs.min()), int((gs < 0.999).sum()), gs


def true_peak_db(x):
    """4x oversampled peak, evaluated around every sample peak within 3 dB of the maximum."""
    pk = np.abs(x).max(axis=1)
    idx = np.nonzero(pk > pk.max() * undb(-3))[0]
    best = pk.max()
    done = -10 ** 9
    for i in idx:
        if i - done < 256:
            continue
        done = i
        a, e = max(0, i - 512), min(len(x), i + 512)
        up = signal.resample_poly(x[a:e], 4, 1, axis=0)
        best = max(best, np.abs(up[256:-256]).max() if len(up) > 600 else np.abs(up).max())
    return dbv(best)


def band_split(x, t0, t1):
    seg = x[int(t0 * SR):int(t1 * SR)].mean(axis=1)
    if len(seg) < 4096:
        return {}
    f, p = signal.welch(seg, SR, nperseg=8192)
    bands = {'sub<60': (0, 60), 'low60-250': (60, 250), 'mid250-2k': (250, 2000), 'hmid2-6k': (2000, 6000), 'high>6k': (6000, 24000)}
    tot = p.sum() + 1e-30
    out = {k: round(100 * p[(f >= a) & (f < b)].sum() / tot, 1) for k, (a, b) in bands.items()}
    out['centroid_hz'] = int((f * p).sum() / tot)
    return out


def rms_db(x):
    return dbv(np.sqrt(np.mean(x ** 2))) if len(x) else -120


def analyse(tl, mix, music, sfx, cues, A, extra):
    rep = dict(extra)
    n = len(mix)
    rep['duration_s'] = n / SR
    cs_mix, cs_mus = kcum(mix), kcum(music)
    rep['integrated_lufs'] = round(integrated_lufs(mix, cs_mix), 2)
    rep['music_integrated_lufs'] = round(integrated_lufs(music, cs_mus), 2)
    rep['sample_peak_dbfs'] = round(dbv(np.abs(mix).max()), 2)
    rep['true_peak_dbtp'] = round(true_peak_db(mix), 2)
    q = np.round(mix * 32767)
    rep['clipped_samples'] = int((np.abs(q) >= 32767).sum())
    rep['dc_offset'] = [float(f'{v:.2e}') for v in mix.mean(axis=0)]
    rep['stereo_correlation'] = round(float(np.corrcoef(mix[:, 0], mix[:, 1])[0, 1]), 3)
    tb, z = blocks_from_cum(cs_mix, win=3.0, hop=0.5)
    st = -0.691 + 10 * np.log10(z + 1e-20)
    rep['short_term_lufs_max'] = round(float(st.max()), 1)
    rep['short_term_lufs_min'] = round(float(st.min()), 1)
    secs = []
    for s in tl['scenes']:
        a, e = s['start'], s['start'] + s['dur']
        i0, i1 = int(a * SR), int(e * SR)
        secs.append(dict(id=s['id'], start=a, end=e,
                         music_rms_db=round(rms_db(music[i0:i1]), 1), music_peak_db=round(dbv(np.abs(music[i0:i1]).max()), 1),
                         sfx_rms_db=round(rms_db(sfx[i0:i1]), 1) if np.any(sfx[i0:i1]) else None,
                         mix_rms_db=round(rms_db(mix[i0:i1]), 1), mix_peak_db=round(dbv(np.abs(mix[i0:i1]).max()), 1),
                         mix_lufs=round(integrated_lufs(mix, cs_mix, i0, i1), 1), spectrum_pct=band_split(mix, a, e)))
    rep['sections'] = secs
    # silence scan on the music bed (100 ms windows)
    w = int(0.1 * SR)
    m = music.mean(axis=1)
    k = len(m) // w
    r = np.sqrt((m[:k * w].reshape(k, w) ** 2).mean(axis=1) + 1e-20)
    quiet = []
    for i in np.nonzero(20 * np.log10(r) < -50)[0]:
        t = i * w / SR
        intended = any(g0 - 0.2 <= t <= g1 for g0, g1 in A.gaps) or t >= rep['duration_s'] - 0.4
        quiet.append((round(t, 1), intended))
    rep['music_quiet_windows_below_-50dBFS'] = dict(total=len(quiet), unintended=[t for t, i in quiet if not i],
                                                     intended=[t for t, i in quiet if i])
    rep['spectrum_full_mix_pct'] = band_split(mix, 0, rep['duration_s'])
    rep['musical_marks_s'] = {k: round(v, 3) for k, v in A.marks.items()}
    rep['n_cues'] = len(cues)
    rep['n_notes'] = len(A.notes)
    return rep


# ============================================================================ plots

def _stft_db(y, nfft=2048, hop=512):
    f, t, Z = signal.stft(y, SR, nperseg=nfft, noverlap=nfft - hop, boundary=None, padded=False)
    return f, t, 20 * np.log10(np.abs(Z) + 1e-9)


def _logf_image(y, fmin=30, fmax=16000, nbins=220, nfft=2048, hop=512):
    f, t, S = _stft_db(y, nfft, hop)
    lf = np.geomspace(fmin, fmax, nbins)
    img = np.stack([np.interp(lf, f, S[:, j]) for j in range(S.shape[1])], axis=1)
    return lf, t, img


def plot_all(pngdir, suffix, tl, mix, music, sfxlib, cues, A, duck_t, duck_db, plt):
    os.makedirs(pngdir, exist_ok=True)
    os.makedirs(os.path.join(pngdir, 'sfx'), exist_ok=True)
    dur = tl['duration']
    for label, sig in (('mix' + suffix, mix), ('music', music)):
        y = sig.mean(axis=1)
        rows = int(math.ceil(dur / 60))
        fig, axes = plt.subplots(rows, 1, figsize=(22, 4.2 * rows), squeeze=False)
        for r in range(rows):
            a, e = r * 60, min(dur, (r + 1) * 60)
            seg = y[int(a * SR):int(e * SR)]
            lf, t, img = _logf_image(seg, nfft=4096, hop=1024)
            ax = axes[r, 0]
            ax.imshow(img, origin='lower', aspect='auto', cmap='magma', vmin=-100, vmax=-20,
                      extent=[a, a + t[-1] if len(t) else e, 0, len(lf)])
            ticks = [50, 100, 200, 500, 1000, 2000, 5000, 10000]
            ax.set_yticks([np.searchsorted(lf, v) for v in ticks])
            ax.set_yticklabels(['50', '100', '200', '500', '1k', '2k', '5k', '10k'])
            ax.set_xlim(a, a + 60)
            for s in tl['scenes']:
                if a <= s['start'] < e:
                    ax.axvline(s['start'], color='cyan', lw=1.2)
                    ax.text(s['start'] + 0.2, len(lf) - 12, s['id'], color='cyan', fontsize=10, va='top')
            if label.startswith('mix'):
                for c in cues:
                    if a <= c['t'] < e:
                        ax.plot([c['t']], [len(lf) - 3], marker='v', color='lime', ms=6)
                        ax.text(c['t'], len(lf) - 30, c['sfx'], color='lime', fontsize=7, rotation=90, va='top')
            for tt, lab in A.labels:
                if a <= tt < e:
                    ax.text(tt + 0.2, 8, lab, color='white', fontsize=8)
            ax.set_ylabel('Hz')
        axes[-1, 0].set_xlabel('time (s)')
        fig.suptitle(f'{label} spectrogram (log frequency, dB)', fontsize=14)
        fig.tight_layout()
        fig.savefig(os.path.join(pngdir, f'spectrogram_{label}.png'), dpi=60)
        plt.close(fig)
    # levels + ducking
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(22, 7), sharex=True, gridspec_kw=dict(height_ratios=[3, 1]))
    for sig, lab, col in ((mix, 'mix', 'k'), (music, 'music', 'tab:blue'), (mix - music, 'sfx', 'tab:orange')):
        tb, z = loudness_blocks(sig, 0.4, 0.1)
        ax1.plot(tb, -0.691 + 10 * np.log10(z + 1e-20), color=col, lw=0.8, label=lab + ' momentary LUFS')
    tb, z = loudness_blocks(mix, 3.0, 0.5)
    ax1.plot(tb, -0.691 + 10 * np.log10(z + 1e-20), color='red', lw=1.6, label='mix short-term LUFS')
    ax1.axhline(-16, color='gray', ls='--', lw=0.8)
    ax1.set_ylim(-50, -4)
    ax1.legend(loc='lower left', fontsize=8)
    for s in tl['scenes']:
        for ax in (ax1, ax2):
            ax.axvline(s['start'], color='gray', lw=0.6)
        ax1.text(s['start'] + 0.2, -6, s['id'], fontsize=8)
    ax2.plot(duck_t, duck_db, color='purple')
    ax2.set_ylabel('music duck dB')
    ax2.set_ylim(-6, 0.5)
    ax2.set_xlim(0, dur)
    ax2.set_xlabel('time (s)')
    fig.tight_layout()
    fig.savefig(os.path.join(pngdir, f'levels{suffix}.png'), dpi=60)
    plt.close(fig)
    # piano roll of the score
    fig, ax = plt.subplots(figsize=(24, 8))
    cols = {}
    cmap = plt.get_cmap('tab20')
    for nt in A.notes:
        if nt.inst in ('kick', 'shaker', 'hat', 'snare', 'brush', 'wood', 'roll', 'swell', 'splash'):
            continue
        c = cols.setdefault(nt.inst, cmap(len(cols) % 20))
        ax.plot([nt.t, nt.t + min(nt.dur, 2.0)], [nt.midi, nt.midi], color=c, lw=2.2, solid_capstyle='butt')
    for (a, e, ch) in A.spans:
        ax.text(a + 0.05, 100, ch.name, fontsize=6, rotation=90, va='bottom')
    for s in tl['scenes']:
        ax.axvline(s['start'], color='gray', lw=0.6)
        ax.text(s['start'] + 0.2, 26, s['id'], fontsize=8)
    ax.set_xlim(0, dur)
    ax.set_ylim(24, 108)
    ax.legend(handles=[plt.Line2D([], [], color=c, lw=3, label=k) for k, c in cols.items()], loc='upper right', ncol=4, fontsize=8)
    ax.set_xlabel('time (s)')
    ax.set_ylabel('MIDI note')
    fig.tight_layout()
    fig.savefig(os.path.join(pngdir, 'score_pianoroll.png'), dpi=60)
    plt.close(fig)
    # every SFX: one PNG each + a contact sheet
    names = list(sfxlib)
    cols_n = 7
    rows_n = int(math.ceil(len(names) / cols_n))
    fig2, axes2 = plt.subplots(rows_n, cols_n, figsize=(3.2 * cols_n, 2.6 * rows_n), squeeze=False)
    for i, name in enumerate(names):
        y = sfxlib[name].mean(axis=1)
        y = np.concatenate([y, np.zeros(2048)])
        f, t, S = _stft_db(y, 1024, 128)
        for ax in (axes2[i // cols_n, i % cols_n],):
            ax.imshow(S, origin='lower', aspect='auto', cmap='magma', vmin=-110, vmax=-20, extent=[0, t[-1], 0, f[-1] / 1000])
            ax.set_ylim(0, 16)
            ax.set_title(f'{name} ({len(sfxlib[name]) / SR:.2f} s)', fontsize=9)
            ax.tick_params(labelsize=6)
            ax2 = ax.twinx()
            tw = np.arange(len(y)) / SR
            ax2.plot(tw, y, color='cyan', lw=0.3)
            ax2.set_ylim(-1, 1)
            ax2.set_yticks([])
        fig, (a1, a2) = plt.subplots(2, 1, figsize=(6, 4.2), sharex=True, gridspec_kw=dict(height_ratios=[3, 1]))
        a1.imshow(S, origin='lower', aspect='auto', cmap='magma', vmin=-110, vmax=-20, extent=[0, t[-1], 0, f[-1] / 1000])
        a1.set_ylim(0, 16)
        a1.set_ylabel('kHz')
        a1.set_title(f'sfx: {name}')
        a2.plot(np.arange(len(y)) / SR, y, lw=0.5)
        a2.set_ylim(-1, 1)
        a2.set_xlabel('s')
        fig.tight_layout()
        fig.savefig(os.path.join(pngdir, 'sfx', f'{name}.png'), dpi=70)
        plt.close(fig)
    for j in range(len(names), rows_n * cols_n):
        axes2[j // cols_n, j % cols_n].axis('off')
    fig2.tight_layout()
    fig2.savefig(os.path.join(pngdir, 'sfx_contact_sheet.png'), dpi=60)
    plt.close(fig2)


# ============================================================================ I/O and main

def write_wav(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    q = np.clip(np.round(x * 32767), -32768, 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(q.tobytes())


def test_cues(duration):
    names = SFX_NAMES
    a, e = 11.0, duration - 5.0
    return [dict(t=round((a + i * (e - a) / (len(names) - 1)) * 4) / 4, sfx=nm, vol=1.0, scene='test')
            for i, nm in enumerate(names)]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--timeline', default='out/timeline.json')
    ap.add_argument('--out', default='out/audio')
    ap.add_argument('--export', action='store_true', help='re-export the timeline with node first')
    ap.add_argument('--test-cues', action='store_true', help='add one cue of every SFX, spread over the film')
    ap.add_argument('--no-plots', action='store_true')
    ap.add_argument('--no-cache', action='store_true', help='always re-synthesise the music bed')
    args = ap.parse_args()
    t_start = time.time()
    os.chdir(PROJECT)
    if args.export or not os.path.exists(args.timeline):
        print('exporting timeline with node render/render.mjs ...')
        subprocess.run(['node', 'render/render.mjs', '--timeline', args.timeline], check=True)
    with open(args.timeline) as fh:
        tl = json.load(fh)
    dur = float(tl['duration'])
    n_total = int(round(dur * SR))
    prev = 0.0
    for sc in tl['scenes']:
        if abs(float(sc['start']) - prev) > 1e-6:
            warn(f"scene {sc['id']} starts at {sc['start']} s but the previous scene ends at {prev} s")
        prev = float(sc['start']) + float(sc['dur'])
    if abs(prev - dur) > 1e-6:
        warn(f"scenes end at {prev} s but duration is {dur} s")
    cues = []
    for c in tl.get('cues', []):
        t = float(c['t'])
        if not (0 <= t < dur):
            warn(f"cue {c} outside the film: skipped")
            continue
        cues.append(dict(t=t, sfx=str(c['sfx']), vol=float(c.get('vol', 1) if c.get('vol') is not None else 1),
                         scene=c.get('scene', '')))
    for c in cues:
        if c['sfx'] not in SFX_FN:
            warn(f"unknown sfx {c['sfx']!r} at {c['t']} s (scene {c['scene']}): a soft tick will play")
    suffix = ''
    if args.test_cues:
        cues = sorted(cues + test_cues(dur), key=lambda c: c['t'])
        suffix = '_testcues'
    print(f"timeline: {len(tl['scenes'])} scenes, {dur:.1f} s, {len(cues)} cues{' (incl. test cues)' if suffix else ''}")

    # ---------------- music
    t0 = time.time()
    A = compose(tl, cues)
    music, stem_rms, cached = render_music(A, n_total, os.path.join(args.out, 'cache'), not args.no_cache)
    print(f"music: {len(A.notes)} notes on {len(stem_rms)} instruments in {time.time() - t0:.1f} s"
          f"{' (unchanged score: loaded from cache)' if cached else ''}")

    # ---------------- sfx
    t1 = time.time()
    lib, sfx_info = make_sfx()
    sfx = build_sfx_track(cues, lib, n_total)
    print(f"sfx: {len(lib)} sounds, {len(cues)} cues placed in {time.time() - t1:.1f} s")

    # ---------------- mix
    MUSIC_BUS_DB = -23.0
    music = music * section_trim(tl, n_total)[:, None]
    music_bus = music * undb(MUSIC_BUS_DB - integrated_lufs(music))
    duck, duck_t, duck_db = duck_curve(cues, n_total)
    music_d = music_bus * duck[:, None]
    mix = music_d + sfx
    fade = int(0.3 * SR)
    for arr in (mix, music_d, sfx):
        arr[-fade:] *= (0.5 + 0.5 * np.cos(np.pi * np.arange(fade) / fade))[:, None]
        arr[:48] *= np.linspace(0, 1, 48)[:, None]
    g = undb(-16.0 - integrated_lufs(mix))
    mix, music_d, sfx = mix * g, music_d * g, sfx * g
    mix, lim_db, lim_n, lim_g = limiter(mix, -1.0)
    music_d *= lim_g[:, None]      # same gain curve on the stems, so music + sfx == mix
    sfx *= lim_g[:, None]
    del lim_g
    g2 = undb(-1.0) / np.abs(mix).max()
    mix, music_d, sfx = mix * g2, music_d * g2, sfx * g2
    for arr in (music_d, sfx):       # a stem can only exceed the mix peak where the other cancels it
        p = np.abs(arr).max()
        if p > 0.999:
            arr *= 0.999 / p

    out = args.out
    os.makedirs(os.path.join(out, 'sfx'), exist_ok=True)
    write_wav(os.path.join(out, f'mix{suffix}.wav'), mix)
    write_wav(os.path.join(out, 'music.wav'), music_d)
    write_wav(os.path.join(out, f'sfx_track{suffix}.wav'), sfx)
    for name, y in lib.items():
        write_wav(os.path.join(out, 'sfx', f'{name}.wav'), y)

    rep = analyse(tl, mix, music_d, sfx, cues, A, dict(
        limiter_max_reduction_db=round(lim_db, 2), limiter_active_samples=lim_n,
        final_peak_gain_db=round(dbv(g2), 2), stem_rms_dbfs_premix=stem_rms, sfx=sfx_info,
        harmony_check=harmony_check(A),
        duck_min_db=round(float(duck_db.min()), 2)))
    rep['runtime_s'] = round(time.time() - t_start, 1)
    with open(os.path.join(out, f'report{suffix}.json'), 'w') as fh:
        json.dump(rep, fh, indent=1)

    if not args.no_plots:
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            plot_all(os.path.join(out, 'png'), suffix, tl, mix, music_d, lib, cues, A, duck_t, duck_db, plt)
        except ImportError:
            warn('matplotlib not installed: skipping PNGs (pip install matplotlib)')
    rep['runtime_s'] = round(time.time() - t_start, 1)
    with open(os.path.join(out, f'report{suffix}.json'), 'w') as fh:
        json.dump(rep, fh, indent=1)

    print(f"mix: {rep['integrated_lufs']} LUFS integrated, peak {rep['sample_peak_dbfs']} dBFS "
          f"(true peak {rep['true_peak_dbtp']} dBTP), limiter max {rep['limiter_max_reduction_db']} dB, "
          f"clipped {rep['clipped_samples']}, DC {rep['dc_offset']}")
    hc = rep['harmony_check']
    print(f"harmony: {hc['non_chord_tones']} of {hc['checked']} long on-beat melody notes are non-chord tones: {hc['list']}")
    print(f"music quiet windows: {rep['music_quiet_windows_below_-50dBFS']['total']} "
          f"(unintended {rep['music_quiet_windows_below_-50dBFS']['unintended']})")
    for s in rep['sections']:
        print(f"  {s['id']:<12} {s['start']:6.1f}-{s['end']:6.1f}  music {s['music_rms_db']:6.1f} dB rms  "
              f"mix {s['mix_lufs']:6.1f} LUFS peak {s['mix_peak_db']:5.1f}  centroid {s['spectrum_pct'].get('centroid_hz')} Hz")
    print(f"wrote {out}/mix{suffix}.wav, music.wav, sfx_track{suffix}.wav, sfx/*.wav, report{suffix}.json"
          f"{', png/' if not args.no_plots else ''} in {rep['runtime_s']} s")


if __name__ == '__main__':
    main()
