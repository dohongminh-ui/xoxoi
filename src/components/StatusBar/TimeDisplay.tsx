import {useState, useEffect} from 'react';
import styles from './TimeDisplay.module.css';

interface TimeDisplayProps {
   startTime: number | null;
   duration?: number;
   isGameEnded?: boolean;
   className?: string;
}

const TimeDisplay = ({
   startTime,
   duration,
   isGameEnded = false,
   className = '',
}: TimeDisplayProps) => {
   const [currentTime, setCurrentTime] = useState(Date.now());

   useEffect(() => {
      if (isGameEnded || !startTime) return;

      const interval = setInterval(() => {
         setCurrentTime(Date.now());
      }, 1000);

      return () => clearInterval(interval);
   }, [isGameEnded, startTime]);

   const getDisplayTime = (): number => {
      if (isGameEnded && duration !== undefined) {
         return duration;
      }
      if (!startTime) {
         return 0;
      }
      return currentTime - startTime;
   };

   const formatDuration = (milliseconds: number): string => {
      // Handle negative values by returning 0:00
      if (milliseconds < 0) {
         return '0:00';
      }

      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
         return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
      }

      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
   };

   const displayTime = getDisplayTime();
   const formattedTime = formatDuration(displayTime);

   return (
      <div
         className={`${styles.timeDisplay} ${className}`}
         role='timer'
         aria-label={`Game time: ${formattedTime}`}
         aria-live='polite'>
         {formattedTime}
      </div>
   );
};

export default TimeDisplay;
