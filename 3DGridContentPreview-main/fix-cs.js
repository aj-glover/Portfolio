const fs = require('fs');
const path = require('path');

const htmlFile = 'src/index.html';
let html = fs.readFileSync(htmlFile, 'utf8');

// === FIX 1: Replace pos-17 background-image with <img> tag (fix logo tiling) ===
const oldGridItem = '<a href="#preview-17" class="grid__item pos-17" data-title="Non Profit Case Study"><div class="grid__item-img" style="background-image:url(img/thumbs/17.png);"></div></a>';
const newGridItem = '<a href="#preview-17" class="grid__item pos-17" data-title="Non Profit Case Study"><div class="grid__item-img" style="background: #1a1a2e; display: flex; align-items: center; justify-content: center;"><img src="img/thumbs/nawco-logo.png" style="max-width: 80%; max-height: 80%; object-fit: contain;"></div></a>';
html = html.replace(oldGridItem, newGridItem);

// === FIX 2: Remove hero image wrap from #preview-17 ===
html = html.replace(
    /<div class="preview__item-imgwrap">\s*<div class="preview__item-img" style="background-image:url\(img\/full\/17\.png\);"><\/div>\s*<\/div>/,
    ''
);

// === FIX 3: Replace gallery markers + content between them with stacked images ===
// Copy the 6 images from the gallery folder into the detail page as stacked images
const galleryDir = 'src/img/galleries/preview-17';
const images = fs.existsSync(galleryDir)
    ? fs.readdirSync(galleryDir).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f)).sort()
    : [];

const stackedImages = images.map(img => {
    const src = `img/galleries/preview-17/${img}`;
    const alt = img.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    return `                                    <img src="${src}" alt="${alt}" style="width:100%; height:auto; border-radius:14px; margin-bottom:1.5rem;">`;
}).join('\n');

const galleryBlock = `<!-- GALLERY:preview-17 -->
                            <div class="preview__item-gallery">
                                <h3>Work Samples</h3>
                                <div class="preview__item-gallery-stack">
${stackedImages}
                                </div>
                            </div>
<!-- /GALLERY:preview-17 -->`;

// The markers are already in the HTML from the last sync. Replace the marker pair with our custom block.
const startMarker = '<!-- GALLERY:preview-17 -->';
const endMarker = '<!-- /GALLERY:preview-17 -->';
const escapedStart = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapedEnd = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(escapedStart + '[\\s\\S]*?' + escapedEnd, 'g');
html = html.replace(regex, galleryBlock);

fs.writeFileSync(htmlFile, html);
console.log('HTML updated — logo as img, hero removed, gallery replaced with stacked images');