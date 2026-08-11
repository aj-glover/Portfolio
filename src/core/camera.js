/**
 * src/core/camera.js - Manages the camera state, movement, and transitions using GSAP.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Box3, Sphere, Vector3, Quaternion, Object3D } from 'three';
import gameState from '../systems/gameState.js';

// Register plugins if not already registered in scene.js
gsap.registerPlugin(ScrollTrigger);

/**
 * @type {THREE.Camera} The main camera instance.
 */
let activeCamera;

/**
 * @type {THREE.Object3D} The planet currently being focused on (if any).
 * When set, the render loop keeps the camera pointed at this object's live
 * world-space position so it stays centered despite floating/rotation.
 */
let activeFocusTarget = null;

/**
 * Whether a focus transition (fly-to) is currently in progress.
 * While true, the camera's orientation is controlled by the tween (slerp).
 */
let isFocusTransitioning = false;

/**
 * The active GSAP tween for a focus transition, so it can be killed when a
 * new planet is selected mid-transition.
 * @type {gsap.core.Tween | null}
 */
let focusTween = null;

// Reusable temp objects to avoid per-frame allocations.
const _tmpPlanetPos = new Vector3();
const _tmpLookPos = new Vector3();
const _tmpStartPos = new Vector3();
const _tmpStartQuat = new Quaternion();
const _tmpTargetPos = new Vector3();
const _tmpTargetQuat = new Quaternion();
const _tmpLerpPos = new Vector3();
const _tmpSlerpQuat = new Quaternion();
const _tmpOrientor = new Object3D();

/**
 * @type {THREE.Vector3} The default camera position (universe overview). Increased Z for deep space feel.
 */
const DEFAULT_POSITION = { x: 0, y: 0, z: 12 }; // Universe overview framing for the closer project layout

/**
 * Initializes and returns the camera object, ready for GSAP control.
 * This function should be called after setupScene() has run.
 * @param {THREE.PerspectiveCamera} cameraInstance - The Three.js camera object.
 * @returns {THREE.PerspectiveCamera} The configured camera.
 */
export const initializeCamera = (cameraInstance) => {
    activeCamera = cameraInstance;
    console.log("Camera system initialized.");
    return activeCamera;
};

/**
 * Focuses the camera on a selected category planet with a cinematic fly-to.
 *
 * Both position (lerp) and orientation (quaternion slerp) are interpolated
 * together via a progress proxy, so the camera:
 *   - starts at its current position/orientation,
 *   - smoothly travels through space toward the planet,
 *   - gradually turns toward the planet during the movement (no snapping),
 *   - decelerates as it arrives (power2.inOut),
 *   - settles centered at the final viewing distance (then lookAt-tracks).
 *
 * @param {THREE.Object3D} planet - The selected category planet object.
 * @param {number} [duration=2.0] - Transition duration in seconds.
 */
export const focusCameraOnPlanet = (planet, duration = 2.0) => {
    if (!activeCamera) {
        console.error("Camera not initialized. Call initializeCamera first.");
        return;
    }
    if (!planet) {
        console.warn("focusCameraOnPlanet: no planet provided.");
        return;
    }

    // Use instant transition for reduced motion preference
    const reducedMotion = gameState.getSetting('reducedMotion');
    if (reducedMotion) {
        duration = 0.01; // Near-instant for reduced motion
    }

    // Kill any in-progress focus tween so a new selection smoothly continues
    // from the camera's CURRENT position/orientation (no snap).
    if (focusTween) {
        focusTween.kill();
        focusTween = null;
    }

    // 1. Capture the camera's current position as the start state.
    _tmpStartPos.copy(activeCamera.position);

    // 2. Planet's live world-space position (accounts for floating motion).
    planet.getWorldPosition(_tmpPlanetPos);

    // 3. Planet's bounding sphere -> actual radius (size-agnostic).
    const box = new Box3().setFromObject(planet);
    const sphere = new Sphere();
    box.getBoundingSphere(sphere);
    const radius = Math.max(sphere.radius, 0.0001);

    // 4. Camera distance: pulled back enough that orbiting cards are clearly
    //    visible in front of the planet, not at the camera's near plane.
    //    Increased multiplier for more dramatic zoom effect.
    const distance = radius * 6.0 + 2.0;

    // 5. Approach direction: from the planet toward the camera's current
    //    position, so the camera glides in from wherever it currently is.
    const direction = new Vector3()
        .subVectors(_tmpStartPos, _tmpPlanetPos);
    if (direction.lengthSq() < 0.0001) {
        direction.set(0, 0, 1);
    }
    direction.normalize();

    // 6. Target camera position: just outside the planet along that direction.
    _tmpTargetPos.copy(_tmpPlanetPos).addScaledVector(direction, distance);

    // 7. Mark this planet as the active focus and flag that a transition is
    //    in progress. While transitioning, updateCameraFocus() will NOT call
    //    lookAt — the tween's onUpdate handles both position and orientation.
    activeFocusTarget = planet;
    isFocusTransitioning = true;

    // 8. Cinematic fly-to: tween both position (lerp) and orientation (slerp)
    //    so the camera smoothly turns while traveling, decelerates on arrival,
    //    and settles centered. This creates a dynamic, professional transition.
    const proxy = { t: 0 };
    focusTween = gsap.to(proxy, {
        t: 1,
        duration: duration,
        ease: "power2.inOut",
        onUpdate: () => {
            const t = proxy.t;
            // Position: linear lerp between start and target (easing is in t)
            _tmpLerpPos.lerpVectors(_tmpStartPos, _tmpTargetPos, t);
            activeCamera.position.copy(_tmpLerpPos);
            // Orientation: spherical interpolation for smooth turning
            _tmpSlerpQuat.slerpQuaternions(_tmpStartQuat, _tmpTargetQuat, t);
            activeCamera.quaternion.copy(_tmpSlerpQuat);
        },
        onComplete: () => {
            // Transition finished — switch to continuous tracking so the
            // camera follows the planet's floating motion after arrival.
            isFocusTransitioning = false;
            focusTween = null;
        }
    });

    console.log(
        `[Camera] Focusing on planet "${planet.name || ''}" | ` +
        `radius=${radius.toFixed(3)} distance=${distance.toFixed(3)} ` +
        `target=(${_tmpTargetPos.x.toFixed(2)}, ${_tmpTargetPos.y.toFixed(2)}, ${_tmpTargetPos.z.toFixed(2)})`
    );
};

/**
 * Per-frame camera focus update. Call this from the render loop.
 * - While a focus transition is in progress, this does nothing — the GSAP
 *   tween's onUpdate handles both position and orientation.
 * - After the transition completes (or when a focus target is set without a
 *   transition), the camera is re-aimed at the planet's live world-space
 *   position every frame so it stays centered (compensating for floating).
 *
 * @param {THREE.Camera} camera - The current view camera.
 */
export const updateCameraFocus = (camera) => {
    if (!camera) return;
    if (isFocusTransitioning) return;
    if (!activeFocusTarget) return;
    activeFocusTarget.getWorldPosition(_tmpLookPos);
    camera.lookAt(_tmpLookPos);
};

/**
 * Clears any active planet focus so the render loop stops overriding rotation.
 * Also kills any in-progress focus tween.
 */
const clearFocus = () => {
    if (focusTween) {
        focusTween.kill();
        focusTween = null;
    }
    isFocusTransitioning = false;
    activeFocusTarget = null;
};

/**
 * Animates the camera movement using GSAP timelines, crucial for transitions.
 * @param {object} targetObject - The object the camera should focus on (e.g., a project's coordinates).
 * @param {number} duration - Duration of the animation in seconds.
 */
export const animateToTarget = (targetObject, duration = 1.5) => {
    if (!activeCamera) {
        console.error("Camera not initialized. Call initializeCamera first.");
        return;
    }

    // Use instant transition for reduced motion preference
    const reducedMotion = gameState.getSetting('reducedMotion');
    if (reducedMotion) {
        duration = 0.01;
    }

    clearFocus();

    gsap.to(activeCamera.position, {
        x: targetObject.position.x,
        y: targetObject.position.y,
        z: targetObject.position.z - 6,
        duration: duration,
        ease: "power2.inOut"
    });

    gsap.to(activeCamera.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: duration,
        ease: "power2.inOut"
    });

    console.log(`GSAP animation scheduled to move camera toward (${targetObject.position.x}, ${targetObject.position.y}, ${targetObject.position.z}) over ${duration}s.`);
};

/**
 * Animates the camera back to the default universe overview position.
 * @param {number} duration - Duration of the animation in seconds.
 */
export const resetCamera = (duration = 1.5) => {
    if (!activeCamera) {
        console.error("Camera not initialized. Call initializeCamera first.");
        return;
    }

    // Use instant transition for reduced motion preference
    const reducedMotion = gameState.getSetting('reducedMotion');
    if (reducedMotion) {
        duration = 0.01;
    }

    clearFocus();

    gsap.to(activeCamera.position, {
        x: DEFAULT_POSITION.x,
        y: DEFAULT_POSITION.y,
        z: DEFAULT_POSITION.z,
        duration: duration,
        ease: "power2.inOut"
    });

    gsap.to(activeCamera.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: duration,
        ease: "power2.inOut"
    });

    console.log("GSAP animation scheduled to reset camera to universe overview.");
};

export default {
    initializeCamera,
    animateToTarget,
    resetCamera,
    focusCameraOnPlanet,
    updateCameraFocus
};