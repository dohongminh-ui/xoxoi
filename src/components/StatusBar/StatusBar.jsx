import './StatusBar.css'

const StatusBar = ({
   gameStatus = 'toe',
   showRestartButton = false,
   showAcceptRematchButton = false,
   showDeclineRematchButton = false,
   showCancelRematchButton = false,
   showExitGameButton = false,
   onRestart,
   onAcceptRematch,
   onDeclineRematch,
   onCancelRematch,
   onExitGame
}) => {
   return (
      <div className='status-bar noselect' id='statusBar'>
         <span className='game-status' id="gameStatus">{gameStatus}</span>
         
         {showRestartButton && (
            <button 
               className='restart-button'
               onClick={onRestart}
            >
               Rematch
            </button>
         )}
         
         {showAcceptRematchButton && (
            <button 
               className='accept-rematch-button'
               onClick={onAcceptRematch}
            >
               Accept
            </button>
         )}
         
         {showDeclineRematchButton && (
            <button 
               className='decline-rematch-button'
               onClick={onDeclineRematch}
            >
               Decline
            </button>
         )}
         
         {showCancelRematchButton && (
            <button 
               className='cancel-rematch-button'
               onClick={onCancelRematch}
            >
               Cancel
            </button>
         )}
         
         {showExitGameButton && (
            <button 
               className='exit-game-button'
               onClick={onExitGame}
            >
               Exit
            </button>
         )}
      </div>
   )
}

export default StatusBar
