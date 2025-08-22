import {GAME_CONSTANTS} from './constants';
import type {
   GridRendererLike,
   CameraControllerLike,
   GameLogicLike,
   NetworkManagerLike,
   GameStateManagerLike,
   UIRendererLike,
   PlacedMarksMap,
   GameStateShape,
   Mark,
   GameMode,
   CameraUpdateEvent,
   DragStartEvent,
   CellClickEvent,
   PointerMoveEvent,
   MoveAttemptedEvent,
   MovePlacedEvent,
   GameWonEvent,
   GameDrawEvent,
   StateChangedEvent,
   NetworkEvent,
   GameStateEvent,
   UIEvent,
   ComponentClasses,
} from '../../types/engine';

/**
 * Main game engine that orchestrates all game components
 * Might need more optimization as components are added
 */
export class GameEngine {
   // Core PIXI objects
   app: PIXI.Application | undefined;
   gridContainer: PIXI.Container | undefined;

   // Component instances
   gridRenderer: GridRendererLike | undefined;
   cameraController: CameraControllerLike | undefined;
   inputHandler?: unknown; // Define proper interface when InputHandler is created
   gameLogic: GameLogicLike | undefined;
   networkManager: NetworkManagerLike | undefined;
   botController?: unknown; // Define proper interface when BotController is created
   gameStateManager: GameStateManagerLike | undefined;
   uiRenderer: UIRendererLike | undefined;

   // Dynamic component class registry
   components: ComponentClasses;

   // Tracking of placed marks on the grid (used by hover/highlight logic)
   placedMarks: PlacedMarksMap | undefined;

   constructor() {
      this.app = undefined;
      this.gridContainer = undefined;

      // Component instances
      this.gridRenderer = undefined;
      this.cameraController = undefined;
      this.inputHandler = undefined;
      this.gameLogic = undefined;
      this.networkManager = undefined;
      this.botController = undefined;
      this.gameStateManager = undefined;
      this.uiRenderer = undefined;

      // Component classes (to be imported as we create them)
      this.components = {};
   }

   /**
    * Initialize the game engine and all components
    */
   async init(): Promise<void> {
      this.setupPixiApplication();
      await this.loadComponents();
      this.initializeComponents();
      this.setupEventListeners();
      this.startGameLoop();
   }

   /**
    * Set up the main PIXI application
    */
   setupPixiApplication(): void {
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
   async loadComponents(): Promise<void> {
      console.log('Loading components...');

      // Load GridRenderer component
      try {
         const {GridRenderer} = await import('../rendering/GridRenderer');
         this.components.GridRenderer = GridRenderer;
         console.log('GridRenderer loaded successfully');
      } catch (error) {
         console.warn('Failed to load GridRenderer:', error);
      }

      // Load CameraController component
      try {
         const {CameraController} = await import('../input/CameraController');
         this.components.CameraController = CameraController;
         console.log('CameraController loaded successfully');
      } catch (error) {
         console.warn('Failed to load CameraController:', error);
      }

      // Load GameLogic component
      try {
         const {GameLogic} = await import('../game/GameLogic');
         this.components.GameLogic = GameLogic;
         console.log('GameLogic loaded successfully');
      } catch (error) {
         console.warn('Failed to load GameLogic:', error);
      }

      // Load NetworkManager component
      try {
         const {NetworkManager} = await import('../network/NetworkManager');
         this.components.NetworkManager = NetworkManager;
         console.log('NetworkManager loaded successfully');
      } catch (error) {
         console.warn('Failed to load NetworkManager:', error);
      }

      // Load GameStateManager component
      try {
         const {GameStateManager} = await import('../game/GameStateManager');
         // Cast to align the concrete class with the structural interface expected by ComponentClasses
         this.components.GameStateManager =
            GameStateManager as unknown as new () => GameStateManagerLike;
         console.log('GameStateManager loaded successfully');
      } catch (error) {
         console.warn('Failed to load GameStateManager:', error);
      }

      // Load UIRenderer component
      try {
         const {UIRenderer} = await import('../rendering/UIRenderer');
         this.components.UIRenderer = UIRenderer;
         console.log('UIRenderer loaded successfully');
      } catch (error) {
         console.warn('Failed to load UIRenderer:', error);
      }

      // Future components will be loaded here as they're created
      // this.components.InputHandler = (await import('../input/InputHandler')).InputHandler;
      // this.components.BotController = (await import('../game/BotController')).BotController;
   }

   /**
    * Initialize all game components
    */
   initializeComponents(): void {
      // Initialize GridRenderer if available
      if (this.components.GridRenderer && this.app && this.gridContainer) {
         this.gridRenderer = new this.components.GridRenderer(this.app, this.gridContainer);
         console.log('GridRenderer initialized');
      }

      // Initialize CameraController if available
      if (this.components.CameraController && this.app && this.gridContainer) {
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
         this.uiRenderer?.initialize();
         console.log('UIRenderer initialized');

         // Setup UI event listeners
         this.setupUIEventListeners();
      }

      // Draw initial grid after components are ready
      if (this.gridRenderer) {
         this.gridRenderer.drawGrid(1, 0, 0); // scale=1, gridX=0, gridY=0
      }
   }

   /**
    * Set up global event listeners
    */
   setupEventListeners(): void {
      // Window resize handler
      window.addEventListener('resize', () => {
         if (!this.app) return;
         // Use the ambient RendererLike which exposes an optional resize method
         this.app.renderer?.resize?.(window.innerWidth, window.innerHeight);
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
   startGameLoop(): void {
      // PIXI's ticker will handle the main loop
      // Components can hook into this via the app.ticker
      console.log('Game engine initialized and running');
   }

   /**
    * Setup camera event listeners to coordinate between components
    */
   setupCameraEventListeners(): void {
      if (!this.cameraController || !this.gridRenderer) return;

      // Listen for camera updates to redraw grid
      this.cameraController.addEventListener('cameraUpdate', (event: Event) => {
         const cameraEvent = event as CameraUpdateEvent;
         const {scale, x, y} = cameraEvent.detail;
         this.gridRenderer?.drawGrid(scale, x, y);
      });

      let placeX = 0;
      let placeY = 0;
      // Listen for mouse down
      this.cameraController.addEventListener('dragStart', (event: Event) => {
         const dragEvent = event as DragStartEvent;
         const {cellX, cellY} = dragEvent.detail;
         placeX = cellX;
         placeY = cellY;
      });

      // Listen for cell clicks
      this.cameraController.addEventListener('cellClick', () => {
         this.handleCellClick(placeX, placeY);
      });

      // Listen for pointer moves to update hover
      this.cameraController.addEventListener('pointerMove', (event: Event) => {
         const pointerEvent = event as PointerMoveEvent;
         const {event: pointerEventDetail, isDragging, hasMoved} = pointerEvent.detail;
         const cameraState = this.cameraController?.getCameraState?.();

         // Get real game state
         let gameState: GameStateShape = this.gameLogic
            ? this.gameLogic.getGameState?.() || {}
            : {
                 isGameOver: false,
                 gameMode: 'single',
                 isMyTurn: true,
              };

         // If GameStateManager exists, enrich with phase/menu/isGameActive
         if (this.gameStateManager) {
            const gsmState = this.gameStateManager.getState();
            const enriched: Partial<GameStateShape> = {...gameState};
            if (gsmState.gamePhase !== undefined) enriched.gamePhase = gsmState.gamePhase;
            if (gsmState.showMenu !== undefined) enriched.showMenu = gsmState.showMenu;
            enriched.isGameActive = this.gameStateManager.isGameActive();
            gameState = enriched as GameStateShape;
         }

         this.gridRenderer?.updateHoverCell(
            pointerEventDetail,
            cameraState?.scale ?? 1,
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
   setupGameLogicEventListeners(): void {
      if (!this.gameLogic) return;

      // Listen for move attempts
      this.gameLogic.addEventListener('moveAttempted', (event: Event) => {
         const moveEvent = event as MoveAttemptedEvent;
         const {x, y, player, success, reason} = moveEvent.detail;
         console.log(`Move attempt: ${player} at (${x}, ${y}) - ${success ? 'Success' : reason}`);
      });

      // Listen for successful moves
      this.gameLogic.addEventListener('movePlaced', (event: Event) => {
         const moveEvent = event as MovePlacedEvent;
         const {cellX, cellY, player} = moveEvent.detail;

         // Update the visual representation
         if (this.gridRenderer && this.cameraController) {
            const scale = this.cameraController?.getCameraState?.()?.scale ?? 1;

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
         this.gameStateManager?.switchTurn?.();
      });

      // Listen for wins
      this.gameLogic.addEventListener('gameWon', async (event: Event) => {
         const winEvent = event as GameWonEvent;
         const {winner, winningCells} = winEvent.detail;
         console.log(`Game won by ${winner}!`, 'Winning cells:', winningCells);

         // end the game after win
         this.gameStateManager?.endGame?.({
            winner,
            winningCells,
            reason: 'completed',
         });

         this.gameLogic?.dispatchEvent(new CustomEvent('gameEnded'));

         if (this.gridRenderer?.animateWinningLine) {
            await this.gridRenderer.animateWinningLine(winningCells);
         }
      });

      // Listen for draws
      this.gameLogic.addEventListener('gameDraw', (event: Event) => {
         const drawEvent = event as GameDrawEvent;
         console.log('Game ended in a draw!');

         // end the game after draw
         this.gameStateManager?.endGame?.({
            winner: null,
            winningCells: null,
            reason: 'completed',
         });

         this.gameLogic?.dispatchEvent(new CustomEvent('gameEnded'));
      });

      // Listen for game state changes
      this.gameLogic.addEventListener('stateChanged', (event: Event) => {
         const stateEvent = event as StateChangedEvent;
         const {gameState} = stateEvent.detail;
         console.log('Game state changed:', gameState);
      });
   }

   /**
    * Set up NetworkManager event listeners
    */
   setupNetworkEventListeners(): void {
      if (!this.networkManager) return;

      // Connection events
      this.networkManager.addEventListener('connected', (event: Event) => {
         const networkEvent = event as NetworkEvent;
         console.log('Network connected:', networkEvent.detail);
      });

      this.networkManager.addEventListener('disconnected', (event: Event) => {
         const networkEvent = event as NetworkEvent;
         console.log('Network disconnected:', networkEvent.detail);
      });

      this.networkManager.addEventListener('reconnected', (event: Event) => {
         const networkEvent = event as NetworkEvent;
         console.log('Network reconnected after', networkEvent.detail.attempts, 'attempts');
      });

      this.networkManager.addEventListener('reconnectFailed', (event: Event) => {
         console.log('Network reconnection failed');
      });

      // Room events
      this.networkManager.addEventListener('roomCreated', (event: Event) => {
         const networkEvent = event as NetworkEvent;
         const {roomId, playerMark, inviteUrl} = networkEvent.detail;
         console.log('Room created:', roomId, 'Player mark:', playerMark);

         // Switch GameLogic to multiplayer mode
         if (this.gameLogic && playerMark) {
            this.gameLogic.startGame('multi', {
               playerMark,
               roomId,
               isMyTurn: playerMark === 'X',
               hasOpponent: false,
            });
         }
      });

      this.networkManager.addEventListener('gameJoined', (event: Event) => {
         const networkEvent = event as NetworkEvent;
         const {roomId, playerMark, isMyTurn} = networkEvent.detail;
         console.log('Joined game:', roomId, 'Player mark:', playerMark);

         // Switch GameLogic to multiplayer mode
         if (this.gameLogic && playerMark) {
            this.gameLogic.startGame('multi', {
               playerMark,
               roomId,
               isMyTurn,
               hasOpponent: true,
            });
         }
      });

      this.networkManager.addEventListener('opponentJoined', () => {
         console.log('Opponent joined');

         // Update GameLogic state
         if (this.gameLogic) {
            this.gameLogic?.updateGameState?.({hasOpponent: true});
         }
      });

      this.networkManager.addEventListener('opponentLeft', () => {
         console.log('Opponent left');

         // Update GameLogic state
         // TODO: unless opponent leaves on will, disconnected opponent can rejoin the room
         if (this.gameLogic) {
            this.gameLogic?.updateGameState?.({
               hasOpponent: false,
               isGameOver: true,
            });
         }
      });

      // Move synchronization
      this.networkManager.addEventListener('moveReceived', (event: Event) => {
         const networkEvent = event as NetworkEvent;
         const {cellX, cellY, player, isMyTurn} = networkEvent.detail;
         console.log('Move received:', cellX, cellY, 'by', player);

         // Execute the move in GameLogic
         if (this.gameLogic && cellX !== undefined && cellY !== undefined && player) {
            this.gameLogic?.executeMove?.(cellX, cellY, player);
            if (typeof isMyTurn === 'boolean') {
               this.gameLogic?.updateGameState?.({isMyTurn});
            }
         }
      });

      // Listen for multiplayer moves from GameLogic
      if (this.gameLogic) {
         this.gameLogic.addEventListener('multiplayerMove', (event: Event) => {
            const moveEvent = event as MovePlacedEvent;
            const {cellX, cellY} = moveEvent.detail;
            this.networkManager?.sendMove?.(cellX, cellY);
         });
      }

      // Error handling
      this.networkManager.addEventListener('error', (event: Event) => {
         const networkEvent = event as NetworkEvent;
         console.error('Network error:', networkEvent.detail.error);
      });

      this.networkManager.addEventListener('roomNotFound', (event: Event) => {
         const networkEvent = event as NetworkEvent;
         console.warn('Room not found:', networkEvent.detail.roomId);
      });
   }

   /**
    * Set up GameStateManager event listeners
    */
   setupGameStateEventListeners(): void {
      if (!this.gameStateManager) return;

      // Listen for game mode changes
      this.gameStateManager.addEventListener('stateGameModeChanged', (event: Event) => {
         const stateEvent = event as GameStateEvent;
         const {from, to} = stateEvent.detail;
         console.log(`Game mode changed from ${from} to ${to}`);
      });

      // Listen for game phase changes
      this.gameStateManager.addEventListener('stateGamePhaseChanged', (event: Event) => {
         const stateEvent = event as GameStateEvent;
         const {from, to} = stateEvent.detail;
         console.log(`Game phase changed from ${from} to ${to}`);
         if (this.gridRenderer) {
            this.gridRenderer.clearHover();
         }
      });

      // Listen for turn changes
      this.gameStateManager.addEventListener('turnChange', (event: Event) => {
         const stateEvent = event as GameStateEvent;
         const {currentPlayer, isMyTurn} = stateEvent.detail;
         console.log(`Turn changed: ${currentPlayer} (my turn: ${isMyTurn})`);
      });

      // Listen for game end
      this.gameStateManager.addEventListener('gameEnded', (event: Event) => {
         const stateEvent = event as GameStateEvent;
         const {winner} = stateEvent.detail;
         console.log(`Game ended. Winner: ${winner || 'Draw'}`);
         if (this.gridRenderer) {
            this.gridRenderer.clearHover();
         }
      });

      // Listen for menu state changes
      this.gameStateManager.addEventListener('stateMenuStateChanged', (event: Event) => {
         const stateEvent = event as GameStateEvent;
         const {currentMenu, showMenu} = stateEvent.detail;
         console.log(`Menu state changed: ${currentMenu} (visible: ${showMenu})`);
         if (this.gridRenderer) {
            this.gridRenderer.clearHover();
         }
      });

      // Listen for button state changes
      this.gameStateManager.addEventListener('stateButtonStateChanged', (event: Event) => {
         const stateEvent = event as GameStateEvent;
         const {from, to} = stateEvent.detail;
         console.log(`Button state changed from ${from} to ${to}`);
      });

      // Listen for network state changes
      this.gameStateManager.addEventListener('stateNetworkStateChanged', (event: Event) => {
         const stateEvent = event as GameStateEvent;
         const {isConnected, isReconnecting} = stateEvent.detail;
         console.log(`Network state: connected=${isConnected}, reconnecting=${isReconnecting}`);
      });
   }

   /**
    * Setup UI event listeners
    */
   setupUIEventListeners(): void {
      if (!this.uiRenderer) return;

      // Single player game
      this.uiRenderer.addEventListener('startSingle', () => this.startSinglePlayerGame());

      // Bot game
      this.uiRenderer.addEventListener('startBot', () => this.startBotGame());

      // Multiplayer game creation
      this.uiRenderer.addEventListener('multiCreate', () => this.createMultiplayerGame());

      // Multiplayer game joining
      this.uiRenderer.addEventListener('multiJoin', (event: Event) => {
         const uiEvent = event as UIEvent;
         const {roomId} = uiEvent.detail;
         if (roomId) {
            this.joinMultiplayerGame(roomId);
         }
      });

      // Game restart/rematch
      this.uiRenderer.addEventListener('rematchRequest', () => this.gameLogic?.requestRematch?.());

      // Accept rematch
      this.uiRenderer.addEventListener('rematchAccept', () =>
         this.networkManager?.acceptRematch?.()
      );

      // Decline rematch
      this.uiRenderer.addEventListener('rematchDecline', () =>
         this.networkManager?.declineRematch?.()
      );

      // Cancel rematch
      this.uiRenderer.addEventListener('rematchCancel', () =>
         this.networkManager?.cancelRematch?.()
      );

      // Exit game
      this.uiRenderer.addEventListener('exitGame', () => {
         this.leaveMultiplayerGame();
      });
   }

   /**
    * Handle cell click events
    */
   handleCellClick(cellX: number, cellY: number): boolean {
      try {
         let gameEnded = false;
         if (this.gameStateManager) {
            const state = this.gameStateManager.getState();
            gameEnded = !!(
               state?.isGameOver ||
               (this.gameStateManager?.GAME_PHASES?.ENDED &&
                  state?.gamePhase === this.gameStateManager.GAME_PHASES.ENDED)
            );
         } else if (this.gameLogic) {
            gameEnded = !!this.gameLogic.isGameOver;
         }
         if (gameEnded) {
            console.log('Cell click ignored: game has ended');
            return false;
         }
      } catch (e) {
         // Non-fatal; proceed with best effort
      }

      let moveSucceeded = false;

      // Use GameLogic for move validation and placement
      if (this.gameLogic) {
         const result = this.gameLogic?.placeMark?.(cellX, cellY);
         console.log('placeMark result:', result);
         moveSucceeded = !!result?.success;
      } else {
         // Fallback to test code if GameLogic isn't available
         const player: Mark = Math.random() > 0.5 ? 'X' : 'O';
         const coordKey = `${cellX},${cellY}`;

         // Initialize placedMarks if it doesn't exist
         if (!this.placedMarks) {
            this.placedMarks = new Map();
         }

         // Don't place if cell is already occupied
         if (this.placedMarks.has(coordKey)) {
            console.log('Cell already occupied');
            return false;
         }

         // Add the mark
         const markGraphics = this.gridRenderer?.addPlayerMark(
            cellX,
            cellY,
            player,
            this.cameraController?.scale ?? 1
         );
         this.placedMarks.set(coordKey, {player, graphics: markGraphics});

         // Highlight the move
         this.gridRenderer?.highlightLastMove(cellX, cellY, player);

         moveSucceeded = true;
      }

      // Adjust camera to ensure mark is visible
      if (moveSucceeded && this.cameraController) {
         this.cameraController.adjustToCell(cellX, cellY);
      }

      return moveSucceeded;
   }

   /**
    * Get the current game state
    */
   getGameState(): GameStateShape | null {
      return this.gameStateManager ? this.gameStateManager.getState() : null;
   }

   /**
    * Start a single player game
    */
   startSinglePlayerGame(): void {
      this.gameStateManager?.startGame('single');
      this.gameLogic?.startGame('single');
      this.gridRenderer?.restart?.();
      this.cameraController?.resetCamera?.();
      this.placedMarks = new Map();
   }

   /**
    * Start a bot game
    */
   startBotGame(): void {
      this.gameStateManager?.startGame('bot');
      this.gameLogic?.startGame('bot');
      this.gridRenderer?.restart?.();
      this.cameraController?.resetCamera?.();
      this.placedMarks = new Map();
   }

   /**
    * Create a multiplayer room
    */
   createMultiplayerGame(): boolean {
      if (this.networkManager) {
         return this.networkManager.createRoom();
      }
      return false;
   }

   /**
    * Join a multiplayer room
    * @param {string} roomId - Room ID to join
    */
   joinMultiplayerGame(roomId: string): boolean {
      if (this.networkManager) {
         return this.networkManager.joinRoom(roomId);
      }
      return false;
   }

   /**
    * Leave current multiplayer game
    */
   leaveMultiplayerGame(): void {
      if (this.networkManager) {
         this.networkManager.leaveRoom();
      }

      // Reset to menu
      if (this.gameStateManager) {
         this.gameStateManager?.resetGame?.({returnToMenu: true});
      }

      // Reset GameLogic to single player or stop
      if (this.gameLogic) {
         this.gameLogic?.resetGame?.();
      }
   }

   /**
    * Get network state
    */
   getNetworkState(): unknown {
      return this.networkManager ? this.networkManager.getNetworkState?.() : null;
   }

   /**
    * Clean up resources
    */
   destroy(): void {
      // Clean up component instances
      if (this.gridRenderer) {
         this.gridRenderer.destroy?.();
      }
      if (this.cameraController) {
         this.cameraController.destroy?.();
      }
      if (this.gameLogic) {
         this.gameLogic.destroy?.();
      }
      if (this.networkManager) {
         this.networkManager.destroy?.();
      }
      // Add cleanup for other components as they're added

      if (this.app) {
         this.app.destroy(true);
      }

      // Clean up component classes
      this.components = {};
   }
}
