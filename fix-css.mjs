import fs from 'fs';

let cs = fs.readFileSync('src/styles/case-study.css', 'utf8');

// Remove the old incorrectly-named edge-hint CSS block (from its comment to the start of the correct block)
cs = cs.replace(
    /\n\/\* --- Edge scroll affordance hint --- \*\/[\s\S]*?\n\}\n\n\/\* --- Edge scroll affordance \(classes/,
    '\n/* --- Edge scroll affordance (classes'
);

fs.writeFileSync('src/styles/case-study.css', cs);
console.log('old block removed:', !cs.includes('case-study-edge-hint'));
console.log('new block present:', cs.includes('scroll-edge--bottom.is-active'));
console.log('single edgePulse:', (cs.match(/@keyframes edgePulse/g) || []).length === 1);
