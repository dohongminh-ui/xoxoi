// Shared engine types used across engine, renderers, and controllers

import type {Mark, GameMode, GamePhase, ButtonState, GameState, CameraStateUpdate} from './state';

export type {Mark, GameMode, GamePhase, ButtonState};

export interface PlacedMark {
   player: Mark;
   x?: number;
   y?: number;
   graphics?: any; // PIXI.Text or other graphics object
}

export type PlacedMarksMap = Map<string, PlacedMark>;

// Game/logic specific shapes
export interface MoveRecord {
   cellX: number;
   cellY: number;
   player: Mark;
   timestamp: number;
}

export interface PotentialWinLine {
   count: number;
   cells: [number, number][];
}

export interface GameStateShape extends Partial<GameState> {
   gameMode?: GameMode;
   gamePhase?: GamePhase;
   isGameOver?: boolean;
   isMyTurn?: boolean;
   hasOpponent?: boolean;
   showMenu?: boolean;
   isGameActive?: boolean; // Computed property
}

export interface CameraStateShape extends Required<CameraStateUpdate> {
   scale: number;
   x: number;
   y: number;
}

export interface GridRendererLike {
   drawGrid(scale: number, x: number, y: number): void;
   addPlayerMark(cellX: number, cellY: number, player: Mark, scale?: number): any;
   clearHover(): void;
   updateHoverCell(
      event: any,
      scale: number,
      gameState: GameStateShape,
      isDragging: boolean,
      hasMoved: boolean,
      placedMarks: PlacedMarksMap
   ): void;
   onResize(): void;
   highlightLastMove(cellX: number, cellY: number, player: Mark): void;
   animateWinningLine?(cells: [number, number][]): Promise<void>;
   restart?(): void;
   destroy?(): void;
}

export interface CameraControllerLike extends EventTarget {
   scale: number;
   getCameraState?(): CameraStateShape;
   adjustToCell(targetX: number, targetY: number): Promise<void>;
   resetCamera?(): void;
   destroy?(): void;
}

export interface UIRendererLike extends EventTarget {
   initialize(): void;
}

export interface GameLogicLike extends EventTarget {
   isGameOver?: boolean;
   getGameState?(): GameStateShape;
   placeMark?(x: number, y: number): {success: boolean} | undefined;
   startGame(mode: GameMode, options?: Record<string, any>): void;
   updateGameState?(state: Partial<GameStateShape>): void;
   executeMove?(x: number, y: number, player: Mark): void;
   resetGame?(): void;
   requestRematch?(): void;
   destroy?(): void;
   dispatchEvent(event: Event): boolean;
   addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
   ): void;
}

export interface NetworkManagerLike extends EventTarget {
   createRoom(): boolean;
   joinRoom(roomId: string): boolean;
   leaveRoom(): void;
   sendMove?(x: number, y: number): void;
   getNetworkState?(): any;
   acceptRematch?(): void;
   declineRematch?(): void;
   cancelRematch?(): void;
   resign?(): void;
   destroy?(): void;
}

export interface GameStateManagerLike extends EventTarget {
   GAME_PHASES?: Record<string, string> & {ENDED?: string};
   getState(): GameStateShape;
   isGameActive(): boolean;
   switchTurn?(): void;
   endGame?(opts: any): void;
   startGame(mode: GameMode, options?: any): void;
   resetGame?(opts?: any): void;
   set?(key: string, value: any): void;
   addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
   ): void;
}

export interface CameraUpdateEvent extends CustomEvent {
   detail: {
      scale: number;
      x: number;
      y: number;
   };
}

export interface DragStartEvent extends CustomEvent {
   detail: {
      cellX: number;
      cellY: number;
   };
}

export interface CellClickEvent extends CustomEvent {
   detail: {
      cellX: number;
      cellY: number;
   };
}

export interface PointerMoveEvent extends CustomEvent {
   detail: {
      event: PointerEvent;
      isDragging: boolean;
      hasMoved: boolean;
   };
}

export interface MoveAttemptedEvent extends CustomEvent {
   detail: {
      x: number;
      y: number;
      player: Mark;
      success: boolean;
      reason?: string;
   };
}

export interface MovePlacedEvent extends CustomEvent {
   detail: {
      cellX: number;
      cellY: number;
      player: Mark;
   };
}

export interface GameWonEvent extends CustomEvent {
   detail: {
      winner: Mark;
      winningCells: [number, number][];
   };
}

export interface GameDrawEvent extends CustomEvent {
   detail: Record<string, unknown>;
}

export interface StateChangedEvent extends CustomEvent {
   detail: {
      gameState: GameStateShape;
   };
}

export interface NetworkEvent extends CustomEvent {
   detail: {
      attempts?: number;
      roomId?: string;
      playerMark?: Mark;
      inviteUrl?: string;
      isMyTurn?: boolean;
      cellX?: number;
      cellY?: number;
      player?: Mark;
      error?: Error;
   };
}

export interface GameStateEvent extends CustomEvent {
   detail: {
      from?: string;
      to?: string;
      currentPlayer?: Mark;
      isMyTurn?: boolean;
      winner?: Mark | null;
      currentMenu?: string;
      showMenu?: boolean;
      isConnected?: boolean;
      isReconnecting?: boolean;
   };
}

export interface UIEvent extends CustomEvent {
   detail: {
      roomId?: string;
   };
}

export interface ComponentClasses {
   GridRenderer?: new (app: PIXI.Application, gridContainer: PIXI.Container) => GridRendererLike;
   CameraController?: new (
      app: PIXI.Application,
      gridContainer: PIXI.Container
   ) => CameraControllerLike;
   GameLogic?: new () => GameLogicLike;
   NetworkManager?: new () => NetworkManagerLike;
   GameStateManager?: new () => GameStateManagerLike;
   UIRenderer?: new (gameStateManager: GameStateManagerLike) => UIRendererLike;
}
