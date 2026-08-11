/**
 * src/objects/stars.js - Manages the generation and rendering of the background star field.
 */

import * as THREE from 'three';

let starField;
const STAR_COUNT = 5000;
const MAX_DEPTH = 1000;

/**
 * Creates the Points object representing the background star field.
 * @returns {THREE.Points} The star field Points object (named 'starField' for scene lookup).
 */
export const createStarfield = () => {
    // Return the existing instance if already created (prevent duplicates).
    if (starField) return starField;

    // Create geometry and material for the stars
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < STAR_COUNT; i++) {
        // Position stars randomly in a large cube volume (simulating deep space)
        const x = (Math.random() - 0.5) * MAX_DEPTH * 2;
        const y = (Math.random() - 0.5) * MAX_DEPTH * 2;
        const z = Math.random() * MAX_DEPTH * 2 - MAX_DEPTH; // Bias towards foreground depth for visibility

        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    // Use PointsMaterial for optimal rendering of many small lights/stars
    const material = new THREE.PointsMaterial({
        size: 1,
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
    });

    starField = new THREE.Points(geometry, material);
    starField.name = 'starField'; // Named for lookup via scene.getObjectByName('starField')
    console.log("Starfield created with", STAR_COUNT, "stars.");
    return starField;
};

/**
 * Updates star positions to simulate movement/drift (e.g., parallax or camera motion).
 * This function should be called every frame in the animation loop.
 * @param {THREE.Camera} camera - The current view camera.
 */
export const updateStarfield = (camera) => {
    if (!starField) return;

    // Simple simulation: stars move slightly relative to camera movement or time
    starField.rotation.y += 0.00005; // Slow, constant rotation

    // TODO: Implement more advanced scrolling/parallax based on camera position (camera.position)
};

export default {
    createStarfield,
    updateStarfield
};