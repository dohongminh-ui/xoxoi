import {useEffect, useRef} from 'react';
import styles from './App.module.css';
import {useGameEngine, useStatusBar, useMenuOverlay} from '../../hooks/index';
import {GameUI} from '../index';

function App() {
   const pixiContainerRef = useRef(null);
   const {gameEngine, gameInitialized, error} = useGameEngine(pixiContainerRef);
   const {statusBarState, statusBarActions} = useStatusBar(gameEngine);
   const {
      isMenuVisible,
      handleStartSinglePlayer,
      handleStartBotGame,
      handleCreateMultiplayer,
      handleJoinMultiplayer,
   } = useMenuOverlay(gameEngine);

   useEffect(() => {
      if (gameInitialized) {
         console.log('Ready!');
      }
   }, [gameInitialized]);

   if (error) {
      return (
         <div className={styles.errorContainer}>
            <h1>Game Initialization Failed</h1>
            <p>There was an error starting the game. Check the console for details.</p>
            <pre>{error}</pre>
         </div>
      );
   }

   return (
      <div className={styles.app}>
         <div id='pixi-container' ref={pixiContainerRef} className={styles.pixiContainer} />
         <GameUI
            statusBarState={statusBarState}
            statusBarActions={statusBarActions}
            menuState={{isVisible: isMenuVisible}}
            menuActions={{
               onStartSinglePlayer: handleStartSinglePlayer,
               onStartBotGame: handleStartBotGame,
               onCreateMultiplayer: handleCreateMultiplayer,
               onJoinMultiplayer: handleJoinMultiplayer,
            }}
         />
      </div>
   );
}

export default App;
