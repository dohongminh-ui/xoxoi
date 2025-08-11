import { useState } from 'react'
import MenuOverlay from '../MenuOverlay/MenuOverlay'
import './ResultMenu.css'

const ResultMenu = ({
   isVisible = true,
   onRematchGame,
   onReturnToMenu
}) => {
   const [roomId, setRoomId] = useState('')

   return (
      <MenuOverlay isVisible={isVisible}>
         <div className='menu-content'>
            <button className='menu-button rematch-btn' onClick={onRematchGame}>
               Rematch
            </button>

            <button className='menu-button return-btn' onClick={onReturnToMenu}>
               Return to menu
            </button>
         </div>
      </MenuOverlay>
   )
}

export default ResultMenu
