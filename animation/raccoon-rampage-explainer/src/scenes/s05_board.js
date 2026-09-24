// Scene 5: the board assembles itself. Also defines the example game state
// shared by the rules scenes that follow.

const CARDS = {
  breeding: { type: 'policy', title: 'Protect Breeding Sites', cost: 5, owner: 'de', art: 'nest', effect: { icon: 'mitigate', n: 2 }, score: 'paw' },
  drones: { type: 'policy', title: 'Drone Zappers', cost: 7, owner: 'fr', art: 'drone', effect: { icon: 'die', n: 1 }, score: 'hunt', artBg: '#9fc6dc' },
  helpline: { type: 'policy', title: 'Raccoon Helpline', cost: 3, owner: 'ar', art: 'helpline', effect: { icon: 'mitigate', n: 1 }, score: 'paw' },
  wear: { type: 'policy', title: 'Wear Them', cost: 3, owner: 'hu', art: 'hat', effect: { icon: 'die', n: 1 }, score: 'hunt' },
  pets: { type: 'policy', title: 'No More Pets', cost: 5, owner: 'ar', art: 'pets', effect: { icon: 'shield', n: 2 }, score: 'paw' },
  burgers: { type: 'policy', title: 'Raccoon Burgers', cost: 3, art: 'burger', effect: { icon: 'die', n: 2 }, score: 'hunt' },
  bins: { type: 'policy', title: 'Raccoon-Proof Bins', cost: 3, owner: 'de', art: 'bins', effect: { icon: 'mitigate', n: 1 } },
};
const Y = PAL.yellow, B = PAL.blue, PK = PAL.pink, G = PAL.green;
// the queue at the start of our example turn: slot -> card and votes
const QUEUE0 = {
  1: { ...CARDS.breeding, votes: [Y, Y, Y, PK, B] },
  2: { ...CARDS.drones, votes: [B, B, B, G] },
  3: { ...CARDS.helpline, votes: [PK] },
  4: { ...CARDS.wear, votes: [G] },
  5: { ...CARDS.pets, down: true },
  6: { ...CARDS.burgers, down: true },
  7: { ...CARDS.bins, down: true },
  8: { type: 'back', down: true },
};
const CARD_W = 172, CARD_H = 240;

function queueCard(spec, x, y, o = {}) {
  card({ ...spec, x, y, w: CARD_W, h: CARD_H, flip: spec.down ? 1 : 0, ...o, votes: spec.down ? null : o.votes ?? spec.votes, seed: o.seed ?? hash(spec.title?.length || 3) * 50 });
}

// starting tokens (tutorial set-up): 10 yellow in Germany, 5 blue in France,
// 5 black on green spaces
function startTokens(a = null) {
  const list = [];
  for (let i = 0; i < 10; i++) list.push({ kind: 'de', i, a: a === null ? undefined : a + i * 3 });
  for (let i = 0; i < 5; i++) list.push({ kind: 'fr', i, a: a === null ? undefined : a + 10 + i * 4 });
  for (let i = 0; i < 5; i++) list.push({ kind: 'eu', i, a: a === null ? undefined : a + 20 + i * 4 });
  return list;
}

function storyCards(f, flipped = 0, o = {}) {
  for (let k = 0; k < 5; k++) {
    const [x, y] = storyPos(k);
    const flip = k < flipped ? 0 : 1;
    const ev = STORY_EVENTS[k];
    card({ type: 'event', title: ev.title, art: ev.art, artBg: ev.bg, artT: 1, x, y, w: 150, h: 200, flip: o.flipT && k === flipped - 1 ? 1 - o.flipT : flip, backType: 'back', seed: 70 + k });
  }
}
// Big Tech Rules Europe, the tutorial scenario
const STORY_EVENTS = [
  { title: 'Corporate Relief', art: 'city', bg: '#f1c7a1' },
  { title: 'Corporate Self Interest', art: 'treaty', bg: '#c9d9ea' },
  { title: 'Big Farm Corp', art: 'farm', bg: '#e8d59a' },
  { title: 'Free Trade', art: 'trade', bg: '#bcd6e8' },
  { title: 'Europe Burns', art: 'fire', bg: '#f0a36e' },
];

scene({
  id: 'board', bars: 4, mood: 'bouncy', trans: { type: 'brush', len: 36, stroke: 'stroke_a', dir: -1 },
  draw(f) {
    tableBG(f);
    const z = kf(f, [[0, 0.5], [70, 0.66, E.outQ], [240, 0.69]]);
    const rot = kf(f, [[0, -0.07], [70, 0, E.outQ]]);
    const lift = (1 - ez(f, 0, 40, E.outBack)) * 900;
    cam(1200, 760 + lift, z, rot, () => {
      boardBase();
      // queue cards deal in from the top right
      for (let i = 8; i >= 1; i--) {
        const a = 26 + (8 - i) * 5;
        const t = ez(f, a, a + 16, E.outQ);
        if (t <= 0) continue;
        const [x, y] = qpos(i);
        const spec = QUEUE0[i];
        queueCard(spec, lerp(2600, x, t), lerp(-500, y, t), { rot: (1 - t) * 0.6, votes: [] });
        cue('card', a, 0.35);
      }
      mapSpaces(1);
      drawTokens(startTokens(64), f);
      for (let i = 0; i < 20; i += 4) cue('pop', 64 + i * 3, 0.3);
      // tracker marker hops onto the neutral start
      const mt = ez(f, 104, 120, E.outBack);
      if (mt > 0) trackerMarker(0, f);
      cue('boing', 106, 0.5);
      // spread deck and storyline
      const dt = ez(f, 96, 112, E.outBack);
      if (dt > 0) card({ type: 'spreadBack', x: BOARD.deck[0], y: BOARD.deck[1], w: CARD_W, h: CARD_H, s: dt, seed: 90 });
      for (let k = 0; k < 5; k++) {
        const a = 112 + k * 5;
        const t = ez(f, a, a + 14, E.outQ);
        if (t <= 0) continue;
        const [x, y] = storyPos(k);
        card({ type: 'back', x: lerp(x, x, t), y: lerp(1900, y, t), w: 150, h: 200, seed: 70 + k });
        cue('card', a, 0.3);
      }
      tag(1000, 70, 'POLICY QUEUE', f, 138, 250, { size: 50 });
      tag(1150, 500, 'EUROPE', f, 150, 250, { size: 50 });
      tag(310, 505, 'IMPACT TRACKER', f, 162, 250, { size: 50 });
      tag(2040, 470, 'RACCOON SPREAD', f, 174, 250, { size: 50 });
      tag(1200, 1215, 'STORYLINE', f, 186, 250, { size: 50 });
      for (let k = 0; k < 5; k++) cue('pop', 138 + k * 12, 0.45);
    });
    caption(f, 196, 250, '5 ROUNDS, 5 YEARS EACH', { size: 60, y: 560 });
  },
});
