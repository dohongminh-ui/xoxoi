/**
 * Utility functions used across the game
 */

/**
 * Generate a coordinate key from x, y coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {string} Coordinate key
 */
export function coordKey(x: any, y: any) {
   return `${x},${y}`;
}

/**
 * Parse a coordinate key back to x, y coordinates
 * @param {string} key - Coordinate key
 * @returns {Object} Object with x, y properties
 */
export function parseCoordKey(key: any) {
   const [x, y] = key.split(',').map(Number);
   return {x, y};
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value: any, min: any, max: any) {
   return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start: any, end: any, t: any) {
   return start + (end - start) * t;
}

/**
 * Calculate distance between two points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Distance between points
 */
export function distance(point1: any, point2: any) {
   const dx = point2.x - point1.x;
   const dy = point2.y - point1.y;
   return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func: any, wait: any) {
   let timeout: any;
   return function executedFunction(...args: any[]) {
      const later = () => {
         clearTimeout(timeout);
         func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
   };
}
