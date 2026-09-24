// Global configuration, palette and shared namespace.
// Every module hangs its exports off `RR` so scene files can stay plain scripts.
const RR = (window.RR = {});

RR.W = 1920;
RR.H = 1080;
RR.FPS = 24;
RR.BOIL = 2;          // live ink "boils" (re-seeds) every 2 frames = 12 drawings per second
RR.BPM = 120;         // music tempo: 1 beat = 0.5 s = 12 frames, 1 bar = 2 s
RR.BRUSH_SCALE = 2.4;
RR.FB_FLIP = false;   // set true if framebuffer textures come out upside down in RR.blit
RR.TEXT_RES = 1.5;     // resolution multiplier for cached text sprites

// Palette sampled from the game's art direction (board, cards, box).
RR.C = {
  paper: '#f1e8da', paperShade: '#e4d6c0', ink: '#2e2733', inkSoft: '#5b5060',
  plumDark: '#3b3140', plum: '#554356', plumMid: '#6e5a6b', mauve: '#8c7289',
  lilac: '#b9a4b7', blush: '#ecd1d4', pink: '#e3a9b9', rose: '#d7899f',
  card: '#efe3cc', cardEdge: '#d6c3a0', cardDark: '#4a3d4c', eventPink: '#f5dfdf',
  fur: '#8a7f8e', furDark: '#5b5262', furShade: '#6f6576', mask: '#2b2531',
  muzzle: '#f3eadb', tailLight: '#ecdfc8', tailDark: '#3d3543', earInner: '#d9a8b1', nose: '#2b2531',
  // Player colours (cubes, jackets): DE yellow, FR blue, AR pink, HU green, corporate grey.
  de: '#e9b52f', fr: '#4f7fbd', ar: '#e28aac', hu: '#5f9d4d', corp: '#8f8a93',
  deDark: '#b48511', frDark: '#35598d', arDark: '#b35c80', huDark: '#3f6d33', corpDark: '#646068',
  // Raccoon tokens: yellow = Germany, blue = France, black = rest of Europe.
  tokYellow: '#eac552', tokBlue: '#79a4d6', tokBlack: '#3d3644',
  // Impact tracker, spread squares and spread cards.
  green: '#7fb56b', greenLight: '#bcd9a0', greenDeep: '#4f8a4a', neutral: '#d8d0c0',
  orange: '#ee9d55', red: '#dc5f52', redDeep: '#a8403e',
  teal: '#6fb3a8', tealDark: '#3f7f77', spread1: '#e58b4a', spread2: '#a94b5a',
  gold: '#e2b04a', goldDark: '#b0822a', white: '#fbf7ef',
  // Map
  sea: '#cbd9d3', land: '#d9ccb6', landEdge: '#b9a88e', franceTint: '#a8bfdc', germanyTint: '#ecd488',
  skin1: '#f1c7a5', skin2: '#c98f68', skin3: '#8d5c3f', skin4: '#e9b894', hair1: '#3b2b25', hair2: '#8a5a32',
};

RR.ROLES = {
  de: { name: 'German Environmental Agency', short: 'GERMANY', col: RR.C.de, dark: RR.C.deDark, influence: 3 },
  fr: { name: 'French Environmental Agency', short: 'FRANCE', col: RR.C.fr, dark: RR.C.frDark, influence: 3 },
  ar: { name: 'Animal Rights Activist', short: 'ANIMAL RIGHTS', col: RR.C.ar, dark: RR.C.arDark, influence: 1 },
  hu: { name: 'Hunting Lobbyist', short: 'HUNTER', col: RR.C.hu, dark: RR.C.huDark, influence: 1 },
};

// Glyph coverage of the display font (Monthoers has letters and digits only);
// RR.text falls back per character to Kalam Bold for everything else.
RR.FONT_COVERAGE = {
  title: ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
};

RR.INITS = [];   // functions run once after assets load (see main.js)
RR.fonts = {};
RR.img = {};
