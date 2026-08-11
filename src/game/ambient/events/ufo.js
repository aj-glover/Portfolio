/**
 * src/game/ambient/events/ufo.js - Extremely rare UFO flyby (requirement #11).
 *
 * No combat, no interaction, no score, no explanation. It appears, crosses the
 * screen with one lazy direction change, and leaves. The rarity is the point —
 * the event manager gives this the lowest weight and longest cooldown of all.
 */

import { Group, Mesh, SphereGeometry, MeshStandardMaterial, Sprite, SpriteMaterial, AdditiveBlending } from 'three';
import { getCometGlow } from '../textures.js';

let group = null;
let glow = null;
let sceneRef = null;
let discGeom = null;
let domeGeom = null;

let x = 0;
let y = 0;
let vx = 0;
let vy = 0;
let age = 0;
let life = 0;
/** Time at which the craft alters course. */
let turnAt = 0;
let turned = false;

/**
 * Builds the saucer once: a squashed sphere hull, a dome, and an underglow.
 * @param {import('three').Scene} scene
 */
export const init = (scene) => {
    if (group) return;
    sceneRef = scene;

    group = new Group();
    group.visible = false;
    group.position.z = -3.5;

    discGeom = new SphereGeometry(14, 16, 10);
    domeGeom = new SphereGeometry(6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);

    const hull = new Mesh(discGeom, new MeshStandardMaterial({
        color: 0x8f9aa6, roughness: 0.35, metalness: 0.85, flatShading: true
    }));
    hull.scale.set(1, 0.28, 1);
    group.add(hull);

    const dome = new Mesh(domeGeom, new MeshStandardMaterial({
        color: 0x7fe3ff,
        roughness: 0.1,
        metalness: 0.3,
        emissive: 0x2299cc,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85
    }));
    dome.position.y = 2.2;
    group.add(dome);

    glow = new Sprite(new SpriteMaterial({
        map: getCometGlow(),
        blending: AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        opacity: 0.35,
        color: 0x66ffcc
    }));
    glow.scale.set(40, 40, 1);
    glow.position.y = -4;
    group.add(glow);

    scene.add(group);
};

/**
 * Sends the saucer across the viewport.
 */
export const start = () => {
    if (!group) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const margin = 140;

    const fromLeft = Math.random() < 0.5;
    x = fromLeft ? -w / 2 - margin : w / 2 + margin;
    y = (Math.random() - 0.5) * h * 0.5;

    const speed = 150 + Math.random() * 120;
    vx = fromLeft ? speed : -speed;
    vy = (Math.random() - 0.5) * 30;

    age = 0;
    life = (w + margin * 2) / speed + 1.2;
    turnAt = life * (0.35 + Math.random() * 0.3);
    turned = false;

    group.position.set(x, y, -3.5);
    group.rotation.set(0.25, 0, 0);
    group.visible = true;
};

/**
 * @param {object} ctx
 * @returns {boolean} false when the flyby ends.
 */
export const update = (ctx) => {
    if (!group || !group.visible) return false;

    age += ctx.dt;
    if (age >= life) return false;

    // One slight, unexplained direction change (requirement #11).
    if (!turned && age >= turnAt) {
        turned = true;
        vy += (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 60);
        vx *= 1.15;
    }

    x += vx * ctx.dt;
    y += vy * ctx.dt;

    group.position.set(x, y, -3.5);
    group.rotation.y += 1.6 * ctx.dt;
    // Bank slightly in the direction of vertical travel.
    group.rotation.z += ((-vy * 0.002) - group.rotation.z) * 0.05;

    const t = age / life;
    const fade = t < 0.1 ? t / 0.1 : (t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1);
    glow.material.opacity = 0.35 * fade;

    return true;
};

/**
 * Hides the saucer.
 */
export const cleanup = () => {
    if (group) group.visible = false;
};

/**
 * Frees geometry/materials.
 */
export const dispose = () => {
    if (!group) return;
    group.traverse((child) => {
        if (child.isMesh || child.isSprite) child.material.dispose();
    });
    discGeom?.dispose();
    domeGeom?.dispose();
    sceneRef?.remove(group);
    group = null;
    glow = null;
    discGeom = null;
    domeGeom = null;
    sceneRef = null;
};

export default { init, start, update, cleanup, dispose };
