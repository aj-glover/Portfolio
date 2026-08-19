/**
 * src/game/ambient/asteroids.js - Pooled drifting asteroids (requirements #2, #3, #13).
 *
 * Replaces the create/dispose-per-asteroid approach with a fixed pool that is
 * built once and recycled forever. Each pooled asteroid clones one of four
 * sculpted boulder models (so they look distinct) but is never freed until
 * teardown.
 *
 * Deliberately carries NO score, health, ammo or progression — destroying one
 * simply schedules a respawn. Asteroids are never linked to portfolio content.
 */

import { Mesh, IcosahedronGeometry, MeshStandardMaterial, Color } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createPool } from './pool.js';

/**
 * Sculpted boulder models (Meshy AI), decimated + meshopt/webp-compressed down
 * from ~220MB combined to ~600KB. Each pool slot clones one of these at random
 * instead of the old per-instance deformed icosahedron.
 */
const MODEL_URLS = [
    'models/boulder-1.glb',
    'models/boulder-2.glb',
    'models/boulder-3.glb',
    'models/boulder-4.glb'
];

/** Destruction resolves in this window (requirement #3: ~200-500ms). */
const FRAGMENT_LIFE = [0.2, 0.5];

/**
 * Asteroid radius in PIXELS.
 *
 * The overlay camera is orthographic sized to the viewport, so 1 world unit is
 * 1 screen pixel and the ship model is normalised to 60px. Radii here are
 * therefore real on-screen sizes (28-76px across) rather than abstract scales.
 */
const RADIUS_RANGE = [14, 38];

/** Drift speed in px/s, before the per-asteroid depth (parallax) multiplier. */
const SPEED_RANGE = [35, 105];

/** Extra px beyond an asteroid's radius that still counts as a laser hit. */
const HIT_TOLERANCE = 10;

/** How far beyond its own radius an asteroid feels the ship (requirement #13). */
const PROXIMITY_MARGIN = 110;


/** Respawn delay after a kill, randomized so it never feels scripted. */
const RESPAWN_DELAY = [400, 1400];

let asteroidPool = null;
let fragmentPool = null;
let sceneRef = null;
let profileRef = null;
let loadingModels = false;

/** Loaded boulder templates: [{ geometry, material }]. Shared across pool instances. */
let boulderTemplates = [];

/** Pending respawn timestamps (performance.now ms). */
let respawnQueue = [];

/**
 * Loads and normalizes the four boulder models. Each geometry is re-centered
 * and scaled so its bounding sphere has radius 1 — matching the old
 * IcosahedronGeometry(1, 1) convention so `mesh.scale.setScalar(radius)` in
 * respawn() still yields a real on-screen radius in pixels.
 * @returns {Promise<Array<{geometry: import('three').BufferGeometry, material: MeshStandardMaterial}>>}
 */
const loadBoulderModels = async () => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const base = import.meta.env.BASE_URL;

    return Promise.all(MODEL_URLS.map((url) => new Promise((resolve, reject) => {
        loader.load(
            `${base}${url}`,
            (gltf) => {
                let mesh = null;
                gltf.scene.traverse((child) => {
                    if (!mesh && child.isMesh) mesh = child;
                });
                if (!mesh) {
                    reject(new Error(`[Asteroids] No mesh found in ${url}`));
                    return;
                }

                const geometry = mesh.geometry;
                geometry.computeBoundingSphere();
                const sphere = geometry.boundingSphere;
                geometry.translate(-sphere.center.x, -sphere.center.y, -sphere.center.z);
                const scale = 1 / (sphere.radius || 1);
                geometry.scale(scale, scale, scale);

                const material = mesh.material;
                material.emissive = new Color(0x66ccff);
                material.emissiveIntensity = 0;

                resolve({ geometry, material });
            },
            undefined,
            reject
        );
    })));
};

/**
 * Positions an asteroid and gives it fresh motion.
 *
 * @param {Mesh} mesh
 * @param {boolean} [insideViewport] - Place it already on screen instead of just
 *   outside an edge. Used only for the initial seed so the environment does not
 *   start empty while the first rocks slowly drift in.
 */
const respawn = (mesh, insideViewport = false) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const d = mesh.userData;

    // Radius is in pixels (1 world unit == 1px in this orthographic overlay).
    const radius = RADIUS_RANGE[0] + Math.random() * (RADIUS_RANGE[1] - RADIUS_RANGE[0]);
    mesh.scale.setScalar(radius);

    let x = 0;
    let y = 0;

    if (insideViewport) {
        // Anywhere on screen, but nudged away from dead centre so the initial
        // rocks do not cluster over the middle of the layout.
        x = (Math.random() - 0.5) * w * 0.85;
        y = (Math.random() - 0.5) * h * 0.85;
    } else {
        const margin = radius + 60;
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: x = (Math.random() - 0.5) * (w + margin * 2); y = -h / 2 - margin; break;
            case 1: x = (Math.random() - 0.5) * (w + margin * 2); y = h / 2 + margin; break;
            case 2: x = -w / 2 - margin; y = (Math.random() - 0.5) * (h + margin * 2); break;
            default: x = w / 2 + margin; y = (Math.random() - 0.5) * (h + margin * 2); break;
        }
    }

    mesh.position.set(x, y, -2 - Math.random() * 3);
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    mesh.visible = true;

    // Head loosely across the viewport so it actually traverses the screen.
    const heading = insideViewport
        ? Math.random() * Math.PI * 2
        : Math.atan2(-y, -x) + (Math.random() - 0.5) * 0.8;

    const speed = (SPEED_RANGE[0] + Math.random() * (SPEED_RANGE[1] - SPEED_RANGE[0]))
        * profileRef.asteroidSpeedScale;

    d.vx = Math.cos(heading) * speed;
    d.vy = Math.sin(heading) * speed;
    d.spin = (Math.random() - 0.5) * 0.5;
    // Doubles as a depth cue: distant rocks drift slower.
    d.parallax = 0.45 + Math.random() * 0.45;
    d.radius = radius;
    d.spinBoost = 1;
    d.highlight = 0;
    mesh.material.emissiveIntensity = 0;
};


/**
 * Creates pools and seeds the initial asteroid population. Boulder models are
 * loaded asynchronously first (requirement: real Meshy AI models replace the
 * old procedural icosahedrons) — asteroids simply stay absent from the scene
 * until that resolves, which given the ~150KB compressed models is fast.
 * @param {import('three').Scene} scene
 * @param {object} profile
 */
export const init = (scene, profile) => {
    if (asteroidPool || loadingModels) return;
    sceneRef = scene;
    profileRef = profile;
    loadingModels = true;

    loadBoulderModels()
        .then((templates) => {
            loadingModels = false;
            if (!sceneRef) return; // dispose() ran while models were loading
            boulderTemplates = templates;
            buildPools(scene, profile);
        })
        .catch((err) => {
            loadingModels = false;
            console.error('[Asteroids] Failed to load boulder models:', err);
        });
};

/**
 * Builds the asteroid + fragment pools once boulder models are loaded.
 * @param {import('three').Scene} scene
 * @param {object} profile
 */
const buildPools = (scene, profile) => {
    asteroidPool = createPool(
        profile.maxAsteroids,
        () => {
            const tpl = boulderTemplates[Math.floor(Math.random() * boulderTemplates.length)];
            const mesh = new Mesh(tpl.geometry, tpl.material.clone());
            mesh.visible = false;
            mesh.userData = {};
            scene.add(mesh);
            return mesh;
        },
        (mesh) => { mesh.visible = false; }
    );

    // Shared geometry for every fragment — they are tiny and identical in shape.
    // Radius is in px, matching the asteroid convention above.
    const fragGeom = new IcosahedronGeometry(5, 0);

    fragmentPool = createPool(
        40,
        () => {
            const mat = new MeshStandardMaterial({
                color: 0x9a8b7a,
                roughness: 0.9,
                metalness: 0.05,
                flatShading: true,
                transparent: true,
                opacity: 0
            });
            const mesh = new Mesh(fragGeom, mat);
            mesh.visible = false;
            mesh.userData = {};
            scene.add(mesh);
            return mesh;
        },
        (mesh) => { mesh.visible = false; mesh.material.opacity = 0; }
    );

    // Seed the first few already on screen so there is something to look at (and
    // shoot) immediately, then stagger the rest in from the edges.
    const seed = Math.min(5, profile.maxAsteroids);
    for (let i = 0; i < seed; i++) {
        const m = asteroidPool.acquire();
        if (m) respawn(m, true);
    }
    for (let i = seed; i < profile.maxAsteroids - 2; i++) {
        respawnQueue.push(performance.now() + 2000 + Math.random() * 12000);
    }

};

/**
 * Emits the small disruption burst described in requirement #3.
 */
const burst = (mesh) => {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        const frag = fragmentPool.acquire();
        if (!frag) break;

        // Scatter within the footprint of the rock that just broke up.
        const spread = mesh.userData.radius * 0.8;
        frag.position.copy(mesh.position);
        frag.position.x += (Math.random() - 0.5) * spread;
        frag.position.y += (Math.random() - 0.5) * spread;
        // Fragment geometry is radius 5px, so this yields ~3-9px chunks —
        // small debris, proportional to the parent, never an explosion.
        frag.scale.setScalar(0.6 + Math.random() * 1.2);
        // Boulder materials are textured with a white base color factor, so
        // copying it would wash fragments out — keep their own rock tint.
        frag.material.opacity = 1;
        frag.visible = true;

        // Fling outward relative to the parent's size so bigger rocks scatter wider.
        const angle = Math.random() * Math.PI * 2;
        const burstSpeed = 60 + Math.random() * 90;
        frag.userData.vx = Math.cos(angle) * burstSpeed;
        frag.userData.vy = Math.sin(angle) * burstSpeed;

        frag.userData.spin = (Math.random() - 0.5) * 6;
        frag.userData.age = 0;
        frag.userData.life = FRAGMENT_LIFE[0] + Math.random() * (FRAGMENT_LIFE[1] - FRAGMENT_LIFE[0]);
    }
};

/**
 * Tests a point against every live asteroid and disrupts the first hit.
 * @param {number} x
 * @param {number} y
 * @returns {boolean} true when something was hit
 */
export const hitTest = (x, y) => {
    if (!asteroidPool) return false;
    let hit = false;

    asteroidPool.forEachActive((mesh) => {
        if (hit || !mesh.visible) return;
        const dx = x - mesh.position.x;
        const dy = y - mesh.position.y;
        // Hitbox tracks the visible radius so shots connect where they look
        // like they should, rather than on an oversized invisible bubble.
        const radius = mesh.userData.radius + HIT_TOLERANCE;
        if (dx * dx + dy * dy < radius * radius) {

            burst(mesh);
            asteroidPool.release(mesh);
            respawnQueue.push(
                performance.now() + RESPAWN_DELAY[0] + Math.random() * (RESPAWN_DELAY[1] - RESPAWN_DELAY[0])
            );
            hit = true;
        }
    });

    return hit;
};

/**
 * Per-frame update: drift, parallax, proximity reaction, fragment decay, respawns.
 * @param {object} ctx - Shared ambient context.
 */
export const update = (ctx) => {
    if (!asteroidPool) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const limitX = w / 2 + 120;
    const limitY = h / 2 + 120;
    const now = performance.now();

    // --- Respawns ---
    if (respawnQueue.length) {
        respawnQueue = respawnQueue.filter((due) => {
            if (due > now) return true;
            const m = asteroidPool.acquire();
            if (m) respawn(m);
            return false;
        });
    }

    // --- Asteroids ---
    asteroidPool.forEachActive((mesh) => {
        const d = mesh.userData;

        // Requirement #13: the ship physically disturbs nearby rocks.
        const ddx = mesh.position.x - ctx.shipX;
        const ddy = mesh.position.y - ctx.shipY;
        const distSq = ddx * ddx + ddy * ddy;
        const reach = d.radius + PROXIMITY_MARGIN;
        const near = distSq < reach * reach;
        const targetBoost = near ? 1.4 : 1;
        const targetHighlight = near ? 0.18 * (1 - Math.sqrt(distSq) / reach) : 0;


        d.spinBoost += (targetBoost - d.spinBoost) * 0.06;
        d.highlight += (targetHighlight - d.highlight) * 0.08;
        mesh.material.emissiveIntensity = d.highlight;

        mesh.position.x += d.vx * d.parallax * ctx.dt;
        mesh.position.y += d.vy * d.parallax * ctx.dt;

        const spin = d.spin * d.spinBoost * ctx.dt;
        mesh.rotation.x += spin;
        mesh.rotation.y += spin * 0.7;
        mesh.rotation.z += spin * 0.3;

        if (Math.abs(mesh.position.x) > limitX || Math.abs(mesh.position.y) > limitY) {
            respawn(mesh); // Recycle in place — no allocation.
        }
    });

    // --- Fragments ---
    fragmentPool.forEachActive((frag) => {
        const d = frag.userData;
        d.age += ctx.dt;
        if (d.age >= d.life) {
            fragmentPool.release(frag);
            return;
        }
        const t = d.age / d.life;
        frag.position.x += d.vx * ctx.dt;
        frag.position.y += d.vy * ctx.dt;
        frag.rotation.z += d.spin * ctx.dt;
        frag.material.opacity = 1 - t;
        frag.scale.multiplyScalar(0.97);
    });
};

/**
 * Frees pools and geometry.
 */
export const dispose = () => {
    if (asteroidPool) {
        // Geometry is shared per boulder template (disposed below, once each);
        // only the per-instance cloned material belongs to this mesh alone.
        asteroidPool.items.forEach((m) => {
            sceneRef?.remove(m);
            m.material.dispose();
        });
    }
    boulderTemplates.forEach((tpl) => {
        tpl.geometry.dispose();
        ['map', 'normalMap', 'metalnessMap', 'roughnessMap', 'aoMap', 'emissiveMap'].forEach((slot) => {
            tpl.material[slot]?.dispose();
        });
        tpl.material.dispose();
    });
    boulderTemplates = [];
    if (fragmentPool) {
        // All fragments share one geometry — dispose it once.
        let sharedGeom = null;
        fragmentPool.items.forEach((m) => {
            sceneRef?.remove(m);
            sharedGeom = m.geometry;
            m.material.dispose();
        });
        sharedGeom?.dispose();
    }
    asteroidPool = null;
    fragmentPool = null;
    respawnQueue = [];
    sceneRef = null;
    loadingModels = false;
};

export default { init, update, hitTest, dispose };
