/**
 * src/game/ambient/textures.js - Lazily-built, shared CanvasTextures.
 *
 * Requirement #18: "reused geometries/materials". Every glow in the ambient
 * layer (lasers, trail, comet, fragments, stars) samples one of these three
 * small textures rather than owning its own.
 */

import { CanvasTexture } from 'three';

/** @type {Record<string, CanvasTexture>} */
const cache = {};

/**
 * Builds a radial-gradient sprite texture.
 * @param {number} size - Square texture edge in px.
 * @param {Array<[number, string]>} stops - [offset, cssColor] pairs.
 * @returns {CanvasTexture}
 */
const radial = (size, stops) => {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([offset, color]) => g.addColorStop(offset, color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new CanvasTexture(c);
};

/**
 * Soft white/blue glow — used by the ship trail and star highlights.
 * @returns {CanvasTexture}
 */
export const getSoftGlow = () => {
    if (!cache.softGlow) {
        cache.softGlow = radial(64, [
            [0, 'rgba(255, 255, 255, 1)'],
            [0.25, 'rgba(190, 225, 255, 0.55)'],
            [1, 'rgba(120, 180, 255, 0)']
        ]);
    }
    return cache.softGlow;
};

/**
 * Tight cyan core — used by lasers. Sharper falloff keeps the bolt "thin and
 * visually sharp" (requirement #2) instead of a soft blob.
 * @returns {CanvasTexture}
 */
export const getLaserGlow = () => {
    if (!cache.laserGlow) {
        cache.laserGlow = radial(64, [
            [0, 'rgba(255, 255, 255, 1)'],
            [0.12, 'rgba(140, 235, 255, 0.95)'],
            [0.4, 'rgba(80, 200, 255, 0.25)'],
            [1, 'rgba(40, 140, 255, 0)']
        ]);
    }
    return cache.laserGlow;
};

/**
 * Warm bright point with a long falloff — comet heads and UFO lights.
 * @returns {CanvasTexture}
 */
export const getCometGlow = () => {
    if (!cache.cometGlow) {
        cache.cometGlow = radial(128, [
            [0, 'rgba(255, 255, 255, 1)'],
            [0.1, 'rgba(220, 240, 255, 0.85)'],
            [0.35, 'rgba(150, 200, 255, 0.28)'],
            [1, 'rgba(90, 150, 255, 0)']
        ]);
    }
    return cache.cometGlow;
};

/**
 * Frees every cached texture. Only called on full teardown.
 */
export const disposeTextures = () => {
    Object.keys(cache).forEach((k) => {
        cache[k].dispose();
        delete cache[k];
    });
};

export default { getSoftGlow, getLaserGlow, getCometGlow, disposeTextures };
