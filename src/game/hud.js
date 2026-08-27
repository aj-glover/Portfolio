/**
 * src/game/hud.js - Persistent minimal HUD overlay.
 * Fixed DOM elements, completely independent from Three.js.
 * Receives events from navigation.js — never queries the 3D scene.
 *
 * Layout:
 *   Top-left:     Identity (name, tagline, system status)
 *   Top-right:    Sector info + MAP control
 *   Bottom-left:  Current location (dynamic)
 *   Bottom-right: Controls help
 */

import gameState from '../systems/gameState.js';

/** @type {HTMLElement|null} */
let hudEl = null;

/** @type {HTMLElement|null} */
let identityEl = null;
/** @type {HTMLElement|null} */
let sectorInfoEl = null;
/** @type {HTMLElement|null} */
let locationEl = null;
/** @type {HTMLElement|null} */
let controlsEl = null;
/** @type {HTMLElement|null} */
let explorationEl = null;
/** @type {HTMLElement|null} */
let soundToggleEl = null;
/** @type {HTMLElement|null} */
let mapButtonEl = null;

/** Current sector name */
let currentSector = null;

/** Map button click callback */
let onMapClick = null;

/**
 * Builds the HUD DOM structure.
 */
const build = () => {
    if (hudEl) return;

    hudEl = document.createElement('div');
    hudEl.id = 'game-hud';
    hudEl.className = 'game-hud';
    hudEl.setAttribute('aria-label', 'Navigation HUD');

    // --- Top-left: Identity ---
    identityEl = document.createElement('div');
    identityEl.className = 'game-hud-identity';
    identityEl.innerHTML = `
        <span class="game-hud-name">AJ GLOVER</span>
        <span class="game-hud-tagline">DIGITAL / CREATIVE / STRATEGY</span>
        <span class="game-hud-status">● SYSTEM ONLINE</span>
    `;
    hudEl.appendChild(identityEl);

    // --- Top-right: Sector info ---
    sectorInfoEl = document.createElement('div');
    sectorInfoEl.className = 'game-hud-sector';
    sectorInfoEl.innerHTML = `
        <span class="game-hud-sector-label">SECTOR 01</span>
        <span class="game-hud-sector-objects" id="game-hud-objects">07 OBJECTS</span>
    `;
    hudEl.appendChild(sectorInfoEl);

    // --- Bottom-left: Current location ---
    locationEl = document.createElement('div');
    locationEl.className = 'game-hud-location';
    locationEl.innerHTML = `
        <span class="game-hud-location-label">SECTOR</span>
        <span class="game-hud-location-name" id="game-hud-location-name">—</span>
    `;
    hudEl.appendChild(locationEl);

    // --- Bottom-right: Controls ---
    controlsEl = document.createElement('div');
    controlsEl.className = 'game-hud-controls';
    controlsEl.innerHTML = `
        <span class="game-hud-control">MOVE <span class="game-hud-key">MOUSE</span></span>
        <span class="game-hud-control">SELECT <span class="game-hud-key">CLICK</span></span>
        <span class="game-hud-control">MAP <span class="game-hud-key">M</span></span>
    `;
    hudEl.appendChild(controlsEl);

    // --- Exploration counter (bottom-center) ---
    explorationEl = document.createElement('div');
    explorationEl.className = 'game-hud-exploration';
    explorationEl.innerHTML = `
        <span class="game-hud-exploration-label">EXPLORATION</span>
        <span class="game-hud-exploration-count" id="game-hud-exploration-count">00 / 00</span>
    `;
    hudEl.appendChild(explorationEl);

    // --- Sound toggle (near top-right) ---
    soundToggleEl = document.createElement('button');
    soundToggleEl.className = 'game-hud-sound-toggle';
    soundToggleEl.id = 'game-hud-sound';
    soundToggleEl.setAttribute('aria-label', 'Toggle sound');
    soundToggleEl.textContent = 'SOUND: OFF';
    soundToggleEl.addEventListener('click', () => {
        const current = gameState.getSetting('audio');
        const next = !current;
        gameState.setSetting('audio', next);
        updateSoundToggle(next);
        // Notify audio system via custom event (avoids direct import)
        window.dispatchEvent(new CustomEvent('game-audio-toggle', { detail: { enabled: next } }));
    });
    hudEl.appendChild(soundToggleEl);

    // --- MAP button (touch only; CSS hides it on pointer devices) ---
    // The controls legend tells desktop users to press "M". Touch devices have
    // no keyboard, so they get a real tap target for the same action.
    mapButtonEl = document.createElement('button');
    mapButtonEl.className = 'game-hud-map-btn';
    mapButtonEl.id = 'game-hud-map-btn';
    mapButtonEl.type = 'button';
    mapButtonEl.setAttribute('aria-label', 'Return to universe map');
    mapButtonEl.textContent = 'MAP';
    mapButtonEl.addEventListener('click', () => {
        if (onMapClick) onMapClick();
    });
    hudEl.appendChild(mapButtonEl);

    document.body.appendChild(hudEl);

    // Listen for M key for map
    document.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (onMapClick) onMapClick();
        }
    });

    // Set initial sound toggle state
    updateSoundToggle(gameState.getSetting('audio'));

    // Set initial exploration count
    updateExplorationProgress(0, 0);
};

/**
 * Updates the sound toggle button text.
 * @param {boolean} enabled
 */
const updateSoundToggle = (enabled) => {
    if (soundToggleEl) {
        soundToggleEl.textContent = enabled ? 'SOUND: ON' : 'SOUND: OFF';
        soundToggleEl.setAttribute('data-enabled', String(enabled));
    }
};

/**
 * Sets the current sector display.
 * @param {string} sectorName - e.g. "GROWTH"
 */
const setSector = (sectorName) => {
    if (!hudEl) build();
    currentSector = sectorName;
    const nameEl = document.getElementById('game-hud-location-name');
    if (nameEl) {
        nameEl.textContent = sectorName || '—';
    }
};

/**
 * Clears the current sector (return to universe overview).
 */
const clearSector = () => {
    setSector(null);
};

/**
 * Sets the target/project info in the HUD.
 * @param {string} targetName - e.g. "NAWCO"
 */
const setTarget = (targetName) => {
    if (!hudEl) build();
    const nameEl = document.getElementById('game-hud-location-name');
    if (nameEl && targetName) {
        nameEl.textContent = targetName;
    }
};

/**
 * Updates the exploration progress display.
 * @param {number} explored
 * @param {number} total
 */
const updateExplorationProgress = (explored, total) => {
    if (!hudEl) build();
    const countEl = document.getElementById('game-hud-exploration-count');
    if (countEl) {
        const expStr = String(explored).padStart(2, '0');
        const totalStr = String(total).padStart(2, '0');
        countEl.textContent = `${expStr} / ${totalStr}`;
    }
};

/**
 * Updates the object count in the sector info.
 * @param {number} count
 */
const setObjectCount = (count) => {
    if (!hudEl) build();
    const objectsEl = document.getElementById('game-hud-objects');
    if (objectsEl) {
        const countStr = String(count).padStart(2, '0');
        objectsEl.textContent = `${countStr} OBJECTS`;
    }
};

/**
 * Sets the sector number display.
 * @param {number} num
 */
const setSectorNumber = (num) => {
    if (!hudEl) build();
    const labelEl = sectorInfoEl ? sectorInfoEl.querySelector('.game-hud-sector-label') : null;
    if (labelEl) {
        labelEl.textContent = `SECTOR ${String(num).padStart(2, '0')}`;
    }
};

/**
 * Sets the callback for the MAP button / M key.
 * @param {Function} callback
 */
const setOnMapClick = (callback) => {
    onMapClick = callback;
};

/**
 * Shows a brief sector entry notification.
 * @param {string} sectorName
 */
const showSectorEntry = (sectorName) => {
    if (!hudEl) build();

    const notification = document.createElement('div');
    notification.className = 'game-hud-sector-entry';
    notification.innerHTML = `
        <span class="game-hud-sector-entry-label">ENTERING SECTOR</span>
        <span class="game-hud-sector-entry-name">${sectorName}</span>
    `;
    hudEl.appendChild(notification);

    // Auto-remove after animation
    setTimeout(() => {
        notification.classList.add('is-fading');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 600);
    }, 1500);
};

/**
 * Updates controls display for mobile.
 * @param {boolean} isMobile
 */
const setMobileControls = (isMobile) => {
    if (!controlsEl) return;
    if (isMobile) {
        controlsEl.innerHTML = `
            <span class="game-hud-control">SELECT <span class="game-hud-key">TAP</span></span>
            <span class="game-hud-control">ENTER <span class="game-hud-key">TAP</span></span>
            <span class="game-hud-control">MAP <span class="game-hud-key">M</span></span>
        `;
    } else {
        controlsEl.innerHTML = `
            <span class="game-hud-control">MOVE <span class="game-hud-key">MOUSE</span></span>
            <span class="game-hud-control">SELECT <span class="game-hud-key">CLICK</span></span>
            <span class="game-hud-control">MAP <span class="game-hud-key">M</span></span>
        `;
    }
};

/**
 * Initializes the HUD.
 */
const init = () => {
    build();

    // Detect mobile
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)
        || ('ontouchstart' in window && window.innerWidth < 1024);
    setMobileControls(isMobile);

    // Listen for resize to update mobile controls
    window.addEventListener('resize', () => {
        const nowMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)
            || ('ontouchstart' in window && window.innerWidth < 1024);
        setMobileControls(nowMobile);
    });

    console.log('[HUD] Initialized.');
};

/**
 * Cleans up.
 */
const dispose = () => {
    if (hudEl && hudEl.parentNode) {
        hudEl.parentNode.removeChild(hudEl);
    }
    hudEl = null;
    identityEl = null;
    sectorInfoEl = null;
    locationEl = null;
    controlsEl = null;
    explorationEl = null;
    soundToggleEl = null;
    mapButtonEl = null;
    onMapClick = null;
};

export default {
    init,
    dispose,
    setSector,
    clearSector,
    setTarget,
    updateExplorationProgress,
    setObjectCount,
    setSectorNumber,
    setOnMapClick,
    showSectorEntry,
    setMobileControls
};