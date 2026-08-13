/**
 * Performance Monitoring Utility
 * Tracks and reports key performance metrics for optimization
 */

class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
        this.metrics = new Map();
        this.init();
    }

    init() {
        // Get initial navigation timing
        window.addEventListener('load', () => {
            this.reportMetrics();
        });

        // Track Core Web Vitals if available
        this.trackCoreWebVitals();
    }

    /**
     * Start timing a metric
     * @param {string} name - Metric name
     */
    startMeasure(name) {
        this.marks.set(name, performance.now());
    }

    /**
     * End timing and store metric
     * @param {string} name - Metric name
     * @returns {number} Duration in milliseconds
     */
    endMeasure(name) {
        if (!this.marks.has(name)) {
            console.warn(`[Performance] No start mark found for: ${name}`);
            return 0;
        }

        const startTime = this.marks.get(name);
        const duration = performance.now() - startTime;
        this.metrics.set(name, duration);
        this.marks.delete(name);

        return duration;
    }

    /**
     * Track Core Web Vitals (LCP, FID, CLS)
     */
    trackCoreWebVitals() {
        try {
            // Largest Contentful Paint
            if ('PerformanceObserver' in window) {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.set('LCP', lastEntry.renderTime || lastEntry.loadTime);
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (!this.metrics.has('FID')) {
                            this.metrics.set('FID', entry.processingDuration);
                        }
                    });
                }).observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift
                let clsScore = 0;
                new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (!entry.hadRecentInput) {
                            clsScore += entry.value;
                            this.metrics.set('CLS', clsScore);
                        }
                    });
                }).observe({ entryTypes: ['layout-shift'] });
            }
        } catch (e) {
            console.log('[Performance] Core Web Vitals tracking not available');
        }
    }

    /**
     * Report all collected metrics
     */
    reportMetrics() {
        const perfData = performance.timing;
        
        const metrics = {
            // Navigation Timing
            'DNS Lookup': perfData.domainLookupEnd - perfData.domainLookupStart,
            'TCP Connection': perfData.connectEnd - perfData.connectStart,
            'Request Time': perfData.responseStart - perfData.requestStart,
            'Response Time': perfData.responseEnd - perfData.responseStart,
            'DOM Processing': perfData.domComplete - perfData.domLoading,
            'Page Load': perfData.loadEventEnd - perfData.navigationStart,
            
            // Custom metrics
            ...Object.fromEntries(this.metrics)
        };

        console.group('[Performance] Metrics Report');
        Object.entries(metrics).forEach(([name, value]) => {
            if (value > 0) {
                const status = this.getStatus(name, value);
                console.log(`${name}: ${Math.round(value)}ms ${status}`);
            }
        });
        console.groupEnd();

        // Log resource summary
        this.logResourceSummary();

        // Send to analytics if available
        if (window.ga) {
            Object.entries(metrics).forEach(([name, value]) => {
                if (value > 0) {
                    ga('send', 'timing', 'page', name, Math.round(value));
                }
            });
        }
    }

    /**
     * Get status indicator based on metric value
     * @private
     */
    getStatus(name, value) {
        const thresholds = {
            'DNS Lookup': [100, 200],
            'TCP Connection': [100, 200],
            'Request Time': [200, 500],
            'Response Time': [500, 1000],
            'DOM Processing': [1000, 2000],
            'Page Load': [3000, 5000],
            'LCP': [2500, 4000],
            'FID': [100, 300],
            'CLS': [0.1, 0.25]
        };

        if (!thresholds[name]) return '';

        const [good, poor] = thresholds[name];
        if (value <= good) return '✓ Good';
        if (value <= poor) return '⚠ Needs Improvement';
        return '✗ Poor';
    }

    /**
     * Log resource loading summary
     * @private
     */
    logResourceSummary() {
        const resources = performance.getEntriesByType('resource');
        const summary = {
            total: resources.length,
            scripts: resources.filter(r => r.initiatorType === 'script').length,
            styles: resources.filter(r => r.initiatorType === 'link').length,
            images: resources.filter(r => r.initiatorType === 'img').length,
            totalSize: Math.round(resources.reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024)
        };

        console.log(`[Performance] Resources: ${summary.total} total, ` +
            `${summary.scripts} scripts, ${summary.styles} styles, ` +
            `${summary.images} images, ${summary.totalSize}KB transferred`);

        // Log slowest resources
        const slowest = resources
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5);

        if (slowest.length > 0) {
            console.group('[Performance] Slowest Resources');
            slowest.forEach(resource => {
                console.log(`${resource.name}: ${Math.round(resource.duration)}ms`);
            });
            console.groupEnd();
        }
    }

    /**
     * Get metric value
     * @param {string} name - Metric name
     * @returns {number|null} Metric value or null if not found
     */
    getMetric(name) {
        return this.metrics.get(name) || null;
    }

    /**
     * Get all metrics
     * @returns {Object} All collected metrics
     */
    getAllMetrics() {
        return Object.fromEntries(this.metrics);
    }
}

// Initialize monitoring
const perfMonitor = new PerformanceMonitor();
window.performanceMonitor = perfMonitor;

console.log('[Performance] Monitoring initialized');
