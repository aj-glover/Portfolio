/**
 * src/game/ambient/starfield.js - Three-layer parallax starfield (requirements #4, #5).
 *
 * Lives in the orthographic overlay scene, so all units are screen pixels.
 * Each layer is a single THREE.Points — three draw calls total regardless of
 * star count. Stars never move individually; the whole layer translates, and
 * wraps horizontally when it has drifted a full viewport width.
 *
 * The layer also owns the hyperspace stretch (requirement #8) because stretching
 * stars is fundamentally a starfield concern, not a separate object.
 */

import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, AdditiveBlending } from 'three';

/**
 * Layer definitions. `parallax` values come straight from requirement #5.
 */
const LAYERS = [
    { name: 'bg',  count: 240, size: 1.1, opacity: 0.35, parallax: 0.02, drift: 1.5,  z: -9, repel: false },
    { name: 'mid', count: 160, size: 1.8, opacity: 0.55, parallax: 0.05, drift: 4.0,  z: -7, repel: false },
    // Only the foreground layer reacts to the ship — it is the layer that reads
    // as being in the same space as the craft (requirement #13).
    { name: 'fg',  count: 60,  size: 2.6, opacity: 0.85, parallax: 0.10, drift: 9.0,  z: -5, repel: true }
];

/** Radius (px) within which foreground particles drift away from the ship. */
const REPEL_RADIUS = 110;

/** Maximum displacement (px) applied to a repelled particle. */
const REPEL_STRENGTH = 26;


/** @type {Array<{points: Points, def: object, offsetX: number, offsetY: number, baseSize: number}>} */
let layers = [];

/** @type {import('three').Scene|null} */
let sceneRef = null;

/** Current hyperspace stretch, 0..1. Eased by whoever drives it. */
let stretch = 0;

/**
 * Fills a layer geometry with stars spread over a 2w x 2h area centred on origin.
 * Covering twice the viewport lets the layer wrap without visible gaps.
 */
const buildGeometry = (count, w, h) => {
    const verts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        verts[i * 3] = (Math.random() - 0.5) * w * 2;
        verts[i * 3 + 1] = (Math.random() - 0.5) * h * 2;
        verts[i * 3 + 2] = 0;
    }
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(verts, 3));
    return geom;
};

/**
 * Creates all three layers and adds them to the overlay scene.
 * @param {import('three').Scene} scene
 * @param {object} profile - Capability profile (controls density).
 */
export const init = (scene, profile) => {
    if (layers.length) return;
    sceneRef = scene;

    const w = window.innerWidth;
    const h = window.innerHeight;

    layers = LAYERS.map((def) => {
        const count = Math.max(20, Math.round(def.count * profile.starDensityScale));
        const geom = buildGeometry(count, w, h);

        const mat = new PointsMaterial({
            size: def.size,
            color: 0xffffff,
            transparent: true,
            opacity: def.opacity,
            sizeAttenuation: false, // Ortho camera: keep `size` in device pixels.
            depthWrite: false,
            depthTest: false,
            blending: AdditiveBlending
        });

        const points = new Points(geom, mat);
        points.position.z = def.z;
        points.renderOrder = -10;
        points.frustumCulled = false;
        scene.add(points);

        // Repelling layers keep an untouched copy of their positions so the
        // displacement is always applied relative to rest, never accumulated.
        const basePositions = def.repel
            ? Float32Array.from(geom.getAttribute('position').array)
            : null;

        return { points, def, offsetX: 0, offsetY: 0, baseSize: def.size, basePositions };
    });
};

/**
 * Gently pushes foreground particles away from the ship (requirement #13).
 *
 * Runs on 60 points, so the per-vertex cost is negligible. Displacement is
 * eased toward its target rather than snapped, and is always computed from the
 * stored rest positions so particles settle back exactly where they started.
 *
 * @param {object} layer
 * @param {object} ctx
 */
const applyRepulsion = (layer, ctx) => {
    const attr = layer.points.geometry.getAttribute('position');
    const arr = attr.array;
    const base = layer.basePositions;

    // Ship position expressed in this layer's local space.
    const shipLocalX = ctx.shipX - layer.points.position.x;
    const shipLocalY = ctx.shipY - layer.points.position.y;

    // Ease factor, frame-rate independent.
    const k = Math.min(1, ctx.dt * 6);
    let changed = false;

    for (let i = 0; i < attr.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];

        const dx = bx - shipLocalX;
        const dy = by - shipLocalY;
        const distSq = dx * dx + dy * dy;

        let targetX = bx;
        let targetY = by;

        if (distSq < REPEL_RADIUS * REPEL_RADIUS && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const push = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            targetX = bx + (dx / dist) * push;
            targetY = by + (dy / dist) * push;
        }

        const cx = arr[i * 3];
        const cy = arr[i * 3 + 1];
        const nx = cx + (targetX - cx) * k;
        const ny = cy + (targetY - cy) * k;

        // Skip sub-pixel churn so we do not upload the buffer every frame.
        if (Math.abs(nx - cx) > 0.01 || Math.abs(ny - cy) > 0.01) {
            arr[i * 3] = nx;
            arr[i * 3 + 1] = ny;
            changed = true;
        }
    }

    if (changed) attr.needsUpdate = true;
};


/**
 * Advances drift and applies smoothed mouse parallax.
 *
 * @param {object} ctx - Shared ambient context.
 * @param {number} ctx.mouseNX - Smoothed normalized mouse X (-1..1).
 * @param {number} ctx.mouseNY - Smoothed normalized mouse Y (-1..1).
 * @param {number} ctx.dt - Delta seconds.
 * @param {number} ctx.parallaxScale - Global parallax multiplier from the profile.
 */
export const update = (ctx) => {
    if (!layers.length) return;

    const w = window.innerWidth;
    const halfW = w / 2;

    for (const layer of layers) {
        const { def, points } = layer;

        // Constant slow drift leftward — the sense of forward travel.
        layer.offsetX -= def.drift * ctx.dt * (1 + stretch * 6);

        // Wrap by one viewport width; the 2w-wide field keeps coverage seamless.
        if (layer.offsetX <= -w) layer.offsetX += w;
        if (layer.offsetX >= w) layer.offsetX -= w;

        // Mouse parallax. Negative so the field slides opposite the cursor,
        // which reads as depth rather than as dragging the scene around.
        const px = -ctx.mouseNX * halfW * def.parallax * ctx.parallaxScale;
        const py = -ctx.mouseNY * (window.innerHeight / 2) * def.parallax * ctx.parallaxScale;

        points.position.x = layer.offsetX + px;
        points.position.y = py;

        // Hyperspace: widen the point size slightly and brighten. A true
        // per-star streak would need a custom shader; scaling size + opacity
        // reads correctly at the 300-700ms this effect is on screen.
        points.material.size = layer.baseSize * (1 + stretch * def.parallax * 30);
        points.material.opacity = Math.min(1, def.opacity * (1 + stretch * 0.8));

        // Foreground particles yield to the ship. Suppressed under reduced
        // motion, where extra incidental movement is exactly what to avoid.
        if (layer.basePositions && ctx.parallaxScale > 0.5) {
            applyRepulsion(layer, ctx);
        }
    }
};


/**
 * Sets the hyperspace stretch amount.
 * @param {number} value - 0 (normal) .. 1 (full jump).
 */
export const setStretch = (value) => {
    stretch = Math.max(0, Math.min(1, value));
};

/**
 * Rebuilds geometry for the new viewport size.
 */
export const handleResize = () => {
    if (!layers.length) return;
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const layer of layers) {
        const count = layer.points.geometry.getAttribute('position').count;
        layer.points.geometry.dispose();
        layer.points.geometry = buildGeometry(count, w, h);
        layer.offsetX = 0;

        // Rest positions must track the regenerated geometry, otherwise
        // repulsion would pull particles back to stale coordinates.
        if (layer.basePositions) {
            layer.basePositions = Float32Array.from(
                layer.points.geometry.getAttribute('position').array
            );
        }
    }
};


/**
 * Removes and frees all layers.
 */
export const dispose = () => {
    layers.forEach(({ points }) => {
        sceneRef?.remove(points);
        points.geometry.dispose();
        points.material.dispose();
    });
    layers = [];
    sceneRef = null;
    stretch = 0;
};

export default { init, update, setStretch, handleResize, dispose };
