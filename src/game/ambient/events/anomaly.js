/**
 * src/game/ambient/events/anomaly.js - Brief interface anomaly (requirement #12).
 *
 * A small terminal-style panel flashes SIGNAL LOST / RECONNECTING and then the
 * interface restores itself, all inside 150-400ms.
 *
 * Deliberately avoids screen shake, RGB splitting, static, heavy flicker and
 * text corruption. It is an Easter egg, not a UI effect — and because it is
 * pointer-events:none and aria-hidden it cannot interfere with the portfolio.
 */

/** @type {HTMLElement|null} */
let el = null;

/** @type {number|null} */
let hideTimer = null;

/**
 * Creates the (hidden) anomaly panel once.
 */
export const init = () => {
    if (el) return;
    el = document.createElement('div');
    el.className = 'ambient-anomaly';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
        <span class="ambient-anomaly__title">SYSTEM</span>
        <span class="ambient-anomaly__rule"></span>
        <span class="ambient-anomaly__line">SIGNAL LOST</span>
        <span class="ambient-anomaly__line">RECONNECTING...</span>
    `;
    document.body.appendChild(el);
};

/**
 * Flashes the panel for a randomized 150-400ms.
 */
export const start = () => {
    if (!el) return;
    const duration = 150 + Math.random() * 250;

    el.classList.add('is-visible');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        el.classList.remove('is-visible');
        hideTimer = null;
    }, duration);
};

/**
 * The panel hides itself on a timer; this just reports completion to the
 * manager once the longest possible flash has elapsed.
 * @returns {boolean}
 */
export const update = () => hideTimer !== null;

/**
 * Guarantees the interface is restored.
 */
export const cleanup = () => {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
    el?.classList.remove('is-visible');
};

/**
 * Removes the panel.
 */
export const dispose = () => {
    cleanup();
    el?.remove();
    el = null;
};

export default { init, start, update, cleanup, dispose };
