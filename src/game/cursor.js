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
    Group, Box3, Vector3, Mesh, IcosahedronGeometry, MeshStandardMaterial,
    Euler, Quaternion
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import gameState from '../systems/gameState.js';
import ambient from './ambient/index.js';

// ============================================================================
// STATE VARIABLES
// ============================================================================

/** Base X rotation applied once when model loads (in radians) - 103 deg to view from top */
const MODEL_BASE_ROTATION_X = 103 * Math.PI / 180;

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

/**
 * Orientation is driven by quaternions rather than Euler angles so the ship
 * always rotates along the shortest arc and never twitches at the +/-PI seam.
 * currentQuat is what gets rendered; targetQuat is where the ship should point.
 */
const currentQuat = new Quaternion();
const targetQuat = new Quaternion();
const targetEuler = new Euler(0, 0, 0, 'XYZ');

/** Rotation responsiveness (higher = snappier). Used as 1 - exp(-k * dt). */
const ROTATION_RESPONSE = 5.5;

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
    deadZone: 50,
    maxSpeed: 800,
    stiffness: 2.8,
    damping: 1.8,
    maxBank: 0.7,
    maxPitch: 0.28,
    rollResponse: 0.38,
    rollSmooth: 0.12,
};

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

const setupScene = () => {
    if (scene) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    scene = new Scene();

    camera = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
    camera.position.z = 10;

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

    window.addEventListener('resize', handleResize);
};

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
            '/models/cursor.glb',
            (gltf) => {
                modelGroup = gltf.scene;
                modelGroup.name = 'cursor-model';

                const box = new Box3().setFromObject(modelGroup);
                const size = new Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const targetSize = 60;
                const scale = targetSize / maxDim;
                modelGroup.scale.set(scale, scale, scale);
                baseScale = modelGroup.scale.clone();

                const center = new Vector3();
                box.getCenter(center);
                modelGroup.position.set(-center.x * scale, -center.y * scale, 0);

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

                baseRotationX = MODEL_BASE_ROTATION_X;
                modelGroup.rotation.x = baseRotationX;

                // Seed quaternions so frame 1 doesn't slerp from identity.
                currentQuat.copy(modelGroup.quaternion);
                targetQuat.copy(currentQuat);

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
                currentQuat.copy(modelGroup.quaternion);
                targetQuat.copy(currentQuat);
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

const getPhysics = () => {
    const reducedMotion = gameState.getSetting('reducedMotion');
    return reducedMotion ? REDUCED_PHYSICS : PHYSICS;
};

const updateShipPhysics = (dt) => {
    const physics = getPhysics();
    const w = window.innerWidth;
    const h = window.innerHeight;

    const targetOX = targetX - w / 2;
    const targetOY = h / 2 - targetY;

    const dx = targetOX - shipX;
    const dy = targetOY - shipY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < physics.deadZone) {
        velocityX *= Math.pow(1 - physics.damping * dt * 0.1, dt * 60);
        velocityY *= Math.pow(1 - physics.damping * dt * 0.1, dt * 60);
    } else {
        const forceScale = physics.stiffness / distance;
        const fx = dx * forceScale;
        const fy = dy * forceScale;

        velocityX += fx * dt * 60;
        velocityY += fy * dt * 60;

        velocityX -= velocityX * physics.damping * dt;
        velocityY -= velocityY * physics.damping * dt;
    }

    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (speed > physics.maxSpeed) {
        const clamp = physics.maxSpeed / speed;
        velocityX *= clamp;
        velocityY *= clamp;
    }

    shipX += velocityX * dt;
    shipY += velocityY * dt;

    if (distance > 10) {
        currentHeading = Math.atan2(dy, dx);
    }

    if (distance > 10) {
        const normalizedVertDist = Math.min(Math.abs(dy) / (h * 0.4), 1);
        targetPitch = -Math.sign(dy) * normalizedVertDist * physics.maxPitch;
    } else {
        targetPitch = 0;
    }
};

// ============================================================================
// ENGINE THRUST ANIMATION
// ============================================================================

let thrustAnimActive = false;
let thrustAnimStart = 0;
const THRUST_DURATION = 0.3;

const triggerThrustAnimation = () => {
    thrustAnimActive = true;
    thrustAnimStart = performance.now() / 1000;
};

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

let lastFrameTime = 0;

const render = () => {
    if (!scene || !camera || !renderer) return;

    const now = performance.now() / 1000;
    let dt = lastFrameTime ? now - lastFrameTime : 0.016;
    lastFrameTime = now;

    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) dt = 0.016;

    const reducedMotion = gameState.getSetting('reducedMotion');

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

    if (modelGroup && modelLoaded) {
        modelGroup.position.x = shipX;
        modelGroup.position.y = shipY;
        modelGroup.position.z = 0;

        if (!reducedMotion) {
            const physics = getPhysics();

            // Pitch smoothing
            currentSmoothedPitch += (targetPitch - currentSmoothedPitch) * 0.09;

            // Roll / bank from turn rate + lateral drift
            const headingDelta = Math.atan2(
                Math.sin(currentHeading - previousHeading),
                Math.cos(currentHeading - previousHeading)
            );
            previousHeading = currentHeading;
            const turnRate = dt > 0 ? headingDelta / dt : 0;
            angularVelocity = angularVelocity * 0.7 + turnRate * 0.3;

            const forwardX = Math.cos(currentHeading);
            const forwardY = Math.sin(currentHeading);
            const lateralVel = velocityX * (-forwardY) + velocityY * forwardX;

            let targetRoll = -angularVelocity * physics.rollResponse;
            targetRoll -= lateralVel * 0.0025;
            // Keep the bank limited and coherent with the forward motion rather than
            // allowing a floating, free-rotation feel from mixed Euler axes.
            if (targetRoll > physics.maxBank) targetRoll = physics.maxBank;
            if (targetRoll < -physics.maxBank) targetRoll = -physics.maxBank;

            currentSmoothedRoll += (targetRoll - currentSmoothedRoll) * physics.rollSmooth;
        } else {
            // Reduced motion: no vestibular pitch/bank; snap orientation.
            currentSmoothedPitch = 0;
            currentSmoothedRoll = 0;
            previousHeading = currentHeading;
            angularVelocity = 0;
        }

        // Restore the craft to its original visible top-down frame and keep the
        // turn constrained to the ship's own heading instead of a free-floating spin.
        const limitedBank = currentSmoothedRoll * 0.5;
        targetEuler.set(
            baseRotationX + currentSmoothedPitch,
            limitedBank,
            currentHeading + Math.PI,
            'XYZ'
        );
        targetQuat.setFromEuler(targetEuler);

        // Shortest-path: if target is in the opposite hemisphere, negate it
        // so slerp never takes the long way around (>180 deg).
        if (currentQuat.dot(targetQuat) < 0) {
            targetQuat.set(-targetQuat.x, -targetQuat.y, -targetQuat.z, -targetQuat.w);
        }

        const slerpAmount = reducedMotion ? 1 : 1 - Math.exp(-ROTATION_RESPONSE * dt);
        currentQuat.slerp(targetQuat, slerpAmount).normalize();
        modelGroup.quaternion.copy(currentQuat);

        updateThrustAnimation(now);

        if (currentState === 'target' && baseScale && !thrustAnimActive) {
            const targetScale = baseScale.clone().multiplyScalar(1.12);
            modelGroup.scale.lerp(targetScale, 0.1);
        } else if (currentState === 'scanning' && baseScale && !thrustAnimActive) {
            modelGroup.scale.lerp(baseScale, 0.1);
        }
    }

    ambient.update({
        shipX,
        shipY,
        heading: currentHeading,
        velocityX,
        velocityY,
        dt
    });

    renderer.render(scene, camera);
};

const loop = () => {
    render();
    animId = requestAnimationFrame(loop);
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================

const onMouseMove = (x, y) => {
    targetX = x;
    targetY = y;
    ambient.setMouse(x, y);
    if (!visible) {
        visible = true;
        if (canvas) canvas.style.display = 'block';
    }
};

const onMouseDown = (e) => {
    if (e.button !== 0) return;
    if (currentState !== 'scanning') return;

    ambient.showHint();
    ambient.fire(true);
    ambient.setFiring(true);
    triggerThrustAnimation();
};

const onMouseUp = () => {
    ambient.setFiring(false);
};

// ============================================================================
// PUBLIC API
// ============================================================================

const setState = (state, label) => {
    currentState = state;

    if (state !== 'scanning') {
        ambient.setFiring(false);
    }

    if (canvas) {
        canvas.setAttribute('data-cursor-state', state);
    }
};

const playClickSequence = () => {
    return new Promise((resolve) => {
        const reducedMotion = gameState.getSetting('reducedMotion');

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

const init = async () => {
    setupScene();

    shipX = 0;
    shipY = 0;
    targetX = window.innerWidth / 2;
    targetY = window.innerHeight / 2;

    await loadModel();

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

    currentQuat.identity();
    targetQuat.identity();
    currentSmoothedPitch = 0;
    currentSmoothedRoll = 0;
    angularVelocity = 0;
    previousHeading = 0;

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
