import {useCallback, useEffect, useState} from 'react';
import type {GameEngine} from '../Game/core/GameEngine';
import type {GameMode, Mark} from '../types/state';

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
   gameType: 'bot' | 'multiplayer' | 'local';
};

function formatDuration(ms: number): string {
   const totalSeconds = Math.max(0, Math.floor(ms / 1000));
   const m = Math.floor(totalSeconds / 60);
   const s = totalSeconds % 60;
   return `${m}:${s.toString().padStart(2, '0')}`;
}

function modeToLabel(mode: GameMode): 'vs Bot' | 'Multiplayer' | 'Singleplayer' {
   if (mode === 'bot') return 'vs Bot';
   if (mode === 'multi') return 'Multiplayer';
   return 'Singleplayer';
}

function modeToType(mode: GameMode): 'bot' | 'multiplayer' | 'local' {
   if (mode === 'bot') return 'bot';
   if (mode === 'multi') return 'multiplayer';
   return 'local';
}

export const useGameEnd = (gameEngine: GameEngine | null) => {
   const [isVisible, setIsVisible] = useState(false);
   const [data, setData] = useState<GameEndMenuData | null>(null);

   useEffect(() => {
      const gsm = gameEngine?.gameStateManager;
      if (!gsm) return;

      const compute = (): GameEndMenuData | null => {
         const state = gsm.getState ? gsm.getState() : ({} as any);
         if (!state || !state.isGameOver) return null;
         const winner: Mark | 'draw' = state.winner ?? 'draw';
         const method: WinMethod = state.winner ? 'line' : 'draw';
         const winningLine: WinningLine = state.winningCells ? 'diagonal' : null; // placeholder
         const mode: GameMode = state.gameMode;

         // Players presentation
         const xIsMe = mode === 'multi' ? state.playerMark === 'X' : true;
         const oIsMe = mode === 'multi' ? state.playerMark === 'O' : false;
         const isBot = mode === 'bot';

         const xPlayer: PlayerInfo = {
            name: xIsMe ? (mode === 'multi' ? 'You' : 'Player') : isBot ? 'You' : 'Opponent',
            rating: 0,
            ratingChange: 0,
            avatar: '❌',
            isBot: false,
         };
         const oPlayer: PlayerInfo = {
            name: oIsMe
               ? mode === 'multi'
                  ? 'You'
                  : isBot
                    ? 'Bot'
                    : 'Player 2'
               : isBot
                 ? 'Bot'
                 : 'Opponent',
            rating: 0,
            ratingChange: 0,
            avatar: '⭕',
            isBot,
         };

         const gameStats = {
            moves: state.moveCount ?? 0,
            duration: formatDuration(state.gameDuration ?? 0),
            gridSize: '∞',
            gameMode: modeToLabel(mode),
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
         setIsVisible(!!d);
      };

      sync();

      const onEnded = () => sync();
      const onStateEnded = () => sync();
      const onStateChanged = () => sync();

      gsm.addEventListener('gameEnded', onEnded);
      gsm.addEventListener('stateGameEnded', onStateEnded);
      gsm.addEventListener('stateChanged', onStateChanged);

      return () => {
         gsm.removeEventListener('gameEnded', onEnded);
         gsm.removeEventListener('stateGameEnded', onStateEnded);
         gsm.removeEventListener('stateChanged', onStateChanged);
      };
   }, [gameEngine]);

   const onPrimary = useCallback(() => {
      // Rematch / Play Again
      if (gameEngine?.gameLogic?.requestRematch) {
         gameEngine.gameLogic.requestRematch();
      }
   }, [gameEngine]);

   const onNewGame = useCallback(() => {
      const mode = (gameEngine?.gameStateManager as any)?.get?.('gameMode') as GameMode;
      if (gameEngine?.uiRenderer) {
         if (mode === 'bot') {
            gameEngine.uiRenderer.dispatchEvent(new CustomEvent('startBot'));
         } else if (mode === 'multi') {
            gameEngine.uiRenderer.dispatchEvent(new CustomEvent('multiCreate'));
         }
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

   return {
      isVisible,
      data,
      actions: {onPrimary, onNewGame, onBack},
   } as const;
};
