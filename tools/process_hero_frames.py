"""Crop/key EXORCIST INK hero sources to 96x96 PNG alpha, pivot (48, 88)."""

from __future__ import annotations

import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

FRAME = 96
PIVOT_X = 48
PIVOT_Y = 88
FOOT_GAP = 8
TOP_PAD = 4
SIDE_PAD = 3
TARGET_BODY_H = 76

SRC_DIR = Path(r"C:\Users\Miden001\.cursor\projects\c-Users-Miden001-Documents-Cursor\assets")
REPO = Path(r"C:\Users\Miden001\Documents\Cursor\exorcist-ink")
CONCEPT_SRC = REPO / "public" / "assets" / "concept" / "hero_src"
OUT_DIR = REPO / "public" / "assets" / "hero"
PREVIEW = REPO / "public" / "assets" / "concept" / "hero_phase1_contact.png"

DIRS = ("n", "ne", "e", "se", "s", "sw", "w", "nw")

IDLE_SRC = {
    "n": "hero_sword_idle_n_master.jpg",
    "ne": "hero_sword_idle_ne_master.jpg",
    "e": "hero_sword_idle_e_master.jpg",
    "se": "hero_sword_idle_se_master.jpg",
    "s": "hero_sword_idle_s_master.jpg",
    "sw": "hero_sword_idle_sw_master.jpg",
    "w": "hero_sword_idle_w_master.jpg",
    "nw": "hero_sword_idle_nw_master.jpg",
}


def _stats(r: int, g: int, b: int) -> tuple[float, int]:
    v = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sat = max(r, g, b) - min(r, g, b)
    return v, sat


def is_backdrop(r: int, g: int, b: int) -> bool:
    """True only for neutral near-black paper — never keyed purple robe soot."""
    v, sat = _stats(r, g, b)
    purple = (b >= g + 3) or (r >= g + 6)
    if purple and sat >= 8:
        return False
    if v < 11:
        return True
    if v < 22 and sat < 12:
        return True
    return False


def flood_key(im: Image.Image) -> Image.Image:
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        r, g, b = px[x, y]
        if is_backdrop(r, g, b):
            bg[y][x] = True
            q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if nx < 0 or ny < 0 or nx >= w or ny >= h or bg[ny][nx]:
                continue
            r, g, b = px[nx, ny]
            if is_backdrop(r, g, b):
                bg[ny][nx] = True
                q.append((nx, ny))

    rgba = rgb.convert("RGBA")
    out = rgba.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _a = out[x, y]
            if not bg[y][x]:
                out[x, y] = (r, g, b, 255)
                continue
            # soft fringe: keep a whisper of nearby cloth so dry-brush isn't a hard cut
            v, sat = _stats(r, g, b)
            if sat >= 10 and v >= 14:
                out[x, y] = (r, g, b, 90)
            else:
                out[x, y] = (r, g, b, 0)
    return rgba


def alpha_bbox(im: Image.Image, t: int = 18) -> tuple[int, int, int, int]:
    a = im.getchannel("A")
    mask = a.point(lambda p: 255 if p >= t else 0)
    box = mask.getbbox()
    if box is None:
        raise RuntimeError("empty alpha")
    return box


def foot_line(im: Image.Image, box: tuple[int, int, int, int]) -> int:
    """Bottom-most opaque row in the middle 50% of the body (ignore sword tips)."""
    l, t, r, b = box
    a = im.getchannel("A")
    px = a.load()
    mid_l = l + int((r - l) * 0.25)
    mid_r = r - int((r - l) * 0.25)
    for y in range(b - 1, t, -1):
        hits = 0
        for x in range(mid_l, mid_r):
            if px[x, y] >= 40:
                hits += 1
        if hits >= max(4, (mid_r - mid_l) // 10):
            return y
    return b - 1


def place(im: Image.Image, scale: float) -> Image.Image:
    box = alpha_bbox(im)
    foot_y = foot_line(im, box)
    cx = (box[0] + box[2]) / 2.0
    src_w, src_h = im.size
    new_w = max(1, int(round(src_w * scale)))
    new_h = max(1, int(round(src_h * scale)))
    scaled = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    dest = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    paste_x = int(round(PIVOT_X - cx * scale))
    paste_y = int(round(PIVOT_Y - foot_y * scale))
    dest.alpha_composite(scaled, (paste_x, paste_y))
    shadow = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse((PIVOT_X - 13, PIVOT_Y - 2, PIVOT_X + 13, PIVOT_Y + 5), fill=(8, 10, 14, 55))
    shadow = shadow.filter(ImageFilter.GaussianBlur(1.2))
    return Image.alpha_composite(shadow, dest)


def frame_scale(im: Image.Image) -> float:
    box = alpha_bbox(im)
    body_h = max(1, foot_line(im, box) - box[1])
    scale = TARGET_BODY_H / body_h
    max_h = PIVOT_Y - TOP_PAD
    if body_h * scale > max_h:
        scale = max_h / body_h
    max_w = FRAME - 2 * SIDE_PAD
    body_w = box[2] - box[0]
    if body_w * scale > max_w:
        scale = max_w / body_w
    return scale


def breath_frame(frame01: Image.Image) -> Image.Image:
    """Subtle inhale: 1.6% Y-scale around the foot pivot, X unchanged."""
    grown = frame01.resize((FRAME, int(round(FRAME * 1.016))), Image.Resampling.BICUBIC)
    dest = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    # keep feet on pivot: extra height grows upward
    extra = grown.size[1] - FRAME
    dest.alpha_composite(grown, (0, -extra))
    return dest


def copy_sources() -> None:
    CONCEPT_SRC.mkdir(parents=True, exist_ok=True)
    names = list(IDLE_SRC.values())
    for d in DIRS:
        for i in range(1, 5):
            names.append(f"hero_sword_walk_{d}_{i:02d}_src.jpg")
    for name in names:
        src = SRC_DIR / name
        if src.exists():
            shutil.copy2(src, CONCEPT_SRC / name)


def main() -> None:
    CONCEPT_SRC.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    copy_sources()

    keyed: dict[str, Image.Image] = {}
    metrics: list[tuple[str, int]] = []

    for d, fname in IDLE_SRC.items():
        im = flood_key(Image.open(SRC_DIR / fname))
        keyed[f"idle_{d}_01"] = im
        box = alpha_bbox(im)
        metrics.append((f"idle_{d}_01", foot_line(im, box) - box[1]))

    for d in DIRS:
        for i in range(1, 5):
            path = SRC_DIR / f"hero_sword_walk_{d}_{i:02d}_src.jpg"
            im = flood_key(Image.open(path))
            keyed[f"walk_{d}_{i:02d}"] = im
            box = alpha_bbox(im)
            metrics.append((f"walk_{d}_{i:02d}", foot_line(im, box) - box[1]))

    print("source body heights (px):")
    for name, h in metrics:
        print(f"  {name:16} body={h:4}")

    written: list[Path] = []
    for d in DIRS:
        idle_src = keyed[f"idle_{d}_01"]
        idle01 = place(idle_src, frame_scale(idle_src))
        idle02 = breath_frame(idle01)
        p1 = OUT_DIR / f"hero_sword_idle_{d}_01.png"
        p2 = OUT_DIR / f"hero_sword_idle_{d}_02.png"
        idle01.save(p1)
        idle02.save(p2)
        written.extend([p1, p2])
        for i in range(1, 5):
            src = keyed[f"walk_{d}_{i:02d}"]
            fr = place(src, frame_scale(src))
            p = OUT_DIR / f"hero_sword_walk_{d}_{i:02d}.png"
            fr.save(p)
            written.append(p)

    # contact sheet: 8 dirs x (idle01 + walk 1-4)
    cols, rows = 5, 8
    cell = 96
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (16, 18, 22, 255))
    for ri, d in enumerate(DIRS):
        frames = [Image.open(OUT_DIR / f"hero_sword_idle_{d}_01.png")]
        frames += [Image.open(OUT_DIR / f"hero_sword_walk_{d}_{i:02d}.png") for i in range(1, 5)]
        for ci, fr in enumerate(frames):
            sheet.alpha_composite(fr, (ci * cell, ri * cell))
            # pivot mark
            mark = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
            dr = ImageDraw.Draw(mark)
            dr.point((PIVOT_X, PIVOT_Y), fill=(226, 111, 61, 180))
            sheet.alpha_composite(mark, (ci * cell, ri * cell))
    sheet.save(PREVIEW)
    print(f"wrote {len(written)} frames + preview {PREVIEW}")


if __name__ == "__main__":
    main()
