import { StatusBar, MainMenu } from './index.js'

const GameUI = ({ statusBarState, statusBarActions, menuState, menuActions }) => {
   return (
      <div className="ui-overlay">
         <StatusBar
            {...statusBarState}
            {...statusBarActions}
         />
         <MainMenu
            {...menuState}
            {...menuActions}
         />
      </div>
   )
}

export default GameUI
