from pathlib import Path
import shutil
import re

root = Path('.')
src = root / 'src'
imgs = src / 'img'
thumbs = imgs / 'thumbs'
full = imgs / 'full'
photos = Path(r'C:\Users\AJ\Desktop\Work Samples\Photography')

files = [p for p in sorted(photos.iterdir(), key=lambda p: p.name.lower()) if p.suffix.lower() in {'.jpg', '.jpeg', '.png'}]
if len(files) < 16:
    raise SystemExit(f'Need at least 16 images in {photos}, found {len(files)}')

selected = files[:16]
for idx, src_file in enumerate(selected, start=1):
    if not src_file.exists():
        raise FileNotFoundError(f'Source photo not found: {src_file}')
    for dest_dir in (thumbs, full):
        dest_file = dest_dir / f'{idx}.jpg'
        shutil.copyfile(src_file, dest_file)

html_path = src / 'index.html'
text = html_path.read_text(encoding='utf-8')
text = text.replace('<span class="content__title-line content__title-line--1" data-splitting>July/</span>', '<span class="content__title-line content__title-line--1" data-splitting>My</span>')
text = text.replace('<span class="content__title-line content__title-line--2" data-splitting>August</span>', '<span class="content__title-line content__title-line--2" data-splitting>Portfolio</span>')
text = text.replace('<h1 class="frame__title">3D Grid Interaction with Content Preview</h1>', '<h1 class="frame__title">Photography Portfolio Showcase</h1>')
text = text.replace('+ Info', 'Details')
text = text.replace('Buy Tickets', 'View Photo')

titles = [f'Photo {i}' for i in range(1, 17)]

replacement_count = [0]

def data_title_repl(match):
    value = titles[replacement_count[0]]
    replacement_count[0] += 1
    return f'{match.group(1)}{value}{match.group(3)}'

text = re.sub(r'(data-title=")([^"]+)(")', data_title_repl, text)

replacement_count[0] = 0

def preview_title_repl(match):
    value = titles[replacement_count[0]]
    replacement_count[0] += 1
    return f'{match.group(1)}{value}{match.group(3)}'

text = re.sub(r'(<h2 data-splitting class="preview__item-title">)([^<]+)(</h2>)', preview_title_repl, text)

lines = text.splitlines()
new_lines = []
preview_idx = 0
for line in lines:
    if 'preview__item-meta' in line:
        preview_idx += 1
        new_lines.append(f'                            <div class="preview__item-meta"><span>Location {preview_idx}</span><span>2026</span></div>')
    elif 'preview__item-description' in line:
        new_lines.append('                            <p class="preview__item-description">A photography sample from my portfolio, shown with a preview overlay and 3D grid interaction effect.</p>')
    else:
        new_lines.append(line)

text = '\n'.join(new_lines)
html_path.write_text(text, encoding='utf-8')
print(f'Copied {len(selected)} photos and updated index.html')
