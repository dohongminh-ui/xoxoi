import {StatusBar, MainMenu, GameEndMenu, MenuOverlay} from './index';
import {useGameEnd} from '../hooks';

type StatusBarProps = {
   gameStatus?: string;
   showRestartButton?: boolean;
   showAcceptRematchButton?: boolean;
   showDeclineRematchButton?: boolean;
   showCancelRematchButton?: boolean;
   showExitGameButton?: boolean;
   onRestart?: () => void;
   onAcceptRematch?: () => void;
   onDeclineRematch?: () => void;
   onCancelRematch?: () => void;
   onExitGame?: () => void;
};

type MenuProps = {
   isVisible?: boolean;
   onStartSinglePlayer?: () => void;
   onStartBotGame?: () => void;
   onCreateMultiplayer?: () => void;
   onJoinMultiplayer?: (roomId: string) => void;
};

type GameUIProps = {
   statusBarState: Omit<
      StatusBarProps,
      'onRestart' | 'onAcceptRematch' | 'onDeclineRematch' | 'onCancelRematch' | 'onExitGame'
   >;
   statusBarActions: Required<
      Pick<
         StatusBarProps,
         'onRestart' | 'onAcceptRematch' | 'onDeclineRematch' | 'onCancelRematch' | 'onExitGame'
      >
   >;
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
   const {isVisible: isGameEndVisible, data: gameEndData, actions: gameEndActions} = useGameEnd(ge);
   return (
      <div className='ui-overlay'>
         <StatusBar {...statusBarState} {...statusBarActions} />
         <MainMenu {...menuState} {...menuActions} />
         {isGameEndVisible && gameEndData && (
            //<MenuOverlay isVisible>
            <GameEndMenu data={gameEndData} actions={gameEndActions} />
            //</MenuOverlay>
         )}
      </div>
   );
};

export default GameUI;
