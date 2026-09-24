"""Contact sheet of rendered frames with frame times, for reviewing motion.
   python3 tools/sheet.py out/check/s02 out/check/s02_sheet.jpg [--cols 4] [--width 1920]"""
import sys, glob, os, argparse
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--cols', type=int, default=4); ap.add_argument('--width', type=int, default=1920)
a = ap.parse_args()
files = sorted(glob.glob(os.path.join(a.src, 'frame_*.*')))
if not files: sys.exit('no frames in ' + a.src)
tw = a.width // a.cols; th = tw * 9 // 16
rows = (len(files) + a.cols - 1) // a.cols
sheet = Image.new('RGB', (tw * a.cols, th * rows), 'white')
draw = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', max(12, tw // 20))
except Exception: font = None
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th))
    x, y = (i % a.cols) * tw, (i // a.cols) * th
    sheet.paste(im, (x, y))
    n = int(os.path.basename(f).split('_')[1].split('.')[0])
    draw.rectangle([x, y, x + tw // 4, y + tw // 16], fill='black')
    draw.text((x + 4, y + 2), f'{n / 24:.2f}s', fill='white', font=font)
sheet.save(a.dst, quality=88)
print('wrote', a.dst, len(files), 'frames')
