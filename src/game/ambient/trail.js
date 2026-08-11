/**
 * src/game/ambient/trail.js - Pooled ship exhaust particles (requirement #7).
 *
 * Emission scales with ship speed and stops almost immediately when the mouse
 * does. Particles fade in ~0.35s so the trail never accumulates.
 *
 * Also provides the small energy pulse on fire (requirement #14) — it reuses
 * the same pool, so firing costs no extra allocation.
 */

import { Sprite, SpriteMaterial, AdditiveBlending } from 'three';
import { createPool } from './pool.js';
import { getSoftGlow } from './textures.js';

/** Hard budget (requirement #18). */
const MAX_PARTICLES = 30;

/** Below this speed (px/s) the ship is considered idle and emits nothing. */
const MIN_EMIT_SPEED = 120;

/** Speed at which emission saturates. */
const MAX_EMIT_SPEED = 800;

const LIFETIME = 0.35;

let pool = null;
let sceneRef = null;

/** Fractional particle budget carried between frames. */
let emitAccumulator = 0;

/**
 * Builds the particle pool.
 * @param {import('three').Scene} scene
 */
export const init = (scene) => {
    if (pool) return;
    sceneRef = scene;
    const map = getSoftGlow();

    pool = createPool(
        MAX_PARTICLES,
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
 * Spawns one particle at a position with a velocity.
 */
const emit = (x, y, vx, vy, size, life) => {
    const sprite = pool.acquire();
    if (!sprite) return;

    sprite.position.set(x, y, -0.5);
    sprite.scale.set(size, size, 1);
    sprite.material.opacity = 0.55;
    sprite.visible = true;

    sprite.userData.vx = vx;
    sprite.userData.vy = vy;
    sprite.userData.age = 0;
    sprite.userData.life = life;
    sprite.userData.size = size;
};

/**
 * A brief ring of particles around the ship when it fires.
 * Kept small and local — explicitly not a screen-wide effect.
 * @param {object} ctx
 */
export const pulse = (ctx) => {
    if (!pool) return;
    const count = 5;
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        emit(
            ctx.shipX + Math.cos(a) * 14,
            ctx.shipY + Math.sin(a) * 14,
            Math.cos(a) * 90,
            Math.sin(a) * 90,
            7,
            0.25
        );
    }
};

/**
 * Emits behind the ship proportionally to speed, then ages all particles.
 * @param {object} ctx
 */
export const update = (ctx) => {
    if (!pool) return;

    // --- Emission ---
    const speed = ctx.speed;
    if (speed > MIN_EMIT_SPEED) {
        const t = Math.min(1, (speed - MIN_EMIT_SPEED) / (MAX_EMIT_SPEED - MIN_EMIT_SPEED));
        // 8..34 particles/sec depending on velocity.
        emitAccumulator += (8 + t * 26) * ctx.dt;

        while (emitAccumulator >= 1) {
            emitAccumulator -= 1;
            // Behind the ship, opposite its heading, with a little scatter.
            const bx = ctx.shipX - Math.cos(ctx.heading) * 18;
            const by = ctx.shipY - Math.sin(ctx.heading) * 18;
            emit(
                bx + (Math.random() - 0.5) * 6,
                by + (Math.random() - 0.5) * 6,
                -ctx.velocityX * 0.15 + (Math.random() - 0.5) * 30,
                -ctx.velocityY * 0.15 + (Math.random() - 0.5) * 30,
                4 + Math.random() * 4 + t * 3,
                LIFETIME
            );
        }
    } else {
        // Mouse stopped — drop any partial budget so emission ends at once.
        emitAccumulator = 0;
    }

    // --- Ageing ---
    pool.forEachActive((sprite) => {
        const d = sprite.userData;
        d.age += ctx.dt;
        if (d.age >= d.life) {
            pool.release(sprite);
            return;
        }
        const k = 1 - d.age / d.life;
        sprite.position.x += d.vx * ctx.dt;
        sprite.position.y += d.vy * ctx.dt;
        sprite.material.opacity = 0.55 * k;
        const s = d.size * (0.4 + k * 0.6);
        sprite.scale.set(s, s, 1);
    });
};

/**
 * Frees the pool.
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
    emitAccumulator = 0;
};

export default { init, update, pulse, dispose };
