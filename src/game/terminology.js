/**
 * src/game/terminology.js - Game terminology mapping.
 * Secondary visual layer — normal professional language always remains primary.
 */

const TERMS = {
    'Projects': 'Missions',
    'Case Study': 'Mission Report',
    'About': 'Pilot Profile',
    'Resume': 'Credentials',
    'Contact': 'Open Comms',
    'Skills': 'Systems',
    'Photography': 'Observatory',
    'Experiments': 'Research Lab',
    'Home': 'Command Center',
    'UX/UI': 'UX/UI',
    'Video': 'Video',
    'Growth': 'Growth',
    'Photo': 'Observatory'
};

/**
 * Returns the game-layer term for a standard term.
 * Falls back to the original term if no mapping exists.
 * @param {string} standardTerm
 * @returns {string}
 */
const getGameTerm = (standardTerm) => {
    return TERMS[standardTerm] || standardTerm;
};

/**
 * Returns the standard term (identity function for clarity).
 * @param {string} term
 * @returns {string}
 */
const getStandardTerm = (term) => {
    return term;
};

/**
 * @returns {boolean} true when the primary input is touch (no hover).
 */
const isTouch = () => typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/**
 * Instruction copy for entering a project, phrased for the actual input
 * device. "Hover"/"Click" are meaningless — and misleading — on a phone.
 * @returns {string}
 */
const getProjectHint = () => isTouch()
    ? 'Tap a floating project to open its case study.'
    : 'Hover a project to preview it. Click to fly into its world.';

/**
 * Shorter variant used inside a category/sector view.
 * @returns {string}
 */
const getCategoryHint = () => isTouch()
    ? 'Tap a floating project to explore its case study'
    : 'Click a floating project to explore its case study';

export default {
    getGameTerm,
    getStandardTerm,
    getProjectHint,
    getCategoryHint
};