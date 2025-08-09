import { useState } from 'react'

/**
 * Custom hook for managing status bar state and actions
 * Centralizes all status bar logic and provides clean interface
 * Updated to work with migrated React-based game engine
 */
export const useStatusBar = (gameEngine = null) => {
   // Status bar state
   const [gameStatus, setGameStatus] = useState('toe')
   const [showRestartButton, setShowRestartButton] = useState(false)
   const [showAcceptRematchButton, setShowAcceptRematchButton] = useState(false)
   const [showDeclineRematchButton, setShowDeclineRematchButton] = useState(false)
   const [showCancelRematchButton, setShowCancelRematchButton] = useState(false)
   const [showExitGameButton, setShowExitGameButton] = useState(false)

   // Status bar actions - now properly connected to game engine
   const handleRestart = () => {
      console.log('Restart button clicked')
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchRequest'))
      } else if (gameEngine?.gameLogic) {
         gameEngine.gameLogic.requestRematch()
      }
   }

   const handleAcceptRematch = () => {
      console.log('Accept rematch clicked')
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchAccept'))
      } else if (gameEngine?.networkManager) {
         gameEngine.networkManager.acceptRematch()
      }
   }

   const handleDeclineRematch = () => {
      console.log('Decline rematch clicked')
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchDecline'))
      } else if (gameEngine?.networkManager) {
         gameEngine.networkManager.declineRematch()
      }
   }

   const handleCancelRematch = () => {
      console.log('Cancel rematch clicked')
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('rematchCancel'))
      } else if (gameEngine?.networkManager) {
         gameEngine.networkManager.cancelRematch()
      }
   }

   const handleExitGame = () => {
      console.log('Exit game clicked')
      if (gameEngine?.uiRenderer) {
         gameEngine.uiRenderer.dispatchEvent(new CustomEvent('exitGame'))
      } else if (gameEngine?.leaveMultiplayerGame) {
         gameEngine.leaveMultiplayerGame()
      }
   }

   const updateGameStatus = (status) => setGameStatus(status)
   
   const showButtons = ({
      restart = false,
      acceptRematch = false,
      declineRematch = false,
      cancelRematch = false,
      exitGame = false
   }) => {
      setShowRestartButton(restart)
      setShowAcceptRematchButton(acceptRematch)
      setShowDeclineRematchButton(declineRematch)
      setShowCancelRematchButton(cancelRematch)
      setShowExitGameButton(exitGame)
   }

   const hideAllButtons = () => {
      showButtons({})
   }

   return {
      // State
      statusBarState: {
         gameStatus,
         showRestartButton,
         showAcceptRematchButton,
         showDeclineRematchButton,
         showCancelRematchButton,
         showExitGameButton
      },
      // Actions
      statusBarActions: {
         onRestart: handleRestart,
         onAcceptRematch: handleAcceptRematch,
         onDeclineRematch: handleDeclineRematch,
         onCancelRematch: handleCancelRematch,
         onExitGame: handleExitGame
      },
      // Utilities
      updateGameStatus,
      showButtons,
      hideAllButtons
   }
}
