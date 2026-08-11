const fs = require('fs');

const htmlFile = 'src/index.html';
let html = fs.readFileSync(htmlFile, 'utf8');

// Remove all preview__item-meta divs (location and year)
html = html.replace(/<div class="preview__item-meta">.*?<\/div>/gs, '');

// Remove all Details buttons
html = html.replace(/<button class="preview__item-info unbutton">Details<\/button>/g, '');

// Remove all View Photo buttons
html = html.replace(/<button class="preview__item-button">View Photo<\/button>/g, '');

fs.writeFileSync(htmlFile, html);
console.log('Removed meta info and buttons from all detail pages');