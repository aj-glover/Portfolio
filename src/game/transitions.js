/**
 * src/game/transitions.js - Spatial transition effects.
 * Adds brief visual effects during camera transitions (zoom blur, etc.).
 * Consumes transition events from navigation.js.
 * Respects prefers-reduced-motion.
 */

import gameState from '../systems/gameState.js';

/** @type {HTMLElement|null} */
let overlayEl = null;

/** Whether a transition is currently active */
let active = false;

/**
 * Builds the transition overlay DOM.
 */
const build = () => {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.id = 'game-transition-overlay';
    overlayEl.className = 'game-transition-overlay';
    overlayEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlayEl);
};

/**
 * Plays a brief zoom-blur transition effect.
 * Used when entering a sector or opening a case study.
 * @param {'in'|'out'} direction - 'in' for entering, 'out' for returning
 * @returns {Promise<void>} Resolves when the effect completes.
 */
const playTransition = (direction = 'in') => {
    return new Promise((resolve) => {
        if (!overlayEl) build();

        const reducedMotion = gameState.getSetting('reducedMotion');
        if (reducedMotion) {
            // Skip the effect entirely
            resolve();
            return;
        }

        if (active) {
            resolve();
            return;
        }

        active = true;
        const duration = 400;

        // Brief flash + blur
        overlayEl.classList.add('is-active');
        overlayEl.setAttribute('data-direction', direction);

        // Apply a brief blur to the canvas
        const canvas = document.querySelector('canvas');
        if (canvas) {
            // Add will-change hint for GPU acceleration
            canvas.style.willChange = 'filter';
            canvas.style.transition = `filter ${duration}ms ease-out`;
            canvas.style.filter = 'blur(4px) brightness(1.3)';
        }

        setTimeout(() => {
            if (canvas) {
                canvas.style.filter = 'blur(0px) brightness(1)';
            }
            overlayEl.classList.remove('is-active');

            setTimeout(() => {
                if (canvas) {
                    canvas.style.transition = '';
                    canvas.style.filter = '';
                    canvas.style.willChange = ''; // Remove will-change after animation
                }
                active = false;
                resolve();
            }, duration);
        }, 150);
    });
};

/**
 * Plays the sector entry transition.
 * @param {string} sectorName
 * @returns {Promise<void>}
 */
const enterSector = async (sectorName) => {
    await playTransition('in');
};

/**
 * Plays the return-to-universe transition.
 * @returns {Promise<void>}
 */
const returnToUniverse = async () => {
    await playTransition('out');
};

/**
 * Plays the project open transition.
 * @returns {Promise<void>}
 */
const openProject = async () => {
    await playTransition('in');
};

/**
 * Plays the project close transition.
 * @returns {Promise<void>}
 */
const closeProject = async () => {
    await playTransition('out');
};

/**
 * Cleans up.
 */
const dispose = () => {
    if (overlayEl && overlayEl.parentNode) {
        overlayEl.parentNode.removeChild(overlayEl);
    }
    overlayEl = null;
    active = false;
};

export default {
    enterSector,
    returnToUniverse,
    openProject,
    closeProject,
    dispose
};