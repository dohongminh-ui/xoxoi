import './MenuOverlay.css';

type MenuOverlayProps = {
   isVisible?: boolean;
   children?: React.ReactNode;
};

const MenuOverlay = ({isVisible = true, children}: MenuOverlayProps) => {
   if (!isVisible) {
      return null;
   }

   return <div className='menu-overlay'>{children}</div>;
};

export default MenuOverlay;
