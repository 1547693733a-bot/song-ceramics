from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/kilns/longquan-panorama-v2.png"
OUTPUT_DIR = ROOT / "public/assets/kilns/longquan-knowledge"
OUTPUT = OUTPUT_DIR / "longquan-firing-mask-v1.png"
MANIFEST = OUTPUT_DIR / "asset-manifest.json"


def smoothstep(edge0: float, edge1: float, values: np.ndarray) -> np.ndarray:
    unit = np.clip((values - edge0) / (edge1 - edge0), 0.0, 1.0)
    return unit * unit * (3.0 - 2.0 * unit)


def hash01(x: np.ndarray, y: np.ndarray, salt: float) -> np.ndarray:
    value = np.sin(x * 12.9898 + y * 78.233 + salt) * 43758.5453
    return value - np.floor(value)


def build_glaze_cells(width: int, height: int) -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    # Low-amplitude coordinate warping keeps the cells organic and prevents a
    # rigid crystalline grid while preserving seamless panorama alignment.
    warp_x = xx + np.sin(yy * 0.052) * 2.4 + np.sin((xx + yy) * 0.021) * 1.3
    warp_y = yy + np.sin(xx * 0.043 + 0.7) * 2.0 + np.sin((xx - yy) * 0.026) * 1.2
    cell_size = 25.0
    grid_x = np.floor(warp_x / cell_size)
    grid_y = np.floor(warp_y / cell_size)

    nearest = np.full((height, width), np.inf, dtype=np.float32)
    second = np.full((height, width), np.inf, dtype=np.float32)
    cell_heat = np.full((height, width), 0.5, dtype=np.float32)

    for offset_y in (-1, 0, 1):
        for offset_x in (-1, 0, 1):
            candidate_x = grid_x + offset_x
            candidate_y = grid_y + offset_y
            seed_x = (candidate_x + 0.14 + hash01(candidate_x, candidate_y, 0.37) * 0.72) * cell_size
            seed_y = (candidate_y + 0.14 + hash01(candidate_x, candidate_y, 4.91) * 0.72) * cell_size
            distance = np.square(warp_x - seed_x) + np.square(warp_y - seed_y)
            candidate_heat = 0.13 + hash01(candidate_x, candidate_y, 9.73) * 0.72

            closer = distance < nearest
            second = np.where(closer, nearest, np.minimum(second, distance))
            nearest = np.where(closer, distance, nearest)
            cell_heat = np.where(closer, candidate_heat, cell_heat)

    edge_gap = np.sqrt(second) - np.sqrt(nearest)
    boundary = 1.0 - smoothstep(0.28, 1.0, edge_gap)
    boundary_image = Image.fromarray((boundary * 255.0).astype(np.uint8), mode="L")
    boundary = np.asarray(boundary_image.filter(ImageFilter.GaussianBlur(0.34)), dtype=np.float32) / 255.0
    return np.clip(boundary, 0.0, 1.0), np.clip(cell_heat, 0.0, 1.0)


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    width, height = source.size
    boundary, cell_heat = build_glaze_cells(width, height)
    interior = np.clip(1.0 - boundary, 0.0, 1.0)

    interior_full = Image.fromarray((interior * 255.0).astype(np.uint8), mode="L")
    boundary_full = Image.fromarray((boundary * 255.0).astype(np.uint8), mode="L")
    heat_full = Image.fromarray((cell_heat * 255.0).astype(np.uint8), mode="L")

    mask = np.dstack(
        (
            np.asarray(interior_full, dtype=np.uint8),
            np.asarray(boundary_full, dtype=np.uint8),
            np.asarray(heat_full, dtype=np.uint8),
        )
    )
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(mask, mode="RGB").save(OUTPUT, optimize=True)

    manifest = {
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "output": str(OUTPUT.relative_to(ROOT)).replace("\\", "/"),
        "dimensions": [width, height],
        "channels": {
            "red": "small glaze-cell interior",
            "green": "fine celadon cell boundary",
            "blue": "stable per-cell firing offset",
        },
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({width}x{height})")


if __name__ == "__main__":
    main()
