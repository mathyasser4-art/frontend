import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import { isFeaturesUnlocked } from '../../utils/featureLock';
import { useTranslation } from 'react-i18next';
import './ReferralLockModal.css';

export default function ReferralLockModal() {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    const [isLocked, setIsLocked] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [sharing, setSharing] = useState(false);

    const isAuth = safeLocalStorage.getItem('O_authWEB');
    const role = safeLocalStorage.getItem('auth_role') || 'Student';
    const isTeacher = role === 'Teacher';
    const storedCode = safeLocalStorage.getItem('referral_code') || '';

    const isCurrentlyUnlocked = () => isFeaturesUnlocked();

    // Check if the current route is an active game play or competition
    const isProtectedFeatureRoute = () => {
        const path = location.pathname.toLowerCase();
        // Any direct game play screen (e.g. /student/games/..., /games/...)
        const isGamePlay = path.startsWith('/student/games/') || 
                           (path.startsWith('/games/') && path !== '/games');
        // Any competition route
        const isComp = path.includes('competition') || path.includes('competitions-hub');
        return isGamePlay || isComp;
    };

    const evaluateLock = () => {
        if (role === 'Admin') return false;
        if (isCurrentlyUnlocked()) return false;
        return isProtectedFeatureRoute();
    };

    useEffect(() => {
        setIsLocked(evaluateLock());
        if (storedCode) setReferralCode(storedCode);
    }, [location.pathname, isAuth, role]);

    // Listen for custom trigger to open lock modal (e.g. clicked locked game card or locked navbar button)
    useEffect(() => {
        const handleOpen = () => {
            if (!isCurrentlyUnlocked()) {
                setIsLocked(true);
            }
        };
        window.addEventListener('open-referral-lock', handleOpen);
        return () => window.removeEventListener('open-referral-lock', handleOpen);
    }, [role]);

    // Fetch live referral status from backend if available
    useEffect(() => {
        if (!isAuth) return;

        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/user/referral/status`, {
                    headers: { 'Authorization': `Bearer ${isAuth}` }
                });
                const data = await res.json();
                if (data.message === 'success') {
                    if (data.referralCode) {
                        setReferralCode(data.referralCode);
                        safeLocalStorage.setItem('referral_code', data.referralCode);
                    }
                    if (data.isUnlocked) {
                        safeLocalStorage.setItem('is_features_unlocked', 'true');
                        if (data.unlockedUntil) safeLocalStorage.setItem('features_unlocked_until', data.unlockedUntil);
                        if (data.sharePassExpiresAt) safeLocalStorage.setItem('share_pass_expires_at', data.sharePassExpiresAt);
                        setIsLocked(false);
                        window.dispatchEvent(new CustomEvent('features-unlocked'));
                    } else {
                        safeLocalStorage.setItem('is_features_unlocked', 'false');
                        safeLocalStorage.removeItem('features_unlocked_until');
                        safeLocalStorage.removeItem('share_pass_expires_at');
                        if (isProtectedFeatureRoute()) {
                            setIsLocked(true);
                        }
                    }
                }
            } catch (e) {
                // silent fallback
            }
        };

        fetchStatus();
    }, [isAuth, role]);

    if (!isLocked) return null;

    const targetRoleParam = isTeacher ? 'Teacher' : 'Student';
    const effectiveCode = referralCode || storedCode || 'HERO';
    const refLink = `https://abacusheroes.com/register?role=${targetRoleParam}&ref=${effectiveCode}`;

    const handleShareWhatsApp = async () => {
        try {
            setSharing(true);
            if (soundEffects && soundEffects.playClick) soundEffects.playClick();

            const now = Date.now();
            const passExpiry = new Date(now + 48 * 60 * 60 * 1000).toISOString();

            // Set 48h instant pass in localStorage
            safeLocalStorage.setItem('features_unlocked_until', passExpiry);
            safeLocalStorage.setItem('share_pass_expires_at', passExpiry);
            safeLocalStorage.setItem('is_features_unlocked', 'true');

            // Dispatch event so other components immediately know features are unlocked
            window.dispatchEvent(new CustomEvent('features-unlocked'));

            // Notify backend if authenticated
            if (isAuth) {
                fetch(`${API_BASE_URL}/user/referral/claim-share-pass`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${isAuth}` 
                    }
                }).catch(() => {});
            }

            // Compose WhatsApp message based on role
            const msg = isTeacher
                ? (isArabic
                    ? `أهلاً بك زميلي المعلم 🌟 أنصحك بتجربة منصة "أبطال العداد - Abacus Heroes" لتنظيم المسابقات والواجبات التفاعلية.\n\nسجل حسابك كمعلم عبر الرابط التالي واحصل على وصول كامل:\n${refLink}`
                    : `Hello colleague 🌟 I invite you to join Abacus Heroes for mental math training, live competitions, and worksheets.\n\nRegister your Teacher account here:\n${refLink}`)
                : (isArabic
                    ? `مرحباً يا بطل 🌟 العب وتنافس معي في منصة أبطال العداد (Abacus Heroes) للحساب الذهني وألعاب الذكاء!\n\nسجل حسابك وتحداني الآن:\n${refLink}`
                    : `Hey! 🌟 Play and compete with me on Abacus Heroes for math games and fun challenges!\n\nJoin here:\n${refLink}`);

            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');

            // Unlock and close modal immediately
            setTimeout(() => {
                setIsLocked(false);
                setSharing(false);
            }, 600);
        } catch (e) {
            setSharing(false);
            setIsLocked(false);
        }
    };

    const handleCopyLink = () => {
        if (soundEffects && soundEffects.playClick) soundEffects.playClick();
        navigator.clipboard.writeText(refLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handleBackToHomework = () => {
        if (soundEffects && soundEffects.playClick) soundEffects.playClick();
        setIsLocked(false);
        if (role === 'Student') {
            navigate('/dashboard/student');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="ref-lock-overlay" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="ref-lock-modal">
                {/* Glowing Badge */}
                <div className="ref-lock-icon-wrap">
                    <div className="ref-lock-icon-pulse"></div>
                    <span className="ref-lock-emoji">{isTeacher ? '🏆🔒' : '🎮🔒'}</span>
                </div>

                {/* Pill */}
                <div className="ref-lock-pill">
                    <span>{isTeacher ? (isArabic ? 'ميزة المعلمين النشطين' : 'Active Teachers Exclusive') : (isArabic ? 'ألعاب الأبطال' : 'Heroes Games Arena')}</span>
                </div>

                {/* Title & Desc */}
                <h2 className="ref-lock-title">
                    {isTeacher
                        ? (isArabic ? 'المسابقات المباشرة والألعاب مقفلة' : 'Competitions & Games Locked')
                        : (isArabic ? 'الألعاب والسباقات مقفلة' : 'Games & Races Locked')}
                </h2>
                <p className="ref-lock-desc">
                    {isTeacher
                        ? (isArabic
                            ? 'الواجبات والتدريب العادي مجانية تماماً! لفتح غرف المسابقات المباشرة والألعاب لطلابك، شارك المنصة مع زميل معلّم عبر واتساب.'
                            : 'Homework & Practice are completely free! To unlock Live Competitions and Math Games for your class, share Abacus Heroes with a fellow teacher.')
                        : (isArabic
                            ? 'الواجبات والتدريب العادي متاحة مجاناً! لفتح جميع ألعاب الذكاء والسباقات، شارك المنصة مع زملائك أو أصدقائك عبر واتساب لفتحها فوراً.'
                            : 'Homework and Practice are 100% free! To unlock all math games and fun races, share Abacus Heroes with your friends on WhatsApp to unlock instantly.')}
                </p>

                {/* Referral Link Box */}
                <div className="ref-lock-link-box">
                    <span className="ref-link-text">{refLink}</span>
                    <button className="ref-copy-btn" onClick={handleCopyLink}>
                        {copied ? (isArabic ? '✓ تم النسخ' : '✓ Copied') : (isArabic ? 'نسخ الرابط' : 'Copy')}
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="ref-lock-actions">
                    <button 
                        className="ref-btn-wa" 
                        onClick={handleShareWhatsApp}
                        disabled={sharing}
                    >
                        <span className="btn-icon">💬</span>
                        <span>
                            {sharing 
                                ? (isArabic ? 'جاري الفتح...' : 'Unlocking...') 
                                : (isArabic ? 'مشاركة عبر واتساب (فتح فوري 48 ساعة)' : 'Share on WhatsApp (Instant 48h Pass)')}
                        </span>
                    </button>
                </div>

                {/* Viral Incentive Banner */}
                <div className="ref-lock-reward-note">
                    🎁 {isTeacher
                        ? (isArabic
                            ? 'عندما يسجل زميلك حسابه برابطك، يتم فتح المسابقات والألعاب لك لمدة 30 يوماً كاملة!'
                            : 'When your colleague creates their account via your link, you get 30 Full Days Unlocked!')
                        : (isArabic
                            ? 'عندما يسجل صديقك حسابه برابطك، يتم فتح جميع الألعاب لك لمدة 30 يوماً كاملة!'
                            : 'When a friend creates their account via your link, you get 30 Full Days Unlocked!')}
                </div>

                {/* Back Link */}
                <div className="ref-lock-footer">
                    <button className="ref-back-btn" onClick={handleBackToHomework}>
                        ← {isArabic ? 'العودة للواجبات والتدريب' : 'Back to Homework & Practice'}
                    </button>
                </div>
            </div>
        </div>
    );
}
