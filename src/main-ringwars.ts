// RINGwars 3D - Main Entry Point
// A 3D turn-based strategy game based on the original RINGwars

import { createRingWarsGame } from './ringwars/index';

function init() {
  // Clear any existing content
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '';
    app.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #1a1a2e;
    `;

    // Create and start the game
    const game = createRingWarsGame(app);

    // Expose to window for debugging
    (window as any).ringwars = game;

    console.log('RINGwars 3D loaded! Access game via window.ringwars');
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
