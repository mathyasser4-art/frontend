import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
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
    const role = safeLocalStorage.getItem('auth_role');
    const storedCode = safeLocalStorage.getItem('referral_code') || '';

    // Check if the current route is Competitions or Games
    const isProtectedFeatureRoute = () => {
        const path = location.pathname.toLowerCase();
        const isGame = path.startsWith('/games') || path.includes('/studentdashboard/games');
        const isComp = path.includes('/competition') || path.includes('/teachercompetition') || path.includes('/upcoming-competitions');
        return isGame || isComp;
    };

    const evaluateLock = () => {
        // Not logged in -> Don't show this modal
        if (!isAuth) return false;

        // Admin accounts are exempt
        if (role === 'Admin') return false;

        // Only enforce on Teachers (and students on games if desired; here teacher requested for teachers)
        if (role !== 'Teacher') return false;

        // Check if on a protected route (Competitions or Games)
        if (!isProtectedFeatureRoute()) return false;

        // Check if unlocked
        const now = Date.now();
        const unlockedUntil = safeLocalStorage.getItem('features_unlocked_until');
        if (unlockedUntil && new Date(unlockedUntil).getTime() > now) {
            return false;
        }

        const sharePass = safeLocalStorage.getItem('share_pass_expires_at');
        if (sharePass && new Date(sharePass).getTime() > now) {
            return false;
        }

        const isFeaturesUnlocked = safeLocalStorage.getItem('is_features_unlocked') === 'true';
        if (isFeaturesUnlocked) return false;

        return true;
    };

    useEffect(() => {
        setIsLocked(evaluateLock());
        if (storedCode) setReferralCode(storedCode);
    }, [location.pathname, isAuth, role]);

    // Fetch live referral status from backend if missing
    useEffect(() => {
        if (!isAuth || role !== 'Teacher') return;

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
                    }
                }
            } catch (e) {
                console.error('Error checking referral status:', e);
            }
        };

        fetchStatus();
    }, [isAuth, role]);

    if (!isLocked) return null;

    const refLink = `https://abacusheroes.com/register?role=Teacher&ref=${referralCode || 'HERO'}`;

    const handleShareWhatsApp = async () => {
        try {
            setSharing(true);
            if (soundEffects && soundEffects.playClick) soundEffects.playClick();

            // Claim instant 48-hour pass from backend
            try {
                const res = await fetch(`${API_BASE_URL}/user/referral/claim-share-pass`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${isAuth}` 
                    }
                });
                const data = await res.json();
                if (data.message === 'success') {
                    safeLocalStorage.setItem('is_features_unlocked', 'true');
                    if (data.sharePassExpiresAt) {
                        safeLocalStorage.setItem('share_pass_expires_at', data.sharePassExpiresAt);
                    }
                }
            } catch (err) {
                console.warn('Share pass network claim fallback:', err);
                // Fallback client-side 48-hour pass
                const fallbackExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
                safeLocalStorage.setItem('is_features_unlocked', 'true');
                safeLocalStorage.setItem('share_pass_expires_at', fallbackExpiry);
            }

            // Open WhatsApp share
            const msg = isArabic
                ? `أهلاً بك زميلي المعلم 🌟 أنصحك بتجربة منصة "أبطال العداد - Abacus Heroes" لتدريب الطلاب وتنظيم المسابقات والواجبات التفاعلية.\n\nسجل حسابك كمعلم عبر الرابط التالي واحصل على وصول كامل:\n${refLink}`
                : `Hello colleague 🌟 I invite you to join Abacus Heroes for mental math training, live competitions, and worksheets.\n\nRegister your Teacher account here:\n${refLink}`;

            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');

            // Instantly unlock modal
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
        navigate('/');
    };

    return (
        <div className="ref-lock-overlay" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="ref-lock-modal">
                {/* Glowing Badge */}
                <div className="ref-lock-icon-wrap">
                    <div className="ref-lock-icon-pulse"></div>
                    <span className="ref-lock-emoji">🏆🔒</span>
                </div>

                {/* Pill */}
                <div className="ref-lock-pill">
                    <span>{isArabic ? 'ميزة المعلمين النشطين' : 'Active Teachers Exclusive'}</span>
                </div>

                {/* Title & Desc */}
                <h2 className="ref-lock-title">
                    {isArabic ? 'المسابقات المباشرة والألعاب مقفلة' : 'Competitions & Games Locked'}
                </h2>
                <p className="ref-lock-desc">
                    {isArabic
                        ? 'الواجبات والتدريب العادي مجانية تماماً! لفتح غرف المسابقات المباشرة والألعاب لطلابك، شارك المنصة مع زميل معلّم عبر واتساب.'
                        : 'Homework & Practice are completely free! To unlock Live Competitions and Math Games for your class, share Abacus Heroes with a fellow teacher.'}
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
                    🎁 {isArabic
                        ? 'عندما يسجل زميلك حسابه برابطك، يتم فتح المسابقات والألعاب لك لمدة 30 يوماً كاملة!'
                        : 'When your colleague creates their account via your link, you get 30 Full Days Unlocked!'}
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
