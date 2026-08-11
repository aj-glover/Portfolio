const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('src/index.html', 'utf8');

// Find all image references in the HTML
const refs = new Set();
const bgRe = /background-image:url\(([^)]+)\)/g;
const imgRe = /<img[^>]+src="([^"]+)"/g;
let m;

while ((m = bgRe.exec(html))) refs.add(m[1]);
while ((m = imgRe.exec(html))) refs.add(m[1]);

let missing = 0;
for (const ref of refs) {
    const cleanRef = ref.replace(/^\.\//, '');
    const fullPath = path.join('src', cleanRef);
    if (!fs.existsSync(fullPath)) {
        console.log(`❌ MISSING: ${ref}`);
        missing++;
    }
}

// Also verify all thumb/full/gallery files referenced in CSS
const css = fs.readFileSync('src/css/base.css', 'utf8');
const cssRe = /url\(([^)]+)\)/g;
while ((m = cssRe.exec(css))) {
    const ref = m[1];
    if (!ref.includes('http')) {
        const fullPath = path.join('src', ref.replace(/^\.\.\//, ''));
        if (!fs.existsSync(fullPath)) {
            console.log(`❌ MISSING (CSS): ${ref}`);
            missing++;
        }
    }
}

if (missing === 0) {
    console.log(`✅ All ${refs.size} image references exist`);
} else {
    console.log(`\n${missing} missing image reference(s)`);
}