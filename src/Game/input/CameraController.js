import { GAME_CONSTANTS, CELL_SIZE } from '../core/constants.js';
import { clamp } from '../core/utils.js';

/**
 * CameraController handles all camera-related functionality
 * Including zoom, pan, drag, momentum physics, and camera adjustments
 */
export class CameraController extends EventTarget {
   constructor(app, gridContainer) {
      super();
      this.app = app;
      this.gridContainer = gridContainer;

      // Camera state
      this.scale = 1;
      this.velocity = { x: 0, y: 0 };

      // Drag state
      this.isDragging = false;
      this.hasMoved = false;
      this.totalMovement = 0;
      this.dragStart = { x: 0, y: 0 };
      this.lastDragPosition = null;
      this.lastDragTime = 0;

      // Setup initial container scale
      this.gridContainer.scale.set(this.scale);

      // Setup event listeners
      this.setupEventListeners();

      // Start momentum update loop
      this.app.ticker.add(this.updateMomentum.bind(this));
   }

   /**
    * Setup all camera-related event listeners
    */
   setupEventListeners() {
      // Zoom/wheel events
      this.app.view.addEventListener("wheel", this.handleWheel.bind(this));

      // Drag events
      this.app.stage.on("pointerdown", this.handlePointerDown.bind(this));
      this.app.stage.on("pointermove", this.handlePointerMove.bind(this));
      this.app.stage.on("pointerup", this.handlePointerUp.bind(this));
      this.app.stage.on("pointerupoutside", this.handlePointerUpOutside.bind(this));
   }

   /**
    * Handle mouse wheel zoom
    * @param {WheelEvent} event - Wheel event
    */
   handleWheel(event) {
      event.preventDefault();

      const mousePos = {
         x: event.offsetX,
         y: event.offsetY
      };

      const zoomFactor = event.deltaY < 0 ?
         (1 + GAME_CONSTANTS.ZOOM_SPEED) :
         (1 - GAME_CONSTANTS.ZOOM_SPEED);

      const newScale = this.scale * zoomFactor;

      // Clamp scale to valid range
      if (!(newScale >= GAME_CONSTANTS.MIN_SCALE && newScale <= GAME_CONSTANTS.MAX_SCALE)) {
         return;
      }

      // Calculate zoom point in local coordinates
      const localPos = {
         x: (mousePos.x - this.gridContainer.x) / this.scale,
         y: (mousePos.y - this.gridContainer.y) / this.scale
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
      this.dispatchEvent(new CustomEvent('cameraUpdate', {
         detail: {
            scale: this.scale,
            x: this.gridContainer.x,
            y: this.gridContainer.y,
            type: 'zoom',
            mousePos
         }
      }));

      // Emit hover update with the current mouse position
      this.dispatchEvent(new CustomEvent('pointerMove', {
         detail: {
            event: {
               data: {
                  getLocalPosition: () => ({
                     x: (mousePos.x - this.gridContainer.x) / this.scale,
                     y: (mousePos.y - this.gridContainer.y) / this.scale
                  })
               }
            },
            isDragging: false,
            hasMoved: false,
            isZoom: true
         }
      }));
   }

   /**
    * Handle pointer down (start dragging)
    * @param {PIXI.InteractionEvent} event - Pointer event
    */
   handlePointerDown(event) {
      this.isDragging = true;
      this.hasMoved = false;
      this.totalMovement = 0;
      this.dragStart = event.data.getLocalPosition(this.app.stage);
      this.lastDragPosition = { ...this.dragStart };
      this.lastDragTime = Date.now();
      this.velocity = { x: 0, y: 0 };

      // Compute initial cell under pointer in grid coordinates
      let heldCell = null;
      try {
         const gridPos = event.data.getLocalPosition(this.gridContainer);
         if (gridPos && isFinite(gridPos.x) && isFinite(gridPos.y)) {
            const cellX = Math.floor(gridPos.x / CELL_SIZE);
            const cellY = Math.floor(gridPos.y / CELL_SIZE);
            heldCell = { cellX, cellY };
         }
      } catch (_) { /* ignore */ }

      this.dispatchEvent(new CustomEvent('dragStart', {
         detail: { position: this.dragStart, ...(heldCell || {}) }
      }));
   }

   /**
    * Handle pointer move (dragging)
    * @param {PIXI.InteractionEvent} event - Pointer event
    */
   handlePointerMove(event) {
      if (this.isDragging) {
         const newPosition = event.data.getLocalPosition(this.app.stage);
         const currentTime = Date.now();
         const timeElapsed = currentTime - this.lastDragTime;

         // Calculate velocity for momentum
         if (timeElapsed > 0) {
            this.velocity.x = (newPosition.x - this.lastDragPosition.x) / timeElapsed * 16.67 * GAME_CONSTANTS.VELOCITY_DAMPING;
            this.velocity.y = (newPosition.y - this.lastDragPosition.y) / timeElapsed * 16.67 * GAME_CONSTANTS.VELOCITY_DAMPING;
         }

         // Calculate movement delta
         const dx = newPosition.x - this.dragStart.x;
         const dy = newPosition.y - this.dragStart.y;
         this.totalMovement += Math.sqrt(dx * dx + dy * dy);

         // Determine if this counts as significant movement
         if (this.totalMovement > 10) {
            this.hasMoved = true;
         }

         // Apply camera movement if dragging
         if (this.hasMoved) {
            this.gridContainer.x += dx;
            this.gridContainer.y += dy;

            this.dispatchEvent(new CustomEvent('cameraUpdate', {
               detail: {
                  scale: this.scale,
                  x: this.gridContainer.x,
                  y: this.gridContainer.y,
                  type: 'drag',
                  delta: { dx, dy }
               }
            }));
         }

         this.dragStart = newPosition;
         this.lastDragPosition = { ...newPosition };
         this.lastDragTime = currentTime;
      }

      // Always emit pointer move for hover effects
      this.dispatchEvent(new CustomEvent('pointerMove', {
         detail: {
            event,
            isDragging: this.isDragging,
            hasMoved: this.hasMoved
         }
      }));
   }

   /**
    * Handle pointer up (end dragging)
    * @param {PIXI.InteractionEvent} event - Pointer event
    */
   handlePointerUp(event) {
      const wasClick = this.isDragging && !this.hasMoved;

      this.isDragging = false;

      // Emit click event if it was a click rather than a drag
      if (wasClick) {
         const pos = event.data.getLocalPosition(this.gridContainer);
         const cellX = Math.floor(pos.x / CELL_SIZE);
         const cellY = Math.floor(pos.y / CELL_SIZE);

         this.dispatchEvent(new CustomEvent('cellClick', {
            detail: { cellX, cellY, event }
         }));
      }

      this.dispatchEvent(new CustomEvent('dragEnd', {
         detail: {
            wasClick,
            event,
            finalVelocity: { ...this.velocity }
         }
      }));

      // Always emit pointer move to update hover state
      this.dispatchEvent(new CustomEvent('pointerMove', {
         detail: {
            event,
            isDragging: this.isDragging,
            hasMoved: this.hasMoved
         }
      }));
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
      if (this.isDragging ||
         (Math.abs(this.velocity.x) <= GAME_CONSTANTS.MIN_VELOCITY &&
            Math.abs(this.velocity.y) <= GAME_CONSTANTS.MIN_VELOCITY)) {
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
      this.dispatchEvent(new CustomEvent('cameraUpdate', {
         detail: {
            scale: this.scale,
            x: this.gridContainer.x,
            y: this.gridContainer.y,
            type: 'momentum'
         }
      }));

      // Emit hover update for momentum movement
      // Get current mouse position from PIXI
      const mousePosition = this.app.renderer.plugins.interaction?.mouse?.global ||
         this.app.renderer.events?.pointer ||
         { x: 0, y: 0 };

      this.dispatchEvent(new CustomEvent('pointerMove', {
         detail: {
            event: {
               data: {
                  getLocalPosition: (container) => {
                     return container === this.gridContainer ? {
                        x: (mousePosition.x - this.gridContainer.x) / this.scale,
                        y: (mousePosition.y - this.gridContainer.y) / this.scale
                     } : mousePosition;
                  }
               }
            },
            isDragging: false,
            hasMoved: false,
            isMomentum: true
         }
      }));
   }

   /**
    * Smoothly adjust camera to ensure a target cell is visible
    * @param {number} targetX - Target cell X coordinate
    * @param {number} targetY - Target cell Y coordinate
    * @returns {Promise} Promise that resolves when adjustment is complete
    */
   adjustToCell(targetX, targetY) {
      return new Promise((resolve) => {
         let isAnimating = true;

         const animate = () => {
            if (!isAnimating) {
               resolve();
               return;
            }

            const markWorldX = targetX * CELL_SIZE * this.scale + this.gridContainer.x;
            const markWorldY = targetY * CELL_SIZE * this.scale + this.gridContainer.y;
            const markSize = CELL_SIZE * this.scale;
            const statusBarHeight = (document.getElementById("statusBar")?.offsetHeight || 0) + 40;

            let needsAdjustment = false;
            const adjustments = { x: 0, y: 0 };

            // Check if mark is outside viewport bounds
            if (markWorldX < 0) {
               adjustments.x = -markWorldX + GAME_CONSTANTS.MARK_PADDING;
               needsAdjustment = true;
            } else if (markWorldX + markSize > window.innerWidth) {
               adjustments.x = window.innerWidth - (markWorldX + markSize) - GAME_CONSTANTS.MARK_PADDING;
               needsAdjustment = true;
            }

            if (markWorldY < statusBarHeight) {
               adjustments.y = statusBarHeight - markWorldY + GAME_CONSTANTS.MARK_PADDING;
               needsAdjustment = true;
            } else if (markWorldY + markSize > window.innerHeight) {
               adjustments.y = window.innerHeight - (markWorldY + markSize) - GAME_CONSTANTS.MARK_PADDING;
               needsAdjustment = true;
            }

            if (needsAdjustment) {
               // Apply smooth movement
               this.gridContainer.x += adjustments.x * GAME_CONSTANTS.CAMERA_SPEED;
               this.gridContainer.y += adjustments.y * GAME_CONSTANTS.CAMERA_SPEED;

               this.dispatchEvent(new CustomEvent('cameraUpdate', {
                  detail: {
                     scale: this.scale,
                     x: this.gridContainer.x,
                     y: this.gridContainer.y,
                     type: 'adjustment'
                  }
               }));

               // Update hover during camera adjustment
               const mousePosition = this.app.renderer.plugins.interaction?.mouse?.global ||
                  this.app.renderer.events?.pointer ||
                  { x: 0, y: 0 };

               this.dispatchEvent(new CustomEvent('pointerMove', {
                  detail: {
                     event: {
                        data: {
                           getLocalPosition: (container) => {
                              return container === this.gridContainer ? {
                                 x: (mousePosition.x - this.gridContainer.x) / this.scale,
                                 y: (mousePosition.y - this.gridContainer.y) / this.scale
                              } : mousePosition;
                           }
                        }
                     },
                     isDragging: false,
                     hasMoved: false,
                     isAdjustment: true
                  }
               }));

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
    * @returns {Object} Camera state
    */
   getCameraState() {
      return {
         scale: this.scale,
         x: this.gridContainer.x,
         y: this.gridContainer.y,
         isDragging: this.isDragging,
         hasMoved: this.hasMoved,
         velocity: { ...this.velocity }
      };
   }

   /**
    * Set camera position and scale
    * @param {number} x - X position
    * @param {number} y - Y position
    * @param {number} scale - Scale factor
    */
   setCameraState(x, y, scale) {
      this.scale = clamp(scale, GAME_CONSTANTS.MIN_SCALE, GAME_CONSTANTS.MAX_SCALE);
      this.gridContainer.x = x;
      this.gridContainer.y = y;
      this.gridContainer.scale.set(this.scale);

      this.dispatchEvent(new CustomEvent('cameraUpdate', {
         detail: {
            scale: this.scale,
            x: this.gridContainer.x,
            y: this.gridContainer.y,
            type: 'manual'
         }
      }));

      // Update hover after manual camera change
      const mousePosition = this.app.renderer.plugins.interaction?.mouse?.global ||
         this.app.renderer.events?.pointer ||
         { x: 0, y: 0 };

      this.dispatchEvent(new CustomEvent('pointerMove', {
         detail: {
            event: {
               data: {
                  getLocalPosition: (container) => {
                     return container === this.gridContainer ? {
                        x: (mousePosition.x - this.gridContainer.x) / this.scale,
                        y: (mousePosition.y - this.gridContainer.y) / this.scale
                     } : mousePosition;
                  }
               }
            },
            isDragging: false,
            hasMoved: false,
            isManual: true
         }
      }));
   }

   /**
    * Reset camera to default position and scale
    */
   resetCamera() {
      this.setCameraState(0, 0, 1);
      this.velocity = { x: 0, y: 0 };
   }

   /**
    * Clean up resources and event listeners
    */
   destroy() {
      // Remove ticker
      this.app.ticker.remove(this.updateMomentum);

      // Remove event listeners
      this.app.view.removeEventListener("wheel", this.handleWheel);
      this.app.stage.off("pointerdown", this.handlePointerDown);
      this.app.stage.off("pointermove", this.handlePointerMove);
      this.app.stage.off("pointerup", this.handlePointerUp);
      this.app.stage.off("pointerupoutside", this.handlePointerUpOutside);

      // Reset velocity
      this.velocity = { x: 0, y: 0 };
   }
}
