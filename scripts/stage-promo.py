#!/usr/bin/env python3
"""Copy the Sept 13 promo assets into the site's public/promo/, build the
downscaled thumbnails the /promo page shows, and regenerate the manifest that
page reads its file sizes and thumbnail dimensions from.

    ~/Desktop/WMA_HUBLawn_2026-09-13/.pdfvenv/bin/python scripts/stage-promo.py

Run it whenever the promo folder is rebuilt. The manifest is generated rather
than hand-written because the page prints a byte size next to every download,
and a hand-kept table of forty sizes goes stale the first time anyone reruns
build.sh -- silently, and in the one place a visitor would trust.

Two rules drive what is NOT copied:
  - og_sept13_1200x630.png is the site's own link-preview card, already
    committed as public/sept13-og.png. It is not a promo piece.
  - church_slide_1920x1080.* has ?p=ref3 baked into its QR, and ref3 is one
    person's private tracked link. Published here, every church that
    downloaded it would report its scans as that one person's.
    hub_signage_1920x1080.* is the same artwork carrying ?p=other, and is
    what the public page offers as the projector slide instead.
"""
import json
import shutil
import subprocess
from pathlib import Path

import pymupdf
from PIL import Image

HERE = Path(__file__).resolve().parent
SRC = Path.home() / "Desktop/WMA_HUBLawn_2026-09-13/promo"
OUT = HERE.parent / "public/promo"
THUMBS = OUT / "t"
MANIFEST = HERE.parent / "src/app/promo/manifest.ts"

# Longest edge of a thumbnail. The page never displays one wider than ~220 CSS
# px, so 380 covers a 1.5x screen with room to spare and keeps each file small.
MAX_EDGE = 380
QUALITY = 70

PRINT_FILES = [
    "TheFigs_HUBLawn_Flyer_8.5x11.pdf",
    "TheFigs_HUBLawn_Flyer_8.5x11.png",
    "PSUFootball_HUBLawn_Flyer_8.5x11.pdf",
    "PSUFootball_HUBLawn_Flyer_8.5x11.png",
    "FreePizza_HUBLawn_Flyer_8.5x11.pdf",
    "FreePizza_HUBLawn_Flyer_8.5x11.png",
    "TheFigs_HUBLawn_HalfPage_5.5x8.5.pdf",
    "TheFigs_HUBLawn_HalfPage_5.5x8.5.png",
    "PSUFootball_HUBLawn_HalfPage_5.5x8.5.pdf",
    "PSUFootball_HUBLawn_HalfPage_5.5x8.5.png",
    "FreePizza_HUBLawn_HalfPage_5.5x8.5.pdf",
    "FreePizza_HUBLawn_HalfPage_5.5x8.5.png",
    "TheFigs_HUBLawn_HalfPage_2up_Letter.pdf",
    "PSUFootball_HUBLawn_HalfPage_2up_Letter.pdf",
    "FreePizza_HUBLawn_HalfPage_2up_Letter.pdf",
    "TheFigs_Sept13_Email_Ad.pdf",
    "TheFigs_Sept13_Email_Ad.png",
]

SOCIAL_FILES = [
    "email_1200x630.gif",
    "email_1200x630.png",
    "whatsapp_1080.mp4",
    "whatsapp_1080.gif",
    "whatsapp_1080.png",
    "groupme_1080.gif",
    "groupme_1080.png",
    "text_1080.gif",
    "text_1080.png",
    "text_duo_1080x1350.png",
    "text_duo_psu_1080x1350.png",
    "instagram_feed_1080x1350.mp4",
    "instagram_feed_1080x1350.png",
    "instagram_carousel_2_1080x1350.png",
    "instagram_story_1080x1920.mp4",
    "instagram_story_1080x1920.png",
    "instagram_reel_1080x1920.mp4",
    "tiktok_1080x1920.mp4",
    "youtube_short_1080x1920.mp4",
    "facebook_1200x630.mp4",
    "facebook_1200x630.png",
    "hub_signage_1920x1080.png",
    "hub_signage_1920x1080.mp4",
]

# thumb name -> source file (relative to SRC). A PDF is rendered; an MP4 has its
# first frame pulled; anything else is opened directly. Several assets are
# byte-identical (the three chat squares, reel/tiktok) but each still gets its
# own thumbnail so the page's markup stays a plain one-line-per-asset list.
THUMB_SOURCES = {
    "flyer_figs": "TheFigs_HUBLawn_Flyer_8.5x11.png",
    "flyer_psu": "PSUFootball_HUBLawn_Flyer_8.5x11.png",
    "flyer_pizza": "FreePizza_HUBLawn_Flyer_8.5x11.png",
    "half_figs": "TheFigs_HUBLawn_HalfPage_5.5x8.5.png",
    "half_psu": "PSUFootball_HUBLawn_HalfPage_5.5x8.5.png",
    "half_pizza": "FreePizza_HUBLawn_HalfPage_5.5x8.5.png",
    "2up_figs": "TheFigs_HUBLawn_HalfPage_2up_Letter.pdf",
    "2up_psu": "PSUFootball_HUBLawn_HalfPage_2up_Letter.pdf",
    "2up_pizza": "FreePizza_HUBLawn_HalfPage_2up_Letter.pdf",
    "emailad": "TheFigs_Sept13_Email_Ad.png",
    "s_email": "social/email_1200x630.png",
    "s_whatsapp": "social/whatsapp_1080.png",
    "s_groupme": "social/groupme_1080.png",
    "s_text": "social/text_1080.png",
    "s_textduo": "social/text_duo_1080x1350.png",
    "s_textduopsu": "social/text_duo_psu_1080x1350.png",
    "s_igfeed": "social/instagram_feed_1080x1350.png",
    "s_igcarousel2": "social/instagram_carousel_2_1080x1350.png",
    "s_igstory": "social/instagram_story_1080x1920.png",
    "s_igreel": "social/instagram_reel_1080x1920.mp4",
    "s_tiktok": "social/tiktok_1080x1920.mp4",
    "s_yt": "social/youtube_short_1080x1920.mp4",
    "s_facebook": "social/facebook_1200x630.png",
    "s_signage": "social/hub_signage_1920x1080.png",
}


def load(path: Path) -> Image.Image:
    if path.suffix == ".pdf":
        page = pymupdf.open(path)[0]
        # 110 dpi is already well above the thumbnail's final size; rendering
        # bigger and shrinking is what keeps the type from going crunchy.
        pix = page.get_pixmap(dpi=110)
        return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    if path.suffix == ".mp4":
        frame = THUMBS / "_frame.png"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path),
             "-frames:v", "1", str(frame)],
            check=True,
        )
        img = Image.open(frame).convert("RGB")
        img.load()
        frame.unlink()
        return img
    return Image.open(path).convert("RGB")


def main() -> None:
    THUMBS.mkdir(parents=True, exist_ok=True)

    sizes = {}
    for name in PRINT_FILES + SOCIAL_FILES:
        src = SRC / name if (SRC / name).exists() else SRC / "social" / name
        assert src.exists(), src
        shutil.copy2(src, OUT / name)
        sizes[name] = src.stat().st_size

    thumbs = {}
    for key, rel in THUMB_SOURCES.items():
        img = load(SRC / rel)
        img.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
        dst = THUMBS / f"{key}.jpg"
        img.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        # Width and height travel with the thumbnail so the page can reserve the
        # right box before the image lands. Without them a phone reflows the
        # whole list as twenty-four thumbnails arrive one at a time.
        thumbs[key] = [img.width, img.height]

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        "/* GENERATED by scripts/stage-promo.py. Do not edit by hand.\n"
        "   BYTES is the real size of every file in public/promo/; THUMBS is the\n"
        "   pixel size of each preview in public/promo/t/. */\n\n"
        f"export const BYTES: Record<string, number> = {json.dumps(dict(sorted(sizes.items())), indent=2)};\n\n"
        f"export const THUMBS: Record<string, [number, number]> = "
        f"{json.dumps(dict(sorted(thumbs.items())), indent=2)};\n"
    )

    for key, (w, h) in thumbs.items():
        print(f"{key:16} {w:>4}x{h:<4} {(THUMBS / f'{key}.jpg').stat().st_size/1024:6.1f} KB")
    print(f"\nthumbs    {sum((THUMBS / f'{k}.jpg').stat().st_size for k in thumbs)/1024:.0f} KB")
    print(f"downloads {sum(sizes.values())/1024/1024:.2f} MB across {len(sizes)} files")
    print(f"manifest  {MANIFEST}")


if __name__ == "__main__":
    main()
