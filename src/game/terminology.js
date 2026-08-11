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

export default {
    getGameTerm,
    getStandardTerm
};