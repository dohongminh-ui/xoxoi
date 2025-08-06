import React, { useState } from 'react'
import './MenuOverlay.css'

const MenuOverlay = ({
   isVisible = true,
   onStartSinglePlayer,
   onStartBotGame,
   onCreateMultiplayer,
   onJoinMultiplayer
}) => {
   const [roomId, setRoomId] = useState('')

   const handleJoinGame = () => {
      const trimmedRoomId = roomId.trim()
      if (trimmedRoomId && onJoinMultiplayer) {
         onJoinMultiplayer(trimmedRoomId)
      } else {
         alert('Please enter a Room ID')
      }
   }

   const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
         handleJoinGame()
      }
   }

   if (!isVisible) {
      return null
   }

   return (
      <div className="menu-overlay">
         <div className="menu-content">
            <button
               className="menu-button single-player-btn"
               onClick={onStartSinglePlayer}
            >
               Singleplayer
            </button>

            <button
               className="menu-button bot-game-btn"
               onClick={onStartBotGame}
            >
               Play with Bot
            </button>

            <button
               className="menu-button multiplayer-btn"
               onClick={onCreateMultiplayer}
            >
               Create Multiplayer Game
            </button>

            <div className="join-game-section">
               <input
                  type="text"
                  className="room-id-input"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={handleKeyDown}
               />
               <button
                  className="menu-button join-game-btn"
                  onClick={handleJoinGame}
               >
                  Join Game
               </button>
            </div>
         </div>
      </div>
   )
}

export default MenuOverlay
