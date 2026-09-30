import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../logo.png';
import register from '../../api/auth/register.api';
import '../../reusable.css';
import './Register.css';
import { useTranslation } from 'react-i18next';

function Register() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [accountType, setAccountType] = useState('Student'); // 'Student' or 'Teacher'
    const [userName, setUserName] = useState('');
    const [phone, setPhone] = useState('');
    const [academy, setAcademy] = useState('');
    const [password, setPassword] = useState('');
    const [cPassword, setCPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = (e) => {
        if (e) e.preventDefault();
        setError(null);

        const trimmedName = userName.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedName || !trimmedPhone || !password || !cPassword) {
            setError(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields!');
            return;
        }

        if (trimmedName.length < 3) {
            setError(isArabic ? 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' : 'Username must be at least 3 characters long');
            return;
        }

        // Remove non-digit characters to validate phone length
        const digitsOnly = trimmedPhone.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
            setError(isArabic ? 'يرجى إدخال رقم هاتف صحيح (10 أرقام على الأقل)' : 'Please enter a valid phone number (at least 10 digits)');
            return;
        }

        if (password.length < 6) {
            setError(isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل' : 'Password must be at least 6 characters long');
            return;
        }

        if (password !== cPassword) {
            setError(isArabic ? 'كلمات المرور غير متطابقة!' : 'Passwords do not match!');
            return;
        }

        if (!academy) {
            setError(isArabic ? 'يرجى اختيار الأكاديمية (ماستر مايندز، توب سوروبان، أو أخرى)' : 'Please select an Academy (MasterMinds, Topsoroban, or Other)');
            return;
        }

        const cleanDigits = trimmedPhone.replace(/[^\d]/g, '');
        let cleanUser = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!cleanUser) {
            cleanUser = 'student_' + Math.abs(trimmedName.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0));
        }
        const fallbackEmail = `${cleanUser}_${cleanDigits}@abacusheroes.com`;

        const userData = {
            userName: trimmedName,
            phone: trimmedPhone,
            email: fallbackEmail,
            academy: academy,
            password,
            cPassword,
            role: accountType
        };

        register(userData, setError, setLoading, navigate);
    };

    return (
        <div className="register-container" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="register-card">
                {/* Logo */}
                <div className="register-logo-wrap">
                    <Link to={'/'}>
                        <img 
                            src={academy === 'Topsoroban' ? '/img/topsoroban_abacusheroes_logo.png' : academy === 'MasterMinds' ? '/img/masterminds_logo.png' : logo} 
                            alt="Abacus Heroes" 
                            className="register-logo-img" 
                        />
                    </Link>
                </div>

                {/* Free Trial Badge */}
                <div className="trial-badge-banner">
                    <span className="trial-badge-sparkle">🎉</span>
                    <span className="trial-badge-text">
                        {isArabic ? 'تجربة مجانية لمدة 3 أيام لجميع المميزات' : '3-Day Free Trial Full Platform Access'}
                    </span>
                </div>

                {/* Role Selector: Student vs Trainer */}
                <div className="role-selector-wrap">
                    <button
                        type="button"
                        className={`role-tab-btn ${accountType === 'Student' ? 'active' : ''}`}
                        onClick={() => {
                            setAccountType('Student');
                            setError(null);
                        }}
                    >
                        <span className="role-tab-icon">🎓</span>
                        <span className="role-tab-label">{isArabic ? 'طالب' : 'Student'}</span>
                    </button>
                    <button
                        type="button"
                        className={`role-tab-btn ${accountType === 'Teacher' ? 'active' : ''}`}
                        onClick={() => {
                            setAccountType('Teacher');
                            setError(null);
                        }}
                    >
                        <span className="role-tab-icon">👨‍🏫</span>
                        <span className="role-tab-label">{isArabic ? 'مدرب / معلّم' : 'Trainer / Teacher'}</span>
                    </button>
                </div>

                {/* Header */}
                <div className="register-header">
                    <h2 className="register-main-title">
                        {accountType === 'Teacher'
                            ? (isArabic ? 'إنشاء حساب مدرب جديد' : 'Create Trainer Account')
                            : (isArabic ? 'إنشاء حساب بطل جديد' : 'Create Student Account')}
                    </h2>
                    <p className="register-subtitle">
                        {accountType === 'Teacher'
                            ? (isArabic ? 'أدِر فصولك، واجباتك، ومسابقات طلابك بكل سهولة' : 'Manage classes, assign homework & host live battles')
                            : (isArabic ? 'سجّل الآن بالاسم ورقم الهاتف وابدأ التدريب فوراً' : 'Sign up with username & phone to start practicing right away')}
                    </p>
                </div>

                {/* Benefits List */}
                <div className="register-perks">
                    <div className="perk-item">
                        <span className="perk-icon">⚡</span>
                        <span>{isArabic ? 'تفعيل فوري خلال ثوانٍ' : 'Instant activation in seconds'}</span>
                    </div>
                    {accountType === 'Teacher' ? (
                        <>
                            <div className="perk-item">
                                <span className="perk-icon">📋</span>
                                <span>{isArabic ? 'إنشاء الفصول وتعيين الواجبات لطلابك' : 'Create classes & assign homework'}</span>
                            </div>
                            <div className="perk-item">
                                <span className="perk-icon">🏆</span>
                                <span>{isArabic ? 'إقامة بطولات ومسابقات حماسية مباشرة' : 'Host live competitions & battles'}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="perk-item">
                                <span className="perk-icon">🎮</span>
                                <span>{isArabic ? 'وصول كامل لجميع الألعاب والواجبات' : 'Full access to games & homework'}</span>
                            </div>
                            <div className="perk-item">
                                <span className="perk-icon">🪙</span>
                                <span>{isArabic ? '100 عملة ترحيبية مجانية' : '100 Free Welcome Coins'}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="register-error-msg">
                        <span className="error-icon">⚠️</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>
                                {error === 'This username or phone number is already registered. Please log in.' 
                                    ? (isArabic ? 'اسم المستخدم أو رقم الهاتف هذا مسجل بالفعل. يرجى تسجيل الدخول.' : error)
                                    : (/email.*already/i.test(error) || /already exists/i.test(error))
                                        ? (isArabic ? 'اسم المستخدم أو رقم الهاتف هذا مسجل بالفعل.' : 'This account is already registered.')
                                        : error}
                            </span>
                            {(error.includes('already') || error.includes('مسجل')) && (
                                <Link to="/auth/login" className="login-link" style={{ fontSize: '0.85rem' }}>
                                    {isArabic ? 'تسجيل الدخول من هنا ←' : 'Log In Here →'}
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleRegister} className="register-form-modern">
                    <div className="input-group">
                        <label htmlFor="reg-username">
                            {accountType === 'Teacher'
                                ? (isArabic ? 'اسم المدرب / الاسم الكامل' : 'Trainer Name / Full Name')
                                : (isArabic ? 'اسم الطالب / الاسم الكامل' : 'Student Name / Full Name')}
                        </label>
                        <div className="input-field-wrap">
                            <span className="input-icon">👤</span>
                            <input
                                id="reg-username"
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder={isArabic ? 'مثال: Ahmed Hassan' : 'e.g. Ahmed Hassan'}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-phone">
                            {isArabic ? 'رقم الهاتف / الواتساب' : 'Phone Number (WhatsApp)'}
                        </label>
                        <div className="input-field-wrap">
                            <span className="input-icon">📱</span>
                            <input
                                id="reg-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={isArabic ? 'مثال: 01012345678 أو 012...' : 'e.g. 01012345678 or 012...'}
                                required
                            />
                        </div>
                        <small className="input-hint">
                            {isArabic ? 'سيتم استخدام رقم الهاتف لتسجيل الدخول والدعم الفني' : 'Used for quick login & subscription support'}
                        </small>
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-academy">
                            {isArabic ? 'الأكاديمية / المنظومة' : 'Academy / Organization'}
                        </label>
                        <div className="input-field-wrap">
                            <span className="input-icon">🏫</span>
                            <select
                                id="reg-academy"
                                value={academy}
                                onChange={(e) => {
                                    setAcademy(e.target.value);
                                    setError(null);
                                }}
                                className="academy-select-field"
                                required
                            >
                                <option value="" disabled>{isArabic ? '-- اختر الأكاديمية --' : '-- Select Academy --'}</option>
                                <option value="MasterMinds">MasterMinds</option>
                                <option value="Topsoroban">Topsoroban</option>
                                <option value="Other">{isArabic ? 'أخرى (Other)' : 'Other'}</option>
                            </select>
                            <span className="select-dropdown-arrow">▼</span>
                        </div>
                        <small className="input-hint">
                            {isArabic ? 'اختر أكاديميتك أو اختر "أخرى"' : 'Select your academy or choose "Other"'}
                        </small>
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-password">
                            {isArabic ? 'كلمة المرور' : 'Password'}
                        </label>
                        <div className="input-field-wrap">
                            <span className="input-icon">🔒</span>
                            <input
                                id="reg-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isArabic ? '6 أحرف أو أرقام على الأقل' : 'At least 6 characters'}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-pass-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-cpassword">
                            {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                        </label>
                        <div className="input-field-wrap">
                            <span className="input-icon">🔐</span>
                            <input
                                id="reg-cpassword"
                                type={showPassword ? 'text' : 'password'}
                                value={cPassword}
                                onChange={(e) => setCPassword(e.target.value)}
                                placeholder={isArabic ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="register-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="reg-loader"></span>
                        ) : (
                            <>
                                <span>
                                    {accountType === 'Teacher'
                                        ? (isArabic ? 'ابدأ تجربة المدرب (3 أيام)' : 'Start 3-Day Trainer Trial')
                                        : (isArabic ? 'ابدأ تجربة الطالب (3 أيام)' : 'Start 3-Day Student Trial')}
                                </span>
                                <span className="btn-arrow">🚀</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="register-footer-modern">
                    <p>
                        {isArabic ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
                        <Link to={'/auth/login'} className="login-link">
                            {isArabic ? 'تسجيل الدخول' : 'Log In'}
                        </Link>
                    </p>
                    <div className="trial-terms-note">
                        🛡️ {isArabic 
                            ? 'لا يتطلب بطاقة بنكية. تبدأ التجربة فوراً لمدة 3 أيام.' 
                            : 'No credit card required. Instant 3-day free trial.'}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;