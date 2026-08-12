from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "assets" / "kilns" / "ge-panorama.png"
OUTPUT_DIR = ROOT / "public" / "assets" / "kilns" / "ge-knowledge"
OUTPUT = OUTPUT_DIR / "ge-crackle-dual-mask-v1.png"


def smoothstep(edge0: float, edge1: float, value: np.ndarray) -> np.ndarray:
    t = np.clip((value - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def blur_channel(channel: np.ndarray, radius: float) -> np.ndarray:
    image = Image.fromarray(np.clip(channel, 0, 255).astype(np.uint8), mode="L")
    return np.asarray(image.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32)


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    rgb = np.asarray(source, dtype=np.float32)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722

    local_luminance = blur_channel(luminance, 7.0)
    local_darkness = local_luminance - luminance
    warmth = red - (green + blue) * 0.5
    local_warmth = warmth - (blur_channel(warmth + 128.0, 5.0) - 128.0)

    # Iron-wire crackle: broad, cool-dark fissures with strong local contrast.
    iron_contrast = smoothstep(5.0, 26.0, local_darkness)
    iron_value = smoothstep(151.0, 104.0, luminance)
    iron_coolness = 1.0 - smoothstep(13.0, 24.0, warmth)
    iron = iron_contrast * (0.42 + iron_value * 0.58) * (0.66 + iron_coolness * 0.34)
    iron_image = Image.fromarray(np.clip(iron * 255.0, 0, 255).astype(np.uint8), mode="L")
    iron_image = iron_image.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.72))
    iron = np.asarray(iron_image, dtype=np.float32) / 255.0

    # Gold-thread crackle: fine warm-brown lines that stand out from the milky glaze.
    gold_warm = smoothstep(12.0, 25.0, warmth)
    gold_local = smoothstep(1.4, 8.5, local_warmth)
    gold_detail = smoothstep(0.8, 10.0, local_darkness)
    gold = gold_warm * (0.30 + gold_local * 0.70) * (0.34 + gold_detail * 0.66)
    gold *= 1.0 - iron * 0.74
    gold_image = Image.fromarray(np.clip(gold * 255.0, 0, 255).astype(np.uint8), mode="L")
    gold_image = gold_image.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.55))
    gold = np.asarray(gold_image, dtype=np.float32) / 255.0

    mask = np.zeros((*luminance.shape, 4), dtype=np.uint8)
    mask[..., 0] = np.clip(iron * 255.0, 0, 255).astype(np.uint8)
    mask[..., 1] = np.clip(gold * 255.0, 0, 255).astype(np.uint8)
    mask[..., 2] = np.maximum(mask[..., 0], mask[..., 1])
    mask[..., 3] = 255

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(mask, mode="RGBA").save(OUTPUT, optimize=True)
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({source.width}x{source.height})")


if __name__ == "__main__":
    main()
