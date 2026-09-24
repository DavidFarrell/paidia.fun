# Raccoon Rampage: how to play (animated explainer)

A three-minute, hand-painted animated explainer for **BioInvaders! Raccoon Rampage**, built in code
with [p5.js](https://p5js.org) 2.x and [p5.brush](https://github.com/acamposuribe/p5.brush) 2.x.
Rules follow the January 2024 rulebook; game details come from raccoonrampage.ecologygames.eu and paidia.fun.

- `STORYBOARD.md`: scenes, timings, captions, rule facts, board layout and continuity hand-offs.
- `ENGINE.md`: how the engine works and how to write a scene.

## Quick start

```bash
npm install                      # p5, p5.brush, playwright, esbuild, map data
npx http-server -p 8080 -c-1 .   # then open http://localhost:8080/?t=80 (preview with scrubber)
render/build.sh                  # full render: frames, soundtrack, MP4 in out/
```

Preview in a browser is slow (every frame is painted live) but handy for scrubbing. The build renders
4,320 frames (1920 x 1080, 24 fps) in headless Chromium, generates the music and sound effects, and
encodes `out/raccoon-rampage-how-to-play.mp4` with ffmpeg. Existing frames are reused, so after
editing one scene you can delete just its frames and rebuild.

Useful commands:

```bash
node render/render.mjs --at 12.5,30 --out out/check --png          # stills at film times (seconds)
node render/render.mjs --from 80 --to 96 --step 6 --out out/seq    # a sampled range
python3 tools/sheet.py out/seq out/seq_sheet.jpg                   # contact sheet
node render/render.mjs --timeline out/timeline.json                # scene + sound-cue timeline
python3 audio/make_audio.py                                        # soundtrack from the timeline
```

## Layout

| Path | What |
|---|---|
| `index.html` | loads libraries, engine and scenes; preview UI |
| `src/config.js`, `util.js`, `gfx.js`, `ui.js`, `timeline.js`, `main.js` | engine: palette, easing, ink/watercolour/sprites/text, captions and effects, scene registry, frame loop |
| `src/board.js`, `src/data/europe.js` | the game board, map projection and board states |
| `src/props/` | cards (real cards from the game), cubes, tokens, dice, icons |
| `src/actors/` | the Raccoon and the four players |
| `src/scenes/` | one file per scene, s01 to s12 |
| `render/` | headless renderer and full build script |
| `audio/` | procedural music and sound effects |
| `tools/` | map builder, p5.brush bundle builder, paper texture generator, contact sheets |
| `lib/` | p5.js and a p5.brush build that adds `brush.flush()` |
| `assets/` | fonts (Monthoers from the game's title, Patrick Hand and Kalam under the OFL), paper textures |

## Notes

- Rendering uses Chromium's software WebGL (SwiftShader). Static art is painted once into cached
  sprites; only characters and effects are painted live each frame, with ink that "boils" at 12 fps.
- Map outlines: Natural Earth 1:50m (public domain) via `world-atlas`.
- Card faces are redrawn in the film's style from the published card images (site and box art).
  Where a cost, owner or effect is not legible in any published image (Raccoon Burgers, Hobbyist
  Hunting, Raccoonimation, Rural Sterilisation, Raccoon Land, Raccoon Helpline, and the Inaction
  card face) the values are illustrative; see the comments in `src/props/cards.js`.
- The board states follow one legal 4-player game; see "Game states" in `STORYBOARD.md`.
