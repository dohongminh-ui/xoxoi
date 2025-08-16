import {useEffect, useState} from 'react';

/**
 * Custom hook for managing status bar state and actions
 * Centralizes all status bar logic and provides clean interface
 * Updated to work with migrated React-based game engine
 */
export const useStatusBar = (gameEngine = null) => {
   const [gameStatus, setGameStatus] = useState('toe');
   const [showRestartButton, setShowRestartButton] = useState(false);
   const [showAcceptRematchButton, setShowAcceptRematchButton] =
      useState(false);
   const [showDeclineRematchButton, setShowDeclineRematchButton] =
      useState(false);
   const [showCancelRematchButton, setShowCancelRematchButton] =
      useState(false);
   const [showExitGameButton, setShowExitGameButton] = useState(false);

   // Helper: map GameStateManager buttonState to local flags
   const applyButtonState = buttonState => {
      const flags = {
         restart: false,
         acceptRematch: false,
         declineRematch: false,
         cancelRematch: false,
         exitGame: false,
      };

      switch (buttonState) {
         case 'in_game':
            flags.exitGame = true;
            break;
         case 'game_over':
            flags.restart = true;
            flags.exitGame = true;
            break;
         case 'rematch_request':
            flags.acceptRematch = true;
            flags.declineRematch = true;
            flags.exitGame = true;
            break;
         case 'waiting_rematch':
            flags.cancelRematch = true;
            flags.exitGame = true;
            break;
         case 'opponent_left':
            flags.exitGame = true;
            break;
         default:
            // hide all
            break;
      }

      setShowRestartButton(flags.restart);
      setShowAcceptRematchButton(flags.acceptRematch);
      setShowDeclineRematchButton(flags.declineRematch);
      setShowCancelRematchButton(flags.cancelRematch);
      setShowExitGameButton(flags.exitGame);
   };

   useEffect(() => {
      const gsm = gameEngine?.gameStateManager;
      if (!gsm) return;

      const sync = () => {
         const state = gsm.getState ? gsm.getState() : {};
         setGameStatus(state.statusMessage || 'toe');
         applyButtonState(state.buttonState);
      };

      sync();

      const onStateChanged = () => sync();
      const onButtonChanged = e => applyButtonState(e.detail?.to);
      const onTurnChange = () => sync();
      const onGameStarted = () => sync();
      const onGameEnded = () => sync();
      const onMenuChanged = () => sync();

      gsm.addEventListener('stateInitialized', onStateChanged);
      gsm.addEventListener('stateChanged', onStateChanged);
      gsm.addEventListener('stateButtonStateChanged', onButtonChanged);
      gsm.addEventListener('turnChange', onTurnChange);
      gsm.addEventListener('gameStarted', onGameStarted);
      gsm.addEventListener('gameEnded', onGameEnded);
      gsm.addEventListener('stateMenuStateChanged', onMenuChanged);
      gsm.addEventListener('stateGameEnded', onStateChanged);

      return () => {
         gsm.removeEventListener('stateInitialized', onStateChanged);
         gsm.removeEventListener('stateChanged', onStateChanged);
         gsm.removeEventListener('stateButtonStateChanged', onButtonChanged);
         gsm.removeEventListener('turnChange', onTurnChange);
         gsm.removeEventListener('gameStarted', onGameStarted);
         gsm.removeEventListener('gameEnded', onGameEnded);
         gsm.removeEventListener('stateMenuStateChanged', onMenuChanged);
         gsm.removeEventListener('stateGameEnded', onStateChanged);
      };
   }, [gameEngine]);

   const handleRestart = () => {
      console.log('Restart button clicked');
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchRequest'));
      } else if (gameEngine?.gameLogic) {
         gameEngine.gameLogic.requestRematch();
      }
   };

   const handleAcceptRematch = () => {
      console.log('Accept rematch clicked');
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchAccept'));
      } else if (gameEngine?.networkManager) {
         gameEngine.networkManager.acceptRematch();
      }
   };

   const handleDeclineRematch = () => {
      console.log('Decline rematch clicked');
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchDecline'));
      } else if (gameEngine?.networkManager) {
         gameEngine.networkManager.declineRematch();
      }
   };

   const handleCancelRematch = () => {
      console.log('Cancel rematch clicked');
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchCancel'));
      } else if (gameEngine?.networkManager) {
         gameEngine.networkManager.cancelRematch();
      }
   };

   const handleExitGame = () => {
      console.log('Exit game clicked');
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('exitGame'));
      } else if (gameEngine?.leaveMultiplayerGame) {
         gameEngine.leaveMultiplayerGame();
      }
   };

   const updateGameStatus = status => setGameStatus(status);

   const showButtons = ({
      restart = false,
      acceptRematch = false,
      declineRematch = false,
      cancelRematch = false,
      exitGame = false,
   }) => {
      setShowRestartButton(restart);
      setShowAcceptRematchButton(acceptRematch);
      setShowDeclineRematchButton(declineRematch);
      setShowCancelRematchButton(cancelRematch);
      setShowExitGameButton(exitGame);
   };

   const hideAllButtons = () => {
      showButtons({});
   };

   return {
      // State
      statusBarState: {
         gameStatus,
         showRestartButton,
         showAcceptRematchButton,
         showDeclineRematchButton,
         showCancelRematchButton,
         showExitGameButton,
      },
      // Actions
      statusBarActions: {
         onRestart: handleRestart,
         onAcceptRematch: handleAcceptRematch,
         onDeclineRematch: handleDeclineRematch,
         onCancelRematch: handleCancelRematch,
         onExitGame: handleExitGame,
      },
      // Utilities
      updateGameStatus,
      showButtons,
      hideAllButtons,
   };
};
