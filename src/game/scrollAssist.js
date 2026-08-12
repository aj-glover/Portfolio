/**
 * src/game/scrollAssist.js - Scroll assistance for full-screen content overlays.
 *
 * The portfolio hides the native pointer (`cursor: none`) and replaces it with a
 * physics-driven 3D spacecraft, and `body { overflow: hidden }` means the window
 * itself never scrolls. That combination made the scrollable detail overlays
 * effectively unusable: the razor-thin native scrollbar was impossible to grab
 * with a spring-following ship, and a window-bound smooth-scroll library was
 * swallowing every wheel event.
 *
 * This module attaches to a single scroll container and provides:
 *   1. Smooth wheel scrolling scoped to that container (never the window).
 *   2. Hover-only edge auto-scroll — park the ship near the bottom (or top) of
 *      the viewport and the page scrolls, ramping faster toward the very edge.
 *   3. A "rail dock" zone over the native scrollbar. When the pointer enters it
 *      the spacecraft magnetically snaps onto the rail so it tracks the hand
 *      precisely instead of drifting, and stops firing lasers.
 *   4. Keyboard scrolling (arrows / page / home / end / space) and Escape.
 *
 * Everything is torn down on detach so overlays can be opened and closed freely.
 */

import cursor from './cursor.js';
import gameState from '../systems/gameState.js';

// ============================================================================
// TUNING
// ============================================================================

const CONFIG = {
    /** Fraction of viewport height at top/bottom that triggers auto-scroll. */
    edgeZone: 0.15,
    /** Maximum auto-scroll speed in px per frame at the very edge. */
    edgeMaxSpeed: 18,
    /** Minimum auto-scroll speed at the inner boundary of the zone. */
    edgeMinSpeed: 1.2,
    /** Width of the native scrollbar rail, in px. Must match the CSS. */
    railWidth: 18,
    /** Extra horizontal slop around the rail that still counts as "docked". */
    railSlop: 28,
    /** Wheel smoothing factor (0-1). Higher = snappier. */
    wheelEase: 0.16,
    /** Pixels scrolled per wheel notch when the browser reports lines/pages. */
    lineHeight: 40,
    pageHeightFactor: 0.9,
    /** Keyboard step sizes. */
    keyStep: 80,
};

// ============================================================================
// STATE
// ============================================================================

/** @type {HTMLElement|null} The element currently being assisted. */
let el = null;

/** Desired scrollTop that the smoothing loop eases toward. */
let targetScroll = 0;

/** requestAnimationFrame handle for the scroll loop. */
let rafId = null;

/** Latest pointer position in client coords. */
let pointerX = -1;
let pointerY = -1;

/** Whether the pointer is currently inside the overlay at all. */
let pointerInside = false;

/** Whether the spacecraft is currently docked to the scrollbar rail. */
let docked = false;

/** Whether the user is dragging the native scrollbar (we yield control). */
let draggingRail = false;

/** Edge affordance elements. */
let edgeTop = null;
let edgeBottom = null;
let hintEl = null;

/** Optional callback fired with scroll progress (0-1) on every change. */
let onProgress = null;

/** Optional callback fired when Escape is pressed. */
let onEscape = null;

/** Bound handlers kept so they can be removed on detach. */
const handlers = {};

/** Session flag so the discovery hint is only shown once per page load. */
let hintShown = false;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Returns the maximum scrollable offset for the attached element.
 * @returns {number}
 */
const maxScroll = () => {
    if (!el) return 0;
    return Math.max(0, el.scrollHeight - el.clientHeight);
};

/**
 * Clamps a scroll offset into the valid range.
 * @param {number} value - The desired offset.
 * @returns {number} The clamped offset.
 */
const clampScroll = (value) => Math.min(maxScroll(), Math.max(0, value));

/**
 * Whether the attached element actually has overflow to scroll.
 * @returns {boolean}
 */
const isScrollable = () => maxScroll() > 4;

/**
 * Reports current scroll progress to the registered callback.
 */
const reportProgress = () => {
    if (!onProgress || !el) return;
    const max = maxScroll();
    onProgress(max > 0 ? el.scrollTop / max : 0);
};

/**
 * Determines whether a client X coordinate falls inside the scrollbar rail zone.
 * The rail sits on the inner right edge of the overlay.
 * @param {number} x - clientX.
 * @returns {boolean}
 */
const isInRailZone = (x) => {
    if (!el || !isScrollable()) return false;
    const rect = el.getBoundingClientRect();
    const railLeft = rect.right - CONFIG.railWidth - CONFIG.railSlop;
    return x >= railLeft && x <= rect.right;
};

/**
 * Returns the rail geometry used to dock the spacecraft.
 * @returns {{x: number, width: number}}
 */
const getRailGeometry = () => {
    const rect = el.getBoundingClientRect();
    return {
        x: rect.right - CONFIG.railWidth,
        width: CONFIG.railWidth,
    };
};

// ============================================================================
// EDGE AUTO-SCROLL
// ============================================================================

/**
 * Computes the auto-scroll velocity (px/frame) implied by the pointer position.
 * Positive scrolls down, negative scrolls up, zero means outside both zones.
 *
 * Speed ramps quadratically from `edgeMinSpeed` at the inner boundary of the
 * zone to `edgeMaxSpeed` at the very screen edge, so resting just inside the
 * zone nudges gently while pushing to the edge scrolls quickly.
 *
 * @returns {number} Velocity in pixels per frame.
 */
const getEdgeVelocity = () => {
    // Docking the ship to the rail means the user wants precise manual control;
    // auto-scroll would fight them, so it is suppressed.
    if (!pointerInside || docked || draggingRail || !isScrollable()) return 0;
    if (pointerY < 0) return 0;

    const h = window.innerHeight;
    const zone = h * CONFIG.edgeZone;

    /**
     * Maps a 0-1 depth into the zone onto a speed.
     * @param {number} depth - 0 at the zone boundary, 1 at the screen edge.
     * @returns {number}
     */
    const ramp = (depth) => {
        const eased = depth * depth;
        return CONFIG.edgeMinSpeed + (CONFIG.edgeMaxSpeed - CONFIG.edgeMinSpeed) * eased;
    };

    if (pointerY >= h - zone) {
        const depth = Math.min(1, (pointerY - (h - zone)) / zone);
        return ramp(depth);
    }

    if (pointerY <= zone) {
        const depth = Math.min(1, (zone - pointerY) / zone);
        return -ramp(depth);
    }

    return 0;
};

/**
 * Updates the glowing edge strips so the user can see the active scroll zone.
 * @param {number} velocity - Current edge velocity.
 */
const updateEdgeAffordance = (velocity) => {
    if (!edgeTop || !edgeBottom) return;

    const atTop = el.scrollTop <= 1;
    const atBottom = el.scrollTop >= maxScroll() - 1;

    edgeBottom.classList.toggle('is-active', velocity > 0 && !atBottom);
    edgeTop.classList.toggle('is-active', velocity < 0 && !atTop);
};

// ============================================================================
// MAIN LOOP
// ============================================================================

/**
 * Single animation loop that applies edge auto-scroll and eases the element
 * toward `targetScroll`. One loop keeps wheel, edge-scroll and keyboard input
 * from fighting each other.
 */
const loop = () => {
    rafId = requestAnimationFrame(loop);
    if (!el) return;

    // While the user drags the native scrollbar, the browser owns scrollTop.
    if (draggingRail) {
        targetScroll = el.scrollTop;
        updateEdgeAffordance(0);
        return;
    }

    const velocity = getEdgeVelocity();
    updateEdgeAffordance(velocity);

    if (velocity !== 0) {
        targetScroll = clampScroll(targetScroll + velocity);
    }

    const diff = targetScroll - el.scrollTop;

    if (Math.abs(diff) < 0.5) {
        // Settled. Re-sync so any outside scroll (anchor jump, focus, drag)
        // becomes the new baseline instead of being yanked back.
        targetScroll = el.scrollTop;
        return;
    }

    const reducedMotion = gameState.getSetting('reducedMotion');
    el.scrollTop += reducedMotion ? diff : diff * CONFIG.wheelEase;
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Wheel handler scoped to the overlay. This is what makes an ordinary mouse
 * wheel scroll the detail page again.
 * @param {WheelEvent} e
 */
const onWheel = (e) => {
    if (!el || !isScrollable()) return;

    // Let nested scrollables (if any are ever added) handle their own wheel.
    let node = e.target;
    while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight + 4) {
            const style = window.getComputedStyle(node);
            if (/(auto|scroll)/.test(style.overflowY)) return;
        }
        node = node.parentElement;
    }

    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= CONFIG.lineHeight;           // lines
    else if (e.deltaMode === 2) delta *= el.clientHeight * CONFIG.pageHeightFactor; // pages

    const next = clampScroll(targetScroll + delta);

    // Only swallow the event when we can actually consume the scroll, so
    // over-scrolling never feels locked up.
    if (next !== targetScroll) {
        e.preventDefault();
        targetScroll = next;
    }
};

/**
 * Tracks the pointer for edge auto-scroll and rail docking.
 * @param {MouseEvent} e
 */
const onMouseMove = (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    pointerInside = true;

    const shouldDock = isInRailZone(pointerX);

    if (shouldDock && !docked) {
        docked = true;
        el.classList.add('is-rail-docked');
        cursor.dockToRail(getRailGeometry());
    } else if (!shouldDock && docked) {
        docked = false;
        el.classList.remove('is-rail-docked');
        cursor.undock();
    } else if (shouldDock && docked) {
        // Keep the rail position fresh across resizes / layout shifts.
        cursor.dockToRail(getRailGeometry());
    }

    showHintOnce();
};

/**
 * Releases docking and auto-scroll when the pointer leaves the window.
 */
const onMouseLeave = () => {
    pointerInside = false;
    if (docked) {
        docked = false;
        if (el) el.classList.remove('is-rail-docked');
        cursor.undock();
    }
};

/**
 * Marks the start of a native scrollbar drag so the smoothing loop yields.
 * @param {MouseEvent} e
 */
const onPointerDown = (e) => {
    if (isInRailZone(e.clientX)) {
        draggingRail = true;
    }
};

/**
 * Ends a native scrollbar drag.
 */
const onPointerUp = () => {
    if (draggingRail) {
        draggingRail = false;
        targetScroll = el ? el.scrollTop : 0;
    }
};

/**
 * Keyboard scrolling so the overlay is fully operable without a pointer.
 * @param {KeyboardEvent} e
 */
const onKeyDown = (e) => {
    if (!el || el.style.display === 'none') return;

    // Never hijack typing in the contact form.
    const tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;

    const page = el.clientHeight * CONFIG.pageHeightFactor;
    let handled = true;

    switch (e.key) {
        case 'ArrowDown': targetScroll = clampScroll(targetScroll + CONFIG.keyStep); break;
        case 'ArrowUp': targetScroll = clampScroll(targetScroll - CONFIG.keyStep); break;
        case 'PageDown': targetScroll = clampScroll(targetScroll + page); break;
        case 'PageUp': targetScroll = clampScroll(targetScroll - page); break;
        case ' ': targetScroll = clampScroll(targetScroll + (e.shiftKey ? -page : page)); break;
        case 'Home': targetScroll = 0; break;
        case 'End': targetScroll = maxScroll(); break;
        case 'Escape':
            if (onEscape) onEscape();
            break;
        default: handled = false;
    }

    if (handled) e.preventDefault();
};

/**
 * Keeps progress reporting in sync with any scroll source.
 */
const onScroll = () => {
    reportProgress();
};

/**
 * Recomputes cached geometry after a resize.
 */
const onResize = () => {
    if (!el) return;
    targetScroll = clampScroll(targetScroll);
    if (docked) cursor.dockToRail(getRailGeometry());
    reportProgress();
};

// ============================================================================
// AFFORDANCE UI
// ============================================================================

/**
 * Creates the glowing top/bottom edge strips and the one-time discovery hint.
 */
const buildAffordance = () => {
    edgeTop = document.createElement('div');
    edgeTop.className = 'scroll-edge scroll-edge--top';
    edgeTop.setAttribute('aria-hidden', 'true');

    edgeBottom = document.createElement('div');
    edgeBottom.className = 'scroll-edge scroll-edge--bottom';
    edgeBottom.setAttribute('aria-hidden', 'true');

    hintEl = document.createElement('div');
    hintEl.className = 'scroll-edge-hint';
    hintEl.setAttribute('aria-hidden', 'true');
    hintEl.textContent = 'HOVER NEAR THE BOTTOM EDGE TO SCROLL';

    document.body.appendChild(edgeTop);
    document.body.appendChild(edgeBottom);
    document.body.appendChild(hintEl);
};

/**
 * Shows the discovery hint the first time an assisted overlay is used.
 */
const showHintOnce = () => {
    if (hintShown || !hintEl || !isScrollable()) return;
    hintShown = true;
    hintEl.classList.add('is-visible');
    setTimeout(() => {
        if (hintEl) hintEl.classList.remove('is-visible');
    }, 4200);
};

/**
 * Removes the affordance elements from the DOM.
 */
const destroyAffordance = () => {
    [edgeTop, edgeBottom, hintEl].forEach(node => {
        if (node && node.parentNode) node.parentNode.removeChild(node);
    });
    edgeTop = null;
    edgeBottom = null;
    hintEl = null;
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Attaches scroll assistance to a scroll container.
 * @param {HTMLElement} element - The scrollable overlay element.
 * @param {object} [options] - Optional callbacks.
 * @param {Function} [options.onProgress] - Called with scroll progress (0-1).
 * @param {Function} [options.onEscape] - Called when Escape is pressed.
 */
const attach = (element, options = {}) => {
    if (!element) return;
    if (el === element) return;
    if (el) detach();

    el = element;
    onProgress = options.onProgress || null;
    onEscape = options.onEscape || null;

    targetScroll = el.scrollTop;
    pointerInside = false;
    docked = false;
    draggingRail = false;

    buildAffordance();

    handlers.wheel = onWheel;
    handlers.mousemove = onMouseMove;
    handlers.mouseleave = onMouseLeave;
    handlers.pointerdown = onPointerDown;
    handlers.pointerup = onPointerUp;
    handlers.keydown = onKeyDown;
    handlers.scroll = onScroll;
    handlers.resize = onResize;

    // `passive: false` is required so preventDefault actually suppresses the
    // browser's own (useless, because body overflow is hidden) scroll.
    el.addEventListener('wheel', handlers.wheel, { passive: false });
    el.addEventListener('scroll', handlers.scroll, { passive: true });
    document.addEventListener('mousemove', handlers.mousemove, { passive: true });
    document.addEventListener('mouseleave', handlers.mouseleave);
    document.addEventListener('pointerdown', handlers.pointerdown, { passive: true });
    document.addEventListener('pointerup', handlers.pointerup, { passive: true });
    document.addEventListener('keydown', handlers.keydown);
    window.addEventListener('resize', handlers.resize);

    if (!rafId) loop();
    reportProgress();
};

/**
 * Detaches scroll assistance and cleans up all listeners and DOM nodes.
 */
const detach = () => {
    if (!el) return;

    el.removeEventListener('wheel', handlers.wheel);
    el.removeEventListener('scroll', handlers.scroll);
    document.removeEventListener('mousemove', handlers.mousemove);
    document.removeEventListener('mouseleave', handlers.mouseleave);
    document.removeEventListener('pointerdown', handlers.pointerdown);
    document.removeEventListener('pointerup', handlers.pointerup);
    document.removeEventListener('keydown', handlers.keydown);
    window.removeEventListener('resize', handlers.resize);

    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    if (docked) cursor.undock();
    el.classList.remove('is-rail-docked');

    destroyAffordance();

    el = null;
    onProgress = null;
    onEscape = null;
    docked = false;
    draggingRail = false;
    pointerInside = false;
};

/**
 * Scrolls the attached element back to the top (used when opening a new view).
 */
const resetScroll = () => {
    if (!el) return;
    el.scrollTop = 0;
    targetScroll = 0;
    reportProgress();
};

export default {
    attach,
    detach,
    resetScroll,
};
