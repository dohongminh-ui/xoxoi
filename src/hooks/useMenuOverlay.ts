import {useState, useEffect} from 'react';
import type {GameEngine} from '../Game/core/GameEngine';

/**
 * Custom hook for managing menu overlay state and actions
 * Centralizes all menu logic and provides clean interface
 */
export const useMenuOverlay = (gameEngine: GameEngine | null = null) => {
   const [isMenuVisible, setIsMenuVisible] = useState(true);

   useEffect(() => {
      const gsm = gameEngine?.gameStateManager;
      if (!gsm) return;

      const sync = () => {
         const state = gsm.getState ? gsm.getState() : {};
         setIsMenuVisible(!!state.showMenu);
      };

      sync();

      const onStateChanged = () => sync();
      const onMenuChanged = () => sync();
      const onGameStarted = () => sync();
      const onGameEnded = () => sync();

      gsm.addEventListener('stateInitialized', onStateChanged);
      gsm.addEventListener('stateChanged', onStateChanged);
      gsm.addEventListener('stateMenuStateChanged', onMenuChanged);
      gsm.addEventListener('gameStarted', onGameStarted);
      gsm.addEventListener('gameEnded', onGameEnded);

      return () => {
         gsm.removeEventListener('stateInitialized', onStateChanged);
         gsm.removeEventListener('stateChanged', onStateChanged);
         gsm.removeEventListener('stateMenuStateChanged', onMenuChanged);
         gsm.removeEventListener('gameStarted', onGameStarted);
         gsm.removeEventListener('gameEnded', onGameEnded);
      };
   }, [gameEngine]);

   const handleStartSinglePlayer = () => {
      console.log('Start single player clicked');
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('startSingle'));
         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else if ((gameEngine as any)?.startSinglePlayerGame) {
         (gameEngine as any).startSinglePlayerGame();
         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else {
         console.warn('Game engine or uiRenderer not available');
      }
   };

   const handleStartBotGame = () => {
      console.log('Start bot game clicked');
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('startBot'));
         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else if ((gameEngine as any)?.startBotGame) {
         (gameEngine as any).startBotGame();
         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else {
         console.warn('Game engine or uiRenderer not available');
      }
   };

   const handleCreateMultiplayer = () => {
      console.log('Create multiplayer clicked');

      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('multiCreate'));

         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else {
         console.warn('Game engine or uiRenderer not available');
      }
   };

   const handleJoinMultiplayer = (roomId: any) => {
      console.log('Join multiplayer clicked', roomId);

      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(
            new CustomEvent('multiJoin', {
               detail: {roomId},
            })
         );

         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else {
         console.warn('Game engine or uiRenderer not available');
      }
   };

   const showMenu = () => {
      if (gameEngine?.gameStateManager?.set) {
         gameEngine.gameStateManager.set('showMenu', true);
      } else {
         setIsMenuVisible(true);
      }
   };

   const hideMenu = () => {
      if (gameEngine?.gameStateManager?.set) {
         gameEngine.gameStateManager.set('showMenu', false);
      } else {
         setIsMenuVisible(false);
      }
   };

   return {
      // State
      isMenuVisible,
      // Actions
      handleStartSinglePlayer,
      handleStartBotGame,
      handleCreateMultiplayer,
      handleJoinMultiplayer,
      // Utilities
      showMenu,
      hideMenu,
   };
};
