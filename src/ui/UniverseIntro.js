/**
 * src/ui/UniverseIntro.js - Dismissible intro overlay that orients visitors.
 * Explains what the universe is, where the work is, and how to enter a project.
 * Consumes PORTFOLIO + CATEGORIES data from projectData.js only.
 */

import { gsap } from 'gsap';
import { PORTFOLIO, CATEGORIES } from '../data/projectData.js';
import terminology from '../game/terminology.js';

/**
 * UniverseIntro component - builds and manages the intro/HUD overlay.
 */
class UniverseIntro {
    constructor() {
        this.overlay = null;
        this.dismissButton = null;
        this._boundOnDismiss = null;
        this.onDismissCallback = null;
    }

    /**
     * Builds the intro overlay DOM (called once).
     */
    build() {
        // Remove any existing overlay to avoid duplicates on re-init
        const existing = document.getElementById('universe-intro');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'universe-intro';
        overlay.className = 'universe-intro';

        // --- Title block ---
        const titleBlock = document.createElement('div');
        titleBlock.className = 'universe-intro-title-block';

        const name = document.createElement('h1');
        name.className = 'universe-intro-name';
        name.textContent = PORTFOLIO.name;

        const tagline = document.createElement('p');
        tagline.className = 'universe-intro-tagline';
        tagline.textContent = PORTFOLIO.tagline;

        const intro = document.createElement('p');
        intro.className = 'universe-intro-text';
        intro.textContent = PORTFOLIO.intro;

        titleBlock.appendChild(name);
        titleBlock.appendChild(tagline);
        titleBlock.appendChild(intro);

        // --- Category legend ---
        const legend = document.createElement('div');
        legend.className = 'universe-intro-legend';

        const legendLabel = document.createElement('p');
        legendLabel.className = 'universe-intro-legend-label';
        legendLabel.textContent = PORTFOLIO.categoriesLabel;

        const chips = document.createElement('div');
        chips.className = 'universe-intro-chips';

        Object.entries(CATEGORIES).forEach(([catName, catData]) => {
            const chip = document.createElement('span');
            chip.className = 'universe-intro-chip';
            chip.textContent = catName;
            chip.style.borderColor = `#${catData.color.toString(16).padStart(6, '0')}`;
            chip.style.color = `#${catData.color.toString(16).padStart(6, '0')}`;
            if (catData.placeholder) {
                chip.classList.add('is-placeholder');
                chip.title = 'Coming soon';
            }
            chips.appendChild(chip);
        });

        legend.appendChild(legendLabel);
        legend.appendChild(chips);

        // --- Hint + dismiss ---
        const hint = document.createElement('p');
        hint.className = 'universe-intro-hint';
        hint.textContent = terminology.getProjectHint();

        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'universe-intro-dismiss';
        dismissBtn.textContent = 'Enter Universe';

        overlay.appendChild(titleBlock);
        overlay.appendChild(legend);
        overlay.appendChild(hint);
        overlay.appendChild(dismissBtn);

        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.dismissButton = dismissBtn;
    }

    /**
     * Shows the intro overlay with a fade-in.
     */
    show() {
        if (!this.overlay) this.build();
        this.overlay.style.display = 'flex';
        gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    }

    /**
     * Dismisses the intro overlay with a fade-out.
     */
    dismiss() {
        if (!this.overlay) return;
        gsap.to(this.overlay, {
            opacity: 0,
            duration: 0.4,
            onComplete: () => {
                this.overlay.style.display = 'none';
                if (this.onDismissCallback) this.onDismissCallback();
            }
        });
    }

    /**
     * Binds the dismiss callback.
     * @param {Function} callback - Called after the intro is dismissed.
     */
    setOnDismiss(callback) {
        this.onDismissCallback = callback;
        if (this.dismissButton) {
            this.dismissButton.removeEventListener('click', this._boundOnDismiss);
            this._boundOnDismiss = () => this.dismiss();
            this.dismissButton.addEventListener('click', this._boundOnDismiss);
        }
    }

    /**
     * Cleans up event listeners.
     */
    dispose() {
        if (this.dismissButton && this._boundOnDismiss) {
            this.dismissButton.removeEventListener('click', this._boundOnDismiss);
        }
    }
}

export default UniverseIntro;