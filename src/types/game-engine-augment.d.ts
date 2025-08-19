// Augment GameEngine surface for UI hooks usage without depending on internals
import type {GameEngine as _GameEngine} from '../Game/core/GameEngine';
import type {
   GridRendererLike,
   CameraControllerLike,
   GameLogicLike,
   NetworkManagerLike,
   GameStateManagerLike,
   UIRendererLike,
   PlacedMarksMap,
} from './engine';

declare module '../Game/core/GameEngine' {
   interface GameEngine {
      app: PIXI.Application | undefined;
      gridContainer: PIXI.Container | undefined;
      gridRenderer: GridRendererLike | undefined;
      cameraController: CameraControllerLike | undefined;
      uiRenderer: UIRendererLike | undefined;
      gameLogic: GameLogicLike | undefined;
      gameStateManager: GameStateManagerLike | undefined;
      networkManager: NetworkManagerLike | undefined;
      components: Record<string, any>;
      placedMarks: PlacedMarksMap | undefined;
      startSinglePlayerGame: () => void;
      startBotGame: () => void;
      createMultiplayerGame: () => boolean;
      joinMultiplayerGame: (roomId: string) => boolean;
      leaveMultiplayerGame: () => void;
   }
}
