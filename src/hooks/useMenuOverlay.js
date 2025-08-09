import { useState, useEffect } from 'react'

/**
 * Custom hook for managing menu overlay state and actions
 * Centralizes all menu logic and provides clean interface
 */
export const useMenuOverlay = (gameEngine = null) => {
   const [isMenuVisible, setIsMenuVisible] = useState(true)

   // Listen for game events to show/hide menu
   useEffect(() => {
      if (!gameEngine) return

      const handleGameStart = () => {
         setIsMenuVisible(false)
      }

      const handleGameEnd = () => {
         // Could show menu again after game ends, or keep it hidden
         // setIsMenuVisible(true)
      }

      // Listen to game engine events if available
      if (gameEngine.gameLogic) {
         gameEngine.gameLogic.addEventListener('gameStarted', handleGameStart)
         gameEngine.gameLogic.addEventListener('gameEnded', handleGameEnd)
      }

      return () => {
         if (gameEngine.gameLogic) {
            gameEngine.gameLogic.removeEventListener('gameStarted', handleGameStart)
            gameEngine.gameLogic.removeEventListener('gameEnded', handleGameEnd)
         }
      }
   }, [gameEngine])

   const handleStartSinglePlayer = () => {
      console.log('Start single player clicked')
      if (gameEngine?.startSinglePlayerGame) {
         if (gameEngine?.uiRenderer) {
            gameEngine.uiRenderer.dispatchEvent(new CustomEvent('startSingle'))
         }
         setIsMenuVisible(false)
      }
      else {
         console.warn('Game engine or startSinglePlayerGame method not available')
      }
   }

   const handleStartBotGame = () => {
      console.log('Start bot game clicked')
      if (gameEngine?.startBotGame) {
         gameEngine.startBotGame()
         setIsMenuVisible(false)
      } else if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('startBot'))
         setIsMenuVisible(false)
      } else {
         console.warn('Game engine or startBotGame method not available')
      }
   }

   const handleCreateMultiplayer = () => {
      console.log('Create multiplayer clicked')
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('multiCreate'))
         setIsMenuVisible(false)
      } else {
         console.warn('Game engine or uiRenderer not available')
      }
   }

   const handleJoinMultiplayer = (roomId) => {
      console.log('Join multiplayer clicked', roomId)
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('multiJoin', {
            detail: { roomId }
         }))
         setIsMenuVisible(false)
      } else {
         console.warn('Game engine or uiRenderer not available')
      }
   }

   const showMenu = () => {
      setIsMenuVisible(true)
   }

   const hideMenu = () => {
      setIsMenuVisible(false)
   }

   return {
      // State
      isMenuVisible,
      // Actions
      handleStartSinglePlayer,
      handleStartBotGame,
      handleCreateMultiplayer,
      handleJoinMultiplayer,
      // Utilities
      showMenu,
      hideMenu
   }
}
