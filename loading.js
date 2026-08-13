/**
 * Loading Screen Manager
 * Handles the loading screen display and real progress tracking
 * Monitors actual resource loading: scripts, stylesheets, images, and models
 */

class LoadingManager {
    constructor() {
        this.progress = 0;
        this.progressBar = null;
        this.progressText = null;
        this.loadingScreen = null;
        this.isComplete = false;
        
        // Resource tracking
        this.resourcesStarted = 0;
        this.resourcesCompleted = 0;
        this.estimatedTotal = 0;
        
        this.init();
        this.trackResourceLoading();
    }

    init() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');

        if (!this.loadingScreen) {
            console.warn('[LoadingManager] Loading screen element not found');
            return;
        }

        // Start with initial progress
        this.setProgress(8);
    }

    /**
     * Track real resource loading events
     */
    trackResourceLoading() {
        // Monitor network activity via performance API
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                // Track XHR, fetch, script, style, image, and other resources
                if (entry.initiatorType && 
                    (entry.initiatorType.includes('script') ||
                     entry.initiatorType.includes('link') ||
                     entry.initiatorType.includes('img') ||
                     entry.initiatorType === 'fetch' ||
                     entry.initiatorType === 'xmlhttprequest')) {
                    
                    this.resourcesCompleted++;
                    this.updateProgressFromResources();
                }
            });
        });

        try {
            observer.observe({ entryTypes: ['resource'] });
        } catch (e) {
            console.log('[Loading] Resource timing not available, using fallback progress');
            // Fallback: simulate progress if observer not available
            this.simulateFallbackProgress();
        }

        // Monitor page readiness
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setProgress(75);
            });
            window.addEventListener('load', () => {
                this.setProgress(95);
            });
        } else {
            this.setProgress(60);
            window.addEventListener('load', () => {
                this.setProgress(95);
            });
        }
    }

    /**
     * Update progress based on tracked resources
     */
    updateProgressFromResources() {
        // Map resource completion to progress: 8% -> 80%
        const resourceProgress = 8 + (Math.min(this.resourcesCompleted, 50) / 50) * 72;
        if (resourceProgress > this.progress) {
            this.setProgress(Math.floor(resourceProgress));
        }
    }

    /**
     * Fallback progress simulation if resource timing unavailable
     */
    simulateFallbackProgress() {
        let current = this.progress;
        const interval = setInterval(() => {
            const increment = Math.random() * (85 - current) * 0.05;
            current += increment;
            if (current >= 75) {
                clearInterval(interval);
                return;
            }
            this.setProgress(Math.floor(current));
        }, 400);
    }

    /**
     * Update progress bar
     * @param {number} percent - Progress percentage (0-100)
     */
    setProgress(percent) {
        percent = Math.min(Math.max(percent, 0), 100);
        // Only update if progress increases
        if (percent > this.progress) {
            this.progress = percent;

            if (this.progressBar) {
                this.progressBar.style.width = percent + '%';
            }
            if (this.progressText) {
                this.progressText.textContent = Math.round(percent) + '%';
            }

            if (percent % 10 === 0 || percent === 100) {
                console.log(`[Loading] ${Math.round(percent)}%`);
            }
        }
    }

    /**
     * Increment progress by amount
     * @param {number} amount - Amount to increment (default 5)
     */
    incrementProgress(amount = 5) {
        const newProgress = Math.min(this.progress + amount, 95);
        this.setProgress(newProgress);
    }

    /**
     * Complete the loading screen
     */
    complete() {
        if (this.isComplete) return;

        this.isComplete = true;
        this.setProgress(100);

        // Add fade-out animation
        if (this.loadingScreen) {
            setTimeout(() => {
                this.loadingScreen.classList.add('fade-out');
                
                // Remove after animation completes
                setTimeout(() => {
                    this.loadingScreen.style.display = 'none';
                }, 500);
            }, 300);
        }

        console.log('[Loading] Complete');
    }
}

// Export for use
window.LoadingManager = LoadingManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.loadingManager = new LoadingManager();
    });
} else {
    window.loadingManager = new LoadingManager();
}

// Auto-complete loading when page fully loads
window.addEventListener('load', () => {
    if (window.loadingManager && !window.loadingManager.isComplete) {
        setTimeout(() => {
            window.loadingManager.complete();
        }, 500);
    }
});
