#!/usr/bin/env python3
"""Update ZIP index in README.md based on ZIP files."""
import os
import re
from pathlib import Path

def extract_frontmatter(filepath):
    """Extract YAML frontmatter from a markdown file."""
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

def get_all_zips(directory='ZIPs'):
    """Get all ZIP files and their metadata."""
    zips = []
    for filename in os.listdir(directory):
        if filename.endswith('.md') and filename.startswith('zip-'):
            filepath = os.path.join(directory, filename)
            fm = extract_frontmatter(filepath)
            match = re.search(r'zip-(\d+)(?:-[a-z0-9-]+)?\.md', filename)
            if match:
                number = int(match.group(1))
                fm['number'] = number
                fm['filename'] = filename
                zips.append(fm)
    zips.sort(key=lambda x: x['number'])
    return zips

def generate_index_table(zips):
    """Generate markdown table for ZIPs."""
    lines = [
        "## ZIP Index\n",
        "| Number | Title | Type | Status |",
        "|:-------|:------|:-----|:-------|"
    ]
    for z in zips:
        num = z['number']
        filename = z.get('filename', f'zip-{num:04d}.md')
        title = z.get('title', 'Untitled')
        ztype = z.get('type', '-')
        status = z.get('status', 'Draft')
        if len(title) > 60:
            title = title[:57] + '...'
        lines.append(f"| [ZIP-{num:04d}](./ZIPs/{filename}) | {title} | {ztype} | {status} |")
    return '\n'.join(lines)

def update_readme():
    """Update README.md with new index."""
    readme_path = 'README.md'
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()

    zips = get_all_zips()
    new_index = generate_index_table(zips)

    # Find and replace the ZIP Index section
    start_marker = "## ZIP Index"
    # Find the next ## heading after ZIP Index
    start_idx = content.find(start_marker)
    if start_idx == -1:
        # Append at end if not found
        content += "\n\n" + new_index
    else:
        # Find next section
        next_section = re.search(r'\n## [^#]', content[start_idx + len(start_marker):])
        if next_section:
            end_idx = start_idx + len(start_marker) + next_section.start()
            content = content[:start_idx] + new_index + "\n\n" + content[end_idx+1:]
        else:
            # No next section, replace to end
            content = content[:start_idx] + new_index

    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated README.md with {len(zips)} ZIPs")

if __name__ == '__main__':
    os.chdir(Path(__file__).parent.parent)
    update_readme()
