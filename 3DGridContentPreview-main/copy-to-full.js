const fs = require('fs');
const path = require('path');

const thumbsDir = path.join('src', 'img', 'thumbs');
const fullDir = path.join('src', 'img', 'full');
const htmlFile = path.join('src', 'index.html');

// Step 1: Copy thumbs to full
const thumbFiles = fs.readdirSync(thumbsDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
for (const file of thumbFiles) {
    fs.copyFileSync(path.join(thumbsDir, file), path.join(fullDir, file));
}
console.log(`Copied ${thumbFiles.length} files from thumbs to full`);

// Step 2: Build a map of number → extension
const extMap = {};
for (const file of thumbFiles) {
    const match = file.match(/^(\d+)\.(.+)$/);
    if (match) extMap[match[1]] = match[2];
}

// Step 3: Update HTML
let html = fs.readFileSync(htmlFile, 'utf8');

// Special case: preview-7 uses img/full/ux-0x0ss-2.png in both grid and preview items
// Replace first occurrence (grid item) → img/thumbs/7.EXT
// Replace second occurrence (preview item) → img/full/7.EXT
if (extMap[7]) {
    let count = 0;
    html = html.replace(/background-image:url\(img\/full\/ux-0x0ss-2\.png\)/g, () => {
        count++;
        return count === 1
            ? `background-image:url(img/thumbs/7.${extMap[7]})`
            : `background-image:url(img/full/7.${extMap[7]})`;
    });
}

// Regular cases: update extensions for thumbs and full references
for (let i = 1; i <= 16; i++) {
    const ext = extMap[i];
    if (!ext) continue;

    // Grid item: img/thumbs/N.OLD → img/thumbs/N.NEW
    html = html.replace(
        new RegExp(`background-image:url\\(img/thumbs/${i}\\.\\w+\\)`, 'g'),
        `background-image:url(img/thumbs/${i}.${ext})`
    );

    // Preview item: img/full/N.OLD → img/full/N.NEW
    html = html.replace(
        new RegExp(`background-image:url\\(img/full/${i}\\.\\w+\\)`, 'g'),
        `background-image:url(img/full/${i}.${ext})`
    );
}

fs.writeFileSync(htmlFile, html);
console.log('Updated HTML image references');