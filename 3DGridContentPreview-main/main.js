/**
 * main.js - Application Entry Point for 3D Grid Content Previewer.
 * This module initializes all major components, managing state and coordinating interactions
 * between the grid renderer and cursor manager.
 */

// Import modules
const { initializeGrid } = require('./grid-renderer');
const { initCursorManager } = require('./cursor-manager');

/**
 * Main function to start the application.
 */
function initializeApp() {
    console.log("Initializing 3D Grid Preview Application...");

    // 1. Initialize the Grid Renderer (populates the grid container)
    // Data source should be imported from a dedicated data module in a real-world scenario.
    initializeGrid();

    // 2. Initialize Cursor and Interaction Manager (handles events, shooting)
    initCursorManager();

    console.log("Application fully initialized.");
}

// Wait for DOM content to load before running initialization logic.
document.addEventListener('DOMContentLoaded', initializeApp);