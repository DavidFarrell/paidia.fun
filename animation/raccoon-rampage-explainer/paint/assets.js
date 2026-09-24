// Recipes for the painted assets. Each recipe paints with p5.brush onto a WEBGL
// canvas of size w x h (origin moved to the top-left corner).
//   tile:  post-process so the texture repeats seamlessly
//   gain:  deepen a faint painting on white
//   alpha: single-pigment painting; convert white to transparency

function mixHex(a, b, t) {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

function blob(cx, cy, r, n = 14, wobble = 0.35) {
  const pts = [];
  const off = random(1000);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    const k = 1 + (noise(off + cos(a) * 1.3, off + sin(a) * 1.3) - 0.5) * 2 * wobble;
    pts.push([cx + cos(a) * r * k, cy + sin(a) * r * k * random(0.8, 1.0)]);
  }
  return pts;
}

function fibres(count, w, h, cols, len = [6, 26], weight = [0.15, 0.45]) {
  brush.noFill();
  for (let i = 0; i < count; i++) {
    const x = random(w), y = random(h), a = random(TWO_PI), l = random(len[0], len[1]);
    brush.set('2H', random(cols), random(weight[0], weight[1]));
    brush.line(x, y, x + cos(a) * l, y + sin(a) * l);
  }
}

function mottle(R, blobs, sizes, cols, opac) {
  brush.noStroke();
  for (let i = 0; i < blobs; i++) {
    brush.fill(random(cols), random(opac[0], opac[1]));
    brush.fillBleed(random(0.08, 0.3));
    brush.fillTexture(random(0.5, 0.9), random(0.2, 0.55));
    brush.polygon(blob(random(R.w), random(R.h), random(sizes[0], sizes[1]), 16, 0.45));
  }
}

// long painted stroke used for the brush-wipe transitions
function bigStroke(R, x0, x1, yMid, thick, col) {
  const off = random(100);
  const n = 40;
  const centre = (t) => [lerp(x0, x1, t), yMid + sin(t * PI * 0.9 + 0.3) * thick * 0.08
    + (noise(off + t * 2.5) - 0.5) * thick * 0.18];
  const halfW = (t) => {
    const land = t < 0.06 ? sqrt(max(0, 1 - sq((0.06 - t) / 0.06))) : 1; // rounded landing
    const lift = t > 0.8 ? map(t, 0.8, 1, 1, 0.55) : 1;                   // brush lifting
    return thick * 0.5 * land * lift * (0.9 + noise(off + 20 + t * 4) * 0.2);
  };
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = centre(t);
    const hw = halfW(t);
    top.push([x, y - hw]);
    bot.push([x, y + hw]);
  }
  const poly = top.concat(bot.reverse());
  brush.noStroke();
  brush.wash(col, 255);
  brush.polygon(poly);
  brush.noWash();
  for (const c of [PAL.plumMid, PAL.plumDark]) {
    brush.fill(c, 110);
    brush.fillBleed(0.04);
    brush.fillTexture(0.6, 0.5);
    brush.polygon(poly);
  }
  // bristle streaks that follow the stroke
  brush.noFill();
  for (let i = 0; i < 46; i++) {
    const v = random(-0.92, 0.92);
    const ta = random(0.02, 0.3), tb = random(0.65, 1.0);
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = lerp(ta, tb, k / 8);
      const [x, y] = centre(t);
      pts.push([x, y + v * halfW(t)]);
    }
    brush.set(random(['2B', 'charcoal', 'marker']), random([PAL.plumMid, PAL.plumDark, PAL.mauve]), random(0.6, 1.8));
    brush.spline(pts, 0.6);
  }
  // dry-brush tail: bristles running out of paint
  for (let i = 0; i < 36; i++) {
    const v = random(-0.9, 0.9);
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = lerp(0.72, 1.06 + random(0.02), k / 6);
      const [x, y] = centre(min(t, 1));
      pts.push([x + max(0, t - 1) * (x1 - x0), y + v * halfW(min(t, 1)) * (1 + max(0, t - 1) * 2)]);
    }
    brush.set('charcoal', col, random(0.8, 2.2));
    brush.spline(pts, 0.5);
  }
}

const ASSETS = {
  // Paper grain for the whole frame (multiplied over every frame).
  paper: {
    w: 1920, h: 1080, seed: 11, gain: 2.2,
    async paint(R) {
      brush.scaleBrushes(2.4);
      mottle(R, 16, [160, 420], ['#e6ded0', '#ebe3d6', '#e2d8cb'], [22, 45]);
      fibres(2200, R.w, R.h, ['#ddd4c6', '#d3c9b9', '#e6dfd3', '#cfc4b3']);
      brush.noFill();
      for (let i = 0; i < 600; i++) {
        const x = random(R.w), y = random(R.h);
        brush.set('HB', random(['#cdc2b1', '#d8cfc1']), random(0.2, 0.5));
        brush.line(x, y, x + random(-2, 2), y + random(-2, 2));
      }
    },
  },

  // Tileable watercolour blotches, multiplied over shapes for texture.
  mottle: {
    w: 1024, h: 1024, seed: 21, tile: true, gain: 4,
    async paint(R) {
      brush.scaleBrushes(2);
      mottle(R, 26, [70, 260], ['#8f8797', '#9c8f86', '#8a8f9c'], [16, 40]);
      fibres(500, R.w, R.h, ['#b9b2ba', '#c6bfb5']);
    },
  },

  mottle_fine: {
    w: 1024, h: 1024, seed: 31, tile: true, gain: 4,
    async paint(R) {
      brush.scaleBrushes(1.6);
      mottle(R, 40, [30, 120], ['#8f8797', '#9d9088', '#8a909d'], [14, 34]);
      fibres(900, R.w, R.h, ['#b3acb4', '#c2baaf'], [4, 14]);
    },
  },

  // Big painted strokes (plum) for the brush-wipe transitions.
  stroke_a: {
    w: 2600, h: 760, seed: 51, alpha: '#3f3042',
    async paint(R) { brush.scaleBrushes(3); bigStroke(R, 60, 2440, 380, 520, '#3f3042'); },
  },
  stroke_b: {
    w: 2600, h: 760, seed: 52, alpha: '#3f3042',
    async paint(R) { brush.scaleBrushes(3); bigStroke(R, 80, 2460, 370, 560, '#3f3042'); },
  },
  stroke_c: {
    w: 2600, h: 760, seed: 53, alpha: '#3f3042',
    async paint(R) { brush.scaleBrushes(3); bigStroke(R, 50, 2420, 390, 500, '#3f3042'); },
  },

  // The painted map of Europe used on the board and in the intro.
  map: {
    w: 1800, h: 1200, seed: 71,
    async paint(R) {
      const data = await (await fetch('../data/europe.json')).json();
      brush.scaleBrushes(2.2);
      brush.noStroke();
      brush.wash(PAL.sea, 255);
      brush.rect(0, 0, R.w, R.h);
      brush.noWash();
      mottle(R, 12, [200, 500], [PAL.seaDeep, '#a7b3cc', '#9fa6c4'], [30, 60]);
      const tones = [PAL.land, PAL.land2, PAL.land3, '#e8d8c0', '#dfd2b8'];
      const area = (r) => Math.abs(r.reduce((s, p, i) => {
        const q = r[(i + 1) % r.length];
        return s + p[0] * q[1] - q[0] * p[1];
      }, 0) / 2);
      // coast glow: a pale halo painted just around the land
      brush.noFill();
      for (const c of data.countries) {
        for (const ring of c.rings) {
          if (area(ring) < 900) continue;
          brush.set('marker', '#cdd6e4', 3.2);
          brush.polygon(ring);
        }
      }
      brush.noStroke();
      // opaque land first so the sea never shows through, then watercolour on top
      data.countries.forEach((c, ci) => {
        const tone = c.iso === 'DEU' ? '#eadcbd' : c.iso === 'FRA' ? '#e6dac6' : tones[ci % tones.length];
        for (const ring of c.rings) {
          brush.wash(tone, 255);
          brush.polygon(ring);
        }
      });
      brush.noWash();
      data.countries.forEach((c, ci) => {
        const tone = c.iso === 'DEU' ? '#eadcbd' : c.iso === 'FRA' ? '#e6dac6' : tones[ci % tones.length];
        for (const ring of c.rings) {
          const a = area(ring);
          if (a < 2500 || a > 350000) continue;
          brush.fill(mixHex(tone, '#b39c7c', 0.35), 70);
          brush.fillBleed(0.02);
          brush.fillTexture(0.75, 0.5);
          brush.polygon(ring);
        }
      });
      // borders and coastline
      brush.noFill();
      for (const c of data.countries) {
        for (const ring of c.rings) {
          brush.set('HB', PAL.inkSoft, area(ring) < 900 ? 0.7 : 1.1);
          brush.polygon(ring);
        }
      }
    },
  },

  // Lavender backdrop in the spirit of the box cover.
  lavender: {
    w: 1920, h: 1080, seed: 91,
    async paint(R) {
      brush.scaleBrushes(2.6);
      brush.noStroke();
      brush.wash('#c8b8d0', 255);
      brush.rect(0, 0, R.w, R.h);
      brush.noWash();
      mottle(R, 12, [200, 520], ['#b8a5c4', '#d3c3d9', '#a996b6'], [40, 80]);
      for (let i = 0; i < 5; i++) {
        brush.fill(random(['#e7bccd', '#f0c9d4', '#dcb2cb']), random(60, 110));
        brush.fillBleed(0.3);
        brush.fillTexture(0.6, 0.3);
        brush.polygon(blob(R.w * random(0.35, 0.65), R.h * random(0.1, 0.35), random(200, 380), 16, 0.3));
      }
      fibres(700, R.w, R.h, ['#b3a2bd', '#d9cce0']);
    },
  },

};
