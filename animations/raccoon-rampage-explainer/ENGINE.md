# Engine guide (for scene authors)

Global-mode p5.js 2.x + p5.brush 2.x, WEBGL canvas 1920 x 1080, 24 fps. Everything lives on `RR`.
Files load in the order listed in `index.html`. A scene is one file in `src/scenes/` that calls
`RR.scene({...})` (see `src/timeline.js`). `src/scenes/s01_title.js` is the reference scene.

## Hard rules

1. **Pure function of time.** `draw(t)` must depend only on `t` (local seconds). No state carried between frames.
2. **No `random()` for layout.** p5's RNG is re-seeded every 2 frames (ink "boil"). Use `RR.hr(n)`, `RR.hrange(n, a, b)`.
3. **Use the RR helpers, never raw `brush.*` primitives.** p5.brush silently drops points whose raw
   coordinates exceed about one canvas size; `RR.ink/inkLine/...` re-centre shapes to avoid this.
   Native drawing must go through `RR.flat`, `RR.flatEllipse`, `RR.text`, `RR.drawSprite`, `RR.blit`,
   which flush pending brush work first so layering is correct.
4. **Performance budget: under ~0.6 s per frame** in SwiftShader. Costs: each live `RR.ink` shape
   ~3-6 ms; a live raccoon ~200 ms, a live person ~130 ms; sprites and text are cheap (cached).
   Paint anything static or repeated (props, backgrounds, signs) once with `RR.sprite(...)`.
   Keep live characters to about 3 per frame; distant/small characters can be sprites or skipped.
5. **Text is sparse**: 2-6 word captions. Monthoers (`font: 'title'`) has letters and digits only;
   punctuation falls back to Kalam automatically. Captions use `font: 'hand'` (Patrick Hand).
6. British English. No em dashes in on-screen text.
7. Only edit your own scene file. If you need a helper, define it inside your file's IIFE.

## Timing helpers (`src/util.js`)

`RR.seg(t, a, b, ease)` 0..1 progress; `RR.tw(t, a, b, from, to, ease)` tween numbers or [x, y];
`RR.kf(t, [[t0, v0], [t1, v1, ease], ...])` keyframes; `RR.env(t, a, b, fadeIn, fadeOut)` 0-1-0 envelope;
`RR.pop(t, t0)` overshoot scale-in; `RR.hop(p, q, u, h)` arc between points; `RR.bezier`, `RR.along(pts, u)`;
`RR.wob(t, freq, seed)` smooth wobble; `RR.blinkAt(t, period)`. Eases in `RR.E` (outBack, outElastic, outBounce, inOutCubic...).
Shapes: `RR.ellipsePts`, `RR.rrectPts`, `RR.starPts`, `RR.xform`. Colours: `RR.C.*` palette, `RR.shade(hex, k)`, `RR.mix(a, b, t)`.

## Drawing (`src/gfx.js`)

- `RR.ink(pts, {fill, alpha, stroke, w, curve, hatch})` wash fill + ink outline (p5.brush). `RR.inkLine(pts, {col, w, curve})`,
  `RR.inkCircle(x, y, r, o)`, `RR.inkEllipse`, `RR.inkRect(x, y, w, h, r, o)`.
- `RR.flat(pts, col, alpha)`, `RR.flatEllipse(x, y, rx, ry, col, alpha)`, `RR.shadow(x, y, rx, ry, alpha)` fast native fills.
- `RR.water(pts, col, {layers, alpha, spread, edge})` watercolour glaze: **only inside sprites** (it is slow-ish and random).
- `RR.sprite(key, w, h, painter(w, h), {res})` paints once, returns a sprite; `RR.drawSprite(spr, x, y, {w, h, rot, alpha, sx, sy, ax, ay})`.
- `RR.text(str, x, y, {font, size, col, alpha, align, valign, rot, scale, outline, outlineW, shadow})` cached text.
  `RR.textWidth(str, o)`, `RR.wrap`, `RR.textBlock`.
- Camera: `RR.withCam(RR.cam(x, y, zoom, roll), () => { ...world drawing... })`, `RR.camKf(t, [[t, cam, ease], ...])`,
  `RR.drift(cam, t)` hand-held drift, `RR.toScreen(cam, p)`, `RR.toWorld(cam, p)`.

## Actors and props

- `RR.drawRaccoon(x, y, s, pose)` (feet at x, y; s = 1 is ~200 px). Pose: face, lean, squash, headTilt, look [dx, dy],
  blink, eyes (open/closed/happy/wide), mouth (smile/grin/open/o/flat/frown/cackle), brow (neutral/up/angry/sly/worried),
  armF/armB (0 down .. PI up), run (phase) + stride, tail (phase), tailUp, hold ('burger'|'trophy'), ear, col.
  `RR.raccoonIdle(t, extra)` gives breathing/blink/tail sway.
- `RR.drawPerson(role, x, y, s, pose)` role 'de' | 'fr' | 'ar' | 'hu' (s = 1 is ~250 px). Pose: turn, lean, squash, hop, look,
  blink, eyes, mouth (incl. 'talk' + talkT), brow, armL/armR (0 down, PI/2 out, PI up), handL/handR ([x, y] local targets,
  e.g. [60, -170] reaches forward), prop ('clipboard'|'placard'|'binoculars'|'net'|'card'|'cube'|'trophy'|'dice'),
  propHand, propRot, cardId, cardFlip, cubeRole, walk (phase). `RR.personIdle(t, seed, extra)`. `RR.PEOPLE[role]` has default props.
- Cards (`src/props/cards.js`): `RR.drawCard(id, x, y, {w, rot, flip, alpha, lift, glow, dim})`. flip 0 = back, 1 = face; animate 0..1 to flip.
  Ids: policies `protect burgers drones wear pets`, actions `behind celeb`, events `corprelief corpself bigfarm freetrade burns`
  (landscape, w 300), spread `spread0 spread1 spread2`, `rules`, backs `back:policy back:spread back:event`. Data in `RR.CARDS`.
- Pieces: `RR.drawCube(x, y, size, role)` roles de fr ar hu corp; `RR.drawToken(x, y, size, 'yellow'|'blue'|'black')`;
  `RR.drawDie(x, y, size, 'hunter'|'d6', face)`; `RR.drawMarker(x, y, size)` (impact tracker marker).
- Icons: `RR.icon(name, x, y, size, extra)` cached; names in `RR.ICONS` (raccoonFace paw crosshair skull shield mitigate star
  briefcase fist flag role scoreStar hunterDie d6 crown heart tick cross arrow).

## Board (`src/board.js`, world units, board 2400 x 1500)

`RR.board` (alias `B` inside board.js): `slot(k)` queue space centres (k 1..8, 1 = front/right), `EVAL` evaluation spot,
`MAP` rect, `lonlat(lon, lat)` world point, `SPOTS.de[i]` / `SPOTS.fr[i]` token spots in Germany/France, `SQUARES[i]`
({col, pos}) rest-of-Europe squares in fill order (6 green, 7 orange, 7 red), `track(i)` tracker space (-7..7), `DECK`,
`RULES`, `PROT` (+`PROT_R`), `story(i)` storyline slots 0..4.
Drawing: `drawStatic({sections: {base, queue, tracker, map, right, story: {alpha, scale, dy}}, only: [...]})`,
`drawTokens({de, fr, roe}, {pop: {de: [scales]...}})`, `drawTracker(v)`, `drawQueue(cards)`, `cubesOnCard(x, y, roles, {pop})`,
and **`drawState(state, {sections, skip})`** for a whole board (draws `state.eval` on the evaluation spot too).
`RR.board.SETUP` and `RR.board.STATES.{S5, MID, S6, S7, S8, S9, S10, END}` are the canonical game states (see STORYBOARD.md
"Game states"); copy with `RR.board.clone(...)` and modify. Full-board camera: `RR.cam(1200, 750, 0.66)`.

## UI (`src/ui.js`)

`RR.caption(text, t, t0, t1, {x, y, size})` paper-strip caption (default bottom centre); `RR.banner(text, t, t0, t1, {y, size, sub})`
big step title; `RR.stamp(text, x, y, t, t0, {kind: 'pass'|'fail'})`; `RR.bubble(text, x, y, tx, ty, t, t0, t1)` speech bubble;
`RR.badge(label, x, y, {r, scale})`; `RR.arrow(p, q, u, {col, w, bend})`; `RR.sparkle(x, y, t, t0)`; `RR.poof(x, y, t, t0)`;
`RR.shake(t, t0, dur, amp)` -> [dx, dy]; `RR.fadeScreen(a)`; `RR.wipe(u, {dir, out})` ink wipe;
`RR.flurry(t, t0, dur)` calendar pages and cards tumbling through the frame to hide a time skip (swap state at t0 + dur/2); `RR.scoreBoard(scores, {x, y, crown})`.

## Sound cues

List SFX in the scene's `cues: [[t, name, vol?], ...]`. Names: rattle pop boing clang chitter brush paper bite whoosh
flip slide deal tock (cube lands) ding (success) buzz (fail) stamp dice poof sparkle drumroll cheer sad scratch tick
thud pencil crumple hop.

## Rendering stills to check your work

```
node render/render.mjs --at 12.5,14,15.2 --out out/check/s02 --png
```
Times are absolute film seconds. The first frame in a fresh browser is slow (sprites are painted); later frames are fast.
Look at every still you render (they are PNG/JPEG files). `--from A --to B --step 6` renders a range.
