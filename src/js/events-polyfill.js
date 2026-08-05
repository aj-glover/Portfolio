// Minimal EventEmitter polyfill for browser usage
export class EventEmitter {
    constructor() {
        this._events = Object.create(null);
    }
    on(name, cb) {
        (this._events[name] || (this._events[name] = [])).push(cb);
        return this;
    }
    off(name, cb) {
        if (!this._events[name]) return this;
        if (!cb) { delete this._events[name]; return this; }
        this._events[name] = this._events[name].filter(fn => fn !== cb);
        return this;
    }
    emit(name, ...args) {
        if (!this._events[name]) return false;
        this._events[name].forEach(fn => fn(...args));
        return true;
    }
}
