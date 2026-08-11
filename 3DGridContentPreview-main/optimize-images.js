const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const MAX_WIDTH = 2400;
const JPEG_QUALITY = 92;
const PNG_QUALITY = 92;

const imageDirs = [
    path.join('src', 'img', 'thumbs'),
    path.join('src', 'img', 'full'),
    path.join('src', 'img', 'galleries'),
];

const imageExts = /\.(jpg|jpeg|png)$/i;

async function optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const stat = fs.statSync(filePath);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);

    // Skip files under 500KB — already small enough
    if (stat.size < 500 * 1024) {
        return { file: path.basename(filePath), skipped: true, sizeMB };
    }

    try {
        // Read file into buffer first to avoid Windows file locking issues
        const inputBuffer = fs.readFileSync(filePath);
        let pipeline = sharp(inputBuffer)
            .resize({ width: MAX_WIDTH, withoutEnlargement: true });

        if (ext === '.jpg' || ext === '.jpeg') {
            pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
        } else if (ext === '.png') {
            pipeline = pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9 });
        }

        // Use toBuffer() instead of toFile() to avoid Windows file copy issues
        const buffer = await pipeline.toBuffer();
        const newSizeMB = (buffer.length / (1024 * 1024)).toFixed(1);

        // Only replace if the optimized version is smaller
        if (buffer.length < stat.size) {
            fs.writeFileSync(filePath, buffer);
            return { file: path.basename(filePath), skipped: false, sizeMB, newSizeMB };
        } else {
            return { file: path.basename(filePath), skipped: true, sizeMB };
        }
    } catch (err) {
        console.error(`  ⚠ Failed: ${path.basename(filePath)} — ${err.message}`);
        return { file: path.basename(filePath), skipped: true, sizeMB, error: true };
    }
}

async function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries
        .filter(e => e.isFile() && imageExts.test(e.name))
        .map(e => path.join(dir, e.name));

    const subdirs = entries
        .filter(e => e.isDirectory())
        .map(e => path.join(dir, e.name));

    for (const file of files) {
        const result = await optimizeImage(file);
        if (result.skipped) {
            console.log(`  ⊝ ${result.file} (${result.sizeMB} MB) — skipped`);
        } else {
            const savings = ((parseFloat(result.sizeMB) - parseFloat(result.newSizeMB)) / parseFloat(result.sizeMB) * 100).toFixed(0);
            console.log(`  ✓ ${result.file} (${result.sizeMB} → ${result.newSizeMB} MB, -${savings}%)`);
        }
    }

    for (const subdir of subdirs) {
        await processDirectory(subdir);
    }
}

async function main() {
    console.log('Optimizing images (max width: 1920px, JPEG quality: 80)...\n');

    for (const dir of imageDirs) {
        const dirName = path.relative(path.join('src', 'img'), dir);
        console.log(`\n📁 ${dirName || 'root'}:`);
        await processDirectory(dir);
    }

    console.log('\n✅ Image optimization complete');
}

main().catch(err => {
    console.error('Image optimization failed:', err);
    process.exit(1);
});