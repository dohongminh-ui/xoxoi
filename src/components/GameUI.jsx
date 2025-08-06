import { StatusBar, MenuOverlay } from './index.js'

const GameUI = ({ statusBarState, statusBarActions, menuState, menuActions }) => {
   return (
      <div className="ui-overlay">
         <StatusBar
            {...statusBarState}
            {...statusBarActions}
         />
         <MenuOverlay
            {...menuState}
            {...menuActions}
         />
      </div>
   )
}

export default GameUI
