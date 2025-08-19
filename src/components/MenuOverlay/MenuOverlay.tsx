import './MenuOverlay.css';

const MenuOverlay = ({isVisible = true, children}: any) => {
   if (!isVisible) {
      return null;
   }

   return <div className='menu-overlay'>{children}</div>;
};

export default MenuOverlay;
