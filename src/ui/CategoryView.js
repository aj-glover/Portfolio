/**
 * src/ui/CategoryView.js - Category-level overlay shown when a category planet is selected.
 * Displays category title, description, and a hint to explore the floating 3D projects.
 * Follows the UniverseIntro overlay pattern with GSAP show/hide.
 */

import { gsap } from 'gsap';
import { CATEGORIES } from '../data/projectData.js';

class CategoryView {
    constructor() {
        this.overlay = null;
        this.backButton = null;
        this.onBackCallback = null;
        this._boundOnBack = null;
    }

    /**
     * Builds the category view overlay DOM (called once).
     */
    build() {
        const existing = document.getElementById('category-view');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'category-view';
        overlay.className = 'category-view';

        const content = document.createElement('div');
        content.className = 'category-view-content';

        // Category title
        const title = document.createElement('h2');
        title.className = 'category-view-title';
        title.id = 'category-view-title';

        // Category description
        const description = document.createElement('p');
        description.className = 'category-view-description';
        description.id = 'category-view-description';

        // Hint text
        const hint = document.createElement('p');
        hint.className = 'category-view-hint';
        hint.id = 'category-view-hint';
        hint.textContent = 'Click a floating project to explore its case study';

        // Back button
        const backBtn = document.createElement('button');
        backBtn.className = 'category-view-back';
        backBtn.textContent = '← Back to Universe';

        content.appendChild(title);
        content.appendChild(description);
        content.appendChild(hint);
        content.appendChild(backBtn);

        overlay.appendChild(content);
        document.body.appendChild(overlay);
        overlay.style.display = 'none';

        this.overlay = overlay;
        this.backButton = backBtn;
    }

    /**
     * Shows the category view overlay with category data.
     * @param {string} categoryName - The category key from CATEGORIES.
     */
    show(categoryName) {
        if (!this.overlay) this.build();

        const category = CATEGORIES[categoryName];
        if (!category) {
            console.error(`[CategoryView] Invalid category: ${categoryName}`);
            return;
        }

        const titleEl = document.getElementById('category-view-title');
        const descEl = document.getElementById('category-view-description');
        const hintEl = document.getElementById('category-view-hint');

        if (titleEl) titleEl.textContent = categoryName;
        if (descEl) descEl.textContent = category.description || '';

        // Show hint only if the category has projects
        const hasProjects = (category.projects || []).length > 0;
        if (hintEl) {
            hintEl.style.display = hasProjects ? 'block' : 'none';
        }

        // Apply category color accent
        const colorHex = `#${category.color.toString(16).padStart(6, '0')}`;
        this.overlay.style.setProperty('--category-accent', colorHex);

        this.overlay.style.display = 'flex';
        gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    }

    /**
     * Hides the category view overlay.
     */
    hide() {
        if (!this.overlay) return;
        gsap.to(this.overlay, {
            opacity: 0,
            duration: 0.4,
            onComplete: () => {
                this.overlay.style.display = 'none';
            }
        });
    }

    /**
     * Binds the back button callback.
     * @param {Function} callback - Called when back is clicked.
     */
    setOnBack(callback) {
        this.onBackCallback = callback;
        if (this.backButton) {
            if (this._boundOnBack) {
                this.backButton.removeEventListener('click', this._boundOnBack);
            }
            this._boundOnBack = () => {
                if (this.onBackCallback) this.onBackCallback();
            };
            this.backButton.addEventListener('click', this._boundOnBack);
        }
    }

    /**
     * Cleans up event listeners.
     */
    dispose() {
        if (this.backButton && this._boundOnBack) {
            this.backButton.removeEventListener('click', this._boundOnBack);
        }
    }
}

export default CategoryView;