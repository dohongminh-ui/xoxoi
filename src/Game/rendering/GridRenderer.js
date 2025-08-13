import { GAME_CONSTANTS, CELL_SIZE, COLORS } from '../core/constants.js';
import { coordKey } from '../core/utils.js';

/**
 * GridRenderer handles all grid visualization and rendering
 * Including grid lines, cell highlights, hover effects, and winning lines
 */
export class GridRenderer {
   constructor(app, gridContainer) {
      if (!app) {
         throw new Error('GridRenderer: app parameter is required');
      }
      if (!gridContainer) {
         throw new Error('GridRenderer: gridContainer parameter is required');
      }
      if (!app.stage) {
         throw new Error('GridRenderer: app.stage is not available');
      }

      this.app = app;
      this.gridContainer = gridContainer;

      this.hoverGraphics = new PIXI.Graphics();
      this.currentHighlight = null;
      this.winningCells = null;

      this.app.stage.addChild(this.hoverGraphics);
   }

   /**
    * Draw the grid lines based on current scale and position
    * @param {number} scale - Current grid scale
    * @param {number} gridX - Grid container X position
    * @param {number} gridY - Grid container Y position
    */
   drawGrid(scale, gridX, gridY) {
      for (let i = this.gridContainer.children.length - 1; i >= 0; i--) {
         const child = this.gridContainer.children[i];
         if (
            child instanceof PIXI.Graphics &&
            child !== this.currentHighlight &&
            !child.isWinningLine &&
            !child.isPlayerMark
         ) {
            this.gridContainer.removeChild(child);
         }
      }

      const graphics = new PIXI.Graphics();
      graphics.lineStyle(1 / scale, COLORS.GRID_LINE, 1);

      // Calculate visible grid bounds with padding
      const startX = Math.floor(-gridX / (CELL_SIZE * scale)) - 20;
      const startY = Math.floor(-gridY / (CELL_SIZE * scale)) - 20;
      const endX =
         startX + Math.ceil(this.app.screen.width / (CELL_SIZE * scale)) + 40;
      const endY =
         startY + Math.ceil(this.app.screen.height / (CELL_SIZE * scale)) + 40;

      // Draw vertical lines
      for (let x = startX; x <= endX; x++) {
         graphics.moveTo(x * CELL_SIZE, startY * CELL_SIZE);
         graphics.lineTo(x * CELL_SIZE, endY * CELL_SIZE);
      }

      // Draw horizontal lines
      for (let y = startY; y <= endY; y++) {
         graphics.moveTo(startX * CELL_SIZE, y * CELL_SIZE);
         graphics.lineTo(endX * CELL_SIZE, y * CELL_SIZE);
      }

      this.gridContainer.addChild(graphics);

      if (this.winningCells) {
         this.drawWinningLine(this.winningCells);
      }
   }

   /**
    * Draw the winning line strike-through
    * @param {Array} cells - Array of winning cell coordinates [[x,y], ...]
    */
   drawWinningLine(cells) {
      this.clearWinningLine();

      if (!cells || cells.length === 0) return;

      this.winningCells = cells;
      const graphics = new PIXI.Graphics();
      graphics.isWinningLine = true;

      const startCell = cells[0];
      const endCell = cells[cells.length - 1];

      const startX = startCell[0] * CELL_SIZE + CELL_SIZE / 2;
      const startY = startCell[1] * CELL_SIZE + CELL_SIZE / 2;
      const endX = endCell[0] * CELL_SIZE + CELL_SIZE / 2;
      const endY = endCell[1] * CELL_SIZE + CELL_SIZE / 2;

      graphics.lineStyle({
         width: GAME_CONSTANTS.STRIKE_WIDTH,
         color: GAME_CONSTANTS.STRIKE_COLOR,
         cap: 'round',
         join: 'round',
         alpha: 1
      });
      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, endY);

      this.gridContainer.addChild(graphics);
   }

   /**
    * Animate the winning line appearing
    * @param {Array} cells - Array of winning cell coordinates
    * @returns {Promise} Promise that resolves when animation completes
    */
   animateWinningLine(cells) {
      console.log('animateWinningLine called with:', cells);
      return new Promise((resolve) => {
         if (!cells || cells.length === 0) {
            resolve();
            return;
         }

         console.log('Starting winning animation for', cells.length, 'cells');
         this.winningCells = cells;
         const graphics = new PIXI.Graphics();
         graphics.isWinningLine = true;
         this.gridContainer.addChild(graphics);

         const startCell = cells[0];
         const endCell = cells[cells.length - 1];

         const startX = startCell[0] * CELL_SIZE + CELL_SIZE / 2;
         const startY = startCell[1] * CELL_SIZE + CELL_SIZE / 2;
         const endX = endCell[0] * CELL_SIZE + CELL_SIZE / 2;
         const endY = endCell[1] * CELL_SIZE + CELL_SIZE / 2;

         let progress = 0;
         const animate = () => {
            if (progress >= 1) {
               resolve();
               return;
            }

            progress += 1 / (GAME_CONSTANTS.STRIKE_ANIMATION_DURATION / 16.67);
            progress = Math.min(progress, 1);

            graphics.clear();
            graphics.lineStyle({
               width: GAME_CONSTANTS.STRIKE_WIDTH,
               color: GAME_CONSTANTS.STRIKE_COLOR,
               cap: 'round',
               join: 'round',
               alpha: 1
            });
            graphics.moveTo(startX, startY);
            graphics.lineTo(
               startX + (endX - startX) * progress,
               startY + (endY - startY) * progress
            );

            if (progress < 1) {
               requestAnimationFrame(animate);
            }
         };
         
         animate();
      });
   }

   /**
    * Clear the winning line
    */
   clearWinningLine() {
      for (let i = this.gridContainer.children.length - 1; i >= 0; i--) {
         const child = this.gridContainer.children[i];
         if (child instanceof PIXI.Graphics && child.isWinningLine) {
            this.gridContainer.removeChild(child);
         }
      }
      this.winningCells = null;
   }

   /**
    * Highlight the last move made
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    * @param {string} player - Player who made the move ('X' or 'O')
    */
   highlightLastMove(cellX, cellY, player) {
      if (this.currentHighlight) {
         this.gridContainer.removeChild(this.currentHighlight);
         this.currentHighlight = null;
      }

      const highlight = new PIXI.Graphics();
      const color = player === 'X' ? COLORS.PLAYER_X : COLORS.PLAYER_O;

      highlight.lineStyle(2, color, 0.5);
      highlight.beginFill(color, 0.2);
      highlight.drawRect(
         cellX * CELL_SIZE,
         cellY * CELL_SIZE,
         CELL_SIZE,
         CELL_SIZE
      );
      highlight.endFill();

      highlight.isHighlight = true;
      this.gridContainer.addChild(highlight);
      this.currentHighlight = highlight;
   }

   /**
    * Clear the current move highlight
    */
   clearHighlight() {
      if (this.currentHighlight) {
         this.gridContainer.removeChild(this.currentHighlight);
         this.currentHighlight = null;
      }
   }

   /**
    * Update hover cell visualization
    * @param {Object} event - Pointer event with position data
    * @param {number} scale - Current grid scale
    * @param {Object} gameState - Current game state
    * @param {boolean} isDragging - Whether user is currently dragging
    * @param {boolean} hasMoved - Whether drag has moved significantly
    * @param {Map} placedMarks - Map of placed marks
    */
   updateHoverCell(event, scale, gameState, isDragging, hasMoved, placedMarks) {
      this.hoverGraphics.clear();

      // Disable hover when not in an active game or when menu overlays are shown
      if (gameState?.gamePhase && gameState.gamePhase !== 'playing') return;
      if (typeof gameState?.isGameActive === 'boolean' && !gameState.isGameActive) return;
      if (gameState?.showMenu) return;
      if (gameState.isGameOver) return;
      if (gameState.gameMode === 'multi' && !gameState.isMyTurn) return;

      let pos;
      try {
         pos = event.data.getLocalPosition(this.gridContainer);
         if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' ||
            !isFinite(pos.x) || !isFinite(pos.y)) {
            return;
         }
      } catch (error) {
         return;
      }

      const cellX = Math.floor(pos.x / CELL_SIZE);
      const cellY = Math.floor(pos.y / CELL_SIZE);
      const key = coordKey(cellX, cellY);

      if (placedMarks.has(key)) return;

      const worldX = cellX * CELL_SIZE * scale + this.gridContainer.x;
      const worldY = cellY * CELL_SIZE * scale + this.gridContainer.y;

      this.hoverGraphics.lineStyle(1, COLORS.HOVER, 0.3);
      this.hoverGraphics.beginFill(COLORS.HOVER, 0.3);
      this.hoverGraphics.drawRect(
         worldX,
         worldY,
         CELL_SIZE * scale,
         CELL_SIZE * scale
      );
      this.hoverGraphics.endFill();
   }

   /**
    * Clear hover cell visualization
    */
   clearHover() {
      this.hoverGraphics.clear();
   }

   /**
    * Handle window resize
    */
   onResize() {
      const scale = this.gridContainer.scale.x;
      const gridX = this.gridContainer.x;
      const gridY = this.gridContainer.y;
      this.drawGrid(scale, gridX, gridY);
   }

   /**
    * Add a player mark to the grid
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    * @param {string} player - Player ('X' or 'O')
    * @param {number} scale - Current grid scale for sizing
    */
   addPlayerMark(cellX, cellY, player, scale) {
      const text = new PIXI.Text(player, {
         fontSize: 40,
         fill: player === 'X' ? COLORS.PLAYER_X : COLORS.PLAYER_O,
         align: 'center',
         fontWeight: 'bold'
      });

      text.anchor.set(0.5);
      text.x = cellX * CELL_SIZE + CELL_SIZE / 2;
      text.y = cellY * CELL_SIZE + CELL_SIZE / 2;

      const targetSize = CELL_SIZE * 0.8;
      const textScale = targetSize / Math.max(text.width, text.height);
      text.scale.set(textScale);

      text.isPlayerMark = true;
      this.gridContainer.addChild(text);

      return text;
   }

   /**
    * Clear all player marks from the grid
    */
   clearAllMarks() {
      for (let i = this.gridContainer.children.length - 1; i >= 0; i--) {
         const child = this.gridContainer.children[i];
         if (child.isPlayerMark || child instanceof PIXI.Text) {
            this.gridContainer.removeChild(child);
         }
      }
   }

   restart() {
      this.clearHighlight();
      this.clearWinningLine();
      this.clearAllMarks();
   }

   /**
    * Clean up resources
    */
   destroy() {
      if (this.hoverGraphics) {
         this.app.stage.removeChild(this.hoverGraphics);
         this.hoverGraphics.destroy();
      }

      this.clearHighlight();
      this.clearWinningLine();
      this.clearAllMarks();
   }
}
