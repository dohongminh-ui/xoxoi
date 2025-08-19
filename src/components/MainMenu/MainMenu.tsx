import {useState} from 'react';
import MenuOverlay from '../MenuOverlay/MenuOverlay';
import './MainMenu.css';

const MainMenu = ({
   isVisible = true,
   onStartSinglePlayer,
   onStartBotGame,
   onCreateMultiplayer,
   onJoinMultiplayer,
}: any) => {
   const [roomId, setRoomId] = useState('');

   const handleJoinGame = () => {
      const trimmedRoomId = roomId.trim();
      if (trimmedRoomId && onJoinMultiplayer) {
         onJoinMultiplayer(trimmedRoomId);
      } else {
         alert('Please enter a Room ID');
      }
   };

   const handleKeyDown = (e: any) => {
      if (e.key === 'Enter') {
         handleJoinGame();
      }
   };

   return (
      <MenuOverlay isVisible={isVisible}>
         <div className='menu-content'>
            <button className='menu-button single-player-btn' onClick={onStartSinglePlayer}>
               Singleplayer
            </button>

            <button className='menu-button bot-game-btn' onClick={onStartBotGame}>
               Play with Bot
            </button>

            <button className='menu-button multiplayer-btn' onClick={onCreateMultiplayer}>
               Create Multiplayer Game
            </button>

            <div className='join-game-section'>
               <input
                  type='text'
                  className='room-id-input'
                  placeholder='Enter Room ID'
                  value={roomId}
                  onChange={(e: any) => setRoomId(e.target.value)}
                  onKeyDown={handleKeyDown}
               />
               <button className='menu-button join-game-btn' onClick={handleJoinGame}>
                  Join Game
               </button>
            </div>
         </div>
      </MenuOverlay>
   );
};

export default MainMenu;
