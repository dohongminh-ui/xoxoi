import {describe, it, expect} from 'vitest';
import {
   generateStatusMessage,
   generateGameEndMessage,
   generateTurnIndicator,
   generateConnectionStatusMessage,
   generateRoomDisplayMessage,
   getOpponentMark,
   validateStatusMessageConfig,
   type StatusMessageConfig,
} from '../src/utils/statusMessages';

describe('statusMessages', () => {
   // Base configuration for tests
   const baseConfig: StatusMessageConfig = {
      gameMode: 'single',
      gamePhase: 'playing',
      currentPlayer: 'X',
      playerMark: '',
      isMyTurn: true,
      hasOpponent: false,
      roomId: '',
      isGameEnded: false,
      winner: null,
      connectionStatus: 'connected',
      reconnectionAttempts: 0,
      isWaitingForOpponent: false,
   };

   describe('generateStatusMessage', () => {
      describe('game ended state', () => {
         it('should return game end message when game is ended', () => {
            const config = {
               ...baseConfig,
               isGameEnded: true,
               winner: 'X' as const,
               gameMode: 'single' as const,
            };
            expect(generateStatusMessage(config)).toBe('X Wins!');
         });

         it('should handle draw games', () => {
            const config = {
               ...baseConfig,
               isGameEnded: true,
               winner: null,
            };
            expect(generateStatusMessage(config)).toBe('Draw Game');
         });
      });

      describe('menu phase', () => {
         it('should return "toe" for menu phase', () => {
            const config = {...baseConfig, gamePhase: 'menu' as const};
            expect(generateStatusMessage(config)).toBe('toe');
         });
      });

      describe('lobby phase', () => {
         it('should return setup message for single player lobby', () => {
            const config = {
               ...baseConfig,
               gamePhase: 'lobby' as const,
               gameMode: 'single' as const,
            };
            expect(generateStatusMessage(config)).toBe('Preparing game...');
         });

         it('should return room setup message for multiplayer lobby', () => {
            const config = {
               ...baseConfig,
               gamePhase: 'lobby' as const,
               gameMode: 'multi' as const,
               roomId: 'ABC123',
            };
            expect(generateStatusMessage(config)).toBe('Room ABC123 - Setting up...');
         });
      });

      describe('single player mode', () => {
         it('should show current player turn', () => {
            const config = {
               ...baseConfig,
               gameMode: 'single' as const,
               currentPlayer: 'X' as const,
            };
            expect(generateStatusMessage(config)).toBe("X's Turn");
         });

         it('should show O player turn', () => {
            const config = {
               ...baseConfig,
               gameMode: 'single' as const,
               currentPlayer: 'O' as const,
            };
            expect(generateStatusMessage(config)).toBe("O's Turn");
         });
      });

      describe('bot mode', () => {
         it('should show "Your Turn" when it is player turn', () => {
            const config = {
               ...baseConfig,
               gameMode: 'bot' as const,
               currentPlayer: 'X' as const,
               isMyTurn: true,
            };
            expect(generateStatusMessage(config)).toBe('Your Turn');
         });

         it('should show "Bot Thinking..." when it is bot turn', () => {
            const config = {
               ...baseConfig,
               gameMode: 'bot' as const,
               currentPlayer: 'O' as const,
               isMyTurn: false,
            };
            expect(generateStatusMessage(config)).toBe('Bot Thinking...');
         });
      });

      describe('multiplayer mode', () => {
         it('should show waiting message when no opponent', () => {
            const config = {
               ...baseConfig,
               gameMode: 'multi' as const,
               roomId: 'ABC123',
               hasOpponent: false,
            };
            expect(generateStatusMessage(config)).toBe('Room ABC123 - Waiting for opponent...');
         });

         it('should show waiting message when waiting for opponent', () => {
            const config = {
               ...baseConfig,
               gameMode: 'multi' as const,
               roomId: 'ABC123',
               hasOpponent: true,
               isWaitingForOpponent: true,
            };
            expect(generateStatusMessage(config)).toBe('Room ABC123 - Waiting for opponent...');
         });

         it('should show player turn with mark when it is my turn', () => {
            const config = {
               ...baseConfig,
               gameMode: 'multi' as const,
               playerMark: 'X' as const,
               isMyTurn: true,
               hasOpponent: true,
            };
            expect(generateStatusMessage(config)).toBe('(X) Your Turn');
         });

         it('should show opponent turn with mark when it is opponent turn', () => {
            const config = {
               ...baseConfig,
               gameMode: 'multi' as const,
               playerMark: 'X' as const,
               isMyTurn: false,
               hasOpponent: true,
            };
            expect(generateStatusMessage(config)).toBe("(O) Opponent's Turn");
         });

         it('should handle O player mark correctly', () => {
            const config = {
               ...baseConfig,
               gameMode: 'multi' as const,
               playerMark: 'O' as const,
               isMyTurn: false,
               hasOpponent: true,
            };
            expect(generateStatusMessage(config)).toBe("(X) Opponent's Turn");
         });
      });

      describe('connection status handling', () => {
         it('should show disconnected message', () => {
            const config = {
               ...baseConfig,
               gameMode: 'multi' as const,
               connectionStatus: 'disconnected' as const,
            };
            expect(generateStatusMessage(config)).toBe('Disconnected');
         });

         it('should show reconnecting message without attempts', () => {
            const config = {
               ...baseConfig,
               gameMode: 'multi' as const,
               connectionStatus: 'reconnecting' as const,
            };
            expect(generateStatusMessage(config)).toBe('Reconnecting...');
         });

         it('should show reconnecting message with attempts', () => {
            const config = {
               ...baseConfig,
               gameMode: 'multi' as const,
               connectionStatus: 'reconnecting' as const,
               reconnectionAttempts: 2,
            };
            expect(generateStatusMessage(config)).toBe('Reconnecting... (2/3)');
         });
      });
   });

   describe('generateGameEndMessage', () => {
      it('should return draw message for no winner', () => {
         expect(generateGameEndMessage(null, 'single')).toBe('Draw Game');
      });

      describe('single player mode', () => {
         it('should show X wins', () => {
            expect(generateGameEndMessage('X', 'single')).toBe('X Wins!');
         });

         it('should show O wins', () => {
            expect(generateGameEndMessage('O', 'single')).toBe('O Wins!');
         });
      });

      describe('bot mode', () => {
         it('should show "You Win!" when X wins', () => {
            expect(generateGameEndMessage('X', 'bot')).toBe('You Win!');
         });

         it('should show "Bot Wins!" when O wins', () => {
            expect(generateGameEndMessage('O', 'bot')).toBe('Bot Wins!');
         });
      });

      describe('multiplayer mode', () => {
         it('should show "You Win!" when player wins', () => {
            expect(generateGameEndMessage('X', 'multi', 'X')).toBe('You Win!');
         });

         it('should show "Opponent Wins!" when opponent wins', () => {
            expect(generateGameEndMessage('O', 'multi', 'X')).toBe('Opponent Wins!');
         });

         it('should handle O player mark correctly', () => {
            expect(generateGameEndMessage('O', 'multi', 'O')).toBe('You Win!');
            expect(generateGameEndMessage('X', 'multi', 'O')).toBe('Opponent Wins!');
         });

         it('should fallback to winner mark when no player mark', () => {
            expect(generateGameEndMessage('X', 'multi', '')).toBe('X Wins!');
         });
      });

      it('should handle unknown game mode', () => {
         expect(generateGameEndMessage('X', null)).toBe('X Wins!');
      });
   });

   describe('generateTurnIndicator', () => {
      describe('single player mode', () => {
         it('should show current player turn', () => {
            expect(generateTurnIndicator('single', 'X', '', true)).toBe("X's turn");
            expect(generateTurnIndicator('single', 'O', '', false)).toBe("O's turn");
         });
      });

      describe('bot mode', () => {
         it('should show "Your turn" when it is player turn', () => {
            expect(generateTurnIndicator('bot', 'X', '', true)).toBe('Your turn');
         });

         it('should show "Bot\'s turn" when it is bot turn', () => {
            expect(generateTurnIndicator('bot', 'O', '', false)).toBe("Bot's turn");
         });
      });

      describe('multiplayer mode', () => {
         it('should show player turn with mark', () => {
            expect(generateTurnIndicator('multi', 'X', 'X', true)).toBe('Your turn (X)');
         });

         it('should show opponent turn with mark', () => {
            expect(generateTurnIndicator('multi', 'O', 'X', false)).toBe("Opponent's turn (O)");
         });
      });

      it('should handle unknown game mode', () => {
         expect(generateTurnIndicator(null, 'X', '', true)).toBe("X's turn");
      });
   });

   describe('generateConnectionStatusMessage', () => {
      it('should return "Connected" for connected status', () => {
         expect(generateConnectionStatusMessage('connected')).toBe('Connected');
      });

      it('should return "Disconnected" for disconnected status', () => {
         expect(generateConnectionStatusMessage('disconnected')).toBe('Disconnected');
      });

      it('should return "Reconnecting..." for reconnecting status without attempts', () => {
         expect(generateConnectionStatusMessage('reconnecting')).toBe('Reconnecting...');
      });

      it('should return "Reconnecting... (2/3)" for reconnecting status with attempts', () => {
         expect(generateConnectionStatusMessage('reconnecting', 2)).toBe('Reconnecting... (2/3)');
      });

      it('should handle unknown status', () => {
         expect(generateConnectionStatusMessage('unknown' as any)).toBe('Unknown');
      });
   });

   describe('generateRoomDisplayMessage', () => {
      it('should show waiting message when no opponent', () => {
         expect(generateRoomDisplayMessage('ABC123', false)).toBe(
            'Room ABC123 - Waiting for opponent...'
         );
      });

      it('should show waiting message when waiting for opponent', () => {
         expect(generateRoomDisplayMessage('ABC123', true, true)).toBe(
            'Room ABC123 - Waiting for opponent...'
         );
      });

      it('should show room ID when opponent is present', () => {
         expect(generateRoomDisplayMessage('ABC123', true, false)).toBe('Room ABC123');
      });
   });

   describe('getOpponentMark', () => {
      it('should return O for X player', () => {
         expect(getOpponentMark('X')).toBe('O');
      });

      it('should return X for O player', () => {
         expect(getOpponentMark('O')).toBe('X');
      });

      it('should return empty string for empty player mark', () => {
         expect(getOpponentMark('')).toBe('');
      });
   });

   describe('validateStatusMessageConfig', () => {
      it('should return true for valid config', () => {
         expect(validateStatusMessageConfig(baseConfig)).toBe(true);
      });

      it('should return false for missing game mode', () => {
         const config = {...baseConfig, gameMode: null as any};
         expect(validateStatusMessageConfig(config)).toBe(false);
      });

      it('should return false for invalid game mode', () => {
         const config = {...baseConfig, gameMode: 'invalid' as any};
         expect(validateStatusMessageConfig(config)).toBe(false);
      });

      it('should return false for missing game phase', () => {
         const config = {...baseConfig, gamePhase: null as any};
         expect(validateStatusMessageConfig(config)).toBe(false);
      });

      it('should return false for invalid game phase', () => {
         const config = {...baseConfig, gamePhase: 'invalid' as any};
         expect(validateStatusMessageConfig(config)).toBe(false);
      });

      it('should return false for missing current player', () => {
         const config = {...baseConfig, currentPlayer: null as any};
         expect(validateStatusMessageConfig(config)).toBe(false);
      });

      it('should return false for invalid current player', () => {
         const config = {...baseConfig, currentPlayer: 'Z' as any};
         expect(validateStatusMessageConfig(config)).toBe(false);
      });

      it('should return false for invalid connection status', () => {
         const config = {...baseConfig, connectionStatus: 'invalid' as any};
         expect(validateStatusMessageConfig(config)).toBe(false);
      });
   });

   describe('edge cases and complex scenarios', () => {
      it('should handle multiplayer with empty room ID', () => {
         const config = {
            ...baseConfig,
            gameMode: 'multi' as const,
            roomId: '',
            hasOpponent: false,
         };
         expect(generateStatusMessage(config)).toBe('Room  - Waiting for opponent...');
      });

      it('should handle all game phases correctly', () => {
         const phases: Array<{phase: any; expected: string}> = [
            {phase: 'menu', expected: 'toe'},
            {phase: 'lobby', expected: 'Preparing game...'},
            {phase: 'playing', expected: "X's Turn"},
            {phase: 'ended', expected: 'Draw Game'},
         ];

         phases.forEach(({phase, expected}) => {
            const config = {
               ...baseConfig,
               gamePhase: phase,
               isGameEnded: phase === 'ended',
            };
            expect(generateStatusMessage(config)).toBe(expected);
         });
      });

      it('should handle state priority correctly', () => {
         // Ended should override playing
         const endedAndPlaying = {
            ...baseConfig,
            gamePhase: 'playing' as const,
            isGameEnded: true,
            winner: 'X' as const,
            gameMode: 'single' as const,
         };
         expect(generateStatusMessage(endedAndPlaying)).toBe('X Wins!');
      });

      it('should handle reconnection attempts edge cases', () => {
         const config = {
            ...baseConfig,
            gameMode: 'multi' as const,
            connectionStatus: 'reconnecting' as const,
            reconnectionAttempts: 0,
         };
         expect(generateStatusMessage(config)).toBe('Reconnecting...');

         const configWithAttempts = {
            ...config,
            reconnectionAttempts: 3,
         };
         expect(generateStatusMessage(configWithAttempts)).toBe('Reconnecting... (3/3)');
      });
   });
});
