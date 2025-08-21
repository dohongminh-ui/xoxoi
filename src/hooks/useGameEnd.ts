import {useCallback, useEffect, useState} from 'react';
import type {GameEngine} from '../Game/core/GameEngine';
import type {GameMode, Mark} from '../types/state';
import {formatDuration} from '../Game/core/utils';

export type WinMethod = 'line' | 'resignation' | 'timeout' | 'draw';
export type WinningLine = 'horizontal' | 'vertical' | 'diagonal' | 'anti-diagonal' | null;

export type PlayerInfo = {
   name: string;
   rating: number;
   ratingChange: number;
   avatar: string;
   isBot: boolean;
};

export type GameEndMenuData = {
   winner: Mark | 'draw';
   method: WinMethod;
   winningLine: WinningLine;
   xPlayer: PlayerInfo;
   oPlayer: PlayerInfo;
   gameStats: {
      moves: number;
      duration: string;
      gridSize: string;
      gameMode: 'vs Bot' | 'Multiplayer' | 'Singleplayer';
   };
   gameType: 'bot' | 'multi' | 'single';
};

function modeToLabel(mode: GameMode): 'vs Bot' | 'Multiplayer' | 'Singleplayer' {
   if (mode === 'bot') return 'vs Bot';
   if (mode === 'multi') return 'Multiplayer';
   return 'Singleplayer';
}

function modeToType(mode: GameMode): 'bot' | 'multi' | 'single' {
   if (mode === 'bot') return 'bot';
   if (mode === 'multi') return 'multi';
   return 'single';
}

export const useGameEnd = (gameEngine: GameEngine | null) => {
   const [isVisible, setIsVisible] = useState(false);
   const [data, setData] = useState<GameEndMenuData | null>(null);
   const [animationComplete, setAnimationComplete] = useState(false);

   useEffect(() => {
      const gsm = gameEngine?.gameStateManager;
      if (!gsm) return;

      /**
       * Analyze winning line type based on winning cells coordinates
       */
      const analyzeWinningLineType = (
         winningCells: Array<[number, number]> | null
      ): WinningLine => {
         if (!winningCells || winningCells.length < 2) {
            return null;
         }

         // Sort cells by x coordinate first, then by y coordinate for consistent analysis
         const sortedCells = [...winningCells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

         const firstCell = sortedCells[0]!;
         const secondCell = sortedCells[1]!;

         const deltaX = secondCell[0] - firstCell[0];
         const deltaY = secondCell[1] - firstCell[1];

         // Horizontal line (same Y, different X)
         if (deltaY === 0 && deltaX !== 0) {
            return 'horizontal';
         }

         // Vertical line (same X, different Y)
         if (deltaX === 0 && deltaY !== 0) {
            return 'vertical';
         }

         // Diagonal lines (equal absolute deltas)
         if (Math.abs(deltaX) === Math.abs(deltaY)) {
            // Main diagonal (top-left to bottom-right): deltaX and deltaY have same sign
            if (deltaX === deltaY) {
               return 'diagonal';
            }
            // Anti-diagonal (top-right to bottom-left): deltaX and deltaY have opposite signs
            if (deltaX === -deltaY) {
               return 'anti-diagonal';
            }
         }

         return null;
      };

      /**
       * Determine win method based on game state
       */
      const determineWinMethod = (state: any): WinMethod => {
         // If no winner, it's a draw
         if (!state.winner) {
            return 'draw';
         }

         // Check if winMethod is already set by GameStateManager
         if (state.winMethod) {
            return state.winMethod;
         }

         // Fallback logic based on available data
         if (state.winningCells && state.winningCells.length > 0) {
            return 'line';
         }

         // Default to timeout if winner exists but no winning cells
         return 'timeout';
      };

      /**
       * Compute player information based on game mode
       */
      const computePlayerInfo = (
         state: any,
         mode: GameMode
      ): {xPlayer: PlayerInfo; oPlayer: PlayerInfo} => {
         const isBot = mode === 'bot';
         const isMulti = mode === 'multi';
         const isSingle = mode === 'single';

         let xPlayer: PlayerInfo;
         let oPlayer: PlayerInfo;

         if (isMulti) {
            // Multiplayer mode: distinguish between "You" and "Opponent"
            const xIsMe = state.playerMark === 'X';
            const oIsMe = state.playerMark === 'O';

            xPlayer = {
               name: xIsMe ? 'You' : 'Opponent',
               rating: 0, // TODO: Implement rating system
               ratingChange: 0, // TODO: Implement rating changes
               avatar: '❌',
               isBot: false,
            };

            oPlayer = {
               name: oIsMe ? 'You' : 'Opponent',
               rating: 0, // TODO: Implement rating system
               ratingChange: 0, // TODO: Implement rating changes
               avatar: '⭕',
               isBot: false,
            };
         } else if (isBot) {
            // Bot mode: "You" vs "Bot"
            xPlayer = {
               name: 'You',
               rating: 0, // TODO: Implement rating system
               ratingChange: 0, // TODO: Implement rating changes
               avatar: '❌',
               isBot: false,
            };

            oPlayer = {
               name: 'Bot',
               rating: 0, // TODO: Implement rating system
               ratingChange: 0, // TODO: Implement rating changes
               avatar: '⭕',
               isBot: true,
            };
         } else {
            // Single player mode: "X" vs "O"
            xPlayer = {
               name: 'X',
               rating: 0, // TODO: Implement rating system
               ratingChange: 0, // TODO: Implement rating changes
               avatar: '❌',
               isBot: false,
            };

            oPlayer = {
               name: 'O',
               rating: 0, // TODO: Implement rating system
               ratingChange: 0, // TODO: Implement rating changes
               avatar: '⭕',
               isBot: false,
            };
         }

         return {xPlayer, oPlayer};
      };

      const compute = (): GameEndMenuData | null => {
         const state = gsm.getState ? gsm.getState() : ({} as any);
         if (!state || !state.isGameOver) return null;

         const winner: Mark | 'draw' = state.winner ?? 'draw';
         const method: WinMethod = determineWinMethod(state);
         const winningLine: WinningLine =
            method === 'line' ? analyzeWinningLineType(state.winningCells) : null;
         const mode: GameMode = state.gameMode;

         // Compute player information based on game mode
         const {xPlayer, oPlayer} = computePlayerInfo(state, mode);

         // Use GameStateManager methods for better statistics if available
         const gameStats = {
            moves: state.moveCount ?? 0,
            duration: gsm.getFormattedDuration
               ? gsm.getFormattedDuration()
               : formatDuration(state.gameDuration ?? 0),
            gridSize: gsm.getGridSizeDisplay ? gsm.getGridSizeDisplay() : '∞',
            gameMode: gsm.getGameModeLabel ? gsm.getGameModeLabel(mode) : modeToLabel(mode),
         } as GameEndMenuData['gameStats'];

         return {
            winner,
            method,
            winningLine,
            xPlayer,
            oPlayer,
            gameStats,
            gameType: modeToType(mode),
         } satisfies GameEndMenuData;
      };

      const sync = () => {
         const d = compute();
         setData(d);

         if (d) {
            // Game has ended, but don't show menu immediately for line wins
            setAnimationComplete(false);

            // Check if this is a line win that needs animation
            const needsAnimation = d.method === 'line' && d.winningLine;

            if (!needsAnimation) {
               // No animation needed (draw, resignation, timeout)
               console.log('No winning line animation needed, showing menu with delay');
               // Show menu with a small delay for smooth transition
               setTimeout(() => {
                  setAnimationComplete(true);
                  setIsVisible(true);
               }, 300);
            } else {
               console.log('Waiting for winning line animation to complete before showing menu');
            }
            // For line wins, we'll wait for the winningLineAnimationComplete event
         } else {
            setIsVisible(false);
            setAnimationComplete(false);
         }
      };

      sync();

      const onEnded = () => sync();
      const onStateEnded = () => sync();
      const onStateChanged = () => sync();
      const onAnimationComplete = () => {
         console.log('Winning line animation completed, showing game end menu');
         // Winning line animation has completed, show the menu
         setTimeout(() => {
            setAnimationComplete(true);
            setIsVisible(true);
         }, 200); // Small buffer after animation completes
      };

      gsm.addEventListener('gameEnded', onEnded);
      gsm.addEventListener('stateGameEnded', onStateEnded);
      gsm.addEventListener('stateChanged', onStateChanged);
      gsm.addEventListener('winningLineAnimationComplete', onAnimationComplete);

      return () => {
         if (gsm && typeof gsm.removeEventListener === 'function') {
            gsm.removeEventListener('gameEnded', onEnded);
            gsm.removeEventListener('stateGameEnded', onStateEnded);
            gsm.removeEventListener('stateChanged', onStateChanged);
            gsm.removeEventListener('winningLineAnimationComplete', onAnimationComplete);
         }
      };
   }, [gameEngine]);

   const onRematch = useCallback(() => {
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchRequest'));
      }
   }, [gameEngine]);

   const onNewGame = useCallback(() => {
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('newGame'));
      }
   }, [gameEngine]);

   const onBack = useCallback(() => {
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('exitGame'));
      } else if (gameEngine?.gameStateManager?.resetGame) {
         gameEngine.gameStateManager.resetGame({returnToMenu: true});
      }
      setIsVisible(false);
   }, [gameEngine]);

   const onShare = useCallback(() => {
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('shareGame'));
      }
   }, [gameEngine]);

   const onSwitchPlayers = useCallback(() => {
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('switchPlayers'));
      }
   }, [gameEngine]);

   return {
      isVisible,
      data,
      animationComplete,
      actions: {onRematch, onNewGame, onBack, onShare, onSwitchPlayers},
   } as const;
};
