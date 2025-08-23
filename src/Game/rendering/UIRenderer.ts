/**
 * Handles all UI rendering and interactions including menus, buttons, and overlays
 */

export class UIRenderer extends EventTarget {
   gameStateManager: any;
   elements: Record<string, any>;
   initialized: boolean;
   constructor(gameStateManager: any) {
      super();

      this.gameStateManager = gameStateManager;

      this.elements = {
         menuOverlay: null,
         menuContent: null,
         singlePlayerBtn: null,
         playWithBotBtn: null,
         createGameBtn: null,
         joinGameBtn: null,
         roomIdInput: null,
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
         this.elements.roomIdInput.addEventListener('keydown', (e: any) => {
            if (e.key === 'Enter') {
               this.elements.joinGameBtn?.click();
            }
         });
      }

      // Switch players event listener
      this.addEventListener('switchPlayers', () => {
         if (this.gameStateManager?.switchPlayers) {
            this.gameStateManager.switchPlayers();
         }
      });
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
      gsm.addEventListener('gameStarted', (e: any) => {
         this.hideMenu();
      });
      gsm.addEventListener('gameEnded', () => {
         this.updateUI();
      });

      gsm.addEventListener('turnChange', () => {
         this.updateUI();
      });

      gsm.addEventListener('stateMenuStateChanged', (e: any) => {
         const {showMenu} = e.detail;
         if (showMenu) this.showMenu();
         else this.hideMenu();
      });
      gsm.addEventListener('stateGameEnded', () => {
         this.updateUI();
      });
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
   showMessage(message: string, duration: number = 3000) {
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
   getRoomIdInput(): string {
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
   isInitialized(): boolean {
      return this.initialized;
   }
}
