const fs = require('fs');

let html = fs.readFileSync('src/index.html', 'utf8');

// The files exist in src/img/ux/, so the paths should be correct
// Let's just verify and log what we find
const uxRefs = html.match(/img\/ux\/[^"]+/g) || [];
console.log('Found UX references:', uxRefs.length);
uxRefs.forEach(ref => console.log('  ', ref));

// Check if files actually exist
const path = require('path');
uxRefs.forEach(ref => {
    const filePath = path.join('src', ref);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✓' : '✗'} ${filePath}`);
});