export const GAME_CONSTANTS = {
   // Grid and rendering
   CELL_SIZE: 50,
   MIN_SCALE: 0.1,
   MAX_SCALE: 6,
   ZOOM_SPEED: 0.1,

   // Visual styling
   STRIKE_COLOR: '#52575D',
   STRIKE_WIDTH: 5,
   STRIKE_ANIMATION_DURATION: 150,

   // Physics and movement
   FRICTION: 0.85,
   MIN_VELOCITY: 0.1,
   VELOCITY_DAMPING: 0.3,
   CAMERA_SPEED: 0.1,
   MARK_PADDING: 20,
   // Input thresholds
   DRAG_DEADZONE: 15,

   // Game rules
   WINNING_LENGTH: 5,

   // Colors
   COLORS: {
      BACKGROUND: '#FEF9F2',
      GRID_LINE: '#52575D',
      PLAYER_X: '#ff6969',
      PLAYER_O: '#a2bffe',
      HOVER: '#888888',
      HOVER_X: '#ff6969',
      HOVER_O: '#a2bffe',
   },
};

export const {
   CELL_SIZE,
   MIN_SCALE,
   MAX_SCALE,
   ZOOM_SPEED,
   STRIKE_COLOR,
   STRIKE_WIDTH,
   STRIKE_ANIMATION_DURATION,
   FRICTION,
   MIN_VELOCITY,
   VELOCITY_DAMPING,
   CAMERA_SPEED,
   MARK_PADDING,
   DRAG_DEADZONE,
   WINNING_LENGTH,
   COLORS,
} = GAME_CONSTANTS;
