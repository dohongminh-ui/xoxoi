import {useEffect, useState, useMemo, useCallback} from 'react';
import type {GameEngine} from '../Game/core/GameEngine';
import type {GameMode, Mark, GamePhase, GameState} from '../types/state';
import {generateStatusMessage, type StatusMessageConfig} from '../utils/statusMessages';
import {
   getButtonConfiguration,
   type ButtonConfiguration,
   type ButtonConfigurationInput,
} from '../utils/buttonConfig';

/**
 * Enhanced status bar state interface
 */
export interface EnhancedStatusBarState {
   // Basic state
   gameStatus: string;
   showResignButton: boolean;
   showExitGameButton: boolean;

   // Enhanced state
   timeElapsed: number;
   gameMode: GameMode;
   currentPlayer: Mark;
   playerMark: Mark | '';
   isMyTurn: boolean;
   connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
   reconnectionAttempts: number;
   moveCount: number;
   gameStartTime: number | null;
   gameDuration: number;
   gamePhase: GamePhase;
   hasOpponent: boolean;
   roomId: string;
   isGameEnded: boolean;
   winner: Mark | null;
   isWaitingForOpponent: boolean;
}

/**
 * Enhanced status bar actions interface
 */
export interface EnhancedStatusBarActions {
   onResign: () => void;
   onExitGame: () => void;
}

/**
 * Custom hook for managing enhanced status bar state and actions
 * Provides comprehensive game state tracking, time management, and contextual controls
 */
export const useStatusBar = (gameEngine: GameEngine | null = null) => {
   // Basic state
   const [gameStatus, setGameStatus] = useState('toe');
   const [showResignButton, setShowResignButton] = useState(false);
   const [showExitGameButton, setShowExitGameButton] = useState(false);

   // Enhanced state
   const [timeElapsed, setTimeElapsed] = useState(0);
   const [gameMode, setGameMode] = useState<GameMode>(null);
   const [currentPlayer, setCurrentPlayer] = useState<Mark>('X');
   const [playerMark, setPlayerMark] = useState<Mark | ''>('');
   const [isMyTurn, setIsMyTurn] = useState(false);
   const [connectionStatus, setConnectionStatus] = useState<
      'connected' | 'reconnecting' | 'disconnected'
   >('connected');
   const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
   const [moveCount, setMoveCount] = useState(0);
   const [gameStartTime, setGameStartTime] = useState<number | null>(null);
   const [gameDuration, setGameDuration] = useState(0);
   const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
   const [hasOpponent, setHasOpponent] = useState(false);
   const [roomId, setRoomId] = useState('');
   const [isGameEnded, setIsGameEnded] = useState(false);
   const [winner, setWinner] = useState<Mark | null>(null);
   const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);

   // Generate status message based on current state
   const statusMessage = useMemo(() => {
      const config: StatusMessageConfig = {
         gameMode: gameMode || 'single',
         gamePhase,
         currentPlayer,
         playerMark,
         isMyTurn,
         hasOpponent,
         roomId,
         isGameEnded,
         winner,
         connectionStatus,
         reconnectionAttempts,
         isWaitingForOpponent,
      };

      return generateStatusMessage(config);
   }, [
      gameMode,
      gamePhase,
      currentPlayer,
      playerMark,
      isMyTurn,
      hasOpponent,
      roomId,
      isGameEnded,
      winner,
      connectionStatus,
      reconnectionAttempts,
      isWaitingForOpponent,
   ]);

   // Generate button configuration based on current state
   const buttonConfig = useMemo(() => {
      const input: ButtonConfigurationInput = {
         gameMode: gameMode || 'single',
         gamePhase,
         hasOpponent,
         isGameOver: isGameEnded,
         isConnected: connectionStatus === 'connected',
         isReconnecting: connectionStatus === 'reconnecting',
      };

      return getButtonConfiguration(input);
   }, [gameMode, gamePhase, hasOpponent, isGameEnded, connectionStatus]);

   // Apply button configuration to state
   const applyButtonConfiguration = useCallback((config: ButtonConfiguration) => {
      setShowResignButton(config.showResign);
      setShowExitGameButton(config.showExit);
   }, []);

   // Sync state from GameStateManager
   const syncState = useCallback(() => {
      const gsm = gameEngine?.gameStateManager;
      if (!gsm || !gsm.getState) return;

      const state = gsm.getState() as GameState;

      // Update all state values
      setGameMode(state.gameMode);
      setGamePhase(state.gamePhase);
      setCurrentPlayer(state.currentPlayer);
      setPlayerMark(state.playerMark);
      setIsMyTurn(state.isMyTurn);
      setIsGameEnded(state.isGameOver);
      setWinner(state.winner);
      setMoveCount(state.moveCount);
      setGameStartTime(state.gameStartTime);
      setGameDuration(state.gameDuration);
      setHasOpponent(state.hasOpponent);
      setRoomId(state.roomId);

      // Update connection status
      if (state.isReconnecting) {
         setConnectionStatus('reconnecting');
      } else if (state.isConnected) {
         setConnectionStatus('connected');
      } else {
         setConnectionStatus('disconnected');
      }
      setReconnectionAttempts(state.connectionAttempts);

      // Determine if waiting for opponent
      setIsWaitingForOpponent(
         state.gameMode === 'multi' && state.gamePhase === 'lobby' && !state.hasOpponent
      );

      // Update game status with generated message or fallback to state message
      setGameStatus(state.statusMessage || 'toe');
   }, [gameEngine]);

   // Time tracking effect
   useEffect(() => {
      if (!gameStartTime || isGameEnded) {
         return;
      }

      const interval = setInterval(() => {
         setTimeElapsed(Date.now() - gameStartTime);
      }, 1000);

      return () => clearInterval(interval);
   }, [gameStartTime, isGameEnded]);

   // Update status message when dependencies change
   useEffect(() => {
      setGameStatus(statusMessage);
   }, [statusMessage]);

   // Update button states when configuration changes
   useEffect(() => {
      applyButtonConfiguration(buttonConfig);
   }, [buttonConfig, applyButtonConfiguration]);

   // Main effect for GameStateManager integration
   useEffect(() => {
      const gsm = gameEngine?.gameStateManager;
      if (!gsm) return;

      // Initial sync
      syncState();

      // Event handlers
      const onStateChanged = () => syncState();
      const onButtonChanged = () => syncState();
      const onTurnChange = () => syncState();
      const onGameStarted = () => syncState();
      const onGameEnded = () => syncState();
      const onMenuChanged = () => syncState();
      const onNetworkStateChanged = () => syncState();
      const onGameModeChanged = () => syncState();
      const onGamePhaseChanged = () => syncState();

      // Add event listeners
      gsm.addEventListener('stateInitialized', onStateChanged);
      gsm.addEventListener('stateChanged', onStateChanged);
      gsm.addEventListener('stateButtonStateChanged', onButtonChanged);
      gsm.addEventListener('turnChange', onTurnChange);
      gsm.addEventListener('gameStarted', onGameStarted);
      gsm.addEventListener('gameEnded', onGameEnded);
      gsm.addEventListener('stateMenuStateChanged', onMenuChanged);
      gsm.addEventListener('stateGameEnded', onStateChanged);
      gsm.addEventListener('stateNetworkStateChanged', onNetworkStateChanged);
      gsm.addEventListener('stateGameModeChanged', onGameModeChanged);
      gsm.addEventListener('stateGamePhaseChanged', onGamePhaseChanged);

      return () => {
         gsm.removeEventListener('stateInitialized', onStateChanged);
         gsm.removeEventListener('stateChanged', onStateChanged);
         gsm.removeEventListener('stateButtonStateChanged', onButtonChanged);
         gsm.removeEventListener('turnChange', onTurnChange);
         gsm.removeEventListener('gameStarted', onGameStarted);
         gsm.removeEventListener('gameEnded', onGameEnded);
         gsm.removeEventListener('stateMenuStateChanged', onMenuChanged);
         gsm.removeEventListener('stateGameEnded', onStateChanged);
         gsm.removeEventListener('stateNetworkStateChanged', onNetworkStateChanged);
         gsm.removeEventListener('stateGameModeChanged', onGameModeChanged);
         gsm.removeEventListener('stateGamePhaseChanged', onGamePhaseChanged);
      };
   }, [gameEngine, syncState]);

   // Action handlers
   const handleResign = useCallback(() => {
      console.log('Resign clicked');

      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('resign'));
      } else if (gameEngine?.networkManager?.resign) {
         gameEngine.networkManager.resign();
      }
   }, [gameEngine]);

   const handleExitGame = useCallback(() => {
      console.log('Exit game clicked');

      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('exitGame'));
      } else if ((gameEngine as any)?.leaveMultiplayerGame) {
         (gameEngine as any).leaveMultiplayerGame();
      }
   }, [gameEngine]);

   // Enhanced state object
   const enhancedStatusBarState: EnhancedStatusBarState = {
      // Basic state
      gameStatus,
      showResignButton,
      showExitGameButton,

      // Enhanced state
      timeElapsed,
      gameMode,
      currentPlayer,
      playerMark,
      isMyTurn,
      connectionStatus,
      reconnectionAttempts,
      moveCount,
      gameStartTime,
      gameDuration,
      gamePhase,
      hasOpponent,
      roomId,
      isGameEnded,
      winner,
      isWaitingForOpponent,
   };

   // Enhanced actions object
   const enhancedStatusBarActions: EnhancedStatusBarActions = {
      onResign: handleResign,
      onExitGame: handleExitGame,
   };

   return {
      // Enhanced state and actions
      statusBarState: enhancedStatusBarState,
      statusBarActions: enhancedStatusBarActions,

      // Computed values
      buttonConfiguration: buttonConfig,
      generatedStatusMessage: statusMessage,
   };
};
