/**
 * src/core/scene.js - Scene management: renderer, camera, scene graph, and animation loop.
 */

import {
    Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight,
    Group, Color, Mesh, TorusGeometry, MeshBasicMaterial, Sprite, SpriteMaterial,
    CanvasTexture, AdditiveBlending, Box3, Vector3
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createStarfield, updateStarfield } from '../objects/stars.js';
import { createProjectObject, updateProjectObject } from '../objects/project-object.js';
import { loadAssets } from './loader.js';
import { updateCameraFocus } from './camera.js';
import { CATEGORIES, WORLD_MARKERS, PROJECTS } from '../data/projectData.js';
import gameState from '../systems/gameState.js';

let sceneInstance;
let rendererInstance;
let cameraInstance;
let loadedObjects = [];
let worldMarkers = [];
let categoryPlanets = [];
let categoryProjectObjects = [];
let activeCategoryPlanet = null;
let animationFrameId = null;
let isSceneSetup = false;

// Astronaut state (About section)
let astronautObject = null;
let astronautOrbitGroup = null;
let astronautOrbitAngle = 0;
let astronautOrbitSpeed = 0.4;
let astronautOrbitRadius = 2.2;
let astronautOrbitHeight = 0.8;
let astronautLoaded = false;
let astronautLoading = false;

// Configure DRACO loader for compressed GLB files
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const astronautGltfLoader = new GLTFLoader();
astronautGltfLoader.setDRACOLoader(dracoLoader);
astronautGltfLoader.setMeshoptDecoder(MeshoptDecoder);

export const getScene = () => sceneInstance;
export const getCamera = () => cameraInstance;
export const getRenderer = () => rendererInstance;
export const getLoadedObjects = () => loadedObjects;
export const getWorldMarkers = () => worldMarkers;
export const getCategoryPlanets = () => categoryPlanets;
export const getCategoryProjectObjects = () => categoryProjectObjects;
export const getActiveCategoryPlanet = () => activeCategoryPlanet;
export const isAstronautLoaded = () => astronautLoaded;

/**
 * Sets up the core Three.js environment: scene, camera, renderer, and lights.
 * Must run before initializeEnvironmentObjects().
 */
export const setupScene = () => {
    if (isSceneSetup) return;

    sceneInstance = new Scene();
    sceneInstance.background = null;

    cameraInstance = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    cameraInstance.position.set(0, 0, 12);
    cameraInstance.lookAt(0, 0, 0);

    rendererInstance = new WebGLRenderer({ antialias: true, alpha: true });
    rendererInstance.setSize(window.innerWidth, window.innerHeight);
    rendererInstance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = rendererInstance.domElement;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '0';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);
    onResize();

    const ambientLight = new AmbientLight(0x404040);
    sceneInstance.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 10);
    sceneInstance.add(directionalLight);

    window.addEventListener('resize', onResize);
    isSceneSetup = true;
    console.log("[Scene] Setup complete.");
};

/**
 * Handles window resizing for the active camera and renderer.
 */
const onResize = () => {
    if (!cameraInstance || !rendererInstance) return;
    cameraInstance.aspect = window.innerWidth / window.innerHeight;
    cameraInstance.updateProjectionMatrix();
    rendererInstance.setSize(window.innerWidth, window.innerHeight);
};

/**
 * Creates a subtle glowing ring marker for a category world that has no projects yet.
 */
const createWorldMarker = (markerData) => {
    const category = CATEGORIES[markerData.category] || { color: 0xffffff, glow: 0xffffff };
    const group = new Group();
    group.name = `world-marker-${markerData.category}`;
    group.position.set(markerData.position.x, markerData.position.y, markerData.position.z);

    const ringGeometry = new TorusGeometry(2.2, 0.05, 8, 48);
    const ringMaterial = new MeshBasicMaterial({
        color: category.color,
        transparent: true,
        opacity: 0.5
    });
    const ring = new Mesh(ringGeometry, ringMaterial);
    group.add(ring);

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const ctx = glowCanvas.getContext('2d');
    const color = new Color(category.glow);
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const glowTexture = new CanvasTexture(glowCanvas);
    const glowMaterial = new SpriteMaterial({
        map: glowTexture,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending
    });
    const glow = new Sprite(glowMaterial);
    glow.scale.set(8, 8, 1);
    group.add(glow);

    group.userData = {
        isWorldMarker: true,
        category: markerData.category,
        baseY: markerData.position.y,
        floatOffset: Math.random() * Math.PI * 2
    };

    return group;
};

/**
 * Spawns 3D project objects for a category, orbiting around the category planet.
 */
export const spawnCategoryProjects = (categoryName, planet) => {
    if (!sceneInstance) {
        console.error("[Scene] setupScene() must run before spawnCategoryProjects().");
        return;
    }

    despawnCategoryProjects();

    const category = CATEGORIES[categoryName];
    if (!category) {
        console.error(`[Scene] Invalid category: ${categoryName}`);
        return;
    }

    const projectIds = category.projects || [];
    const projects = PROJECTS.filter(p => projectIds.includes(p.id));
    if (projects.length === 0) {
        console.log(`[Scene] No projects for category: ${categoryName}`);
        return;
    }

    activeCategoryPlanet = planet;

    const planetPos = planet.position;
    const count = projects.length;

    const cols = projectIds.length <= 4 ? 2 : projectIds.length <= 8 ? 3 : 4;
    const cardSpacingX = cols <= 2 ? 2.5 : 2.2;
    const cardSpacingY = 2.0;

    const pendingProjects = projects.map((project, index) => ({
        project,
        index,
        col: index % cols,
        row: Math.floor(index / cols)
    }));
    
    categoryPlanets.forEach(p => {
        if (p.userData.category === categoryName) {
            p.userData.pendingProjects = pendingProjects;
            p.userData.gridConfig = { cols, cardSpacingX, cardSpacingY };
        }
    });

    console.log(`[Scene] Queued ${pendingProjects.length} project objects for category: ${categoryName} (will spawn after camera arrives)`);
};

/**
 * Removes all spawned category project objects from the scene.
 */
export const despawnCategoryProjects = () => {
    if (!sceneInstance) return;

    categoryProjectObjects.forEach(({ objectContainer }) => {
        sceneInstance.remove(objectContainer);
        objectContainer.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            }
        });
    });

    categoryProjectObjects = [];
    activeCategoryPlanet = null;
    console.log("[Scene] Despawned all category project objects.");
};

/**
 * Spawns queued project objects after camera arrives at the planet.
 */
export const spawnQueuedProjects = (categoryName) => {
    if (!sceneInstance) return;
    
    const planet = categoryPlanets.find(p => p.userData.category === categoryName);
    if (!planet || !planet.userData.pendingProjects) return;
    
    const { pendingProjects, gridConfig } = planet.userData;
    const { cols, cardSpacingX, cardSpacingY } = gridConfig;
    const planetPos = planet.position;
    const count = pendingProjects.length;
    
    const camera = getCamera();
    const cameraPos = camera ? camera.position.clone() : new Vector3(0, 0, 12);
    
    const gridCenter = new Vector3().lerpVectors(planetPos, cameraPos, 0.6);
    
    const cameraDir = new Vector3().subVectors(cameraPos, planetPos).normalize();
    const worldUp = new Vector3(0, 1, 0);
    const gridRight = new Vector3().crossVectors(cameraDir, worldUp).normalize();
    const gridUp = new Vector3().crossVectors(gridRight, cameraDir).normalize();
    
    pendingProjects.forEach(({ project, index, col, row }) => {
        const rows = Math.ceil(count / cols);
        
        const offsetX = (col - (cols - 1) / 2) * cardSpacingX;
        const offsetY = ((rows - 1) / 2 - row) * cardSpacingY;
        const x = gridCenter.x + offsetX * gridRight.x + offsetY * gridUp.x;
        const y = gridCenter.y + offsetX * gridRight.y + offsetY * gridUp.y;
        const z = gridCenter.z + offsetX * gridRight.z + offsetY * gridUp.z;
        
        const orbitConfig = {
            center: { x, y, z },
            radius: 0,
            angle: 0,
            speed: 0,
            tilt: 0,
            swing: 0
        };
        
        const { objectContainer, mesh } = createProjectObject(project, orbitConfig);
        objectContainer.position.set(x, y, z);
        objectContainer.userData.baseX = x;
        objectContainer.userData.baseY = y;
        objectContainer.userData.baseZ = z;
        sceneInstance.add(objectContainer);
        categoryProjectObjects.push({ objectContainer, mesh, projectId: project.id });
        console.log(`[Scene] Spawned project object: ${project.title} for category ${categoryName}`);
    });
    
    console.log(`[Scene] Spawned ${categoryProjectObjects.length} project objects for category: ${categoryName}`);
    
    planet.userData.pendingProjects = null;
    planet.userData.gridConfig = null;
};

/**
 * Lazy-loads the astronaut model and attaches it to the About planet with orbital motion.
 */
export const spawnAstronaut = (planet) => {
    if (!sceneInstance) {
        console.error("[Scene] setupScene() must run before spawnAstronaut().");
        return Promise.resolve();
    }
    if (!planet) {
        console.warn("[Scene] spawnAstronaut: no planet provided.");
        return Promise.resolve();
    }

    if (astronautLoaded && astronautObject) {
        attachAstronautToPlanet(planet);
        return Promise.resolve();
    }

    if (astronautLoading) {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (astronautLoaded) {
                    clearInterval(check);
                    attachAstronautToPlanet(planet);
                    resolve();
                }
            }, 100);
        });
    }

    astronautLoading = true;
    console.log("[Scene] Loading astronaut model...");

    return new Promise((resolve) => {
        astronautGltfLoader.load(
            `${import.meta.env.BASE_URL}models/astronaut.glb`,
            (gltf) => {
                astronautObject = gltf.scene;
                astronautObject.name = 'astronaut';
                astronautLoaded = true;
                astronautLoading = false;

                const box = new Box3().setFromObject(astronautObject);
                const size = new Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const targetSize = 0.8;
                const scale = targetSize / maxDim;
                astronautObject.scale.set(scale, scale, scale);

                const center = new Vector3();
                box.getCenter(center);
                astronautObject.position.sub(center);

                attachAstronautToPlanet(planet);
                console.log("[Scene] Astronaut loaded and attached to About planet.");
                resolve();
            },
            (progress) => {
                if (progress.total > 0) {
                    const pct = Math.round((progress.loaded / progress.total) * 100);
                    console.log(`[Scene] Astronaut loading: ${pct}%`);
                }
            },
            (error) => {
                console.error("[Scene] Failed to load astronaut model:", error);
                astronautLoading = false;
                // Show user-facing error for failed model load (L4)
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
                resolve();
            }
        );
    });
};

/**
 * Attaches the loaded astronaut to a planet's orbit group.
 */
const attachAstronautToPlanet = (planet) => {
    if (!astronautObject) return;

    despawnAstronaut();

    astronautOrbitGroup = new Group();
    astronautOrbitGroup.name = 'astronaut-orbit';
    astronautOrbitGroup.add(astronautObject);
    planet.add(astronautOrbitGroup);

    astronautOrbitAngle = 0;
    console.log("[Scene] Astronaut orbit group attached to planet.");
};

/**
 * Removes the astronaut orbit group from the scene.
 */
export const despawnAstronaut = () => {
    if (!astronautOrbitGroup) return;
    const parent = astronautOrbitGroup.parent;
    if (parent) {
        parent.remove(astronautOrbitGroup);
    }
    astronautOrbitGroup = null;
    console.log("[Scene] Astronaut removed from scene.");
};

/**
 * Updates the astronaut's orbital motion around the planet each frame.
 */
const updateAstronaut = (time) => {
    if (!astronautOrbitGroup || !astronautObject) return;

    astronautOrbitAngle += astronautOrbitSpeed * 0.016;

    const x = Math.cos(astronautOrbitAngle) * astronautOrbitRadius;
    const z = Math.sin(astronautOrbitAngle) * astronautOrbitRadius;
    astronautOrbitGroup.position.set(x, astronautOrbitHeight, z);

    astronautObject.rotation.y += 0.01;
    astronautObject.rotation.x = Math.sin(time * 0.5) * 0.1;
};

/**
 * Shows a loading indicator while 3D models are loading (M3).
 */
const showLoadingIndicator = () => {
    const existing = document.getElementById('loading-indicator');
    if (existing) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8); color: #fff;
        font-family: sans-serif; font-size: 14px;
        padding: 16px 24px; border-radius: 8px; z-index: 10001;
        display: flex; align-items: center; gap: 12px;
    `;
    indicator.innerHTML = `
        <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Loading 3D models...</span>
    `;
    
    // Add spin animation
    const style = document.createElement('style');
    style.id = 'loading-indicator-style';
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
};

/**
 * Hides the loading indicator (M3).
 */
const hideLoadingIndicator = () => {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) indicator.remove();
    const style = document.getElementById('loading-indicator-style');
    if (style) style.remove();
};

/**
 * Populates and initializes all persistent background objects AND dynamic foreground projects.
 */
export const initializeEnvironmentObjects = async () => {
    if (!sceneInstance) {
        console.error("[Scene] setupScene() must run before initializeEnvironmentObjects().");
        return;
    }
    console.log("--- Initializing Environment Objects ---");
    
    // Show loading indicator while models load (M3)
    showLoadingIndicator();

    const starFieldObject = getScene().getObjectByName('starField') || createStarfield();
    if (starFieldObject) {
        sceneInstance.add(starFieldObject);
    }

    categoryPlanets = [];
    const assets = await loadAssets();
    
    // Hide loading indicator after models are loaded (M3)
    hideLoadingIndicator();

    Object.entries(CATEGORIES).forEach(([categoryName, category], index) => {
        const modelKey = `planet-${categoryName}`;
        const model = assets[modelKey];

        if (model) {
            const planet = model.clone(true);
            planet.name = `planet-${categoryName}`;

            const angle = (index / Object.keys(CATEGORIES).length) * Math.PI * 2;
            const radius = (category.orbitRadius || 10) * 0.5;
            const yOffset = category.yOffset || 0;
            planet.position.set(
                Math.cos(angle) * radius,
                yOffset,
                Math.sin(angle) * radius
            );

            const TARGET_SIZE = 2.5;
            const box = new Box3().setFromObject(planet);
            const size = new Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const normalizeScale = TARGET_SIZE / maxDim;
            const categoryScale = category.scale || 1.0;
            const scale = normalizeScale * categoryScale;
            planet.scale.set(scale, scale, scale);

            planet.userData = {
                isCategoryPlanet: true,
                category: categoryName,
                description: category.description,
                color: category.color,
                glow: category.glow,
                baseY: yOffset,
                baseScale: scale,
                floatOffset: Math.random() * Math.PI * 2,
                rotationSpeed: 0.002 + Math.random() * 0.001,
                isHovered: false
            };

            planet.traverse((child) => {
                if (child.isMesh) {
                    child.userData.isCategoryPlanet = true;
                    child.userData.category = categoryName;
                }
            });

            sceneInstance.add(planet);
            categoryPlanets.push(planet);
            console.log(`[Planet] Created category planet: ${categoryName} at radius ${radius}`);
        } else {
            console.warn(`[Planet] No model found for category: ${categoryName}`);
        }
    });

    loadedObjects = [];

    worldMarkers = [];
    WORLD_MARKERS.forEach(markerData => {
        const marker = createWorldMarker(markerData);
        sceneInstance.add(marker);
        worldMarkers.push(marker);
    });

    console.log(`[Scene] Universe populated with ${categoryPlanets.length} category planets. Projects will load on category entry.`);
};

/**
 * Updates all environmental and object elements in the scene graph for each frame.
 */
export const updateSceneObjects = (camera) => {
    if (!sceneInstance) return;

    const reducedMotion = gameState.getSetting('reducedMotion');

    const starFieldObject = sceneInstance.getObjectByName('starField');
    if (starFieldObject) {
        updateStarfield(camera);
    }

    const time = performance.now() / 1000;
    loadedObjects.forEach(obj => updateProjectObject(obj.objectContainer, camera, time));

    categoryProjectObjects.forEach(({ objectContainer }) => {
        updateProjectObject(objectContainer, camera, time);
    });

    // Skip floating animations when reduced motion is preferred
    if (!reducedMotion) {
        worldMarkers.forEach(marker => {
            const offset = marker.userData.floatOffset || 0;
            marker.position.y = marker.userData.baseY + Math.sin(time * 0.4 + offset) * 0.2;
            marker.rotation.y += 0.002;
        });

        categoryPlanets.forEach(planet => {
            const offset = planet.userData.floatOffset || 0;
            const baseY = planet.userData.baseY || 0;
            const baseScale = planet.userData.baseScale || 1.0;
            const rotSpeed = planet.userData.rotationSpeed || 0.002;

            planet.position.y = baseY + Math.sin(time * 0.4 + offset) * 0.3;
            planet.rotation.y += rotSpeed;

            if (planet.userData.isHovered) {
                planet.scale.x += (baseScale * 1.15 - planet.scale.x) * 0.1;
                planet.scale.y += (baseScale * 1.15 - planet.scale.y) * 0.1;
                planet.scale.z += (baseScale * 1.15 - planet.scale.z) * 0.1;
            } else {
                planet.scale.x += (baseScale - planet.scale.x) * 0.1;
                planet.scale.y += (baseScale - planet.scale.y) * 0.1;
                planet.scale.z += (baseScale - planet.scale.z) * 0.1;
            }
        });

        updateAstronaut(time);
    }

    updateCameraFocus(camera);
};

/**
 * Starts the requestAnimationFrame render loop.
 */
export const animate = () => {
    if (animationFrameId !== null) return;

    const loop = () => {
        animationFrameId = requestAnimationFrame(loop);
        updateSceneObjects(cameraInstance);
        if (rendererInstance && sceneInstance && cameraInstance) {
            rendererInstance.render(sceneInstance, cameraInstance);
        }
    };
    loop();
};

/**
 * Stops the requestAnimationFrame render loop.
 */
export const stopAnimation = () => {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
};

export default {
    setupScene,
    initializeEnvironmentObjects,
    updateSceneObjects,
    animate,
    stopAnimation,
    getScene,
    getCamera,
    getRenderer,
    getLoadedObjects: () => loadedObjects,
    getWorldMarkers: () => worldMarkers,
    getCategoryPlanets: () => categoryPlanets,
    getCategoryProjectObjects: () => categoryProjectObjects,
    getActiveCategoryPlanet: () => activeCategoryPlanet,
    spawnCategoryProjects,
    despawnCategoryProjects,
    spawnAstronaut,
    despawnAstronaut,
    isAstronautLoaded
};