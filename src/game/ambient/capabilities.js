/**
 * src/game/ambient/capabilities.js - Single source of truth for how much
 * ambient motion this device/user should receive.
 *
 * Requirements #19 (mobile/touch) and #21 (prefers-reduced-motion) are both
 * resolved here so no individual effect module has to re-derive them.
 */

import gameState from '../../systems/gameState.js';

/**
 * @returns {boolean} true when the primary input is coarse (touch).
 */
export const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
    return 'ontouchstart' in window && navigator.maxTouchPoints > 0;
};

/**
 * @returns {boolean} true when the user has asked for reduced motion.
 */
export const isReducedMotion = () => !!gameState.getSetting('reducedMotion');

/**
 * Builds the active capability profile.
 *
 * The portfolio must stay fully usable in every profile — these flags only
 * ever subtract decoration, never content.
 *
 * @returns {{
 *   touch: boolean, reducedMotion: boolean,
 *   lasers: boolean, asteroids: boolean, trail: boolean,
 *   rareEvents: boolean, hyperspace: boolean, anomaly: boolean, ufo: boolean,
 *   parallaxScale: number, asteroidSpeedScale: number, starDensityScale: number,
 *   maxAsteroids: number
 * }}
 */
export const getProfile = () => {
    const touch = isTouchDevice();
    const reducedMotion = isReducedMotion();

    return {
        touch,
        reducedMotion,

        // Shooting is a pointer affordance — pointless and fiddly on touch.
        lasers: !touch && !reducedMotion,
        // Asteroids stay on everywhere: they are ambient scenery, not a game
        // mechanic. Touch simply gets fewer of them and no way to shoot them,
        // so the environment still feels alive (requirement #19).
        asteroids: true,
        trail: !touch && !reducedMotion,


        // Rare surprises are the first thing to go under reduced motion.
        rareEvents: !reducedMotion,
        hyperspace: !reducedMotion && !touch,
        anomaly: !reducedMotion,
        ufo: !reducedMotion,

        parallaxScale: reducedMotion ? 0.25 : (touch ? 0.5 : 1.0),
        asteroidSpeedScale: reducedMotion ? 0.3 : 1.0,
        starDensityScale: touch ? 0.5 : 1.0,
        maxAsteroids: reducedMotion ? 5 : (touch ? 6 : 12)
    };
};

export default { getProfile, isTouchDevice, isReducedMotion };
