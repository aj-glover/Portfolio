/**
 * src/game/cursor.js - 3D spacecraft cursor system.
 *
 * Renders a GLB spacecraft on a dedicated orthographic Three.js overlay and
 * owns the ship's flight model: heading, spring-follow physics, momentum,
 * banking, pitch and the thrust pulse.
 *
 * The ambient space environment (starfield, asteroids, lasers, trail, comets,
 * satellites, UFOs, anomalies, hyperspace) lives in ./ambient and is ticked
 * from this module's render loop. There is exactly one renderer and one
 * requestAnimationFrame loop for the whole overlay.
 *
 * The canvas is pointer-events: none so it never blocks the main raycaster or
 * any portfolio link, button, form or text selection.
 *
 * States: scanning (default), target (hovering interactive), lock (click transition)
 */

import {
    Scene, OrthographicCamera, WebGLRenderer, AmbientLight, DirectionalLight,
    Group, Box3, Vector3, Mesh, IcosahedronGeometry, MeshStandardMaterial
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import gameState from '../systems/gameState.js';
import ambient from './ambient/index.js';

// ============================================================================
// STATE VARIABLES
// ============================================================================

/** Base X rotation applied once when model loads (in radians) - 103° to view from top */
const MODEL_BASE_ROTATION_X = 103 * Math.PI / 180;  // 103° pitch for top-down view

/** Stored base rotation for the model */
let baseRotationX = MODEL_BASE_ROTATION_X;

/** @type {Scene|null} */
let scene = null;

/** @type {OrthographicCamera|null} */
let camera = null;

/** @type {WebGLRenderer|null} */
let renderer = null;

/** @type {HTMLCanvasElement|null} */
let canvas = null;

/** @type {Group|null} */
let modelGroup = null;

/** Current cursor state: 'scanning' | 'target' | 'lock' */
let currentState = 'scanning';

// --- Mouse / Target ---

/** Target mouse position in screen coords (updated on mousemove) */
let targetX = 0;
let targetY = 0;

/** Ship position in orthographic space (center origin) */
let shipX = 0;
let shipY = 0;

/** Ship velocity in orthographic px/s */
let velocityX = 0;
let velocityY = 0;

/** Current ship heading in radians */
let currentHeading = 0;

/** Current model Z rotation / yaw (for smooth interpolation) */
let currentModelRotationZ = 0;

/** Target pitch (X rotation offset from base) for mouse up/down */
let targetPitch = 0;

/** Current smoothed pitch applied to model */
let currentSmoothedPitch = 0;

/** Current smoothed roll/bank applied when turning */
let currentSmoothedRoll = 0;

/** Previous heading used to derive turn rate for roll */
let previousHeading = 0;

/** Angular velocity for rotation inertia */
let angularVelocity = 0;

/** Whether the cursor is visible */
let visible = false;

/** Animation frame ID */
let animId = null;

/** Whether the model has finished loading */
let modelLoaded = false;

/** Whether model is currently loading */
let modelLoading = false;

/** Base scale of the model (stored after load) */
let baseScale = null;

// --- Idle Animation ---

/** Accumulated time for idle animation */
let idleTime = 0;

/** Random phase offsets for idle motion */
const idlePhaseX = Math.random() * Math.PI * 2;
const idlePhaseY = Math.random() * Math.PI * 2;
const idlePhaseRock = Math.random() * Math.PI * 2;

// ============================================================================
// PHYSICS CONSTANTS
// ============================================================================

const PHYSICS = {
    deadZone: 50,            // pixels - no force when mouse is close to ship
    maxSpeed: 800,           // max ship speed in orthographic px/s
    stiffness: 4.0,          // spring stiffness (pull toward mouse)
    damping: 2.5,            // velocity damping (higher = less drift)
    maxBank: 1.0,            // maximum roll/bank angle (radians) when turning
    maxPitch: 0.4,           // maximum pitch angle (radians) - from mouse up/down
    rollResponse: 0.55,      // how strongly turn rate maps into roll
    rollSmooth: 0.18,        // roll interpolation factor (higher = snappier bank)
};

// Reduced-motion overrides
const REDUCED_PHYSICS = {
    stiffness: 8.0,
    damping: 5.0,
    maxSpeed: 400,
    settleThreshold: 2.0,
    bankFactor: 0.0,
    rotationSmooth: 0.5,
    lookAheadBlend: 0.8,
    deadZone: 50,
    maxPitch: 0.0,
};

// ============================================================================
// SCENE SETUP
// ============================================================================

/**
 * Creates the Three.js scene, orthographic camera, and renderer for the cursor.
 */
const setupScene = () => {
    if (scene) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    scene = new Scene();

    camera = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
    camera.position.z = 10;

    // Create a fresh canvas element to avoid "Canvas has an existing context" errors
    const newCanvas = document.createElement('canvas');
    renderer = new WebGLRenderer({
        antialias: false,
        alpha: true,
        canvas: newCanvas,
        powerPreference: 'high-performance'
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    canvas = renderer.domElement;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'none';
    document.body.appendChild(canvas);

    // Lighting for the model
    const ambientLight = new AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(3, 3, 8);
    scene.add(keyLight);

    const rimLight = new DirectionalLight(0x66ccff, 1.5);
    rimLight.position.set(-3, -1, -3);
    scene.add(rimLight);

    const fillLight = new DirectionalLight(0x9966ff, 0.6);
    fillLight.position.set(0, -3, 2);
    scene.add(fillLight);

    // Handle resize
    window.addEventListener('resize', handleResize);
};

/**
 * Handles window resize for the cursor renderer.
 */
const handleResize = () => {
    if (!camera || !renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    ambient.handleResize();
};

// ============================================================================
// MODEL LOADING
// ============================================================================

/**
 * Loads the 3D cursor model.
 * @returns {Promise<void>}
 */
const loadModel = () => {
    if (modelLoaded && modelGroup) return Promise.resolve();
    if (modelLoading) {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (modelLoaded) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    }

    modelLoading = true;
    console.log('[Cursor] Loading 3D cursor model...');

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    return new Promise((resolve) => {
        loader.load(
            `${import.meta.env.BASE_URL}models/cursor.glb`,
            (gltf) => {
                modelGroup = gltf.scene;
                modelGroup.name = 'cursor-model';

                // Normalize scale — target ~60px in orthographic space
                const box = new Box3().setFromObject(modelGroup);
                const size = new Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const targetSize = 60;
                const scale = targetSize / maxDim;
                modelGroup.scale.set(scale, scale, scale);
                baseScale = modelGroup.scale.clone();

                // Center the model
                const center = new Vector3();
                box.getCenter(center);
                modelGroup.position.set(-center.x * scale, -center.y * scale, 0);

                // Ensure materials are opaque
                modelGroup.traverse((child) => {
                    if (child.isMesh && child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            mat.transparent = false;
                            mat.opacity = 1;
                            mat.depthWrite = true;
                            mat.depthTest = true;
                            mat.needsUpdate = true;
                        });
                    }
                });

                scene.add(modelGroup);

                // Store base rotation for top-down view
                baseRotationX = MODEL_BASE_ROTATION_X;
                modelGroup.rotation.x = baseRotationX;

                modelLoaded = true;
                modelLoading = false;
                console.log('[Cursor] 3D cursor model loaded.');
                resolve();
            },
            (progress) => {
                if (progress.total > 0) {
                    const pct = Math.round((progress.loaded / progress.total) * 100);
                    console.log(`[Cursor] Model loading: ${pct}%`);
                }
            },
            (error) => {
                console.error('[Cursor] Failed to load cursor model:', error);
                modelLoading = false;

                // Fallback to simple geometry if model fails to load
                console.log('[Cursor] Using fallback cursor geometry...');
                const fallbackGeom = new IcosahedronGeometry(1, 0);
                const fallbackMat = new MeshStandardMaterial({
                    color: 0x66ccff,
                    roughness: 0.3,
                    metalness: 0.7,
                    flatShading: true,
                });
                modelGroup = new Group();
                const fallbackMesh = new Mesh(fallbackGeom, fallbackMat);
                fallbackMesh.scale.set(30, 30, 30);
                modelGroup.add(fallbackMesh);
                modelGroup.name = 'cursor-fallback';
                baseScale = new Vector3(1, 1, 1);
                scene.add(modelGroup);
                modelLoaded = true;

                const existing = document.getElementById('model-load-error');
                if (!existing) {
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'model-load-error';
                    errorDiv.style.cssText = `
                        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                        background: rgba(200, 30, 30, 0.9); color: #fff;
                        font-family: sans-serif; font-size: 12px;
                        padding: 8px 16px; border-radius: 4px; z-index: 10000;
                    `;
                    errorDiv.textContent = 'Cursor model failed to load. Using fallback shape.';
                    document.body.appendChild(errorDiv);
                    setTimeout(() => errorDiv.remove(), 5000);
                }
                resolve();
            }
        );
    });
};

// ============================================================================
// PHYSICS & MOVEMENT
// ============================================================================

/**
 * Returns the active physics config based on reduced motion setting.
 * @returns {object}
 */
const getPhysics = () => {
    const reducedMotion = gameState.getSetting('reducedMotion');
    return reducedMotion ? REDUCED_PHYSICS : PHYSICS;
};

/**
 * Applies spring physics to pull ship toward mouse position.
 * Ship acts as a physics-based cursor with weight and drift.
 * @param {number} dt - Delta time
 */
const updateShipPhysics = (dt) => {
    const physics = getPhysics();
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Target position (mouse in orthographic space)
    const targetOX = targetX - w / 2;
    const targetOY = h / 2 - targetY;

    // Distance from ship to mouse
    const dx = targetOX - shipX;
    const dy = targetOY - shipY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // No force within dead zone
    if (distance < physics.deadZone) {
        velocityX *= Math.pow(1 - physics.damping * dt * 0.1, dt * 60);
        velocityY *= Math.pow(1 - physics.damping * dt * 0.1, dt * 60);
    } else {
        // Spring force: pull toward mouse (stiffness * displacement)
        const forceScale = physics.stiffness / distance;
        const fx = dx * forceScale;
        const fy = dy * forceScale;

        // Apply spring force
        velocityX += fx * dt * 60;
        velocityY += fy * dt * 60;

        // Damping (proportional to velocity)
        velocityX -= velocityX * physics.damping * dt;
        velocityY -= velocityY * physics.damping * dt;
    }

    // Clamp to max speed
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (speed > physics.maxSpeed) {
        const clamp = physics.maxSpeed / speed;
        velocityX *= clamp;
        velocityY *= clamp;
    }

    // Update position
    shipX += velocityX * dt;
    shipY += velocityY * dt;

    // Ship heading faces toward mouse for rotational control (yaw)
    if (distance > 10) {
        currentHeading = Math.atan2(dy, dx);
    }

    // Pitch: vertical mouse offset from ship controls pitch angle
    // Mouse above ship (negative dy) = pitch down; mouse below (positive dy) = pitch up
    if (distance > 10) {
        const normalizedVertDist = Math.min(Math.abs(dy) / (h * 0.4), 1);
        targetPitch = -Math.sign(dy) * normalizedVertDist * physics.maxPitch;
    } else {
        targetPitch = 0;
    }
};

// ============================================================================
// ROTATION (legacy, used for reduced motion)
// ============================================================================

/**
 * Updates the ship model's rotation based on movement and idle state.
 * @param {number} dt - Delta time
 * @param {number} time - Current time in seconds
 */
const updateRotation = (dt, time) => {
    if (!modelGroup || !modelLoaded) return;

    const physics = getPhysics();
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetOX = targetX - w / 2;
    const targetOY = h / 2 - targetY;

    const lookDx = targetOX - shipX;
    const lookDy = targetOY - shipY;
    const lookDist = Math.sqrt(lookDx * lookDx + lookDy * lookDy);
    let lookAngle = 0;
    if (lookDist > 1) {
        lookAngle = Math.atan2(lookDy, lookDx);
    }

    const targetAngle = lookAngle + Math.PI;
    const yawTarget = targetAngle;

    let currentYaw = modelGroup.rotation.z;
    let diff = yawTarget - currentYaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const newYaw = currentYaw + diff * physics.rotationSmooth;
    modelGroup.rotation.z = newYaw;

    if (speed > physics.settleThreshold) {
        const velNormX = velocityX / speed;
        const velNormY = velocityY / speed;
        const perpX = -velNormY;
        const perpY = velNormX;
        const forceX = (targetOX - shipX) * physics.stiffness;
        const forceY = (targetOY - shipY) * physics.stiffness;
        const lateralForce = forceX * perpX + forceY * perpY;
        const targetBank = lateralForce * physics.bankFactor * 0.01;
        const currentBank = modelGroup.rotation.x - baseRotationX;
        const newBank = currentBank + (targetBank - currentBank) * 0.15;
        modelGroup.rotation.x = baseRotationX + newBank;
    } else {
        const currentBank = modelGroup.rotation.x - baseRotationX;
        modelGroup.rotation.x = baseRotationX + currentBank * 0.9;
    }

    if (speed < physics.settleThreshold) {
        idleTime += dt;
        const hoverOffset = Math.sin(idleTime * 0.8 + idlePhaseY) * 3;
        modelGroup.position.y += hoverOffset * 0.1;
        const rock = Math.sin(idleTime * 0.5 + idlePhaseRock) * 0.02;
        modelGroup.rotation.z += rock * 0.3;
        const drift = Math.sin(idleTime * 0.35 + idlePhaseX) * 0.01;
        const currentDrift = modelGroup.rotation.x - baseRotationX;
        modelGroup.rotation.x = baseRotationX + currentDrift + drift * 0.2;
    } else {
        idleTime = 0;
    }
};

// ============================================================================
// ENGINE THRUST ANIMATION
// ============================================================================

/** Thrust animation state */
let thrustAnimActive = false;
let thrustAnimStart = 0;
const THRUST_DURATION = 0.3;

/**
 * Triggers the engine thrust animation (scale pulse).
 */
const triggerThrustAnimation = () => {
    thrustAnimActive = true;
    thrustAnimStart = performance.now() / 1000;
};

/**
 * Updates the thrust animation each frame.
 * @param {number} time - Current time in seconds
 */
const updateThrustAnimation = (time) => {
    if (!thrustAnimActive || !modelGroup || !baseScale) return;

    const elapsed = time - thrustAnimStart;
    if (elapsed > THRUST_DURATION) {
        modelGroup.scale.copy(baseScale);
        thrustAnimActive = false;
        return;
    }

    const t = elapsed / THRUST_DURATION;
    let scaleMod;
    if (t < 0.2) {
        scaleMod = 1 - t * 0.75;
    } else if (t < 0.6) {
        const st = (t - 0.2) / 0.4;
        scaleMod = 0.85 + st * 0.3;
    } else {
        const st = (t - 0.6) / 0.4;
        scaleMod = 1.15 - st * 0.15;
    }

    modelGroup.scale.set(
        baseScale.x * scaleMod,
        baseScale.y * scaleMod,
        baseScale.z * scaleMod
    );
};

// ============================================================================
// RENDER LOOP
// ============================================================================

/** Last frame timestamp for delta time calculation */
let lastFrameTime = 0;

/**
 * Renders one frame: ship physics, rotation, then the ambient environment.
 */
const render = () => {
    if (!scene || !camera || !renderer) return;

    const now = performance.now() / 1000;
    let dt = lastFrameTime ? now - lastFrameTime : 0.016;
    lastFrameTime = now;

    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) dt = 0.016;

    const reducedMotion = gameState.getSetting('reducedMotion');

    // --- Update ship physics (spring-based cursor) ---
    if (!reducedMotion) {
        updateShipPhysics(dt);
    } else {
        const w = window.innerWidth;
        const h = window.innerHeight;
        shipX += (targetX - w / 2 - shipX) * 0.5;
        shipY += (h / 2 - targetY - shipY) * 0.5;
        velocityX = 0;
        velocityY = 0;
    }

    // --- Position the 3D model ---
    if (modelGroup && modelLoaded) {
        modelGroup.position.x = shipX;
        modelGroup.position.y = shipY;
        modelGroup.position.z = 0;

        if (!reducedMotion) {
            const physics = getPhysics();

            // --- Yaw (screen-plane facing): Z-axis ---
            // Top-down view keeps heading on Z so the nose tracks left/right on screen.
            const targetRotationZ = currentHeading + Math.PI;
            const yawDiff = Math.atan2(
                Math.sin(targetRotationZ - currentModelRotationZ),
                Math.cos(targetRotationZ - currentModelRotationZ)
            );
            currentModelRotationZ += yawDiff * 0.7;
            modelGroup.rotation.z = currentModelRotationZ;

            // --- Pitch (nose up/down): X-axis offset from base top-down tilt ---
            currentSmoothedPitch += (targetPitch - currentSmoothedPitch) * 0.15;
            modelGroup.rotation.x = baseRotationX + currentSmoothedPitch;

            // --- Roll (bank into turns): Y-axis ---
            // Driven primarily by turn rate so the craft leans when it yaws.
            // Lateral velocity adds a bit of extra bank during drift.
            const headingDelta = Math.atan2(
                Math.sin(currentHeading - previousHeading),
                Math.cos(currentHeading - previousHeading)
            );
            previousHeading = currentHeading;
            // Convert heading change this frame into a stable turn-rate signal
            const turnRate = dt > 0 ? headingDelta / dt : 0;
            angularVelocity = angularVelocity * 0.7 + turnRate * 0.3;

            const forwardX = Math.cos(currentHeading);
            const forwardY = Math.sin(currentHeading);
            const lateralVel = velocityX * (-forwardY) + velocityY * forwardX;

            // Negative so craft banks into the turn (left turn -> left wing down)
            let targetRoll = -angularVelocity * physics.rollResponse;
            targetRoll -= lateralVel * 0.0025;
            // Clamp to max bank
            if (targetRoll > physics.maxBank) targetRoll = physics.maxBank;
            if (targetRoll < -physics.maxBank) targetRoll = -physics.maxBank;

            currentSmoothedRoll += (targetRoll - currentSmoothedRoll) * physics.rollSmooth;
            modelGroup.rotation.y = currentSmoothedRoll;
        } else {
            updateRotation(dt, now);
        }

        updateThrustAnimation(now);

        if (currentState === 'target' && baseScale && !thrustAnimActive) {
            const targetScale = baseScale.clone().multiplyScalar(1.12);
            modelGroup.scale.lerp(targetScale, 0.1);
        } else if (currentState === 'scanning' && baseScale && !thrustAnimActive) {
            modelGroup.scale.lerp(baseScale, 0.1);
        }
    }

    // --- Update the ambient environment (starfield, asteroids, lasers, events) ---
    ambient.update({
        shipX,
        shipY,
        heading: currentHeading,
        velocityX,
        velocityY,
        dt
    });

    // --- Render the overlay scene ---
    renderer.render(scene, camera);
};

/**
 * Animation loop.
 */
const loop = () => {
    render();
    animId = requestAnimationFrame(loop);
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Updates cursor target position on mousemove.
 * @param {number} x - clientX
 * @param {number} y - clientY
 */
const onMouseMove = (x, y) => {
    targetX = x;
    targetY = y;
    ambient.setMouse(x, y);
    if (!visible) {
        visible = true;
        if (canvas) canvas.style.display = 'block';
    }
};

/**
 * Left click fires a laser (requirement #14). Clicks on portfolio targets are
 * left alone so navigation keeps its existing behaviour — the ship never
 * shoots at content.
 * @param {MouseEvent} e
 */
const onMouseDown = (e) => {
    if (e.button !== 0) return;
    if (currentState !== 'scanning') return;

    ambient.showHint();
    ambient.fire(true);      // Immediate response to the click itself.
    ambient.setFiring(true); // Hold-to-fire continues on a cooldown.
    triggerThrustAnimation();
};

/**
 * Ends hold-to-fire.
 */
const onMouseUp = () => {
    ambient.setFiring(false);
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Sets the cursor state.
 * @param {'scanning'|'target'|'lock'} state
 * @param {string} [label] - Optional label text (kept for API compat)
 */
const setState = (state, label) => {
    currentState = state;

    // Never keep firing while hovering a portfolio target.
    if (state !== 'scanning') {
        ambient.setFiring(false);
    }

    if (canvas) {
        canvas.setAttribute('data-cursor-state', state);
    }
};

/**
 * Plays the click lock animation sequence: SCAN → LOCK → ENTER
 * Used by targeting.js when a portfolio target is clicked.
 * @returns {Promise<void>}
 */
const playClickSequence = () => {
    return new Promise((resolve) => {
        const reducedMotion = gameState.getSetting('reducedMotion');
        const duration = reducedMotion ? 150 : 350;

        setState('lock', 'LOCK');
        if (modelGroup && baseScale) {
            modelGroup.scale.set(
                baseScale.x * 0.7,
                baseScale.y * 0.7,
                baseScale.z * 0.7
            );
        }

        setTimeout(() => {
            if (modelGroup && baseScale) {
                modelGroup.scale.set(
                    baseScale.x * 1.4,
                    baseScale.y * 1.4,
                    baseScale.z * 1.4
                );
            }

            setTimeout(() => {
                if (modelGroup && baseScale) {
                    modelGroup.scale.copy(baseScale);
                }
                setState('scanning');
                resolve();
            }, reducedMotion ? 100 : 200);
        }, reducedMotion ? 80 : 150);
    });
};

/**
 * Initializes the 3D cursor system and the ambient environment.
 */
const init = async () => {
    setupScene();

    shipX = 0;
    shipY = 0;
    targetX = window.innerWidth / 2;
    targetY = window.innerHeight / 2;

    await loadModel();

    // Build the ambient layer inside the same overlay scene.
    ambient.init(scene);

    if (canvas) {
        canvas.style.display = 'block';
    }
    visible = true;

    document.addEventListener('mousemove', (e) => {
        onMouseMove(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mousedown', onMouseDown, { passive: true });
    document.addEventListener('mouseup', onMouseUp, { passive: true });

    // Releasing outside the window must not leave the ship firing forever.
    window.addEventListener('blur', onMouseUp);

    document.addEventListener('mouseleave', () => {
        visible = false;
        ambient.setFiring(false);
        if (canvas) canvas.style.display = 'none';
    });

    document.addEventListener('mouseenter', () => {
        visible = true;
        if (canvas) canvas.style.display = 'block';
    });

    if (!animId) {
        lastFrameTime = 0;
        loop();
    }

    document.documentElement.style.cursor = 'none';
    const style = document.createElement('style');
    style.id = 'game-cursor-style';
    style.textContent = `
        html { cursor: none; }
        a, button, input, textarea, select, [role="button"] { cursor: none; }
    `;
    document.head.appendChild(style);

    console.log('[Cursor] 3D spacecraft cursor initialized.');
};

/**
 * Cleans up the cursor system and the ambient environment.
 */
const dispose = () => {
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }

    ambient.dispose();

    if (renderer) {
        renderer.dispose();
        renderer = null;
    }

    if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
    }
    canvas = null;

    scene = null;
    camera = null;
    modelGroup = null;
    modelLoaded = false;
    modelLoading = false;
    baseScale = null;

    const style = document.getElementById('game-cursor-style');
    if (style) style.remove();

    document.documentElement.style.cursor = '';

    window.removeEventListener('resize', handleResize);
    window.removeEventListener('blur', onMouseUp);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
};

export default {
    init,
    dispose,
    setState,
    playClickSequence,
    onMouseMove
};
