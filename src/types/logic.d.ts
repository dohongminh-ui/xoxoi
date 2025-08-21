// Type definitions for GameLogic

import type {Mark, GameMode} from './state';
import type {PotentialWinLine, MoveRecord} from './engine';

export type GameStartOptions = {
   playerMark?: Mark;
   roomId?: string;
   isMyTurn?: boolean;
   hasOpponent?: boolean;
   currentPlayer?: Mark;
};

export type PlacedMarkEntry = {player: Mark; cellX?: number; cellY?: number; timestamp?: number};

export type Bounds = {minX: number; maxX: number; minY: number; maxY: number};

export type MoveValidationResult = {isValid: true} | {isValid: false; reason: string};

export type PlaceMarkSuccessBase = {
   success: true;
   cellX: number;
   cellY: number;
   player: Mark;
};

export type PlaceMarkFailure = {
   success: false;
   reason: string;
   cellX: number;
   cellY: number;
};

export type PlaceMarkWon = PlaceMarkSuccessBase & {
   gameWon: true;
   winner: Mark;
   winningCells: [number, number][];
};

export type PlaceMarkDraw = PlaceMarkSuccessBase & {gameDraw: true};

export type PlaceMarkNormal = PlaceMarkSuccessBase & {nextPlayer: Mark};

export type PlaceMarkMultiplayer = PlaceMarkSuccessBase & {multiplayer: true};

export type PlaceMarkResult =
   | PlaceMarkFailure
   | PlaceMarkWon
   | PlaceMarkDraw
   | PlaceMarkNormal
   | PlaceMarkMultiplayer;

export type GameLogicState = {
   gameMode: GameMode;
   currentPlayer: Mark;
   isGameOver: boolean;
   playerMark: Mark | '';
   roomId: string;
   isMyTurn: boolean;
   hasOpponent: boolean;
   placedMarks: Map<string, PlacedMarkEntry>;
   potentialWins: Map<string, PotentialWinLine>;
   winningCells: Array<[number, number]> | null;
   moveHistory: MoveRecord[];
   moveCount: number;
};
