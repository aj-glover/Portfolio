/**
 * src/game/targeting.js - Targeting system for interactive objects.
 * Consumes raycaster hits from navigation.js. Three states: IDLE, TARGETED, SELECTED.
 * Does NOT create a second collision system — uses existing Three.js raycaster.
 */

import gameState from '../systems/gameState.js';
import cursor from './cursor.js';

/** @type {HTMLElement|null} */
let bracketsEl = null;

/** @type {HTMLElement|null} */
let labelEl = null;

/** Current targeted object info */
let currentTarget = null;

/** Whether targeting overlay is visible */
let visible = false;

/**
 * Builds the targeting overlay DOM.
 */
const build = () => {
    if (bracketsEl) return;

    // Brackets container (positioned absolutely, follows target)
    bracketsEl = document.createElement('div');
    bracketsEl.id = 'game-target-brackets';
    bracketsEl.className = 'game-target-brackets';
    bracketsEl.setAttribute('aria-hidden', 'true');

    // Four corner brackets
    ['tl', 'tr', 'bl', 'br'].forEach(corner => {
        const bracket = document.createElement('div');
        bracket.className = `game-target-bracket game-target-bracket--${corner}`;
        bracketsEl.appendChild(bracket);
    });

    // Target label
    labelEl = document.createElement('div');
    labelEl.className = 'game-target-label';
    bracketsEl.appendChild(labelEl);

    document.body.appendChild(bracketsEl);
};

/**
 * Shows targeting brackets and label for an object.
 * Called by navigation.js when raycaster hits an interactive object.
 *
 * @param {object} targetInfo
 * @param {string} targetInfo.type - 'planet' | 'project'
 * @param {string} targetInfo.label - Display label (e.g. "GROWTH")
 * @param {string} [targetInfo.subLabel] - Secondary label (e.g. "04 PROJECTS")
 * @param {{ x: number, y: number }} [targetInfo.screenPos] - Screen-space position
 */
const show = (targetInfo) => {
    if (!bracketsEl) build();

    currentTarget = targetInfo;
    visible = true;

    // Update label
    if (labelEl) {
        let html = `<span class="game-target-label-primary">TARGET ACQUIRED</span>`;
        html += `<span class="game-target-label-name">${targetInfo.label}</span>`;
        if (targetInfo.subLabel) {
            html += `<span class="game-target-label-sub">${targetInfo.subLabel}</span>`;
        }
        labelEl.innerHTML = html;
    }

    bracketsEl.classList.add('is-visible');
    bracketsEl.setAttribute('data-type', targetInfo.type);

    // Set cursor to target state
    cursor.setState('target', targetInfo.label);
};

/**
 * Moves the targeting overlay to a screen position.
 * Called on mousemove when a target is active.
 * @param {number} x - Screen X (clientX)
 * @param {number} y - Screen Y (clientY)
 */
const move = (x, y) => {
    if (!bracketsEl || !visible) return;
    bracketsEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
};

/**
 * Hides the targeting overlay.
 */
const hide = () => {
    if (!bracketsEl) return;
    visible = false;
    currentTarget = null;
    bracketsEl.classList.remove('is-visible');
    cursor.setState('scanning');
};

/**
 * Plays the selection animation on the current target.
 * Called when user clicks a targeted object.
 * @returns {Promise<void>}
 */
const select = async () => {
    if (!bracketsEl || !visible) return;

    bracketsEl.classList.add('is-selected');

    // Play cursor lock sequence
    await cursor.playClickSequence();

    bracketsEl.classList.remove('is-selected', 'is-visible');
    visible = false;
    currentTarget = null;
};

/**
 * @returns {object|null} Current target info
 */
const getCurrentTarget = () => currentTarget;

/**
 * @returns {boolean}
 */
const isVisible = () => visible;

/**
 * Cleans up.
 */
const dispose = () => {
    if (bracketsEl && bracketsEl.parentNode) {
        bracketsEl.parentNode.removeChild(bracketsEl);
    }
    bracketsEl = null;
    labelEl = null;
    currentTarget = null;
    visible = false;
};

export default {
    show,
    move,
    hide,
    select,
    getCurrentTarget,
    isVisible,
    dispose
};