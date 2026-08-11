const fs = require('fs');
let h = fs.readFileSync('src/index.html', 'utf8');
const gridStart = h.indexOf('class="grid">');
const photoIdx = h.indexOf('id="preview-photo"');
const beforeCats = h.substring(0, photoIdx);
const lastGridItem = beforeCats.lastIndexOf('</a>');
const gridContent = h.substring(gridStart, lastGridItem + 4);
const afterCats = h.substring(photoIdx);
let previewEnd = afterCats.indexOf('<div class="cursor">');
if (previewEnd === -1) previewEnd = afterCats.indexOf('<div class="cursor"');
const previewContent = afterCats.substring(0, previewEnd);
const afterPreview = afterCats.substring(previewEnd);
const beforeGrid = h.substring(0, gridStart);
const fixedHtml = beforeGrid + 'class="grid">
' + gridContent.substring(gridContent.indexOf('<a')) + '
				</div>
				<div class="preview">
' + previewContent + '
				</div>

' + afterPreview;
fs.writeFileSync('src/index.html', fixedHtml);
console.log('HTML structure fixed');