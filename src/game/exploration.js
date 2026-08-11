/**
 * src/game/exploration.js - Exploration tracking system.
 * Tracks viewed projects and visited sectors via gameState.
 * Deduplicates — only counts first view of each unique project/sector.
 * Calls achievements.evaluate() after any state change.
 */

import gameState from '../systems/gameState.js';
import achievements from './achievements.js';

/**
 * Records a project as explored. Called when case study content becomes visible.
 * @param {string} projectId
 * @returns {boolean} true if this was a new discovery
 */
const recordProject = (projectId) => {
    const isNew = gameState.markProjectExplored(projectId);
    if (isNew) {
        console.log(`[Exploration] New project discovered: ${projectId}`);
        // Trigger achievement evaluation
        achievements.evaluate();
    }
    return isNew;
};

/**
 * Records a sector as visited. Called when entering a category.
 * @param {string} sectorName
 * @returns {boolean} true if this was a new visit
 */
const recordSector = (sectorName) => {
    const isNew = gameState.markSectorVisited(sectorName);
    if (isNew) {
        console.log(`[Exploration] New sector visited: ${sectorName}`);
        // Trigger achievement evaluation
        achievements.evaluate();
    }
    return isNew;
};

/**
 * Returns the current exploration progress.
 * @param {number} totalProjects - Total number of projects in the portfolio.
 * @returns {{ explored: number, total: number }}
 */
const getProgress = (totalProjects) => {
    return gameState.getExplorationProgress(totalProjects);
};

/**
 * Returns the list of explored project IDs.
 * @returns {string[]}
 */
const getExploredProjects = () => {
    const state = gameState.getState();
    return [...state.exploration.projectsViewed];
};

/**
 * Returns the list of visited sector names.
 * @returns {string[]}
 */
const getVisitedSectors = () => {
    const state = gameState.getState();
    return [...state.exploration.sectorsVisited];
};

export default {
    recordProject,
    recordSector,
    getProgress,
    getExploredProjects,
    getVisitedSectors
};