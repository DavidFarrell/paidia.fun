"""Generates the paper background and the multiply grain overlay (assets/paper.jpg, assets/grain.png)."""
import numpy as np
from PIL import Image, ImageFilter

W, H = 1920, 1080
rng = np.random.default_rng(7)

def smooth_noise(scale, octaves=4):
    out = np.zeros((H, W), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        s = max(2, int(scale / (2 ** o)))
        small = rng.random((H // s + 2, W // s + 2)).astype(np.float32)
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((W + 2 * s, H + 2 * s), Image.BICUBIC)
        arr = np.asarray(img, np.float32)[s:s + H, s:s + W] / 255.0
        out += amp * arr; total += amp; amp *= 0.5
    return out / total

# Paper: warm cream with large soft mottling
base = np.array([241, 232, 218], np.float32)
mott = smooth_noise(420, 4) - 0.5
paper = base[None, None, :] * (1 + 0.035 * mott[..., None])
Image.fromarray(np.clip(paper, 0, 255).astype(np.uint8)).save('assets/paper.jpg', quality=95)

# Grain overlay for MULTIPLY: fine tooth + horizontal-ish fibres + blotches + vignette
fine = rng.random((H, W)).astype(np.float32)
fine = np.asarray(Image.fromarray((fine * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)), np.float32) / 255.0
fib_src = rng.random((H // 2, W // 16)).astype(np.float32)
fib = np.asarray(Image.fromarray((fib_src * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255.0
blot = smooth_noise(160, 3)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = ((xx / W - 0.5) ** 2 * 1.0 + (yy / H - 0.5) ** 2 * 1.3)
vign = 1 - 0.30 * d
g = (1 - 0.060 * (fine - 0.5) * 2) * (1 - 0.025 * (fib - 0.5) * 2) * (1 - 0.03 * (blot - 0.5) * 2) * vign
g = np.clip(g * 255, 0, 255).astype(np.uint8)
Image.fromarray(np.stack([g, g, g], -1)).save('assets/grain.png', optimize=True)
print('ok', g.min(), g.max())
