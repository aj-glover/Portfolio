/**
 * src/game/initSequence.js - Lightweight initialization sequence.
 * 3-5 second boot sequence shown on first visit.
 * Uses sessionStorage to skip/shorten on return visits.
 *
 * Sequence:
 *   INITIALIZING... → AJ GLOVER → disciplines → SYSTEM ONLINE → interactive
 */

import { gsap } from 'gsap';

const STORAGE_KEY = 'aj-portfolio-init-shown';

/** @type {HTMLElement|null} */
let overlayEl = null;

/** Callback after sequence completes */
let onCompleteCallback = null;

/**
 * Builds the init sequence DOM.
 */
const build = () => {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.id = 'game-init-sequence';
    overlayEl.className = 'game-init-sequence';
    overlayEl.setAttribute('aria-label', 'System initialization');

    // Step 1: INITIALIZING
    const step1 = document.createElement('div');
    step1.className = 'game-init-step';
    step1.innerHTML = `
        <span class="game-init-step-label">INITIALIZING...</span>
    `;

    // Step 2: AJ GLOVER
    const step2 = document.createElement('div');
    step2.className = 'game-init-step';
    step2.innerHTML = `
        <span class="game-init-step-name">AJ GLOVER</span>
    `;

    // Step 3: Disciplines
    const step3 = document.createElement('div');
    step3.className = 'game-init-step';
    step3.innerHTML = `
        <span class="game-init-step-label">SYSTEMS</span>
        <div class="game-init-step-disciplines">
            <span class="game-init-step-discipline">DIGITAL MARKETING</span>
            <span class="game-init-step-discipline">UX</span>
            <span class="game-init-step-discipline">GROWTH</span>
            <span class="game-init-step-discipline">CREATIVE TECHNOLOGY</span>
        </div>
    `;

    // Step 4: SYSTEM ONLINE
    const step4 = document.createElement('div');
    step4.className = 'game-init-step';
    step4.innerHTML = `
        <span class="game-init-step-status">● SYSTEM ONLINE</span>
    `;

    overlayEl.appendChild(step1);
    overlayEl.appendChild(step2);
    overlayEl.appendChild(step3);
    overlayEl.appendChild(step4);

    document.body.appendChild(overlayEl);

    return { step1, step2, step3, step4 };
};

/**
 * Shows the init sequence.
 * On first visit: full 3-5s sequence.
 * On return: abbreviated (just SYSTEM ONLINE flash, ~1s).
 * Respects prefers-reduced-motion by skipping to the final state.
 * @param {Function} onComplete - Called when sequence finishes.
 */
const show = (onComplete) => {
    onCompleteCallback = onComplete;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Skip sequence entirely for reduced motion
        complete();
        return;
    }

    const hasVisited = sessionStorage.getItem(STORAGE_KEY);

    if (hasVisited) {
        // Returning visitor — abbreviated sequence
        showAbbreviated();
        return;
    }

    // First visit — full sequence
    showFull();
};

/**
 * Full init sequence for first-time visitors.
 */
const showFull = () => {
    const { step1, step2, step3, step4 } = build();

    const steps = [step1, step2, step3, step4];
    const delays = [0, 800, 1800, 3200]; // ms to show each step
    const totalDuration = 4200; // ~4.2 seconds total

    steps.forEach((step, i) => {
        setTimeout(() => {
            // Hide all steps
            steps.forEach(s => s.classList.remove('is-visible'));
            // Show current step
            step.classList.add('is-visible');
        }, delays[i]);
    });

    // Complete after total duration
    setTimeout(() => {
        complete();
    }, totalDuration);
};

/**
 * Abbreviated sequence for returning visitors.
 */
const showAbbreviated = () => {
    const { step4 } = build();

    // Just flash SYSTEM ONLINE briefly
    setTimeout(() => {
        step4.classList.add('is-visible');
    }, 100);

    setTimeout(() => {
        complete();
    }, 1000);
};

/**
 * Completes the sequence — fades out overlay and calls callback.
 */
const complete = () => {
    // Mark as visited
    sessionStorage.setItem(STORAGE_KEY, '1');

    if (overlayEl) {
        gsap.to(overlayEl, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                if (overlayEl && overlayEl.parentNode) {
                    overlayEl.parentNode.removeChild(overlayEl);
                }
                overlayEl = null;
                if (onCompleteCallback) {
                    onCompleteCallback();
                    onCompleteCallback = null;
                }
            }
        });
    } else {
        if (onCompleteCallback) {
            onCompleteCallback();
            onCompleteCallback = null;
        }
    }
};

/**
 * Cleans up.
 */
const dispose = () => {
    if (overlayEl && overlayEl.parentNode) {
        overlayEl.parentNode.removeChild(overlayEl);
    }
    overlayEl = null;
    onCompleteCallback = null;
};

export default {
    show,
    dispose
};