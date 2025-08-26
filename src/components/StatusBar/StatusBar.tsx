import {useState, useEffect} from 'react';
import type {ReactNode} from 'react';
import styles from './StatusBar.module.css';
import buttonStyles from '../../style/components/Button.module.css';
import TimeDisplay from './TimeDisplay';
import GameStatistics from './GameStatistics';
import type {GameMode} from '../../types/state';

type StatusBarProps = {
   gameStatus?: string;
   showExitGameButton?: boolean;
   showResignButton?: boolean;
   onExitGame?: () => void;
   onResign?: () => void;
   expandableContent?: ReactNode;
   expandableTitle?: string;
   alwaysShowExpandButton?: boolean;
   isGameEnded?: boolean;
   // Enhanced time tracking props
   showTimeElapsed?: boolean;
   gameStartTime?: number | null;
   gameDuration?: number;
   timeElapsed?: number;
   // Enhanced game state props
   gameMode?: string | null;
   currentPlayer?: string;
   playerMark?: string;
   isMyTurn?: boolean;
   connectionStatus?: 'connected' | 'reconnecting' | 'disconnected';
   reconnectionAttempts?: number;
   moveCount?: number;
   gamePhase?: string;
   hasOpponent?: boolean;
   roomId?: string;
   winner?: string | null;
   isWaitingForOpponent?: boolean;
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
   isGameEnded = false,
   // Enhanced time tracking props
   showTimeElapsed = false,
   gameStartTime = null,
   gameDuration,
   timeElapsed,
   // Enhanced game state props (for future use)
   gameMode,
   currentPlayer,
   playerMark,
   isMyTurn,
   connectionStatus,
   reconnectionAttempts,
   moveCount,
   gamePhase,
   hasOpponent,
   roomId,
   winner,
   isWaitingForOpponent,
}: StatusBarProps) => {
   const [isExpanded, setIsExpanded] = useState(false);

   // auto-collapse when game ends
   useEffect(() => {
      if (isGameEnded) {
         setIsExpanded(false);
      }
   }, [isGameEnded]);

   const hasAnyButton = showResignButton || showExitGameButton;

   // Show statistics when we have game data and are in playing phase or game ended
   const shouldShowStatistics =
      gameMode && moveCount !== undefined && (gamePhase === 'playing' || isGameEnded);

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

         {/* Time display - on new line when shown */}
         {showTimeElapsed && gameStartTime && (
            <div className={styles.timeRow}>
               <TimeDisplay
                  startTime={gameStartTime}
                  {...(gameDuration !== undefined && {duration: gameDuration})}
                  isGameEnded={isGameEnded}
                  className={styles.timeSection || ''}
               />
            </div>
         )}

         {/* expandable content area */}
         <div className={`${styles.expandableArea} ${isExpanded ? styles.expanded : ''}`}>
            <div className={styles.expandableContent}>
               {/* title section */}
               {expandableTitle && <div className={styles.expandableTitle}>{expandableTitle}</div>}

               {/* custom expandable content */}
               {expandableContent && (
                  <div className={styles.customContent}>{expandableContent}</div>
               )}

               {/* game statistics section no idea what to do with it yet */}
               {/* {shouldShowStatistics && (
                  <GameStatistics
                     moveCount={moveCount || 0}
                     gameMode={gameMode as GameMode}
                     connectionStatus={connectionStatus || 'connected'}
                     reconnectionAttempts={reconnectionAttempts || 0}
                     className={styles.statisticsSection || ''}
                     inline={true}
                  />
               )} */}

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
