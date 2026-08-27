/**
 * scripts/simplify-cursor.mjs
 *
 * Decimates the ship-cursor mesh.
 *
 * cursor.glb is a single primitive with ~1.03M vertices and ~1.99M triangles.
 * Its embedded textures were already shrunk by scripts/optimize-models.mjs, so
 * essentially all of the remaining ~54MB is raw geometry — for a model that
 * renders about 60 CSS pixels across (see the targetSize in src/game/cursor.js).
 * At that size the silhouette is a few hundred pixels of screen area, so the
 * overwhelming majority of those triangles are smaller than a pixel.
 *
 * This runs meshoptimizer's simplifier, then welds and re-quantizes the result.
 * Vertex positions keep enough precision for a model this small on screen.
 *
 * Usage:
 *   node scripts/simplify-cursor.mjs                 # default ratio
 *   node scripts/simplify-cursor.mjs --ratio 0.05    # keep 5% of triangles
 *   node scripts/simplify-cursor.mjs --dry-run
 *
 * The source is read from .asset-originals/models/ when a copy exists there,
 * so re-running never compounds loss by simplifying an already-simplified mesh.
 */

import { NodeIO } from '@gltf-transform/core';
import { simplify, weld, dedup, prune, quantize } from '@gltf-transform/functions';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const TARGET = path.resolve(process.cwd(), 'public/models/cursor.glb');
const ARCHIVE = path.resolve(process.cwd(), '.asset-originals/models/cursor.glb');

const argRatio = process.argv.indexOf('--ratio');
const RATIO = argRatio !== -1 ? Number(process.argv[argRatio + 1]) : 0.04;
const DRY_RUN = process.argv.includes('--dry-run');

/** Simplification error tolerance, as a fraction of mesh extent. */
const ERROR = 0.005;

const mb = (n) => (n / 1048576).toFixed(1);

const main = async () => {
    if (!Number.isFinite(RATIO) || RATIO <= 0 || RATIO > 1) {
        throw new Error(`--ratio must be between 0 and 1 (got ${RATIO})`);
    }

    // Prefer the untouched original so repeated runs stay lossless-from-source.
    // Its textures are the large originals, so re-shrink them here via quantize
    // + the existing texture sizes already applied to the deployed copy.
    const source = existsSync(TARGET) ? TARGET : ARCHIVE;

    await MeshoptSimplifier.ready;

    // Quantized vertex attributes require KHR_mesh_quantization to be declared;
    // without it the file is out of spec even though three.js reads it anyway.
    const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
    const doc = await io.read(source);
    const root = doc.getRoot();

    let vertsBefore = 0;
    let trisBefore = 0;
    for (const mesh of root.listMeshes()) {
        for (const prim of mesh.listPrimitives()) {
            vertsBefore += prim.getAttribute('POSITION').getCount();
            const idx = prim.getIndices();
            trisBefore += idx ? idx.getCount() / 3 : prim.getAttribute('POSITION').getCount() / 3;
        }
    }

    const before = (await stat(source)).size;
    console.log(`source : ${path.relative(process.cwd(), source)}`);
    console.log(`before : ${mb(before)} MB, ${vertsBefore.toLocaleString()} verts, ${Math.round(trisBefore).toLocaleString()} tris`);
    console.log(`ratio  : ${RATIO} (error ${ERROR})`);

    if (DRY_RUN) return;

    await doc.transform(
        weld(),
        simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR }),
        dedup(),
        prune(),
        quantize({
            quantizePosition: 14,
            quantizeNormal: 10,
            quantizeTexcoord: 12
        })
    );

    let vertsAfter = 0;
    let trisAfter = 0;
    for (const mesh of root.listMeshes()) {
        for (const prim of mesh.listPrimitives()) {
            vertsAfter += prim.getAttribute('POSITION').getCount();
            const idx = prim.getIndices();
            trisAfter += idx ? idx.getCount() / 3 : prim.getAttribute('POSITION').getCount() / 3;
        }
    }

    doc.createExtension(KHRMeshQuantization).setRequired(true);

    await io.write(TARGET, doc);
    const after = (await stat(TARGET)).size;

    console.log(`after  : ${mb(after)} MB, ${vertsAfter.toLocaleString()} verts, ${Math.round(trisAfter).toLocaleString()} tris`);
    console.log(`saved  : ${mb(before - after)} MB (${(100 * (1 - after / before)).toFixed(1)}%)`);
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
