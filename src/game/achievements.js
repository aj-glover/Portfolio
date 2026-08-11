/**
 * src/game/achievements.js - Achievement system.
 * 5 achievements stored in gameState. Evaluated after exploration state changes.
 * Never called directly by navigation — only by exploration after state changes.
 */

import gameState from '../systems/gameState.js';
import { PROJECTS, CATEGORIES } from '../data/projectData.js';

/**
 * Achievement definitions.
 * Each has a key, name, description, and a condition function that returns true when met.
 */
const ACHIEVEMENTS = [
    {
        key: 'firstContact',
        name: 'FIRST CONTACT',
        description: 'First project opened',
        condition: (state) => state.exploration.projectsViewed.length >= 1
    },
    {
        key: 'systemsThinker',
        name: 'SYSTEMS THINKER',
        description: 'Multiple disciplines explored',
        condition: (state) => {
            // Count unique categories of explored projects
            const exploredProjectIds = state.exploration.projectsViewed;
            const categories = new Set();
            exploredProjectIds.forEach(id => {
                const project = PROJECTS.find(p => p.id === id);
                if (project && project.category) {
                    categories.add(project.category);
                }
            });
            return categories.size >= 3;
        }
    },
    {
        key: 'fieldTested',
        name: 'FIELD TESTED',
        description: 'Three case studies viewed',
        condition: (state) => state.exploration.projectsViewed.length >= 3
    },
    {
        key: 'deepSpace',
        name: 'DEEP SPACE',
        description: 'Visited the experimental area',
        condition: (state) => {
            // Photo category is the experimental/observatory area
            return state.exploration.sectorsVisited.includes('Photo');
        }
    },
    {
        key: 'fullOrbit',
        name: 'FULL ORBIT',
        description: 'All major sections visited',
        condition: (state) => {
            const allSectors = Object.keys(CATEGORIES);
            return allSectors.every(sector => state.exploration.sectorsVisited.includes(sector));
        }
    }
];

/** Callback for showing achievement toast (set by init) */
let onAchievementUnlocked = null;

/**
 * Evaluates all achievement conditions and unlocks any newly met.
 * Called by exploration after any state change.
 * @returns {Array<{key: string, name: string, description: string}>} Newly unlocked achievements
 */
const evaluate = () => {
    const state = gameState.getState();
    const newlyUnlocked = [];

    ACHIEVEMENTS.forEach(achievement => {
        if (gameState.isAchievementUnlocked(achievement.key)) return;

        if (achievement.condition(state)) {
            const unlocked = gameState.unlockAchievement(achievement.key);
            if (unlocked) {
                console.log(`[Achievements] Unlocked: ${achievement.name}`);
                newlyUnlocked.push({
                    key: achievement.key,
                    name: achievement.name,
                    description: achievement.description
                });

                // Notify via callback
                if (onAchievementUnlocked) {
                    onAchievementUnlocked(achievement);
                }
            }
        }
    });

    return newlyUnlocked;
};

/**
 * Sets the callback for when an achievement is unlocked.
 * @param {Function} callback - Receives { key, name, description }
 */
const setOnUnlock = (callback) => {
    onAchievementUnlocked = callback;
};

/**
 * Returns all achievement definitions with their unlocked status.
 * @returns {Array<{key: string, name: string, description: string, unlocked: boolean}>}
 */
const getAll = () => {
    return ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: gameState.isAchievementUnlocked(a.key)
    }));
};

/**
 * Returns the count of unlocked achievements.
 * @returns {number}
 */
const getUnlockedCount = () => {
    return ACHIEVEMENTS.filter(a => gameState.isAchievementUnlocked(a.key)).length;
};

export default {
    evaluate,
    setOnUnlock,
    getAll,
    getUnlockedCount
};