/**
 * src/game/ambient/pool.js - Generic fixed-size object pool.
 *
 * Requirement #18: nothing in the ambient layer may allocate or dispose
 * Three.js objects during the frame loop. Every pool pre-builds its members
 * once at init and then only flips an `inUse` flag.
 *
 * Usage:
 *   const pool = createPool(16, () => new Sprite(mat), (s) => { s.visible = false; });
 *   const item = pool.acquire();      // null when exhausted (budget reached)
 *   pool.release(item);
 *   pool.forEachActive((item) => { ... });
 */

/**
 * @template T
 * @param {number} size - Fixed capacity. Doubles as the hard budget cap.
 * @param {(index: number) => T} factory - Builds one member. Called `size` times at init.
 * @param {(item: T) => void} [reset] - Returns a member to its dormant state.
 * @returns {{
 *   acquire: () => T|null,
 *   release: (item: T) => void,
 *   releaseAll: () => void,
 *   forEachActive: (fn: (item: T) => void) => void,
 *   activeCount: () => number,
 *   size: number,
 *   items: T[]
 * }}
 */
export const createPool = (size, factory, reset) => {
    /** @type {any[]} */
    const items = [];
    /** @type {boolean[]} */
    const inUse = [];
    /** Indices currently free — acquiring is O(1) instead of scanning. */
    const free = [];

    for (let i = 0; i < size; i++) {
        const item = factory(i);
        items.push(item);
        inUse.push(false);
        free.push(i);
        if (reset) reset(item);
    }

    // Map object -> index so release() is O(1) without touching the object.
    const indexOf = new Map();
    items.forEach((item, i) => indexOf.set(item, i));

    const acquire = () => {
        if (free.length === 0) return null; // Budget reached — silently skip.
        const i = free.pop();
        inUse[i] = true;
        return items[i];
    };

    const release = (item) => {
        const i = indexOf.get(item);
        if (i === undefined || !inUse[i]) return;
        inUse[i] = false;
        free.push(i);
        if (reset) reset(item);
    };

    const releaseAll = () => {
        for (let i = 0; i < size; i++) {
            if (inUse[i]) {
                inUse[i] = false;
                free.push(i);
                if (reset) reset(items[i]);
            }
        }
    };

    /**
     * Iterates active members. Safe to release the current item mid-iteration.
     */
    const forEachActive = (fn) => {
        for (let i = 0; i < size; i++) {
            if (inUse[i]) fn(items[i]);
        }
    };

    const activeCount = () => size - free.length;

    return { acquire, release, releaseAll, forEachActive, activeCount, size, items };
};

export default { createPool };
