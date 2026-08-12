"""Derive a panorama-aligned Yaozhou carved-groove depth mask.

White marks the deepest glaze-filled cuts, mid gray marks shallower relief,
and black preserves raised or flat celadon planes.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def smoothstep(low: float, high: float, value: np.ndarray) -> np.ndarray:
    scaled = np.clip((value - low) / (high - low), 0.0, 1.0)
    return scaled * scaled * (3.0 - 2.0 * scaled)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGB")
    rgb = np.asarray(source, dtype=np.float32) / 255.0
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    luminance = red * 0.299 + green * 0.587 + blue * 0.114

    local_average = np.asarray(
        Image.fromarray(np.uint8(np.clip(luminance * 255.0, 0.0, 255.0)), "L").filter(
            ImageFilter.GaussianBlur(radius=9.0)
        ),
        dtype=np.float32,
    ) / 255.0

    local_cut = smoothstep(0.012, 0.155, local_average - luminance)
    pooled_darkness = smoothstep(0.08, 0.31, 0.50 - luminance)
    olive_depth = smoothstep(0.025, 0.16, green - blue)
    relief_depth = np.maximum(local_cut**0.82, pooled_darkness**1.35 * 0.66)
    mask = relief_depth * (0.68 + olive_depth * 0.32)

    mask_image = Image.fromarray(np.uint8(np.clip(mask * 255.0, 0.0, 255.0)), "L")
    mask_image = mask_image.filter(ImageFilter.GaussianBlur(radius=0.75))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    mask_image.save(args.output, optimize=True)


if __name__ == "__main__":
    main()
