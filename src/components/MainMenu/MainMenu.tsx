import {useState} from 'react';
import MenuOverlay from '../MenuOverlay/MenuOverlay';
import styles from './MainMenu.module.css';
import buttonStyles from '../../style/components/Button.module.css';

type MainMenuProps = {
   isVisible?: boolean;
   onStartSinglePlayer?: () => void;
   onStartBotGame?: () => void;
   onCreateMultiplayer?: () => void;
   onJoinMultiplayer?: (roomId: string) => void;
};

const MainMenu = ({
   isVisible = true,
   onStartSinglePlayer,
   onStartBotGame,
   onCreateMultiplayer,
   onJoinMultiplayer,
}: MainMenuProps) => {
   const [roomId, setRoomId] = useState('');

   const handleJoinGame = () => {
      const trimmedRoomId = roomId.trim();
      if (trimmedRoomId && onJoinMultiplayer) {
         onJoinMultiplayer(trimmedRoomId);
      } else {
         alert('Please enter a Room ID');
      }
   };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
         handleJoinGame();
      }
   };

   return (
      <MenuOverlay isVisible={isVisible}>
         <div className={styles.menuContent}>
            <button className={buttonStyles.singlePlayer} onClick={onStartSinglePlayer}>
               Singleplayer
            </button>

            <button className={buttonStyles.botGame} onClick={onStartBotGame}>
               Play with Bot
            </button>

            <button className={buttonStyles.multiplayer} onClick={onCreateMultiplayer}>
               Create Multiplayer Game
            </button>

            <div className={styles.joinGameSection}>
               <input
                  type='text'
                  className={styles.roomIdInput}
                  placeholder='Enter Room ID'
                  value={roomId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value)}
                  onKeyDown={handleKeyDown}
               />
               <button className={buttonStyles.joinGame} onClick={handleJoinGame}>
                  Join Game
               </button>
            </div>
         </div>
      </MenuOverlay>
   );
};

export default MainMenu;
