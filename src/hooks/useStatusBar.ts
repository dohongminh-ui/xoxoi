import {useEffect, useState} from 'react';
import type {GameEngine} from '../Game/core/GameEngine';
import type {ButtonState} from '../types/engine';

/**
 * Custom hook for managing status bar state and actions
 * Focuses on in-game status display and basic controls
 */
export const useStatusBar = (gameEngine: GameEngine | null = null) => {
   const [gameStatus, setGameStatus] = useState('toe');
   const [showResignButton, setShowResignButton] = useState(false);
   const [showExitGameButton, setShowExitGameButton] = useState(false);

   const applyButtonState = (buttonState: ButtonState, gameState?: any) => {
      const flags = {
         resign: false,
         exitGame: false,
      };

      switch (buttonState) {
         case 'in_game':
            flags.resign = true;
            flags.exitGame = true;
            break;
         case 'game_over':
            break;
         case 'opponent_left':
            flags.exitGame = true;
            break;
         case 'menu':
         case 'lobby':
         default:
            // hide all
            break;
      }

      setShowResignButton(flags.resign);
      setShowExitGameButton(flags.exitGame);
   };

   useEffect(() => {
      const gsm = gameEngine?.gameStateManager;
      if (!gsm) return;

      const sync = () => {
         const state = (gsm.getState ? gsm.getState() : {}) as {
            statusMessage?: string;
            buttonState: ButtonState;
            isGameOver?: boolean;
            gamePhase?: string;
         };
         setGameStatus(state.statusMessage || 'toe');
         applyButtonState(state.buttonState, state);
      };

      sync();

      const onStateChanged = () => sync();
      const onButtonChanged = (e: CustomEvent<{from: ButtonState; to: ButtonState}>) => {
         const state = gsm.getState ? gsm.getState() : {};
         applyButtonState(e.detail.to, state);
      };
      const onTurnChange = () => sync();
      const onGameStarted = () => sync();
      const onGameEnded = () => sync();
      const onMenuChanged = () => sync();

      gsm.addEventListener('stateInitialized', onStateChanged);
      gsm.addEventListener('stateChanged', onStateChanged);
      gsm.addEventListener('stateButtonStateChanged', onButtonChanged as EventListener);
      gsm.addEventListener('turnChange', onTurnChange);
      gsm.addEventListener('gameStarted', onGameStarted);
      gsm.addEventListener('gameEnded', onGameEnded);
      gsm.addEventListener('stateMenuStateChanged', onMenuChanged);
      gsm.addEventListener('stateGameEnded', onStateChanged);

      return () => {
         gsm.removeEventListener('stateInitialized', onStateChanged);
         gsm.removeEventListener('stateChanged', onStateChanged);
         gsm.removeEventListener('stateButtonStateChanged', onButtonChanged as EventListener);
         gsm.removeEventListener('turnChange', onTurnChange);
         gsm.removeEventListener('gameStarted', onGameStarted);
         gsm.removeEventListener('gameEnded', onGameEnded);
         gsm.removeEventListener('stateMenuStateChanged', onMenuChanged);
         gsm.removeEventListener('stateGameEnded', onStateChanged);
      };
   }, [gameEngine]);

   const handleResign = () => {
      console.log('Resign clicked');

      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('resign'));
      } else if (gameEngine?.networkManager?.resign) {
         gameEngine.networkManager.resign();
      }
   };

   const handleExitGame = () => {
      console.log('Exit game clicked');

      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('exitGame'));
      } else if ((gameEngine as any)?.leaveMultiplayerGame) {
         (gameEngine as any).leaveMultiplayerGame();
      }
   };

   const updateGameStatus = (status: string) => setGameStatus(status);

   const showButtons = ({
      resign = false,
      exitGame = false,
   }: {
      resign?: boolean;
      exitGame?: boolean;
   }) => {
      setShowResignButton(resign);
      setShowExitGameButton(exitGame);
   };

   const hideAllButtons = () => {
      showButtons({});
   };

   return {
      // State
      statusBarState: {
         gameStatus,
         showResignButton,
         showExitGameButton,
      },
      // Actions
      statusBarActions: {
         onResign: handleResign,
         onExitGame: handleExitGame,
      },
      // Utilities
      updateGameStatus,
      showButtons,
      hideAllButtons,
   };
};
