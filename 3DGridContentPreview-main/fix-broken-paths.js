const fs = require('fs');

let html = fs.readFileSync('src/index.html', 'utf8');

// Fix broken paths - files are in img/galleries/preview-7/ not img/ux/
const fixes = [
    ['img/ux/ux-1welcome.jpg', 'img/galleries/preview-7/ux-1welcome.jpg'],
    ['img/ux/ux-2login.jpg', 'img/galleries/preview-7/ux-2login.jpg'],
    ['img/ux/ux-3sports.jpg', 'img/galleries/preview-7/ux-3sports.jpg'],
    ['img/ux/ux-4nflteams.jpg', 'img/galleries/preview-7/ux-4nflteams.jpg'],
    ['img/ux/ux-5teampage.jpg', 'img/galleries/preview-7/ux-5teampage.jpg'],
    ['img/ux/ux-6venues.jpg', 'img/galleries/preview-7/ux-6venues.jpg'],
    ['img/ux/Rhymebook-images-1.jpg', 'img/galleries/preview-7/Rhymebook-images-1.jpg'],
    ['img/ux/Rhymebook-images-2.jpg', 'img/galleries/preview-7/Rhymebook-images-2.jpg'],
    ['img/ux/Rhymebook-images-3.jpg', 'img/galleries/preview-7/Rhymebook-images-3.jpg'],
    ['img/ux/Rhymebook-images-8.jpg', 'img/galleries/preview-7/Rhymebook-images-8.jpg'],
    ['img/ux/Rhymebook-images-9.jpg', 'img/galleries/preview-7/Rhymebook-images-9.jpg']
];

let fixed = false;
for (const [oldPath, newPath] of fixes) {
    if (html.includes(oldPath)) {
        html = html.split(oldPath).join(newPath);
        console.log(`Fixed: ${oldPath} -> ${newPath}`);
        fixed = true;
    }
}

if (fixed) {
    fs.writeFileSync('src/index.html', html);
    console.log('\nAll paths fixed!');
} else {
    console.log('No fixes needed');
}