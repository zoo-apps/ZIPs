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

# The categories in use. Nothing enforced this before, so docs/lib/source.ts
# went on declaring a hand-written union that named six of these eleven and
# nothing caught it. A new one is a decision about the corpus: add it here, and
# say so in source.ts, or the run fails.
CATEGORY = ('AI', 'Core', 'DeFi', 'Gaming', 'Governance', 'Interface', 'NFT',
            'Research', 'Security', 'Wildlife', 'ZRC')

# How far the code has got, per runtime. status: is one word for the whole
# proposal and cannot say that Go has a thing and Rust does not; these keys can.
# Flat and hyphenated because frontmatter() above reads one line at a time -- a
# nested block under implementation: is invisible to it, and a claim the check
# cannot see is a claim nothing checks.
#
# An ABSENT key means nobody has assessed that runtime. `none` means somebody
# read it and found nothing. The table counts the two apart; folding the first
# into the second reports an unread corpus as an unimplemented one.
LANGUAGE = {'go': 'Go', 'cpp': 'C++', 'rust': 'Rust'}
PROGRESS = ('shipped', 'partial', 'none')

# Go is the reference runtime: Final says the thing a ZIP specifies exists in
# the code, so Final alongside implementation-go: none is two claims about one
# body of code, and one of them is wrong.
REFERENCE_RUNTIME = 'go'

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


def requires(value, name, faults):
    """requires: is a bracketed list of ZIP numbers and nothing else.

    Without the shape check a stray `requires: "LP-0011"` reads as ZIP-11,
    resolves against a real ZIP and passes -- which is how it survived here.
    Cross-estate pointers belong in related-hips: / related-lps: / mirrors:.
    """
    if value is None:
        return []
    value = value.strip()
    for prefix in ('HIP', 'LP', 'ZIP'):
        if prefix in value.upper():
            faults.append(f'{name}: requires: holds {prefix}-, which belongs in '
                          f'related-hips: / related-lps: / mirrors:')
            return []
    if not (value.startswith('[') and value.endswith(']')):
        faults.append(f'{name}: requires: {value!r} is not a [list] of ZIP numbers')
        return []
    inner = value[1:-1].strip()
    if inner and not re.fullmatch(r'\d+(\s*,\s*\d+)*', inner):
        faults.append(f'{name}: requires: {value!r} is not a [list] of ZIP numbers')
        return []
    return [int(n) for n in re.findall(r'\d+', inner)]


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
        if data.get('category') and data['category'] not in CATEGORY:
            faults.append(f"{path.name}: category {data['category']!r} is not one of {CATEGORY}")
        for runtime in LANGUAGE:
            field = f'implementation-{runtime}'
            progress = data.get(field)
            if progress is None:
                continue
            if progress not in PROGRESS:
                faults.append(f'{path.name}: {field} {progress!r} is not one of {PROGRESS}')
            elif runtime == REFERENCE_RUNTIME and progress == 'none' and data.get('status') == 'Final':
                faults.append(f'{path.name}: status is Final and {field} is none; '
                              'both are claims about the same code')
        zips.append((number, path.name, data))

    seen = {}
    for number, name, _ in zips:
        seen.setdefault(number, []).append(name)
    for number, names in seen.items():
        if len(names) > 1:
            faults.append(f'ZIP-{number:04d} claimed by {len(names)} files: {", ".join(names)}')

    known = set(seen)
    for number, name, data in zips:
        for needed in requires(data.get('requires'), name, faults):
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
            '`status:` is one word for a whole proposal, so it cannot say that Go has '
            'a thing and Rust does not. A ZIP may also carry '
            + ', '.join(f'`implementation-{runtime}`' for runtime in LANGUAGE)
            + '. An empty cell is not `none` -- it means nobody has read that runtime '
            'yet, and the two are counted apart here.', '',
            '| | ' + ' | '.join(PROGRESS) + ' | not assessed |',
            '|:--|' + '--:|' * (len(PROGRESS) + 1)]
    for runtime, label in LANGUAGE.items():
        seen = [data.get(f'implementation-{runtime}', '') for _, _, data in zips]
        counts = [seen.count(p) for p in PROGRESS] + [seen.count('')]
        rows.append(f'| {label} | ' + ' | '.join(str(n) for n in counts) + ' |')

    rows += ['',
             '| Number | Title | Type | Status | ' + ' | '.join(LANGUAGE.values()) + ' |',
             '|:-------|:------|:-----|:-------|' + ':--|' * len(LANGUAGE)]
    for number, name, data in zips:
        title = data['title']
        if len(title) > 60:
            title = title[:57] + '...'
        cells = ' | '.join(data.get(f'implementation-{runtime}') or '-' for runtime in LANGUAGE)
        rows.append(f"| [ZIP-{number:04d}](./ZIPs/{name}) | {title} | {data['type']} "
                    f"| {data['status']} | {cells} |")
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
