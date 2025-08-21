/**
 * Utility functions used across the game
 */

/**
 * Generate a coordinate key from x, y coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {string} Coordinate key
 */
export function coordKey(x: number, y: number): string {
   return `${x},${y}`;
}

/**
 * Parse a coordinate key back to x, y coordinates
 * @param {string} key - Coordinate key
 * @returns {Object} Object with x, y properties
 */
export function parseCoordKey(key: string): {x: number; y: number} {
   const [xs, ys] = key.split(',');
   const x = Number(xs);
   const y = Number(ys);
   return {x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0};
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
   return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
   return start + (end - start) * t;
}

/**
 * Calculate distance between two points
 * @param {Object} point1 - First point {x, y}
 * @param {Object} point2 - Second point {x, y}
 * @returns {number} Distance between points
 */
export function distance(point1: {x: number; y: number}, point2: {x: number; y: number}): number {
   const dx = point2.x - point1.x;
   const dy = point2.y - point1.y;
   return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Format duration in milliseconds to MM:SS format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms: number): string {
   const totalSeconds = Math.max(0, Math.floor(ms / 1000));
   const minutes = Math.floor(totalSeconds / 60);
   const seconds = totalSeconds % 60;
   return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): Function {
   let timeout: ReturnType<typeof setTimeout> | undefined;
   return function executedFunction(this: ThisParameterType<T>, ...args: Parameters<T>) {
      const later = () => {
         if (timeout) clearTimeout(timeout);
         func.apply(this, args);
      };
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
   };
}
