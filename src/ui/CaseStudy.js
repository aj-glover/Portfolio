/**
 * src/ui/CaseStudy.js - Reusable case-study detail view component.
 * Renders a project's full portfolio content in a space-themed overlay.
 * Consumes project data from projectData.js only.
 */

import { gsap } from 'gsap';
import { CATEGORIES } from '../data/projectData.js';
import terminology from '../game/terminology.js';

/**
 * Builds a text section for the case study.
 * @param {string} heading - The section heading.
 * @param {string} text - The section body text.
 * @param {number} accentColor - The category accent color (hex).
 * @returns {HTMLElement} The section element.
 */
const buildSection = (heading, text, accentColor) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = heading;
    h.style.color = `#${accentColor.toString(16).padStart(6, '0')}`;

    const p = document.createElement('p');
    p.textContent = text;

    section.appendChild(h);
    section.appendChild(p);
    return section;
};

/**
 * Builds a list section (role/tools) for the case study.
 * @param {string} heading - The section heading.
 * @param {string[]} items - The list items.
 * @param {number} accentColor - The category accent color (hex).
 * @returns {HTMLElement} The section element.
 */
const buildListSection = (heading, items, accentColor) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = heading;
    h.style.color = `#${accentColor.toString(16).padStart(6, '0')}`;

    const ul = document.createElement('ul');
    ul.className = 'case-study-chips';

    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        li.style.borderColor = `rgba(${(accentColor >> 16) & 255}, ${(accentColor >> 8) & 255}, ${accentColor & 255}, 0.3)`;
        li.style.background = `rgba(${(accentColor >> 16) & 255}, ${(accentColor >> 8) & 255}, ${accentColor & 255}, 0.1)`;
        ul.appendChild(li);
    });

    section.appendChild(h);
    section.appendChild(ul);
    return section;
};

/**
 * Builds the video embed section for the case study.
 * @param {Array<{id: string, title?: string}>} videos - Array of YouTube video objects.
 * @returns {HTMLElement} The video section element.
 */
const buildVideoSection = (videos) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = 'Videos';

    const grid = document.createElement('div');
    grid.className = 'case-study-video-grid';

    videos.forEach(video => {
        const wrapper = document.createElement('div');
        wrapper.className = 'case-study-video';

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${video.id}`;
        iframe.title = video.title || 'Video embed';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

        wrapper.appendChild(iframe);

        if (video.title) {
            const caption = document.createElement('p');
            caption.className = 'case-study-video-title';
            caption.textContent = video.title;
            wrapper.appendChild(caption);
        }

        // Fallback link to open the video on YouTube directly
        const link = document.createElement('a');
        link.className = 'case-study-video-link';
        link.href = `https://www.youtube.com/watch?v=${video.id}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Watch on YouTube ↗';
        wrapper.appendChild(link);

        grid.appendChild(wrapper);
    });

    section.appendChild(h);
    section.appendChild(grid);
    return section;
};

/**
 * Builds an article links section for the case study.
 * @param {Array<{title: string, url: string}>} links - Array of article link objects.
 * @returns {HTMLElement} The links section element.
 */
const buildLinksSection = (links) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = 'Article Links';

    const ul = document.createElement('ul');
    ul.className = 'case-study-links';

    links.forEach(link => {
        const li = document.createElement('li');
        li.className = 'case-study-link-item';

        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = `${link.title} ↗`;

        li.appendChild(a);
        ul.appendChild(li);
    });

    section.appendChild(h);
    section.appendChild(ul);
    return section;
};

/**
 * Builds the gallery section for the case study.
 * @param {string[]} images - Array of image paths.
 * @returns {HTMLElement} The gallery section element.
 */
const buildGallery = (images) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = 'Work';

    const grid = document.createElement('div');
    grid.className = 'case-study-gallery';

    images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.loading = 'lazy'; // Lazy-load gallery images for performance
        img.alt = 'Project work sample';
        grid.appendChild(img);
    });

    section.appendChild(h);
    section.appendChild(grid);
    return section;
};

/**
 * Builds a before/after comparison section for the case study.
 * @param {{before: string, after: string}} beforeAfter - Object with before/after image paths.
 * @returns {HTMLElement} The section element.
 */
const buildBeforeAfterSection = (beforeAfter) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = 'Before / After';

    const grid = document.createElement('div');
    grid.className = 'case-study-before-after';

    const beforeWrap = document.createElement('div');
    beforeWrap.className = 'case-study-ba-item';
    const beforeLabel = document.createElement('span');
    beforeLabel.className = 'case-study-ba-label';
    beforeLabel.textContent = 'Before';
    const beforeImg = document.createElement('img');
    beforeImg.src = beforeAfter.before;
    beforeImg.loading = 'lazy';
    beforeImg.alt = 'Before';
    beforeWrap.appendChild(beforeLabel);
    beforeWrap.appendChild(beforeImg);

    const afterWrap = document.createElement('div');
    afterWrap.className = 'case-study-ba-item';
    const afterLabel = document.createElement('span');
    afterLabel.className = 'case-study-ba-label';
    afterLabel.textContent = 'After';
    const afterImg = document.createElement('img');
    afterImg.src = beforeAfter.after;
    afterImg.loading = 'lazy';
    afterImg.alt = 'After';
    afterWrap.appendChild(afterLabel);
    afterWrap.appendChild(afterImg);

    grid.appendChild(beforeWrap);
    grid.appendChild(afterWrap);

    section.appendChild(h);
    section.appendChild(grid);
    return section;
};

/**
 * Builds a KPI grid section for the case study.
 * @param {Array<{value: string, label: string}>} kpis - Array of KPI objects.
 * @param {number} accentColor - The category accent color (hex).
 * @returns {HTMLElement} The section element.
 */
const buildKpiSection = (kpis, accentColor) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = 'Key Metrics';
    h.style.color = `#${accentColor.toString(16).padStart(6, '0')}`;

    const grid = document.createElement('div');
    grid.className = 'case-study-kpi-grid';

    kpis.forEach(kpi => {
        const card = document.createElement('div');
        card.className = 'case-study-kpi-card';

        const value = document.createElement('span');
        value.className = 'case-study-kpi-value';
        value.textContent = kpi.value;
        value.style.color = `#${accentColor.toString(16).padStart(6, '0')}`;

        const label = document.createElement('span');
        label.className = 'case-study-kpi-label';
        label.textContent = kpi.label;

        card.appendChild(value);
        card.appendChild(label);
        grid.appendChild(card);
    });

    section.appendChild(h);
    section.appendChild(grid);
    return section;
};

/**
 * Builds a card grid section (objectives, skills, lessons) for the case study.
 * @param {string} heading - The section heading.
 * @param {Array<{title: string, text: string}>} items - Array of card objects.
 * @param {number} accentColor - The category accent color (hex).
 * @returns {HTMLElement} The section element.
 */
const buildCardGridSection = (heading, items, accentColor) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = heading;
    h.style.color = `#${accentColor.toString(16).padStart(6, '0')}`;

    const grid = document.createElement('div');
    grid.className = 'case-study-card-grid';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'case-study-card';

        const strong = document.createElement('strong');
        strong.textContent = item.title;

        const br = document.createElement('br');

        const text = document.createElement('span');
        text.textContent = item.text;

        card.appendChild(strong);
        card.appendChild(br);
        card.appendChild(text);
        grid.appendChild(card);
    });

    section.appendChild(h);
    section.appendChild(grid);
    return section;
};

/**
 * Builds a workflow flow section for the case study.
 * @param {Array<{step: number, title: string, text: string}>} steps - Array of workflow steps.
 * @param {number} accentColor - The category accent color (hex).
 * @returns {HTMLElement} The section element.
 */
const buildWorkflowSection = (steps, accentColor) => {
    const section = document.createElement('div');
    section.className = 'case-study-section';

    const h = document.createElement('h2');
    h.textContent = 'Workflow';
    h.style.color = `#${accentColor.toString(16).padStart(6, '0')}`;

    const flow = document.createElement('div');
    flow.className = 'case-study-workflow';

    steps.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.className = 'case-study-workflow-step';

        const num = document.createElement('span');
        num.className = 'case-study-workflow-num';
        num.textContent = step.step;
        num.style.color = `#${accentColor.toString(16).padStart(6, '0')}`;

        const strong = document.createElement('strong');
        strong.textContent = step.title;

        const br = document.createElement('br');

        const text = document.createElement('span');
        text.textContent = step.text;

        stepEl.appendChild(num);
        stepEl.appendChild(strong);
        stepEl.appendChild(br);
        stepEl.appendChild(text);
        flow.appendChild(stepEl);
    });

    section.appendChild(h);
    section.appendChild(flow);
    return section;
};

/**
 * CaseStudy component - manages the detail overlay DOM and rendering.
 */
class CaseStudy {
    constructor() {
        this.overlay = null;
        this.returnButton = null;
        this._boundOnReturn = null;
        this.onReturnCallback = null;
        this.scrollIndicator = null;
    }

    /**
     * Builds the case-study overlay DOM structure (called once).
     */
    build() {
        // Remove any existing overlay to avoid duplicates on re-init
        const existing = document.getElementById('project-detail-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'project-detail-overlay';
        overlay.className = 'case-study-overlay';
        overlay.style.display = 'none';

        // --- Game wrapper header ---
        const gameHeader = document.createElement('div');
        gameHeader.className = 'case-study-game-header';
        gameHeader.innerHTML = `
            <span class="case-study-game-mission-label" id="case-study-mission-label">MISSION</span>
            <span class="case-study-game-mission-num" id="case-study-mission-num"></span>
            <span class="case-study-game-status" id="case-study-game-status">STATUS: COMPLETE</span>
        `;

        // --- Hero section ---
        const hero = document.createElement('div');
        hero.className = 'case-study-hero';

        const heroImg = document.createElement('img');
        heroImg.id = 'project-detail-hero';
        heroImg.className = 'case-study-hero-img';
        heroImg.alt = 'Project hero image';

        const title = document.createElement('h2');
        title.id = 'project-detail-title';
        title.className = 'case-study-title';

        const category = document.createElement('p');
        category.id = 'project-detail-category';
        category.className = 'case-study-category';

        const missionType = document.createElement('p');
        missionType.id = 'project-detail-mission-type';
        missionType.className = 'case-study-mission-type';

        hero.appendChild(heroImg);
        hero.appendChild(title);
        hero.appendChild(category);
        hero.appendChild(missionType);

        // --- Game wrapper footer ---
        const gameFooter = document.createElement('div');
        gameFooter.className = 'case-study-game-footer';
        gameFooter.innerHTML = `
            <span class="case-study-game-footer-text">MISSION COMPLETE</span>
        `;

        // --- Content sections container ---
        const content = document.createElement('div');
        content.id = 'project-detail-content';
        content.className = 'case-study-content';

        // --- Return button ---
        const returnBtn = document.createElement('button');
        returnBtn.id = 'return-to-universe';
        returnBtn.className = 'case-study-return-btn';
        returnBtn.textContent = '← Return to Universe';

        // --- Scroll indicator ---
        const scrollIndicator = document.createElement('div');
        scrollIndicator.className = 'case-study-scroll-indicator';
        scrollIndicator.setAttribute('aria-hidden', 'true');
        scrollIndicator.innerHTML = `
            <div class="case-study-scroll-track">
                <div class="case-study-scroll-thumb"></div>
            </div>
            <span class="case-study-scroll-label">SCROLL</span>
            <div class="case-study-scroll-arrow"></div>
        `;

        overlay.appendChild(gameHeader);
        overlay.appendChild(hero);
        overlay.appendChild(content);
        overlay.appendChild(gameFooter);
        overlay.appendChild(returnBtn);
        overlay.appendChild(scrollIndicator);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.returnButton = returnBtn;
        this.scrollIndicator = scrollIndicator;

        // Add scroll listener to update indicator
        this._boundOnScroll = this._handleScroll.bind(this);
        overlay.addEventListener('scroll', this._boundOnScroll, { passive: true });
    }

    /**
     * Handles scroll events to update the scroll indicator.
     */
    _handleScroll() {
        if (!this.scrollIndicator || !this.overlay) return;
        const { scrollTop, scrollHeight, clientHeight } = this.overlay;
        const scrollPercent = scrollTop / (scrollHeight - clientHeight);
        const thumb = this.scrollIndicator.querySelector('.case-study-scroll-thumb');
        if (thumb) {
            const maxTop = 80 - (80 * 0.2); // track height - thumb height
            thumb.style.top = `${scrollPercent * maxTop}px`;
        }
        // Hide indicator when at bottom
        const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
        if (atBottom) {
            this.scrollIndicator.classList.add('is-hidden');
        } else {
            this.scrollIndicator.classList.remove('is-hidden');
        }
    }

    /**
     * Checks if content is scrollable and updates indicator visibility.
     */
    _checkScrollable() {
        if (!this.overlay || !this.scrollIndicator) return;
        const { scrollHeight, clientHeight } = this.overlay;
        if (scrollHeight > clientHeight + 50) {
            this.scrollIndicator.classList.add('is-visible');
        } else {
            this.scrollIndicator.classList.remove('is-visible');
        }
    }

    /**
     * Renders a project's full case study into the overlay.
     * @param {object} project - The project data object.
     */
    async show(project) {
        if (!this.overlay) this.build();

        const category = CATEGORIES[project.category] || { color: 0x66ccff };
        const accentColor = category.color;

        // Hero (hide if no image available)
        const heroImg = document.getElementById('project-detail-hero');
        if (heroImg) {
            if (project.hero) {
                heroImg.src = project.hero;
                heroImg.style.display = 'block';
            } else {
                heroImg.style.display = 'none';
            }
        }

        const titleEl = document.getElementById('project-detail-title');
        if (titleEl) titleEl.textContent = project.title;

        const categoryEl = document.getElementById('project-detail-category');
        if (categoryEl) {
            categoryEl.textContent = project.category;
            categoryEl.style.color = `#${accentColor.toString(16).padStart(6, '0')}`;
        }

        // Game wrapper: mission number, status, mission type
        const missionLabel = document.getElementById('case-study-mission-label');
        if (missionLabel) {
            missionLabel.textContent = terminology.getGameTerm('Case Study');
        }

        const missionNum = document.getElementById('case-study-mission-num');
        if (missionNum) {
            // Find project index for mission number
            const { PROJECTS } = await import('../data/projectData.js');
            const idx = PROJECTS.findIndex(p => p.id === project.id);
            if (idx >= 0) {
                missionNum.textContent = `${String(idx + 1).padStart(2, '0')} / ${project.title}`;
            }
        }

        const missionTypeEl = document.getElementById('project-detail-mission-type');
        if (missionTypeEl) {
            missionTypeEl.textContent = `MISSION TYPE / ${project.category} / ${project.type || 'Case Study'}`;
        }

        // Content sections
        const content = document.getElementById('project-detail-content');
        if (content) {
            content.innerHTML = '';

            // Overview, Role, Tools, Challenge, Approach, and Results are omitted
            // for Photo projects to keep the case study focused on the imagery.
            if (project.category !== 'Photo') {
                // Overview
                if (project.description) {
                    content.appendChild(buildSection('Overview', project.description, accentColor));
                }

                // Role
                if (project.role && project.role.length) {
                    content.appendChild(buildListSection('Role', project.role, accentColor));
                }

                // Tools
                if (project.tools && project.tools.length) {
                    content.appendChild(buildListSection('Tools', project.tools, accentColor));
                }

                // Challenge
                if (project.challenge) {
                    content.appendChild(buildSection('Challenge', project.challenge, accentColor));
                }

                // Approach (uses `solution` field)
                if (project.solution) {
                    content.appendChild(buildSection('Approach', project.solution, accentColor));
                }

                // Results
                if (project.results) {
                    content.appendChild(buildSection('Results', project.results, accentColor));
                }

                // KPIs
                if (project.kpis && project.kpis.length) {
                    content.appendChild(buildKpiSection(project.kpis, accentColor));
                }

                // Objectives
                if (project.objectives && project.objectives.length) {
                    content.appendChild(buildCardGridSection('Objectives', project.objectives, accentColor));
                }

                // Workflow
                if (project.workflow && project.workflow.length) {
                    content.appendChild(buildWorkflowSection(project.workflow, accentColor));
                }

                // Skills
                if (project.skills && project.skills.length) {
                    content.appendChild(buildCardGridSection('Skills', project.skills, accentColor));
                }

                // Lessons Learned
                if (project.lessons && project.lessons.length) {
                    content.appendChild(buildCardGridSection('Lessons Learned', project.lessons, accentColor));
                }

                // Before / After
                if (project.beforeAfter && project.beforeAfter.before && project.beforeAfter.after) {
                    content.appendChild(buildBeforeAfterSection(project.beforeAfter));
                }

                // Impact
                if (project.impact) {
                    content.appendChild(buildSection('Project Impact', project.impact, accentColor));
                }

                // Article Links
                if (project.links && project.links.length) {
                    content.appendChild(buildLinksSection(project.links));
                }
            }

            // Videos
            if (project.videos && project.videos.length) {
                content.appendChild(buildVideoSection(project.videos));
            }

            // Gallery / Work
            if (project.gallery && project.gallery.length) {
                content.appendChild(buildGallery(project.gallery));
            }
        }

        // Show overlay with fade-in
        this.overlay.style.display = 'flex';
        // Supplies its own return control; suppress the HUD's touch MAP button.
        document.body.classList.add('has-overlay-back');
        gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });

        // Check if content is scrollable after a short delay
        setTimeout(() => this._checkScrollable(), 100);
    }

    /**
     * Hides the detail view overlay with a fade-out animation.
     */
    hide() {
        if (!this.overlay) return;
        document.body.classList.remove('has-overlay-back');
        gsap.to(this.overlay, {
            opacity: 0,
            duration: 0.4,
            onComplete: () => {
                this.overlay.style.display = 'none';
            }
        });
    }

    /**
     * Binds the return-to-universe callback.
     * @param {Function} callback - Called when the return button is clicked.
     */
    setOnReturn(callback) {
        this.onReturnCallback = callback;
        if (this.returnButton) {
            this.returnButton.removeEventListener('click', this._boundOnReturn);
            this._boundOnReturn = () => {
                if (this.onReturnCallback) this.onReturnCallback();
            };
            this.returnButton.addEventListener('click', this._boundOnReturn);
        }
    }

    /**
     * Cleans up event listeners.
     */
    dispose() {
        if (this.returnButton && this._boundOnReturn) {
            this.returnButton.removeEventListener('click', this._boundOnReturn);
        }
        if (this.overlay && this._boundOnScroll) {
            this.overlay.removeEventListener('scroll', this._boundOnScroll);
        }
    }
}

export default CaseStudy;