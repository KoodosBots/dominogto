/**
 * Main Application Initialization
 */

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Domino GTO Analyzer - Initializing...');
    
    // Initialize all modules
    initializeUI();
    initializeGTOEngine();
    
    console.log('All modules initialized successfully');
});

// Initialize when window loads (for Supabase and external dependencies)
window.onload = function() {
    checkSession();
    console.log('Application fully loaded');
};