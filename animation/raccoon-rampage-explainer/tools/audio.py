"""Synthesises the soundtrack: music that follows the scene moods, plus sound
effects placed at the audio cues the animation registered while rendering.

Usage: python3 tools/audio.py [out/timeline.json] [out/cues.json] [out/audio.wav] [--stems]
Everything is generated from scratch with numpy (no samples).
"""
import json
import sys
import wave
import zlib

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BPM = 120
BEAT = 60 / BPM
BARLEN = 4 * BEAT
RNG = np.random.default_rng(7)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(SR * dur)) / SR


def band(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def fade(y, a=0.004, r=0.02):
    n = len(y)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        y[:na] *= np.linspace(0, 1, na)
    if nr:
        y[-nr:] *= np.linspace(1, 0, nr)
    return y


# ---- instruments --------------------------------------------------------------
def marimba(f, dur, v=1.0):
    t = tt(max(dur, 0.6))
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t * 5.5)
         + 0.32 * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t * 16)
         + 0.08 * np.sin(2 * np.pi * 9.2 * f * t) * np.exp(-t * 34))
    y += 0.05 * RNG.standard_normal(len(t)) * np.exp(-t * 220)
    return fade(y * v, 0.002, 0.05)


def pluck(f, dur, v=1.0):
    t = tt(max(dur, 0.45))
    y = np.zeros_like(t)
    for k in range(1, 9):
        y += np.sin(2 * np.pi * f * k * t) / k * np.exp(-t * (4 + 3.5 * k))
    y += 0.08 * lp(RNG.standard_normal(len(t)), 3000) * np.exp(-t * 120)
    return fade(y * v * 0.8, 0.001, 0.04)


def bass(f, dur, v=1.0):
    t = tt(dur + 0.08)
    e = np.minimum(1, t / 0.006) * (0.55 + 0.45 * np.exp(-t * 9))
    e *= np.where(t > dur, np.exp(-(t - dur) * 60), 1)
    y = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return fade(y * e * v, 0.002, 0.03)


def glock(f, dur, v=1.0):
    t = tt(max(dur, 1.2))
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.6)
         + 0.4 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 5)
         + 0.18 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 9))
    return fade(y * v, 0.001, 0.1)


def pad(f, dur, v=1.0):
    t = tt(dur + 0.6)
    e = np.minimum(1, t / 0.35) * np.where(t > dur, np.exp(-(t - dur) * 6), 1)
    y = sum(np.sin(2 * np.pi * f * d * t + ph) for d, ph in ((0.996, 0), (1.0, 1.1), (1.004, 2.3)))
    y += 0.25 * np.sin(4 * np.pi * f * t)
    return fade(lp(y, 1800) * e * v / 3, 0.01, 0.1)


def brass(f, dur, v=1.0):
    t = tt(dur + 0.15)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.3)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    bright = 0.35 + 0.65 * np.minimum(1, t / 0.06)
    y = sum(np.sin(k * ph) / k * (bright if k > 2 else 1) for k in range(1, 12))
    e = np.minimum(1, t / 0.03) * (0.75 + 0.25 * np.exp(-t * 4)) * np.where(t > dur, np.exp(-(t - dur) * 25), 1)
    return fade(lp(y, 3500) * e * v * 0.45, 0.004, 0.05)


def kick(v=1.0):
    t = tt(0.35)
    f = 45 + 90 * np.exp(-t * 30)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    return fade(y * v, 0.001, 0.05)


def snare(v=1.0):
    t = tt(0.25)
    y = band(RNG.standard_normal(len(t)), 1200, 6000) * np.exp(-t * 26) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 32)
    return fade(y * v * 0.7, 0.001, 0.03)


def shaker(v=1.0):
    t = tt(0.09)
    y = band(RNG.standard_normal(len(t)), 5000, 11000) * np.minimum(1, t / 0.012) * np.exp(-t * 55)
    return fade(y * v * 0.6, 0.001, 0.02)


def woodblock(f=880, v=1.0):
    t = tt(0.15)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 55) + 0.4 * np.sin(2 * np.pi * f * 2.3 * t) * np.exp(-t * 80)
    return fade(y * v, 0.001, 0.02)


def timpani(f, v=1.0):
    t = tt(1.4)
    y = np.sin(2 * np.pi * f * (1 + 0.03 * np.exp(-t * 8)) * t) * np.exp(-t * 2.6)
    y += 0.3 * lp(RNG.standard_normal(len(t)), 400) * np.exp(-t * 18)
    return fade(y * v, 0.002, 0.1)


def cymbal_swell(dur, v=1.0):
    t = tt(dur)
    y = hp(RNG.standard_normal(len(t)), 4000) * (t / dur) ** 2.5
    return fade(y * v * 0.35, 0.01, 0.01)


# ---- sound effects ---------------------------------------------------------------
def sweep(f0, f1, dur, shape="sine"):
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if shape == "sine" else sum(np.sin(k * ph) / k for k in range(1, 8))


def sfx(name):
    if name == "pop":
        y = sweep(380, 950, 0.07) * np.exp(-tt(0.07) * 30)
    elif name == "boing":
        t = tt(0.45)
        f = 190 + 260 * np.exp(-t * 4) * (1 + 0.35 * np.sin(2 * np.pi * 14 * t))
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
    elif name in ("card", "flip", "slide"):
        d = {"card": 0.16, "flip": 0.13, "slide": 0.22}[name]
        t = tt(d)
        y = band(RNG.standard_normal(len(t)), 1500 if name != "slide" else 700, 7000) * np.sin(np.pi * t / d) ** 1.5
        y *= 0.6 if name == "slide" else 0.8
    elif name == "clack":
        t = tt(0.12)
        y = (np.sin(2 * np.pi * 1250 * t) * np.exp(-t * 60) + 0.6 * np.sin(2 * np.pi * 2380 * t) * np.exp(-t * 90)
             + 0.5 * band(RNG.standard_normal(len(t)), 800, 5000) * np.exp(-t * 120))
    elif name == "tick":
        t = tt(0.1)
        y = np.sin(2 * np.pi * 1560 * t) * np.exp(-t * 45) + 0.3 * np.sin(2 * np.pi * 3120 * t) * np.exp(-t * 70)
    elif name == "step":
        t = tt(0.1)
        y = np.sin(2 * np.pi * 620 * t) * np.exp(-t * 50) + 0.4 * band(RNG.standard_normal(len(t)), 300, 2000) * np.exp(-t * 90)
    elif name in ("stamp", "thud"):
        t = tt(0.3)
        y = np.sin(2 * np.pi * 95 * t) * np.exp(-t * 16) + 0.5 * lp(RNG.standard_normal(len(t)), 1500) * np.exp(-t * 35)
        if name == "stamp":
            y += 0.3 * band(RNG.standard_normal(len(t)), 2000, 6000) * np.exp(-t * 60)
    elif name == "fail":
        # a sad trombone wah-wah
        parts = []
        for m, d in ((58, 0.28), (57, 0.28), (56, 0.28), (55, 0.7)):
            t = tt(d)
            wah = 0.5 + 0.5 * np.sin(2 * np.pi * 5 * t) if d > 0.5 else np.ones_like(t)
            parts.append(lp(sweep(midi(m), midi(m) * (0.97 if d > 0.5 else 1), d, "saw"), 1400) * np.minimum(1, t / 0.03) * wah * np.exp(-t * 1.2))
        y = np.concatenate(parts) * 0.55
    elif name == "crumple":
        t = tt(0.45)
        clicks = (RNG.random(len(t)) < 0.02) * RNG.standard_normal(len(t))
        y = band(clicks + 0.2 * RNG.standard_normal(len(t)), 1500, 8000) * np.exp(-t * 4)
    elif name == "whoosh":
        t = tt(0.5)
        n = RNG.standard_normal(len(t))
        y = np.zeros_like(t)
        for i, (lo, hi) in enumerate(((300, 1200), (800, 2500), (1500, 5000))):
            seg_ = slice(i * len(t) // 3, (i + 1) * len(t) // 3)
            y[seg_] = band(n, lo, hi)[seg_]
        y = lp(y, 5000) * np.sin(np.pi * t / 0.5) ** 2 * 0.8
    elif name == "brushswish":
        # a big bristly brush dragged across paper
        d = 1.0
        t = tt(d)
        n = RNG.standard_normal(len(t))
        bristle = 0.6 + 0.4 * lp(np.abs(RNG.standard_normal(len(t))), 40) / 0.8
        y = band(n, 500, 3500) * np.sin(np.pi * t / d) ** 1.2 * bristle
        y += 0.5 * band(n, 2500, 8000) * np.sin(np.pi * np.clip(t / d * 1.4 - 0.2, 0, 1)) ** 2
    elif name == "sparkle":
        y = np.zeros(int(SR * 0.9))
        for i, m in enumerate((84, 88, 91, 96)):
            g = glock(midi(m), 0.6, 0.35)
            s = int(i * 0.06 * SR)
            n = min(len(g), len(y) - s)
            y[s:s + n] += g[:n]
    elif name == "boom":
        t = tt(1.1)
        y = np.sin(2 * np.pi * (40 + 60 * np.exp(-t * 6)) * t) * np.exp(-t * 3) + 0.6 * lp(RNG.standard_normal(len(t)), 700) * np.exp(-t * 5)
    elif name == "creak":
        t = tt(0.6)
        f = 420 + 120 * np.sin(2 * np.pi * 1.7 * t) + 40 * np.sin(2 * np.pi * 23 * t)
        y = band(sum(np.sin(k * 2 * np.pi * np.cumsum(f) / SR) / k for k in range(1, 6)), 400, 3000) * np.sin(np.pi * t / 0.6) * 0.6
    elif name == "chitter":
        y = np.zeros(int(SR * 0.45))
        for i in range(7):
            f0 = 2400 + RNG.random() * 1600
            b = sweep(f0, f0 * (1.3 + RNG.random() * 0.3), 0.035) * np.sin(np.pi * tt(0.035) / 0.035)
            s = int((i * 0.055 + RNG.random() * 0.01) * SR)
            y[s:s + len(b)] += b[:len(y) - s]
        y *= 0.45
    elif name == "dice":
        y = np.zeros(int(SR * 0.7))
        tpos = 0.0
        for i in range(9):
            tpos += 0.03 + RNG.random() * 0.07
            s = int(tpos * SR)
            c = sfx("clack") * (0.9 - i * 0.08)
            n = min(len(c), len(y) - s)
            if n > 0:
                y[s:s + n] += c[:n]
    elif name == "score":
        y = np.concatenate([glock(midi(88), 0.09, 0.6)[: int(SR * 0.09)], glock(midi(93), 0.5, 0.7)])
    elif name == "shield":
        t = tt(0.8)
        y = sum(np.sin(2 * np.pi * midi(m) * t) for m in (76, 81, 84, 88)) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * np.exp(-t * 3.5) * 0.3
    elif name == "build":
        y = np.zeros(int(SR * 0.5))
        for i in range(3):
            s = int(i * 0.13 * SR)
            b = woodblock(520, 0.9)
            y[s:s + len(b)] += b[:len(y) - s]
    elif name == "bonk":
        y = sweep(700, 180, 0.18) * np.exp(-tt(0.18) * 14)
    elif name == "cheer":
        # applause: many little noise claps, with a bright arpeggio on top
        y = np.zeros(int(SR * 1.8))
        for i in range(260):
            s = int(RNG.random() * 1.5 * SR)
            c = band(RNG.standard_normal(int(SR * 0.02)), 1000, 5000) * np.exp(-tt(0.02) * 180)
            y[s:s + len(c)] += c * (0.3 + 0.3 * RNG.random())
        y *= np.minimum(1, tt(1.8) / 0.1) * np.exp(-tt(1.8) * 1.4)
    elif name == "fanfare":
        y = np.zeros(int(SR * 2.4))
        for i, (m, d) in enumerate(((65, 0.18), (69, 0.18), (72, 0.18), (77, 1.3))):
            s = int(i * 0.18 * SR)
            for mm in ((m, m - 12) if i == 3 else (m,)):
                b = brass(midi(mm), d, 0.7)
                n = min(len(b), len(y) - s)
                y[s:s + n] += b[:n]
    else:
        y = sweep(600, 900, 0.05) * np.exp(-tt(0.05) * 40)
    y = np.asarray(y, dtype=float)
    m = np.max(np.abs(y)) or 1
    return y / m


# ---- music ---------------------------------------------------------------------
CHORDS = {
    "F": (41, (53, 57, 60)), "Dm": (38, (50, 53, 57)), "Bb": (46, (46, 50, 53)), "C": (48, (48, 52, 55)),
    "Am": (45, (45, 48, 52)), "Gm": (43, (43, 46, 50)), "A": (45, (45, 49, 52)), "Gm/A": (43, (43, 46, 50)),
}
THEME_A = [  # (beat, length, midi) per bar over F | Dm | Bb | C | F | Am | Bb C | F
    [(0, .5, 72), (.5, .5, 69), (1, .5, 72), (1.5, 1, 77), (3, .5, 76), (3.5, .5, 74)],
    [(0, .5, 74), (.5, .5, 69), (1, .5, 74), (1.5, 1, 77), (3, .5, 76), (3.5, .5, 74)],
    [(0, 1, 72), (1, .5, 70), (1.5, .5, 69), (2, 1, 70), (3, .5, 72), (3.5, .5, 74)],
    [(0, 1.5, 76), (1.5, .5, 74), (2, 2, 72)],
    [(0, .5, 72), (.5, .5, 69), (1, .5, 72), (1.5, 1, 77), (3, .5, 79), (3.5, .5, 77)],
    [(0, .5, 76), (.5, .5, 72), (1, .5, 76), (1.5, 1, 81), (3, .5, 79), (3.5, .5, 76)],
    [(0, 1, 74), (1, 1, 77), (2, 1, 76), (3, .5, 74), (3.5, .5, 76)],
    [(0, 2, 77), (2, .5, 72), (2.5, .5, 74), (3, 1, 77)],
]
PROG_A = ["F", "Dm", "Bb", "C", "F", "Am", "Bb|C", "F"]
THEME_B = [  # bridge over Bb | C | Am | Dm | Bb | C | F | F
    [(0, .5, 74), (.5, .5, 77), (1, 1, 81), (2, .5, 79), (2.5, .5, 77), (3, 1, 74)],
    [(0, .5, 76), (.5, .5, 79), (1, 1, 84), (2, .5, 81), (2.5, .5, 79), (3, 1, 76)],
    [(0, .5, 72), (.5, .5, 76), (1, 1, 81), (2, 1, 79), (3, 1, 76)],
    [(0, 1.5, 74), (1.5, .5, 72), (2, 2, 69)],
    [(0, .5, 70), (.5, .5, 74), (1, .5, 77), (1.5, .5, 74), (2, .5, 70), (2.5, .5, 74), (3, 1, 77)],
    [(0, .5, 72), (.5, .5, 76), (1, .5, 79), (1.5, .5, 76), (2, .5, 72), (2.5, .5, 76), (3, 1, 79)],
    [(0, 2, 77), (2, 1, 76), (3, 1, 74)],
    [(0, 3, 72), (3, 1, 0)],
]
PROG_B = ["Bb", "C", "Am", "Dm", "Bb", "C", "F", "F"]
SNEAK = [
    [(0, .25, 62), (1, .25, 65), (2, .25, 69), (3, .25, 68), (3.5, .25, 69)],
    [(0, .25, 70), (1, .25, 69), (2, .25, 65), (3, .5, 62)],
    [(0, .25, 67), (1, .25, 70), (2, .25, 74), (3, .25, 73), (3.5, .25, 74)],
    [(0, .25, 76), (1, .25, 73), (2, .25, 69), (3, .25, 67), (3.5, .25, 64)],
    [(0, .25, 62), (1, .25, 65), (2, .25, 69), (3, .25, 68), (3.5, .25, 69)],
    [(0, .25, 70), (1, .25, 74), (2, .25, 77), (3, .5, 74)],
    [(0, .25, 67), (1, .25, 70), (2, .25, 69), (2.5, .25, 73), (3, .25, 76)],
    [(0, 1, 74), (2, .25, 62), (3, .25, 62)],
]
PROG_SNEAK = ["Dm", "Dm", "Gm", "A", "Dm", "Bb", "Gm|A", "Dm"]
PROG_TENSE = ["Dm", "Dm", "Bb", "A", "Dm", "Dm", "Gm", "A"]


class Mix:
    def __init__(self, seconds):
        self.buf = np.zeros((2, int(SR * (seconds + 4))))

    def add(self, t, y, gain=1.0, pan=0.0):
        s = int(t * SR)
        if s < 0 or s >= self.buf.shape[1]:
            return
        n = min(len(y), self.buf.shape[1] - s)
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.buf[0, s:s + n] += y[:n] * gain * l
        self.buf[1, s:s + n] += y[:n] * gain * r


def chord_at(prog, bar, beat):
    name = prog[bar % len(prog)]
    if "|" in name:
        a, b = name.split("|")
        name = a if beat < 2 else b
    return CHORDS[name]


def write_bouncy(mx, t0, nbars, energy=1.0, lead="marimba", start_phrase=0):
    """The main theme: 8-bar phrases alternating A, B and a lighter A."""
    for b in range(nbars):
        phrase = (start_phrase + b // 8) % 3
        prog, mel = (PROG_A, THEME_A) if phrase != 1 else (PROG_B, THEME_B)
        bt = t0 + b * BARLEN
        bi = b % 8
        light = phrase == 2
        # bass: bouncy root / fifth
        for beat in (0, 1, 2, 3):
            root, triad = chord_at(prog, bi, beat)
            m = root if beat in (0, 2) else root + 7
            mx.add(bt + beat * BEAT, bass(midi(m), 0.32, 0.55 * energy), 1.0, -0.1)
        if bi % 2 == 1:
            root, _ = chord_at(prog, bi, 3.5)
            mx.add(bt + 3.5 * BEAT, bass(midi(root + 12), 0.18, 0.4 * energy), 1.0, -0.1)
        # chords: offbeat plucks
        for beat in (0.5, 1.5, 2.5, 3.5):
            _, triad = chord_at(prog, bi, beat)
            for k, m in enumerate(triad):
                mx.add(bt + beat * BEAT, pluck(midi(m + 12), 0.2, 0.16 * energy), 1.0, 0.3 - k * 0.15)
        # melody
        for beat, ln, m in mel[bi]:
            if m == 0:
                continue
            v = 0.38 * energy * (0.8 if light else 1)
            if lead == "glock" or light:
                mx.add(bt + beat * BEAT, glock(midi(m + 12), ln * BEAT, v * 0.55), 1.0, 0.2)
            mx.add(bt + beat * BEAT, marimba(midi(m), ln * BEAT, v), 1.0, 0.1)
        # drums
        mx.add(bt, kick(0.5 * energy), 1.0)
        mx.add(bt + 2 * BEAT, kick(0.45 * energy), 1.0)
        mx.add(bt + 1 * BEAT, snare(0.22 * energy), 1.0, 0.1)
        mx.add(bt + 3 * BEAT, snare(0.22 * energy), 1.0, 0.1)
        for e in range(8):
            mx.add(bt + e * BEAT / 2, shaker(0.2 * energy * (1.2 if e % 2 else 0.8)), 1.0, 0.4)
        if bi == 7:
            mx.add(bt + 3.5 * BEAT, woodblock(1100, 0.25), 1.0, -0.4)


def write_sneaky(mx, t0, nbars):
    for b in range(nbars):
        bt = t0 + b * BARLEN
        bi = b % 8
        for beat in (0, 1, 2, 3):
            root, _ = chord_at(PROG_SNEAK, bi, beat)
            m = root if beat % 2 == 0 else root + 7
            mx.add(bt + beat * BEAT, pluck(midi(m), 0.3, 0.7), 1.0, -0.15)
        for beat, ln, m in SNEAK[bi]:
            mx.add(bt + beat * BEAT, pluck(midi(m), 0.25, 0.6), 1.0, 0.2)
            mx.add(bt + beat * BEAT, marimba(midi(m + 12), 0.2, 0.14), 1.0, 0.3)
        if b >= 4:  # the map section lifts a little
            _, triad = chord_at(PROG_SNEAK, bi, 0)
            for m in triad:
                mx.add(bt, pad(midi(m + 12), BARLEN * 0.95, 0.12), 1.0, 0)
            for e in range(8):
                mx.add(bt + e * BEAT / 2, shaker(0.12), 1.0, 0.4)
        mx.add(bt + 3.75 * BEAT, woodblock(700, 0.15), 1.0, -0.3)
    # crickets over the night scene
    for i in range(int(nbars * BARLEN / 0.9)):
        tc = t0 + i * 0.9 + RNG.random() * 0.2
        if tc > t0 + 9.2:
            break
        for k in range(3):
            c = np.sin(2 * np.pi * 4700 * tt(0.03)) * np.sin(np.pi * tt(0.03) / 0.03)
            mx.add(tc + k * 0.05, c, 0.05, 0.6 if i % 2 else -0.6)


def write_tense(mx, t0, nbars):
    osti = [0, 0, 12, 0, 10, 0, 7, 0]
    for b in range(nbars):
        bt = t0 + b * BARLEN
        root, triad = chord_at(PROG_TENSE, b % 8, 0)
        for e, d in enumerate(osti):
            mx.add(bt + e * BEAT / 2, pluck(midi(root + d), 0.2, 0.5), 1.0, -0.1)
        for m in triad:
            mx.add(bt, pad(midi(m + 12), BARLEN, 0.16), 1.0, 0.1)
        mx.add(bt, timpani(midi(root - 12) * 2, 0.6), 1.0)
        mx.add(bt + 2 * BEAT, kick(0.35), 1.0)
        for e in range(8):
            mx.add(bt + e * BEAT / 2, shaker(0.16 if e % 2 else 0.1), 1.0, 0.4)
        if b % 2 == 1:
            for k, m in enumerate((triad[2] + 24, triad[1] + 24, triad[0] + 24)):
                mx.add(bt + (2.5 + k * 0.5) * BEAT, pluck(midi(m), 0.2, 0.25), 1.0, 0.3)


def write_finale(mx, t0, nbars, win_t):
    """Bouncy start, a drum roll while scores are counted, then a big finish."""
    roll_start = win_t - 4.0
    bars_before = int((roll_start - t0) // BARLEN)
    write_bouncy(mx, t0, max(0, bars_before), energy=0.9)
    rs = t0 + bars_before * BARLEN
    # snare roll crescendo up to the win
    n = int((win_t - rs) / (BEAT / 4))
    for i in range(n):
        mx.add(rs + i * BEAT / 4, snare(0.08 + 0.3 * i / max(1, n)), 1.0, 0.1)
    for m in (53, 57, 60, 65):
        mx.add(rs, pad(midi(m), win_t - rs, 0.14), 1.0, 0)
    mx.add(win_t - 1.2, cymbal_swell(1.2, 1.0), 1.0)
    # triumphant hits and the theme's last bars in brass
    end = t0 + nbars * BARLEN
    for k, (dt, chord) in enumerate(((0, (53, 57, 60, 65)), (0.75, (53, 57, 60, 65)), (1.25, (58, 62, 65, 70)), (2.0, (53, 57, 60, 65)))):
        for m in chord:
            mx.add(win_t + dt, brass(midi(m), 0.5 if k < 3 else 1.6, 0.26), 1.0, (m % 5 - 2) * 0.1)
        mx.add(win_t + dt, timpani(midi(41), 0.7), 1.0)
    t = win_t + 3.2
    while t < end - 0.1:
        mx.add(t, glock(midi(84 + RNG.integers(0, 3) * 5), 0.3, 0.12), 1.0, 0.3)
        t += BEAT


def write_title(mx, t0, nbars, final=False):
    write_bouncy(mx, t0, nbars, energy=1.05, lead="glock")
    _, triad = CHORDS["F"]
    for b in range(nbars):
        for m in triad:
            mx.add(t0 + b * BARLEN, pad(midi(m + 12), BARLEN, 0.08), 1.0, 0)
    if final:
        end = t0 + nbars * BARLEN
        for m in (53, 57, 60, 65, 69):
            mx.add(end - 2 * BARLEN + 2 * BEAT, pad(midi(m), BARLEN * 1.4, 0.2), 1.0, 0)


def reverb(x, seconds=1.1, mix=0.18):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    out = []
    for ch in range(2):
        ir = RNG.standard_normal(n) * np.exp(-t * 5.5)
        ir = lp(ir, 5000)
        ir[0] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        wet = fftconvolve(x[ch], ir)[: x.shape[1]]
        out.append(x[ch] * (1 - mix) + wet * mix)
    return np.array(out)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    tl_path = args[0] if len(args) > 0 else "out/timeline.json"
    cue_path = args[1] if len(args) > 1 else "out/cues.json"
    out_path = args[2] if len(args) > 2 else "out/audio.wav"
    tl = json.load(open(tl_path))
    cues = json.load(open(cue_path))
    fps = tl["fps"]
    total = tl["total"] / fps
    music = Mix(total)
    # group consecutive scenes with the same mood into sections
    sections = []
    for s in tl["scenes"]:
        mood = s.get("mood") or "bouncy"
        if sections and sections[-1]["mood"] == mood:
            sections[-1]["bars"] += s["bars"]
        else:
            sections.append({"mood": mood, "t": s["start"] / fps, "bars": s["bars"], "id": s["id"]})
    fanfare = [c["t"] for c in cues if c["name"] == "fanfare"]
    phrase = 0
    for sec in sections:
        m, t0, nb = sec["mood"], sec["t"], int(round(sec["bars"]))
        if m == "sneaky":
            write_sneaky(music, t0, nb)
        elif m == "title":
            write_title(music, t0, nb, final=sec is sections[-1])
        elif m == "tense":
            write_tense(music, t0, nb)
        elif m == "finale":
            inside = [t for t in fanfare if t0 <= t < t0 + nb * BARLEN]
            write_finale(music, t0, nb, inside[0] if inside else t0 + nb * BARLEN - 3)
        else:
            write_bouncy(music, t0, nb, start_phrase=phrase)
            phrase += nb // 8 + 1
        # a soft swell into each new section
        if t0 > 1:
            music.add(t0 - 1.0, cymbal_swell(1.0, 0.6), 1.0)
    mus = reverb(music.buf, 1.2, 0.2)
    mus *= 0.36 / (np.max(np.abs(mus)) or 1)

    fx = Mix(total)
    cache = {}
    # transition sounds come from the timeline rather than from cues
    for sc in tl["scenes"]:
        kind = {"brush": "brushswish", "iris": "whoosh"}.get(sc.get("trans"))
        if kind:
            cues.append({"t": sc["start"] / fps, "frame": sc["start"], "name": kind, "gain": 0.9})
    for c in cues:
        name = c["name"]
        if name not in cache:
            cache[name] = sfx(name)
        g = {"pop": 0.35, "tick": 0.4, "step": 0.4, "clack": 0.45, "card": 0.4, "flip": 0.45, "slide": 0.3,
             "whoosh": 0.4, "boom": 0.8, "fanfare": 0.7, "fail": 0.55, "cheer": 0.5, "chitter": 0.35,
             "sparkle": 0.35, "score": 0.45, "stamp": 0.6, "thud": 0.45, "brushswish": 0.45}.get(name, 0.5)
        pan = float(np.clip((zlib.crc32(f"{name}{c['frame']}".encode()) % 100) / 100 - 0.5, -0.4, 0.4))
        fx.add(c["t"], cache[name], g * c.get("gain", 1), pan)
    fxs = reverb(fx.buf, 0.6, 0.12)
    FX_LEVEL = 1.0
    mixbuf = mus + fxs * FX_LEVEL
    if "--stems" in sys.argv:
        for name, stem in (("music", mus), ("sfx", fxs * FX_LEVEL)):
            st = (np.clip(stem[:, : int(total * SR)], -1, 1).T * 32767).astype(np.int16)
            with wave.open(out_path.replace(".wav", f"_{name}.wav"), "wb") as w:
                w.setnchannels(2)
                w.setsampwidth(2)
                w.setframerate(SR)
                w.writeframes(st.tobytes())
    n = int(total * SR)
    mixbuf = mixbuf[:, :n]
    # gentle limiter and a short fade at the very end
    mixbuf = np.tanh(mixbuf * 1.6) / np.tanh(1.6)
    mixbuf *= 0.89 / (np.max(np.abs(mixbuf)) or 1)
    fo = int(SR * 1.5)
    mixbuf[:, -fo:] *= np.linspace(1, 0, fo)
    data = (mixbuf.T * 32767).astype(np.int16)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"wrote {out_path}: {total:.1f}s, {len(cues)} cues, sections:",
          ", ".join(f"{s['mood']}@{s['t']:.0f}s/{s['bars']}b" for s in sections))


if __name__ == "__main__":
    main()
