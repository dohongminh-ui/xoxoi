import type {
   GameState,
   GameMode,
   Mark,
   GamePhase,
   ButtonState,
   GameEndReason,
   StateChanges,
   StartGameOptions,
   EndGameResult,
   ResetGameOptions,
   CameraStateUpdate,
   NetworkStateUpdate,
   SetStateOptions,
   GameStats,
   StateInitializedDetail,
   StateChangedDetail,
   GameModeChangedDetail,
   GamePhaseChangedDetail,
   TurnChangeDetail,
   GameEndedDetail,
   MenuStateChangedDetail,
   ButtonStateChangedDetail,
   NetworkStateChangedDetail,
   GameStartedDetail,
   GameEndedEventDetail,
   TurnChangeEventDetail,
   StateRestoredDetail,
   ButtonStates,
   MenuStates,
   GamePhases,
} from '../../types/state';

/**
 * GameStateManager centralizes all game state management
 * Provides a unified interface for accessing and updating game state across components
 */
export class GameStateManager extends EventTarget {
   state: GameState;
   stateHistory: GameState[];
   maxHistorySize: number;

   readonly BUTTON_STATES: ButtonStates;
   readonly MENU_STATES: MenuStates;
   readonly GAME_PHASES: GamePhases;

   constructor() {
      super();

      // Core game state
      this.state = {
         // Game mode and type
         gameMode: null,
         gamePhase: 'menu',

         // Player information
         currentPlayer: 'X',
         playerMark: '',
         isMyTurn: true,

         // Game status
         isGameOver: false,
         isPaused: false,
         winner: null,
         winningCells: null,

         // Multiplayer state
         roomId: '',
         hasOpponent: false,
         isHost: false,

         // Game data
         moveCount: 0,
         gameStartTime: null,
         gameDuration: 0,

         // UI state
         currentMenu: 'main',
         buttonState: null,
         statusMessage: 'toe',
         showMenu: true,

         // Network state
         isConnected: false,
         isReconnecting: false,
         connectionAttempts: 0,

         // Camera/View state
         cameraScale: 1,
         cameraX: 0,
         cameraY: 0,

         // Performance/Debug
         lastUpdate: Date.now(),
         frameCount: 0,
      };

      // State history for undo/replay functionality
      this.stateHistory = [];
      this.maxHistorySize = 50;

      // Button state constants
      this.BUTTON_STATES = {
         IN_GAME: 'in_game',
         GAME_OVER: 'game_over',
         OPPONENT_LEFT: 'opponent_left',
         MENU: 'menu',
         LOBBY: 'lobby',
      };

      // Menu state constants
      this.MENU_STATES = {
         MAIN: 'main',
         LOBBY: 'lobby',
         GAME: 'game',
         SETTINGS: 'settings',
         ABOUT: 'about',
      };

      // Game phase constants
      this.GAME_PHASES = {
         MENU: 'menu',
         LOBBY: 'lobby',
         PLAYING: 'playing',
         PAUSED: 'paused',
         ENDED: 'ended',
      };

      this.initializeState();
   }

   /**
    * Initialize default state
    */
   initializeState() {
      this.state.gameStartTime = Date.now();
      this.state.lastUpdate = Date.now();
      this.dispatchEvent(
         new CustomEvent('stateInitialized', {
            detail: {state: this.getState()} as StateInitializedDetail,
         })
      );
   }

   /**
    * Get current complete state
    * @returns {GameState} Deep copy of current state
    */
   getState(): GameState {
      return JSON.parse(JSON.stringify(this.state));
   }

   /**
    * Get specific state property
    * @param {string} key - State property key (supports dot notation)
    * @returns {unknown} State property value
    */
   get(key: string): unknown {
      if (key.includes('.')) {
         const keys = key.split('.');
         let value: unknown = this.state;

         for (const k of keys) {
            if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
               value = (value as Record<string, unknown>)[k];
            } else {
               return undefined;
            }
         }
         return value;
      }

      return this.state[key as keyof GameState];
   }

   /**
    * Set state properties
    * @param {Partial<GameState>|string} keyOrState - Either state object or property key
    * @param {unknown} value - Value (if first param is key)
    * @param {SetStateOptions} options - Update options
    */
   set(
      keyOrState: Partial<GameState> | string,
      value: unknown = undefined,
      options: SetStateOptions = {}
   ) {
      const {silent = false, saveToHistory = true, merge = true} = options;

      // Save current state to history before changes
      if (saveToHistory) {
         this.saveToHistory();
      }

      const oldState = this.getState();
      const changes: StateChanges = {};

      if (typeof keyOrState === 'string') {
         // Single property update
         if (keyOrState.includes('.')) {
            // Dot notation support
            const keys = keyOrState.split('.');
            let current: Record<string, unknown> = this.state as Record<string, unknown>;

            for (let i = 0; i < keys.length - 1; i++) {
               const k = keys[i]!;
               if (!current[k] || typeof current[k] !== 'object') {
                  current[k] = {};
               }
               current = current[k] as Record<string, unknown>;
            }

            const lastKey = keys[keys.length - 1]!;
            const oldValue = current[lastKey];
            current[lastKey] = value;
            changes[keyOrState] = {from: oldValue, to: value};
         } else {
            const oldValue = this.state[keyOrState as keyof GameState];
            (this.state as Record<string, unknown>)[keyOrState] = value;
            changes[keyOrState] = {from: oldValue, to: value};
         }
      } else if (keyOrState && typeof keyOrState === 'object') {
         // Multiple properties update
         for (const [key, val] of Object.entries(keyOrState)) {
            const oldValue = this.state[key as keyof GameState];
            const currentValue = this.state[key as keyof GameState];

            const newValue =
               merge &&
               typeof val === 'object' &&
               val !== null &&
               typeof currentValue === 'object' &&
               currentValue !== null &&
               !Array.isArray(val)
                  ? {
                       ...(currentValue as Record<string, unknown>),
                       ...(val as Record<string, unknown>),
                    }
                  : val;

            (this.state as Record<string, unknown>)[key] = newValue;
            changes[key] = {from: oldValue, to: newValue};
         }
      }

      // Update timestamp
      this.state.lastUpdate = Date.now();

      if (!silent) {
         this.dispatchEvent(
            new CustomEvent('stateChanged', {
               detail: {
                  changes,
                  oldState,
                  newState: this.getState(),
               } as StateChangedDetail,
            })
         );

         // Emit specific events for major state changes
         this.emitSpecificStateEvents(changes);
      }
   }

   /**
    * Emit specific events for major state changes
    * @param {StateChanges} changes - Changes that occurred
    */
   emitSpecificStateEvents(changes: StateChanges) {
      const state = this.getState();
      // Game mode changes
      if (changes.gameMode) {
         this.dispatchEvent(
            new CustomEvent('stateGameModeChanged', {
               detail: {
                  from: changes.gameMode.from as GameMode,
                  to: changes.gameMode.to as GameMode,
                  state,
               } as GameModeChangedDetail,
            })
         );
      }

      // Game phase changes
      if (changes.gamePhase) {
         this.dispatchEvent(
            new CustomEvent('stateGamePhaseChanged', {
               detail: {
                  from: changes.gamePhase.from as GamePhase,
                  to: changes.gamePhase.to as GamePhase,
                  state,
               } as GamePhaseChangedDetail,
            })
         );
      }

      // Player turn changes
      if (changes.currentPlayer || changes.isMyTurn) {
         this.dispatchEvent(
            new CustomEvent('turnChange', {
               detail: {
                  currentPlayer: this.state.currentPlayer,
                  isMyTurn: this.state.isMyTurn,
                  state,
               } as TurnChangeDetail,
            })
         );
      }

      // Game over state
      if (changes.isGameOver && this.state.isGameOver) {
         this.dispatchEvent(
            new CustomEvent('stateGameEnded', {
               detail: {
                  winner: this.state.winner,
                  winningCells: this.state.winningCells,
                  state,
               } as GameEndedDetail,
            })
         );
      }

      // Menu state changes
      if (changes.currentMenu || changes.showMenu) {
         this.dispatchEvent(
            new CustomEvent('stateMenuStateChanged', {
               detail: {
                  currentMenu: this.state.currentMenu,
                  showMenu: this.state.showMenu,
                  state,
               } as MenuStateChangedDetail,
            })
         );
      }

      // Button state changes
      if (changes.buttonState) {
         this.dispatchEvent(
            new CustomEvent('stateButtonStateChanged', {
               detail: {
                  from: changes.buttonState.from as ButtonState | null,
                  to: changes.buttonState.to as ButtonState | null,
                  state,
               } as ButtonStateChangedDetail,
            })
         );
      }

      // Network state changes
      if (changes.isConnected || changes.isReconnecting) {
         this.dispatchEvent(
            new CustomEvent('stateNetworkStateChanged', {
               detail: {
                  isConnected: this.state.isConnected,
                  isReconnecting: this.state.isReconnecting,
                  connectionAttempts: this.state.connectionAttempts,
                  state,
               } as NetworkStateChangedDetail,
            })
         );
      }
   }

   /**
    * Start a new game with specified mode
    * @param {GameMode} mode - Game mode ('single', 'bot', 'multi')
    * @param {StartGameOptions} options - Game options
    */
   startGame(mode: 'single' | 'bot' | 'multi', options: StartGameOptions = {}) {
      const {
         playerMark = 'X',
         roomId = '',
         isMyTurn = true,
         hasOpponent = false,
         isHost = false,
      } = options;

      this.set({
         gameMode: mode,
         gamePhase: this.GAME_PHASES.PLAYING,
         currentPlayer: 'X',
         playerMark: mode === 'multi' ? playerMark : '',
         isMyTurn,
         isGameOver: false,
         isPaused: false,
         winner: null,
         winningCells: null,
         roomId: mode === 'multi' ? roomId : '',
         hasOpponent: mode === 'multi' ? hasOpponent : false,
         isHost: mode === 'multi' ? isHost : false,
         moveCount: 0,
         gameStartTime: Date.now(),
         currentMenu: this.MENU_STATES.GAME,
         buttonState: this.BUTTON_STATES.IN_GAME,
         statusMessage: this.getStatusMessage(mode, 'X', isMyTurn),
         showMenu: false,
      });

      let modeString = '';

      switch (this.state.gameMode) {
         case 'single':
            modeString = 'Single Player mode';
            break;
         case 'bot':
            modeString = 'Bot mode';
            break;
         case 'multi':
            modeString = `Multiplayer (Room: ${this.state.roomId})`;
            break;
         default:
            modeString = 'Unknown mode';
            break;
      }

      this.dispatchEvent(
         new CustomEvent('gameStarted', {
            detail: {
               mode: modeString,
            } as GameStartedDetail,
         })
      );
   }

   /**
    * End the current game
    * @param {EndGameResult} result - Game result
    */
   endGame(result: EndGameResult = {}) {
      const {winner = null, winningCells = null, reason = 'completed'} = result;

      this.set({
         isGameOver: true,
         gamePhase: this.GAME_PHASES.ENDED,
         winner,
         winningCells,
         gameDuration: Date.now() - (this.state.gameStartTime || Date.now()),
         buttonState: this.BUTTON_STATES.GAME_OVER,
         statusMessage: this.getGameEndMessage(winner, reason),
      });

      this.dispatchEvent(
         new CustomEvent('gameEnded', {
            detail: {
               winner,
               reason,
            } as GameEndedEventDetail,
         })
      );
   }

   /**
    * Switch player turns
    */
   switchTurn() {
      const newPlayer: Mark = this.state.currentPlayer === 'X' ? 'O' : 'X';
      this.set({
         currentPlayer: newPlayer,
         isMyTurn: this.state.gameMode === 'multi' ? newPlayer === this.state.playerMark : true,
         statusMessage: this.getStatusMessage(
            this.state.gameMode,
            newPlayer,
            this.state.gameMode === 'multi' ? newPlayer === this.state.playerMark : true
         ),
      });
   }

   /**
    * Reset game state
    * @param {ResetGameOptions} options - Reset options
    */
   resetGame(options: ResetGameOptions = {}) {
      const {
         clearAll = false,
         keepNetworkState = true,
         keepCameraState = true,
         returnToMenu = false,
      } = options;

      const newState: Partial<GameState> = {
         gameMode: returnToMenu ? null : this.state.gameMode,
         gamePhase: returnToMenu ? this.GAME_PHASES.MENU : this.GAME_PHASES.PLAYING,
         currentPlayer: 'X',
         isMyTurn: this.state.gameMode === 'multi' ? this.state.playerMark === 'X' : true,
         isGameOver: false,
         isPaused: false,
         winner: null,
         winningCells: null,
         moveCount: 0,
         gameStartTime: Date.now(),
         currentMenu: returnToMenu ? this.MENU_STATES.MAIN : this.MENU_STATES.GAME,
         buttonState: returnToMenu ? this.BUTTON_STATES.MENU : this.BUTTON_STATES.IN_GAME,
         statusMessage: returnToMenu
            ? 'toe'
            : this.getStatusMessage(
                 this.state.gameMode,
                 'X',
                 this.state.gameMode === 'multi' ? this.state.playerMark === 'X' : true
              ),
         showMenu: returnToMenu,
      };

      if (!keepNetworkState || clearAll) {
         newState.roomId = '';
         newState.hasOpponent = false;
         newState.isHost = false;
         newState.playerMark = '';
         newState.isConnected = false;
         newState.isReconnecting = false;
         newState.connectionAttempts = 0;
      }

      if (!keepCameraState || clearAll) {
         newState.cameraScale = 1;
         newState.cameraX = 0;
         newState.cameraY = 0;
      }

      this.set(newState);
   }

   /**
    * Update camera state
    * @param {CameraStateUpdate} cameraState - Camera state update
    */
   updateCamera(cameraState: CameraStateUpdate) {
      this.set(
         {
            cameraScale: cameraState.scale ?? this.state.cameraScale,
            cameraX: cameraState.x ?? this.state.cameraX,
            cameraY: cameraState.y ?? this.state.cameraY,
         },
         undefined,
         {silent: true}
      ); // Silent to avoid excessive events
   }

   /**
    * Update network state
    * @param {NetworkStateUpdate} networkState - Network state update
    */
   updateNetwork(networkState: NetworkStateUpdate) {
      this.set(networkState);
   }

   /**
    * Get appropriate status message
    * @param {GameMode} gameMode - Current game mode
    * @param {Mark} currentPlayer - Current player
    * @param {boolean} isMyTurn - Whether it's my turn
    * @returns {string} Status message
    */
   getStatusMessage(gameMode: GameMode, currentPlayer: Mark, isMyTurn: boolean): string {
      if (!gameMode) return 'toe';

      switch (gameMode) {
         case 'single':
            return `${currentPlayer}'s turn`;
         case 'bot':
            return currentPlayer === 'X' ? 'Your turn' : 'Bot is thinking...';
         case 'multi':
            if (!this.state.hasOpponent) {
               return `Room ID: ${this.state.roomId} - Waiting for opponent...`;
            }
            return isMyTurn
               ? `(${this.state.playerMark}) Your turn`
               : `(${this.state.playerMark === 'X' ? 'O' : 'X'}) Opponent's turn`;
         default:
            return 'toe';
      }
   }

   /**
    * Get game end message
    * @param {Mark | null} winner - Game winner
    * @param {GameEndReason} reason - End reason
    * @returns {string} End message
    */
   getGameEndMessage(winner: Mark | null, reason: GameEndReason): string {
      if (!winner) {
         switch (reason) {
            case 'draw':
               return 'Game ended in a draw!';
            case 'abandoned':
               return 'Game abandoned';
            case 'opponent_left':
               return 'Opponent left the game';
            default:
               return 'Game ended';
         }
      }

      switch (this.state.gameMode) {
         case 'single':
            return `${winner} wins!`;
         case 'bot':
            return winner === 'X' ? 'You win!' : 'Bot wins!';
         case 'multi':
            return winner === this.state.playerMark ? 'You win!' : 'Opponent wins!';
         default:
            return `${winner} wins!`;
      }
   }

   /**
    * Save current state to history
    */
   saveToHistory() {
      this.stateHistory.push(this.getState());

      // Limit history size
      if (this.stateHistory.length > this.maxHistorySize) {
         this.stateHistory.shift();
      }
   }

   /**
    * Restore state from history
    * @param {number} stepsBack - Number of steps to go back (default: 1)
    * @returns {boolean} Success
    */
   restoreFromHistory(stepsBack: number = 1): boolean {
      if (this.stateHistory.length < stepsBack) {
         return false;
      }

      const targetIndex = this.stateHistory.length - stepsBack;
      const targetState = this.stateHistory[targetIndex];

      if (!targetState) {
         return false;
      }

      // Remove history entries after the target
      this.stateHistory.splice(targetIndex);

      // Restore state
      this.state = JSON.parse(JSON.stringify(targetState));
      this.state.lastUpdate = Date.now();

      this.dispatchEvent(
         new CustomEvent('stateRestored', {
            detail: {
               stepsBack,
               state: this.getState(),
            } as StateRestoredDetail,
         })
      );

      return true;
   }

   /**
    * Get state history
    * @returns {GameState[]} State history
    */
   getHistory(): GameState[] {
      return [...this.stateHistory];
   }

   /**
    * Clear state history
    */
   clearHistory() {
      this.stateHistory = [];
   }

   /**
    * Check if game is in progress
    * @returns {boolean} True if game is active
    */
   isGameActive(): boolean {
      return (
         this.state.gamePhase === this.GAME_PHASES.PLAYING &&
         !this.state.isGameOver &&
         !this.state.isPaused
      );
   }

   /**
    * Check if it's the current player's turn
    * @returns {boolean} True if it's current player's turn
    */
   isCurrentPlayerTurn(): boolean {
      return this.state.isMyTurn && this.isGameActive();
   }

   /**
    * Check if in multiplayer mode
    * @returns {boolean} True if multiplayer
    */
   isMultiplayer(): boolean {
      return this.state.gameMode === 'multi';
   }

   /**
    * Get game statistics
    * @returns {GameStats} Game stats
    */
   getGameStats(): GameStats {
      return {
         gameMode: this.state.gameMode,
         duration: this.state.gameDuration || Date.now() - (this.state.gameStartTime || Date.now()),
         moveCount: this.state.moveCount,
         isGameOver: this.state.isGameOver,
         winner: this.state.winner,
         currentPlayer: this.state.currentPlayer,
      };
   }

   /**
    * Increment move count
    */
   incrementMoveCount() {
      this.set({moveCount: this.state.moveCount + 1});
   }

   /**
    * Clean up resources
    */
   destroy() {
      this.clearHistory();
      this.state = {} as GameState;
   }
}
