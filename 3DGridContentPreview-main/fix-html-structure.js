const fs = require('fs');

let html = fs.readFileSync('src/index.html', 'utf8');

// Find the position of preview-photo
const photoIdx = html.indexOf('id="preview-photo"');
if (photoIdx === -1) {
    console.log('ERROR: preview-photo not found');
    process.exit(1);
}

// Find the last </a> before preview-photo
const beforePhoto = html.substring(0, photoIdx);
const lastA = beforePhoto.lastIndexOf('</a>');
if (lastA === -1) {
    console.log('ERROR: no </a> found before preview-photo');
    process.exit(1);
}

// Insert closing grid div and opening preview div after last grid item
const afterLastA = html.substring(lastA + 4);
const newHtml = html.substring(0, lastA + 4) + 
    '\n\t\t\t\t</div>\n\t\t\t\t<div class="preview">\n\t\t\t\t\t' + 
    afterLastA;

// Find cursor div and insert closing preview div before it
const cursorIdx = newHtml.indexOf('<div class="cursor">');
if (cursorIdx === -1) {
    console.log('ERROR: cursor div not found');
    process.exit(1);
}

const finalHtml = newHtml.substring(0, cursorIdx) + 
    '\t\t\t\t</div>\n\n\t\t' + 
    newHtml.substring(cursorIdx);

fs.writeFileSync('src/index.html', finalHtml);
console.log('HTML structure fixed successfully');
console.log('Preview div count:', (finalHtml.match(/class="preview"/g) || []).length);