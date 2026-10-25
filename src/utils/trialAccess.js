import { safeLocalStorage } from './safeStorage';

/**
 * Checks if the current user has full unlocked platform access:
 * - is authenticated via token
 * - OR has an active 3-day trial (trialEndsAt in future or remainingDays > 0)
 * - OR has an active paid subscription (is_paid === 'true')
 */
export const hasFullAccess = () => {
  // Platform is 100% unlocked for everyone (practice, games, journey, worksheets).
  // Login is only required for creating homework (teachers) and solving assigned homework (students).
  return true;
};

/**
 * Checks specifically if the user has unlocked trial access (always true).
 */
export const isTrialActive = () => {
  return true;
};

export default hasFullAccess;
