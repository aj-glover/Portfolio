/**
 * src/ui/PlanetTooltip.js - Floating tooltip shown when hovering over a category planet.
 * Displays the planet's category name and description, following the cursor.
 * Uses GSAP for smooth fade in/out, matching the HUD overlay aesthetic.
 */

import { gsap } from 'gsap';
import { CATEGORIES } from '../data/projectData.js';

class PlanetTooltip {
    constructor() {
        this.el = null;
        this.titleEl = null;
        this.descEl = null;
        this._visible = false;
    }

    /**
     * Builds the tooltip DOM element (called once, lazily).
     */
    build() {
        const existing = document.getElementById('planet-tooltip');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = 'planet-tooltip';
        el.className = 'planet-tooltip';

        const title = document.createElement('div');
        title.className = 'planet-tooltip-title';

        const desc = document.createElement('div');
        desc.className = 'planet-tooltip-description';

        el.appendChild(title);
        el.appendChild(desc);
        document.body.appendChild(el);

        this.el = el;
        this.titleEl = title;
        this.descEl = desc;

        gsap.set(el, { opacity: 0, scale: 0.9 });
    }

    /**
     * Shows the tooltip with category data at the given screen position.
     * @param {string} categoryName - The category key from CATEGORIES.
     * @param {number} x - Screen X (clientX).
     * @param {number} y - Screen Y (clientY).
     */
    show(categoryName, x, y) {
        if (!this.el) this.build();

        const category = CATEGORIES[categoryName];
        if (!category) return;

        this.titleEl.textContent = category.name || categoryName;
        this.descEl.textContent = category.description || '';

        // Apply category color accent
        const colorHex = `#${category.color.toString(16).padStart(6, '0')}`;
        this.el.style.setProperty('--planet-accent', colorHex);

        this._setPosition(x, y);

        if (!this._visible) {
            this._visible = true;
            gsap.to(this.el, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' });
        }
    }

    /**
     * Moves the tooltip to the given screen position.
     * @param {number} x - Screen X (clientX).
     * @param {number} y - Screen Y (clientY).
     */
    move(x, y) {
        if (!this.el) return;
        this._setPosition(x, y);
    }

    /**
     * Hides the tooltip.
     */
    hide() {
        if (!this.el || !this._visible) return;
        this._visible = false;
        gsap.to(this.el, {
            opacity: 0,
            scale: 0.9,
            duration: 0.2,
            ease: 'power2.in'
        });
    }

    /**
     * Positions the tooltip near the cursor, clamped to the viewport.
     * @param {number} x - Screen X (clientX).
     * @param {number} y - Screen Y (clientY).
     */
    _setPosition(x, y) {
        const offset = 16;
        const el = this.el;

        // Default: below and to the right of cursor
        let left = x + offset;
        let top = y + offset;

        // Flip horizontally if overflowing right edge
        const width = el.offsetWidth || 200;
        if (left + width > window.innerWidth - 8) {
            left = x - offset - width;
        }

        // Flip vertically if overflowing bottom edge
        const height = el.offsetHeight || 60;
        if (top + height > window.innerHeight - 8) {
            top = y - offset - height;
        }

        // Clamp minimums
        left = Math.max(8, left);
        top = Math.max(8, top);

        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
    }

    dispose() {
        if (this.el) {
            this.el.remove();
            this.el = null;
            this.titleEl = null;
            this.descEl = null;
        }
    }
}

export default new PlanetTooltip();