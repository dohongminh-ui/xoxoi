export type GameMode = 'singleplayer' | 'multiplayer' | 'bot';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export type FirstPlayer = 'human' | 'bot' | 'random';

export type CustomGridOptions = '3x3' | '5x5' | 'infinite' | 'custom';

export type TimeLimitOptions = '180' | '300' | 'custom';

export interface GameSettings {
   mode: GameMode;
   boardSize: number;
   winCondition: number;
   botDifficulty?: BotDifficulty;
   firstPlayer: FirstPlayer;
   customGrid: CustomGridOptions;
   timeLimitOption?: TimeLimitOptions;
}
