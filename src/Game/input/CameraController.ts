import {GAME_CONSTANTS, CELL_SIZE, GRID_SIZE} from '../core/constants';
import {clamp} from '../core/utils';
import type {
   Point,
   Delta,
   CameraState,
   CameraUpdateDetail,
   PointerMoveDetail,
   MockInteractionEvent,
   DragStartDetail,
   CellClickDetail,
   DragEndDetail,
   CameraResetDetail,
   TickerFunction,
} from '../../types/camera';

/**
 * CameraController handles all camera-related functionality
 * Including zoom, pan, drag, momentum physics, and camera adjustments
 */
export class CameraController extends EventTarget {
   app: PIXI.Application;
   gridContainer: PIXI.Container;
   scale: number;
   isDragging: boolean;
   hasMoved: boolean;
   totalMovement: number;
   dragStart: Point;
   initialDown: Point;
   lastDragPosition: Point | null;
   lastDragTime: number;
   velocity: Point;

   private boundUpdateMomentum: TickerFunction;
   private boundHandleWheel: (event: WheelEvent) => void;
   private boundHandlePointerDown: (event: PIXI.InteractionEventLike) => void;
   private boundHandlePointerMove: (event: PIXI.InteractionEventLike) => void;
   private boundHandlePointerUp: (event: PIXI.InteractionEventLike) => void;
   private boundHandlePointerUpOutside: () => void;

   constructor(app: PIXI.Application, gridContainer: PIXI.Container) {
      super();

      this.app = app;
      this.gridContainer = gridContainer;

      // Camera state
      this.scale = 1;
      this.velocity = {x: 0, y: 0};

      // Drag state
      this.isDragging = false;
      this.hasMoved = false;
      this.totalMovement = 0;
      this.dragStart = {x: 0, y: 0};
      this.initialDown = {x: 0, y: 0};
      this.lastDragPosition = null;
      this.lastDragTime = 0;

      // Bind methods to preserve 'this' context
      this.boundUpdateMomentum = this.updateMomentum.bind(this);
      this.boundHandleWheel = this.handleWheel.bind(this);
      this.boundHandlePointerDown = this.handlePointerDown.bind(this);
      this.boundHandlePointerMove = this.handlePointerMove.bind(this);
      this.boundHandlePointerUp = this.handlePointerUp.bind(this);
      this.boundHandlePointerUpOutside = this.handlePointerUpOutside.bind(this);

      // Setup initial container scale
      this.gridContainer.scale.set(this.scale);

      // Setup event listeners
      this.setupEventListeners();

      // Start momentum update loop
      this.app.ticker.add(this.boundUpdateMomentum);
   }

   /**
    * Setup all camera-related event listeners
    */
   setupEventListeners() {
      // Zoom/wheel events
      this.app.view.addEventListener('wheel', this.boundHandleWheel);

      // Drag events
      this.app.stage.on('pointerdown', this.boundHandlePointerDown);
      this.app.stage.on('pointermove', this.boundHandlePointerMove);
      this.app.stage.on('pointerup', this.boundHandlePointerUp);
      this.app.stage.on('pointerupoutside', this.boundHandlePointerUpOutside);
   }

   /**
    * Get current mouse position from PIXI renderer
    */
   private getCurrentMousePosition(): Point {
      const interaction = (this.app.renderer as any)?.plugins?.interaction;
      const events = (this.app.renderer as any)?.events;

      if (interaction?.mouse?.global) {
         return {
            x: interaction.mouse.global.x,
            y: interaction.mouse.global.y,
         };
      }

      if (events?.pointer) {
         return {
            x: events.pointer.x,
            y: events.pointer.y,
         };
      }

      // Fallback to center of screen
      return {x: 0, y: 0};
   }

   /**
    * Create a mock interaction event for camera updates
    */
   private createMockInteractionEvent(mousePosition: Point): MockInteractionEvent {
      return {
         data: {
            getLocalPosition: (container: PIXI.Container) => {
               if (container === this.gridContainer) {
                  return {
                     x: (mousePosition.x - this.gridContainer.x) / this.scale,
                     y: (mousePosition.y - this.gridContainer.y) / this.scale,
                  };
               }
               return mousePosition;
            },
         },
      };
   }

   /**
    * Handle mouse wheel zoom
    * @param {WheelEvent} event - Wheel event
    */
   handleWheel(event: WheelEvent) {
      event.preventDefault();

      const mousePos: Point = {
         x: event.offsetX,
         y: event.offsetY,
      };

      const zoomFactor =
         event.deltaY < 0 ? 1 + GAME_CONSTANTS.ZOOM_SPEED : 1 - GAME_CONSTANTS.ZOOM_SPEED;
      const newScale = this.scale * zoomFactor;

      // Clamp scale to valid range
      if (!(newScale >= GAME_CONSTANTS.MIN_SCALE && newScale <= GAME_CONSTANTS.MAX_SCALE)) {
         return;
      }

      // Calculate zoom point in local coordinates
      const localPos: Point = {
         x: (mousePos.x - this.gridContainer.x) / this.scale,
         y: (mousePos.y - this.gridContainer.y) / this.scale,
      };

      // Calculate new container position to keep zoom point stationary
      const newX = mousePos.x - localPos.x * newScale;
      const newY = mousePos.y - localPos.y * newScale;

      // Apply new scale and position
      this.scale = newScale;
      this.gridContainer.scale.set(this.scale);
      this.gridContainer.x = newX;
      this.gridContainer.y = newY;

      // Emit events for other components to respond
      const cameraDetail: CameraUpdateDetail = {
         scale: this.scale,
         x: this.gridContainer.x,
         y: this.gridContainer.y,
         type: 'zoom',
         mousePos,
      };

      this.dispatchEvent(
         new CustomEvent('cameraUpdate', {
            detail: cameraDetail,
         })
      );

      // Emit hover update with the current mouse position
      const mockEvent = this.createMockInteractionEvent(mousePos);
      const pointerDetail: PointerMoveDetail = {
         event: mockEvent,
         isDragging: false,
         hasMoved: false,
         isZoom: true,
      };

      this.dispatchEvent(
         new CustomEvent('pointerMove', {
            detail: pointerDetail,
         })
      );
   }

   /**
    * Handle pointer down (start dragging)
    * @param {PIXI.InteractionEvent} event - Pointer event
    */
   handlePointerDown(event: PIXI.InteractionEventLike) {
      this.isDragging = true;
      this.hasMoved = false;
      this.totalMovement = 0;
      this.dragStart = event.data.getLocalPosition(this.app.stage);
      this.initialDown = {...this.dragStart};
      this.lastDragPosition = {...this.dragStart};
      this.lastDragTime = Date.now();
      this.velocity = {x: 0, y: 0};

      const pos = event.data.getLocalPosition(this.gridContainer);
      const cellX = Math.floor(pos.x / CELL_SIZE);
      const cellY = Math.floor(pos.y / CELL_SIZE);

      this.dispatchEvent(
         new CustomEvent('dragStart', {
            detail: {
               position: this.dragStart,
               cellX,
               cellY,
            } as DragStartDetail,
         })
      );
   }

   /**
    * Handle pointer move (dragging)
    * @param {PIXI.InteractionEvent} event - Pointer event
    */
   handlePointerMove(event: PIXI.InteractionEventLike) {
      if (this.isDragging) {
         const newPosition = event.data.getLocalPosition(this.app.stage);
         const currentTime = Date.now();
         const timeElapsed = currentTime - this.lastDragTime;

         // Calculate velocity for momentum
         if (timeElapsed > 0) {
            const lastPos = this.lastDragPosition ?? newPosition;
            this.velocity.x =
               ((newPosition.x - lastPos.x) / timeElapsed) *
               16.67 *
               GAME_CONSTANTS.VELOCITY_DAMPING;
            this.velocity.y =
               ((newPosition.y - lastPos.y) / timeElapsed) *
               16.67 *
               GAME_CONSTANTS.VELOCITY_DAMPING;
         }

         // Calculate movement delta
         const dx = newPosition.x - this.dragStart.x;
         const dy = newPosition.y - this.dragStart.y;
         this.totalMovement += Math.sqrt(dx * dx + dy * dy);

         // Use deadzone from the original pointer down to avoid false drags
         const netDx = newPosition.x - this.initialDown.x;
         const netDy = newPosition.y - this.initialDown.y;
         const netDistance = Math.hypot(netDx, netDy);
         if (netDistance > GAME_CONSTANTS.DRAG_DEADZONE) {
            this.hasMoved = true;
         }

         // Apply camera movement if dragging
         if (this.hasMoved) {
            this.gridContainer.x += dx;
            this.gridContainer.y += dy;

            const cameraDetail: CameraUpdateDetail = {
               scale: this.scale,
               x: this.gridContainer.x,
               y: this.gridContainer.y,
               type: 'drag',
               delta: {dx, dy},
            };

            this.dispatchEvent(
               new CustomEvent('cameraUpdate', {
                  detail: cameraDetail,
               })
            );
         }

         this.dragStart = newPosition;
         this.lastDragPosition = {...newPosition};
         this.lastDragTime = currentTime;
      }

      // Always emit pointer move for hover effects
      const pointerDetail: PointerMoveDetail = {
         event,
         isDragging: this.isDragging,
         hasMoved: this.hasMoved,
      };

      this.dispatchEvent(
         new CustomEvent('pointerMove', {
            detail: pointerDetail,
         })
      );
   }

   /**
    * Handle pointer up (end dragging)
    * @param {PIXI.InteractionEvent} event - Pointer event
    */
   handlePointerUp(event: PIXI.InteractionEventLike) {
      const wasClick = this.isDragging && !this.hasMoved;
      this.isDragging = false;
      this.initialDown = {x: 0, y: 0};

      // Emit click event if it was a click rather than a drag
      if (wasClick) {
         this.dispatchEvent(
            new CustomEvent('cellClick', {
               detail: {event} as CellClickDetail,
            })
         );
      }

      this.dispatchEvent(
         new CustomEvent('dragEnd', {
            detail: {
               wasClick,
               event,
               finalVelocity: {...this.velocity},
            } as DragEndDetail,
         })
      );

      // Always emit pointer move to update hover state
      const pointerDetail: PointerMoveDetail = {
         event,
         isDragging: this.isDragging,
         hasMoved: this.hasMoved,
      };

      this.dispatchEvent(
         new CustomEvent('pointerMove', {
            detail: pointerDetail,
         })
      );
   }

   /**
    * Handle pointer up outside (cancel dragging)
    */
   handlePointerUpOutside() {
      this.isDragging = false;
      this.dispatchEvent(new CustomEvent('dragCancel'));
   }

   /**
    * Update momentum physics (called every frame)
    */
   updateMomentum() {
      // Only apply momentum if not dragging and velocity is significant
      if (
         this.isDragging ||
         (Math.abs(this.velocity.x) <= GAME_CONSTANTS.MIN_VELOCITY &&
            Math.abs(this.velocity.y) <= GAME_CONSTANTS.MIN_VELOCITY)
      ) {
         return;
      }

      // Apply velocity to position
      this.gridContainer.x += this.velocity.x;
      this.gridContainer.y += this.velocity.y;

      // Apply friction
      this.velocity.x *= GAME_CONSTANTS.FRICTION;
      this.velocity.y *= GAME_CONSTANTS.FRICTION;

      // Stop small velocities
      if (Math.abs(this.velocity.x) < GAME_CONSTANTS.MIN_VELOCITY) this.velocity.x = 0;
      if (Math.abs(this.velocity.y) < GAME_CONSTANTS.MIN_VELOCITY) this.velocity.y = 0;

      // Emit camera update for grid redraw and hover updates
      const cameraDetail: CameraUpdateDetail = {
         scale: this.scale,
         x: this.gridContainer.x,
         y: this.gridContainer.y,
         type: 'momentum',
      };

      this.dispatchEvent(
         new CustomEvent('cameraUpdate', {
            detail: cameraDetail,
         })
      );

      // Emit hover update for momentum movement
      const mousePosition = this.getCurrentMousePosition();
      const mockEvent = this.createMockInteractionEvent(mousePosition);
      const pointerDetail: PointerMoveDetail = {
         event: mockEvent,
         isDragging: false,
         hasMoved: false,
         isMomentum: true,
      };

      this.dispatchEvent(
         new CustomEvent('pointerMove', {
            detail: pointerDetail,
         })
      );
   }

   /**
    * Smoothly adjust camera to ensure a target cell is visible
    * @param {number} targetX - Target cell X coordinate
    * @param {number} targetY - Target cell Y coordinate
    * @returns {Promise} Promise that resolves when adjustment is complete
    */
   adjustToCell(targetX: number, targetY: number): Promise<void> {
      return new Promise<void>(resolve => {
         let isAnimating = true;

         const animate = () => {
            if (!isAnimating) {
               resolve();
               return;
            }

            const markWorldX = targetX * CELL_SIZE * this.scale + this.gridContainer.x;
            const markWorldY = targetY * CELL_SIZE * this.scale + this.gridContainer.y;
            const markSize = CELL_SIZE * this.scale;
            const statusBarHeight = (document.getElementById('statusBar')?.offsetHeight || 0) + 40;

            let needsAdjustment = false;
            const adjustments: Point = {x: 0, y: 0};

            // Check if mark is outside viewport bounds
            if (markWorldX < 0) {
               adjustments.x = -markWorldX + GAME_CONSTANTS.MARK_PADDING;
               needsAdjustment = true;
            } else if (markWorldX + markSize > window.innerWidth) {
               adjustments.x =
                  window.innerWidth - (markWorldX + markSize) - GAME_CONSTANTS.MARK_PADDING;
               needsAdjustment = true;
            }

            if (markWorldY < statusBarHeight) {
               adjustments.y = statusBarHeight - markWorldY + GAME_CONSTANTS.MARK_PADDING;
               needsAdjustment = true;
            } else if (markWorldY + markSize > window.innerHeight) {
               adjustments.y =
                  window.innerHeight - (markWorldY + markSize) - GAME_CONSTANTS.MARK_PADDING;
               needsAdjustment = true;
            }

            if (needsAdjustment) {
               // Apply smooth movement
               this.gridContainer.x += adjustments.x * GAME_CONSTANTS.CAMERA_SPEED;
               this.gridContainer.y += adjustments.y * GAME_CONSTANTS.CAMERA_SPEED;

               const cameraDetail: CameraUpdateDetail = {
                  scale: this.scale,
                  x: this.gridContainer.x,
                  y: this.gridContainer.y,
                  type: 'adjustment',
               };

               this.dispatchEvent(
                  new CustomEvent('cameraUpdate', {
                     detail: cameraDetail,
                  })
               );

               // Update hover during camera adjustment
               const mousePosition = this.getCurrentMousePosition();
               const mockEvent = this.createMockInteractionEvent(mousePosition);
               const pointerDetail: PointerMoveDetail = {
                  event: mockEvent,
                  isDragging: false,
                  hasMoved: false,
                  isAdjustment: true,
               };

               this.dispatchEvent(
                  new CustomEvent('pointerMove', {
                     detail: pointerDetail,
                  })
               );

               requestAnimationFrame(animate);
               return;
            }

            isAnimating = false;
         };

         animate();
      });
   }

   /**
    * Get current camera state
    * @returns {CameraState} Camera state
    */
   getCameraState(): CameraState {
      return {
         scale: this.scale,
         x: this.gridContainer.x,
         y: this.gridContainer.y,
         isDragging: this.isDragging,
         hasMoved: this.hasMoved,
         velocity: {...this.velocity},
      };
   }

   /**
    * Set camera position and scale
    * @param {number} x - X position
    * @param {number} y - Y position
    * @param {number} scale - Scale factor
    */
   setCameraState(x: number, y: number, scale: number) {
      this.scale = clamp(scale, GAME_CONSTANTS.MIN_SCALE, GAME_CONSTANTS.MAX_SCALE);
      this.gridContainer.x = x;
      this.gridContainer.y = y;
      this.gridContainer.scale.set(this.scale);

      const cameraDetail: CameraUpdateDetail = {
         scale: this.scale,
         x: this.gridContainer.x,
         y: this.gridContainer.y,
         type: 'manual',
      };

      this.dispatchEvent(
         new CustomEvent('cameraUpdate', {
            detail: cameraDetail,
         })
      );

      // Update hover after manual camera change
      const mousePosition = this.getCurrentMousePosition();
      const mockEvent = this.createMockInteractionEvent(mousePosition);
      const pointerDetail: PointerMoveDetail = {
         event: mockEvent,
         isDragging: false,
         hasMoved: false,
         isManual: true,
      };

      this.dispatchEvent(
         new CustomEvent('pointerMove', {
            detail: pointerDetail,
         })
      );
   }

   /**
    * Reset camera to default position and scale
    */
   resetCamera() {
      this.velocity = {x: 0, y: 0};

      let toX = GRID_SIZE.INFINITE_X ? 0 : GRID_SIZE.X / 2;
      let toY = GRID_SIZE.INFINITE_Y ? 0 : GRID_SIZE.Y / 2;
      this.cameraToCell(toX, toY);

      this.dispatchEvent(
         new CustomEvent('cameraReset', {
            detail: {
               scale: this.scale,
               x: this.gridContainer.x,
               y: this.gridContainer.y,
            } as CameraResetDetail,
         })
      );
   }

   /**
    * Move camera to cell position
    * @param cellX - cell X to move to
    * @param cellY - cell Y to move to
    */
   cameraToCell(cellX: number, cellY: number) {
      const statusBarHeight = (document.getElementById('statusBar')?.offsetHeight || 0) + 40;

      // Calculate the position to center the camera on the cell
      const cornerX = window.innerWidth / 2 - cellX * this.scale;
      const cornerY = window.innerHeight / 2 - cellY * this.scale + statusBarHeight / 2;
      const offsetX = -cellX * CELL_SIZE * this.scale;
      const offsetY = -cellY * CELL_SIZE * this.scale;

      this.setCameraState(cornerX + offsetX, cornerY + offsetY, this.scale);
   }

   /**
    * Clean up resources and event listeners
    */
   destroy() {
      // Remove ticker
      this.app.ticker.remove(this.boundUpdateMomentum);

      // Remove event listeners
      this.app.view.removeEventListener('wheel', this.boundHandleWheel);
      this.app.stage.off('pointerdown', this.boundHandlePointerDown);
      this.app.stage.off('pointermove', this.boundHandlePointerMove);
      this.app.stage.off('pointerup', this.boundHandlePointerUp);
      this.app.stage.off('pointerupoutside', this.boundHandlePointerUpOutside);

      // Reset velocity
      this.velocity = {x: 0, y: 0};
   }
}
