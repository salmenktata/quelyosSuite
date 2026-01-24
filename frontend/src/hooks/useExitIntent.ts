import { useEffect, useState } from 'react';

interface UseExitIntentOptions {
  threshold?: number; // Minimum mouse Y position to trigger (default: 20px from top)
  delay?: number; // Delay in ms before exit intent can trigger (default: 2000ms)
  enabled?: boolean; // Whether exit intent detection is enabled
}

/**
 * Custom hook to detect when user is about to leave the page (exit intent)
 * Triggers when mouse leaves viewport from the top
 *
 * @param options Configuration options
 * @returns Boolean indicating if exit intent was detected
 */
export function useExitIntent(options: UseExitIntentOptions = {}) {
  const {
    threshold = 20,
    delay = 2000,
    enabled = true,
  } = options;

  const [exitIntentDetected, setExitIntentDetected] = useState(false);
  const [canTrigger, setCanTrigger] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Enable triggering after delay
    const delayTimer = setTimeout(() => {
      setCanTrigger(true);
    }, delay);

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if:
      // 1. Exit intent hasn't been detected yet
      // 2. Delay period has passed
      // 3. Mouse is near top of viewport
      // 4. Mouse is moving upward (negative clientY)
      if (
        !exitIntentDetected &&
        canTrigger &&
        e.clientY <= threshold &&
        e.relatedTarget === null
      ) {
        setExitIntentDetected(true);
      }
    };

    // Add event listener
    document.addEventListener('mouseout', handleMouseLeave);

    // Cleanup
    return () => {
      clearTimeout(delayTimer);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [exitIntentDetected, canTrigger, threshold, delay, enabled]);

  // Reset function
  const reset = () => {
    setExitIntentDetected(false);
    setCanTrigger(false);
  };

  return { exitIntentDetected, reset };
}
