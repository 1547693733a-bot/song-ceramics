"""Blend a narrow panorama edge band into a periodic horizontal seam."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--band", type=int, default=64)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGB")
    pixels = np.asarray(source, dtype=np.float32).copy()
    width = pixels.shape[1]
    band = max(2, min(args.band, width // 4))

    for offset in range(band):
        left = pixels[:, offset, :].copy()
        right = pixels[:, width - 1 - offset, :].copy()
        pair_average = (left + right) * 0.5
        normalized = offset / float(band - 1)
        weight = (1.0 - normalized) ** 2 * (3.0 - 2.0 * (1.0 - normalized))
        pixels[:, offset, :] = left * (1.0 - weight) + pair_average * weight
        pixels[:, width - 1 - offset, :] = right * (1.0 - weight) + pair_average * weight

    args.output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.uint8(np.clip(pixels, 0.0, 255.0)), "RGB").save(args.output, optimize=True)


if __name__ == "__main__":
    main()
