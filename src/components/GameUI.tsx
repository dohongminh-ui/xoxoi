import {StatusBar, MainMenu, GameEndMenu} from './index';
import {useGameEnd} from '../hooks';
import type {GameMode, GameSettings} from '../types/game-settings';
import GameSettingsMenu from './GameSettingsMenu/GameSettingsMenu';

type StatusBarProps = {
   gameStatus?: string;
   showExitGameButton?: boolean;
   showResignButton?: boolean;
   onExitGame?: () => void;
   onResign?: () => void;
};

type MenuProps = {
   isVisible?: boolean;
   onStartSinglePlayer?: () => void;
   onStartBotGame?: () => void;
   onCreateMultiplayer?: () => void;
   onJoinMultiplayer?: (roomId: string) => void;
};

type GameSettingProps = {
   isVisible: boolean;
   selectedMode: GameMode;
   onStartGame: (setting: GameSettings) => void;
   onCancel: () => void;
};

type GameUIProps = {
   statusBarState: Omit<StatusBarProps, 'onExitGame' | 'onResign'>;
   statusBarActions: Required<Pick<StatusBarProps, 'onExitGame'>> &
      Partial<Pick<StatusBarProps, 'onResign'>>;
   menuState: Pick<MenuProps, 'isVisible'>;
   menuActions: Required<
      Pick<
         MenuProps,
         'onStartSinglePlayer' | 'onStartBotGame' | 'onCreateMultiplayer' | 'onJoinMultiplayer'
      >
   >;
   settingsState: Pick<GameSettingProps, 'isVisible' | 'selectedMode'>;
   settingsActions: Pick<GameSettingProps, 'onStartGame' | 'onCancel'>;
};

const GameUI = ({
   statusBarState,
   statusBarActions,
   menuState,
   menuActions,
   settingsState,
   settingsActions,
}: GameUIProps) => {
   // The GameEngine instance is owned in App; to access here, we derive via window or props
   // As a pragmatic approach, use window.gameEngine if available
   const ge = (window as any).gameEngine ?? null;
   const {
      isVisible: isGameEndVisible,
      data: gameEndData,
      animationComplete,
      actions: gameEndActions,
   } = useGameEnd(ge);

   return (
      <div className='ui-overlay'>
         <StatusBar {...statusBarState} {...statusBarActions} isGameEnded={!!gameEndData} />
         <MainMenu {...menuState} {...menuActions} />

         {settingsState.selectedMode && (
            <GameSettingsMenu
               isVisible={settingsState.isVisible}
               selectedMode={settingsState.selectedMode}
               onStartGame={settingsActions.onStartGame}
               onCancel={settingsActions.onCancel}
            />
         )}

         {isGameEndVisible && gameEndData && (
            <GameEndMenu
               data={gameEndData}
               actions={gameEndActions}
               animationComplete={animationComplete}
            />
         )}
      </div>
   );
};

export default GameUI;
