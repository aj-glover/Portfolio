const fs = require('fs');

// Create an empty .nojekyll file so GitHub Pages serves files as-is.
// Without this, Jekyll ignores files/dirs starting with '_' (e.g. _DSC*.jpg),
// causing 404s for those gallery images.
fs.writeFileSync('dist/.nojekyll', '');

const file = 'dist/index.html';

let html = fs.readFileSync(file, 'utf8');

// Convert absolute paths (leading /) to relative (./)
// so the built site works via file:/// protocol
// Handles double-quoted, single-quoted, and unquoted attributes
html = html.replace(/href="\//g, 'href="./');
html = html.replace(/src="\//g, 'src="./');
html = html.replace(/href='\//g, "href='./");
html = html.replace(/src='\//g, "src='./");
html = html.replace(/href=\//g, 'href=./');
html = html.replace(/src=\//g, 'src=./');

// Change script type from module to text/javascript
// so it works via file:/// protocol (ES modules are blocked by CORS on file:///)
html = html.replace(/<script type=module/g, '<script type=text/javascript');
html = html.replace(/<script type="module"/g, '<script type="text/javascript"');
html = html.replace(/<script type='module'/g, "<script type='text/javascript'");

fs.writeFileSync(file, html);
console.log('Fixed absolute paths and script type in dist/index.html');
