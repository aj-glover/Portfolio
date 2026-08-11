/**
 * src/game/ambient/events/comet.js - Rare ambient comet (requirement #9).
 *
 * A bright head plus a tapering tail of small sprites that lag behind it.
 * Purely decorative: no interaction, no collision, no relationship to content.
 * Everything is allocated once at init and hidden between appearances.
 */

import { Sprite, SpriteMaterial, AdditiveBlending, Group } from 'three';
import { getCometGlow, getSoftGlow } from '../textures.js';

/** Number of tail sprites. Small — the tail is suggestion, not spectacle. */
const TAIL_SEGMENTS = 12;

let group = null;
let head = null;
/** @type {Sprite[]} */
let tail = [];
let sceneRef = null;

// Flight state
let x = 0;
let y = 0;
let vx = 0;
let vy = 0;
let age = 0;
let life = 0;
/** Recorded head positions, newest first, for the tail to follow. */
let history = [];

/**
 * Builds the comet once and parks it hidden.
 * @param {import('three').Scene} scene
 */
export const init = (scene) => {
    if (group) return;
    sceneRef = scene;

    group = new Group();
    group.visible = false;
    group.position.z = -4;

    head = new Sprite(new SpriteMaterial({
        map: getCometGlow(),
        blending: AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        opacity: 0
    }));
    head.scale.set(22, 22, 1);
    group.add(head);

    const tailMap = getSoftGlow();
    tail = [];
    for (let i = 0; i < TAIL_SEGMENTS; i++) {
        const s = new Sprite(new SpriteMaterial({
            map: tailMap,
            blending: AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            transparent: true,
            opacity: 0
        }));
        const k = 1 - i / TAIL_SEGMENTS;
        s.scale.set(14 * k, 14 * k, 1);
        group.add(s);
        tail.push(s);
    }

    scene.add(group);
};

/**
 * Launches a comet from a random edge on a shallow cross-screen trajectory.
 */
export const start = () => {
    if (!group) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const margin = 120;

    // Enter from left or right, biased toward the upper half of the screen.
    const fromLeft = Math.random() < 0.5;
    x = fromLeft ? -w / 2 - margin : w / 2 + margin;
    y = (Math.random() * 0.6 - 0.1) * h * 0.5;

    const speed = 260 + Math.random() * 220;
    // Shallow angle with slight per-run variation (requirement #9).
    const angle = (fromLeft ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed - 40;

    age = 0;
    // Long enough to cross the viewport at this speed.
    life = (w + margin * 2) / Math.abs(vx) + 0.5;

    history = [];
    for (let i = 0; i < TAIL_SEGMENTS + 1; i++) history.push({ x, y });

    group.visible = true;
};

/**
 * @param {object} ctx
 * @returns {boolean} false when the comet has finished.
 */
export const update = (ctx) => {
    if (!group || !group.visible) return false;

    age += ctx.dt;
    if (age >= life) return false;

    x += vx * ctx.dt;
    y += vy * ctx.dt;

    history.unshift({ x, y });
    if (history.length > TAIL_SEGMENTS + 1) history.pop();

    // Fade in over the first 15%, out over the last 25% (requirement #9).
    const t = age / life;
    let fade = 1;
    if (t < 0.15) fade = t / 0.15;
    else if (t > 0.75) fade = 1 - (t - 0.75) / 0.25;

    head.position.set(x, y, 0);
    head.material.opacity = 0.9 * fade;

    tail.forEach((s, i) => {
        const p = history[i + 1] || history[history.length - 1];
        s.position.set(p.x, p.y, 0);
        s.material.opacity = 0.35 * fade * (1 - i / TAIL_SEGMENTS);
    });

    return true;
};

/**
 * Hides the comet between appearances.
 */
export const cleanup = () => {
    if (!group) return;
    group.visible = false;
    head.material.opacity = 0;
    tail.forEach((s) => { s.material.opacity = 0; });
};

/**
 * Frees geometry/materials.
 */
export const dispose = () => {
    if (!group) return;
    head.material.dispose();
    tail.forEach((s) => s.material.dispose());
    sceneRef?.remove(group);
    group = null;
    head = null;
    tail = [];
    sceneRef = null;
};

export default { init, start, update, cleanup, dispose };
