import {useEffect, useRef, useState} from 'react';
import {GameEngine} from '../Game/core/GameEngine';
import {GAME_CONSTANTS} from '../Game/core/constants';

/**
 * Custom hook for managing PIXI.js game engine lifecycle
 * Handles initialization, mounting, and cleanup
 */
type UseGameEngineReturn = {
   gameEngine: GameEngine | null;
   gameInitialized: boolean;
   error: string | null;
};

export const useGameEngine = (
   containerRef: React.RefObject<HTMLElement | null>
): UseGameEngineReturn => {
   const gameEngineRef = useRef<GameEngine | null>(null);
   const [gameInitialized, setGameInitialized] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const initializeGame = async () => {
         try {
            console.log('Initializing game engine...');

            if (!containerRef.current) {
               console.error('PIXI container not available');
               return;
            }

            (window as any).GAME_CONSTANTS = GAME_CONSTANTS;

            gameEngineRef.current = new GameEngine();
            await gameEngineRef.current.init();

            const pixiCanvas = gameEngineRef.current?.app?.view as HTMLCanvasElement | undefined;
            if (containerRef.current && pixiCanvas) {
               containerRef.current.innerHTML = '';
               containerRef.current.appendChild(pixiCanvas);
            }

            setGameInitialized(true);
            console.log('Game engine initialized successfully');
            (window as any).gameEngine = gameEngineRef.current as GameEngine;
         } catch (err) {
            console.error('❌ Failed to initialize game:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
         }
      };

      const timeoutId = setTimeout(initializeGame, 100);

      return () => {
         clearTimeout(timeoutId);
         if (gameEngineRef.current?.app) {
            gameEngineRef.current.app.destroy?.(true);
         }
      };
   }, [containerRef]);

   return {
      gameEngine: gameEngineRef.current,
      gameInitialized,
      error,
   };
};
