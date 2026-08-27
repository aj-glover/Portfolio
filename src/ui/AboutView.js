/**
 * src/ui/AboutView.js - About section overlay shown when the About planet is selected.
 * Displays professional bio, "How I work", "My Orbit", links, and a contact form.
 * Uses Formspree for the contact form submission.
 */

import { gsap } from 'gsap';

const FORMSPREEE_FORM_ID = 'xqpzplde';

/**
 * Builds a section with a heading and body text.
 * @param {string} heading - The section heading.
 * @param {string|HTMLElement} content - Text or element content.
 * @returns {HTMLElement} The section element.
 */
const buildSection = (heading, content) => {
    const section = document.createElement('div');
    section.className = 'about-section';

    const h = document.createElement('h2');
    h.className = 'about-section-heading';
    h.textContent = heading;

    section.appendChild(h);

    if (typeof content === 'string') {
        const p = document.createElement('p');
        p.className = 'about-section-text';
        p.textContent = content;
        section.appendChild(p);
    } else {
        section.appendChild(content);
    }

    return section;
};

/**
 * Builds the "How I work" steps section.
 * @returns {HTMLElement} The steps section element.
 */
const buildHowIWork = () => {
    const container = document.createElement('div');
    container.className = 'about-steps';

    const steps = [
        { title: 'Understand the problem.', text: 'I start with the audience, the business objective, and the data.' },
        { title: 'Build the experience.', text: 'I turn insights into strategies, interfaces, content, campaigns, and digital products.' },
        { title: 'Measure what happened.', text: 'Traffic is useful. Rankings are useful. Clicks are useful. But the real question is whether the work produced a meaningful result.' },
        { title: 'Keep improving.', text: 'Digital work isn\'t finished when it launches. The data creates the next opportunity.' }
    ];

    steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'about-step';

        const num = document.createElement('span');
        num.className = 'about-step-num';
        num.textContent = String(index + 1).padStart(2, '0');

        const strong = document.createElement('strong');
        strong.className = 'about-step-title';
        strong.textContent = step.title;

        const text = document.createElement('p');
        text.className = 'about-step-text';
        text.textContent = step.text;

        stepEl.appendChild(num);
        stepEl.appendChild(strong);
        stepEl.appendChild(text);
        container.appendChild(stepEl);
    });

    return container;
};

/**
 * Builds the "My Orbit" disciplines section.
 * @returns {HTMLElement} The orbit section element.
 */
const buildMyOrbit = () => {
    const container = document.createElement('div');
    container.className = 'about-orbit';

    const disciplines = [
        { title: 'Strategy', items: 'Marketing · Growth · Campaigns · Positioning' },
        { title: 'Discovery', items: 'SEO · Search Intent · Analytics · Research' },
        { title: 'Experience', items: 'UX · Information Architecture · Wireframing · Prototyping' },
        { title: 'Technology', items: 'WordPress · Figma · GA4 · Google Ads · Tag Manager · AI' },
        { title: 'Creative', items: 'Creative Direction · Photography · Video · Content' }
    ];

    disciplines.forEach(discipline => {
        const card = document.createElement('div');
        card.className = 'about-orbit-card';

        const h = document.createElement('h3');
        h.className = 'about-orbit-title';
        h.textContent = discipline.title;

        const p = document.createElement('p');
        p.className = 'about-orbit-items';
        p.textContent = discipline.items;

        card.appendChild(h);
        card.appendChild(p);
        container.appendChild(card);
    });

    return container;
};

/**
 * Builds the links section (LinkedIn, portfolio, resume).
 * @returns {HTMLElement} The links section element.
 */
const buildLinks = () => {
    const container = document.createElement('div');
    container.className = 'about-links';

    const links = [
        { label: 'View LinkedIn Profile', url: 'https://www.linkedin.com/in/gloveraj/', icon: 'in' },
        { label: 'Visit Portfolio Website', url: 'https://aj-glover.github.io/', icon: '' },
        { label: 'Download Resume (PDF)', url: '/Anthony_Glover_Marketing_Resume.pdf', icon: '↓' }
    ];

    links.forEach(link => {
        const a = document.createElement('a');
        a.className = 'about-link';
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const icon = document.createElement('span');
        icon.className = 'about-link-icon';
        icon.textContent = link.icon;

        const label = document.createElement('span');
        label.className = 'about-link-label';
        label.textContent = link.label;

        a.appendChild(icon);
        a.appendChild(label);
        container.appendChild(a);
    });

    return container;
};

/**
 * Builds the contact form.
 * @returns {HTMLElement} The form element.
 */
const buildContactForm = () => {
    const form = document.createElement('form');
    form.id = 'about-contact-form';
    form.className = 'about-form';

    // Success message container
    const success = document.createElement('div');
    success.className = 'about-form-success';
    success.setAttribute('data-fs-success', '');
    success.textContent = 'Transmission received. I\'ll be in touch soon.';

    // Name field
    const nameField = document.createElement('div');
    nameField.className = 'about-form-field';
    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'about-name';
    nameLabel.textContent = 'Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'about-name';
    nameInput.name = 'name';
    nameInput.required = true;
    nameInput.placeholder = 'Your name';
    nameInput.setAttribute('data-fs-field', '');
    const nameError = document.createElement('span');
    nameError.className = 'about-form-error';
    nameError.setAttribute('data-fs-error', 'name');
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);
    nameField.appendChild(nameError);

    // Email field
    const emailField = document.createElement('div');
    emailField.className = 'about-form-field';
    const emailLabel = document.createElement('label');
    emailLabel.htmlFor = 'about-email';
    emailLabel.textContent = 'Email';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'about-email';
    emailInput.name = 'email';
    emailInput.required = true;
    emailInput.placeholder = 'you@example.com';
    emailInput.setAttribute('data-fs-field', '');
    const emailError = document.createElement('span');
    emailError.className = 'about-form-error';
    emailError.setAttribute('data-fs-error', 'email');
    emailField.appendChild(emailLabel);
    emailField.appendChild(emailInput);
    emailField.appendChild(emailError);

    // Subject dropdown field
    const subjectField = document.createElement('div');
    subjectField.className = 'about-form-field';
    const subjectLabel = document.createElement('label');
    subjectLabel.htmlFor = 'about-subject';
    subjectLabel.textContent = 'What can I help with?';
    const subjectSelect = document.createElement('select');
    subjectSelect.id = 'about-subject';
    subjectSelect.name = 'subject';
    subjectSelect.required = true;
    subjectSelect.setAttribute('data-fs-field', '');
    const options = [
        'Full-time opportunity',
        'Freelance / consulting',
        'Marketing project',
        'UX / digital product',
        'Creative project',
        'Something else'
    ];
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        subjectSelect.appendChild(opt);
    });
    const subjectError = document.createElement('span');
    subjectError.className = 'about-form-error';
    subjectError.setAttribute('data-fs-error', 'subject');
    subjectField.appendChild(subjectLabel);
    subjectField.appendChild(subjectSelect);
    subjectField.appendChild(subjectError);

    // Message field
    const messageField = document.createElement('div');
    messageField.className = 'about-form-field';
    const messageLabel = document.createElement('label');
    messageLabel.htmlFor = 'about-message';
    messageLabel.textContent = 'Tell me about it.';
    const messageInput = document.createElement('textarea');
    messageInput.id = 'about-message';
    messageInput.name = 'message';
    messageInput.required = true;
    messageInput.rows = 5;
    messageInput.placeholder = 'Share the details of your project or opportunity...';
    messageInput.setAttribute('data-fs-field', '');
    const messageError = document.createElement('span');
    messageError.className = 'about-form-error';
    messageError.setAttribute('data-fs-error', 'message');
    messageField.appendChild(messageLabel);
    messageField.appendChild(messageInput);
    messageField.appendChild(messageError);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'about-form-submit';
    submitBtn.setAttribute('data-fs-submit-btn', '');
    submitBtn.textContent = 'SEND TRANSMISSION →';

    form.appendChild(success);
    form.appendChild(nameField);
    form.appendChild(emailField);
    form.appendChild(subjectField);
    form.appendChild(messageField);
    form.appendChild(submitBtn);

    return form;
};

/**
 * AboutView component - manages the About overlay DOM and rendering.
 */
class AboutView {
    constructor() {
        this.overlay = null;
        this.returnButton = null;
        this._boundOnReturn = null;
        this.onReturnCallback = null;
        this.formInitialized = false;
    }

    /**
     * Builds the About overlay DOM structure (called once).
     */
    build() {
        // Remove any existing overlay to avoid duplicates on re-init
        const existing = document.getElementById('about-view');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'about-view';
        overlay.className = 'about-view';
        overlay.style.display = 'none';

        // --- Content container ---
        const content = document.createElement('div');
        content.className = 'about-content';

        // Header
        const header = document.createElement('header');
        header.className = 'about-header';

        const eyebrow = document.createElement('p');
        eyebrow.className = 'about-eyebrow';
        eyebrow.textContent = 'About';

        const title = document.createElement('h2');
        title.className = 'about-title';
        title.textContent = 'I connect creativity, technology, and growth.';

        const intro = document.createElement('p');
        intro.className = 'about-intro';
        intro.textContent = "I'm Anthony Glover — a digital marketing strategist and creative technologist with 15+ years of experience building digital experiences, campaigns, and products.";

        header.appendChild(eyebrow);
        header.appendChild(title);
        header.appendChild(intro);
        content.appendChild(header);

        // Bio paragraphs
        const bio1 = "My work sits at the intersection of marketing strategy, SEO, UX, analytics, technology, and creative direction. I like understanding how the pieces connect — from the first search query a customer makes to the experience they have on a website and the action they ultimately take.";
        const bio2 = "I've worked across organizations, businesses, and independent projects, solving problems that don't always fit neatly into one discipline. Sometimes that means improving organic search performance. Sometimes it's redesigning an experience, building a digital product, developing a campaign, or using data to figure out why something isn't converting.";
        content.appendChild(buildSection('', bio1));
        content.appendChild(buildSection('', bio2));

        // How I work
        content.appendChild(buildSection('How I work', buildHowIWork()));

        // My Orbit
        content.appendChild(buildSection('My Orbit', buildMyOrbit()));

        // Closing statement
        const closing = "I'm interested in the space between disciplines — where creative thinking becomes strategy, strategy becomes technology, and technology creates measurable growth.";
        content.appendChild(buildSection('', closing));

        // Links
        content.appendChild(buildSection('Find me here', buildLinks()));

        // Contact form
        const formSection = document.createElement('div');
        formSection.className = 'about-section';
        const formHeading = document.createElement('h2');
        formHeading.className = 'about-section-heading';
        formHeading.textContent = 'Get in touch';
        formSection.appendChild(formHeading);
        formSection.appendChild(buildContactForm());
        content.appendChild(formSection);

        // --- Return button ---
        const returnBtn = document.createElement('button');
        returnBtn.id = 'about-return';
        returnBtn.className = 'about-return-btn';
        returnBtn.textContent = '← Back to Universe';

        overlay.appendChild(content);
        overlay.appendChild(returnBtn);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.returnButton = returnBtn;

        // Initialize Formspree form
        this._initForm();
    }

    /**
     * Initializes the Formspree form handlers.
     * Uses Basic HTML approach (form action POST) — no JS library needed.
     */
    _initForm() {
        if (this.formInitialized) return;
        const form = document.getElementById('about-contact-form');
        if (!form) return;
        // Set form action to Formspree endpoint — no JS library needed
        form.action = `https://formspree.io/f/${FORMSPREEE_FORM_ID}`;
        form.method = 'POST';
        this.formInitialized = true;
        console.log("[AboutView] Contact form initialized (Basic HTML approach).");
    }

    /**
     * Shows the About overlay with a fade-in.
     */
    show() {
        if (!this.overlay) this.build();
        this.overlay.style.display = 'flex';
        // Supplies its own return control; suppress the HUD's touch MAP button.
        document.body.classList.add('has-overlay-back');
        gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    }

    /**
     * Hides the About overlay.
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
            if (this._boundOnReturn) {
                this.returnButton.removeEventListener('click', this._boundOnReturn);
            }
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
    }
}

export default AboutView;