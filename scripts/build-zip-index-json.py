#!/usr/bin/env python3
"""Build JSON index for ZIPs."""
import os
import re
import json
from pathlib import Path

ZIP_DIR = Path('ZIPs')
OUT_DOCS = Path('docs/zip-index.json')
OUT_SITE = Path('docs/site/zip-index.json')


def extract_frontmatter(filepath: Path):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if not content.startswith('---'):
        return {}

    end = content.find('\n---', 3)
    if end == -1:
        return {}

    fm_text = content[3:end].strip()
    data = {}
    for line in fm_text.splitlines():
        if ':' in line:
            key, val = line.split(':', 1)
            data[key.strip()] = val.strip().strip('"').strip("'")
    return data


def collect_zips():
    items = []
    if not ZIP_DIR.exists():
        return items
    for name in os.listdir(ZIP_DIR):
        if not name.startswith('zip-') or not name.endswith('.md'):
            continue
        m = re.match(r"zip-(\d+)(?:-[a-z0-9-]+)?\.md", name)
        if not m:
            continue
        number = int(m.group(1))
        path = ZIP_DIR / name
        fm = extract_frontmatter(path)
        item = {
            'number': number,
            'file': name,
            'title': fm.get('title', 'Untitled'),
            'description': fm.get('description', ''),
            'author': fm.get('author', ''),
            'status': fm.get('status', 'Draft'),
            'type': fm.get('type', ''),
            'category': fm.get('category', ''),
            'created': fm.get('created', ''),
        }
        items.append(item)
    items.sort(key=lambda x: x['number'])
    return items


def write_json(items, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({'zip_count': len(items), 'zips': items}, f, ensure_ascii=False, indent=2)


def main():
    items = collect_zips()
    write_json(items, OUT_DOCS)
    write_json(items, OUT_SITE)
    print(f"Wrote {len(items)} ZIPs to {OUT_DOCS} and {OUT_SITE}")


if __name__ == '__main__':
    os.chdir(Path(__file__).resolve().parent.parent)
    main()
