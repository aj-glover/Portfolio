/**
 * src/utils/lazyLoad.js - Lazy loading utility for images and media
 * Uses Intersection Observer API for performant on-demand loading
 */

/**
 * Initialize lazy loading for images with data-src attribute
 * Usage: Add data-src to images instead of src, then call initLazyLoad()
 * 
 * Example HTML:
 * <img data-src="path/to/image.jpg" alt="Description" class="lazy-load" />
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.selector - CSS selector for lazy-load elements (default: '.lazy-load')
 * @param {Object} options.observerOptions - IntersectionObserver options
 * @returns {IntersectionObserver} The observer instance
 */
export const initLazyLoad = (options = {}) => {
    const {
        selector = '.lazy-load',
        observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        }
    } = options;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
        console.warn('[LazyLoad] IntersectionObserver not supported, loading all images immediately');
        loadAllImages(selector);
        return null;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadImage(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all lazy-load elements
    document.querySelectorAll(selector).forEach(element => {
        observer.observe(element);
    });

    console.log(`[LazyLoad] Initialized lazy loading for ${document.querySelectorAll(selector).length} elements`);

    return observer;
};

/**
 * Load a single image by moving data-src to src
 * @param {HTMLElement} element - The image element to load
 */
const loadImage = (element) => {
    if (element.dataset.src) {
        if (element.tagName === 'IMG' || element.tagName === 'SOURCE') {
            element.src = element.dataset.src;
        } else {
            // For background images
            element.style.backgroundImage = `url('${element.dataset.src}')`;
        }
        
        // Handle onload event
        if (element.tagName === 'IMG' || element.tagName === 'SOURCE') {
            element.addEventListener('load', () => {
                element.classList.add('lazy-loaded');
                console.log(`[LazyLoad] Image loaded: ${element.dataset.src}`);
            });
            element.addEventListener('error', () => {
                console.warn(`[LazyLoad] Failed to load image: ${element.dataset.src}`);
            });
        } else {
            element.classList.add('lazy-loaded');
        }
        
        delete element.dataset.src;
    }
};

/**
 * Fallback: Load all images immediately (for browsers without IntersectionObserver)
 * @param {string} selector - CSS selector for lazy-load elements
 */
const loadAllImages = (selector) => {
    document.querySelectorAll(selector).forEach(element => {
        loadImage(element);
    });
};

/**
 * Unobserve all elements from an observer
 * @param {IntersectionObserver} observer - The observer instance
 */
export const stopLazyLoad = (observer) => {
    if (observer) {
        observer.disconnect();
        console.log('[LazyLoad] Lazy loading stopped');
    }
};

/**
 * Add new elements to lazy loading after DOM insertion
 * @param {IntersectionObserver} observer - The observer instance
 * @param {string} selector - CSS selector for new elements
 */
export const addLazyLoadElements = (observer, selector = '.lazy-load') => {
    if (!observer) return;
    
    document.querySelectorAll(selector).forEach(element => {
        if (!observer.root || !element.hasAttribute('data-observed')) {
            observer.observe(element);
            element.setAttribute('data-observed', 'true');
        }
    });
};

export default { initLazyLoad, stopLazyLoad, addLazyLoadElements };
