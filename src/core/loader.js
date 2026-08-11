/**
 * src/core/loader.js - Utility module for asynchronous asset management (textures, models).
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CATEGORIES, PROJECTS } from '../data/projectData.js';

const assets = {};
let assetsLoaded = false;

// Configure DRACO loader for compressed GLB files
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Loads all planet models and project thumbnails asynchronously.
 * @returns {Promise<object>} The assets object mapping IDs to loaded resources.
 */
export const loadAssets = async () => {
    if (assetsLoaded) {
        console.log("[Loader] Assets already loaded, returning cached assets.");
        return assets;
    }

    console.log("--- Loading Assets Started ---");

    const textureLoader = new THREE.TextureLoader();

    const promises = [];

    // 1. Load planet models for each category
    Object.entries(CATEGORIES).forEach(([categoryName, category]) => {
        promises.push(new Promise((resolve) => {
            gltfLoader.load(
                category.planetModel,
                (gltf) => {
                    assets[`planet-${categoryName}`] = gltf.scene;
                    console.log(`[Loader] Loaded planet model for: ${categoryName}`);
                    resolve(gltf.scene);
                },
                (progress) => {
                    if (progress.total > 0) {
                        const pct = Math.round((progress.loaded / progress.total) * 100);
                        console.log(`[Loader] ${categoryName}: ${pct}%`);
                    }
                },
                (error) => {
                    console.warn(`[Loader] Failed to load planet model for ${categoryName}:`, error);
                    // Show user-facing error for failed planet model load (L4)
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
                        errorDiv.textContent = 'Some 3D models failed to load. Please refresh the page.';
                        document.body.appendChild(errorDiv);
                        setTimeout(() => errorDiv.remove(), 5000);
                    }
                    resolve(null);
                }
            );
        }));
    });

    // 2. Load project thumbnails (skip projects without a thumbnail — they use generated placeholders)
    PROJECTS.forEach(project => {
        if (!project.thumbnail) {
            console.log(`[Loader] Skipping thumbnail for ${project.id} (no image — placeholder will be used).`);
            return;
        }
        promises.push(new Promise((resolve) => {
            textureLoader.load(
                project.thumbnail,
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    assets[project.id] = texture;
                    resolve(texture);
                },
                undefined,
                () => {
                    console.warn(`[Loader] Failed to load thumbnail for ${project.id}`);
                    resolve(null);
                }
            );
        }));
    });

    await Promise.all(promises);
    assetsLoaded = true;
    console.log(`Asset loading complete (${Object.keys(assets).length} assets preloaded).`);
    return assets;
};