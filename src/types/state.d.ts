// Type definitions for GameStateManager

export type GameMode = 'single' | 'bot' | 'multi' | null;
export type Mark = 'X' | 'O';
export type GamePhase = 'menu' | 'lobby' | 'playing' | 'paused' | 'ended';
export type ButtonState = 'in_game' | 'game_over' | 'opponent_left' | 'menu' | 'lobby';
export type GameEndReason = 'completed' | 'draw' | 'abandoned' | 'opponent_left';
export type WinMethod = 'line' | 'resignation' | 'timeout' | 'draw';
export type WinningLineType = 'horizontal' | 'vertical' | 'diagonal' | 'anti-diagonal' | null;
export type MenuState = 'main' | 'lobby' | 'game' | 'settings' | 'about';

export interface GameState {
   // Index signature to allow Record<string, unknown> conversion
   [key: string]: unknown;

   // Game mode and type
   gameMode: GameMode;
   gamePhase: GamePhase;

   // Player information
   currentPlayer: Mark;
   playerMark: Mark | '';
   isMyTurn: boolean;

   // Game status
   isGameOver: boolean;
   isPaused: boolean;
   winner: Mark | null;
   winningCells: Array<[number, number]> | null;
   winMethod: WinMethod | null;
   winningLineType: WinningLineType;

   // Multiplayer state
   roomId: string;
   hasOpponent: boolean;
   isHost: boolean;

   // Game data
   moveCount: number;
   gameStartTime: number | null;
   gameDuration: number;

   // UI state
   currentMenu: MenuState;
   buttonState: ButtonState | null;
   statusMessage: string;
   showMenu: boolean;

   // Network state
   isConnected: boolean;
   isReconnecting: boolean;
   connectionAttempts: number;

   // Camera/View state
   cameraScale: number;
   cameraX: number;
   cameraY: number;

   // Performance/Debug
   lastUpdate: number;
   frameCount: number;
}

export interface StateChange {
   from: unknown;
   to: unknown;
}

export interface StateChanges {
   [key: string]: StateChange;
}

export interface StartGameOptions {
   playerMark?: Mark;
   roomId?: string;
   isMyTurn?: boolean;
   hasOpponent?: boolean;
   isHost?: boolean;
}

export interface EndGameResult {
   winner?: Mark | null;
   winningCells?: Array<[number, number]> | null;
   reason?: GameEndReason;
   winMethod?: WinMethod;
   winningLineType?: WinningLineType;
}

export interface ResetGameOptions {
   clearAll?: boolean;
   keepNetworkState?: boolean;
   keepCameraState?: boolean;
   returnToMenu?: boolean;
}

export interface CameraStateUpdate {
   scale?: number;
   x?: number;
   y?: number;
}

export interface NetworkStateUpdate {
   [key: string]: unknown;
   isConnected?: boolean;
   isReconnecting?: boolean;
   connectionAttempts?: number;
   roomId?: string;
   hasOpponent?: boolean;
   isHost?: boolean;
}

export interface SetStateOptions {
   silent?: boolean;
   saveToHistory?: boolean;
   merge?: boolean;
}

export interface GameStats {
   gameMode: GameMode;
   duration: number;
   moveCount: number;
   isGameOver: boolean;
   winner: Mark | null;
   currentPlayer: Mark;
}

// Event detail interfaces
export interface StateInitializedDetail {
   state: GameState;
}

export interface StateChangedDetail {
   changes: StateChanges;
   oldState: GameState;
   newState: GameState;
}

export interface GameModeChangedDetail {
   from: GameMode;
   to: GameMode;
   state: GameState;
}

export interface GamePhaseChangedDetail {
   from: GamePhase;
   to: GamePhase;
   state: GameState;
}

export interface TurnChangeDetail {
   currentPlayer: Mark;
   isMyTurn: boolean;
   state: GameState;
}

export interface GameEndedDetail {
   winner: Mark | null;
   winningCells: Array<[number, number]> | null;
   winMethod: WinMethod | null;
   winningLineType: WinningLineType;
   state: GameState;
}

export interface MenuStateChangedDetail {
   currentMenu: MenuState;
   showMenu: boolean;
   state: GameState;
}

export interface ButtonStateChangedDetail {
   from: ButtonState | null;
   to: ButtonState | null;
   state: GameState;
}

export interface NetworkStateChangedDetail {
   isConnected: boolean;
   isReconnecting: boolean;
   connectionAttempts: number;
   state: GameState;
}

export interface GameStartedDetail {
   mode: string;
}

export interface GameEndedEventDetail {
   winner: Mark | null;
   reason: GameEndReason;
}

export interface TurnChangeEventDetail {
   currentPlayer: Mark;
   isMyTurn: boolean;
}

export interface StateRestoredDetail {
   stepsBack: number;
   state: GameState;
}

// Constants interfaces
export interface ButtonStates {
   IN_GAME: 'in_game';
   GAME_OVER: 'game_over';
   OPPONENT_LEFT: 'opponent_left';
   MENU: 'menu';
   LOBBY: 'lobby';
}

export interface MenuStates {
   MAIN: 'main';
   LOBBY: 'lobby';
   GAME: 'game';
   SETTINGS: 'settings';
   ABOUT: 'about';
}

export interface GamePhases {
   MENU: 'menu';
   LOBBY: 'lobby';
   PLAYING: 'playing';
   PAUSED: 'paused';
   ENDED: 'ended';
}
