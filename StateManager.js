/**
 * StateManager - Handles transition and flow across game states.
 */
const GameState = {
  MAIN_MENU: 'MAIN_MENU',
  SETTINGS: 'SETTINGS',
  RUN_SELECT: 'RUN_SELECT',
  ACTIVE_ROUND: 'ACTIVE_ROUND',
  MEME_SHOP: 'MEME_SHOP',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

class StateManager {
  constructor() {
    this.currentState = GameState.MAIN_MENU;
    this.listeners = [];
  }

  getState() {
    return this.currentState;
  }

  setState(newState, data = {}) {
    if (this.currentState === newState) return;
    const oldState = this.currentState;
    this.currentState = newState;
    
    this.listeners.forEach(cb => cb(this.currentState, oldState, data));
  }

  onChange(callback) {
    this.listeners.push(callback);
  }
}

window.GameState = GameState;
window.StateManager = StateManager;
