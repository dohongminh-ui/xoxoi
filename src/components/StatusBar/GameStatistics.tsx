import type {GameMode} from '../../types/state';
import styles from './GameStatistics.module.css';

interface GameStatisticsProps {
   moveCount: number;
   gameMode: GameMode;
   connectionStatus?: 'connected' | 'reconnecting' | 'disconnected';
   reconnectionAttempts?: number;
   className?: string;
   inline?: boolean;
   gridSize?: string;
}

const GameStatistics = ({
   moveCount,
   gameMode,
   connectionStatus = 'connected',
   reconnectionAttempts = 0,
   className = '',
   inline = false,
   gridSize = '∞',
}: GameStatisticsProps) => {
   const getGameModeLabel = (mode: GameMode): string => {
      switch (mode) {
         case 'single':
            return 'Singleplayer';
         case 'bot':
            return 'vs Bot';
         case 'multi':
            return 'Multiplayer';
         default:
            return 'Unknown';
      }
   };

   const getConnectionStatusLabel = (): string => {
      switch (connectionStatus) {
         case 'connected':
            return 'Connected';
         case 'reconnecting':
            return `Reconnecting... (${reconnectionAttempts}/3)`;
         case 'disconnected':
            return 'Disconnected';
         default:
            return 'Unknown';
      }
   };

   const containerClass = inline
      ? `${styles.inlineStatistics} ${className}`
      : `${styles.statisticsSection} ${className}`;

   if (inline) {
      return (
         <div className={containerClass}>
            <span className={styles.inlineItem}>{moveCount} moves</span>
            <span className={styles.inlineItem}>{getGameModeLabel(gameMode)}</span>
            <span className={styles.inlineItem}>{gridSize} grid</span>
            {gameMode === 'multi' && (
               <span className={styles.inlineItem}>
                  <span
                     className={`${styles.connectionIndicator} ${styles[connectionStatus]}`}
                     aria-label={`Connection status: ${connectionStatus}`}>
                     ●
                  </span>
                  {getConnectionStatusLabel()}
               </span>
            )}
         </div>
      );
   }

   return (
      <div className={containerClass}>
         <div className={styles.statItem}>
            <div className={styles.statValue}>{moveCount}</div>
            <div className={styles.statLabel}>Moves</div>
         </div>

         <div className={styles.statItem}>
            <div className={styles.statValue}>{getGameModeLabel(gameMode)}</div>
            <div className={styles.statLabel}>Mode</div>
         </div>

         <div className={styles.statItem}>
            <div className={styles.statValue}>{gridSize}</div>
            <div className={styles.statLabel}>Grid</div>
         </div>

         {gameMode === 'multi' && (
            <div className={styles.statItem}>
               <div className={styles.connectionStatus}>
                  <span
                     className={`${styles.connectionIndicator} ${styles[connectionStatus]}`}
                     aria-label={`Connection status: ${connectionStatus}`}>
                     ●
                  </span>
                  <span className={styles.connectionLabel}>{getConnectionStatusLabel()}</span>
               </div>
               <div className={styles.statLabel}>Connection</div>
            </div>
         )}
      </div>
   );
};

export default GameStatistics;
