import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import { useTranslation } from 'react-i18next';
import './SubscriptionLockModal.css';

// Midnight lockout cutoff: October 1, 2026 00:00:00 (UTC+3 Egypt timezone)
const LOCKOUT_DATE = new Date('2026-10-01T00:00:00+03:00');

function SubscriptionLockModal() {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    const [isLocked, setIsLocked] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    const isAuth = safeLocalStorage.getItem('O_authWEB');
    const role = safeLocalStorage.getItem('auth_role');
    const userName = safeLocalStorage.getItem('pp_name') || '';
    const schoolName = safeLocalStorage.getItem('school_name') || '';

    // Verify lockout state
    const evaluateLockStatus = () => {
        // Not logged in -> No lockout modal (they can see landing, pricing, login, register)
        if (!isAuth) return false;

        // Admin accounts are exempt
        if (role === 'Admin') return false;

        // Exclude pricing and auth pages so users can browse plans, log in, or sign up
        const exemptPaths = ['/pricing', '/auth/login', '/auth/register'];
        if (exemptPaths.includes(location.pathname)) return false;

        // Paid accounts are exempt
        const isPaid = safeLocalStorage.getItem('is_paid') === 'true';
        if (isPaid) return false;

        // Active free trial is exempt
        const trialEndsAt = safeLocalStorage.getItem('trial_ends_at');
        if (trialEndsAt && new Date(trialEndsAt).getTime() > Date.now()) {
            return false;
        }

        // Check if cutoff time has been reached (or test override via ?test_lock=1)
        const isPastCutoff = Date.now() >= LOCKOUT_DATE.getTime();
        const testOverride = new URLSearchParams(window.location.search).get('test_lock') === '1' ||
                             safeLocalStorage.getItem('test_lock') === 'true';

        return isPastCutoff || testOverride;
    };

    useEffect(() => {
        setIsLocked(evaluateLockStatus());
    }, [location.pathname, isAuth, role]);

    // Live background sync with backend in case admin enabled subscription or trial
    useEffect(() => {
        if (!isAuth || role === 'Admin') return;

        const checkBackendSubscription = async () => {
            try {
                setCheckingStatus(true);
                const res = await fetch(`${API_BASE_URL}/user/userAuthorize/${isAuth}`);
                const data = await res.json();
                if (data.message === 'success' && data.userInfo) {
                    const info = data.userInfo;
                    if (info.isPaid) {
                        safeLocalStorage.setItem('is_paid', 'true');
                        setIsLocked(false);
                    }
                    if (info.trialEndsAt) {
                        safeLocalStorage.setItem('trial_ends_at', info.trialEndsAt);
                        if (new Date(info.trialEndsAt).getTime() > Date.now()) {
                            setIsLocked(false);
                        }
                    }
                }
            } catch (err) {
                console.error("Subscription status check failed", err);
            } finally {
                setCheckingStatus(false);
            }
        };

        checkBackendSubscription();
    }, [isAuth, role]);

    if (!isLocked) return null;

    const handleWhatsApp = () => {
        soundEffects.playClick();
        const msg = isArabic 
            ? `مرحباً، أود تجديد/تفعيل اشتراكي في منصة Abacus Heroes.\nاسم المستخدم: ${userName}\nالمدرسة: ${schoolName || 'حساب مستقل'}`
            : `Hello, I would like to upgrade/renew my subscription on Abacus Heroes.\nUsername: ${userName}\nSchool: ${schoolName || 'Independent'}`;
        window.open(`https://wa.me/201505252676?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleViewPricing = () => {
        soundEffects.playClick();
        navigate('/pricing');
    };

    const handleLogout = () => {
        soundEffects.playClick();
        safeLocalStorage.removeItem('O_authWEB');
        safeLocalStorage.removeItem('auth_role');
        safeLocalStorage.removeItem('pp_name');
        safeLocalStorage.removeItem('pp_id');
        safeLocalStorage.removeItem('school_name');
        safeLocalStorage.removeItem('school_id');
        safeLocalStorage.removeItem('teacher_id');
        safeLocalStorage.removeItem('is_paid');
        safeLocalStorage.removeItem('trial_ends_at');
        safeLocalStorage.removeItem('trial_remaining_days');
        window.location.href = '/';
    };

    return (
        <div className="sub-lock-overlay" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="sub-lock-modal">
                {/* Glowing Lock Badge */}
                <div className="sub-lock-icon-wrap">
                    <div className="sub-lock-icon-pulse"></div>
                    <span className="sub-lock-emoji">🔒</span>
                </div>

                {/* Date Announcement Badge */}
                <div className="sub-lock-date-pill">
                    <span>{isArabic ? 'تنبيه الاشتراك • 1 أكتوبر 2026' : 'Subscription Notice • Oct 1, 2026'}</span>
                </div>

                {/* Title & Subtitle */}
                <h2 className="sub-lock-title">
                    {isArabic ? 'يلزم تجديد الاشتراك للمتابعة' : 'Subscription Required to Continue'}
                </h2>
                <p className="sub-lock-desc">
                    {isArabic
                        ? 'بداية من 1 أكتوبر 2026، يتطلب استخدام المنصة اشتراكاً مفعلاً للاستمرار في متابعة الواجبات، الألعاب، والمسابقات.'
                        : 'Starting October 1st, 2026, an active subscription is required to access your homework, games, and math training.'}
                </p>

                {/* User Account Info Chip */}
                {userName && (
                    <div className="sub-lock-user-chip">
                        <span className="chip-icon">👤</span>
                        <span className="chip-name">{userName}</span>
                        {schoolName && <span className="chip-school">• 🏫 {schoolName}</span>}
                    </div>
                )}

                {/* Quick Pricing Highlights */}
                <div className="sub-lock-plans-mini">
                    <div className="mini-plan-card">
                        <span className="mini-plan-duration">{isArabic ? 'شهري' : 'Monthly'}</span>
                        <span className="mini-plan-price">100 EGP</span>
                        <span className="mini-plan-sub">{isArabic ? 'شهرياً' : '/ month'}</span>
                    </div>
                    <div className="mini-plan-card popular">
                        <span className="mini-badge-save">{isArabic ? 'وفر 33%' : 'Save 33%'}</span>
                        <span className="mini-plan-duration">{isArabic ? 'ترم دراسي' : 'School Term'}</span>
                        <span className="mini-plan-price">200 EGP</span>
                        <span className="mini-plan-sub">{isArabic ? 'لكل 3 شهور' : '/ 3 months'}</span>
                    </div>
                    <div className="mini-plan-card">
                        <span className="mini-badge-save best">{isArabic ? 'وفر 50%' : 'Save 50%'}</span>
                        <span className="mini-plan-duration">{isArabic ? 'سنوي' : 'Annual'}</span>
                        <span className="mini-plan-price">600 EGP</span>
                        <span className="mini-plan-sub">{isArabic ? 'لكل سنة' : '/ year'}</span>
                    </div>
                </div>

                <div className="sub-lock-teacher-note">
                    🎁 {isArabic 
                        ? 'عروض وتخفيضات خاصة للمعلمين والأكاديميات لأكثر من 10 طلاب!' 
                        : 'Special discounted rates for teachers & academies with >10 students!'}
                </div>

                {/* Primary Action Buttons */}
                <div className="sub-lock-actions">
                    <button 
                        className="sub-lock-btn-whatsapp" 
                        onClick={handleWhatsApp}
                    >
                        <span className="btn-wa-icon">💬</span>
                        <span>{isArabic ? 'تواصل وفعّل حسابك عبر واتساب' : 'Upgrade via WhatsApp (+201505252676)'}</span>
                    </button>

                    <button 
                        className="sub-lock-btn-pricing" 
                        onClick={handleViewPricing}
                    >
                        <span className="btn-pricing-icon">💳</span>
                        <span>{isArabic ? 'عرض تفاصيل الباقات وطرق الدفع' : 'View Full Pricing & Plans'}</span>
                    </button>
                </div>

                {/* Payment Methods Badges */}
                <div className="sub-lock-payment-methods">
                    <span className="pay-tag">📱 Vodafone Cash</span>
                    <span className="pay-tag">⚡ InstaPay</span>
                    <span className="pay-tag">🏧 Fawry</span>
                    <span className="pay-tag">💳 Visa / Mastercard</span>
                </div>

                {/* Footer with Logout */}
                <div className="sub-lock-footer">
                    <button className="sub-lock-logout-btn" onClick={handleLogout}>
                        🚪 {isArabic ? 'تسجيل الخروج من هذا الحساب' : 'Log Out of this Account'}
                    </button>
                    {checkingStatus && (
                        <span className="syncing-status">
                            🔄 {isArabic ? 'جاري التحقق من التفعيل...' : 'Checking status...'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SubscriptionLockModal;
