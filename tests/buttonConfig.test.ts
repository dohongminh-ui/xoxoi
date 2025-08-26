import {describe, it, expect} from 'vitest';
import {
   getButtonConfiguration,
   getButtonLabels,
   hasVisibleButtons,
   getVisibleButtonCount,
   type ButtonConfiguration,
   type ButtonConfigurationInput,
} from '../src/utils/buttonConfig';

describe('buttonConfig', () => {
   describe('getButtonConfiguration', () => {
      describe('Menu and Lobby phases', () => {
         it('should show no buttons in menu phase', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'single',
               gamePhase: 'menu',
               hasOpponent: false,
               isGameOver: false,
            };

            const config = getButtonConfiguration(input);

            expect(config).toEqual({
               showResign: false,
               showExit: false,
            });
         });

         it('should show no buttons in lobby phase', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'lobby',
               hasOpponent: false,
               isGameOver: false,
            };

            const config = getButtonConfiguration(input);

            expect(config).toEqual({
               showResign: false,
               showExit: false,
            });
         });
      });

      describe('Game ended state', () => {
         it('should show no buttons when game is over (handled by GameEndMenu)', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'single',
               gamePhase: 'ended',
               hasOpponent: false,
               isGameOver: true,
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(false);
            expect(config.showExit).toBe(false);
         });

         it('should show no buttons in multiplayer when game ends', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'ended',
               hasOpponent: true,
               isGameOver: true,
               isConnected: true,
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(false);
            expect(config.showExit).toBe(false);
         });
      });

      describe('Single player mode', () => {
         it('should show exit button in single player mode', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'single',
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
            };

            const config = getButtonConfiguration(input);

            expect(config.showExit).toBe(true);
            expect(config.showResign).toBe(false);
         });
      });

      describe('Bot mode', () => {
         it('should show exit button in bot mode', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'bot',
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
            };

            const config = getButtonConfiguration(input);

            expect(config.showExit).toBe(true);
            expect(config.showResign).toBe(false);
         });
      });

      describe('Multiplayer mode', () => {
         it('should show resign button in multiplayer mode', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'playing',
               hasOpponent: true,
               isGameOver: false,
               isConnected: true,
               isReconnecting: false,
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(true);
            expect(config.showExit).toBe(false);
         });

         it('should show resign button when waiting for opponent', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
               isConnected: true,
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(true);
            expect(config.showExit).toBe(false);
         });

         it('should show resign button when reconnecting', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'playing',
               hasOpponent: true,
               isGameOver: false,
               isConnected: true,
               isReconnecting: true,
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(true);
            expect(config.showExit).toBe(false);
         });

         it('should show resign button when disconnected', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'playing',
               hasOpponent: true,
               isGameOver: false,
               isConnected: false,
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(true);
            expect(config.showExit).toBe(false);
         });
      });

      describe('Button state overrides', () => {
         it('should handle opponent_left button state', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
               buttonState: 'opponent_left',
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(false);
            expect(config.showExit).toBe(false);
         });

         it('should handle game_over button state', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'playing',
               hasOpponent: true,
               isGameOver: false,
               buttonState: 'game_over',
               isConnected: true,
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(false);
            expect(config.showExit).toBe(false);
         });

         it('should handle menu button state', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'single',
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
               buttonState: 'menu',
            };

            const config = getButtonConfiguration(input);

            expect(config).toEqual({
               showResign: false,
               showExit: false,
            });
         });

         it('should handle lobby button state', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'multi',
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
               buttonState: 'lobby',
            };

            const config = getButtonConfiguration(input);

            expect(config.showResign).toBe(true);
            expect(config.showExit).toBe(false);
         });

         it('should not override normal logic for in_game button state', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'single',
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
               buttonState: 'in_game',
            };

            const config = getButtonConfiguration(input);

            expect(config.showExit).toBe(true);
            expect(config.showResign).toBe(false);
         });
      });

      describe('Edge cases', () => {
         it('should handle null game mode', () => {
            const input: ButtonConfigurationInput = {
               gameMode: null,
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
            };

            const config = getButtonConfiguration(input);

            expect(config).toEqual({
               showResign: false,
               showExit: false,
            });
         });

         it('should handle missing optional parameters', () => {
            const input: ButtonConfigurationInput = {
               gameMode: 'single',
               gamePhase: 'playing',
               hasOpponent: false,
               isGameOver: false,
               // isConnected and isReconnecting not provided
            };

            const config = getButtonConfiguration(input);

            expect(config.showExit).toBe(true);
            expect(config.showResign).toBe(false);
         });
      });
   });

   describe('getButtonLabels', () => {
      it('should return standard labels for single player mode', () => {
         const labels = getButtonLabels('single');

         expect(labels).toEqual({
            resign: 'Resign',
            exit: 'Exit Game',
         });
      });

      it('should return standard labels for bot mode', () => {
         const labels = getButtonLabels('bot');

         expect(labels).toEqual({
            resign: 'Resign',
            exit: 'Exit Game',
         });
      });

      it('should return "Leave Room" for multiplayer without opponent', () => {
         const labels = getButtonLabels('multi', false);

         expect(labels.resign).toBe('Leave Room');
         expect(labels.exit).toBe('Exit Game');
      });

      it('should return "Resign" for multiplayer with opponent', () => {
         const labels = getButtonLabels('multi', true);

         expect(labels.resign).toBe('Resign');
         expect(labels.exit).toBe('Exit Game');
      });

      it('should handle null game mode', () => {
         const labels = getButtonLabels(null);

         expect(labels.resign).toBe('Resign');
         expect(labels.exit).toBe('Exit Game');
      });
   });

   describe('hasVisibleButtons', () => {
      it('should return true when resign button is visible', () => {
         const config: ButtonConfiguration = {
            showResign: true,
            showExit: false,
         };

         expect(hasVisibleButtons(config)).toBe(true);
      });

      it('should return true when exit button is visible', () => {
         const config: ButtonConfiguration = {
            showResign: false,
            showExit: true,
         };

         expect(hasVisibleButtons(config)).toBe(true);
      });

      it('should return false when no buttons are visible', () => {
         const config: ButtonConfiguration = {
            showResign: false,
            showExit: false,
         };

         expect(hasVisibleButtons(config)).toBe(false);
      });

      it('should return true when both buttons are visible', () => {
         const config: ButtonConfiguration = {
            showResign: true,
            showExit: true,
         };

         expect(hasVisibleButtons(config)).toBe(true);
      });
   });

   describe('getVisibleButtonCount', () => {
      it('should return 1 when only resign is visible', () => {
         const config: ButtonConfiguration = {
            showResign: true,
            showExit: false,
         };

         expect(getVisibleButtonCount(config)).toBe(1);
      });

      it('should return 1 when only exit is visible', () => {
         const config: ButtonConfiguration = {
            showResign: false,
            showExit: true,
         };

         expect(getVisibleButtonCount(config)).toBe(1);
      });

      it('should return 0 when no buttons are visible', () => {
         const config: ButtonConfiguration = {
            showResign: false,
            showExit: false,
         };

         expect(getVisibleButtonCount(config)).toBe(0);
      });

      it('should return 2 when both buttons are visible', () => {
         const config: ButtonConfiguration = {
            showResign: true,
            showExit: true,
         };

         expect(getVisibleButtonCount(config)).toBe(2);
      });
   });
});
