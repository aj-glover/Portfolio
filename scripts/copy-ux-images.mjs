:// Temporary helper to copy UX-design images into project gallery folders.
import fs from 'fs';
import path from 'path';

const copy = (src, dest) => {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dest);
};

// --- RhymeBook (12 images: Rhymebook-images-0.jpg .. -11.jpg) ---
const rbSrc = 'C:\\Users\\AJ\\Desktop\\Rhymebook-images-2';
const rbDest = path.join('src', 'assets', 'projects', 'rhymebook', 'gallery');
for (let i = 0; i <= 11; i++) {
  const num = String(i + 1).padStart(2, '0');
  copy(path.join(rbSrc, `Rhymebook-images-${i}.jpg`), path.join(rbDest, `${num}-rhymebook.jpg`));
}
console.log('RhymeBook:', (fs.readdirSync(rbDest).length), 'files');

// --- FanRant (6 images, remapped names) ---
const frSrc = 'C:\\Users\\AJ\\Desktop\\Work Samples\\UX Design';
const frDest = path.join('src', 'assets', 'projects', 'fanrant', 'gallery');
const frMap = [
  ['1welcome.jpg',  '01-welcome.jpg'],
  ['2Login.jpg',    '02-login.jpg'],
  ['3sports.jpg',   '03-sports.jpg'],
  ['4nflteams.jpg', '04-nflteams.jpg'],
  ['5teampage.jpg', '05-teampage.jpg'],
  ['6venues.jpg',   '06-venues.jpg'],
];
for (const [srcName, destName] of frMap) {
  copy(path.join(frSrc, srcName), path.join(frDest, destName));
}
console.log('FanRant:', (fs.readdirSync(frDest).length), 'files');

// --- Shake It (8 screenshots) ---
const siSrc = 'C:\\Users\\AJ\\Downloads\\uppercuts-20260731T074410Z-1-001\\attachments';
const siDest = path.join('src', 'assets', 'projects', 'shake-it', 'gallery');
const siFiles = [
  'Screenshot_2019-09-02-14-41-06.png',
  'Screenshot_2019-09-02-14-41-13.png',
  'Screenshot_2019-09-02-14-41-16.png',
  'Screenshot_2019-09-02-14-41-21.png',
  'Screenshot_2019-09-02-14-41-27.png',
  'Screenshot_2019-09-02-14-41-40.png',
  'Screenshot_2019-09-02-14-41-46.png',
  'Screenshot_2019-09-02-14-41-58.png',
];
siFiles.forEach((f, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  copy(path.join(siSrc, f), path.join(siDest, `${num}-shake-it.png`));
});
console.log('ShakeIt:', (fs.readdirSync(siDest).length), 'files');
