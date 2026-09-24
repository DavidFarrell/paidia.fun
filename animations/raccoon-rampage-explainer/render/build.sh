#!/usr/bin/env bash
# Full build: timeline -> frames -> soundtrack -> MP4.
#   render/build.sh                 # everything (resumes: existing frames are kept)
#   WORKERS=2 render/build.sh       # parallel Chromium workers (default 2)
#   FORCE=1 render/build.sh         # re-render every frame
set -euo pipefail
cd "$(dirname "$0")/.."
WORKERS=${WORKERS:-2}
OUT=raccoon-rampage-how-to-play.mp4

node render/render.mjs --timeline out/timeline.json
node render/render.mjs --from 0 --to 180 --workers "$WORKERS" --out out/frames ${FORCE:+--force}
python3 audio/make_audio.py
ffmpeg -y -loglevel error -framerate 24 -i out/frames/frame_%05d.jpg -i out/audio/mix.wav \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -tune animation -profile:v high -level 4.1 \
  -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT"
echo "wrote $OUT"
