/**
 * UIRenderer.js
 * Handles all UI rendering and interactions including menus, buttons, status bar, and overlays
 */

export class UIRenderer extends EventTarget {
   constructor(gameStateManager) {
      super();

      this.gameStateManager = gameStateManager;
      this.elements = {
         statusBar: null,
         gameStatus: null,
         restartButton: null,
         acceptRematchButton: null,
         declineRematchButton: null,
         cancelRematchButton: null,
         exitGameButton: null,
         menuOverlay: null,
         menuContent: null,
         singlePlayerBtn: null,
         playWithBotBtn: null,
         createGameBtn: null,
         joinGameBtn: null,
         roomIdInput: null,
      };

      this.buttonStates = {
         IN_GAME: 'in_game',
         GAME_OVER: 'game_over',
         REMATCH_REQUEST: 'rematch_request',
         WAITING_REMATCH: 'waiting_rematch',
         OPPONENT_LEFT: 'opponent_left',
      };

      this.initialized = false;
   }

   /**
    * Initialize the UI renderer
    */
   async initialize() {
      try {
         this.cacheElements();
         this.setupEventListeners();
         this.setupGameStateListeners();
         this.updateUI();
         this.initialized = true;

         console.log('UIRenderer initialized successfully');
         return true;
      } catch (error) {
         console.error('Failed to initialize UIRenderer:', error);
         return false;
      }
   }

   /**
    * Cache DOM elements for performance
    */
   cacheElements() {
      this.elements.statusBar = document.getElementById('statusBar');
      this.elements.gameStatus = document.getElementById('gameStatus');
      this.elements.restartButton = document.getElementById('restartButton');
      this.elements.acceptRematchButton = document.getElementById('acceptRematchButton');
      this.elements.declineRematchButton = document.getElementById('declineRematchButton');
      this.elements.cancelRematchButton = document.getElementById('cancelRematchButton');
      this.elements.exitGameButton = document.getElementById('exitGameButton');
      this.elements.menuOverlay = document.getElementById('menuOverlay');
      this.elements.menuContent = document.getElementById('menuContent');
      this.elements.singlePlayerBtn = document.getElementById('singlePlayerBtn');
      this.elements.playWithBotBtn = document.getElementById('playWithBotBtn');
      this.elements.createGameBtn = document.getElementById('createGameBtn');
      this.elements.joinGameBtn = document.getElementById('joinGameBtn');
      this.elements.roomIdInput = document.getElementById('roomIdInput');
   }

   /**
    * Setup event listeners for UI interactions
    */
   setupEventListeners() {
      // Status bar button listeners
      if (this.elements.restartButton) {
         this.elements.restartButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('rematchRequest'));
         });
      }

      if (this.elements.acceptRematchButton) {
         this.elements.acceptRematchButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('rematchAccept'));
         });
      }

      if (this.elements.declineRematchButton) {
         this.elements.declineRematchButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('rematchDecline'));
         });
      }

      if (this.elements.cancelRematchButton) {
         this.elements.cancelRematchButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('rematchCancel'));
         });
      }

      if (this.elements.exitGameButton) {
         this.elements.exitGameButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('exitGame'));
         });
      }

      // Menu button listeners
      if (this.elements.singlePlayerBtn) {
         this.elements.singlePlayerBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('startSingle'));
         });
      }

      if (this.elements.playWithBotBtn) {
         this.elements.playWithBotBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('startBot'));
         });
      }

      if (this.elements.createGameBtn) {
         this.elements.createGameBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('multiCreate'));
         });
      }

      if (this.elements.joinGameBtn) {
         this.elements.joinGameBtn.addEventListener('click', () => {
            const roomId = this.elements.roomIdInput?.value?.trim();
            if (roomId) {
               this.dispatchEvent(
                  new CustomEvent('multiJoin', {
                     detail: {roomId},
                  })
               );
            } else {
               this.showMessage('Please enter a Room ID');
            }
         });
      }

      // Enter key for room ID input
      if (this.elements.roomIdInput) {
         this.elements.roomIdInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
               this.elements.joinGameBtn?.click();
            }
         });
      }
   }

   /**
    * Setup game state listeners
    */
   setupGameStateListeners() {
      if (!this.gameStateManager) return;
      const gsm = this.gameStateManager;

      gsm.addEventListener('stateInitialized', () => {
         this.updateUI();
      });
      gsm.addEventListener('stateChanged', () => {
         this.updateUI();
      });
      gsm.addEventListener('gameStarted', e => {
         this.updateGameStatus(`Game Started - ${e.detail.mode}`);
         this.hideMenu();
         this.updateButtonState(this.buttonStates.IN_GAME);
      });
      gsm.addEventListener('gameEnded', e => {
         const {winner} = e.detail;
         this.updateGameStatus(winner ? `Game Over - Player ${winner} wins!` : 'Game Over - Draw!');
         this.updateButtonState(this.buttonStates.GAME_OVER);
      });

      gsm.addEventListener('turnChange', () => {
         this.updateUI();
      });

      gsm.addEventListener('stateMenuStateChanged', e => {
         const {showMenu} = e.detail;
         if (showMenu) this.showMenu();
         else this.hideMenu();
      });
      gsm.addEventListener('stateButtonStateChanged', e => {
         const {to} = e.detail;
         this.updateButtonState(to);
      });
      gsm.addEventListener('stateGameEnded', () => {
         this.updateUI();
      });
   }

   /**
    * Update button visibility based on game state
    * @param {string} state - Button state constant
    */
   updateButtonState(state) {
      const buttons = {
         restartButton: false,
         acceptRematchButton: false,
         declineRematchButton: false,
         cancelRematchButton: false,
         exitGameButton: false,
      };

      switch (state) {
         case this.buttonStates.IN_GAME:
            buttons.exitGameButton = true;
            break;
         case this.buttonStates.GAME_OVER:
            buttons.restartButton = true;
            buttons.exitGameButton = true;
            break;
         case this.buttonStates.REMATCH_REQUEST:
            buttons.acceptRematchButton = true;
            buttons.declineRematchButton = true;
            buttons.exitGameButton = true;
            break;
         case this.buttonStates.WAITING_REMATCH:
            buttons.cancelRematchButton = true;
            buttons.exitGameButton = true;
            break;
         case this.buttonStates.OPPONENT_LEFT:
            buttons.exitGameButton = true;
            break;
      }

      Object.entries(buttons).forEach(([buttonId, isVisible]) => {
         const element = this.elements[buttonId];
         if (element) {
            element.style.display = isVisible ? 'block' : 'none';
         }
      });
   }

   /**
    * Update game status text
    * @param {string} text - Status text to display
    */
   updateGameStatus(text) {
      if (this.elements.gameStatus) {
         this.elements.gameStatus.textContent = text;
      }
   }

   /**
    * Show the menu overlay
    */
   showMenu() {
      if (this.elements.menuOverlay) {
         this.elements.menuOverlay.style.display = 'flex';
      }

      // Clear room ID input when showing menu
      if (this.elements.roomIdInput) {
         this.elements.roomIdInput.value = '';
      }
   }

   /**
    * Hide the menu overlay
    */
   hideMenu() {
      if (this.elements.menuOverlay) {
         this.elements.menuOverlay.style.display = 'none';
      }
   }

   /**
    * Show a temporary message to the user
    * @param {string} message - Message to display
    * @param {number} duration - Duration in milliseconds
    */
   showMessage(message, duration = 3000) {
      // Create temporary message element
      const messageEl = document.createElement('div');
      messageEl.textContent = message;
      messageEl.style.cssText = `
         position: fixed;
         top: 50%;
         left: 50%;
         transform: translate(-50%, -50%);
         background: rgba(0, 0, 0, 0.8);
         color: white;
         padding: 15px 25px;
         border-radius: 5px;
         z-index: 2000;
         font-size: 16px;
         pointer-events: none;
      `;

      document.body.appendChild(messageEl);

      // Remove after duration
      setTimeout(() => {
         if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
         }
      }, duration);
   }

   /**
    * Update room ID display in various places
    * @param {string} roomId - Room ID to display
    */
   updateRoomIdDisplay(roomId) {
      if (roomId) {
         this.updateGameStatus(`Room: ${roomId}`);
      }
   }

   /**
    * Clear room ID input
    */
   clearRoomIdInput() {
      if (this.elements.roomIdInput) {
         this.elements.roomIdInput.value = '';
      }
   }

   /**
    * Get current room ID from input
    * @returns {string} Room ID
    */
   getRoomIdInput() {
      return this.elements.roomIdInput?.value?.trim() || '';
   }

   /**
    * Update UI based on current game state
    */
   updateUI() {
      if (!this.gameStateManager) return;

      const state = this.gameStateManager.getState?.() || {
         showMenu: true,
         isGameOver: false,
         gameMode: null,
      };

      // Update menu visibility
      if (state.showMenu) this.showMenu();
      else this.hideMenu();

      // Update buttons from explicit buttonState when available; fallback to derived
      if (state.buttonState) {
         this.updateButtonState(state.buttonState);
      } else if (state.isGameOver) {
         this.updateButtonState(this.buttonStates.GAME_OVER);
      } else if (state.gameMode && state.gameMode !== 'menu') {
         this.updateButtonState(this.buttonStates.IN_GAME);
      } else {
         this.updateButtonState(null);
      }

      // Update status text from centralized statusMessage when present
      if (state.statusMessage) {
         this.updateGameStatus(state.statusMessage);
      } else if (!state.gameMode || state.gameMode === 'menu') {
         this.updateGameStatus('toe');
      }
   }

   /**
    * Cleanup method
    */
   destroy() {
      // Remove event listeners and clean up resources
      this.initialized = false;
   }

   /**
    * Get current initialization status
    * @returns {boolean} Whether the renderer is initialized
    */
   isInitialized() {
      return this.initialized;
   }
}
