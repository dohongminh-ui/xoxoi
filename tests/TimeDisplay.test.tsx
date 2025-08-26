import {render, screen, act} from '@testing-library/react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import TimeDisplay from '../src/components/StatusBar/TimeDisplay';

describe('TimeDisplay', () => {
   beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1000000)); // Base time: 1000 seconds
   });

   afterEach(() => {
      vi.useRealTimers();
      vi.clearAllMocks();
   });

   describe('Time Formatting', () => {
      it('formats time under 1 hour as MM:SS', () => {
         const startTime = 1000000 - 125000; // 2 minutes 5 seconds ago
         render(<TimeDisplay startTime={startTime} isGameEnded={true} duration={125000} />);

         expect(screen.getByText('2:05')).toBeInTheDocument();
      });

      it('formats time over 1 hour as HH:MM:SS', () => {
         const duration = 3665000; // 1 hour 1 minute 5 seconds
         render(<TimeDisplay startTime={null} isGameEnded={true} duration={duration} />);

         expect(screen.getByText('1:01:05')).toBeInTheDocument();
      });

      it('handles exactly 1 hour correctly', () => {
         const duration = 3600000; // Exactly 1 hour
         render(<TimeDisplay startTime={null} isGameEnded={true} duration={duration} />);

         expect(screen.getByText('1:00:00')).toBeInTheDocument();
      });

      it('handles negative values by showing 0:00', () => {
         const startTime = 1000000 + 5000; // 5 seconds in the future
         render(<TimeDisplay startTime={startTime} />);

         expect(screen.getByText('0:00')).toBeInTheDocument();
      });

      it('handles zero duration', () => {
         render(<TimeDisplay startTime={null} isGameEnded={true} duration={0} />);

         expect(screen.getByText('0:00')).toBeInTheDocument();
      });

      it('handles very large durations', () => {
         const duration = 359999000; // 99:59:59
         render(<TimeDisplay startTime={null} isGameEnded={true} duration={duration} />);

         expect(screen.getByText('99:59:59')).toBeInTheDocument();
      });
   });

   describe('Real-time Updates', () => {
      it('updates time every second when game is active', () => {
         const startTime = 1000000 - 5000; // 5 seconds ago
         render(<TimeDisplay startTime={startTime} />);

         expect(screen.getByText('0:05')).toBeInTheDocument();

         // Advance time by 1 second
         act(() => {
            vi.advanceTimersByTime(1000);
         });

         expect(screen.getByText('0:06')).toBeInTheDocument();
      });

      it('does not update when game has ended', () => {
         const startTime = 1000000 - 5000; // 5 seconds ago
         const duration = 10000; // 10 seconds total
         render(<TimeDisplay startTime={startTime} isGameEnded={true} duration={duration} />);

         expect(screen.getByText('0:10')).toBeInTheDocument();

         // Advance time by 1 second
         act(() => {
            vi.advanceTimersByTime(1000);
         });

         // Should still show the final duration
         expect(screen.getByText('0:10')).toBeInTheDocument();
      });

      it('does not update when startTime is null', () => {
         render(<TimeDisplay startTime={null} />);

         expect(screen.getByText('0:00')).toBeInTheDocument();

         // Advance time by 1 second
         act(() => {
            vi.advanceTimersByTime(1000);
         });

         // Should still show 0:00
         expect(screen.getByText('0:00')).toBeInTheDocument();
      });
   });

   describe('Game End State Support', () => {
      it('shows final duration when game has ended', () => {
         const startTime = 1000000 - 30000; // 30 seconds ago
         const finalDuration = 25000; // But game ended after 25 seconds
         render(<TimeDisplay startTime={startTime} isGameEnded={true} duration={finalDuration} />);

         expect(screen.getByText('0:25')).toBeInTheDocument();
      });

      it('falls back to calculated time when game ended but no duration provided', () => {
         const startTime = 1000000 - 30000; // 30 seconds ago
         render(<TimeDisplay startTime={startTime} isGameEnded={true} />);

         expect(screen.getByText('0:30')).toBeInTheDocument();
      });
   });

   describe('Accessibility', () => {
      it('has proper ARIA attributes', () => {
         const startTime = 1000000 - 65000; // 1 minute 5 seconds ago
         render(<TimeDisplay startTime={startTime} />);

         const timeDisplay = screen.getByRole('timer');
         expect(timeDisplay).toHaveAttribute('aria-label', 'Game time: 1:05');
         expect(timeDisplay).toHaveAttribute('aria-live', 'polite');
      });

      it('updates aria-label when time changes', () => {
         const startTime = 1000000 - 5000; // 5 seconds ago
         render(<TimeDisplay startTime={startTime} />);

         let timeDisplay = screen.getByRole('timer');
         expect(timeDisplay).toHaveAttribute('aria-label', 'Game time: 0:05');

         // Advance time by 1 second
         act(() => {
            vi.advanceTimersByTime(1000);
         });

         timeDisplay = screen.getByRole('timer');
         expect(timeDisplay).toHaveAttribute('aria-label', 'Game time: 0:06');
      });
   });

   describe('Custom Styling', () => {
      it('applies custom className', () => {
         const startTime = 1000000 - 5000;
         render(<TimeDisplay startTime={startTime} className='custom-class' />);

         const timeDisplay = screen.getByRole('timer');
         expect(timeDisplay).toHaveClass('custom-class');
      });
   });
});
