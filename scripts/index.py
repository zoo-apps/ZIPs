#!/usr/bin/env python3
"""Derive the README index from the ZIP frontmatter, and refuse to do it quietly.

The frontmatter in ZIPs/zip-NNNN-*.md is the only source of truth for a ZIP's
number, title, type and status. Every other rendering of those facts -- the
README table here, the pages the site builds from lib/source.ts -- is derived.

Run with no arguments to rewrite the README table. Run with --check to verify
the committed table matches the corpus; CI uses that and fails if it drifted.

The checks below exist because the previous generators had none: they were last
run when the corpus held 16 ZIPs and went on reporting success against 156.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIPS = ROOT / 'ZIPs'
README = ROOT / 'README.md'
HEADING = '## ZIP Index'

# The lifecycle. Three values, each meaning one thing.
#   Draft   proposed; no implementation found
#   Final   the thing it specifies exists in code
#   Living  never finalises; amended as the ecosystem moves
STATUS = ('Draft', 'Final', 'Living')

# A floor, not a count. Raise it deliberately when ZIPs are added; a run that
# sees fewer files than this has lost part of the corpus and must not write.
FLOOR = 140

NAME = re.compile(r'^zip-(\d{4})-[a-z0-9-]+\.md$')


def frontmatter(path):
    text = path.read_text(encoding='utf-8')
    if not text.startswith('---'):
        raise SystemExit(f'{path.name}: no frontmatter')
    end = text.find('\n---', 3)
    if end == -1:
        raise SystemExit(f'{path.name}: unterminated frontmatter')
    data = {}
    for line in text[3:end].splitlines():
        if line.startswith((' ', '\t', '-')) or ':' not in line:
            continue
        key, value = line.split(':', 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def requires(value):
    if not value:
        return []
    return [int(n) for n in re.findall(r'\d+', value)]


def read():
    zips, faults = [], []
    for path in sorted(ZIPS.glob('*.md')):
        match = NAME.match(path.name)
        if not match:
            faults.append(f'{path.name}: filename is not zip-NNNN-slug.md')
            continue
        number = int(match.group(1))
        data = frontmatter(path)
        for field in ('zip', 'title', 'status', 'type'):
            if not data.get(field):
                faults.append(f'{path.name}: frontmatter has no {field}')
        if data.get('zip') and int(re.sub(r'\D', '', data['zip'])) != number:
            faults.append(f"{path.name}: frontmatter zip {data['zip']} is not {number}")
        if data.get('status') not in STATUS:
            faults.append(f"{path.name}: status {data.get('status')!r} is not one of {STATUS}")
        zips.append((number, path.name, data))

    seen = {}
    for number, name, _ in zips:
        seen.setdefault(number, []).append(name)
    for number, names in seen.items():
        if len(names) > 1:
            faults.append(f'ZIP-{number:04d} claimed by {len(names)} files: {", ".join(names)}')

    known = set(seen)
    for number, name, data in zips:
        for needed in requires(data.get('requires')):
            if needed not in known:
                faults.append(f'{name}: requires ZIP-{needed:04d}, which does not exist')

    if len(zips) < FLOOR:
        faults.append(f'read {len(zips)} ZIPs, below the floor of {FLOOR} -- corpus is truncated')

    if faults:
        for fault in faults:
            print(f'index: {fault}', file=sys.stderr)
        raise SystemExit(f'index: {len(faults)} fault(s); README not written')

    zips.sort()
    return zips


def table(zips):
    rows = [HEADING, '',
            f'{len(zips)} proposals. Generated from the ZIP frontmatter by '
            '`scripts/index.py` -- edit the ZIP, not this table.', '',
            '| Number | Title | Type | Status |',
            '|:-------|:------|:-----|:-------|']
    for number, name, data in zips:
        title = data['title']
        if len(title) > 60:
            title = title[:57] + '...'
        rows.append(f"| [ZIP-{number:04d}](./ZIPs/{name}) | {title} | {data['type']} | {data['status']} |")
    return '\n'.join(rows) + '\n'


def splice(text, section):
    start = text.index(HEADING)
    rest = text[start + len(HEADING):]
    match = re.search(r'\n## ', rest)
    end = start + len(HEADING) + match.start() + 1 if match else len(text)
    return text[:start] + section + text[end:]


def main():
    zips = read()
    want = splice(README.read_text(encoding='utf-8'), table(zips))
    if '--check' in sys.argv:
        if README.read_text(encoding='utf-8') != want:
            raise SystemExit('index: README is stale; run scripts/index.py')
        print(f'index: README matches {len(zips)} ZIPs')
        return
    README.write_text(want, encoding='utf-8')
    print(f'index: wrote {len(zips)} ZIPs to README.md')


if __name__ == '__main__':
    main()
