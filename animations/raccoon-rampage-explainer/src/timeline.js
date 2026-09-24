// Scene registry and frame dispatch.
//
// A scene file calls RR.scene({...}) with:
//   id     unique string, e.g. 's07_pass'
//   order  position in the film (1..n)
//   dur    duration in seconds (whole bars of 2 s keep the music aligned)
//   draw(t, info)  paints the frame at local time t (0..dur). info = {T, dur, u: t/dur}
//   cues   [[localTime, sfxName, volume?], ...] sound effects for the audio mix
//   music  optional section name for the soundtrack generator
// Scenes must be pure functions of t: any frame can be rendered in any order.

RR.SCENES = [];
RR.scene = (def) => {
  RR.SCENES.push(def);
  RR.SCENES.sort((a, b) => a.order - b.order);
  let t = 0;
  for (const s of RR.SCENES) { s.start = t; t += s.dur; }
  RR.DURATION = t;
};

RR.sceneAt = (T) => {
  for (const s of RR.SCENES) if (T >= s.start && T < s.start + s.dur) return s;
  return RR.SCENES[RR.SCENES.length - 1];
};

RR.drawScene = (T) => {
  const s = RR.sceneAt(T);
  if (!s) return;
  const t = Math.min(T - s.start, s.dur - 1e-6);
  RR.curScene = s;
  s.draw(t, { T, dur: s.dur, u: t / s.dur });
};

// Timeline for the audio generator: scene sections and absolute SFX cue times.
RR.exportTimeline = () => ({
  fps: RR.FPS, bpm: RR.BPM, duration: RR.DURATION,
  scenes: RR.SCENES.map((s) => ({ id: s.id, start: s.start, dur: s.dur, music: s.music || s.id })),
  cues: RR.SCENES.flatMap((s) => (s.cues || []).map(([t, sfx, vol]) => ({ t: +(s.start + t).toFixed(3), sfx, vol: vol ?? 1, scene: s.id })))
    .sort((a, b) => a.t - b.t),
});
