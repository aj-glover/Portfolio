/**
 * src/game/audio.js - Optional audio system using Web Audio API.
 * Default OFF. AudioContext created only after first user interaction.
 * 5 sounds: hover, target, select, sectorEnter, achievement.
 * No audio files — all sounds generated programmatically.
 */

import gameState from '../systems/gameState.js';

/** @type {AudioContext|null} */
let audioCtx = null;

/** Whether audio is enabled */
let enabled = false;

/** Whether AudioContext has been initialized (requires user gesture) */
let contextInitialized = false;

/**
 * Creates the AudioContext on first user interaction (browser requirement).
 */
const initContext = () => {
    if (contextInitialized) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        contextInitialized = true;
        console.log('[Audio] AudioContext initialized.');
    } catch (e) {
        console.warn('[Audio] Failed to create AudioContext:', e);
    }
};

/**
 * Plays a short tone with the given frequency, duration, and type.
 * @param {number} freq - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {OscillatorType} type - Waveform type
 * @param {number} volume - Gain (0-1)
 * @param {number} [freqEnd] - Optional end frequency for sweep
 */
const playTone = (freq, duration, type = 'sine', volume = 0.08, freqEnd) => {
    if (!enabled || !audioCtx || audioCtx.state !== 'running') return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (freqEnd) {
            osc.frequency.linearRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // Silently fail — audio is optional
    }
};

/**
 * Plays a short noise burst (for transitions).
 * @param {number} duration - Duration in seconds
 * @param {number} volume - Gain (0-1)
 */
const playNoise = (duration, volume = 0.04) => {
    if (!enabled || !audioCtx || audioCtx.state !== 'running') return;

    try {
        const bufferSize = Math.floor(audioCtx.sampleRate * duration);
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, audioCtx.currentTime);
        filter.Q.setValueAtTime(0.5, audioCtx.currentTime);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        source.start(audioCtx.currentTime);
    } catch (e) {
        // Silently fail
    }
};

// --- Public sound effects ---

/**
 * Subtle hover blip — short high-frequency sine.
 */
const playHover = () => {
    playTone(1200, 0.05, 'sine', 0.05);
};

/**
 * Target acquired — slightly longer tone.
 */
const playTarget = () => {
    playTone(800, 0.08, 'sine', 0.06, 1000);
};

/**
 * Select/click — short two-tone chirp.
 */
const playSelect = () => {
    playTone(600, 0.06, 'sine', 0.07, 900);
    setTimeout(() => playTone(900, 0.04, 'sine', 0.05), 50);
};

/**
 * Sector entry — filtered noise whoosh.
 */
const playSectorEnter = () => {
    playNoise(0.3, 0.05);
};

/**
 * Asteroid impact — a very short, dry blip.
 * Intentionally quiet and brief so repeated firing never becomes fatiguing.
 * No-op unless the user has already switched audio on.
 */
const playImpact = () => {
    playTone(220, 0.018, 'square', 0.035, 140);
};

/**
 * Achievement unlocked — pleasant two-note chime.
 */
const playAchievement = () => {
    playTone(523, 0.15, 'sine', 0.1); // C5

    setTimeout(() => playTone(659, 0.15, 'sine', 0.1), 120); // E5
    setTimeout(() => playTone(784, 0.2, 'sine', 0.08), 240); // G5
};

/**
 * Enables or disables audio.
 * @param {boolean} val
 */
const setEnabled = (val) => {
    enabled = val;
    if (val && !contextInitialized) {
        initContext();
    }
    if (val && audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    console.log(`[Audio] ${val ? 'Enabled' : 'Disabled'}`);
};

/**
 * Initializes the audio system.
 * Listens for first user interaction to create AudioContext.
 * Listens for the game-audio-toggle custom event from HUD.
 */
const init = () => {
    // Load saved preference
    enabled = gameState.getSetting('audio');

    // Create AudioContext on first user interaction
    const onFirstInteraction = () => {
        initContext();
        if (enabled && audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        document.removeEventListener('click', onFirstInteraction);
        document.removeEventListener('keydown', onFirstInteraction);
        document.removeEventListener('touchstart', onFirstInteraction);
    };

    document.addEventListener('click', onFirstInteraction);
    document.addEventListener('keydown', onFirstInteraction);
    document.addEventListener('touchstart', onFirstInteraction);

    // Listen for HUD sound toggle
    window.addEventListener('game-audio-toggle', (e) => {
        setEnabled(e.detail.enabled);
    });

    console.log('[Audio] System initialized (waiting for user interaction).');
};

/**
 * Cleans up.
 */
const dispose = () => {
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
    contextInitialized = false;
    enabled = false;
};

export default {
    init,
    dispose,
    setEnabled,
    playHover,
    playTarget,
    playSelect,
    playSectorEnter,
    playImpact,
    playAchievement
};


