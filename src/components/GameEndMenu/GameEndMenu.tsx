import styles from './GameEndMenu.module.css';
import {useState, useEffect} from 'react';
import type {Mark} from '../../types/state';
import type {GameEndMenuData} from '../../hooks/useGameEnd';
import {COLORS} from '../../Game/core/constants';
import {Trophy, Users, Clock, Target, RotateCcw, Home, Share2, Zap, Grid3X3} from 'lucide-react';

type WinMethod = 'line' | 'resignation' | 'timeout' | 'draw';

type GameEndMenuProps = {
   data: GameEndMenuData;
   actions: {
      onRematch: () => void;
      onNewGame: () => void;
      onBack: () => void;
      onSwitchPlayers: () => void;
   };
   animationComplete?: boolean;
};

const GameEndMenu = ({data, actions, animationComplete = true}: GameEndMenuProps) => {
   const [showMenu, setShowMenu] = useState(false);
   const [animateStats, setAnimateStats] = useState(false);

   useEffect(() => {
      console.log('GameEndMenu: Component mounted/updated, animationComplete:', animationComplete);

      // Reset animation states when component mounts or data changes
      setShowMenu(false);
      setAnimateStats(false);

      // Start menu animation immediately since we've already waited for winning line
      const timer1 = setTimeout(() => {
         console.log('GameEndMenu: Showing menu');
         setShowMenu(true);
      }, 100);

      // Start stats animation with coordinated timing
      // If winning line animation was needed, use shorter delay since we already waited
      // If no animation was needed, use standard timing
      const statsDelay = animationComplete ? 400 : 800;
      const timer2 = setTimeout(() => {
         console.log('GameEndMenu: Starting stats animation');
         setAnimateStats(true);
      }, statsDelay);

      return () => {
         clearTimeout(timer1);
         clearTimeout(timer2);
      };
   }, [data, animationComplete]);

   const getResultText = () => {
      if (data.winner === 'draw') return 'Draw Game';
      // use winnerName for multiplayer
      const winnerName = data.winner === 'X' ? data.xPlayer.name : data.oPlayer.name;
      return `${data.winner} Wins!`;
   };

   const getResultSubtext = () => {
      const methods: Record<WinMethod, string> = {
         line: data.winningLine ? `${data.winningLine} line` : 'three in a row',
         resignation: 'by resignation',
         timeout: 'on time',
         draw: 'board full',
      };
      return methods[data.method];
   };

   const getResultColor = () => {
      if (data.winner === 'draw') return COLORS.DRAW;
      return data.winner === 'X' ? COLORS.PLAYER_X : COLORS.PLAYER_O;
   };

   const getWinnerBorder = (player: Mark) => {
      if (data.winner === 'draw') return styles.winnerDraw;
      if (data.winner === player) return styles.winnerHighlight;
      return styles.playerDefault;
   };

   return (
      <div className={styles.container}>
         {/* Main menu container */}
         <div className={`${styles.menuContainer} ${showMenu ? styles.isVisible : ''}`}>
            {/* Header with result */}
            <div className={styles.menuHeader}>
               <div className={styles.resultIcon}>
                  {data.winner === 'draw' ? (
                     <>
                        <span className={styles.drawIcons}>❌</span>
                        <span className={styles.drawIcons} style={{color: '#fbbf24'}}>
                           ⚖️
                        </span>
                        <span className={styles.drawIcons}>⭕</span>
                     </>
                  ) : (
                     <div className={styles.singleIcon} style={{color: getResultColor()}}>
                        {data.winner === 'X' ? '❌' : '⭕'}
                     </div>
                  )}
               </div>
               <h1 className={styles.resultTitle} style={{color: getResultColor()}}>
                  {getResultText()}
               </h1>
               <p className={styles.resultSubtitle}>{getResultSubtext()}</p>
            </div>

            {/* Players section */}
            <div className={styles.playersSection}>
               {/* X Player */}
               <div
                  className={`${styles.playerCard} ${getWinnerBorder('X')} ${styles.fromLeft} ${animateStats ? styles.animate : ''}`}>
                  <div className={styles.playerInfo}>
                     <span className={styles.playerAvatar}>{data.xPlayer.avatar}</span>
                     <div className={styles.playerDetails}>
                        <div className={styles.playerName}>
                           {data.winner === 'X' && <Trophy size={16} color='#fbbf24' />}
                           <p className={styles.playerNameText}>{data.xPlayer.name}</p>
                           {data.xPlayer.isBot && <span className={styles.botBadge}>BOT</span>}
                        </div>
                        {data.gameType === 'multi' && (
                           <p className={styles.playerRating}>Rating: {data.xPlayer.rating}</p>
                        )}
                     </div>
                  </div>
                  {data.gameType === 'multi' && (
                     <div
                        className={
                           data.xPlayer.ratingChange > 0
                              ? styles.ratingChangePositive
                              : styles.ratingChangeNegative
                        }>
                        {data.xPlayer.ratingChange > 0 ? '+' : ''}
                        {data.xPlayer.ratingChange}
                     </div>
                  )}
               </div>

               {/* O Player */}
               <div
                  className={`${styles.playerCard} ${getWinnerBorder('O')} ${styles.fromRight} ${animateStats ? styles.animate : ''}`}>
                  <div className={styles.playerInfo}>
                     <span className={styles.playerAvatar}>{data.oPlayer.avatar}</span>
                     <div className={styles.playerDetails}>
                        <div className={styles.playerName}>
                           {data.winner === 'O' && <Trophy size={16} color='#fbbf24' />}
                           <p className={styles.playerNameText}>{data.oPlayer.name}</p>
                           {data.oPlayer.isBot && <span className={styles.botBadge}>BOT</span>}
                        </div>
                        {data.gameType === 'multi' && (
                           <p className={styles.playerRating}>Rating: {data.oPlayer.rating}</p>
                        )}
                     </div>
                  </div>
                  {data.gameType === 'multi' && (
                     <div
                        className={
                           data.oPlayer.ratingChange > 0
                              ? styles.ratingChangePositive
                              : styles.ratingChangeNegative
                        }>
                        {data.oPlayer.ratingChange > 0 ? '+' : ''}
                        {data.oPlayer.ratingChange}
                     </div>
                  )}
               </div>

               {/* Game stats */}
               <div
                  className={`${styles.statsGrid} ${styles.delayed1} ${animateStats ? styles.animate : ''}`}>
                  <div className={styles.statCard}>
                     <div className={styles.statHeader}>
                        <Target size={16} color='#60a5fa' />
                        <span className={styles.statLabel}>Moves</span>
                     </div>
                     <p className={styles.statValue}>{data.gameStats.moves}</p>
                  </div>
                  <div className={styles.statCard}>
                     <div className={styles.statHeader}>
                        <Clock size={16} color='#a855f7' />
                        <span className={styles.statLabel}>Time</span>
                     </div>
                     <p className={styles.statValue}>{data.gameStats.duration}</p>
                  </div>
               </div>

               {/* Game mode and grid info */}
               <div
                  className={`${styles.gameInfoCard} ${styles.delayed2} ${animateStats ? styles.animate : ''}`}>
                  <div className={styles.gameInfoRow}>
                     <div className={styles.gameInfoLabel}>
                        <Grid3X3 size={16} color='#fbbf24' />
                        <span className={styles.gameInfoLabelText}>Grid</span>
                     </div>
                     <p className={styles.gameInfoValue}>{data.gameStats.gridSize}</p>
                  </div>
                  <div className={`${styles.gameInfoRow} ${styles.last}`}>
                     <div className={styles.gameInfoLabel}>
                        <Zap size={16} color='#10b981' />
                        <span className={styles.gameInfoLabelText}>Mode</span>
                     </div>
                     <p className={styles.gameInfoValue}>{data.gameStats.gameMode}</p>
                  </div>
               </div>

               {/* Action buttons */}
               <div
                  className={`${styles.actionButtons} ${styles.delayed3} ${animateStats ? styles.animate : ''}`}>
                  <button className={styles.primaryButton} onClick={actions.onRematch}>
                     <RotateCcw size={20} />
                     <span>{data.gameType === 'bot' ? 'Play Again' : 'Rematch'}</span>
                  </button>

                  {data.gameType === 'multi' && (
                     <div className={styles.secondaryButtonGrid}>
                        <button className={styles.secondaryButton}>
                           <Share2 size={16} />
                           <span>Share</span>
                        </button>
                        <button className={styles.secondaryButton} onClick={actions.onNewGame}>
                           <Grid3X3 size={16} />
                           <span>New Game</span>
                        </button>
                     </div>
                  )}

                  {data.gameType === 'single' && (
                     <button
                        className={`${styles.secondaryButton} ${styles.fullWidthSecondaryButton}`}
                        onClick={actions.onNewGame}>
                        <Grid3X3 size={20} />
                        <span>New Game</span>
                     </button>
                  )}

                  {data.gameType === 'bot' && (
                     <div className={styles.secondaryButtonGrid}>
                        <button
                           className={styles.secondaryButton}
                           onClick={actions.onSwitchPlayers}>
                           <Users size={16} />
                           <span>Switch</span>
                        </button>
                        <button className={styles.secondaryButton} onClick={actions.onNewGame}>
                           <Grid3X3 size={16} />
                           <span>New Game</span>
                        </button>
                     </div>
                  )}

                  <button className={styles.backButton} onClick={actions.onBack}>
                     <Home size={20} />
                     <span>Back to Menu</span>
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default GameEndMenu;
