import {GAME_CONSTANTS} from './constants.js';

/**
 * Main game engine that orchestrates all game components
 * Might need more optimization as components are added
 */
export class GameEngine {
   constructor() {
      this.app = null;
      this.gridContainer = null;

      // Component instances
      this.gridRenderer = null;
      this.cameraController = null;
      this.inputHandler = null;
      this.gameLogic = null;
      this.networkManager = null;
      this.botController = null;
      this.gameStateManager = null;
      this.uiRenderer = null;

      // Component classes (to be imported as we create them)
      this.components = {};
   }

   /**
    * Initialize the game engine and all components
    */
   async init() {
      this.setupPixiApplication();
      await this.loadComponents();
      this.initializeComponents();
      this.setupEventListeners();
      this.startGameLoop();
   }

   /**
    * Set up the main PIXI application
    */
   setupPixiApplication() {
      this.app = new PIXI.Application({
         width: window.innerWidth,
         height: window.innerHeight,
         backgroundColor: GAME_CONSTANTS.COLORS.BACKGROUND,
         resizeTo: window,
         autoDensity: true,
         resolution: window.devicePixelRatio || 1,
      });

      // Create main grid container
      this.gridContainer = new PIXI.Container();
      this.app.stage.addChild(this.gridContainer);

      // Set up basic stage properties
      this.app.stage.interactive = true;
      this.app.stage.hitArea = this.app.screen;
   }

   /**
    * Dynamically load component modules as they become available
    */
   async loadComponents() {
      console.log('Loading components...');

      // Load GridRenderer component
      try {
         const {GridRenderer} = await import('../rendering/GridRenderer.js');
         this.components.GridRenderer = GridRenderer;
         console.log('GridRenderer loaded successfully');
      } catch (error) {
         console.warn('Failed to load GridRenderer:', error);
      }

      // Load CameraController component
      try {
         const {CameraController} = await import('../input/CameraController.js');
         this.components.CameraController = CameraController;
         console.log('CameraController loaded successfully');
      } catch (error) {
         console.warn('Failed to load CameraController:', error);
      }

      // Load GameLogic component
      try {
         const {GameLogic} = await import('../game/GameLogic.js');
         this.components.GameLogic = GameLogic;
         console.log('GameLogic loaded successfully');
      } catch (error) {
         console.warn('Failed to load GameLogic:', error);
      }

      // Load NetworkManager component
      try {
         const {NetworkManager} = await import('../network/NetworkManager.js');
         this.components.NetworkManager = NetworkManager;
         console.log('NetworkManager loaded successfully');
      } catch (error) {
         console.warn('Failed to load NetworkManager:', error);
      }

      // Load GameStateManager component
      try {
         const {GameStateManager} = await import('../game/GameStateManager.js');
         this.components.GameStateManager = GameStateManager;
         console.log('GameStateManager loaded successfully');
      } catch (error) {
         console.warn('Failed to load GameStateManager:', error);
      }

      // Load UIRenderer component
      try {
         const {UIRenderer} = await import('../rendering/UIRenderer.js');
         this.components.UIRenderer = UIRenderer;
         console.log('UIRenderer loaded successfully');
      } catch (error) {
         console.warn('Failed to load UIRenderer:', error);
      }

      // Future components will be loaded here as they're created
      // this.components.InputHandler = (await import('../input/InputHandler.js')).InputHandler;
      // this.components.CameraController = (await import('../input/CameraController.js')).CameraController;
      // etc.
   }

   /**
    * Initialize all game components
    */
   initializeComponents() {
      // Initialize GridRenderer if available
      if (this.components.GridRenderer) {
         this.gridRenderer = new this.components.GridRenderer(this.app, this.gridContainer);
         console.log('GridRenderer initialized');
      }

      // Initialize CameraController if available
      if (this.components.CameraController) {
         this.cameraController = new this.components.CameraController(this.app, this.gridContainer);
         console.log('CameraController initialized');

         // Setup camera event listeners
         this.setupCameraEventListeners();
      }

      // Initialize GameLogic if available
      if (this.components.GameLogic) {
         this.gameLogic = new this.components.GameLogic();
         console.log('GameLogic initialized');

         // Setup game logic event listeners
         this.setupGameLogicEventListeners();

         // Don't auto-start a game - wait for user input
         // this.gameLogic.startGame('single');
      }

      // Initialize NetworkManager if available
      if (this.components.NetworkManager) {
         this.networkManager = new this.components.NetworkManager();
         console.log('NetworkManager initialized');

         // Setup network event listeners
         this.setupNetworkEventListeners();
      }

      // Initialize GameStateManager if available
      if (this.components.GameStateManager) {
         this.gameStateManager = new this.components.GameStateManager();
         console.log('GameStateManager initialized');

         // Setup game state event listeners
         this.setupGameStateEventListeners();
      }

      // Initialize UIRenderer if available
      if (this.components.UIRenderer && this.gameStateManager) {
         this.uiRenderer = new this.components.UIRenderer(this.gameStateManager);
         this.uiRenderer.initialize();
         console.log('UIRenderer initialized');

         // Setup UI event listeners
         this.setupUIEventListeners();
      }

      // Draw initial grid after components are ready
      if (this.gridRenderer) {
         this.gridRenderer.drawGrid(1, 0, 0); // scale=1, gridX=0, gridY=0
      }

      // Future component initialization will go here
   }

   /**
    * Set up global event listeners
    */
   setupEventListeners() {
      // Window resize handler
      window.addEventListener('resize', () => {
         this.app.renderer.resize(window.innerWidth, window.innerHeight);
         this.app.stage.hitArea = this.app.screen;

         // Notify components of resize if they exist
         if (this.gridRenderer) {
            this.gridRenderer.onResize();
         }
      });
   }

   /**
    * Start the main game loop
    */
   startGameLoop() {
      // PIXI's ticker will handle the main loop
      // Components can hook into this via the app.ticker
      console.log('Game engine initialized and running');
   }

   /**
    * Setup camera event listeners to coordinate between components
    */
   setupCameraEventListeners() {
      if (!this.cameraController || !this.gridRenderer) return;

      // Listen for camera updates to redraw grid
      this.cameraController.addEventListener('cameraUpdate', event => {
         const {scale, x, y} = event.detail;
         this.gridRenderer.drawGrid(scale, x, y);
      });

      // Listen for cell clicks
      this.cameraController.addEventListener('cellClick', event => {
         const {cellX, cellY} = event.detail;
         this.handleCellClick(cellX, cellY);
      });

      // Listen for pointer moves to update hover
      this.cameraController.addEventListener('pointerMove', event => {
         const {event: pointerEvent, isDragging, hasMoved} = event.detail;
         const cameraState = this.cameraController.getCameraState();

         // Get real game state
         let gameState = this.gameLogic
            ? this.gameLogic.getGameState()
            : {
                 isGameOver: false,
                 gameMode: 'test',
                 isMyTurn: true,
              };

         // If GameStateManager exists, enrich with phase/menu/isGameActive
         if (this.gameStateManager) {
            const gsmState = this.gameStateManager.getState();
            gameState = {
               ...gameState,
               gamePhase: gsmState.gamePhase,
               showMenu: gsmState.showMenu,
               isGameActive: this.gameStateManager.isGameActive(),
            };
         }

         this.gridRenderer.updateHoverCell(
            pointerEvent,
            cameraState.scale,
            gameState,
            isDragging,
            hasMoved,
            this.placedMarks || new Map()
         );
      });
   }

   /**
    * Set up GameLogic event listeners
    */
   setupGameLogicEventListeners() {
      if (!this.gameLogic) return;

      // Listen for move attempts
      this.gameLogic.addEventListener('moveAttempted', event => {
         const {x, y, player, success, reason} = event.detail;
         console.log(`Move attempt: ${player} at (${x}, ${y}) - ${success ? 'Success' : reason}`);
      });

      // Listen for successful moves
      this.gameLogic.addEventListener('movePlaced', event => {
         const {cellX, cellY, player} = event.detail;

         // Update the visual representation
         if (this.gridRenderer && this.cameraController) {
            const scale = this.cameraController.getCameraState().scale;
            this.gridRenderer.addPlayerMark(cellX, cellY, player, scale);

            // Also highlight the last move
            this.gridRenderer.highlightLastMove(cellX, cellY, player);
         }

         // Initialize placedMarks if it doesn't exist
         if (!this.placedMarks) {
            this.placedMarks = new Map();
         }

         // Update local tracking
         this.placedMarks.set(`${cellX},${cellY}`, {
            player,
            x: cellX,
            y: cellY,
         });

         // update game state
         this.gameStateManager.switchTurn();
      });

      // Listen for wins
      this.gameLogic.addEventListener('gameWon', async event => {
         const {winner, winningCells} = event.detail;
         console.log(`Game won by ${winner}!`, 'Winning cells:', winningCells);

         // Show winning animation if renderer supports it
         if (this.gridRenderer && this.gridRenderer.animateWinningLine) {
            console.log('Calling animateWinningLine with:', winningCells);
            await this.gridRenderer.animateWinningLine(winningCells);
         } else {
            console.log('GridRenderer or animateWinningLine method not available');
         }

         // end the game after win
         this.gameStateManager.endGame({
            winner: winner,
            winningCells: winningCells,
            reason: 'game finished',
         });
         this.gameLogic.dispatchEvent(new CustomEvent('gameEnded'));
      });

      // Listen for draws
      this.gameLogic.addEventListener('gameDraw', event => {
         console.log('Game ended in a draw!');
      });

      // Listen for game state changes
      this.gameLogic.addEventListener('stateChanged', event => {
         const {gameState} = event.detail;
         console.log('Game state changed:', gameState);
      });
   }

   /**
    * Set up NetworkManager event listeners
    */
   setupNetworkEventListeners() {
      if (!this.networkManager) return;

      // Connection events
      this.networkManager.addEventListener('connected', event => {
         console.log('Network connected:', event.detail);
      });

      this.networkManager.addEventListener('disconnected', event => {
         console.log('Network disconnected:', event.detail);
      });

      this.networkManager.addEventListener('reconnected', event => {
         console.log('Network reconnected after', event.detail.attempts, 'attempts');
      });

      this.networkManager.addEventListener('reconnectFailed', event => {
         console.log('Network reconnection failed');
      });

      // Room events
      this.networkManager.addEventListener('roomCreated', event => {
         const {roomId, playerMark, inviteUrl} = event.detail;
         console.log('Room created:', roomId, 'Player mark:', playerMark);

         // Switch GameLogic to multiplayer mode
         if (this.gameLogic) {
            this.gameLogic.startGame('multi', {
               playerMark,
               roomId,
               isMyTurn: playerMark === 'X',
               hasOpponent: false,
            });
         }
      });

      this.networkManager.addEventListener('gameJoined', event => {
         const {roomId, playerMark, isMyTurn} = event.detail;
         console.log('Joined game:', roomId, 'Player mark:', playerMark);

         // Switch GameLogic to multiplayer mode
         if (this.gameLogic) {
            this.gameLogic.startGame('multi', {
               playerMark,
               roomId,
               isMyTurn,
               hasOpponent: true,
            });
         }
      });

      this.networkManager.addEventListener('opponentJoined', event => {
         console.log('Opponent joined');

         // Update GameLogic state
         if (this.gameLogic) {
            this.gameLogic.updateGameState({hasOpponent: true});
         }
      });

      this.networkManager.addEventListener('opponentLeft', event => {
         console.log('Opponent left');

         // Update GameLogic state
         if (this.gameLogic) {
            this.gameLogic.updateGameState({
               hasOpponent: false,
               isGameOver: true,
            });
         }
      });

      // Move synchronization
      this.networkManager.addEventListener('moveReceived', event => {
         const {cellX, cellY, player, isMyTurn} = event.detail;
         console.log('Move received:', cellX, cellY, 'by', player);

         // Execute the move in GameLogic
         if (this.gameLogic) {
            this.gameLogic.executeMove(cellX, cellY, player);
            this.gameLogic.updateGameState({isMyTurn});
         }
      });

      // Listen for multiplayer moves from GameLogic
      if (this.gameLogic) {
         this.gameLogic.addEventListener('multiplayerMove', event => {
            const {cellX, cellY} = event.detail;
            this.networkManager.sendMove(cellX, cellY);
         });
      }

      // Error handling
      this.networkManager.addEventListener('error', event => {
         console.error('Network error:', event.detail.error);
      });

      this.networkManager.addEventListener('roomNotFound', event => {
         console.warn('Room not found:', event.detail.roomId);
      });
   }

   /**
    * Set up GameStateManager event listeners
    */
   setupGameStateEventListeners() {
      if (!this.gameStateManager) return;

      // Listen for game mode changes
      this.gameStateManager.addEventListener('stateGameModeChanged', event => {
         const {from, to} = event.detail;
         console.log(`Game mode changed from ${from} to ${to}`);
      });

      // Listen for game phase changes
      this.gameStateManager.addEventListener('stateGamePhaseChanged', event => {
         const {from, to} = event.detail;
         console.log(`Game phase changed from ${from} to ${to}`);
         if (this.gridRenderer) {
            this.gridRenderer.clearHover();
         }
      });

      // Listen for turn changes
      this.gameStateManager.addEventListener('turnChange', event => {
         const {currentPlayer, isMyTurn} = event.detail;
         console.log(`Turn changed: ${currentPlayer} (my turn: ${isMyTurn})`);
      });

      // Listen for game end
      this.gameStateManager.addEventListener('gameEnded', event => {
         const {winner} = event.detail;
         console.log(`Game ended. Winner: ${winner || 'Draw'}`);
         if (this.gridRenderer) {
            this.gridRenderer.clearHover();
         }
      });

      // Listen for menu state changes
      this.gameStateManager.addEventListener('stateMenuStateChanged', event => {
         const {currentMenu, showMenu} = event.detail;
         console.log(`Menu state changed: ${currentMenu} (visible: ${showMenu})`);
         if (this.gridRenderer) {
            this.gridRenderer.clearHover();
         }
      });

      // Listen for button state changes
      this.gameStateManager.addEventListener('stateButtonStateChanged', event => {
         const {from, to} = event.detail;
         console.log(`Button state changed from ${from} to ${to}`);
      });

      // Listen for network state changes
      this.gameStateManager.addEventListener('stateNetworkStateChanged', event => {
         const {isConnected, isReconnecting} = event.detail;
         console.log(`Network state: connected=${isConnected}, reconnecting=${isReconnecting}`);
      });
   }

   /**
    * Setup UI event listeners
    */
   setupUIEventListeners() {
      if (!this.uiRenderer) return;

      // Single player game
      this.uiRenderer.addEventListener('startSingle', () => {
         this.startSinglePlayerGame();
      });

      // Bot game
      this.uiRenderer.addEventListener('startBot', () => {
         this.startBotGame();
      });

      // Multiplayer game creation
      this.uiRenderer.addEventListener('multiCreate', () => {
         this.createMultiplayerGame();
      });

      // Multiplayer game joining
      this.uiRenderer.addEventListener('multiJoin', event => {
         const {roomId} = event.detail;
         this.joinMultiplayerGame(roomId);
      });

      // Game restart/rematch
      this.uiRenderer.addEventListener('rematchRequest', () => {
         this.requestRematch();
      });

      // Accept rematch
      this.uiRenderer.addEventListener('rematchAccept', () => {
         if (this.networkManager) {
            this.networkManager.acceptRematch();
         }
      });

      // Decline rematch
      this.uiRenderer.addEventListener('rematchDecline', () => {
         if (this.networkManager) {
            this.networkManager.declineRematch();
         }
      });

      // Cancel rematch
      this.uiRenderer.addEventListener('rematchCancel', () => {
         if (this.networkManager) {
            this.networkManager.cancelRematch();
         }
      });

      // Exit game
      this.uiRenderer.addEventListener('exitGame', () => {
         this.leaveMultiplayerGame();
      });
   }

   /**
    * Handle cell click events
    */
   handleCellClick(cellX, cellY) {
      console.log(`Cell clicked: ${cellX}, ${cellY}`);
      console.log('GameLogic available:', !!this.gameLogic);

      if (this.gameLogic) {
         console.log('GameLogic gameMode:', this.gameLogic.gameMode);
         console.log('GameLogic isGameOver:', this.gameLogic.isGameOver);
      }

      // Use GameLogic for move validation and placement
      if (this.gameLogic) {
         const result = this.gameLogic.placeMark(cellX, cellY);
         console.log('placeMark result:', result);
      } else {
         // Fallback to test code if GameLogic isn't available
         const player = Math.random() > 0.5 ? 'X' : 'O';
         const coordKey = `${cellX},${cellY}`;

         // Initialize placedMarks if it doesn't exist
         if (!this.placedMarks) {
            this.placedMarks = new Map();
         }

         // Don't place if cell is already occupied
         if (this.placedMarks.has(coordKey)) {
            console.log('Cell already occupied');
            return;
         }

         // Add the mark
         const markGraphics = this.gridRenderer.addPlayerMark(
            cellX,
            cellY,
            player,
            this.cameraController.scale
         );
         this.placedMarks.set(coordKey, {player, graphics: markGraphics});

         // Highlight the move
         this.gridRenderer.highlightLastMove(cellX, cellY, player);
      }

      // Adjust camera to ensure mark is visible
      if (this.cameraController) {
         this.cameraController.adjustToCell(cellX, cellY);
      }
   }

   /**
    * Get the current game state
    */
   getGameState() {
      return this.gameStateManager ? this.gameStateManager.getState() : null;
   }

   /**
    * Start a single player game
    */
   startSinglePlayerGame() {
      if (this.gameStateManager) {
         this.gameStateManager.startGame('single');
      }
      if (this.gameLogic) {
         this.gameLogic.startGame('single');
      }

      // reset the grid
      if (this.gridRenderer) {
         this.gridRenderer.restart();
         this.gridRenderer.drawGrid(1, 0, 0);
      }
      this.placedMarks = new Map();
   }

   /**
    * Start a bot game
    */
   startBotGame() {
      if (this.gameStateManager) {
         this.gameStateManager.startGame('bot');
      }
      if (this.gameLogic) {
         this.gameLogic.startGame('bot');
      }

      // reset the grid
      if (this.gridRenderer) {
         this.gridRenderer.restart();
         this.gridRenderer.drawGrid(1, 0, 0);
      }
      this.placedMarks = new Map();
   }

   /**
    * Create a multiplayer room
    */
   createMultiplayerGame() {
      if (this.networkManager) {
         return this.networkManager.createRoom();
      }
      return false;
   }

   /**
    * Join a multiplayer room
    * @param {string} roomId - Room ID to join
    */
   joinMultiplayerGame(roomId) {
      if (this.networkManager) {
         return this.networkManager.joinRoom(roomId);
      }
      return false;
   }

   /**
    * Leave current multiplayer game
    */
   leaveMultiplayerGame() {
      if (this.networkManager) {
         this.networkManager.leaveRoom();
      }

      // Reset to menu
      if (this.gameStateManager) {
         this.gameStateManager.resetGame({returnToMenu: true});
      }

      // Reset GameLogic to single player or stop
      if (this.gameLogic) {
         this.gameLogic.resetGame();
      }
   }

   /**
    * Handle rematch request based on current mode
    */
   requestRematch() {
      const currentState = this.getGameState();

      if (!currentState.isGameOver) return;

      switch (currentState.gameMode) {
         case 'single':
            this.startSinglePlayerGame();
            break;
         case 'bot':
            this.startBotGame();
            break;
         case 'multi':
            //idk update status bar or smt
            break;
         default:
            this.leaveMultiplayerGame();
            break;
      }
   }

   /**
    * Get network state
    */
   getNetworkState() {
      return this.networkManager ? this.networkManager.getNetworkState() : null;
   }

   /**
    * Clean up resources
    */
   destroy() {
      // Clean up component instances
      if (this.gridRenderer) {
         this.gridRenderer.destroy();
      }
      if (this.cameraController) {
         this.cameraController.destroy();
      }
      if (this.gameLogic) {
         this.gameLogic.destroy();
      }
      if (this.networkManager) {
         this.networkManager.destroy();
      }
      // Add cleanup for other components as they're added

      if (this.app) {
         this.app.destroy(true);
      }

      // Clean up component classes
      Object.values(this.components).forEach(component => {
         if (component && typeof component.destroy === 'function') {
            component.destroy();
         }
      });
   }
}
