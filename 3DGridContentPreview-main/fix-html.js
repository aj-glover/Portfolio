const fs = require('fs');

let html = fs.readFileSync('src/index.html', 'utf8');

// Find the preview-18 block (which is outside .preview)
const p18Pattern = /\t\t\t\t\t<div class="preview__item" id="preview-18">[\s\S]*?<\/div>\s*\t\t\t\t<\/div>\s*\t\t\t<\/div>\s*\t\t<\/main>/;
const match = html.match(p18Pattern);

if (match) {
    const p18Block = match[0];
    // Remove it from its current location
    html = html.replace(p18Block, '');
    // Insert it before the closing .preview and .content divs
    html = html.replace('</div>\n\t\t\t</div>\n\t\t</main>', p18Block + '\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</main>');
    fs.writeFileSync('src/index.html', html);
    console.log('preview-18 moved inside .preview container');
} else {
    console.log('Could not find preview-18 block outside .preview');
}