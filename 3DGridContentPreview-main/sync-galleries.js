const fs = require('fs');
const path = require('path');

const galleriesDir = path.join('src', 'img', 'galleries');
const htmlFile = path.join('src', 'index.html');

let html = fs.readFileSync(htmlFile, 'utf8');

let totalGalleries = 0;
let totalImages = 0;

for (let i = 1; i <= 18; i++) {
    const folder = path.join(galleriesDir, `preview-${i}`);
    const startMarker = `<!-- GALLERY:preview-${i} -->`;
    const endMarker = `<!-- /GALLERY:preview-${i} -->`;

    let galleryHtml = '';

    if (fs.existsSync(folder)) {
        const images = fs.readdirSync(folder)
            .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
            .sort();

        if (images.length > 0) {
            totalGalleries++;
            totalImages += images.length;

            const imgTags = images.map(img => {
                const src = `img/galleries/preview-${i}/${img}`;
                const alt = img.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
                // Note: NO loading="lazy" — gallery images live inside hidden preview
                // containers (height:0/opacity:0) until opened, so browsers never
                // trigger lazy loading for them and they'd never appear.
                return `                                    <img src="${src}" alt="${alt}">`;
            }).join('\n');

            galleryHtml = `                            <div class="preview__item-gallery">
                                <h3>Gallery</h3>
                                <div class="preview__item-gallery-items">
${imgTags}
                                </div>
                            </div>`;
        }
    }

    // Replace content between markers
    const escapedStart = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedEnd = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedStart + '[\\s\\S]*?' + escapedEnd, 'g');

    html = html.replace(regex, startMarker + '\n' + galleryHtml + '\n' + endMarker);
}

fs.writeFileSync(htmlFile, html);
console.log(`Synced ${totalGalleries} galleries with ${totalImages} total images`);