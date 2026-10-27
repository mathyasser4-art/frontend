import { safeLocalStorage } from './safeStorage';

/**
 * Checks if platform viral locked features (Competitions & Games) are unlocked.
 * Admins are always unlocked.
 * Non-admins must have an active features_unlocked_until or share_pass_expires_at timestamp.
 */
export function isFeaturesUnlocked() {
    try {
        const role = safeLocalStorage.getItem('auth_role');
        if (role === 'Admin') return true;

        const now = Date.now();
        const unlockedUntil = safeLocalStorage.getItem('features_unlocked_until');
        if (unlockedUntil && new Date(unlockedUntil).getTime() > now) {
            return true;
        }

        const sharePass = safeLocalStorage.getItem('share_pass_expires_at');
        if (sharePass && new Date(sharePass).getTime() > now) {
            return true;
        }

        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Dispatches an event to open the ReferralLockModal anywhere in the app.
 */
export function openReferralLockModal(detail = {}) {
    window.dispatchEvent(new CustomEvent('open-referral-lock', { detail }));
}
