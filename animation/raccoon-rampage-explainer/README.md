# Raccoon Rampage: How to Play (animated explainer)

A roughly 3-minute hand-painted animation that explains how *BioInvaders! Raccoon Rampage*
works. It is built programmatically with **p5.js** and **p5.brush**, then rendered
to MP4 with headless Chromium and ffmpeg. The soundtrack is synthesised too.

- Storyboard: [`STORYBOARD.md`](STORYBOARD.md)
- Rules source: the January 2024 rulebook; context from paidia.fun and
  [ecologygames-eu/ecologygames_raccoon](https://github.com/ecologygames-eu/ecologygames_raccoon)

## How it is built

1. **Paint (p5.brush, WEBGL).** `paint/assets.js` holds recipes that p5.brush paints once
   into `assets/*.png`: paper grain, tileable watercolour mottles, pencil hatching,
   big wet brush strokes (for wipes and caption banners), a lavender backdrop and a
   watercolour map of Europe drawn from Natural Earth borders (`data/europe.json`).
2. **Animate (p5.js, 2D).** `src/` draws every frame. Shapes get a flat colour plus
   the p5.brush watercolour texture, pooled edges and a variable-width ink line
   (`src/engine/paint2d.js`), so moving characters match the painted assets.
   - `src/actors/`: the raccoon (poses, walk cycle, expressions, props), the four
     players, and the game pieces and board (cards, cubes, tokens, dice, Impact Tracker,
     queue, map, spread area, storyline).
   - `src/scenes/`: 13 scenes on a 120 BPM grid (1 bar = 2 s = 60 frames).
   - `src/engine/timeline.js`: scene timing, transitions (brush wipe, iris, fade)
     and the audio cues that scenes register at exact frames.
3. **Render.** `tools/render.mjs` runs several headless Chromium workers. Each one
   streams raw frames into its own ffmpeg process, and the chunks are then joined.
4. **Sound.** `tools/audio.py` writes the music (moods follow the scenes) and places
   synthesised sound effects on the recorded cues.

## Requirements

- Node 18+ and `npm install` (installs Playwright; Chromium must be available: set
  `CHROMIUM_PATH` or run `npx playwright install chromium`)
- ffmpeg on the PATH
- Python 3 with numpy and scipy (for the soundtrack)

## Commands

```bash
npm install

# preview in a browser (space = play/pause, arrows = step, ?f=1234 to jump)
npx http-server . -p 8080   # or any static server, then open /src/index.html

# render selected frames to out/frames/*.jpg for checking
node tools/preview.mjs 0 480 960
node tools/preview.mjs --scene evaluate 8

# repaint the p5.brush assets (optional; they are committed)
node tools/paint.mjs            # all, or: node tools/paint.mjs map paper

# full render: video, then soundtrack, then mux
node tools/render.mjs --workers 3 --crf 18        # out/video_silent.mp4, out/cues.json
python3 tools/audio.py out/timeline.json out/cues.json out/audio.wav
ffmpeg -y -i out/video_silent.mp4 -i out/audio.wav -c:v copy -c:a aac -b:a 192k \
  -shortest -movflags +faststart out/raccoon-rampage-how-to-play.mp4
```

`data/europe.json` is rebuilt with `tools/build_map.py` and `tools/build_spaces.py`
from Natural Earth's `ne_50m_admin_0_countries.geojson`.

## Credits

The game is by Paidia (game design Col Anderson and David Farrell, art Kristina Tsenova)
with scientists from the InvasiBES and AlienScenarios projects. The fonts (Monthoers,
Littlejoodles) are the game's own and are copied from the site's `static/fonts`.
The map is based on Natural Earth (public domain).
