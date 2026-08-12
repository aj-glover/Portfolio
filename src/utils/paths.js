/**
 * src/utils/paths.js - Centralized path resolution for GitHub Pages deployment.
 * All asset paths must be prefixed with the base path (/Portfolio/) when
 * deployed to GitHub Pages at https://aj-glover.github.io/Portfolio/.
 */

// Base path for GitHub Pages deployment
export const BASE_PATH = '/Portfolio/';

/**
 * Resolves an asset path with the correct base path prefix.
 * Handles both root-absolute paths (e.g. /models/foo.glb) and
 * relative paths that need the base prefix.
 * @param {string} path - The asset path to resolve.
 * @returns {string} The resolved path with base prefix.
 */
export const resolveAsset = (path) => {
    if (!path) return path;
    // Skip external URLs and data URIs
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    // Skip paths that already have the base prefix
    if (path.startsWith(BASE_PATH)) {
        return path;
    }
    // Handle root-absolute paths
    if (path.startsWith('/')) {
        return `${BASE_PATH}${path.slice(1)}`;
    }
    // Handle relative paths
    return `${BASE_PATH}${path}`;
};

export default { BASE_PATH, resolveAsset };