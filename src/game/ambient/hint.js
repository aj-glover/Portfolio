/**
 * src/game/ambient/hint.js - One-time "LMB — FIRE" contextual hint (requirement #16).
 *
 * This is the ONLY piece of chrome the ambient layer adds. There is no score,
 * lives, health, ammo, level, combo, objective, XP or leaderboard anywhere in
 * this system. The hint appears once, fades, and is never shown again.
 */

import gameState from '../../systems/gameState.js';

const SEEN_KEY = 'ambientHintSeen';

/** @type {HTMLElement|null} */
let el = null;
let shown = false;

/**
 * Shows the hint once per visitor, then persists that it was seen.
 */
export const show = () => {
    if (shown) return;
    if (gameState.getSetting(SEEN_KEY)) return;
    shown = true;

    el = document.createElement('div');
    el.className = 'ambient-hint';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = 'LMB — FIRE';
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add('is-visible'));

    setTimeout(() => {
        el?.classList.remove('is-visible');
        setTimeout(() => {
            el?.remove();
            el = null;
        }, 700);
    }, 3000);

    gameState.setSetting(SEEN_KEY, true);
};

/**
 * Removes the hint immediately.
 */
export const dispose = () => {
    el?.remove();
    el = null;
};

export default { show, dispose };
