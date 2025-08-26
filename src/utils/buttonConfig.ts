import type {GameMode, GamePhase, ButtonState} from '../types/state';

/**
 * Configuration for button visibility and states
 */
export interface ButtonConfiguration {
   showResign: boolean;
   showExit: boolean;
}

/**
 * Input parameters for button configuration generation
 */
export interface ButtonConfigurationInput {
   gameMode: GameMode;
   gamePhase: GamePhase;
   hasOpponent: boolean;
   isGameOver: boolean;
   buttonState?: ButtonState | null;
   isConnected?: boolean;
   isReconnecting?: boolean;
}

/**
 * Generate button configuration based on current game state
 *
 * This function determines which buttons should be visible in the StatusBar:
 * - Single/Bot modes: Show "Exit Game" button
 * - Multiplayer mode: Show "Resign" button (or "Leave Room" when waiting for opponent)
 *
 * @param input - Game state parameters
 * @returns ButtonConfiguration object with visibility flags
 */
export function getButtonConfiguration(input: ButtonConfigurationInput): ButtonConfiguration {
   const {
      gameMode,
      gamePhase,
      hasOpponent,
      isGameOver,
      buttonState,
      isConnected = true,
      isReconnecting = false,
   } = input;

   // Default configuration - all buttons hidden
   const config: ButtonConfiguration = {
      showResign: false,
      showExit: false,
   };

   // No buttons in menu or lobby phases
   if (gamePhase === 'menu' || gamePhase === 'lobby') {
      return config;
   }

   // Game ended state - no buttons (handled by GameEndMenu)
   if (gamePhase === 'ended' || isGameOver) {
      return config;
   }

   // Playing state - mode-specific button logic
   if (gamePhase === 'playing') {
      switch (gameMode) {
         case 'multi':
            // Multiplayer mode - always show resign (covers both resign and leave room scenarios)
            config.showResign = true;
            break;

         case 'single':
         case 'bot':
            // Single player and bot modes - show exit
            config.showExit = true;
            break;

         default:
            // Unknown mode - no buttons
            break;
      }
   }

   // Handle special button states that override normal logic
   if (buttonState) {
      switch (buttonState) {
         case 'opponent_left':
            // Opponent left - no buttons (handled by GameEndMenu or status message)
            config.showResign = false;
            config.showExit = false;
            break;

         case 'game_over':
            // Game over state - no buttons (handled by GameEndMenu)
            config.showResign = false;
            config.showExit = false;
            break;

         case 'menu':
            // Menu state - no game buttons
            return {
               showResign: false,
               showExit: false,
            };

         case 'lobby':
            // Lobby state - show resign (which acts as leave room)
            return {
               showResign: true,
               showExit: false,
            };

         case 'in_game':
            // Normal in-game state - use the logic above
            break;
      }
   }

   return config;
}

/**
 * Get button labels based on game mode and state
 */
export interface ButtonLabels {
   resign: string;
   exit: string;
}

/**
 * Get appropriate button labels based on game context
 *
 * @param gameMode - Current game mode
 * @param hasOpponent - Whether opponent is present
 * @returns ButtonLabels object with localized button text
 */
export function getButtonLabels(gameMode: GameMode, hasOpponent: boolean = false): ButtonLabels {
   return {
      resign: gameMode === 'multi' && !hasOpponent ? 'Leave Room' : 'Resign',
      exit: 'Exit Game',
   };
}

/**
 * Check if any action buttons should be visible
 *
 * @param config - Button configuration
 * @returns True if any action button is visible
 */
export function hasVisibleButtons(config: ButtonConfiguration): boolean {
   return Object.values(config).some(visible => visible);
}

/**
 * Get count of visible buttons
 *
 * @param config - Button configuration
 * @returns Number of visible buttons
 */
export function getVisibleButtonCount(config: ButtonConfiguration): number {
   return Object.values(config).filter(visible => visible).length;
}
