import {StatusBar, MainMenu} from './index';

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
   return (
      <div className='ui-overlay'>
         <StatusBar {...statusBarState} {...statusBarActions} />
         <MainMenu {...menuState} {...menuActions} />
      </div>
   );
};

export default GameUI;
