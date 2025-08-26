import type {GameMode, Mark, GamePhase, GameEndReason} from '../types/state';

/**
 * Configuration interface for status message generation
 */
export interface StatusMessageConfig {
   gameMode: GameMode;
   gamePhase: GamePhase;
   currentPlayer: Mark;
   playerMark: Mark | '';
   isMyTurn: boolean;
   hasOpponent: boolean;
   roomId: string;
   isGameEnded: boolean;
   winner: Mark | null;
   connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
   reconnectionAttempts?: number;
   isWaitingForOpponent?: boolean;
}

/**
 * Generate appropriate status message based on game state
 * @param config - Status message configuration
 * @returns Formatted status message string
 */
export function generateStatusMessage(config: StatusMessageConfig): string {
   const {
      gameMode,
      gamePhase,
      currentPlayer,
      playerMark,
      isMyTurn,
      hasOpponent,
      roomId,
      isGameEnded,
      winner,
      connectionStatus,
      reconnectionAttempts = 0,
      isWaitingForOpponent = false,
   } = config;

   // Handle game ended state
   if (isGameEnded) {
      return generateGameEndMessage(winner, gameMode, playerMark);
   }

   // Handle menu/lobby phases
   if (gamePhase === 'menu') {
      return 'toe';
   }

   if (gamePhase === 'lobby') {
      return gameMode === 'multi' ? `Room ${roomId} - Setting up...` : 'Preparing game...';
   }

   // Handle playing phase based on game mode
   if (gamePhase === 'playing') {
      return generatePlayingMessage({
         gameMode,
         currentPlayer,
         playerMark,
         isMyTurn,
         hasOpponent,
         roomId,
         connectionStatus,
         reconnectionAttempts,
         isWaitingForOpponent,
      });
   }

   // Fallback
   return 'toe';
}

/**
 * Generate status message for playing phase
 */
function generatePlayingMessage(config: {
   gameMode: GameMode;
   currentPlayer: Mark;
   playerMark: Mark | '';
   isMyTurn: boolean;
   hasOpponent: boolean;
   roomId: string;
   connectionStatus: string;
   reconnectionAttempts: number;
   isWaitingForOpponent: boolean;
}): string {
   const {
      gameMode,
      currentPlayer,
      playerMark,
      isMyTurn,
      hasOpponent,
      roomId,
      connectionStatus,
      reconnectionAttempts,
      isWaitingForOpponent,
   } = config;

   switch (gameMode) {
      case 'single':
         return generateSinglePlayerMessage(currentPlayer);

      case 'bot':
         return generateBotGameMessage(currentPlayer, isMyTurn);

      case 'multi':
         return generateMultiplayerMessage({
            currentPlayer,
            playerMark,
            isMyTurn,
            hasOpponent,
            roomId,
            connectionStatus,
            reconnectionAttempts,
            isWaitingForOpponent,
         });

      default:
         return 'toe';
   }
}

/**
 * Generate status message for single player mode
 */
function generateSinglePlayerMessage(currentPlayer: Mark): string {
   return `${currentPlayer}'s Turn`;
}

/**
 * Generate status message for bot game mode
 */
function generateBotGameMessage(currentPlayer: Mark, isMyTurn: boolean): string {
   if (isMyTurn) {
      return 'Your Turn';
   }
   return 'Bot Thinking...';
}

/**
 * Generate status message for multiplayer mode
 */
function generateMultiplayerMessage(config: {
   currentPlayer: Mark;
   playerMark: Mark | '';
   isMyTurn: boolean;
   hasOpponent: boolean;
   roomId: string;
   connectionStatus: string;
   reconnectionAttempts: number;
   isWaitingForOpponent: boolean;
}): string {
   const {
      currentPlayer,
      playerMark,
      isMyTurn,
      hasOpponent,
      roomId,
      connectionStatus,
      reconnectionAttempts,
      isWaitingForOpponent,
   } = config;

   // Handle connection issues
   if (connectionStatus === 'disconnected') {
      return 'Disconnected';
   }

   if (connectionStatus === 'reconnecting') {
      const attemptText = reconnectionAttempts > 0 ? ` (${reconnectionAttempts}/3)` : '';
      return `Reconnecting...${attemptText}`;
   }

   // Handle waiting for opponent
   if (!hasOpponent || isWaitingForOpponent) {
      return `Room ${roomId} - Waiting for opponent...`;
   }

   // Handle active multiplayer game
   if (isMyTurn) {
      return `(${playerMark}) Your Turn`;
   } else {
      const opponentMark = playerMark === 'X' ? 'O' : 'X';
      return `(${opponentMark}) Opponent's Turn`;
   }
}

/**
 * Generate game end message based on winner and game mode
 */
export function generateGameEndMessage(
   winner: Mark | null,
   gameMode: GameMode,
   playerMark: Mark | '' = ''
): string {
   if (!winner) {
      return 'Draw Game';
   }

   switch (gameMode) {
      case 'single':
         return `${winner} Wins!`;

      case 'bot':
         return winner === 'X' ? 'You Win!' : 'Bot Wins!';

      case 'multi':
         if (!playerMark) {
            return `${winner} Wins!`;
         }
         return winner === playerMark ? 'You Win!' : 'Opponent Wins!';

      default:
         return `${winner} Wins!`;
   }
}

/**
 * Generate turn indicator message
 */
export function generateTurnIndicator(
   gameMode: GameMode,
   currentPlayer: Mark,
   playerMark: Mark | '',
   isMyTurn: boolean
): string {
   switch (gameMode) {
      case 'single':
         return `${currentPlayer}'s turn`;

      case 'bot':
         return isMyTurn ? 'Your turn' : "Bot's turn";

      case 'multi':
         if (isMyTurn) {
            return `Your turn (${playerMark})`;
         } else {
            const opponentMark = playerMark === 'X' ? 'O' : 'X';
            return `Opponent's turn (${opponentMark})`;
         }

      default:
         return `${currentPlayer}'s turn`;
   }
}

/**
 * Generate connection status message
 */
export function generateConnectionStatusMessage(
   connectionStatus: 'connected' | 'reconnecting' | 'disconnected',
   reconnectionAttempts: number = 0
): string {
   switch (connectionStatus) {
      case 'connected':
         return 'Connected';

      case 'reconnecting':
         const attemptText = reconnectionAttempts > 0 ? ` (${reconnectionAttempts}/3)` : '';
         return `Reconnecting...${attemptText}`;

      case 'disconnected':
         return 'Disconnected';

      default:
         return 'Unknown';
   }
}

/**
 * Generate room display message for multiplayer
 */
export function generateRoomDisplayMessage(
   roomId: string,
   hasOpponent: boolean,
   isWaitingForOpponent: boolean = false
): string {
   if (!hasOpponent || isWaitingForOpponent) {
      return `Room ${roomId} - Waiting for opponent...`;
   }
   return `Room ${roomId}`;
}

/**
 * Helper function to get opponent mark
 */
export function getOpponentMark(playerMark: Mark | ''): Mark | '' {
   if (playerMark === 'X') return 'O';
   if (playerMark === 'O') return 'X';
   return '';
}

/**
 * Validate status message configuration
 */
export function validateStatusMessageConfig(config: StatusMessageConfig): boolean {
   // Check required fields
   if (!config.gameMode || !config.gamePhase || !config.currentPlayer) {
      return false;
   }

   // Validate game mode
   if (!['single', 'bot', 'multi'].includes(config.gameMode)) {
      return false;
   }

   // Validate game phase
   if (!['menu', 'lobby', 'playing', 'ended'].includes(config.gamePhase)) {
      return false;
   }

   // Validate current player
   if (!['X', 'O'].includes(config.currentPlayer)) {
      return false;
   }

   // Validate connection status
   if (!['connected', 'reconnecting', 'disconnected'].includes(config.connectionStatus)) {
      return false;
   }

   return true;
}
