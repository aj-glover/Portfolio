/**
 * src/game/ambient/lasers.js - Pooled laser bolts (requirements #2, #14, #15).
 *
 * One sprite per bolt, stretched along its heading so it reads as a thin sharp
 * line rather than a soft blob. The previous implementation allocated three
 * SpriteMaterials per shot; this allocates zero at runtime.
 *
 * Hold-to-fire is supported with a deliberately slower cooldown than a
 * click-spam rate, so it stays playful instead of arcade-y.
 */

import { Sprite, SpriteMaterial, AdditiveBlending } from 'three';
import { createPool } from './pool.js';
import { getLaserGlow } from './textures.js';
import asteroids from './asteroids.js';
import audio from '../audio.js';

/** Hard budget (requirement #18). */
const MAX_LASERS = 16;

/** ms between shots while holding the button. */
export const FIRE_COOLDOWN = 220;

const SPEED = 950;
const LIFETIME = 0.5;
const NOSE_OFFSET = 28;

let pool = null;
let sceneRef = null;
let lastShot = 0;

/**
 * Builds the pool.
 * @param {import('three').Scene} scene
 */
export const init = (scene) => {
    if (pool) return;
    sceneRef = scene;
    const map = getLaserGlow();

    pool = createPool(
        MAX_LASERS,
        () => {
            const mat = new SpriteMaterial({
                map,
                blending: AdditiveBlending,
                depthWrite: false,
                depthTest: false,
                transparent: true,
                opacity: 0
            });
            const sprite = new Sprite(mat);
            sprite.visible = false;
            sprite.userData = {};
            scene.add(sprite);
            return sprite;
        },
        (sprite) => { sprite.visible = false; sprite.material.opacity = 0; }
    );
};

/**
 * Fires one bolt from the ship's nose along its current heading.
 *
 * @param {object} ctx - Shared ambient context (shipX/shipY/heading).
 * @param {boolean} [force] - Bypass the cooldown (used by the single-click path).
 * @returns {boolean} whether a bolt was actually spawned
 */
export const fire = (ctx, force = false) => {
    if (!pool) return false;

    const now = performance.now();
    if (!force && now - lastShot < FIRE_COOLDOWN) return false;

    const sprite = pool.acquire();
    if (!sprite) return false; // At budget — drop the shot silently.
    lastShot = now;

    const fx = Math.cos(ctx.heading);
    const fy = Math.sin(ctx.heading);

    sprite.position.set(ctx.shipX + fx * NOSE_OFFSET, ctx.shipY + fy * NOSE_OFFSET, 1);

    // Stretch along travel direction: long on X, thin on Y, then rotate.
    sprite.scale.set(26, 3.2, 1);
    sprite.material.rotation = ctx.heading;
    sprite.material.opacity = 0.95;
    sprite.visible = true;

    sprite.userData.vx = fx * SPEED;
    sprite.userData.vy = fy * SPEED;
    sprite.userData.age = 0;

    return true;
};

/**
 * Advances bolts and resolves collisions against asteroids.
 * @param {object} ctx
 */
export const update = (ctx) => {
    if (!pool) return;

    const limitX = window.innerWidth / 2 + 80;
    const limitY = window.innerHeight / 2 + 80;

    pool.forEachActive((sprite) => {
        const d = sprite.userData;
        d.age += ctx.dt;

        if (d.age >= LIFETIME) {
            pool.release(sprite);
            return;
        }

        sprite.position.x += d.vx * ctx.dt;
        sprite.position.y += d.vy * ctx.dt;
        sprite.material.opacity = 0.95 * (1 - d.age / LIFETIME);

        if (Math.abs(sprite.position.x) > limitX || Math.abs(sprite.position.y) > limitY) {
            pool.release(sprite);
            return;
        }

        if (asteroids.hitTest(sprite.position.x, sprite.position.y)) {
            audio.playImpact();
            pool.release(sprite);
        }
    });
};

/**
 * Frees the pool. The glow texture is shared and freed by textures.js.
 */
export const dispose = () => {
    if (pool) {
        pool.items.forEach((s) => {
            sceneRef?.remove(s);
            s.material.dispose();
        });
    }
    pool = null;
    sceneRef = null;
    lastShot = 0;
};

export default { init, fire, update, dispose, FIRE_COOLDOWN };
