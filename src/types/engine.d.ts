// Shared engine types used across engine, renderers, and controllers

export type Mark = 'X' | 'O';

export interface PlacedMark {
   player: Mark;
   x?: number;
   y?: number;
   graphics?: any; // PIXI.Text
}

export type PlacedMarksMap = Map<string, PlacedMark>;

export interface GameStateShape {
   gameMode?: ('single' | 'bot' | 'multi' | string) | undefined;
   gamePhase?: ('menu' | 'playing' | 'ended' | string) | undefined;
   isGameOver?: boolean | undefined;
   isMyTurn?: boolean | undefined;
   hasOpponent?: boolean | undefined;
   showMenu?: boolean | undefined;
   isGameActive?: boolean | undefined;
}

export interface CameraStateShape {
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
   startGame(mode: 'single' | 'bot' | 'multi', options?: Record<string, any>): void;
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
   destroy?(): void;
}

export interface GameStateManagerLike extends EventTarget {
   GAME_PHASES?: Record<string, string> & {ENDED?: string};
   getState(): GameStateShape;
   isGameActive(): boolean;
   switchTurn?(): void;
   endGame?(opts: any): void;
   startGame(mode: 'single' | 'bot' | 'multi', options?: any): void;
   resetGame?(opts?: any): void;
   set?(key: string, value: any): void;
   addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
   ): void;
}
