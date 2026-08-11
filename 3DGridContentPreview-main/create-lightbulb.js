const fs = require('fs');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- Bulb -->
  <path d="M32 4C24 4 18 10 18 18c0 4.5 2 8.5 5 11v2c0 1.7 1.3 3 3 3h12c1.7 0 3-1.3 3-3v-2c3-2.5 5-6.5 5-11C46 10 40 4 32 4Z"/>
  <!-- Filament support -->
  <path d="M26 26v4a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-4"/>
  <!-- Base lines -->
  <line x1="23" y1="38" x2="41" y2="38"/>
  <line x1="25" y1="42" x2="39" y2="42"/>
  <line x1="28" y1="46" x2="36" y2="46"/>
  <!-- Contact point -->
  <circle cx="32" cy="58" r="2"/>
  <line x1="32" y1="48" x2="32" y2="56"/>
  <!-- RAYS -->
  <path d="M26 6c-2 2-4 4-4 8"/>
  <path d="M24 14l-3 2"/>
  <path d="M20 8l-2 3"/>
  <path d="M38 6c2 2 4 4 4 8"/>
  <path d="M40 14l3 2"/>
  <path d="M44 8l2 3"/>
  <path d="M32 0v4"/>
  <path d="M14 22h-4"/>
  <path d="M50 22h4"/>
  <!-- Glow lines inside bulb -->
  <path d="M28 22l2 2m6-2l-2 2"/>
</svg>`;

const thumbsDir = path.join('src', 'img', 'thumbs');
const fullDir = path.join('src', 'img', 'full');

fs.writeFileSync(path.join(thumbsDir, '17.svg'), svg);
fs.writeFileSync(path.join(fullDir, '17.svg'), svg);

console.log('Light bulb SVG created in thumbs/17.svg and full/17.svg');