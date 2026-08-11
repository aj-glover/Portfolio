/**
 * src/systems/navigation.js - Handles camera movements, state transitions, and scene navigation logic.
 * Implements the Universe -> Category Planet -> Project -> Detail -> Return flow
 * with magnetic hover and cinematic transitions.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { animateToTarget, resetCamera, focusCameraOnPlanet } from '../core/camera.js';
import { getScene, getCamera, getRenderer, getLoadedObjects, getCategoryPlanets, getCategoryProjectObjects, spawnCategoryProjects, despawnCategoryProjects, spawnQueuedProjects } from '../core/scene.js';
import { PROJECTS, CATEGORIES } from '../data/projectData.js';
import { setHoverActive, applyMagneticPull } from '../objects/project-object.js';
import CaseStudy from '../ui/CaseStudy.js';
import CategoryView from '../ui/CategoryView.js';
import AboutView from '../ui/AboutView.js';
import planetTooltip from '../ui/PlanetTooltip.js';

// Game layer systems
import gameState from './gameState.js';
import cursor from '../game/cursor.js';
import targeting from '../game/targeting.js';
import hud from '../game/hud.js';
import transitions from '../game/transitions.js';
import exploration from '../game/exploration.js';
import achievements from '../game/achievements.js';
import toasts from '../game/toasts.js';
import audio from '../game/audio.js';

class NavigationSystem {
    constructor() {
        this.selectedProjectId = null;
        this.selectedCategory = null;
        this.currentView = 'universe'; // 'universe' | 'category' | 'case-study'
        this.isTransitioning = false;
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.hoveredObject = null;
        this.hoveredPlanet = null;
        this.projectMeshes = [];
        this.planetMeshes = [];
        this.caseStudy = new CaseStudy();
        this.categoryView = new CategoryView();
        this.aboutView = new AboutView();
        this._boundOnPointerMove = null;
        this._boundOnClick = null;
    }

    init() {
        this.caseStudy.build();
        this.caseStudy.setOnReturn(() => this.returnFromCaseStudy());
        this.categoryView.build();
        this.categoryView.setOnBack(() => this.returnToUniverse());
        this.aboutView.build();
        this.aboutView.setOnReturn(() => this.returnToUniverse());
        this.collectProjectMeshes();
        this.collectPlanetMeshes();

        // Wire up achievement toast callback
        achievements.setOnUnlock((achievement) => {
            toasts.showAchievement(achievement);
        });

        this._boundOnPointerMove = this.onPointerMove.bind(this);
        this._boundOnClick = this.onClick.bind(this);

        const renderer = getRenderer();
        if (renderer) {
            renderer.domElement.addEventListener('pointermove', this._boundOnPointerMove);
            renderer.domElement.addEventListener('click', this._boundOnClick);
        }

        console.log("[Navigation] System initialized.");
    }

    collectProjectMeshes() {
        this.projectMeshes = [];
        const scene = getScene();
        if (!scene) return;

        scene.traverse((obj) => {
            if (obj.isMesh && obj.userData && obj.userData.isProject) {
                this.projectMeshes.push(obj);
            }
        });
        console.log(`[Navigation] Collected ${this.projectMeshes.length} project meshes for interaction.`);
    }

    collectPlanetMeshes() {
        this.planetMeshes = [];
        const planets = getCategoryPlanets();
        if (!planets || planets.length === 0) {
            console.warn('[Navigation] No planets available for collection.');
            return;
        }

        planets.forEach(planet => {
            planet.traverse((child) => {
                if (child.isMesh) {
                    this.planetMeshes.push(child);
                }
            });
            // Debug: log planet position (C2)
            console.log(`[Navigation] Planet ${planet.userData.category} at position:`, planet.position.toArray());
        });
        console.log(`[Navigation] Collected ${this.planetMeshes.length} planet meshes from ${planets.length} planets.`);
    }

    onPointerMove(event) {
        const renderer = getRenderer();
        if (!renderer) return;

        const rect = renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, getCamera());

        // Skip planet hover when in category view
        if (this.currentView === 'universe') {
            // Check planet intersections first
            const planetIntersects = this.raycaster.intersectObjects(this.planetMeshes, false);

            // Handle planet hover
            if (planetIntersects.length > 0) {
                const hit = planetIntersects[0].object;

                // Find the parent planet group
                const planetGroup = this._findPlanetGroup(hit);
                if (planetGroup && this.hoveredPlanet !== planetGroup) {
                    // Unhover previous planet
                    if (this.hoveredPlanet) {
                        this.hoveredPlanet.userData.isHovered = false;
                    }
                    // Hover new planet
                    planetGroup.userData.isHovered = true;
                    this.hoveredPlanet = planetGroup;

                    // Show tooltip with category name + description
                    const categoryName = planetGroup.userData.category;
                    planetTooltip.show(categoryName, event.clientX, event.clientY);

                    // Game layer: targeting
                    const category = CATEGORIES[categoryName];
                    const projectCount = category ? (category.projects || []).length : 0;
                    targeting.show({
                        type: 'planet',
                        label: categoryName,
                        subLabel: projectCount > 0 ? `${String(projectCount).padStart(2, '0')} PROJECTS` : 'ENTER ORBIT'
                    });
                    targeting.move(event.clientX, event.clientY);
                } else if (planetGroup && this.hoveredPlanet === planetGroup) {
                    // Same planet — just move the tooltip
                    planetTooltip.move(event.clientX, event.clientY);
                    targeting.move(event.clientX, event.clientY);
                }
                renderer.domElement.style.cursor = 'pointer';
            } else {
                if (this.hoveredPlanet) {
                    this.hoveredPlanet.userData.isHovered = false;
                    this.hoveredPlanet = null;
                }
                planetTooltip.hide();
                targeting.hide();
            }
        }

        // Check project intersections (existing logic)
        const projectIntersects = this.raycaster.intersectObjects(this.projectMeshes, false);

        // Handle project hover (existing logic)
        if (projectIntersects.length > 0) {
            const hit = projectIntersects[0].object;
            if (this.hoveredObject !== hit) {
                this.setHover(hit, true);
                if (this.hoveredObject) this.setHover(this.hoveredObject, false);
                this.hoveredObject = hit;

                // Game layer: targeting for project
                const projectId = hit.userData.projectId;
                const project = PROJECTS.find(p => p.id === projectId);
                if (project) {
                    targeting.show({
                        type: 'project',
                        label: project.title,
                        subLabel: `${project.category} / ${project.type || 'Case Study'}`
                    });
                    targeting.move(event.clientX, event.clientY);
                }
            } else {
                targeting.move(event.clientX, event.clientY);
            }
            renderer.domElement.style.cursor = 'pointer';
        } else {
            if (this.hoveredObject) {
                this.setHover(this.hoveredObject, false);
                this.hoveredObject = null;
            }
            if (this.currentView === 'universe') {
                const planetIntersects = this.raycaster.intersectObjects(this.planetMeshes, false);
                if (planetIntersects.length === 0) {
                    renderer.domElement.style.cursor = 'default';
                    targeting.hide();
                }
            } else {
                renderer.domElement.style.cursor = 'default';
                targeting.hide();
            }
        }

        // Magnetic pull on all project objects
        const camera = getCamera();
        const loadedObjects = getLoadedObjects();
        loadedObjects.forEach(obj => {
            applyMagneticPull(obj.objectContainer, this.pointer, camera, 0.15);
        });

        // Magnetic pull on category project objects
        const categoryProjects = getCategoryProjectObjects();
        categoryProjects.forEach(({ objectContainer }) => {
            applyMagneticPull(objectContainer, this.pointer, camera, 0.15);
        });
    }

    _findPlanetGroup(mesh) {
        let obj = mesh;
        while (obj) {
            if (obj.userData && obj.userData.isCategoryPlanet) {
                return obj;
            }
            obj = obj.parent;
        }
        return null;
    }

    setHover(mesh, active) {
        // mesh -> innerGroup -> objectContainer
        const container = mesh.parent ? mesh.parent.parent : null;
        if (container && container.userData && container.userData.isProject) {
            setHoverActive(container, active);
        }
    }

    onClick(event) {
        if (this.isTransitioning) return;

        const renderer = getRenderer();
        if (!renderer) return;

        const rect = renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, getCamera());

        // Only check planet clicks when in universe view
        if (this.currentView === 'universe') {
            const planetIntersects = this.raycaster.intersectObjects(this.planetMeshes, false);
            if (planetIntersects.length > 0) {
                const hit = planetIntersects[0].object;
                const planetGroup = this._findPlanetGroup(hit);
                if (planetGroup) {
                    const categoryName = planetGroup.userData.category;
                    this.navigateToCategory(categoryName, planetGroup);
                    return;
                }
            }
        }

        // Then check project intersections (existing logic)
        const projectIntersects = this.raycaster.intersectObjects(this.projectMeshes, false);
        if (projectIntersects.length > 0) {
            const hit = projectIntersects[0].object;
            const projectId = hit.userData.projectId;
            if (projectId) {
                this.navigateToProject(projectId);
            }
        }
    }

    async navigateToCategory(categoryName, planetGroup) {
        const category = CATEGORIES[categoryName];
        if (!category) {
            console.error(`[Navigation] Invalid category: ${categoryName}`);
            return;
        }

        this.selectedCategory = categoryName;
        this.currentView = 'category';
        this.isTransitioning = true;

        // Hide the planet tooltip and targeting once we navigate into a category
        planetTooltip.hide();
        targeting.hide();

        // Game layer: play targeting select + transition
        await targeting.select();
        await transitions.enterSector(categoryName);

        // Game layer: record sector visit (triggers achievement evaluation)
        const isNewSector = exploration.recordSector(categoryName);

        // Game layer: update HUD
        hud.setSector(categoryName);
        hud.showSectorEntry(categoryName);

        // Update sector number based on category order
        const categoryKeys = Object.keys(CATEGORIES);
        const sectorIndex = categoryKeys.indexOf(categoryName);
        if (sectorIndex >= 0) {
            hud.setSectorNumber(sectorIndex + 1);
        }

        // Update object count
        const projectCount = (category.projects || []).length;
        hud.setObjectCount(projectCount);

        console.log(`[Navigation] Selected category planet: ${categoryName}`);

        // About category: special handling — no project cards, show AboutView + astronaut
        if (categoryName === 'About') {
            // Camera flies toward the planet
            focusCameraOnPlanet(planetGroup, 1.2);

            // Show the About overlay (astronaut overlay is shown by AboutView)
            setTimeout(() => {
                this.aboutView.show();
                this.isTransitioning = false;
            }, 1400);
            return;
        }

        // Spawn 3D project objects orbiting the planet
        spawnCategoryProjects(categoryName, planetGroup);

        // Camera flies toward the planet — dynamically calculated from the
        // planet's live world position and bounding radius (size-agnostic).
        focusCameraOnPlanet(planetGroup, 1.2);

        // Show category view overlay + spawn project grid after camera transition
        setTimeout(() => {
            spawnQueuedProjects(categoryName);
            // Re-collect project meshes for raycasting AFTER projects are spawned
            this.collectProjectMeshes();
            this.categoryView.show(categoryName);
            this.isTransitioning = false;
        }, 1400);
    }

    async navigateToProject(projectId) {
        const project = PROJECTS.find(p => p.id === projectId);
        if (!project) {
            console.error(`[Navigation] Invalid Project ID: ${projectId}`);
            return;
        }

        this.selectedProjectId = projectId;
        this.isTransitioning = true;

        // Game layer: play targeting select + transition
        await targeting.select();
        await transitions.openProject();

        // Game layer: record project exploration (triggers achievement evaluation)
        const isNewDiscovery = exploration.recordProject(projectId);

        // Game layer: show discovery toast if new
        if (isNewDiscovery) {
            toasts.showDiscovery('+1 PROJECT DISCOVERED');
        }

        // Game layer: update HUD
        hud.setTarget(project.title);

        // Update exploration progress
        const totalProjects = PROJECTS.length;
        const progress = exploration.getProgress(totalProjects);
        hud.updateExplorationProgress(progress.explored, progress.total);

        // Find the mesh to animate its enlargement
        const mesh = this.projectMeshes.find(m => m.userData.projectId === projectId);
        const container = mesh ? mesh.parent.parent : null;

        // 1. Object enlarges + glow intensifies
        if (container) {
            setHoverActive(container, true);
            gsap.to(container.scale, {
                x: 1.6, y: 1.6, z: 1.6,
                duration: 0.6,
                ease: "power2.in"
            });
        }

        // 2. If we're in category view, we're already zoomed in — no camera fly needed.
        //    Just show the case study immediately. In universe view, fly to the project.
        if (this.currentView === 'category') {
            this.caseStudy.show(project);
            this.currentView = 'case-study';
            this.isTransitioning = false;
        } else {
            // Universe (legacy path): fly camera toward the project
            animateToTarget({
                position: {
                    x: project.position.x,
                    y: project.position.y,
                    z: project.position.z
                }
            }, 1.2);

            setTimeout(() => {
                this.caseStudy.show(project);
                this.currentView = 'case-study';
                this.isTransitioning = false;
            }, 1400);
        }

        console.log(`[Navigation] Navigating to project: ${project.title}`);
    }

    /**
     * Returns from a case study back to the category view (if we came from one)
     * or to the universe view.
     */
    async returnFromCaseStudy() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Game layer: transition
        await transitions.closeProject();

        this.caseStudy.hide();

        if (this.selectedCategory) {
            // Return to category view (3D projects remain)
            this.currentView = 'category';
            hud.setSector(this.selectedCategory);
            this.categoryView.show(this.selectedCategory);
        } else {
            // Return to universe
            this.currentView = 'universe';
            hud.clearSector();
            resetCamera(1.2);
        }

        this.selectedProjectId = null;
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);

        console.log("[Navigation] Returned from case study.");
    }

    async returnToUniverse() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Game layer: transition
        await transitions.returnToUniverse();

        this.caseStudy.hide();
        this.categoryView.hide();
        this.aboutView.hide();

        // Clean up category project objects
        despawnCategoryProjects();
        this.collectProjectMeshes();

        // Game layer: clear HUD
        hud.clearSector();
        hud.setSectorNumber(1);
        hud.setObjectCount(Object.values(CATEGORIES).reduce((sum, cat) => sum + (cat.projects || []).length, 0));

        resetCamera(1.2);

        this.selectedProjectId = null;
        this.selectedCategory = null;
        this.currentView = 'universe';
        setTimeout(() => {
            this.isTransitioning = false;
        }, 1400);

        console.log("[Navigation] Returned to universe overview.");
    }

    dispose() {
        const renderer = getRenderer();
        if (renderer) {
            renderer.domElement.removeEventListener('pointermove', this._boundOnPointerMove);
            renderer.domElement.removeEventListener('click', this._boundOnClick);
        }
        this.caseStudy.dispose();
        this.categoryView.dispose();
        this.aboutView.dispose();
    }
}

// Export a singleton instance
export default new NavigationSystem();