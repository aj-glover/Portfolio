/**
 * src/systems/gameState.js - Central game state manager.
 * Single source of truth for all game-layer state and localStorage.
 * No other module reads/writes localStorage directly.
 */

const STORAGE_KEY = 'aj-portfolio-game-state';

const DEFAULT_STATE = {
    exploration: {
        projectsViewed: [],    // unique project IDs
        sectorsVisited: []     // unique sector names
    },
    achievements: {
        firstContact: false,
        systemsThinker: false,
        fieldTested: false,
        deepSpace: false,
        fullOrbit: false
    },
    settings: {
        audio: false,
        reducedMotion: false
    }
};

/** @type {object} Current in-memory state (always reflects localStorage). */
let state = null;

/** Debounce timer for save(). */
let saveTimer = null;

/**
 * Detects prefers-reduced-motion on init and stores it.
 */
const detectReducedMotion = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
};

/**
 * Loads state from localStorage, merging with defaults for any missing keys.
 * Must be called once before any other module reads state.
 */
const load = () => {
    if (state) return state;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            state = deepMerge(DEFAULT_STATE, parsed);
        } else {
            state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    } catch (e) {
        console.warn('[GameState] Failed to parse stored state, using defaults.', e);
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    // Always refresh reduced-motion from the OS
    state.settings.reducedMotion = detectReducedMotion();

    // Listen for changes to reduced-motion preference
    if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq.addEventListener) {
            mq.addEventListener('change', (e) => {
                state.settings.reducedMotion = e.matches;
                save();
            });
        }
    }

    console.log('[GameState] Loaded:', state);
    return state;
};

/**
 * Deep-merges source into target, returning a new object.
 * Arrays are replaced (not merged).
 */
const deepMerge = (target, source) => {
    const result = JSON.parse(JSON.stringify(target));
    if (!source || typeof source !== 'object') return result;

    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
};

/**
 * Persists current state to localStorage (debounced).
 */
const save = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('[GameState] Failed to save state.', e);
        }
        saveTimer = null;
    }, 300);
};

/**
 * Returns the full state object (read-only — mutate via setters).
 * @returns {object}
 */
const getState = () => {
    if (!state) load();
    return state;
};

/**
 * Sets a value at a dot-separated path and saves.
 * @param {string} path - e.g. "exploration.projectsViewed"
 * @param {*} value
 */
const setState = (path, value) => {
    if (!state) load();
    const keys = path.split('.');
    let obj = state;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    save();
};

// --- Exploration helpers ---

/**
 * @param {string} projectId
 * @returns {boolean}
 */
const isProjectExplored = (projectId) => {
    if (!state) load();
    return state.exploration.projectsViewed.includes(projectId);
};

/**
 * Records a project as explored. Deduplicates.
 * @param {string} projectId
 * @returns {boolean} true if this was a new discovery
 */
const markProjectExplored = (projectId) => {
    if (!state) load();
    if (state.exploration.projectsViewed.includes(projectId)) return false;
    state.exploration.projectsViewed.push(projectId);
    save();
    return true;
};

/**
 * @param {string} sectorName
 * @returns {boolean}
 */
const isSectorVisited = (sectorName) => {
    if (!state) load();
    return state.exploration.sectorsVisited.includes(sectorName);
};

/**
 * Records a sector as visited. Deduplicates.
 * @param {string} sectorName
 * @returns {boolean} true if this was a new visit
 */
const markSectorVisited = (sectorName) => {
    if (!state) load();
    if (state.exploration.sectorsVisited.includes(sectorName)) return false;
    state.exploration.sectorsVisited.push(sectorName);
    save();
    return true;
};

/**
 * Returns the count of explored projects and total available.
 * @param {number} totalProjects - Total number of projects in the portfolio.
 * @returns {{ explored: number, total: number }}
 */
const getExplorationProgress = (totalProjects) => {
    if (!state) load();
    return {
        explored: state.exploration.projectsViewed.length,
        total: totalProjects
    };
};

// --- Achievement helpers ---

/**
 * @param {string} key
 * @returns {boolean}
 */
const isAchievementUnlocked = (key) => {
    if (!state) load();
    return !!state.achievements[key];
};

/**
 * Unlocks an achievement. Deduplicates.
 * @param {string} key
 * @returns {boolean} true if newly unlocked
 */
const unlockAchievement = (key) => {
    if (!state) load();
    if (state.achievements[key]) return false;
    state.achievements[key] = true;
    save();
    return true;
};

// --- Settings helpers ---

/**
 * @param {string} key
 * @returns {*}
 */
const getSetting = (key) => {
    if (!state) load();
    return state.settings[key];
};

/**
 * @param {string} key
 * @param {*} value
 */
const setSetting = (key, value) => {
    if (!state) load();
    state.settings[key] = value;
    save();
};

/**
 * Resets all state to defaults (useful for debugging).
 */
const reset = () => {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    state.settings.reducedMotion = detectReducedMotion();
    save();
    console.log('[GameState] Reset to defaults.');
};

export default {
    load,
    getState,
    setState,
    isProjectExplored,
    markProjectExplored,
    isSectorVisited,
    markSectorVisited,
    getExplorationProgress,
    isAchievementUnlocked,
    unlockAchievement,
    getSetting,
    setSetting,
    reset
};