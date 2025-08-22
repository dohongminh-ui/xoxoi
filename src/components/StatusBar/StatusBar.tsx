import {useState} from 'react';
import type {ReactNode} from 'react';
import styles from './StatusBar.module.css';
import buttonStyles from '../../style/components/Button.module.css';

type StatusBarProps = {
   gameStatus?: string;
   showExitGameButton?: boolean;
   showResignButton?: boolean;
   onExitGame?: () => void;
   onResign?: () => void;
   expandableContent?: ReactNode;
   expandableTitle?: string;
   alwaysShowExpandButton?: boolean;
};

const StatusBar = ({
   gameStatus = 'toe',
   showExitGameButton = false,
   showResignButton = false,
   onResign,
   onExitGame,
   expandableContent,
   expandableTitle,
   alwaysShowExpandButton = false,
}: StatusBarProps) => {
   const [isExpanded, setIsExpanded] = useState(false);

   const hasAnyButton = showResignButton || showExitGameButton;
   const shouldShowExpandButton = alwaysShowExpandButton || hasAnyButton || expandableContent;

   const handleButtonClick = (callback?: () => void) => {
      callback?.();
      // dont auto-collapse if theres custom expandable content
      if (!expandableContent) {
         setIsExpanded(false);
      }
   };

   return (
      <div
         className={`${styles.container} noselect ${isExpanded ? styles.expanded : ''}`}
         id='statusBar'>
         <div className={`${styles.top} ${shouldShowExpandButton ? styles.hasExpandButton : ''}`}>
            <span className={styles.gameStatus} id='gameStatus'>
               {gameStatus}
            </span>

            {shouldShowExpandButton && (
               <button
                  className={`${styles.expandToggle} ${isExpanded ? styles.expanded : ''}`}
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}>
                  <span className={styles.expandIcon}>▼</span>
               </button>
            )}
         </div>

         {/* expandable content area */}
         <div className={`${styles.expandableArea} ${isExpanded ? styles.expanded : ''}`}>
            <div className={styles.expandableContent}>
               {/* title section */}
               {expandableTitle && <div className={styles.expandableTitle}>{expandableTitle}</div>}

               {/* custom expandable content */}
               {expandableContent && (
                  <div className={styles.customContent}>{expandableContent}</div>
               )}

               {/* button section */}
               {hasAnyButton && (
                  <div className={styles.buttonSection}>
                     {showResignButton && (
                        <button
                           className={buttonStyles.compactDanger}
                           onClick={() => handleButtonClick(onResign)}>
                           Resign
                        </button>
                     )}

                     {showExitGameButton && (
                        <button
                           className={buttonStyles.compactNeutral}
                           onClick={() => handleButtonClick(onExitGame)}>
                           Exit
                        </button>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default StatusBar;
