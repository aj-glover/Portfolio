/**
 * Loading Screen Manager
 * Handles the loading screen display and progress bar updates
 */

class LoadingManager {
    constructor() {
        this.progress = 0;
        this.progressBar = null;
        this.progressText = null;
        this.loadingScreen = null;
        this.isComplete = false;
        this.init();
    }

    init() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');

        if (!this.loadingScreen) {
            console.warn('[LoadingManager] Loading screen element not found');
            return;
        }

        // Start with a small progress value to show something is happening
        this.setProgress(5);
    }

    /**
     * Update progress bar
     * @param {number} percent - Progress percentage (0-100)
     */
    setProgress(percent) {
        percent = Math.min(Math.max(percent, 0), 100);
        this.progress = percent;

        if (this.progressBar) {
            this.progressBar.style.width = percent + '%';
        }
        if (this.progressText) {
            this.progressText.textContent = Math.round(percent) + '%';
        }

        console.log(`[Loading] ${Math.round(percent)}%`);
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

    /**
     * Simulate loading progress for demo/placeholder
     */
    simulateProgress() {
        let current = this.progress;
        const interval = setInterval(() => {
            current += Math.random() * 15;
            if (current >= 90) {
                clearInterval(interval);
                current = 90;
            }
            this.setProgress(current);
        }, 500);
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
