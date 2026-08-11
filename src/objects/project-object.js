/**
 * src/objects/project-object.js - Defines a reusable, interactive 3D project object in space.
 * Renders a camera-facing textured billboard with title/category label, floating motion,
 * subtle category glow, magnetic hover, and per-category visual identity.
 * Consumes data from projectData.js only.
 */

import {
    Group, Color, PlaneGeometry, MeshBasicMaterial, Mesh, Sprite, SpriteMaterial,
    CanvasTexture, TextureLoader, SRGBColorSpace, DoubleSide, AdditiveBlending, Vector3
} from 'three';
import { gsap } from 'gsap';
import { CATEGORIES } from '../data/projectData.js';
import gameState from '../systems/gameState.js';

const BILLBOARD_WIDTH = 2.5;
const BILLBOARD_HEIGHT = 1.875;
const FLOAT_AMPLITUDE = 0.3;
const FLOAT_SPEED = 0.5;
const GLOW_SCALE = 4;
const GLOW_BASE_OPACITY = 0.25;
const GLOW_HOVER_OPACITY = 0.55;
const LABEL_SCALE = 2.5;
const ANISOTROPY = 4;
const MAGNETIC_STRENGTH = 0.4; // World units of max magnetic drift
const ORBIT_SPEED_BASE = 0.15; // Base speed for orbital drift around category planet

/**
 * Creates a canvas-based card texture for Growth category projects.
 * Renders a polished text card with title, description, and category accent.
 * @param {object} projectData - The project data (title, description, category).
 * @param {number} colorHex - The category accent color.
 * @returns {THREE.CanvasTexture} The card texture.
 */
const createCardTexture = (projectData, colorHex) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 384);
    gradient.addColorStop(0, '#0a0e1a');
    gradient.addColorStop(1, '#141828');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 384);

    // Category-colored border
    const colorStr = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 368);

    // Glow circle
    const cx = 256, cy = 160;
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
    glowGrad.addColorStop(0, colorStr + '60');
    glowGrad.addColorStop(1, colorStr + '00');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 512, 384);

    // Category label
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = colorStr;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(projectData.category.toUpperCase(), 256, 50);

    // Title text (wrapped)
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#ffffff';
    const words = projectData.title.split(' ');
    let lines = [];
    let currentLine = '';
    words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > 440) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) lines.push(currentLine);
    lines.forEach((line, i) => {
        ctx.fillText(line, 256, 120 + i * 36);
    });

    // Description (wrapped, smaller)
    if (projectData.description) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const descWords = projectData.description.split(' ');
        let descLines = [];
        let descLine = '';
        descWords.forEach(word => {
            const testLine = descLine ? descLine + ' ' + word : word;
            if (ctx.measureText(testLine).width > 440) {
                if (descLine) descLines.push(descLine);
                descLine = word;
            } else {
                descLine = testLine;
            }
        });
        if (descLine) descLines.push(descLine);
        // Limit to 3 lines
        descLines.slice(0, 3).forEach((line, i) => {
            ctx.fillText(line, 256, 220 + i * 20);
        });
    }

    // "Case Study" label
    ctx.font = '16px sans-serif';
    ctx.fillStyle = colorStr;
    ctx.fillText('CASE STUDY', 256, 320);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
};

/**
 * Creates a canvas-based placeholder texture for projects without a thumbnail image.
 * Renders the project title and category color on a dark gradient background.
 * @param {string} title - The project title.
 * @param {number} colorHex - The category accent color.
 * @returns {THREE.CanvasTexture} The placeholder texture.
 */
const createPlaceholderTexture = (title, colorHex) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 384);
    gradient.addColorStop(0, '#0a0e1a');
    gradient.addColorStop(1, '#141828');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 384);

    // Category-colored border
    const colorStr = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 368);

    // Glow circle
    const cx = 256, cy = 160;
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
    glowGrad.addColorStop(0, colorStr + '60');
    glowGrad.addColorStop(1, colorStr + '00');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 512, 384);

    // Title text
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Wrap text if long
    const words = title.split(' ');
    let lines = [];
    let currentLine = '';
    words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > 440) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) lines.push(currentLine);
    lines.forEach((line, i) => {
        ctx.fillText(line, 256, 140 + i * 40);
    });

    // "Case Study" label
    ctx.font = '16px sans-serif';
    ctx.fillStyle = colorStr;
    ctx.fillText('CASE STUDY', 256, 320);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
};

/**
 * Creates a radial-gradient canvas texture for the category glow.
 * @param {number} colorHex - The category glow color.
 * @returns {THREE.CanvasTexture} The glow texture.
 */
const createGlowTexture = (colorHex) => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const color = new Color(colorHex);
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
    gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.3)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
};

/**
 * Creates a canvas-based text sprite for the project title/category label.
 * @param {string} title - The project title.
 * @param {string} category - The project category.
 * @param {number} colorHex - The category color for the label accent.
 * @returns {THREE.Sprite} A sprite containing the rendered text.
 */
const createLabelSprite = (title, category, colorHex) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Category label (small, colored)
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.textAlign = 'center';
    ctx.fillText(category.toUpperCase(), canvas.width / 2, 40);

    // Title label (larger, white)
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, canvas.width / 2, 100);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        opacity: 0 // Hidden by default; revealed on hover
    });

    const sprite = new Sprite(material);
    sprite.scale.set(LABEL_SCALE, 1, 1);
    sprite.position.set(0, -2.5, 0);
    return sprite;
};

/**
 * Creates the mesh representation of a project object.
 * @param {object} projectData - Structured data for the project (id, title, category, thumbnail, position).
 * @returns {{mesh: THREE.Mesh, objectContainer: THREE.Group, label: THREE.Sprite, glow: THREE.Sprite, innerGroup: THREE.Group}} The container group.
 */
export const createProjectObject = (projectData, orbitConfig = {}) => {
    const category = CATEGORIES[projectData.category] || { color: 0xffffff, glow: 0xffffff, scale: 1.0 };

    // 1. Load the thumbnail as a texture, or generate a card/placeholder if none exists
    let texture;
    if (projectData.category === 'Growth') {
        // Growth category uses text-based cards instead of image thumbnails
        texture = createCardTexture(projectData, category.color);
    } else if (projectData.thumbnail) {
        const textureLoader = new TextureLoader();
        texture = textureLoader.load(projectData.thumbnail);
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = ANISOTROPY;
    } else {
        texture = createPlaceholderTexture(projectData.title, category.color);
    }

    // 2. Create the camera-facing billboard plane
    const geometry = new PlaneGeometry(BILLBOARD_WIDTH, BILLBOARD_HEIGHT);
    const material = new MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: DoubleSide,
        depthWrite: false
    });
    const mesh = new Mesh(geometry, material);

    // 3. Create the subtle category glow sprite (behind the billboard)
    const glowTexture = createGlowTexture(category.glow);
    const glowMaterial = new SpriteMaterial({
        map: glowTexture,
        transparent: true,
        depthWrite: false,
        opacity: GLOW_BASE_OPACITY,
        blending: AdditiveBlending
    });
    const glow = new Sprite(glowMaterial);
    glow.scale.set(GLOW_SCALE, GLOW_SCALE, 1);
    glow.position.set(0, 0, -0.2); // Behind the billboard

    // 4. Inner group for subtle idle rotation/sway (billboard stays camera-facing via outer container)
    const innerGroup = new Group();
    innerGroup.add(mesh);
    innerGroup.add(glow);

    // 5. Group container to hold the inner group + label (The root object)
    const objectContainer = new Group();
    objectContainer.add(innerGroup);

    // Apply initial position data from the structure directly to the group
    objectContainer.position.set(projectData.position.x || 0, projectData.position.y || 0, projectData.position.z || 0);

    // 6. Add the title/category label sprite
    const label = createLabelSprite(projectData.title, projectData.category, category.color);
    label.position.set(0, -1.5, 0);
    objectContainer.add(label);

    // Store metadata on the container group for traversal
    objectContainer.userData = {
        projectId: projectData.id,
        title: projectData.title,
        category: projectData.category,
        isProject: true
    };

    // Store metadata on the mesh for raycasting (navigation relies on this)
    mesh.userData = {
        projectId: projectData.id,
        title: projectData.title,
        category: projectData.category,
        isProject: true
    };

    // Store per-object animation state & base positions (for bobbing + magnetic pull)
    objectContainer.userData.floatOffset = Math.random() * Math.PI * 2;
    objectContainer.userData.baseY = objectContainer.position.y;
    objectContainer.userData.baseX = objectContainer.position.x;
    objectContainer.userData.baseZ = objectContainer.position.z;
    objectContainer.userData.innerGroup = innerGroup;
    objectContainer.userData.glow = glow;
    objectContainer.userData.label = label;
    objectContainer.userData.baseScale = category.scale || 1.0;

    // Orbital animation state (for floating around the category planet like planets do)
    objectContainer.userData.orbitCenter = orbitConfig.center || { x: 0, y: 0, z: 0 };
    objectContainer.userData.orbitRadius = orbitConfig.radius || 5;
    objectContainer.userData.orbitAngle = orbitConfig.angle || 0;
    objectContainer.userData.orbitSpeed = orbitConfig.speed || (ORBIT_SPEED_BASE + Math.random() * 0.1);
    objectContainer.userData.orbitTilt = orbitConfig.tilt || 0; // vertical tilt for variety
    objectContainer.userData.orbitSwing = orbitConfig.swing || 0.8; // oscillation arc (radians)

    console.log(`[Project Object] Created instance for: ${projectData.title}`);

    return { mesh, objectContainer, label, glow, innerGroup };
};

/**
 * Applies or removes the magnetic hover visual state on a project object.
 * Brightens the glow, scales the container, and reveals the label.
 * @param {THREE.Group} objectContainer - The container group holding the project's 3D model.
 * @param {boolean} active - Whether to apply (true) or remove (false) hover.
 */
export const setHoverActive = (objectContainer, active) => {
    if (!objectContainer) return;

    const glow = objectContainer.userData.glow;
    const label = objectContainer.userData.label;
    const baseScale = objectContainer.userData.baseScale || 1.0;

    if (active) {
        // Brighten the glow
        if (glow && glow.material) {
            gsap.to(glow.material, {
                opacity: GLOW_HOVER_OPACITY,
                duration: 0.3,
                ease: "power2.out",
                overwrite: true // Prevent conflicts with rapid hover changes
            });
        }
        // Reveal the label
        if (label && label.material) {
            gsap.to(label.material, {
                opacity: 1,
                duration: 0.3,
                ease: "power2.out",
                overwrite: true
            });
        }
        // Scale up the container (magnetic feel)
        gsap.to(objectContainer.scale, {
            x: baseScale * 1.15,
            y: baseScale * 1.15,
            z: baseScale * 1.15,
            duration: 0.4,
            ease: "power2.out", // Changed from elastic.out to prevent jank on rapid hover
            overwrite: true,
            force3D: true // Force GPU acceleration for transform
        });
    } else {
        // Dim the glow back to base
        if (glow && glow.material) {
            gsap.to(glow.material, {
                opacity: GLOW_BASE_OPACITY,
                duration: 0.3,
                ease: "power2.out",
                overwrite: true
            });
        }
        // Hide the label
        if (label && label.material) {
            gsap.to(label.material, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.out",
                overwrite: true
            });
        }
        // Scale back down
        gsap.to(objectContainer.scale, {
            x: baseScale,
            y: baseScale,
            z: baseScale,
            duration: 0.4,
            ease: "power2.out",
            overwrite: true,
            force3D: true
        });
    }
};

/**
 * Stores the pointer's normalized position for the magnetic pull effect.
 * The object will gently drift toward the pointer's screen position.
 * @param {THREE.Group} objectContainer - The container group.
 * @param {THREE.Vector2} pointer - Normalized pointer coordinates (-1 to 1).
 * @param {THREE.Camera} camera - The active camera (unused, kept for API symmetry).
 * @param {number} strength - Pull strength (0-1), scales the drift.
 */
export const applyMagneticPull = (objectContainer, pointer, camera, strength = 0.15) => {
    if (!objectContainer || !pointer) return;
    objectContainer.userData.magneticTarget = {
        x: pointer.x * strength,
        y: pointer.y * strength
    };
};

/**
 * Updates the floating animation, rotation, and camera-facing behavior of an object every frame.
 * @param {THREE.Group} objectContainer - The container group holding the project's 3D model.
 * @param {THREE.Camera} camera - The active camera (for billboard facing).
 * @param {number} time - Elapsed time in seconds.
 */
export const updateProjectObject = (objectContainer, camera, time = 0) => {
    // Camera-facing behavior: object always faces the camera
    if (camera) {
        objectContainer.quaternion.copy(camera.quaternion);
    }

    const reducedMotion = gameState.getSetting('reducedMotion');

    // Skip floating animations when reduced motion is preferred
    if (!reducedMotion) {
        const offset = objectContainer.userData.floatOffset || 0;

        // Grid-locked cards: no orbital movement, just subtle floating bobbing
        // at their fixed grid position.
        const baseY = objectContainer.userData.baseY || objectContainer.position.y;
        objectContainer.position.y = baseY + Math.sin(time * FLOAT_SPEED + offset) * FLOAT_AMPLITUDE;

        // Subtle idle rotation/sway on the inner group
        const innerGroup = objectContainer.userData.innerGroup;
        if (innerGroup) {
            innerGroup.rotation.y = Math.sin(time * 0.3 + offset) * 0.05;
            innerGroup.rotation.x = Math.cos(time * 0.25 + offset) * 0.03;
        }
    }

    // Magnetic pull: object drifts gently toward the pointer's screen position
    // Clamp to prevent cards from flying off screen
    const magnetic = objectContainer.userData.magneticTarget;
    if (magnetic && camera) {
        const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);

        const targetX = objectContainer.userData.baseX + (right.x * magnetic.x + up.x * magnetic.y) * MAGNETIC_STRENGTH;
        const targetY = objectContainer.userData.baseY + (right.y * magnetic.x + up.y * magnetic.y) * MAGNETIC_STRENGTH;
        const targetZ = objectContainer.userData.baseZ + (right.z * magnetic.x + up.z * magnetic.y) * MAGNETIC_STRENGTH;

        // Clamp magnetic drift to max 0.5 world units from base position
        const maxDrift = 0.5;
        const clampedX = Math.max(objectContainer.userData.baseX - maxDrift, Math.min(objectContainer.userData.baseX + maxDrift, targetX));
        const clampedY = Math.max(objectContainer.userData.baseY - maxDrift, Math.min(objectContainer.userData.baseY + maxDrift, targetY));
        const clampedZ = Math.max(objectContainer.userData.baseZ - maxDrift, Math.min(objectContainer.userData.baseZ + maxDrift, targetZ));

        objectContainer.position.x += (clampedX - objectContainer.position.x) * 0.05;
        objectContainer.position.y += (clampedY - objectContainer.position.y) * 0.05;
        objectContainer.position.z += (clampedZ - objectContainer.position.z) * 0.05;
    } else {
        // Return to base position when not being pulled
        objectContainer.position.x += (objectContainer.userData.baseX - objectContainer.position.x) * 0.1;
        objectContainer.position.y += (objectContainer.userData.baseY - objectContainer.position.y) * 0.1;
        objectContainer.position.z += (objectContainer.userData.baseZ - objectContainer.position.z) * 0.1;
    }
};

export default {
    createProjectObject,
    updateProjectObject,
    setHoverActive,
    applyMagneticPull
};