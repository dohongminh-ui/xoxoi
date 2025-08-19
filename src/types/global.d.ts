// Global module declarations for non-TS assets and window augmentations

declare module '*.css' {
   const content: string;
   export default content;
}

// Window globals used by legacy/debug code
import type {GameEngine} from '../Game/core/GameEngine';

declare global {
   interface Window {
      GAME_CONSTANTS?: unknown;
      gameEngine?: GameEngine | null;
   }
}

export {};
