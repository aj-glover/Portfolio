/**
 * src/game/ambient/events/satellite.js - Occasional satellite flyby (requirement #10).
 *
 * A tiny understated craft built from three boxes (body + two panels). It
 * crosses the viewport, rotates slowly, nudges its trajectory when the ship
 * passes nearby (requirement #13), and removes itself.
 *
 * Not clickable. The optional "SIGNAL DETECTED" transmission shows briefly and
 * fades — it is explicitly not a notification system.
 */

import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';

/** Chance that a given flyby also emits the transmission text. */
const TRANSMISSION_CHANCE = 0.35;

/** Ship distance (px) at which the satellite adjusts course. */
const PROXIMITY_RADIUS = 200;

let group = null;
let sceneRef = null;
let bodyGeom = null;
let panelGeom = null;

let x = 0;
let y = 0;
let vx = 0;
let vy = 0;
let age = 0;
let life = 0;
let spin = 0;
let transmissionShown = false;

/**
 * Briefly shows the SIGNAL DETECTED label, then fades it.
 */
const showTransmission = () => {
    const el = document.createElement('div');
    el.className = 'ambient-transmission';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = 'SIGNAL DETECTED';
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
        el.classList.remove('is-visible');
        setTimeout(() => el.remove(), 600);
    }, 1600);
};

/**
 * Builds the satellite once.
 * @param {import('three').Scene} scene
 */
export const init = (scene) => {
    if (group) return;
    sceneRef = scene;

    group = new Group();
    group.visible = false;
    group.position.z = -3;

    bodyGeom = new BoxGeometry(10, 6, 6);
    panelGeom = new BoxGeometry(14, 5, 0.6);

    const bodyMat = new MeshStandardMaterial({
        color: 0xb8c2cc, roughness: 0.5, metalness: 0.6, flatShading: true
    });
    const panelMat = new MeshStandardMaterial({
        color: 0x2a4a7a, roughness: 0.4, metalness: 0.7, flatShading: true
    });

    group.add(new Mesh(bodyGeom, bodyMat));

    const left = new Mesh(panelGeom, panelMat);
    left.position.x = -13;
    group.add(left);

    const right = new Mesh(panelGeom, panelMat);
    right.position.x = 13;
    group.add(right);

    scene.add(group);
};

/**
 * Sends a satellite across the screen from a random side.
 */
export const start = () => {
    if (!group) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const margin = 100;

    const fromLeft = Math.random() < 0.5;
    x = fromLeft ? -w / 2 - margin : w / 2 + margin;
    y = (Math.random() - 0.5) * h * 0.6;

    const speed = 70 + Math.random() * 60;
    vx = fromLeft ? speed : -speed;
    vy = (Math.random() - 0.5) * 20;

    spin = (Math.random() - 0.5) * 0.35;
    age = 0;
    life = (w + margin * 2) / speed + 1;
    transmissionShown = false;

    group.position.set(x, y, -3);
    group.rotation.set(0.4, 0.2, Math.random() * Math.PI);
    group.visible = true;

    if (Math.random() < TRANSMISSION_CHANCE) {
        setTimeout(showTransmission, 800 + Math.random() * 1200);
        transmissionShown = true;
    }
};

/**
 * @param {object} ctx
 * @returns {boolean} false when the flyby is over.
 */
export const update = (ctx) => {
    if (!group || !group.visible) return false;

    age += ctx.dt;
    if (age >= life) return false;

    // Requirement #13: a slight course correction when the ship is close.
    const dx = x - ctx.shipX;
    const dy = y - ctx.shipY;
    const distSq = dx * dx + dy * dy;
    if (distSq < PROXIMITY_RADIUS * PROXIMITY_RADIUS && distSq > 1) {
        const dist = Math.sqrt(distSq);
        const push = (1 - dist / PROXIMITY_RADIUS) * 14;
        vy += (dy / dist) * push * ctx.dt;
        vx += (dx / dist) * push * 0.3 * ctx.dt;
    }

    x += vx * ctx.dt;
    y += vy * ctx.dt;

    group.position.set(x, y, -3);
    group.rotation.z += spin * ctx.dt;
    group.rotation.y += spin * 0.4 * ctx.dt;

    return true;
};

/**
 * Hides the satellite between flybys.
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
        if (child.isMesh) child.material.dispose();
    });
    bodyGeom?.dispose();
    panelGeom?.dispose();
    sceneRef?.remove(group);
    group = null;
    bodyGeom = null;
    panelGeom = null;
    sceneRef = null;
};

export default { init, start, update, cleanup, dispose };
