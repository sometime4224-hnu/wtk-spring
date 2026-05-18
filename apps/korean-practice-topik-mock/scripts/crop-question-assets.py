import argparse
from pathlib import Path

from PIL import Image


PAGE_SIZE = (1033, 1461)

READING_TWO_BOXES = [
    (90, 210, 945, 780),
    (90, 760, 945, 1325),
]

LISTENING_TYPE4_FIRST_PAGE_BOXES = [
    (95, 245, 900, 425),
    (95, 455, 900, 650),
    (95, 675, 900, 870),
    (95, 900, 900, 1095),
    (95, 1115, 900, 1305),
]

LISTENING_TYPE4_CONTINUED_BOXES = [
    (95, 200, 900, 390),
    (95, 415, 900, 610),
    (95, 635, 900, 830),
    (95, 855, 900, 1050),
    (95, 1075, 900, 1265),
]

LISTENING_TYPE5_BOXES = [
    (95, 220, 900, 470),
    (95, 495, 900, 750),
    (95, 775, 900, 1035),
    (95, 1035, 900, 1305),
]


def page_path(pages_dir, page):
    direct = pages_dir / f"book-{page}.jpg"
    if direct.exists():
        return direct
    padded = pages_dir / f"book-{page:02d}.jpg"
    if padded.exists():
        return padded
    raise FileNotFoundError(f"Missing rendered page image for page {page}: {direct}")


def save_crop(pages_dir, output_dir, question_id, page, box):
    source = page_path(pages_dir, page)
    with Image.open(source) as image:
        if image.size != PAGE_SIZE:
            scale_x = image.size[0] / PAGE_SIZE[0]
            scale_y = image.size[1] / PAGE_SIZE[1]
            box = tuple(
                int(value * (scale_x if index % 2 == 0 else scale_y))
                for index, value in enumerate(box)
            )
        crop = image.crop(box)
        output = output_dir / f"{question_id}.jpg"
        crop.save(output, "JPEG", quality=88, optimize=True)


def build_jobs():
    jobs = []

    for number in range(1, 11):
        page = 17 + ((number - 1) // 2)
        box = READING_TWO_BOXES[(number - 1) % 2]
        jobs.append((f"reading-type3-q{number:02d}", page, box))

    for number in range(1, 13):
        page = 23 + ((number - 1) // 2)
        box = READING_TWO_BOXES[(number - 1) % 2]
        jobs.append((f"reading-type4-q{number:02d}", page, box))

    for number in range(1, 16):
        page = 48 + ((number - 1) // 5)
        index = (number - 1) % 5
        boxes = LISTENING_TYPE4_FIRST_PAGE_BOXES if page == 48 else LISTENING_TYPE4_CONTINUED_BOXES
        jobs.append((f"listening-type4-q{number:02d}", page, boxes[index]))

    for number in range(1, 13):
        page = 52 + ((number - 1) // 4)
        box = LISTENING_TYPE5_BOXES[(number - 1) % 4]
        jobs.append((f"listening-type5-q{number:02d}", page, box))

    return jobs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pages-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    pages_dir = Path(args.pages_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for existing in output_dir.glob("*.jpg"):
        existing.unlink()

    jobs = build_jobs()
    for question_id, page, box in jobs:
        save_crop(pages_dir, output_dir, question_id, page, box)

    print(f"Question images ready: {len(jobs)}")


if __name__ == "__main__":
    main()
