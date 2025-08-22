import {useState} from 'react';
import type {ReactNode} from 'react';
import './StatusBar.css';

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
      <div className={`status-bar noselect ${isExpanded ? 'expanded' : ''}`} id='statusBar'>
         <div className={`status-bar-top ${shouldShowExpandButton ? 'has-expand-button' : ''}`}>
            <span className='game-status' id='gameStatus'>
               {gameStatus}
            </span>

            {shouldShowExpandButton && (
               <button
                  className={`expand-toggle ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}>
                  <span className='expand-icon'>▼</span>
               </button>
            )}
         </div>

         {/* expandable content area */}
         <div className={`expandable-area ${isExpanded ? 'expanded' : ''}`}>
            <div className='expandable-content'>
               {/* title section */}
               {expandableTitle && <div className='expandable-title'>{expandableTitle}</div>}

               {/* custom expandable content */}
               {expandableContent && <div className='custom-content'>{expandableContent}</div>}

               {/* button section */}
               {hasAnyButton && (
                  <div className='button-section'>
                     {showResignButton && (
                        <button
                           className='status-button resign-button'
                           onClick={() => handleButtonClick(onResign)}>
                           Resign
                        </button>
                     )}

                     {showExitGameButton && (
                        <button
                           className='status-button exit-game-button'
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
