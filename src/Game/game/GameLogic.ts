import {WINNING_LENGTH} from '../core/constants';
import {coordKey, parseCoordKey} from '../core/utils';
import type {Mark, MoveRecord, PotentialWinLine} from '../../types/engine';
import type {
   GameStartOptions,
   PlacedMarkEntry,
   Bounds,
   MoveValidationResult,
   PlaceMarkResult,
   GameLogicState,
} from '../../types/logic';
import type {GameMode} from '../../types/state';

/**
 * GameLogic handles all game rules, validation, and state management
 * Including move placement, win detection, turn management, and game state
 */

export class GameLogic extends EventTarget {
   gameMode: GameMode | null;
   currentPlayer: Mark;
   isGameOver: boolean;
   playerMark: Mark | '';
   roomId: string;
   isMyTurn: boolean;
   hasOpponent: boolean;
   placedMarks: Map<string, PlacedMarkEntry>;
   potentialWins: Map<string, PotentialWinLine>;
   winningCells: Array<[number, number]> | null;
   moveHistory: Array<MoveRecord>;
   constructor() {
      super();

      // Game state
      this.gameMode = null; // 'null', 'single', 'bot', 'multi'
      this.currentPlayer = 'X';
      this.isGameOver = false;
      this.playerMark = ''; // For multiplayer
      this.roomId = ''; // For multiplayer
      this.isMyTurn = false; // For multiplayer
      this.hasOpponent = false; // For multiplayer

      // Game data
      this.placedMarks = new Map(); // coordKey -> { player, coords, timestamp }
      this.potentialWins = new Map(); // For AI analysis
      this.winningCells = null;
      this.moveHistory = []; // Array of moves for replay/undo
   }

   /**
    * Start a new game
    * @param {string} mode - Game mode: 'single', 'bot', or 'multi'
    * @param {Object} options - Additional options for the game mode
    */
   startGame(mode: 'single' | 'bot' | 'multi', options: GameStartOptions = {}) {
      this.resetGame();
      this.gameMode = mode;

      switch (mode) {
         case 'single':
            this.currentPlayer = 'X';
            this.isMyTurn = true;
            break;

         case 'bot':
            this.currentPlayer = 'X';
            this.isMyTurn = true;
            break;

         case 'multi': {
            const {
               playerMark = 'X',
               roomId = '',
               isMyTurn = false,
               hasOpponent = false,
               currentPlayer = 'X',
            } = options;
            this.playerMark = playerMark;
            this.roomId = roomId;
            this.isMyTurn = isMyTurn;
            this.hasOpponent = hasOpponent;
            this.currentPlayer = currentPlayer;
            break;
         }
      }

      this.dispatchEvent(
         new CustomEvent('gameStarted', {
            detail: {
               mode: this.gameMode,
               currentPlayer: this.currentPlayer,
               gameState: this.getGameState(),
            },
         })
      );
   }

   /**
    * Attempt to place a mark at the specified coordinates
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    * @param {Object} options - Additional options
    * @returns {Object} Result of the move attempt
    */
   placeMark(cellX: number, cellY: number, options: Record<string, unknown> = {}): PlaceMarkResult {
      console.log('placeMark called:', {
         cellX,
         cellY,
         gameMode: this.gameMode,
         isGameOver: this.isGameOver,
      });

      // Validate move
      const validation = this.validateMove(cellX, cellY);
      console.log('Move validation result:', validation);

      if (!validation.isValid) {
         console.warn('Move validation failed:', validation.reason);
         return {
            success: false,
            reason: validation.reason,
            cellX,
            cellY,
         };
      }

      const player = this.currentPlayer;

      // For multiplayer, emit to server instead of placing directly
      if (this.gameMode === 'multi') {
         this.dispatchEvent(
            new CustomEvent('multiplayerMove', {
               detail: {
                  roomId: this.roomId,
                  cellX,
                  cellY,
                  player,
               },
            })
         );
         return {
            success: true,
            multiplayer: true,
            cellX,
            cellY,
            player,
         };
      }

      // Place the mark locally
      return this.executeMove(cellX, cellY, player, options);
   }

   /**
    * Execute a move (used for local games and receiving multiplayer moves)
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    * @param {string} player - Player making the move
    * @param {Object} options - Additional options
    * @returns {Object} Result of the move
    */
   executeMove(
      cellX: number,
      cellY: number,
      player: Mark,
      options: Record<string, unknown> = {}
   ): PlaceMarkResult {
      const key = coordKey(cellX, cellY);

      // Double-check the cell isn't occupied (safety check)
      if (this.placedMarks.has(key)) {
         return {
            success: false,
            reason: 'Cell already occupied',
            cellX,
            cellY,
         };
      }

      // Store the move
      this.placedMarks.set(key, {
         player,
         cellX,
         cellY,
         timestamp: Date.now(),
      });

      // Add to move history
      this.moveHistory.push({cellX, cellY, player, timestamp: Date.now()});

      // Emit move placed event
      this.dispatchEvent(
         new CustomEvent('movePlaced', {
            detail: {
               cellX,
               cellY,
               player,
               gameState: this.getGameState(),
            },
         })
      );

      // Check for win
      const winningCells = this.checkWin(cellX, cellY, player);
      if (winningCells) {
         this.isGameOver = true;
         this.winningCells = winningCells as [number, number][];

         this.dispatchEvent(
            new CustomEvent('gameWon', {
               detail: {
                  winner: player,
                  winningCells,
                  gameState: this.getGameState(),
               },
            })
         );

         return {
            success: true,
            gameWon: true,
            winner: player,
            winningCells,
            cellX,
            cellY,
            player,
         };
      }

      // Check for draw
      if (this.checkDraw()) {
         this.isGameOver = true;

         this.dispatchEvent(
            new CustomEvent('gameDraw', {
               detail: {gameState: this.getGameState()},
            })
         );

         return {
            success: true,
            gameDraw: true,
            cellX,
            cellY,
            player,
         };
      }

      // Switch turns (for local games)
      if (this.gameMode === 'single' || this.gameMode === 'bot') {
         this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

         this.dispatchEvent(
            new CustomEvent('turnChange', {
               detail: {
                  currentPlayer: this.currentPlayer,
                  gameState: this.getGameState(),
               },
            })
         );
      }

      return {
         success: true,
         cellX,
         cellY,
         player,

         nextPlayer: this.currentPlayer,
      };
   }

   /**
    * Validate if a move is legal
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    * @returns {Object} Validation result
    */
   validateMove(cellX: number, cellY: number): MoveValidationResult {
      // Check if game is over
      if (this.isGameOver) {
         return {isValid: false, reason: 'Game is over'};
      }

      // Check if game mode is set
      if (!this.gameMode) {
         return {isValid: false, reason: 'No game mode set'};
      }

      // Check coordinates are valid numbers
      if (!Number.isInteger(cellX) || !Number.isInteger(cellY)) {
         return {isValid: false, reason: 'Invalid coordinates'};
      }

      // Check if cell is already occupied
      const key = coordKey(cellX, cellY);
      if (this.placedMarks.has(key)) {
         return {isValid: false, reason: 'Cell already occupied'};
      }

      // Check multiplayer-specific conditions
      if (this.gameMode === 'multi') {
         if (!this.isMyTurn) {
            return {isValid: false, reason: 'Not your turn'};
         }

         if (!this.hasOpponent) {
            return {isValid: false, reason: 'No opponent'};
         }
      }

      return {isValid: true};
   }

   /**
    * Check if the current move results in a win
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    * @param {string} player - Player who made the move
    * @returns {Array|false} Array of winning cells or false if no win
    */
   checkWin(cellX: number, cellY: number, player: Mark): [number, number][] | false {
      const directions = [
         [1, 0], // horizontal
         [0, 1], // vertical
         [1, 1], // diagonal right
         [1, -1], // diagonal left
      ] as const;

      for (const [dx, dy] of directions) {
         let count = 1;
         let blocked = 0;
         const cells: [number, number][] = [[cellX, cellY]];
         const dirKey = `${dx},${dy}`;

         // Check both directions from the placed mark
         for (let dir = -1; dir <= 1; dir += 2) {
            let consecutive = 0;
            for (let i = 1; i < WINNING_LENGTH; i++) {
               const newX = cellX + dx * i * dir;
               const newY = cellY + dy * i * dir;
               const checkKey = coordKey(newX, newY);
               const cell = this.placedMarks.get(checkKey);

               if (cell?.player === player) {
                  count++;
                  consecutive++;
                  cells.push([newX, newY]);

                  // Update potential wins map for AI analysis
                  const lineKey = `${dirKey},${newX},${newY}`;
                  const existing = this.potentialWins.get(lineKey) || {
                     count: 0,
                     cells: [] as [number, number][],
                  };
                  existing.count = Math.max(existing.count, consecutive + 1);
                  const nextCell: [number, number] = [newX, newY];
                  const seen = new Set(existing.cells.map(c => `${c[0]},${c[1]}`));
                  if (!seen.has(`${nextCell[0]},${nextCell[1]}`)) {
                     existing.cells = [...existing.cells, nextCell];
                  }

                  this.potentialWins.set(lineKey, existing);
               } else {
                  blocked++;
                  break;
               }
            }
         }

         // Check if we have enough in a row to win
         if (count >= WINNING_LENGTH) {
            // Sort cells for consistent ordering
            cells.sort((a, b) => {
               if (a[0] === b[0]) return a[1] - b[1];
               return a[0] - b[0];
            });
            return cells;
         }

         // Clean up potential wins that are now blocked
         if (blocked === 2 && count < WINNING_LENGTH) {
            const lineKey = `${dirKey},${cellX},${cellY}`;
            this.potentialWins.delete(lineKey);
         }
      }

      return false;
   }

   /**
    * Check if the game is a draw (board full with no winner)
    * @returns {boolean} True if the game is a draw
    */
   checkDraw(): boolean {
      // For an infinite grid, we don't check for draws the traditional way
      // Instead, we could implement an user's specified time limit or other draw conditions
      // For now, return false as draws are impossible in infinite tic-tac-toe
      // Could be used when custom grid sizes are implemented or when a game hits the specified time limit
      return false;
   }

   /**
    * Get all valid moves (empty cells within reasonable bounds)
    * @param {Object} bounds - Optional bounds to limit the search area
    * @returns {Array} Array of valid move coordinates
    */
   getValidMoves(bounds: Bounds | null = null): Array<{x: number; y: number}> {
      if (this.isGameOver) return [];

      const validMoves: Array<{x: number; y: number}> = [];

      const b =
         bounds ??
         (this.placedMarks.size > 0
            ? this.calculateGameBounds()
            : {minX: -5, maxX: 5, minY: -5, maxY: 5});

      // Check each cell in bounds
      for (let x = b.minX; x <= b.maxX; x++) {
         for (let y = b.minY; y <= b.maxY; y++) {
            const key = coordKey(x, y);

            if (!this.placedMarks.has(key)) {
               validMoves.push({x, y});
            }
         }
      }

      return validMoves;
   }

   /**
    * Calculate reasonable game bounds based on placed marks
    * @returns {Object} Bounds object with minX, maxX, minY, maxY
    */
   calculateGameBounds(): Bounds {
      if (this.placedMarks.size === 0) {
         return {minX: -2, maxX: 2, minY: -2, maxY: 2};
      }

      let minX = Infinity,
         maxX = -Infinity;
      let minY = Infinity,
         maxY = -Infinity;

      for (const [key] of this.placedMarks) {
         const {x, y} = parseCoordKey(key);
         minX = Math.min(minX, x);
         maxX = Math.max(maxX, x);
         minY = Math.min(minY, y);
         maxY = Math.max(maxY, y);
      }

      // Expand bounds by 2 cells in each direction
      return {
         minX: minX - 2,
         maxX: maxX + 2,
         minY: minY - 2,
         maxY: maxY + 2,
      };
   }

   /**
    * Get current game state
    * @returns {Object} Current game state
    */
   getGameState(): GameLogicState {
      return {
         gameMode: this.gameMode,
         currentPlayer: this.currentPlayer,
         isGameOver: this.isGameOver,
         playerMark: this.playerMark,
         roomId: this.roomId,
         isMyTurn: this.isMyTurn,
         hasOpponent: this.hasOpponent,
         placedMarks: new Map(this.placedMarks),
         potentialWins: new Map(this.potentialWins),
         winningCells: this.winningCells,
         moveHistory: [...this.moveHistory],
         moveCount: this.placedMarks.size,
      };
   }

   /**
    * Update game state (for multiplayer updates)
    * @param {Object} newState - New state to merge
    */
   updateGameState(newState: Partial<GameLogicState>) {
      const oldState = this.getGameState();

      // Update properties
      Object.keys(newState).forEach(key => {
         if (Object.prototype.hasOwnProperty.call(this, key)) {
            (this as any)[key] = (newState as any)[key];
         }
      });

      this.dispatchEvent(
         new CustomEvent('gameStateUpdated', {
            detail: {oldState, newState: this.getGameState()},
         })
      );
   }

   /**
    * Reset the game to initial state
    */
   resetGame() {
      this.gameMode = null;
      this.currentPlayer = 'X';
      this.isGameOver = false;
      this.playerMark = '';
      this.roomId = '';
      this.isMyTurn = false;
      this.hasOpponent = false;
      this.placedMarks.clear();
      this.potentialWins.clear();
      this.winningCells = null;
      this.moveHistory = [];

      this.dispatchEvent(
         new CustomEvent('gameReset', {
            detail: {gameState: this.getGameState()},
         })
      );
   }

   /**
    * Get mark at specific coordinates
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    * @returns {Object|null} Mark data or null if empty
    */
   getMarkAt(cellX: number, cellY: number): PlacedMarkEntry | null {
      const key = coordKey(cellX, cellY);
      return this.placedMarks.get(key) || null;
   }

   /**
    * Check if a cell is empty
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    * @returns {boolean} True if cell is empty
    */
   isCellEmpty(cellX: number, cellY: number): boolean {
      const key = coordKey(cellX, cellY);
      return !this.placedMarks.has(key);
   }

   /**
    * Get all marks for a specific player
    * @param {string} player - Player to get marks for
    * @returns {Array} Array of mark coordinates
    */
   getPlayerMarks(player: Mark): Array<PlacedMarkEntry & {x: number; y: number}> {
      const marks: Array<PlacedMarkEntry & {x: number; y: number}> = [];

      for (const [key, mark] of this.placedMarks) {
         if (mark.player === player) {
            const {x, y} = parseCoordKey(key);
            marks.push({x, y, ...mark});
         }
      }
      return marks;
   }

   /**
    * Handle rematch request based on current mode
    */
   requestRematch() {
      const currentState = this.getGameState();
      if (!currentState.isGameOver) return;

      switch (currentState.gameMode) {
         case 'single':
            window.gameEngine?.startSinglePlayerGame();
            break;
         case 'bot':
            window.gameEngine?.startBotGame();
            break;
         case 'multi':
            //idk update status bar or smt
            // we dont even have a server for this yet lmao
            break;
         default:
            window.gameEngine?.leaveMultiplayerGame();
            break;
      }
   }

   /**
    * Clean up resources
    */
   destroy() {
      this.resetGame();
   }
}
