/**
 * scripts/optimize-models.mjs
 *
 * Shrinks the embedded textures inside the GLB models.
 *
 * The planet models are ~99% texture data, not geometry: each is a single
 * mesh primitive carrying 4096x4096 (and, on cursor.glb, 8192x8192) JPEG
 * maps. On screen a planet is a few hundred pixels across and the ship
 * cursor is smaller still, so those maps are one to two orders of magnitude
 * larger than anything that can be displayed.
 *
 * This rewrites each GLB in place-safe fashion (source -> new file) with its
 * embedded images re-encoded at a sane resolution. Geometry, materials,
 * animations, and the glTF node graph are untouched — only the bytes of the
 * image bufferViews change, and the JSON is rewritten to match the new
 * offsets and lengths.
 *
 * Usage:
 *   node scripts/optimize-models.mjs --dry-run   # report sizes only
 *   node scripts/optimize-models.mjs             # write *.opt.glb
 *   node scripts/optimize-models.mjs --replace   # overwrite originals
 *                                                # (originals -> *.orig.glb)
 *
 * Requires ffmpeg on PATH.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, readdir, stat, mkdtemp, rm, rename, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const MODELS_DIR = path.resolve(process.cwd(), 'public/models');

/** Max edge length for an embedded texture, per model name pattern. */
const MAX_TEXTURE = 1024;

/** JPEG quality for re-encoded textures (ffmpeg -q:v, 2 best .. 31 worst). */
const JPEG_QUALITY = 5;

const DRY_RUN = process.argv.includes('--dry-run');
const REPLACE = process.argv.includes('--replace');

const GLB_MAGIC = 0x46546C67; // 'glTF'
const CHUNK_JSON = 0x4E4F534A; // 'JSON'
const CHUNK_BIN = 0x004E4942; // 'BIN'

/**
 * Aligns a length up to a 4-byte boundary, as the GLB spec requires.
 * @param {number} n
 * @returns {number}
 */
const align4 = (n) => (n + 3) & ~3;

/**
 * Reads the dimensions of a JPEG or PNG buffer.
 * @param {Buffer} buf
 * @returns {{width: number, height: number}|null}
 */
const imageSize = (buf) => {
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504E47) {
        return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf.length > 4 && buf[0] === 0xFF && buf[1] === 0xD8) {
        let i = 2;
        while (i < buf.length - 9) {
            if (buf[i] !== 0xFF) { i++; continue; }
            const marker = buf[i + 1];
            if (marker >= 0xC0 && marker <= 0xC3) {
                return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
            }
            if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
                i += 2;
                continue;
            }
            i += 2 + buf.readUInt16BE(i + 2);
        }
    }
    return null;
};

/**
 * Parses a GLB into its JSON and BIN chunks.
 * @param {Buffer} buf
 * @returns {{json: object, bin: Buffer}}
 */
const parseGlb = (buf) => {
    if (buf.readUInt32LE(0) !== GLB_MAGIC) throw new Error('not a GLB');
    let offset = 12;
    let json = null;
    let bin = Buffer.alloc(0);

    while (offset < buf.length) {
        const length = buf.readUInt32LE(offset);
        const type = buf.readUInt32LE(offset + 4);
        const data = buf.subarray(offset + 8, offset + 8 + length);
        if (type === CHUNK_JSON) json = JSON.parse(data.toString('utf8'));
        else if (type === CHUNK_BIN) bin = data;
        offset += 8 + align4(length);
    }

    if (!json) throw new Error('GLB has no JSON chunk');
    return { json, bin };
};

/**
 * Serialises JSON and BIN chunks back into a GLB buffer.
 * @param {object} json
 * @param {Buffer} bin
 * @returns {Buffer}
 */
const buildGlb = (json, bin) => {
    const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
    const jsonPad = align4(jsonBuf.length) - jsonBuf.length;
    const binPad = align4(bin.length) - bin.length;

    const jsonChunk = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);
    const binChunk = Buffer.concat([bin, Buffer.alloc(binPad, 0)]);

    const total = 12 + 8 + jsonChunk.length + (binChunk.length ? 8 + binChunk.length : 0);
    const out = Buffer.alloc(total);

    out.writeUInt32LE(GLB_MAGIC, 0);
    out.writeUInt32LE(2, 4);
    out.writeUInt32LE(total, 8);

    let p = 12;
    out.writeUInt32LE(jsonChunk.length, p);
    out.writeUInt32LE(CHUNK_JSON, p + 4);
    jsonChunk.copy(out, p + 8);
    p += 8 + jsonChunk.length;

    if (binChunk.length) {
        out.writeUInt32LE(binChunk.length, p);
        out.writeUInt32LE(CHUNK_BIN, p + 4);
        binChunk.copy(out, p + 8);
    }

    return out;
};

/**
 * Re-encodes one image buffer at a bounded resolution.
 * @param {Buffer} buf
 * @param {string} workDir
 * @param {number} index
 * @returns {Promise<Buffer>} The re-encoded buffer, or the original on failure.
 */
const shrinkImage = async (buf, workDir, index) => {
    const size = imageSize(buf);
    if (!size) return buf;
    if (Math.max(size.width, size.height) <= MAX_TEXTURE) return buf;

    const inPath = path.join(workDir, `in-${index}`);
    const outPath = path.join(workDir, `out-${index}.jpg`);
    await writeFile(inPath, buf);

    try {
        await execFileAsync('ffmpeg', [
            '-y', '-loglevel', 'error',
            '-i', inPath,
            '-vf', `scale='min(${MAX_TEXTURE},iw)':-2:flags=lanczos`,
            '-q:v', String(JPEG_QUALITY),
            outPath
        ]);
        return await readFile(outPath);
    } catch (err) {
        console.warn(`    texture ${index}: re-encode failed (${err.message.trim().split('\n')[0]}), keeping original`);
        return buf;
    }
};

/**
 * Rewrites one GLB with shrunken textures.
 * @param {string} file - Absolute path to the .glb
 */
const processModel = async (file) => {
    const name = path.basename(file);
    const original = await readFile(file);
    const { json, bin } = parseGlb(original);

    const images = json.images || [];
    const bufferViews = json.bufferViews || [];
    if (images.length === 0) {
        console.log(`  ${name}: no embedded images, skipped`);
        return;
    }

    // Map each image's bufferView to its replacement bytes.
    const replacements = new Map();
    const workDir = await mkdtemp(path.join(tmpdir(), 'glbtex-'));

    try {
        for (let i = 0; i < images.length; i++) {
            const view = bufferViews[images[i].bufferView];
            if (!view) continue;
            const start = view.byteOffset || 0;
            const slice = bin.subarray(start, start + view.byteLength);
            const before = imageSize(slice);
            const shrunk = await shrinkImage(slice, workDir, i);

            if (shrunk !== slice && shrunk.length < slice.length) {
                replacements.set(images[i].bufferView, shrunk);
                images[i].mimeType = 'image/jpeg';
                const after = imageSize(shrunk);
                console.log(
                    `    tex ${i}: ${before ? `${before.width}x${before.height}` : '?'}` +
                    ` -> ${after ? `${after.width}x${after.height}` : '?'}` +
                    `  ${(slice.length / 1048576).toFixed(2)} -> ${(shrunk.length / 1048576).toFixed(2)} MB`
                );
            }
        }

        if (replacements.size === 0) {
            console.log(`  ${name}: textures already small enough`);
            return;
        }

        // Rebuild the BIN chunk, rewriting every bufferView offset in order so
        // accessors that share the buffer stay valid.
        const order = bufferViews
            .map((view, index) => ({ view, index, offset: view.byteOffset || 0 }))
            .sort((a, b) => a.offset - b.offset);

        const parts = [];
        let cursor = 0;

        for (const { view, index } of order) {
            const replacement = replacements.get(index);
            const start = view.byteOffset || 0;
            const bytes = replacement || bin.subarray(start, start + view.byteLength);

            const pad = align4(cursor) - cursor;
            if (pad) { parts.push(Buffer.alloc(pad)); cursor += pad; }

            view.byteOffset = cursor;
            view.byteLength = bytes.length;
            parts.push(bytes);
            cursor += bytes.length;
        }

        const newBin = Buffer.concat(parts);
        if (json.buffers && json.buffers[0]) json.buffers[0].byteLength = newBin.length;

        const out = buildGlb(json, newBin);
        const destination = REPLACE ? file : file.replace(/\.glb$/, '.opt.glb');

        if (REPLACE) {
            const backup = file.replace(/\.glb$/, '.orig.glb');
            try {
                await access(backup);
            } catch {
                await rename(file, backup);
            }
        }

        await writeFile(destination, out);
        console.log(
            `  ${name}: ${(original.length / 1048576).toFixed(1)} MB -> ` +
            `${(out.length / 1048576).toFixed(1)} MB`
        );
    } finally {
        await rm(workDir, { recursive: true, force: true });
    }
};

const main = async () => {
    const entries = await readdir(MODELS_DIR);
    const models = entries
        .filter(f => f.endsWith('.glb') && !f.endsWith('.opt.glb') && !f.endsWith('.orig.glb'))
        .map(f => path.join(MODELS_DIR, f));

    let before = 0;
    for (const m of models) before += (await stat(m)).size;
    console.log(`${models.length} models, ${(before / 1048576).toFixed(1)} MB total\n`);

    if (DRY_RUN) {
        for (const m of models) {
            const buf = await readFile(m);
            const { json, bin } = parseGlb(buf);
            console.log(`${path.basename(m)}  ${(buf.length / 1048576).toFixed(1)} MB`);
            (json.images || []).forEach((img, i) => {
                const view = (json.bufferViews || [])[img.bufferView];
                if (!view) return;
                const start = view.byteOffset || 0;
                const size = imageSize(bin.subarray(start, start + view.byteLength));
                console.log(
                    `    tex ${i}: ${size ? `${size.width}x${size.height}` : '?'}` +
                    `  ${(view.byteLength / 1048576).toFixed(2)} MB`
                );
            });
        }
        return;
    }

    for (const m of models) {
        console.log(path.basename(m));
        await processModel(m);
    }
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
