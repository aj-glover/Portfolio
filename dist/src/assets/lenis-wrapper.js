/**
 * src/assets/lenis-wrapper.js - Wrapper for Lenis scroll library integration.
 * Provides smooth, momentum-based scrolling for the portfolio.
 */

import Lenis from 'lenis';

let lenisInstance = null;

/**
 * Initializes Lenis smooth scrolling with optimized settings.
 * Respects prefers-reduced-motion for accessibility.
 */
export const initLenis = () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        console.log("Lenis scrolling skipped (prefers-reduced-motion).");
        return;
    }

    // Destroy existing instance if present
    if (lenisInstance) {
        lenisInstance.destroy();
    }

    // Initialize Lenis with smooth settings
    lenisInstance = new Lenis({
        duration: 1.2, // Smooth scroll duration in seconds
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false, // Disable smooth scrolling on touch devices (native scroll is better)
        touchMultiplier: 2,
        infinite: false,
    });

    // Connect Lenis to GSAP's ScrollTrigger for smooth scroll-based animations
    lenisInstance.on('scroll', (e) => {
        // Dispatch custom scroll event for any listeners
        window.dispatchEvent(new CustomEvent('lenis:scroll', { detail: e }));
    });

    // Use requestAnimationFrame for smooth animation loop
    const raf = (time) => {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    console.log("Lenis smooth scrolling initialized.");
};

/**
 * Stops Lenis smooth scrolling and cleans up.
 */
export const destroyLenis = () => {
    if (lenisInstance) {
        lenisInstance.destroy();
        lenisInstance = null;
        console.log("Lenis scrolling destroyed.");
    }
};

/**
 * Gets the current Lenis instance.
 * @returns {Lenis|null}
 */
export const getLenis = () => lenisInstance;

export default {
    initLenis,
    destroyLenis,
    getLenis
};
