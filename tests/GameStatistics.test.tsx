import {render, screen} from '@testing-library/react';
import {describe, it, expect} from 'vitest';
import GameStatistics from '../src/components/StatusBar/GameStatistics';

describe('GameStatistics', () => {
   it('renders basic statistics correctly', () => {
      render(<GameStatistics moveCount={5} gameMode='single' gridSize='Infinite' />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Moves')).toBeInTheDocument();
      expect(screen.getByText('Singleplayer')).toBeInTheDocument();
      expect(screen.getByText('Mode')).toBeInTheDocument();
      expect(screen.getByText('Infinite')).toBeInTheDocument();
      expect(screen.getByText('Grid')).toBeInTheDocument();
   });

   it('displays connection status for multiplayer games', () => {
      render(
         <GameStatistics
            moveCount={3}
            gameMode='multi'
            gridSize='Infinite'
            connectionStatus='connected'
         />
      );

      expect(screen.getByText('Multiplayer')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Connection')).toBeInTheDocument();
   });

   it('shows reconnection attempts when reconnecting', () => {
      render(
         <GameStatistics
            moveCount={7}
            gameMode='multi'
            gridSize='Infinite'
            connectionStatus='reconnecting'
            reconnectionAttempts={2}
         />
      );

      expect(screen.getByText('Reconnecting... (2/3)')).toBeInTheDocument();
   });

   it('does not show connection status for single player games', () => {
      render(<GameStatistics moveCount={4} gameMode='single' gridSize='Infinite' />);

      expect(screen.queryByText('Connection')).not.toBeInTheDocument();
   });

   it('does not show connection status for bot games', () => {
      render(<GameStatistics moveCount={6} gameMode='bot' gridSize='Infinite' />);

      expect(screen.getByText('vs Bot')).toBeInTheDocument();
      expect(screen.queryByText('Connection')).not.toBeInTheDocument();
   });

   it('handles null game mode gracefully', () => {
      render(<GameStatistics moveCount={0} gameMode={null} gridSize='Infinite' />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
   });

   it('applies custom className', () => {
      const {container} = render(
         <GameStatistics
            moveCount={1}
            gameMode='single'
            gridSize='Infinite'
            className='custom-class'
         />
      );

      expect(container.firstChild).toHaveClass('custom-class');
   });

   it('renders inline version correctly', () => {
      render(<GameStatistics moveCount={3} gameMode='single' gridSize='Infinite' inline={true} />);

      expect(screen.getByText('3 moves')).toBeInTheDocument();
      expect(screen.getByText('Singleplayer')).toBeInTheDocument();
      expect(screen.getByText('Infinite grid')).toBeInTheDocument();
   });
});
