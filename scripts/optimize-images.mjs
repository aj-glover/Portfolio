/**
 * scripts/optimize-images.mjs
 *
 * Generates web-sized derivatives of the project gallery images.
 *
 * The originals under public/assets/projects are camera exports — up to
 * 6016x4016 and 20MB each. They were being served straight to browsers for
 * two very different jobs:
 *
 *   1. Floating project cards in the 3D scene, drawn on a 512x384 texture.
 *   2. Case-study gallery images, displayed at most ~900px wide.
 *
 * Neither needs more than a fraction of the original pixels, so this script
 * writes two derivatives next to each source image:
 *
 *   <name>.thumb.jpg  -> 512px wide, for the card textures (loaded eagerly
 *                        at startup, so this is the one that gates the intro)
 *   <name>.web.jpg    -> 1600px wide, for the case-study galleries
 *
 * Originals are never modified or deleted — they stay as the archival copy
 * and can be re-derived from at any time.
 *
 * Usage:
 *   node scripts/optimize-images.mjs           # generate missing derivatives
 *   node scripts/optimize-images.mjs --force   # regenerate everything
 *   node scripts/optimize-images.mjs --dry-run # report only
 *
 * Requires ffmpeg on PATH.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, stat, access } from 'node:fs/promises';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(process.cwd(), 'public/assets/projects');
const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png']);

/** Derivative variants: suffix -> target width. */
const VARIANTS = [
    { suffix: '.thumb.jpg', width: 512, quality: 4 },
    { suffix: '.web.jpg', width: 1600, quality: 3 }
];

const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * True when a path already refers to a generated derivative rather than an
 * original — prevents the script from deriving from its own output.
 * @param {string} name
 * @returns {boolean}
 */
const isDerivative = (name) =>
    VARIANTS.some(v => name.endsWith(v.suffix));

/**
 * Recursively collects original image files under a directory.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const collect = async (dir) => {
    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        return [];
    }

    const out = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...await collect(full));
        } else if (
            SOURCE_EXT.has(path.extname(entry.name).toLowerCase()) &&
            !isDerivative(entry.name)
        ) {
            out.push(full);
        }
    }
    return out;
};

/**
 * @param {string} p
 * @returns {Promise<boolean>}
 */
const exists = async (p) => {
    try {
        await access(p);
        return true;
    } catch {
        return false;
    }
};

/**
 * Produces one resized derivative with ffmpeg.
 * Downscale only — images already narrower than the target keep their size.
 * @param {string} src
 * @param {string} dest
 * @param {number} width
 * @param {number} quality - ffmpeg -q:v (2 best .. 31 worst)
 */
const derive = async (src, dest, width, quality) => {
    await execFileAsync('ffmpeg', [
        '-y',
        '-loglevel', 'error',
        '-i', src,
        '-vf', `scale='min(${width},iw)':-2:flags=lanczos`,
        '-q:v', String(quality),
        dest
    ]);
};

const main = async () => {
    const files = await collect(ROOT);
    if (files.length === 0) {
        console.log(`No source images found under ${ROOT}`);
        return;
    }

    let originalBytes = 0;
    let derivedBytes = 0;
    let made = 0;
    let skipped = 0;

    for (const src of files) {
        const dir = path.dirname(src);
        const base = path.basename(src, path.extname(src));
        originalBytes += (await stat(src)).size;

        for (const variant of VARIANTS) {
            const dest = path.join(dir, base + variant.suffix);

            if (!FORCE && await exists(dest)) {
                derivedBytes += (await stat(dest)).size;
                skipped++;
                continue;
            }

            if (DRY_RUN) {
                console.log(`would write ${path.relative(ROOT, dest)}`);
                made++;
                continue;
            }

            try {
                await derive(src, dest, variant.width, variant.quality);
                derivedBytes += (await stat(dest)).size;
                made++;
            } catch (err) {
                console.warn(`FAILED ${path.relative(ROOT, src)} -> ${variant.suffix}: ${err.message}`);
            }
        }
    }

    const mb = (n) => (n / 1048576).toFixed(1);
    console.log('');
    console.log(`sources          : ${files.length} files, ${mb(originalBytes)} MB`);
    console.log(`derivatives      : ${made} written, ${skipped} already present`);
    if (!DRY_RUN) {
        console.log(`derivative bytes : ${mb(derivedBytes)} MB`);
    }
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
