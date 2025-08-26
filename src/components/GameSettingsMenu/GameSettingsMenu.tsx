import React, {useState} from 'react';
import type {
   GameSettings,
   GameMode,
   BotDifficulty,
   FirstPlayer,
   CustomGridOptions,
   TimeLimitOptions,
} from '../../types/game-settings';
import './GameSettingsMenu.css';

interface GameSettingsMenuProps {
   isVisible: boolean;
   selectedMode: GameMode;
   onStartGame: (settings: GameSettings) => void;
   onCancel: () => void;
}

const GameSettingsMenu: React.FC<GameSettingsMenuProps> = ({
   isVisible,
   selectedMode,
   onStartGame,
   onCancel,
}) => {
   const [settings, setSettings] = useState<GameSettings>({
      mode: selectedMode,
      boardSize: 3,
      winCondition: 3,
      firstPlayer: 'human',
      customGrid: '3x3',
      timeLimitOption: '180',
   });

   const [customTimeMinutes, setCustomTimeMinutes] = useState<number>(5);
   const [isCustomTime, setIsCustomTime] = useState<boolean>(false);

   const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
      setSettings(prev => {
         const newSettings = {...prev, [key]: value};

         // Handle custom grid properly :p
         if (key === 'customGrid' && typeof value === 'string') {
            if (value === '3x3') {
               newSettings.boardSize = 3;
            } else if (value === '5x5') {
               newSettings.boardSize = 5;
            } else if (value === 'infinite') {
               newSettings.boardSize = 999;
            }
         }

         // Adjust win condition if it exceeds board size
         if (key === 'boardSize' && typeof value === 'number') {
            if (value < newSettings.winCondition) {
               newSettings.winCondition = Math.min(value, 5); // Cap at 5
            }
         }

         return newSettings;
      });
   };

   const handleTimeLimitChange = (value: string) => {
      if (value === 'none') {
         setIsCustomTime(false);
         updateSetting('timeLimitOption', undefined);
      } else if (value === 'custom') {
         setIsCustomTime(true);
         updateSetting('timeLimitOption', (customTimeMinutes * 60).toString() as TimeLimitOptions);
      } else {
         setIsCustomTime(false);
         updateSetting('timeLimitOption', value as TimeLimitOptions);
      }
   };

   const handleCustomTimeChange = (minutes: number) => {
      setCustomTimeMinutes(minutes);
      updateSetting('timeLimitOption', (minutes * 60).toString() as TimeLimitOptions);
   };

   const handleStartGame = () => {
      if (settings.boardSize !== 999 && settings.winCondition > settings.boardSize) {
         alert('Win condition cannot exceed board size');
         return;
      }
      console.log('Starting game with settings:', settings);
      onStartGame(settings);
   };

   if (!isVisible) return null;

   return (
      <div className='gameSettingOverlay'>
         <div className='gameSettingModal'>
            <h2>{selectedMode.toUpperCase()} Game Settings</h2>

            <div className='settingGroup'>
               <label>Grid Size:</label>
               <select
                  value={settings.customGrid}
                  onChange={e => updateSetting('customGrid', e.target.value as CustomGridOptions)}>
                  <option value='3x3'>3x3 Grid</option>
                  <option value='5x5'>5x5 Grid</option>
                  <option value='infinite'>Infinite Grid</option>
                  <option value='custom'>Custom Size</option>
               </select>
            </div>

            {/* Custom Board Size (only if custom selected) */}
            {settings.customGrid === 'custom' && (
               <div className='settingGroup'>
                  <label>Board size:</label>
                  <input
                     type='number'
                     min={3}
                     value={settings.boardSize}
                     onChange={e => {
                        const value = e.target.value;
                        if (value === '') {
                           updateSetting('boardSize', '' as any);
                        } else {
                           const numValue = parseInt(value);
                           if (!isNaN(numValue) && numValue >= 0) {
                              updateSetting('boardSize', numValue);
                           }
                        }
                     }}
                     onBlur={e => {
                        const value = parseInt(e.target.value) || 0;
                        const correctedValue = Math.max(3, value);
                        updateSetting('boardSize', correctedValue);
                     }}
                     onKeyDown={e => {
                        if (e.key === 'Enter') {
                           const value = parseInt(e.currentTarget.value) || 0;
                           const correctedValue = Math.max(3, value);
                           updateSetting('boardSize', correctedValue);
                           e.currentTarget.blur();
                        }
                     }}
                     placeholder='3'
                  />
               </div>
            )}

            {/*  Win Condition */}
            <div className='settingGroup'>
               <label>Win Condition:</label>
               <select
                  value={settings.winCondition}
                  onChange={e => updateSetting('winCondition', parseInt(e.target.value))}>
                  {Array.from(
                     {length: settings.boardSize === 999 ? 3 : Math.min(settings.boardSize - 2, 3)},
                     (_, i) => i + 3
                  ).map(num => (
                     <option key={num} value={num}>
                        {num} in a row
                     </option>
                  ))}
               </select>
            </div>

            {/* First Player */}
            <div className='settingGroup'>
               <label>First Player:</label>
               <select
                  value={settings.firstPlayer}
                  onChange={e => updateSetting('firstPlayer', e.target.value as FirstPlayer)}>
                  <option value='human'>You go first</option>
                  {selectedMode === 'bot' && <option value='bot'>Bot goes first</option>}
                  <option value='random'>Random</option>
               </select>
            </div>

            {/* Bot Difficulty (only for bot mode) */}
            {selectedMode === 'bot' && (
               <div className='settingGroup'>
                  <label>Bot Difficulty:</label>
                  <select
                     value={settings.botDifficulty || 'medium'}
                     onChange={e =>
                        updateSetting('botDifficulty', e.target.value as BotDifficulty)
                     }>
                     <option value='easy'>Easy (Random moves)</option>
                     <option value='medium'>Medium (Some strategy)</option>
                     <option value='hard'>Hard (Minimax AI)</option>
                  </select>
               </div>
            )}

            {/* Time Limit */}
            <div className='settingGroup'>
               <label>Time Limit:</label>
               <select
                  value={isCustomTime ? 'custom' : settings.timeLimitOption || 'none'}
                  onChange={e => handleTimeLimitChange(e.target.value)}>
                  <option value='none'>No time limit</option>
                  <option value='180'>3 minutes per turn</option>
                  <option value='300'>5 minutes per turn</option>
                  <option value='custom'>Custom time</option>
               </select>

               {/* Custom timer input */}
               {isCustomTime && (
                  <div className='customInputGroup' style={{marginTop: '8px'}}>
                     <label>Minutes per turn:</label>
                     <input
                        type='number'
                        min={1}
                        max={60}
                        defaultValue={5}
                        onChange={e => handleCustomTimeChange(parseInt(e.target.value) || 5)}
                     />
                     <span>minutes</span>
                  </div>
               )}
            </div>

            {/* Action Buttons */}
            <div className='settings-actions'>
               <button onClick={onCancel} className='cancel-btn'>
                  Cancel
               </button>
               <button onClick={handleStartGame} className='start-btn'>
                  Start Game
               </button>
            </div>
         </div>
      </div>
   );
};

export default GameSettingsMenu;
