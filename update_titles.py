from pathlib import Path
import re

p = Path('src/index.html')
text = p.read_text(encoding='utf-8')
labels = [
    'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
    'Pluto', 'Sol', 'Sirius', 'Vega', 'Polaris', 'Orion', 'Andromeda', 'Nebula'
]
count = 0

def title_repl(match):
    global count
    value = labels[count]
    count += 1
    return f'{match.group(1)}{value}{match.group(3)}'

text, n = re.subn(r'(<h2 data-splitting class="preview__item-title">)([^<]+)(</h2>)', title_repl, text, count=16)
if n != 16:
    raise SystemExit(f'Expected 16 preview title replacements, got {n}')

p.write_text(text, encoding='utf-8')
print('Updated all preview titles to match hover labels.')
