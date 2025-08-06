import React, { useRef } from 'react'
import '../style/App.css'
import { useGameEngine, useStatusBar, useMenuOverlay } from '../hooks/index.js'
import { GameUI } from './index.js'

function App() {
   const pixiContainerRef = useRef(null)
   const { gameEngine, gameInitialized, error } = useGameEngine(pixiContainerRef)
   const { statusBarState, statusBarActions, updateGameStatus, showButtons } = useStatusBar(gameEngine)
   const { 
      isMenuVisible, 
      handleStartSinglePlayer, 
      handleStartBotGame, 
      handleCreateMultiplayer, 
      handleJoinMultiplayer,
      showMenu,
      hideMenu 
   } = useMenuOverlay(gameEngine)

   React.useEffect(() => {
      if (gameInitialized) {
         console.log('Ready!')
      }
   }, [gameInitialized])

   if (error) {
      return (
         <div className="error-container">
            <h1>Game Initialization Failed</h1>
            <p>There was an error starting the game. Check the console for details.</p>
            <pre>{error}</pre>
         </div>
      )
   }

   return (
      <div className="app">
         <div
            id="pixi-container"
            ref={pixiContainerRef}
            className="pixi-container"
         />
         <GameUI
            statusBarState={statusBarState}
            statusBarActions={statusBarActions}
            menuState={{ isVisible: isMenuVisible }}
            menuActions={{
               onStartSinglePlayer: handleStartSinglePlayer,
               onStartBotGame: handleStartBotGame,
               onCreateMultiplayer: handleCreateMultiplayer,
               onJoinMultiplayer: handleJoinMultiplayer
            }}
         />
      </div>
   )
}

export default App
