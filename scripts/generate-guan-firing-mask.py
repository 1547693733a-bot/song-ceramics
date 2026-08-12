from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "assets" / "kilns" / "guan-panorama-v3.png"
OUTPUT_DIR = ROOT / "public" / "assets" / "kilns" / "guan-knowledge"
OUTPUT = OUTPUT_DIR / "guan-firing-mask-v1.png"


def smoothstep(edge0: float, edge1: float, value: np.ndarray) -> np.ndarray:
    t = np.clip((value - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def blur(channel: np.ndarray, radius: float) -> np.ndarray:
    image = Image.fromarray(np.clip(channel, 0, 255).astype(np.uint8), mode="L")
    return np.asarray(image.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32)


def soften(mask: np.ndarray, maximum_size: int, radius: float) -> np.ndarray:
    image = Image.fromarray(np.clip(mask * 255.0, 0, 255).astype(np.uint8), mode="L")
    if maximum_size > 1:
        image = image.filter(ImageFilter.MaxFilter(maximum_size))
    return np.asarray(image.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32) / 255.0


def retain_crackle_components(
    mask: np.ndarray,
    threshold: float = 0.20,
    minimum_size: int = 72,
    minimum_span: int = 24,
) -> np.ndarray:
    binary = mask > threshold
    visited = np.zeros(binary.shape, dtype=bool)
    keep = np.zeros(binary.shape, dtype=bool)
    height, width = binary.shape

    for start_y, start_x in zip(*np.nonzero(binary)):
        if visited[start_y, start_x]:
            continue

        queue = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        min_x = max_x = int(start_x)
        min_y = max_y = int(start_y)

        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

            for offset_y in (-1, 0, 1):
                for offset_x in (-1, 0, 1):
                    if offset_x == 0 and offset_y == 0:
                        continue
                    next_y = y + offset_y
                    next_x = x + offset_x
                    if (
                        0 <= next_y < height
                        and 0 <= next_x < width
                        and binary[next_y, next_x]
                        and not visited[next_y, next_x]
                    ):
                        visited[next_y, next_x] = True
                        queue.append((next_y, next_x))

        span = max(max_x - min_x, max_y - min_y)
        if len(component) >= minimum_size or span >= minimum_span:
            for y, x in component:
                keep[y, x] = True

    return keep.astype(np.float32)


def skeletonize(binary: np.ndarray) -> np.ndarray:
    """Reduce a connected crack band to a continuous one-pixel centerline."""
    line = binary.astype(np.uint8)

    def neighbors(source: np.ndarray):
        padded = np.pad(source, 1, mode="constant")
        return (
            padded[:-2, 1:-1],
            padded[:-2, 2:],
            padded[1:-1, 2:],
            padded[2:, 2:],
            padded[2:, 1:-1],
            padded[2:, :-2],
            padded[1:-1, :-2],
            padded[:-2, :-2],
        )

    for _ in range(160):
        changed = False
        for first_pass in (True, False):
            p2, p3, p4, p5, p6, p7, p8, p9 = neighbors(line)
            count = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
            transitions = (
                ((p2 == 0) & (p3 == 1)).astype(np.uint8)
                + ((p3 == 0) & (p4 == 1)).astype(np.uint8)
                + ((p4 == 0) & (p5 == 1)).astype(np.uint8)
                + ((p5 == 0) & (p6 == 1)).astype(np.uint8)
                + ((p6 == 0) & (p7 == 1)).astype(np.uint8)
                + ((p7 == 0) & (p8 == 1)).astype(np.uint8)
                + ((p8 == 0) & (p9 == 1)).astype(np.uint8)
                + ((p9 == 0) & (p2 == 1)).astype(np.uint8)
            )
            if first_pass:
                preserve_a = p2 * p4 * p6
                preserve_b = p4 * p6 * p8
            else:
                preserve_a = p2 * p4 * p8
                preserve_b = p2 * p6 * p8
            remove = (
                (line == 1)
                & (count >= 2)
                & (count <= 6)
                & (transitions == 1)
                & (preserve_a == 0)
                & (preserve_b == 0)
            )
            if np.any(remove):
                line[remove] = 0
                changed = True
        if not changed:
            break
    return line.astype(np.float32)


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    rgb = np.asarray(source, dtype=np.float32)
    luminance = rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722

    broad_luminance = blur(luminance, 9.5)
    fine_luminance = blur(luminance, 1.15)
    local_darkness = broad_luminance - fine_luminance

    # Red: complete broad ice-crackle boundaries. Strong crack segments act as
    # anchors; the weaker nearby signal reconnects their natural, continuous
    # contours without reintroducing isolated glaze pits as firing marks.
    strong_boundary = smoothstep(7.8, 18.5, local_darkness)
    strong_boundary *= 0.54 + smoothstep(161.0, 137.0, fine_luminance) * 0.46
    crack_anchors = retain_crackle_components(strong_boundary)
    anchor_image = Image.fromarray((crack_anchors * 255.0).astype(np.uint8), mode="L")
    crack_corridor = np.asarray(
        anchor_image.filter(ImageFilter.MaxFilter(25)), dtype=np.float32
    ) / 255.0

    weak_boundary = smoothstep(1.4, 13.0, local_darkness)
    weak_boundary *= 0.48 + smoothstep(163.0, 139.0, fine_luminance) * 0.52
    weak_bridge = soften(weak_boundary, 9, 1.8)
    boundary = np.maximum(weak_boundary, weak_bridge * 0.78) * crack_corridor
    boundary_image = Image.fromarray((boundary * 255.0).astype(np.uint8), mode="L")
    boundary_image = boundary_image.filter(ImageFilter.MaxFilter(31)).filter(
        ImageFilter.MinFilter(21)
    )
    connected_band = np.asarray(boundary_image, dtype=np.float32) / 255.0
    connected_band *= retain_crackle_components(connected_band, threshold=0.08)
    boundary = skeletonize(connected_band > 0.08)
    boundary *= retain_crackle_components(
        boundary,
        threshold=0.50,
        minimum_size=150,
        minimum_span=58,
    )
    boundary = soften(boundary, 5, 0.82)

    # Green: a stable low-frequency proxy for glaze thickness and milky opacity.
    glaze_body = blur(luminance, 15.0)
    thickness = smoothstep(143.0, 174.0, glaze_body)
    thickness = blur(thickness * 255.0, 3.2) / 255.0

    # Blue: sparse pearly highlights and trapped-glaze bubble cues.
    micro_base = blur(luminance, 2.1)
    micro_highlight = luminance - micro_base
    bubbles = smoothstep(8.2, 19.0, micro_highlight) * (0.34 + thickness * 0.66)
    bubbles *= 1.0 - boundary * 0.58
    bubbles = soften(bubbles, 3, 0.48)

    mask = np.zeros((*luminance.shape, 4), dtype=np.uint8)
    mask[..., 0] = np.clip(boundary * 255.0, 0, 255).astype(np.uint8)
    mask[..., 1] = np.clip(thickness * 255.0, 0, 255).astype(np.uint8)
    mask[..., 2] = np.clip(bubbles * 255.0, 0, 255).astype(np.uint8)
    mask[..., 3] = 255

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(mask, mode="RGBA").save(OUTPUT, optimize=True)
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({source.width}x{source.height})")


if __name__ == "__main__":
    main()
