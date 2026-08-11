/**
 * src/game/ambient/eventManager.js - Rare event scheduler (requirement #17).
 *
 * Events are registered as data, never hard-coded into the render loop. The
 * manager owns three guarantees that together produce the rhythm described in
 * requirement #22 (CALM -> event -> CALM):
 *
 *   1. Only ONE ambient event runs at a time.
 *   2. A global "calm floor" enforces quiet between any two events.
 *   3. Each event has its own randomized per-event cooldown on top of that.
 *
 * Event shape:
 *   {
 *     id: string,
 *     weight: number,               // relative chance when a slot opens
 *     cooldown: [minMs, maxMs],     // randomized per-event rest
 *     canRun?: () => boolean,       // capability / state gate
 *     start: (ctx) => void,
 *     update?: (ctx, dt) => boolean | void,  // return false to end early
 *     duration?: number,            // ms; ends the event if update never does
 *     cleanup?: () => void
 *   }
 */

/** Minimum quiet time between the end of one event and the start of the next. */
const CALM_FLOOR_MS = 8000;

/** How often we roll the dice for a new event. */
const TICK_INTERVAL_MS = 1000;

/**
 * Creates an ambient event manager instance.
 * @returns {{
 *   register: (event: object) => void,
 *   update: (ctx: object, dtMs: number) => void,
 *   trigger: (id: string, ctx: object) => boolean,
 *   stopActive: () => void,
 *   isBusy: () => boolean,
 *   reset: () => void
 * }}
 */
export const createEventManager = () => {
    /** @type {object[]} */
    const events = [];

    /** Per-event timestamp (ms, performance.now scale) before which it may not run. */
    const readyAt = new Map();

    /** @type {object|null} */
    let active = null;
    let activeElapsed = 0;

    /** Global gate — no event may start before this timestamp. */
    let calmUntil = 0;

    /** Accumulator so we only roll once per TICK_INTERVAL_MS. */
    let sinceLastRoll = 0;

    const now = () => performance.now();

    const randBetween = ([min, max]) => min + Math.random() * (max - min);

    const register = (event) => {
        events.push(event);
        // Stagger initial readiness so the environment does not fire everything
        // at once on page load.
        readyAt.set(event.id, now() + randBetween(event.cooldown) * 0.5);
    };

    /**
     * Ends the active event and opens the calm window.
     */
    const endActive = () => {
        if (!active) return;
        if (active.cleanup) {
            try {
                active.cleanup();
            } catch (e) {
                console.warn(`[Ambient] cleanup failed for "${active.id}"`, e);
            }
        }
        readyAt.set(active.id, now() + randBetween(active.cooldown));
        calmUntil = now() + CALM_FLOOR_MS;
        active = null;
        activeElapsed = 0;
    };

    /**
     * Starts a specific event immediately, bypassing probability but not safety.
     * @returns {boolean} whether it started
     */
    const trigger = (id, ctx) => {
        if (active) return false;
        const event = events.find((e) => e.id === id);
        if (!event) return false;
        if (event.canRun && !event.canRun()) return false;

        active = event;
        activeElapsed = 0;
        try {
            event.start(ctx);
        } catch (e) {
            console.warn(`[Ambient] start failed for "${event.id}"`, e);
            active = null;
        }
        return active !== null;
    };

    /**
     * Weighted pick among events whose cooldown has elapsed and gate passes.
     * @returns {object|null}
     */
    const pickCandidate = () => {
        const t = now();
        const eligible = events.filter((e) => {
            if ((readyAt.get(e.id) || 0) > t) return false;
            if (e.canRun && !e.canRun()) return false;
            return true;
        });
        if (eligible.length === 0) return null;

        const total = eligible.reduce((sum, e) => sum + e.weight, 0);
        // Weights are absolute per-roll probabilities, so a roll can legitimately
        // select nothing — that is what preserves the negative space.
        let r = Math.random();
        if (r > total) return null;

        r = Math.random() * total;
        let acc = 0;
        for (const e of eligible) {
            acc += e.weight;
            if (r <= acc) return e;
        }
        return null;
    };

    const update = (ctx, dtMs) => {
        // --- Drive the running event ---
        if (active) {
            activeElapsed += dtMs;
            let keepGoing = true;
            if (active.update) {
                try {
                    keepGoing = active.update(ctx, dtMs) !== false;
                } catch (e) {
                    console.warn(`[Ambient] update failed for "${active.id}"`, e);
                    keepGoing = false;
                }
            }
            if (!keepGoing || (active.duration && activeElapsed >= active.duration)) {
                endActive();
            }
            return;
        }

        // --- Otherwise consider starting one ---
        if (now() < calmUntil) return;

        sinceLastRoll += dtMs;
        if (sinceLastRoll < TICK_INTERVAL_MS) return;
        sinceLastRoll = 0;

        const candidate = pickCandidate();
        if (candidate) trigger(candidate.id, ctx);
    };

    const reset = () => {
        endActive();
        calmUntil = 0;
        sinceLastRoll = 0;
        events.forEach((e) => readyAt.set(e.id, now() + randBetween(e.cooldown) * 0.5));
    };

    return {
        register,
        update,
        trigger,
        stopActive: endActive,
        isBusy: () => active !== null,
        reset
    };
};

export default { createEventManager };
