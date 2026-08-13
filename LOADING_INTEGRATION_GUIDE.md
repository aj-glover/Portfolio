/**
 * LOADING SCREEN INTEGRATION GUIDE
 * 
 * This file explains how to use the LoadingManager to track progress
 * throughout your application's startup sequence.
 */

// ============================================================================
// BASIC USAGE
// ============================================================================

// The LoadingManager is automatically initialized and available globally:
// window.loadingManager

// Update progress:
window.loadingManager.setProgress(10); // Set to 10%
window.loadingManager.setProgress(50); // Set to 50%
window.loadingManager.setProgress(99); // Set to 99% (save 100% for completion)

// Increment progress:
window.loadingManager.incrementProgress(5);  // Add 5% to current progress
window.loadingManager.incrementProgress(10); // Add 10% to current progress

// Complete loading:
window.loadingManager.complete(); // Hide loading screen with fade-out

// ============================================================================
// INTEGRATION PATTERNS
// ============================================================================

/**
 * Pattern 1: Track Discrete Steps
 * Use for loading different asset types/stages
 */
function setupProgressTracking() {
    const steps = [
        { name: 'Initializing', percent: 5 },
        { name: 'Loading Models', percent: 30 },
        { name: 'Loading Textures', percent: 60 },
        { name: 'Setting up Scene', percent: 80 },
        { name: 'Finalizing', percent: 95 }
    ];

    return (stepIndex) => {
        if (stepIndex < steps.length) {
            const step = steps[stepIndex];
            window.loadingManager.setProgress(step.percent);
            console.log(`[Progress] ${step.name}: ${step.percent}%`);
        }
    };
}

/**
 * Pattern 2: Track Asset Loading Progress
 * Use with THREE.js or other asset loaders
 */
function trackAssetLoading(loader) {
    loader.onProgress = (url, itemsLoaded, itemsTotal) => {
        const baseProgress = 20; // Start at 20% after init
        const rangeSize = 60; // Use 60% of remaining for assets
        const assetProgress = (itemsLoaded / itemsTotal) * rangeSize;
        window.loadingManager.setProgress(baseProgress + assetProgress);
    };
}

/**
 * Pattern 3: Track Sequential Async Operations
 * Use for tracking promise-based operations
 */
async function loadApplicationAssets() {
    try {
        // Step 1
        window.loadingManager.setProgress(10);
        await loadConfiguration();

        // Step 2
        window.loadingManager.setProgress(30);
        await loadModels();

        // Step 3
        window.loadingManager.setProgress(60);
        await loadTextures();

        // Step 4
        window.loadingManager.setProgress(85);
        await setupScene();

        // Step 5
        window.loadingManager.setProgress(95);
        await initializeUI();

        // Complete
        window.loadingManager.complete();
    } catch (error) {
        console.error('Loading error:', error);
        // You can choose to complete anyway or show error state
        window.loadingManager.complete();
    }
}

/**
 * Pattern 4: Simulate Loading for Demo
 * Useful for testing UI/UX before real loading data
 */
function simulateLoading() {
    window.loadingManager.simulateProgress();
    
    // Auto-complete after 3 seconds
    setTimeout(() => {
        window.loadingManager.complete();
    }, 3000);
}

// ============================================================================
// REAL-WORLD EXAMPLE WITH THREE.JS
// ============================================================================

/**
 * Example integration with a THREE.js scene initialization
 */
async function initializeThreeJSScene() {
    // Start loading sequence
    window.loadingManager.setProgress(5);

    // Create scene and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.loadingManager.setProgress(15);

    // Load models
    const gltfLoader = new THREE.GLTFLoader();
    
    // Track model loading progress
    gltfLoader.manager.onProgress = (url, loaded, total) => {
        const modelProgress = (loaded / total) * 40; // Models are 40% of loading
        window.loadingManager.setProgress(15 + modelProgress);
    };

    window.loadingManager.setProgress(30);

    // Load all models
    const model = await new Promise((resolve, reject) => {
        gltfLoader.load('model.gltf', resolve, undefined, reject);
    });

    window.loadingManager.setProgress(70);

    // Setup lighting, materials, etc.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    window.loadingManager.setProgress(85);

    // Setup camera position
    camera.position.z = 5;

    window.loadingManager.setProgress(95);

    // Start animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    // Ready to show content
    window.loadingManager.complete();
    animate();
}

// ============================================================================
// ADVANCED: TRACK LOAD TIME FOR PERFORMANCE
// ============================================================================

class PerformanceTracker {
    constructor() {
        this.startTime = Date.now();
        this.milestones = [];
    }

    recordMilestone(name, progressPercent) {
        const elapsed = Date.now() - this.startTime;
        this.milestones.push({
            name,
            progressPercent,
            elapsed
        });
        window.loadingManager.setProgress(progressPercent);
        console.log(`[Perf] ${name}: ${elapsed}ms (${progressPercent}%)`);
    }

    complete() {
        const totalTime = Date.now() - this.startTime;
        console.table(this.milestones);
        console.log(`[Perf] Total load time: ${totalTime}ms`);
        window.loadingManager.complete();
    }
}

// Usage:
// const tracker = new PerformanceTracker();
// tracker.recordMilestone('Config Loaded', 10);
// tracker.recordMilestone('Models Loaded', 50);
// tracker.recordMilestone('Textures Ready', 80);
// tracker.complete();

// ============================================================================
// IMPLEMENTATION CHECKLIST
// ============================================================================

/*
To implement the loading screen in your app:

1. ✓ loading.css is loaded in <head>
2. ✓ loading.js is loaded before index.js
3. ✓ HTML structure for loading screen exists in <body>
4. ✓ LoadingManager is available as window.loadingManager

Next steps:

5. [ ] Find your main app initialization function
6. [ ] Add calls to window.loadingManager.setProgress() at key points
7. [ ] For each loader (THREE.js, textures, etc.):
       - Set up onProgress handlers
       - Calculate progress percentage
       - Call window.loadingManager.setProgress(percent)
8. [ ] When all loading is complete, call window.loadingManager.complete()
9. [ ] Test on slow network (DevTools Network throttling)
10. [ ] Customize loading messages by updating:
        - .loading-title
        - .loading-subtitle
        - .loading-message

Styling customization:
- Edit loading.css to change colors, fonts, animations
- Current color scheme: #66ccff (cyan), #9966ff (purple), #ff6699 (pink)
- Gradient animations: gradientShift, shimmer, pulse
*/

export { setupProgressTracking, trackAssetLoading, loadApplicationAssets, PerformanceTracker };
