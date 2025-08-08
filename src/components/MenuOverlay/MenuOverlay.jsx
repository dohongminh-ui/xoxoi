import './MenuOverlay.css'

const MenuOverlay = ({ isVisible = true, children }) => {
   if (!isVisible) {
      return null
   }

   return (
      <div className="menu-overlay">
         {children}
      </div>
   )
}

export default MenuOverlay
