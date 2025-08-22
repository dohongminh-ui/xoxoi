import styles from './MenuOverlay.module.css';

type MenuOverlayProps = {
   isVisible?: boolean;
   children?: React.ReactNode;
};

const MenuOverlay = ({isVisible = true, children}: MenuOverlayProps) => {
   if (!isVisible) {
      return null;
   }

   return <div className={styles.overlay}>{children}</div>;
};

export default MenuOverlay;
