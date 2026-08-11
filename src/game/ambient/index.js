/**
 * src/game/ambient/index.js - Ambient environment facade.
 *
 * Owns the shared context object, registers every rare event with the
 * AmbientEventManager, and exposes a tiny surface to cursor.js:
 *
 *     ambient.init(scene)
 *     ambient.update({ shipX, shipY, heading, velocityX, velocityY, dt, mouseX, mouseY })
 *     ambient.fire() / ambient.setFiring(bool)
 *     ambient.handleResize() / ambient.dispose()
 *
 * There is NO second renderer and NO second requestAnimationFrame loop — the
 * whole layer ticks from the existing cursor render loop (requirement #18).
 */

import { getProfile } from './capabilities.js';
import { createEventManager } from './eventManager.js';
import { disposeTextures } from './textures.js';

import starfield from './starfield.js';
import asteroids from './asteroids.js';
import lasers from './lasers.js';
import trail from './trail.js';
import hint from './hint.js';

import comet from './events/comet.js';
import satellite from './events/satellite.js';
import ufo from './events/ufo.js';
import anomaly from './events/anomaly.js';
import hyperspace from './events/hyperspace.js';

/** How quickly the parallax mouse vector catches up. Low = no seasickness. */
const MOUSE_SMOOTHING = 0.06;

let initialized = false;
let profile = null;
let manager = null;

/** Whether the left button is currently held (hold-to-fire). */
let firing = false;

/**
 * Shared per-frame context. Mutated in place so we never allocate in the loop.
 */
const ctx = {
    shipX: 0,
    shipY: 0,
    heading: 0,
    velocityX: 0,
    velocityY: 0,
    speed: 0,
    dt: 0.016,
    mouseNX: 0,
    mouseNY: 0,
    parallaxScale: 1,
    profile: null
};

/** Raw (unsmoothed) normalized mouse target. */
let rawNX = 0;
let rawNY = 0;

/**
 * Registers all rare events. Weights are absolute per-second probabilities;
 * the manager also enforces one-at-a-time plus a global calm floor.
 */
const registerEvents = () => {
    manager.register({
        id: 'comet',
        weight: 0.10,
        cooldown: [45000, 90000],
        canRun: () => profile.rareEvents,
        start: () => comet.start(),
        update: (c) => comet.update(c),
        cleanup: () => comet.cleanup()
    });

    manager.register({
        id: 'satellite',
        weight: 0.08,
        cooldown: [60000, 120000],
        canRun: () => profile.rareEvents,
        start: () => satellite.start(),
        update: (c) => satellite.update(c),
        cleanup: () => satellite.cleanup()
    });

    manager.register({
        id: 'anomaly',
        weight: 0.04,
        cooldown: [90000, 180000],
        canRun: () => profile.anomaly,
        start: () => anomaly.start(),
        update: () => anomaly.update(),
        duration: 500,
        cleanup: () => anomaly.cleanup()
    });

    manager.register({
        id: 'hyperspace',
        weight: 0.03,
        cooldown: [120000, 240000],
        canRun: () => profile.hyperspace,
        start: () => hyperspace.start(),
        update: (c, dtMs) => hyperspace.update(c, dtMs),
        duration: 800,
        cleanup: () => hyperspace.cleanup()
    });

    // The surprise. Lowest weight, longest cooldown, by design.
    manager.register({
        id: 'ufo',
        weight: 0.004,
        cooldown: [300000, 900000],
        canRun: () => profile.ufo,
        start: () => ufo.start(),
        update: (c) => ufo.update(c),
        cleanup: () => ufo.cleanup()
    });
};

/**
 * Builds the ambient layer inside an existing orthographic scene.
 * @param {import('three').Scene} scene - The cursor overlay scene.
 */
export const init = (scene) => {
    if (initialized || !scene) return;

    profile = getProfile();
    ctx.profile = profile;
    ctx.parallaxScale = profile.parallaxScale;

    // Always-on environment.
    starfield.init(scene, profile);

    if (profile.asteroids) asteroids.init(scene, profile);
    if (profile.lasers) lasers.init(scene);
    if (profile.trail) trail.init(scene);

    // Rare events are built up-front and simply hidden between runs.
    if (profile.rareEvents) {
        comet.init(scene);
        satellite.init(scene);
    }
    if (profile.ufo) ufo.init(scene);
    if (profile.anomaly) anomaly.init();

    manager = createEventManager();
    registerEvents();

    initialized = true;
    console.log('[Ambient] Environment initialized.', profile);

    // Minimal debug hook for Playwright verification — no production impact.
    if (typeof window !== 'undefined') {
        window.__AMBIENT_DEBUG__ = {
            getProfile: () => profile,
            // hitTest returns true when a point strikes an asteroid — used by
            // the test to confirm shootability without poking private pools.
            hitTestAsteroid: (x, y) => asteroids.hitTest(x, y)
        };
    }
};

/**
 * Updates the smoothed normalized mouse vector used for parallax.
 * @param {number} clientX
 * @param {number} clientY
 */
export const setMouse = (clientX, clientY) => {
    rawNX = (clientX / window.innerWidth) * 2 - 1;
    rawNY = (clientY / window.innerHeight) * 2 - 1;
};

/**
 * Fires a single bolt plus its small energy pulse.
 * @param {boolean} [force] - Bypass cooldown (single-click path).
 */
export const fire = (force = false) => {
    if (!initialized || !profile.lasers) return;
    if (lasers.fire(ctx, force)) {
        trail.pulse(ctx);
    }
};

/**
 * Sets the hold-to-fire state (requirement #15).
 * @param {boolean} value
 */
export const setFiring = (value) => {
    firing = value;
};

/**
 * Shows the one-time control hint.
 */
export const showHint = () => {
    if (initialized && profile.lasers) hint.show();
};

/**
 * Per-frame tick. Called from the cursor render loop.
 *
 * @param {object} state - Live ship state from cursor.js.
 * @param {number} state.shipX
 * @param {number} state.shipY
 * @param {number} state.heading
 * @param {number} state.velocityX
 * @param {number} state.velocityY
 * @param {number} state.dt - Delta seconds.
 */
export const update = (state) => {
    if (!initialized) return;

    ctx.shipX = state.shipX;
    ctx.shipY = state.shipY;
    ctx.heading = state.heading;
    ctx.velocityX = state.velocityX;
    ctx.velocityY = state.velocityY;
    ctx.speed = Math.sqrt(state.velocityX * state.velocityX + state.velocityY * state.velocityY);
    ctx.dt = state.dt;

    // Ease the parallax vector toward the raw mouse position.
    ctx.mouseNX += (rawNX - ctx.mouseNX) * MOUSE_SMOOTHING;
    ctx.mouseNY += (rawNY - ctx.mouseNY) * MOUSE_SMOOTHING;

    starfield.update(ctx);
    if (profile.asteroids) asteroids.update(ctx);
    if (profile.lasers) {
        if (firing) fire(false); // Cooldown-gated inside lasers.fire().
        lasers.update(ctx);
    }
    if (profile.trail) trail.update(ctx);

    manager.update(ctx, state.dt * 1000);
};

/**
 * Forwards viewport changes to layers that care.
 */
export const handleResize = () => {
    if (!initialized) return;
    starfield.handleResize();
};

/**
 * Tears the whole layer down.
 */
export const dispose = () => {
    if (!initialized) return;
    manager?.stopActive();
    starfield.dispose();
    asteroids.dispose();
    lasers.dispose();
    trail.dispose();
    comet.dispose();
    satellite.dispose();
    ufo.dispose();
    anomaly.dispose();
    hint.dispose();
    disposeTextures();
    manager = null;
    profile = null;
    firing = false;
    initialized = false;
};

export default { init, update, fire, setFiring, setMouse, showHint, handleResize, dispose };