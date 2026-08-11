from pathlib import Path

p = Path('src/index.html')
text = p.read_text(encoding='utf-8')
old = '<script src="js/index.js"></script>'
new = '<script type="module" src="js/index.js"></script>'
if old not in text:
    raise SystemExit('Expected script tag not found')
text = text.replace(old, new)
p.write_text(text, encoding='utf-8')
print('script tag patched')
