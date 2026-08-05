import { Cursor } from './cursor';
import { Grid } from './grid';
import { preloadImages } from './utils';
import { initStarfield } from './starfield';

// custom cursor
const cursor = new Cursor(document.querySelector('.cursor'));

const attachCursorInteractions = () => {
    document.querySelectorAll('a, button, .grid__item').forEach(link => {
        link.addEventListener('mouseenter', () => cursor.enter());
        link.addEventListener('mouseleave', () => cursor.leave());
    });
};

const initGrid = () => {
    const gridEl = document.querySelector('.grid');
    if (!gridEl) return;

    const grid = new Grid(gridEl);
    grid.on('mouseEnterItem', itemTitle => cursor.DOM.text.innerHTML = itemTitle);
    grid.on('mouseLeaveItem', () => cursor.DOM.text.innerHTML = '');
    attachCursorInteractions();
};

const runWhenIdle = callback => {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 200 });
    } else {
        setTimeout(callback, 50);
    }
};

// Preload images
preloadImages('.grid__item-img').then(() => {
    document.body.classList.remove('loading');
});

window.addEventListener('load', () => {
    requestAnimationFrame(() => {
        runWhenIdle(initGrid);
        initStarfield();
    });
});