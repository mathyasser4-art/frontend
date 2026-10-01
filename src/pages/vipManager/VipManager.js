import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage, safeSessionStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import { useTranslation } from 'react-i18next';
import './VipManager.css';

function VipManager() {
    const { i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    const [pin, setPin] = useState(safeSessionStorage.getItem('vip_admin_pin') || '');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinError, setPinError] = useState('');
    const [activeTab, setActiveTab] = useState('search'); // 'search' | 'create' | 'recent'

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState('');

    // Toggle loading
    const [actionLoading, setActionLoading] = useState(false);
    const [actionSuccessMsg, setActionSuccessMsg] = useState('');

    // Create state
    const [createForm, setCreateForm] = useState({
        userName: '',
        phone: '',
        password: '123456',
        role: 'Student',
        academy: ''
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);
    const [createError, setCreateError] = useState('');

    // Recent list state
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentLoading, setRecentLoading] = useState(false);

    // Verify PIN on enter
    const handleLogin = (e) => {
        if (e) e.preventDefault();
        setPinError('');
        if (!pin || (pin !== '2026' && pin !== '7788')) {
            setPinError(isArabic ? 'رمز الدخول غير صحيح. استخدم 2026 أو 7788' : 'Invalid PIN. Try 2026 or 7788');
            soundEffects.playLevelUp?.();
            return;
        }
        safeSessionStorage.setItem('vip_admin_pin', pin);
        setIsAuthenticated(true);
        soundEffects.playClick();
    };

    // Auto-login if PIN stored in session
    useEffect(() => {
        if (pin === '2026' || pin === '7788') {
            setIsAuthenticated(true);
        }
    }, [pin]);

    // Fetch recent users when switching to 'recent' tab
    useEffect(() => {
        if (isAuthenticated && activeTab === 'recent') {
            fetchRecentUsers();
        }
    }, [isAuthenticated, activeTab]);

    const fetchRecentUsers = async () => {
        setRecentLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/user/vip/list-recent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await res.json();
            if (data.message === 'success') {
                setRecentUsers(data.users || []);
            }
        } catch (err) {
            console.error('Failed to load recent users', err);
        } finally {
            setRecentLoading(false);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSearchError('');
        setSearchResult(null);
        setActionSuccessMsg('');
        soundEffects.playClick();

        try {
            const res = await fetch(`${API_BASE_URL}/user/vip/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, identifier: searchQuery.trim() })
            });
            const data = await res.json();
            if (res.ok && data.message === 'success') {
                setSearchResult(data.user);
            } else {
                setSearchError(data.message || (isArabic ? 'لم يتم العثور على الحساب' : 'Account not found'));
            }
        } catch (err) {
            setSearchError(isArabic ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleTogglePaid = async (targetUser, targetStatus) => {
        setActionLoading(true);
        setActionSuccessMsg('');
        soundEffects.playClick();

        try {
            const res = await fetch(`${API_BASE_URL}/user/vip/toggle-paid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin,
                    identifier: targetUser.userName || targetUser.phone,
                    isPaid: targetStatus
                })
            });
            const data = await res.json();
            if (res.ok && data.message === 'success') {
                const updated = data.user;
                setActionSuccessMsg(
                    targetStatus 
                        ? (isArabic ? `✓ تم فك القفل وتفعيل VIP للحساب ${updated.userName} بنجاح!` : `✓ Successfully activated Paid VIP for ${updated.userName}!`)
                        : (isArabic ? `✓ تم قفل الحساب ${updated.userName}` : `✓ Locked account ${updated.userName}`)
                );

                if (searchResult && searchResult.userName === updated.userName) {
                    setSearchResult({ ...searchResult, isPaid: updated.isPaid, disable: updated.disable });
                }

                // Update recent list if present
                setRecentUsers(prev => prev.map(u => u.userName === updated.userName ? { ...u, isPaid: updated.isPaid } : u));
            } else {
                alert(data.message || 'Error updating account');
            }
        } catch (err) {
            alert(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        if (e) e.preventDefault();
        setCreateLoading(true);
        setCreateError('');
        setCreatedUser(null);
        soundEffects.playClick();

        try {
            const res = await fetch(`${API_BASE_URL}/user/vip/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin,
                    ...createForm
                })
            });
            const data = await res.json();
            if (res.ok && data.message === 'success') {
                setCreatedUser({
                    ...data.user,
                    passwordPlain: createForm.password
                });
                soundEffects.playLevelUp?.();
            } else {
                setCreateError(data.message || (isArabic ? 'فشل إنشاء الحساب' : 'Failed to create user'));
            }
        } catch (err) {
            setCreateError(isArabic ? 'حدث خطأ في الاتصال' : 'Connection error');
        } finally {
            setCreateLoading(false);
        }
    };

    const getWhatsAppUrl = (user, pass) => {
        const text = isArabic
            ? `مرحباً بك في منصة Abacus Heroes! 🚀\n\nتم تفعيل حسابك المدفوع VIP بنجاح بنسبة 100%:\n🌐 رابط المنصة: https://abacusheroes.com\n👤 اسم المستخدم: ${user.userName}\n📱 رقم الهاتف: ${user.phone}\n🔑 كلمة المرور: ${pass || 'نفس كلمة المرور المسجلة'}\n\nنتمنى لك رحلة تعليمية ممتعة ومليئة بالبطولات! 🌟`
            : `Welcome to Abacus Heroes! 🚀\n\nYour Paid VIP account is now 100% activated:\n🌐 Website: https://abacusheroes.com\n👤 Username: ${user.userName}\n📱 Phone: ${user.phone}\n🔑 Password: ${pass || 'Your registered password'}\n\nEnjoy unlimited access to all levels & games! 🌟`;

        const phoneClean = (user.phone || '').replace(/[^\d]/g, '');
        const targetPhone = phoneClean.startsWith('0') ? `2${phoneClean}` : phoneClean;
        return `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`;
    };

    // ── PIN GATE SCREEN ──
    if (!isAuthenticated) {
        return (
            <div className="vip-page-root">
                <div className="vip-login-card">
                    <div className="vip-badge-header">
                        <span className="vip-crown">👑</span>
                        <h1>VIP Account Manager</h1>
                        <p>{isArabic ? 'لوحة التحكم السريعة لفك القفل وتفعيل الحسابات' : 'Instant Unlock & Paid Accounts Portal'}</p>
                    </div>

                    <form onSubmit={handleLogin} className="vip-pin-form">
                        <label>{isArabic ? 'أدخل رمز الحماية السري (PIN)' : 'Enter Admin PIN'}</label>
                        <input
                            type="password"
                            maxLength={8}
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="vip-pin-input"
                            autoFocus
                        />
                        {pinError && <div className="vip-error-text">{pinError}</div>}
                        <button type="submit" className="vip-btn-primary">
                            <span>{isArabic ? 'دخول لوحة التحكم' : 'Unlock Dashboard'}</span>
                            <span>➔</span>
                        </button>
                    </form>
                    <div className="vip-hint-footer">
                        {isArabic ? 'رمز المرور المبدئي: 2026 أو 7788' : 'Default PIN: 2026 or 7788'}
                    </div>
                </div>
            </div>
        );
    }

    // ── MAIN VIP DASHBOARD ──
    return (
        <div className="vip-page-root">
            <div className="vip-main-container">
                {/* Header bar */}
                <header className="vip-top-bar">
                    <div className="vip-brand">
                        <span className="vip-crown">👑</span>
                        <div>
                            <h2>VIP Accounts Control</h2>
                            <span className="vip-status-online">● Online & Ready</span>
                        </div>
                    </div>
                    <button 
                        className="vip-logout-btn"
                        onClick={() => {
                            safeSessionStorage.removeItem('vip_admin_pin');
                            setIsAuthenticated(false);
                            setPin('');
                        }}
                    >
                        {isArabic ? 'خروج 🔒' : 'Lock 🔒'}
                    </button>
                </header>

                {/* Tab Navigation */}
                <nav className="vip-tabs-bar">
                    <button
                        className={`vip-tab-item ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('search'); soundEffects.playClick(); }}
                    >
                        🔍 {isArabic ? 'بحث وفك القفل' : 'Search & Unlock'}
                    </button>
                    <button
                        className={`vip-tab-item ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('create'); soundEffects.playClick(); }}
                    >
                        ➕ {isArabic ? 'إنشاء حساب مدفوع' : 'Create Paid User'}
                    </button>
                    <button
                        className={`vip-tab-item ${activeTab === 'recent' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('recent'); soundEffects.playClick(); }}
                    >
                        📋 {isArabic ? 'آخر المسجلين' : 'Recent Signups'}
                    </button>
                </nav>

                {/* Success Notification */}
                {actionSuccessMsg && (
                    <div className="vip-success-alert animate-pop">
                        <span>{actionSuccessMsg}</span>
                        <button onClick={() => setActionSuccessMsg('')}>✕</button>
                    </div>
                )}

                {/* TAB 1: SEARCH & UNLOCK */}
                {activeTab === 'search' && (
                    <div className="vip-content-card">
                        <div className="vip-card-intro">
                            <h3>{isArabic ? 'البحث عن حساب لفك القفل' : 'Search Any Account to Unlock'}</h3>
                            <p>{isArabic ? 'اكتب رقم الهاتف أو اسم المستخدم للبحث الفوري' : 'Type username or phone number to look up status'}</p>
                        </div>

                        <form onSubmit={handleSearch} className="vip-search-row">
                            <input
                                type="text"
                                placeholder={isArabic ? 'مثال: 01012345678 أو Ahmed' : 'e.g. 01012345678 or AhmedMath'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="vip-input-search"
                            />
                            <button type="submit" className="vip-btn-action" disabled={searchLoading}>
                                {searchLoading ? '⏳ ...' : (isArabic ? 'بحث 🔍' : 'Search 🔍')}
                            </button>
                        </form>

                        {searchError && (
                            <div className="vip-alert-danger">{searchError}</div>
                        )}

                        {searchResult && (
                            <div className="vip-user-detail-card animate-pop">
                                <div className="vip-user-header">
                                    <div className="vip-user-titles">
                                        <h4>{searchResult.userName}</h4>
                                        <span className="vip-role-tag">{searchResult.role}</span>
                                        {searchResult.createdBy && (
                                            <span className="vip-school-tag">🏫 {searchResult.createdBy.userName}</span>
                                        )}
                                    </div>
                                    <div className="vip-status-indicator">
                                        {searchResult.isPaid ? (
                                            <span className="vip-pill-paid">🌟 PAID VIP (مفعل)</span>
                                        ) : (
                                            <span className="vip-pill-locked">🔒 LOCKED / TRIAL</span>
                                        )}
                                    </div>
                                </div>

                                <div className="vip-user-meta-grid">
                                    <div><strong>Phone:</strong> {searchResult.phone || '—'}</div>
                                    <div><strong>Email:</strong> {searchResult.email || '—'}</div>
                                    <div><strong>Coins:</strong> {searchResult.coins || 0} 🪙</div>
                                    <div><strong>Status:</strong> {searchResult.disable ? 'Disabled' : 'Active'}</div>
                                </div>

                                <div className="vip-actions-row">
                                    {!searchResult.isPaid ? (
                                        <button
                                            className="vip-btn-unlock-big"
                                            disabled={actionLoading}
                                            onClick={() => handleTogglePaid(searchResult, true)}
                                        >
                                            {actionLoading ? '...' : (isArabic ? '🔓 فك القفل وتفعيل VIP فوراً' : '🔓 Unlock & Activate Paid VIP')}
                                        </button>
                                    ) : (
                                        <button
                                            className="vip-btn-lock-outline"
                                            disabled={actionLoading}
                                            onClick={() => handleTogglePaid(searchResult, false)}
                                        >
                                            {actionLoading ? '...' : (isArabic ? '🔒 قفل الحساب' : '🔒 Lock Account')}
                                        </button>
                                    )}

                                    <a
                                        href={getWhatsAppUrl(searchResult)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="vip-btn-whatsapp"
                                        onClick={() => soundEffects.playClick()}
                                    >
                                        📲 {isArabic ? 'إرسال تهنئة بالواتساب' : 'Send on WhatsApp'}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: CREATE PAID USER */}
                {activeTab === 'create' && (
                    <div className="vip-content-card">
                        <div className="vip-card-intro">
                            <h3>{isArabic ? 'إنشاء حساب مدفوع جديد جاهز' : 'Create a Brand New Paid Account'}</h3>
                            <p>{isArabic ? 'يتم تفعيل الحساب فوراً كـ VIP بدون قيود أو انتهاء صلاحية' : 'Account will be created as 100% Paid VIP with no expiry'}</p>
                        </div>

                        {createError && <div className="vip-alert-danger">{createError}</div>}

                        {createdUser ? (
                            <div className="vip-created-success-card animate-pop">
                                <div className="vip-success-badge">🎉 {isArabic ? 'تم إنشاء وتفعيل الحساب بنجاح!' : 'Account Created & Activated!'}</div>
                                <div className="vip-user-meta-grid">
                                    <div><strong>Username:</strong> {createdUser.userName}</div>
                                    <div><strong>Phone:</strong> {createdUser.phone}</div>
                                    <div><strong>Password:</strong> {createdUser.passwordPlain}</div>
                                    <div><strong>Role:</strong> {createdUser.role}</div>
                                    {createdUser.schoolName && <div><strong>Academy:</strong> {createdUser.schoolName}</div>}
                                    <div><strong>Status:</strong> <span className="vip-pill-paid">🌟 PAID VIP</span></div>
                                </div>

                                <div className="vip-actions-row">
                                    <a
                                        href={getWhatsAppUrl(createdUser, createdUser.passwordPlain)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="vip-btn-whatsapp-big"
                                        onClick={() => soundEffects.playClick()}
                                    >
                                        📲 {isArabic ? 'إرسال البيانات للعميل على واتساب' : 'Forward Details to Parent on WhatsApp'}
                                    </a>
                                    <button
                                        className="vip-btn-secondary"
                                        onClick={() => {
                                            setCreatedUser(null);
                                            setCreateForm({ userName: '', phone: '', password: '123456', role: 'Student', academy: '' });
                                        }}
                                    >
                                        ➕ {isArabic ? 'إنشاء حساب آخر' : 'Create Another Account'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateUser} className="vip-create-form">
                                <div className="vip-form-group">
                                    <label>{isArabic ? 'اسم المستخدم (Username)' : 'Username'}</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Omar2026"
                                        value={createForm.userName}
                                        onChange={(e) => setCreateForm({ ...createForm, userName: e.target.value })}
                                        className="vip-form-control"
                                    />
                                </div>

                                <div className="vip-form-group">
                                    <label>{isArabic ? 'رقم الهاتف (Phone Number)' : 'Phone Number'}</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="01012345678"
                                        value={createForm.phone}
                                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                        className="vip-form-control"
                                    />
                                </div>

                                <div className="vip-form-group">
                                    <label>{isArabic ? 'كلمة المرور (Password)' : 'Password'}</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        className="vip-form-control"
                                    />
                                </div>

                                <div className="vip-form-row">
                                    <div className="vip-form-group half">
                                        <label>{isArabic ? 'نوع الحساب (Role)' : 'Role'}</label>
                                        <select
                                            value={createForm.role}
                                            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                            className="vip-form-control"
                                        >
                                            <option value="Student">Student (طالب)</option>
                                            <option value="Teacher">Teacher (معلم)</option>
                                            <option value="School">School / Academy (أكاديمية)</option>
                                        </select>
                                    </div>

                                    <div className="vip-form-group half">
                                        <label>{isArabic ? 'الأكاديمية (اختياري)' : 'Academy (Optional)'}</label>
                                        <select
                                            value={createForm.academy}
                                            onChange={(e) => setCreateForm({ ...createForm, academy: e.target.value })}
                                            className="vip-form-control"
                                        >
                                            <option value="">None (مستقل)</option>
                                            <option value="MasterMinds">MasterMinds</option>
                                            <option value="Topsoroban">Topsoroban</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="vip-btn-submit" disabled={createLoading}>
                                    {createLoading ? '⏳ جاري الإنشاء...' : (isArabic ? '🚀 إنشاء وتفعيل الحساب كـ VIP' : '🚀 Create & Activate VIP Account')}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* TAB 3: RECENT SIGNUPS */}
                {activeTab === 'recent' && (
                    <div className="vip-content-card">
                        <div className="vip-card-intro flex-between">
                            <div>
                                <h3>{isArabic ? 'آخر المسجلين على المنصة' : 'Recent User Registrations'}</h3>
                                <p>{isArabic ? 'يمكنك فك قفل أي حساب بضغطة واحدة مباشرة من القائمة' : 'Unlock any new user with 1 click directly from the list'}</p>
                            </div>
                            <button className="vip-btn-refresh" onClick={fetchRecentUsers} disabled={recentLoading}>
                                🔄 {recentLoading ? '...' : (isArabic ? 'تحديث' : 'Refresh')}
                            </button>
                        </div>

                        {recentLoading ? (
                            <div className="vip-loading-state">⏳ Loading recent signups...</div>
                        ) : (
                            <div className="vip-table-wrapper">
                                <table className="vip-table">
                                    <thead>
                                        <tr>
                                            <th>{isArabic ? 'المستخدم' : 'User'}</th>
                                            <th>{isArabic ? 'الرتبة' : 'Role'}</th>
                                            <th>{isArabic ? 'الهاتف' : 'Phone'}</th>
                                            <th>{isArabic ? 'الحالة' : 'Status'}</th>
                                            <th>{isArabic ? 'الإجراء' : 'Action'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentUsers.map((u) => (
                                            <tr key={u._id}>
                                                <td>
                                                    <strong>{u.userName}</strong>
                                                    {u.createdBy && <div className="sub-text">🏫 {u.createdBy.userName}</div>}
                                                </td>
                                                <td><span className="vip-role-tag">{u.role}</span></td>
                                                <td>{u.phone || '—'}</td>
                                                <td>
                                                    {u.isPaid ? (
                                                        <span className="vip-pill-paid">🌟 PAID VIP</span>
                                                    ) : (
                                                        <span className="vip-pill-locked">🔒 LOCKED</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {!u.isPaid ? (
                                                        <button
                                                            className="vip-table-btn-unlock"
                                                            disabled={actionLoading}
                                                            onClick={() => handleTogglePaid(u, true)}
                                                        >
                                                            🔓 {isArabic ? 'فك القفل' : 'Unlock'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="vip-table-btn-lock"
                                                            disabled={actionLoading}
                                                            onClick={() => handleTogglePaid(u, false)}
                                                        >
                                                            🔒 {isArabic ? 'قفل' : 'Lock'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default VipManager;
