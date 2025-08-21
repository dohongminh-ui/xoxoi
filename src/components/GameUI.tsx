import {StatusBar, MainMenu, GameEndMenu} from './index';
import {useGameEnd} from '../hooks';

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
};

const GameUI = ({statusBarState, statusBarActions, menuState, menuActions}: GameUIProps) => {
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
         <StatusBar {...statusBarState} {...statusBarActions} />
         <MainMenu {...menuState} {...menuActions} />
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
