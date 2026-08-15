// Map button handler for the HUD
document.addEventListener('DOMContentLoaded', function() {
    // Get the map button from the HUD
    const mapBtn = document.getElementById('game-hud-map');
    
    if (mapBtn) {
        mapBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Map button clicked - opening navigation map');
            
            // Toggle map visibility or navigate to map view
            const hudSector = document.querySelector('.game-hud-sector');
            if (hudSector) {
                // If map is already open, close it; otherwise open it
                if (hudSector.classList.contains('map-open')) {
                    hudSector.classList.remove('map-open');
                    console.log('Map closed');
                } else {
                    hudSector.classList.add('map-open');
                    console.log('Map opened');
                }
            }
        });
    } else {
        console.warn('Map button not found - checking for alternative selectors');
        // Try alternative selector
        const altMapBtn = document.querySelector('.game-hud-map-btn');
        if (altMapBtn) {
            altMapBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Map button clicked (alternative selector) - opening navigation map');
            });
        }
    }
});