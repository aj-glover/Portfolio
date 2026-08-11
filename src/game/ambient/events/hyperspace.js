/**
 * src/game/ambient/events/hyperspace.js - Short hyperspace flash (requirement #8).
 *
 * Sequence: accelerate -> stars stretch -> brief peak -> return to normal space.
 * Total duration sits in the 300-700ms band and the whole thing is driven by a
 * single eased 0..1 value handed to the starfield.
 *
 * This is purely a visual transition. It is NOT wired to navigation — nothing
 * about moving through the portfolio triggers a jump.
 */

import starfield from '../starfield.js';

/** Randomized per-run duration, in ms. */
let duration = 500;
let elapsed = 0;

/**
 * Smootherstep-style ease so the ramp in and out have no hard corners.
 */
const ease = (t) => t * t * (3 - 2 * t);

/**
 * Begins a jump.
 */
export const start = () => {
    duration = 300 + Math.random() * 400;
    elapsed = 0;
};

/**
 * Drives the stretch curve: ramp up over the first 40%, hold briefly, ease out.
 * @param {object} ctx
 * @param {number} dtMs
 * @returns {boolean} false when finished.
 */
export const update = (ctx, dtMs) => {
    elapsed += dtMs;
    const t = Math.min(1, elapsed / duration);

    let amount;
    if (t < 0.4) {
        amount = ease(t / 0.4);
    } else if (t < 0.6) {
        amount = 1;
    } else {
        amount = 1 - ease((t - 0.6) / 0.4);
    }

    starfield.setStretch(amount);

    if (t >= 1) return false;
    return true;
};

/**
 * Always return the starfield to normal, even on an interrupted run.
 */
export const cleanup = () => {
    starfield.setStretch(0);
    elapsed = 0;
};

export default { start, update, cleanup };
