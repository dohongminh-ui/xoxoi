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
         roomIdInput: null
      };
      
      this.buttonStates = {
         IN_GAME: 'in_game',
         GAME_OVER: 'game_over',
         REMATCH_REQUEST: 'rematch_request',
         WAITING_REMATCH: 'waiting_rematch',
         OPPONENT_LEFT: 'opponent_left'
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

      // Create menu if it doesn't exist (deprecated)
      // if (!this.elements.menuOverlay) {
      //    this.createMenuOverlay();
      // }
   }

   /**
    * Create menu overlay if it doesn't exist
    * Deprecated, TODO: create a React component for the menu
    * @deprecated
   createMenuOverlay() {
      const menuOverlay = document.createElement('div');
      menuOverlay.id = 'menuOverlay';
      menuOverlay.style.cssText = `
         position: fixed;
         top: 0;
         left: 0;
         width: 100%;
         height: 100%;
         background: rgba(0, 0, 0, 0.8);
         display: flex;
         justify-content: center;
         align-items: center;
         z-index: 1000;
      `;

      const menuContent = document.createElement('div');
      menuContent.id = 'menuContent';
      menuContent.style.cssText = `
         background: white;
         padding: 30px;
         border-radius: 10px;
         display: flex;
         flex-direction: column;
         gap: 15px;
         min-width: 300px;
         text-align: center;
      `;

      // Create menu buttons
      const singlePlayerBtn = document.createElement('button');
      singlePlayerBtn.id = 'singlePlayerBtn';
      singlePlayerBtn.textContent = 'Local Game';
      singlePlayerBtn.style.cssText = `
         padding: 12px 24px;
         font-size: 16px;
         border: none;
         border-radius: 5px;
         background: #007bff;
         color: white;
         cursor: pointer;
         transition: background-color 0.2s;
      `;

      const playWithBotBtn = document.createElement('button');
      playWithBotBtn.id = 'playWithBotBtn';
      playWithBotBtn.textContent = 'Play with Bot';
      playWithBotBtn.style.cssText = singlePlayerBtn.style.cssText.replace('#007bff', '#28a745');

      const createGameBtn = document.createElement('button');
      createGameBtn.id = 'createGameBtn';
      createGameBtn.textContent = 'Create Multiplayer Game';
      createGameBtn.style.cssText = singlePlayerBtn.style.cssText.replace('#007bff', '#17a2b8');

      const joinGameDiv = document.createElement('div');
      joinGameDiv.id = 'joinGame';
      joinGameDiv.style.cssText = 'display: flex; gap: 10px; margin-top: 10px;';

      const roomIdInput = document.createElement('input');
      roomIdInput.id = 'roomIdInput';
      roomIdInput.type = 'text';
      roomIdInput.placeholder = 'Enter Room ID';
      roomIdInput.style.cssText = `
         flex: 1;
         padding: 8px 12px;
         border: 1px solid #ddd;
         border-radius: 4px;
         font-size: 14px;
      `;

      const joinGameBtn = document.createElement('button');
      joinGameBtn.id = 'joinGameBtn';
      joinGameBtn.textContent = 'Join Game';
      joinGameBtn.style.cssText = `
         padding: 8px 16px;
         border: none;
         border-radius: 4px;
         background: #ffc107;
         color: black;
         cursor: pointer;
         font-size: 14px;
      `;

      // Assemble menu
      joinGameDiv.appendChild(roomIdInput);
      joinGameDiv.appendChild(joinGameBtn);
      
      menuContent.appendChild(singlePlayerBtn);
      menuContent.appendChild(playWithBotBtn);
      menuContent.appendChild(createGameBtn);
      menuContent.appendChild(joinGameDiv);
      
      menuOverlay.appendChild(menuContent);
      document.body.appendChild(menuOverlay);

      // Cache the created elements
      this.elements.menuOverlay = menuOverlay;
      this.elements.menuContent = menuContent;
      this.elements.singlePlayerBtn = singlePlayerBtn;
      this.elements.playWithBotBtn = playWithBotBtn;
      this.elements.createGameBtn = createGameBtn;
      this.elements.joinGameBtn = joinGameBtn;
      this.elements.roomIdInput = roomIdInput;
   } */

   /**
    * Setup event listeners for UI interactions
    */
   setupEventListeners() {
      // Status bar button listeners
      if (this.elements.restartButton) {
         this.elements.restartButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ui:restart-request'));
         });
      }

      if (this.elements.acceptRematchButton) {
         this.elements.acceptRematchButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ui:accept-rematch'));
         });
      }

      if (this.elements.declineRematchButton) {
         this.elements.declineRematchButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ui:decline-rematch'));
         });
      }

      if (this.elements.cancelRematchButton) {
         this.elements.cancelRematchButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ui:cancel-rematch'));
         });
      }

      if (this.elements.exitGameButton) {
         this.elements.exitGameButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ui:exit-game'));
         });
      }

      // Menu button listeners
      if (this.elements.singlePlayerBtn) {
         this.elements.singlePlayerBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ui:start-single-player'));
         });
      }

      if (this.elements.playWithBotBtn) {
         this.elements.playWithBotBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ui:start-bot-game'));
         });
      }

      if (this.elements.createGameBtn) {
         this.elements.createGameBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ui:create-multiplayer'));
         });
      }

      if (this.elements.joinGameBtn) {
         this.elements.joinGameBtn.addEventListener('click', () => {
            const roomId = this.elements.roomIdInput?.value?.trim();
            if (roomId) {
               this.dispatchEvent(new CustomEvent('ui:join-multiplayer', {
                  detail: { roomId }
               }));
            } else {
               this.showMessage('Please enter a Room ID');
            }
         });
      }

      // Enter key for room ID input
      if (this.elements.roomIdInput) {
         this.elements.roomIdInput.addEventListener('keydown', (e) => {
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

      // Listen for game state changes
      this.gameStateManager.addEventListener('state:game-started', (e) => {
         this.updateGameStatus(`Game Started - ${e.detail.gameMode}`);
         this.hideMenu();
         this.updateButtonState(this.buttonStates.IN_GAME);
      });

      this.gameStateManager.addEventListener('state:game-ended', (e) => {
         const { winner, reason } = e.detail;
         if (winner) {
            this.updateGameStatus(`Game Over - Player ${winner} wins!`);
         } else {
            this.updateGameStatus('Game Over - Draw!');
         }
         this.updateButtonState(this.buttonStates.GAME_OVER);
      });

      this.gameStateManager.addEventListener('state:player-turn-changed', (e) => {
         const { currentPlayer, isMyTurn } = e.detail;
         if (isMyTurn) {
            this.updateGameStatus(`Your turn (${currentPlayer})`);
         } else {
            this.updateGameStatus(`Opponent's turn (${currentPlayer})`);
         }
      });

      this.gameStateManager.addEventListener('state:multiplayer-joined', (e) => {
         const { roomId } = e.detail;
         this.updateGameStatus(`Joined room: ${roomId}`);
         this.hideMenu();
      });

      this.gameStateManager.addEventListener('state:multiplayer-waiting', (e) => {
         const { roomId } = e.detail;
         this.updateGameStatus(`Waiting for opponent... Room: ${roomId}`);
      });

      this.gameStateManager.addEventListener('state:opponent-left', () => {
         this.updateGameStatus('Opponent left the game');
         this.updateButtonState(this.buttonStates.OPPONENT_LEFT);
      });

      this.gameStateManager.addEventListener('state:rematch-requested', () => {
         this.updateGameStatus('Rematch requested by opponent');
         this.updateButtonState(this.buttonStates.REMATCH_REQUEST);
      });

      this.gameStateManager.addEventListener('state:rematch-waiting', () => {
         this.updateGameStatus('Waiting for rematch response...');
         this.updateButtonState(this.buttonStates.WAITING_REMATCH);
      });

      this.gameStateManager.addEventListener('state:reset', () => {
         this.showMenu();
         this.updateGameStatus('toe');
         this.updateButtonState(null);
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
         exitGameButton: false
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

      const gameState = this.gameStateManager.getState('game');
      const uiState = this.gameStateManager.getState('ui');

      // Update menu visibility
      if (uiState.showMenu) {
         this.showMenu();
      } else {
         this.hideMenu();
      }

      // Update button state based on game state
      if (gameState.isGameOver) {
         this.updateButtonState(this.buttonStates.GAME_OVER);
      } else if (gameState.gameMode && gameState.gameMode !== 'menu') {
         this.updateButtonState(this.buttonStates.IN_GAME);
      }

      // Update status text
      if (gameState.gameMode === 'menu' || !gameState.gameMode) {
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
