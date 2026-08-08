import React, { useEffect, useCallback, useRef } from 'react';
import { useTimer } from 'react-timer-hook';
import './Timer.css';

function MyTimer({ expiryTimestamp, handleGetResult, totalTime, stopTimer }) {
  const {
    seconds,
    minutes,
    pause,
    isRunning,
    start
  } = useTimer({
    expiryTimestamp,
    autoStart: true,
    onExpire: () => {
      console.log('Timer expired!');
      calculateAndStoreTime(true);
    }
  });

  const hasStoredTimeRef = useRef(false);
  const startTimeRef = useRef(null); // Track when timer actually started

  // CORRECTED: Calculate elapsed time properly
  // isExpired=true means timer naturally reached 0, so remaining is definitively 0
  const calculateAndStoreTime = useCallback((isExpired = false) => {
    if (hasStoredTimeRef.current) return;
    hasStoredTimeRef.current = true;

    // Calculate elapsed time based on total time minus remaining time
    const totalDurationInSeconds = totalTime * 60;
    // When timer naturally expires, remaining is 0 regardless of stale closure values
    const remainingTimeInSeconds = isExpired ? 0 : ((minutes * 60) + seconds);
    const elapsedTimeInSeconds = totalDurationInSeconds - remainingTimeInSeconds;
    
    console.log('Timer - Total duration:', totalDurationInSeconds, 'seconds');
    console.log('Timer - Remaining time:', remainingTimeInSeconds, 'seconds (isExpired:', isExpired, ')');
    console.log('Timer - Elapsed time:', elapsedTimeInSeconds, 'seconds');
    
    // Ensure we have at least 1 second
    const finalElapsedSeconds = Math.max(elapsedTimeInSeconds, 1);
    
    const elapsedMinutes = Math.floor(finalElapsedSeconds / 60);
    const elapsedSecs = finalElapsedSeconds % 60;
    const result = `${elapsedMinutes}:${String(elapsedSecs).padStart(2, '0')}`;

    console.log('Timer - Final time calculated:', result);
    
    // Pass to parent - let parent handle API call
    handleGetResult(result);
  }, [totalTime, minutes, seconds, handleGetResult]);

  // Effect to handle stopping the timer
  useEffect(() => {
    const hasExpired = minutes === 0 && seconds === 0;
    const shouldStop = stopTimer || hasExpired;
    
    if (shouldStop && isRunning) {
      console.log('Stopping timer, stopTimer:', stopTimer, 'hasExpired:', hasExpired);
      pause();
      calculateAndStoreTime();
    }
  }, [stopTimer, minutes, seconds, isRunning, calculateAndStoreTime, pause]);

  // Reset the stored time flag when component mounts
  useEffect(() => {
    hasStoredTimeRef.current = false;
  }, []);

  // ============================================================
  // PHONE SHUTDOWN RECOVERY: Save remaining time periodically
  // ============================================================
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      const remainingSeconds = (minutes * 60) + seconds;
      try {
        // Store remaining time for potential recovery
        // Use a generic key that the parent can read
        localStorage.setItem('timer_remaining_seconds', remainingSeconds.toString());
      } catch (e) {
        // Ignore localStorage errors
      }
    }, 5000); // Save every 5 seconds
    
    return () => clearInterval(interval);
  }, [minutes, seconds, isRunning]);

  return (
    <>
      <span className='time_item'>{minutes}</span>:
      <span className='time_item'>{String(seconds).padStart(2, '0')}</span>
    </>
  );
}

export default MyTimer;
