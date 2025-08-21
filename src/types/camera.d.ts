// Type definitions for CameraController

export interface Point {
   x: number;
   y: number;
}

export interface Delta {
   dx: number;
   dy: number;
}

export interface CameraState {
   scale: number;
   x: number;
   y: number;
   isDragging: boolean;
   hasMoved: boolean;
   velocity: Point;
}

export interface CameraUpdateDetail {
   scale: number;
   x: number;
   y: number;
   type: 'zoom' | 'drag' | 'momentum' | 'adjustment' | 'manual';
   mousePos?: Point;
   delta?: Delta;
}

export interface PointerMoveDetail {
   event: PIXI.InteractionEventLike | MockInteractionEvent;
   isDragging: boolean;
   hasMoved: boolean;
   isZoom?: boolean;
   isMomentum?: boolean;
   isAdjustment?: boolean;
   isManual?: boolean;
}

export interface MockInteractionEvent {
   data: {
      getLocalPosition: (container: PIXI.Container) => Point;
   };
}

export interface DragStartDetail {
   position: Point;
   cellX: number;
   cellY: number;
}

export interface CellClickDetail {
   event: PIXI.InteractionEventLike;
}

export interface DragEndDetail {
   wasClick: boolean;
   event: PIXI.InteractionEventLike;
   finalVelocity: Point;
}

export interface CameraResetDetail {
   scale: number;
   x: number;
   y: number;
}

// Type for PIXI ticker function
export type TickerFunction = (deltaTime?: number) => void;
