/**
 * src/pages/index.js - Main initialization sequence for the Universe Portfolio SPA.
 */
import '../styles/_global.css';
import '../styles/case-study.css';
import '../styles/universe-intro.css';
import '../styles/category-view.css';
import '../styles/planet-tooltip.css';
import '../styles/about-view.css';
import '../styles/game-ui.css';
import '../styles/ambient.css';

import { setupScene, animate, getCamera, initializeEnvironmentObjects } from '../core/scene.js';
import { initializeCamera } from '../core/camera.js';
import navigationSystem from '../systems/navigation.js';
import UniverseIntro from '../ui/UniverseIntro.js';

// Game layer systems
import gameState from '../systems/gameState.js';
import cursor from '../game/cursor.js';
import hud from '../game/hud.js';
import audio from '../game/audio.js';
import initSequence from '../game/initSequence.js';

/**
 * Displays a runtime error banner on screen so failures are visible, not silent.
 * @param {string} message - The error message.
 */
const showErrorBanner = (message) => {
    const existing = document.getElementById('runtime-error-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'runtime-error-banner';
    banner.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0;
        background: rgba(200, 30, 30, 0.95); color: #fff;
        font-family: monospace; font-size: 12px;
        padding: 8px 12px; z-index: 9999; white-space: pre-wrap;
    `;
    banner.textContent = message;
    document.body.appendChild(banner);
};

// Surface any uncaught runtime error to the DOM
window.addEventListener('error', (event) => {
    showErrorBanner(`Runtime error: ${event.message}\n${event.filename || ''}:${event.lineno || ''}`);
});

/**
 * Main initialization sequence for the Universe Portfolio SPA.
 */
const initializeApp = async () => {
    try {
        // 0. Initialize game state (loads localStorage, detects reduced-motion)
        gameState.load();

        // 1. Setup core Three.js environment
        setupScene();

        // 2. Initialize Camera system and pass camera object to scene manager
        initializeCamera(getCamera());

        // 3. Build the immersive environment objects (loads assets internally)
        await initializeEnvironmentObjects();

        // 4. Initialize game layer systems (DOM-based, independent of Three.js)
        // Defer cursor init to after intro is dismissed for faster initial load (H1)
        hud.init();
        audio.init();

        // Set HUD map button to return to universe
        hud.setOnMapClick(() => {
            navigationSystem.returnToUniverse();
        });

        // Set initial HUD object count (total across all categories)
        const { CATEGORIES } = await import('../data/projectData.js');
        const totalObjects = Object.values(CATEGORIES).reduce((sum, cat) => sum + (cat.projects || []).length, 0);
        hud.setObjectCount(totalObjects);

        // 5. Show the init sequence, then universe intro, then navigation
        initSequence.show(() => {
            const intro = new UniverseIntro();
            intro.show();
            intro.setOnDismiss(() => {
                // 6. Initialize the navigation system (hover/click/detail/return flow)
                navigationSystem.init();
                // Lazy-load cursor after intro is dismissed for better initial load time
                cursor.init().catch(err => {
                    console.warn('[Init] Cursor initialization failed:', err);
                });
            });
        });

        // 7. Start the animation loop
        animate();

        console.log("--- Phase 3B: Universe Portfolio is Running ---");
    } catch (err) {
        console.error("[Init] Failed:", err);
        showErrorBanner(`Init failed: ${err.message}\n${err.stack || ''}`);
    }
};

// Start the application when everything is loaded
document.addEventListener('DOMContentLoaded', initializeApp);