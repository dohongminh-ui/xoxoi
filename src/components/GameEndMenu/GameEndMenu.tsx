import './GameEndMenu.css';
import {useState, useEffect} from 'react';
import type {Mark} from '../../types/state';
import type {GameEndMenuData} from '../../hooks/useGameEnd';
import {COLORS} from '../../Game/core/constants';
import {Trophy, Users, Clock, Target, RotateCcw, Home, Share2, Zap, Grid3X3} from 'lucide-react';

type WinMethod = 'line' | 'resignation' | 'timeout' | 'draw';

type GameEndMenuProps = {
   data: GameEndMenuData;
   actions: {
      onPrimary: () => void;
      onNewGame: () => void;
      onBack: () => void;
   };
};

const GameEndMenu = ({data, actions}: GameEndMenuProps) => {
   const [showMenu, setShowMenu] = useState(false);
   const [animateStats, setAnimateStats] = useState(false);

   useEffect(() => {
      const timer1 = setTimeout(() => setShowMenu(true), 500);
      const timer2 = setTimeout(() => setAnimateStats(true), 1000);
      return () => {
         clearTimeout(timer1);
         clearTimeout(timer2);
      };
   }, []);

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
      if (data.winner === 'draw') return 'winner-draw';
      if (data.winner === player) return 'winner-highlight';
      return 'player-default';
   };

   return (
      <div className='game-end-menu gem-container'>
         {/* Main menu container */}
         <div className={`menu-container ${showMenu ? 'is-visible' : ''}`}>
            {/* Header with result */}
            <div className='menu-header'>
               <div className='result-icon'>
                  {data.winner === 'draw' ? (
                     <>
                        <span className='draw-icons'>❌</span>
                        <span className='draw-icons' style={{color: '#fbbf24'}}>
                           ⚖️
                        </span>
                        <span className='draw-icons'>⭕</span>
                     </>
                  ) : (
                     <div className='single-icon' style={{color: getResultColor()}}>
                        {data.winner === 'X' ? '❌' : '⭕'}
                     </div>
                  )}
               </div>
               <h1 className='result-title' style={{color: getResultColor()}}>
                  {getResultText()}
               </h1>
               <p className='result-subtitle'>{getResultSubtext()}</p>
            </div>

            {/* Players section */}
            <div className='players-section'>
               {/* X Player */}
               <div
                  className={`player-card ${getWinnerBorder('X')} from-left ${animateStats ? 'animate' : ''}`}>
                  <div className='player-info'>
                     <span className='player-avatar'>{data.xPlayer.avatar}</span>
                     <div className='player-details'>
                        <div className='player-name'>
                           {data.winner === 'X' && (
                              <Trophy size={16} color='#fbbf24' className='winner-trophy' />
                           )}
                           <p className='player-name-text'>{data.xPlayer.name}</p>
                           {data.xPlayer.isBot && <span className='bot-badge'>BOT</span>}
                        </div>
                        <p className='player-rating'>Rating: {data.xPlayer.rating}</p>
                     </div>
                  </div>
                  <div
                     className={`rating-change ${data.xPlayer.ratingChange > 0 ? 'positive' : 'negative'}`}>
                     {data.xPlayer.ratingChange > 0 ? '+' : ''}
                     {data.xPlayer.ratingChange}
                  </div>
               </div>

               {/* O Player */}
               <div
                  className={`player-card ${getWinnerBorder('O')} from-right ${animateStats ? 'animate' : ''}`}>
                  <div className='player-info'>
                     <span className='player-avatar'>{data.oPlayer.avatar}</span>
                     <div className='player-details'>
                        <div className='player-name'>
                           {data.winner === 'O' && (
                              <Trophy size={16} color='#fbbf24' className='winner-trophy' />
                           )}
                           <p className='player-name-text'>{data.oPlayer.name}</p>
                           {data.oPlayer.isBot && <span className='bot-badge'>BOT</span>}
                        </div>
                        <p className='player-rating'>Rating: {data.oPlayer.rating}</p>
                     </div>
                  </div>
                  <div
                     className={`rating-change ${data.oPlayer.ratingChange > 0 ? 'positive' : 'negative'}`}>
                     {data.oPlayer.ratingChange > 0 ? '+' : ''}
                     {data.oPlayer.ratingChange}
                  </div>
               </div>

               {/* Game stats */}
               <div className={`stats-grid delayed-1 ${animateStats ? 'animate' : ''}`}>
                  <div className='stat-card'>
                     <div className='stat-header'>
                        <Target size={16} color='#60a5fa' />
                        <span className='stat-label'>Moves</span>
                     </div>
                     <p className='stat-value'>{data.gameStats.moves}</p>
                  </div>
                  <div className='stat-card'>
                     <div className='stat-header'>
                        <Clock size={16} color='#a855f7' />
                        <span className='stat-label'>Time</span>
                     </div>
                     <p className='stat-value'>{data.gameStats.duration}</p>
                  </div>
               </div>

               {/* Game mode and grid info */}
               <div className={`game-info-card delayed-2 ${animateStats ? 'animate' : ''}`}>
                  <div className='game-info-row'>
                     <div className='game-info-label'>
                        <Grid3X3 size={16} color='#fbbf24' />
                        <span className='game-info-label-text'>Grid</span>
                     </div>
                     <p className='game-info-value'>{data.gameStats.gridSize}</p>
                  </div>
                  <div className='game-info-row last'>
                     <div className='game-info-label'>
                        <Zap size={16} color='#10b981' />
                        <span className='game-info-label-text'>Mode</span>
                     </div>
                     <p className='game-info-value'>{data.gameStats.gameMode}</p>
                  </div>
               </div>

               {/* Action buttons */}
               <div className={`action-buttons delayed-3 ${animateStats ? 'animate' : ''}`}>
                  <button className='primary-button' onClick={actions.onPrimary}>
                     <RotateCcw size={20} />
                     <span>{data.gameType === 'bot' ? 'Play Again' : 'Rematch'}</span>
                  </button>

                  {data.gameType === 'multiplayer' && (
                     <div className='secondary-button-grid'>
                        <button className='secondary-button'>
                           <Share2 size={16} />
                           <span>Share</span>
                        </button>
                        <button className='secondary-button' onClick={actions.onNewGame}>
                           <Grid3X3 size={16} />
                           <span>New Game</span>
                        </button>
                     </div>
                  )}

                  {data.gameType === 'local' && (
                     <div className='secondary-button-grid'>
                        <button className='secondary-button'>
                           <Users size={16} />
                           <span>Switch</span>
                        </button>
                        <button className='secondary-button' onClick={actions.onNewGame}>
                           <Grid3X3 size={16} />
                           <span>New Game</span>
                        </button>
                     </div>
                  )}

                  {data.gameType === 'bot' && (
                     <button
                        className='secondary-button full-width-secondary-button'
                        onClick={actions.onNewGame}>
                        <Grid3X3 size={20} />
                        <span>New Game</span>
                     </button>
                  )}

                  <button className='back-button' onClick={actions.onBack}>
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
