import {useState, useEffect} from 'react';
import {GameEngine} from '../Game/core/GameEngine';
import type {GameMode, GameSettings} from '../types/game-settings';
/**
 * Custom hook for managing menu overlay state and actions
 * Centralizes all menu logic and provides clean interface
 */
export const useMenuOverlay = (gameEngine: GameEngine | null = null) => {
   const [isMenuVisible, setIsMenuVisible] = useState(true);
   const [isSettingsVisible, setIsSettingsVisible] = useState(false);
   const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

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

   const showSettingsMenu = (mode: GameMode) => {
      setSelectedMode(mode);
      setIsMenuVisible(false);
      setIsSettingsVisible(true);
   };

   const handleStartSinglePlayer = () => {
      console.log('Start single player clicked');
      showSettingsMenu('singleplayer');
   };

   const handleStartBotGame = () => {
      console.log('Start bot game clicked');
      showSettingsMenu('bot');
   };

   const handleCreateMultiplayer = () => {
      console.log('Create multiplayer clicked');
      showSettingsMenu('multiplayer');
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

   const startSinglePlayerGame = (settings: GameSettings) => {
      console.log('Actually starting single player with settings:', settings);
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('startSingle', {detail: {settings}}));

         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else if ((gameEngine as any)?.startSinglePlayerGame) {
         (gameEngine as any).startSinglePlayerGame(settings);
         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else {
         console.warn('Game engine or uiRenderer not available');
      }
   };

   const startBotGame = (settings: GameSettings) => {
      console.log('Actually starting bot game with settings:', settings);
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('startBot', {detail: {settings}}));
         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else if ((gameEngine as any)?.startBotGame) {
         (gameEngine as any).startBotGame(settings);
         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else {
         console.warn('Game engine or uiRenderer not available');
      }
   };

   const startMultiplayerGame = (settings: GameSettings) => {
      console.log('Actually starting multiplayer with settings:', settings);
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('multiCreate', {detail: {settings}}));
         if (gameEngine?.gameStateManager?.set) {
            gameEngine.gameStateManager.set('showMenu', false);
         } else {
            setIsMenuVisible(false);
         }
      } else {
         console.warn('Game engine or uiRenderer not available');
      }
   };

   const handleStartGameWithSettings = (settings: GameSettings) => {
      setIsSettingsVisible(false);

      if (settings.mode === 'singleplayer') {
         startSinglePlayerGame(settings);
      } else if (settings.mode === 'bot') {
         startBotGame(settings);
      } else if (settings.mode === 'multiplayer') {
         startMultiplayerGame(settings);
      }
   };

   const handleCancelSettings = () => {
      setIsMenuVisible(true);
      setIsSettingsVisible(false);
      setSelectedMode(null);
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
      isSettingsVisible,
      selectedMode,
      // Actions
      handleStartSinglePlayer,
      handleStartBotGame,
      handleCreateMultiplayer,
      handleJoinMultiplayer,
      handleCancelSettings,
      handleStartGameWithSettings,
      // Utilities
      showMenu,
      hideMenu,
   };
};
