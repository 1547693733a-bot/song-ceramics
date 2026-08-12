"""Derive a panorama-aligned Ding relief mask from the live source material.

Red stores impressed or incised recess depth, green stores raised ivory ridges,
and blue stores the deepest glaze reservoirs that may reach a white-hot core.
No ornament is invented: every response is extracted from ding-panorama-v3.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "assets" / "kilns" / "ding-panorama-v3.png"
OUTPUT_DIR = ROOT / "public" / "assets" / "kilns" / "ding-knowledge"
OUTPUT = OUTPUT_DIR / "ding-impression-depth-mask-v1.png"


def smoothstep(low: float, high: float, value: np.ndarray) -> np.ndarray:
    scaled = np.clip((value - low) / (high - low), 0.0, 1.0)
    return scaled * scaled * (3.0 - 2.0 * scaled)


def blur(channel: np.ndarray, radius: float) -> np.ndarray:
    image = Image.fromarray(np.clip(channel, 0, 255).astype(np.uint8), mode="L")
    return np.asarray(image.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32)


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    rgb = np.asarray(source, dtype=np.float32)
    luminance = rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722

    fine = blur(luminance, 1.8)
    local = blur(luminance, 10.5)
    broad = blur(luminance, 24.0)
    local_dark = local - fine
    local_light = fine - local

    gradient_y, gradient_x = np.gradient(blur(luminance, 2.5))
    gradient = np.sqrt(gradient_x * gradient_x + gradient_y * gradient_y)
    relief_gate = smoothstep(2.0, 10.5, np.abs(fine - local))
    contour_gate = smoothstep(1.2, 6.8, gradient) * (0.30 + relief_gate * 0.70)

    depression = smoothstep(1.2, 12.5, local_dark)
    depression = np.maximum(depression, contour_gate * smoothstep(-1.0, 5.5, local_dark) * 0.72)
    depression *= 0.70 + smoothstep(2.0, 15.0, broad - fine) * 0.30
    depression = blur(depression * 255.0, 0.72) / 255.0
    depression = smoothstep(0.16, 0.82, depression)

    raised_ridge = smoothstep(1.3, 13.0, local_light)
    raised_ridge = np.maximum(raised_ridge, contour_gate * smoothstep(-1.0, 5.0, local_light) * 0.64)
    raised_ridge *= 1.0 - depression * 0.46
    raised_ridge = blur(raised_ridge * 255.0, 0.58) / 255.0
    raised_ridge = smoothstep(0.18, 0.84, raised_ridge)

    reservoir = smoothstep(0.42, 0.93, depression)
    reservoir = blur(reservoir * 255.0, 2.2) / 255.0
    reservoir *= smoothstep(0.16, 0.72, depression)

    mask = np.zeros((*luminance.shape, 4), dtype=np.uint8)
    mask[..., 0] = np.clip(depression * 255.0, 0, 255).astype(np.uint8)
    mask[..., 1] = np.clip(raised_ridge * 255.0, 0, 255).astype(np.uint8)
    mask[..., 2] = np.clip(reservoir * 255.0, 0, 255).astype(np.uint8)
    mask[..., 3] = 255

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(mask, mode="RGBA").save(OUTPUT, optimize=True)
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({source.width}x{source.height})")


if __name__ == "__main__":
    main()
