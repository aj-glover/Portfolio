const fs = require('fs');

// --- case-study.css ---
let cs = fs.readFileSync('src/styles/case-study.css', 'utf8');

// Widen native scrollbar so it's grabbable over the spring-follow ship
cs = cs.replace(
    /\.case-study-overlay::-webkit-scrollbar \{\r?\n\s*width: 6px;/,
    '.case-study-overlay::-webkit-scrollbar {\r\n    width: 18px;'
);

// Move scroll indicator from the right (where the scrollbar lives) to the left
cs = cs.replace(
    /\.case-study-scroll-indicator \{\r?\n\s*right: 2rem;/,
    '.case-study-scroll-indicator {\r\n    left: 2rem;'
);
// Handle any remaining "right: 2rem" inside the indicator block
cs = cs.replace(
    /(\.case-study-scroll-indicator [^\{]*\{\r?\n\s*)(right: 2rem)/,
    '$1left: 2rem'
);

fs.writeFileSync('src/styles/case-study.css', cs);
console.log('case-study.css: width:18px =', cs.includes('width: 18px'), '| left: 2rem =', cs.includes('left: 2rem'));

// --- about-view.css ---
let av = fs.readFileSync('src/styles/about-view.css', 'utf8');
av = av.replace(
    /\.about-view::-webkit-scrollbar \{\r?\n\s*width: 6px;/,
    '.about-view::-webkit-scrollbar {\r\n    width: 18px;'
);
fs.writeFileSync('src/styles/about-view.css', av);
console.log('about-view.css: width:18px =', av.includes('width: 18px'));
