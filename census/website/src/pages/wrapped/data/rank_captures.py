#!/usr/bin/env python3
"""
Prioritise the wrapped selections using a capture ranking export.

    python3 rank_captures.py ~/Downloads/capture-rankings.csv [wrapped.json]

The CSV is the Elo-style ranking of sighting images (one row per image, best
first). `captures` is rebuilt from the top of the ranking, keeping variety by
capping how many images each species contributes. `suggestions` keeps the
entries produced by wrapped.sql but is reordered so the best-ranked images come
first. Everything else in wrapped.json is left alone.

Image dimensions aren't in the CSV. They're looked up in the local database
when the POSTGRES_* variables are set (census/api/.env), and otherwise read
from the JPEG header of the hosted image.
"""
import csv
import json
import os
import struct
import subprocess
import sys
import urllib.request

CAPTURES = 36
PER_SPECIES = 2
BASES = {"confirmed", "agreed"}
# Same framing constraint as wrapped.sql: skip boxes too small to see or so large there's nothing to frame.
MIN_BOX, MAX_BOX = 120, 1400


def jpeg_size(url: str) -> tuple[int, int]:
    """Reads just enough of a JPEG to find its SOF marker and dimensions."""
    # The bucket refuses the default urllib user agent.
    request = urllib.request.Request(url, headers={"Range": "bytes=0-262143", "User-Agent": "census-wrapped/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = response.read()
    offset = 2
    while offset < len(data) - 9:
        if data[offset] != 0xFF:
            offset += 1
            continue
        marker = data[offset + 1]
        if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
            height, width = struct.unpack(">HH", data[offset + 5 : offset + 9])
            return width, height
        length = struct.unpack(">H", data[offset + 2 : offset + 4])[0]
        offset += 2 + length
    raise ValueError(f"no SOF marker found in {url}")


def db_sizes(image_ids: list[str]) -> dict[str, tuple[int, int]]:
    if not image_ids or "POSTGRES_USER" not in os.environ:
        return {}
    env = dict(os.environ, PGPASSWORD=os.environ.get("POSTGRES_PASSWORD", ""))
    sql = f"select id, width, height from images where id in ({','.join(image_ids)}) and width is not null"
    result = subprocess.run(
        [
            "psql",
            "-h",
            os.environ.get("POSTGRES_HOST", "localhost"),
            "-p",
            os.environ.get("POSTGRES_PORT", "5432"),
            "-U",
            os.environ["POSTGRES_USER"],
            "-d",
            os.environ["POSTGRES_DB"],
            "-X",
            "-At",
            "-F",
            "|",
            "-c",
            sql,
        ],
        env=env,
        capture_output=True,
        text=True,
    )
    sizes = {}
    for line in result.stdout.splitlines():
        image_id, width, height = line.split("|")
        sizes[image_id] = (int(width), int(height))
    return sizes


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    csv_path = sys.argv[1]
    json_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "wrapped.json")

    with open(csv_path, newline="") as handle:
        rows = sorted(csv.DictReader(handle), key=lambda row: int(row["global_rank"]))

    # Pick the captures: best first, a couple per species, well-framed boxes only.
    picked: list[dict] = []
    per_species: dict[str, int] = {}
    for row in rows:
        if row["identification_basis"] not in BASES:
            continue
        width, height = int(row["bounding_box_width"]), int(row["bounding_box_height"])
        if not (MIN_BOX <= width <= MAX_BOX and MIN_BOX <= height <= MAX_BOX):
            continue
        name = row["identification_name"]
        if per_species.get(name, 0) >= PER_SPECIES:
            continue
        per_species[name] = per_species.get(name, 0) + 1
        picked.append(row)
        if len(picked) == CAPTURES:
            break

    sizes = db_sizes([row["image_id"] for row in picked])
    captures = []
    for row in picked:
        size = sizes.get(row["image_id"])
        if size is None:
            size = jpeg_size(row["image_url"])
        captures.append(
            {
                "nickname": row["identification_nickname"] or row["identification_name"],
                "url": row["image_url"],
                "width": size[0],
                "height": size[1],
                "boundingBox": {
                    "x": int(row["bounding_box_x"]),
                    "y": int(row["bounding_box_y"]),
                    "width": int(row["bounding_box_width"]),
                    "height": int(row["bounding_box_height"]),
                },
            }
        )

    with open(json_path) as handle:
        wrapped = json.load(handle)

    wrapped["captures"] = captures

    # Best-ranked images first; images the ranking never saw keep their order at the end.
    rank_by_url = {row["image_url"]: int(row["global_rank"]) for row in rows}
    wrapped["suggestions"] = sorted(
        wrapped.get("suggestions", []), key=lambda entry: rank_by_url.get(entry["url"], len(rows) + 1)
    )

    with open(json_path, "w") as handle:
        json.dump(wrapped, handle, separators=(",", ":"))

    print(f"captures: {len(captures)} from {len({row['identification_name'] for row in picked})} species")
    print(f"suggestions reordered: {len(wrapped['suggestions'])}")
    for index, capture in enumerate(captures, 1):
        print(f"  {index:2d}. {capture['nickname']}")


if __name__ == "__main__":
    main()
