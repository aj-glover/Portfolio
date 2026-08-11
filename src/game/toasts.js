/**
 * src/game/toasts.js - Discovery and achievement notification toasts.
 * Small, non-blocking, temporary notifications.
 * Discovery: bottom-center, auto-fade 1.5-2s
 * Achievement: top-right, auto-fade 3-4s
 */

/**
 * Shows a discovery toast.
 * @param {string} text - e.g. "+1 PROJECT DISCOVERED"
 */
const showDiscovery = (text) => {
    const toast = document.createElement('div');
    toast.className = 'game-discovery-toast';
    toast.innerHTML = `
        <span class="game-discovery-toast-label">DISCOVERY LOG UPDATED</span>
        <span class="game-discovery-toast-text">${text}</span>
    `;
    document.body.appendChild(toast);

    // Auto-fade after 1.8 seconds
    setTimeout(() => {
        toast.classList.add('is-fading');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 600);
    }, 1800);
};

/**
 * Shows an achievement toast.
 * @param {{ name: string, description: string }} achievement
 */
const showAchievement = (achievement) => {
    const toast = document.createElement('div');
    toast.className = 'game-achievement-toast';
    toast.innerHTML = `
        <span class="game-achievement-toast-label">ACHIEVEMENT</span>
        <span class="game-achievement-toast-unlocked">UNLOCKED</span>
        <span class="game-achievement-toast-name">${achievement.name}</span>
        <span class="game-achievement-toast-desc">${achievement.description}</span>
    `;
    document.body.appendChild(toast);

    // Auto-fade after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('is-fading');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 600);
    }, 3500);
};

export default {
    showDiscovery,
    showAchievement
};