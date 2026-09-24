#!/usr/bin/env bash
# Full build: render the frames, synthesise the soundtrack, mux the MP4.
set -euo pipefail
cd "$(dirname "$0")/.."
WORKERS="${WORKERS:-3}"
node tools/render.mjs --workers "$WORKERS" --crf "${CRF:-18}"
python3 tools/audio.py out/timeline.json out/cues.json out/audio.wav
ffmpeg -y -loglevel error -i out/video_silent.mp4 -i out/audio.wav -c:v copy -c:a aac -b:a 192k \
  -shortest -movflags +faststart out/raccoon-rampage-how-to-play.mp4
echo "done: out/raccoon-rampage-how-to-play.mp4"
