#!/usr/bin/env python3
"""Check generated site invariants without third-party dependencies."""

from html.parser import HTMLParser
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
POSTS = ROOT / "posts"


class ImageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images_without_alt = []

    def handle_starttag(self, tag, attrs):
        if tag != "img":
            return
        attributes = dict(attrs)
        if "alt" not in attributes:
            self.images_without_alt.append(attributes.get("src", "<unknown>"))


def front_matter(path):
    text = path.read_text()
    if not text.startswith("---"):
        return {}
    return dict(
        re.findall(r"^([A-Za-z0-9_-]+):\s*[\"']?([^\"'\n]+)", text.split("---", 2)[1], re.MULTILINE)
    )


def fail(message):
    print(f"FAIL: {message}")
    return 1


def main():
    errors = []
    posts = list(POSTS.rglob("index.md"))
    if not (SITE / "posts/index.html").exists():
        errors.append("_site/posts/index.html is missing")

    grouped = {}
    for path in posts:
        data = front_matter(path)
        cover = data.get("cover-img", "")
        thumbnail = data.get("thumbnail-img", "")
        for field, value in (("cover-img", cover), ("thumbnail-img", thumbnail)):
            if value.startswith("/posts/"):
                local = ROOT / value.lstrip("/")
                if not local.exists():
                    errors.append(f"{path}: {field} does not exist: {value}")
            elif value.startswith(("http://", "https://")):
                errors.append(f"{path}: external {field}: {value}")

        series = data.get("series")
        order = data.get("series_order")
        if series and order:
            try:
                grouped.setdefault(series, []).append(int(order))
            except ValueError:
                errors.append(f"{path}: invalid series_order: {order}")

    for series, orders in grouped.items():
        expected = list(range(1, len(orders) + 1))
        if sorted(orders) != expected:
            errors.append(f"{series}: series_order is not contiguous: {sorted(orders)}")

    for page in SITE.rglob("*.html"):
        parser = ImageParser()
        parser.feed(page.read_text(errors="ignore"))
        for src in parser.images_without_alt:
            errors.append(f"{page}: image missing alt: {src}")

    if errors:
        for error in errors:
            print(f"FAIL: {error}")
        return 1

    print(f"PASS: checked {len(posts)} posts, {len(grouped)} series, and generated HTML images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
