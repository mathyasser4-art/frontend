import { safeLocalStorage } from './safeStorage';

/**
 * Checks if the current user has full unlocked platform access:
 * - is authenticated via token
 * - OR has an active 3-day trial (trialEndsAt in future or remainingDays > 0)
 * - OR has an active paid subscription (is_paid === 'true')
 */
export const hasFullAccess = () => {
  // 1. Paid subscription
  if (safeLocalStorage.getItem('is_paid') === 'true') return true;

  // 2. Trial date active
  const trialEndsAt = safeLocalStorage.getItem('trial_ends_at');
  if (trialEndsAt) {
    const end = new Date(trialEndsAt).getTime();
    if (!isNaN(end) && end > Date.now()) {
      return true;
    }
  }

  // 3. Trial remaining days
  const remainingDays = safeLocalStorage.getItem('trial_remaining_days');
  if (remainingDays !== null && remainingDays !== undefined) {
    const days = parseInt(remainingDays, 10);
    if (!isNaN(days) && days > 0) {
      return true;
    }
  }

  // 4. Valid authentication token
  const token = safeLocalStorage.getItem('O_authWEB');
  if (token && token !== 'null' && token !== 'undefined' && token.length > 5) {
    return true;
  }

  return false;
};

/**
 * Checks specifically if the user is in an active free trial window.
 */
export const isTrialActive = () => {
  const trialEndsAt = safeLocalStorage.getItem('trial_ends_at');
  if (trialEndsAt) {
    const end = new Date(trialEndsAt).getTime();
    if (!isNaN(end) && end > Date.now()) {
      return true;
    }
  }

  const remainingDays = safeLocalStorage.getItem('trial_remaining_days');
  if (remainingDays !== null && remainingDays !== undefined) {
    const days = parseInt(remainingDays, 10);
    if (!isNaN(days) && days > 0) {
      return true;
    }
  }

  return false;
};

export default hasFullAccess;
