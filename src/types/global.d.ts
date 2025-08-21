// Window globals used by legacy/debug code
import type {GameEngine} from '../Game/core/GameEngine';

declare global {
   interface Window {
      GAME_CONSTANTS?: unknown;
      gameEngine?: GameEngine | null;
   }
}

export {};
