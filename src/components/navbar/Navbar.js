import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../logo.png'
import profileImg from '../../img/avatar-profile.png'
import school from '../../img/school-avatar.png'
import soundEffects from '../../utils/soundEffects'
import { safeLocalStorage } from '../../utils/safeStorage'
import { getSchoolCompetitionEvents } from '../../api/competitionEvent/competitionEvent.api'
import { fetchAndCacheTeacherScope } from '../../utils/teacherFilter'
import { SHOW_PRICING, ENABLE_CUSTOM_QUESTION_BANK } from '../../config/api.config'
import '../../reusable.css'
import './Navbar.css'

const TeacherRegistration = lazy(() => import('../teacherRegistration/TeacherRegistration'));
const TeacherHelpModal = lazy(() => import('../teacherHelpModal/TeacherHelpModal'));
const StudentHelpModal = lazy(() => import('../studentHelpModal/StudentHelpModal'));
const CreateHomeworkModal = lazy(() => import('./CreateHomeworkModal'));
const CreateCompetitionModal = lazy(() => import('./CreateCompetitionModal'));
const TutorialVideoModal = lazy(() => import('../tutorialVideoModal/TutorialVideoModal'));

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const navigate = useNavigate();
    const isAuth = safeLocalStorage.getItem('O_authWEB')
    const role = safeLocalStorage.getItem('auth_role')
    const schoolName = safeLocalStorage.getItem('school_name') || '';
    const userName = safeLocalStorage.getItem('pp_name') || '';
    const userRole = safeLocalStorage.getItem('auth_role') || '';

    const [showTeacherForm, setShowTeacherForm] = useState(false)
    const [showTeacherHelp, setShowTeacherHelp] = useState(false)
    const [showStudentHelp, setShowStudentHelp] = useState(false)
    const [showCreateHomework, setShowCreateHomework] = useState(false)
    const [showCreateCompetition, setShowCreateCompetition] = useState(false)
    const [showCompetitionsDropdown, setShowCompetitionsDropdown] = useState(false)
    const [hasUnreadEvents, setHasUnreadEvents] = useState(false)
    const [showTutorialVideo, setShowTutorialVideo] = useState(false)
    const [tutorialRole, setTutorialRole] = useState('Teacher')
    const [activeBattleNotification, setActiveBattleNotification] = useState(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Check for unread competition events published by school for teacher accounts
    useEffect(() => {
        if (isAuth && role === 'Teacher') {
            fetchAndCacheTeacherScope();
            getSchoolCompetitionEvents().then(res => {
                if (res.message === 'success' && Array.isArray(res.events) && res.events.length > 0) {
                    const lastView = safeLocalStorage.getItem('teacher_last_competitions_view');
                    if (!lastView) {
                        setHasUnreadEvents(true);
                    } else {
                        const lastViewTime = new Date(lastView).getTime();
                        const hasNewer = res.events.some(e => new Date(e.createdAt || e.updatedAt || 0).getTime() > lastViewTime);
                        setHasUnreadEvents(hasNewer);
                    }
                }
            }).catch(err => console.error("Error checking competition events in navbar", err));
        }
    }, [isAuth, role]);

    // Cleanup and heartbeat listeners for live battle creations (exclusive to logged-in students)
    useEffect(() => {
        if (isAuth && role && role.toLowerCase() === 'student') {
            let isCancelled = false;
            let pusher = null;
            let channel = null;
            let dismissTimer = null;
            let handleVisibilityChange = null;

            import('pusher-js').then(({ default: Pusher }) => {
                if (isCancelled) return;

                pusher = new Pusher('06df370fb33f1263ec1f', {
                    cluster: 'eu',
                });

                channel = pusher.subscribe('global-battle-arena');
                
                const handleBattleCreated = (data) => {
                    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
                    console.log('[NOTIFICATION] Global live battle event received:', data);
                    
                    const myTeacherId = safeLocalStorage.getItem('teacher_id') || safeLocalStorage.getItem('school_id') || safeLocalStorage.getItem('created_by') || safeLocalStorage.getItem('teacher');
                    if (myTeacherId && (data.teacherId || data.schoolId)) {
                        const matchesTeacher = data.teacherId && String(myTeacherId) === String(data.teacherId);
                        const matchesSchool = data.schoolId && String(myTeacherId) === String(data.schoolId);
                        
                        if (!matchesTeacher && !matchesSchool) {
                            console.log('[NOTIFICATION] Ignoring battle created by a different teacher:', data.teacherId);
                            return;
                        }
                    }

                    // Set the notification details in state
                    setActiveBattleNotification({
                        competitionId: data.competitionId,
                        title: data.title,
                        teacherName: data.teacherName || "Your Teacher"
                    });

                    // Play a click sound to notify student
                    try {
                        soundEffects.playClick();
                    } catch (e) {}

                    // Auto-dismiss after 60 seconds
                    if (dismissTimer) clearTimeout(dismissTimer);
                    dismissTimer = setTimeout(() => {
                        setActiveBattleNotification(null);
                    }, 60000);
                };

                channel.bind('battle-created', handleBattleCreated);

                channel.bind('force-join-student', (data) => {
                    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
                    console.log('[NOTIFICATION] Force join event received:', data);
                    const myStudentId = safeLocalStorage.getItem('pp_id') || safeLocalStorage.getItem('user_id') || safeLocalStorage.getItem('guest_id');
                    if (data && data.studentId && myStudentId && String(data.studentId) === String(myStudentId)) {
                        navigate(`/student/competition/${data.competitionId}`);
                    }
                });

                // Reconnect Pusher on mobile when tab becomes visible after backgrounding
                handleVisibilityChange = () => {
                    if (document.visibilityState === 'visible') {
                        try {
                            if (pusher && (pusher.connection.state === 'disconnected' || pusher.connection.state === 'unavailable')) {
                                pusher.connect();
                            }
                        } catch (e) {}
                    }
                };
                document.addEventListener('visibilitychange', handleVisibilityChange);
            }).catch(err => console.error("Error loading Pusher in navbar", err));

            return () => {
                isCancelled = true;
                if (handleVisibilityChange) {
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                }
                if (dismissTimer) clearTimeout(dismissTimer);
                if (channel) {
                    channel.unbind_all();
                    channel.unsubscribe();
                }
                if (pusher) {
                    pusher.disconnect();
                }
            };
        }
    }, [isAuth, role, navigate]);

    const openTeacherForm = () => {
        soundEffects.playClick()
        setShowTeacherForm(true)
    }

    const closeTeacherForm = () => {
        setShowTeacherForm(false)
    }

    const handleSaveTeacher = (data) => {
        // Save to school account with teacher attribution
        // Append teacher ID to identify which teacher submitted the data
        const teacherID = safeLocalStorage.getItem('pp_id')
        const dataWithTeacherId = {
            ...data,
            submittedByTeacherId: teacherID,
            submittedByTeacherName: safeLocalStorage.getItem('pp_name'),
            status: 'under_construction'
        }
        
        // Store in a combined key that includes teacher data
        const existingTeachers = JSON.parse(safeLocalStorage.getItem('school_teachers') || '[]')
        existingTeachers.push(dataWithTeacherId)
        safeLocalStorage.setItem('school_teachers', JSON.stringify(existingTeachers))
        
        soundEffects.playClick()
        setShowTeacherForm(false)
        // Dispatch both events so both teacher and school dashboards update
        window.dispatchEvent(new CustomEvent('teachersUpdated'))
        window.dispatchEvent(new CustomEvent('teacherDataUpdated'))
    }

    return (

        <nav>
            <div className='nav-container d-flex justify-content-space-between align-items-center'>
                <Link to={'/'} onClick={() => soundEffects.playClick()}><img src={logo} alt="Egypt Schools" /></Link>
                
                {/* Desktop Center Links removed */}

                {/* Student Centered Header Homework Button */}
                {role === 'Student' && (
                    <div className="student-header-hw-center" style={{ display: 'flex', gap: '10px' }}>
                        <Link to={'/dashboard/student'} onClick={() => soundEffects.playClick()}>
                            <div className="student-navbar-hw-btn">
                                <span>📝 {t('navbar.homework', 'HOMEWORK')}</span>
                            </div>
                        </Link>
                        <Link to={'/student/learning-path'} onClick={() => soundEffects.playClick()}>
                            <div className="student-navbar-hw-btn" style={{ backgroundColor: '#f59e0b', borderColor: '#d97706' }}>
                                <span>🗺️ {t('navbar.journey', 'Journey (الرحلة)')}</span>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Mobile Menu Toggle */}
                {isAuth && (
                    <button 
                        className="mobile-menu-toggle d-lg-none" 
                        onClick={() => {
                            soundEffects.playClick();
                            setIsMobileMenuOpen(!isMobileMenuOpen);
                        }}
                    >
                        <i className={isMobileMenuOpen ? "fa fa-times" : "fa fa-bars"}></i>
                    </button>
                )}

                <div className={`nav-right-side d-flex align-items-center ${isAuth ? 'auth-menu' : 'unauth-menu'} ${isMobileMenuOpen ? 'mobile-open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                    <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
    
                        <div 
                            className="nav-btn" 
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                soundEffects.playClick();
                                i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
                            }}
                        >
                            🌐 {i18n.language === 'ar' ? 'English' : 'العربية'}
                        </div>
                    </div>
                    {(role === 'School' || role === 'Organization') ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="homework-btn"><span className="text-desktop">{t('navbar.homework', 'HOMEWORK')}</span><span className="text-mobile">HW</span></div></Link> : null}
                    {role === 'Teacher' ? (
                        <>
                            <Link to={'/student/games-menu'} onClick={() => soundEffects.playClick()}><div className="games-btn" style={{ marginRight: '10px' }}>{t('navbar.games', 'GAMES')}</div></Link>
                            
                            
                        </>
                    ) : null}
                    {role === 'Teacher' ? (
                        <div className="create-homework-nav-btn" onClick={() => { soundEffects.playClick(); setShowCreateHomework(true); }}>
                            <span className="text-desktop">{t('navbar.createHw', 'CREATE HW')}</span><span className="text-mobile">+HW</span>
                        </div>
                    ) : null}
                    
                    {isAuth && (role === 'Teacher' || role === 'School' || role === 'IT' || role === 'Organization') ? (
                        <div 
                            className="nav-btn create-competition-3d-btn"
                            onClick={() => { soundEffects.playClick(); setShowCreateCompetition(true); }}
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: '900',
                                fontSize: '13px',
                                padding: '0.45rem 1rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginRight: '6px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 -3px 0 rgba(0,0,0,0.2)',
                                transition: 'transform 0.1s, box-shadow 0.1s',
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'translateY(2px)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.35), inset 0 -1px 0 rgba(0,0,0,0.2)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 -3px 0 rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35), inset 0 -3px 0 rgba(0,0,0,0.2)';
                            }}
                        >
                            {t('navbar.createCompetition', '⚔️ CREATE COMPETITION')}
                        </div>
                    ) : null}
                    {isAuth && (role === 'Teacher' || role === 'School' || role === 'IT') ? (
                        <Link 
                            to="/teacher/competitions-hub" 
                            onClick={() => {
                                soundEffects.playClick();
                                if (hasUnreadEvents) {
                                    setHasUnreadEvents(false);
                                    safeLocalStorage.setItem('teacher_last_competitions_view', new Date().toISOString());
                                }
                            }}
                            style={{ textDecoration: 'none', marginRight: '6px' }}
                        >
                            <div
                                className={`nav-btn ${hasUnreadEvents ? 'competitions-btn-red-glow' : ''}`}
                                style={{
                                    background: hasUnreadEvents ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                    color: hasUnreadEvents ? '#ffffff' : '#000000',
                                    border: 'none',
                                    fontWeight: '900',
                                    fontSize: '13px',
                                    padding: '0.45rem 1rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: hasUnreadEvents ? '0 4px 14px rgba(239, 68, 68, 0.45)' : '0 4px 12px rgba(245, 158, 11, 0.35)'
                                }}
                            >
                                {t('navbar.competitionsHub', '🏆 JOIN A COMPETITION')}
                                {hasUnreadEvents && (
                                    <span style={{
                                        backgroundColor: '#ffffff',
                                        color: '#dc2626',
                                        borderRadius: '10px',
                                        padding: '2px 6px',
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        marginLeft: '4px'
                                    }}>
                                        NEW
                                    </span>
                                )}
                            </div>
                        </Link>
                    ) : null}

                    {role === 'Teacher' ? <Link to={'/dashboard/teacher'} onClick={() => soundEffects.playClick()}><div className="homework-btn teacher-reports-btn"><span className="text-desktop">{t('navbar.homeworkReports', 'HOMEWORK REPORTS')}</span><span className="text-mobile">REPORTS</span></div></Link> : null}
                    {role === 'Student' ? (
                        <>
                            <Link to={'/student/games-menu'} onClick={() => soundEffects.playClick()}><div className="games-btn">{t('navbar.games', 'GAMES')}</div></Link>
                        </>
                    ) : null}
                    {role === 'IT' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="homework-btn"><span className="text-desktop">{t('navbar.homework', 'HOMEWORK')}</span><span className="text-mobile">HW</span></div></Link> : null}
                    {role === 'Supervisor' ? <Link to={'/dashboard/supervisor'} onClick={() => soundEffects.playClick()}><div className="homework-btn"><span className="text-desktop">{t('navbar.homework', 'HOMEWORK')}</span><span className="text-mobile">HW</span></div></Link> : null}
                    {isAuth && role !== 'Teacher' ? (
                        <Link to={'/shop'} onClick={() => soundEffects.playClick()}>
                          <div className="nav-btn" style={{ backgroundColor: '#fbbf24', color: '#000', border: 'none', marginRight: '10px', fontWeight: 'bold' }}>
                            {t('navbar.shop', 'SHOP 🪙')}
                          </div>
                        </Link>
                    ) : null}
                    {isAuth ? (
                        <Link to={'/user/info'} onClick={() => soundEffects.playClick()}>
                          <div className="nav-btn nav-btn-profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {safeLocalStorage.getItem('user_profile_avatar') ? (
                                safeLocalStorage.getItem('user_profile_avatar').length <= 6 && !safeLocalStorage.getItem('user_profile_avatar').startsWith('data:') ? (
                                    <span style={{ fontSize: '1.2rem' }}>{safeLocalStorage.getItem('user_profile_avatar')}</span>
                                ) : (
                                    <img src={safeLocalStorage.getItem('user_profile_avatar')} alt="avatar" className="nav-profile-avatar-img" />
                                )
                            ) : null}
                            <span>{safeLocalStorage.getItem('pp_name') || t('navbar.profile', 'PROFILE')}</span>
                          </div>
                        </Link>
                    ) : (
                        <>
                            <Link to={'/student/games/math-racer'} onClick={() => soundEffects.playClick()} style={{ marginRight: '10px', textDecoration: 'none' }}>
                                <div className="nav-btn nav-btn-mathracer" style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                                    borderRadius: '10px',
                                    padding: '8px 14px'
                                }}>
                                    <span>🏎️ {isArabic ? 'سباق الرياضيات (مجاناً)' : 'Math Racer (Free)'}</span>
                                </div>
                            </Link>
                            {SHOW_PRICING && (
                                <Link to={'/pricing'} onClick={() => soundEffects.playClick()}>
                                    <div className="nav-btn nav-btn-join" style={{ marginRight: '15px' }}>
                                        {t('home.joinNow')}
                                    </div>
                                </Link>
                            )}
                            <Link to={'/auth/register'} onClick={() => soundEffects.playClick()} style={{ marginRight: '10px', textDecoration: 'none' }}>
                                <div className="nav-btn nav-btn-signup" style={{ 
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                    color: 'white', 
                                    border: 'none',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                                    borderRadius: '10px',
                                    padding: '8px 14px'
                                }}>
                                    <span>Sign Up</span>
                                    <span style={{
                                        background: '#fef08a',
                                        color: '#854d0e',
                                        fontSize: '0.65rem',
                                        fontWeight: '800',
                                        padding: '2px 6px',
                                        borderRadius: '999px',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase'
                                    }}>3 Days Free</span>
                                </div>
                            </Link>
                            <Link to={'/auth/login'} onClick={() => soundEffects.playClick()}>
                                <div className="nav-btn">
                                    {t('common.login')}
                                </div>
                            </Link>
                        </>
                    )}
                </div>
            </div>
            {showTeacherForm && (
                <Suspense fallback={null}>
                    <TeacherRegistration
                        onClose={closeTeacherForm}
                        onSave={handleSaveTeacher}
                    />
                </Suspense>
            )}
            {showTeacherHelp && (
    <Suspense fallback={null}>
        <TeacherHelpModal
            onClose={() => setShowTeacherHelp(false)}
        />
    </Suspense>
)}
            {showStudentHelp && (
    <Suspense fallback={null}>
        <StudentHelpModal
            onClose={() => setShowStudentHelp(false)}
        />
    </Suspense>
)}
            {showCreateHomework && (
                <Suspense fallback={null}>
                    <CreateHomeworkModal
                        onClose={() => setShowCreateHomework(false)}
                    />
                </Suspense>
            )}
            {showCreateCompetition && (
                <CreateCompetitionModal
                    onClose={() => setShowCreateCompetition(false)}
                />
            )}
            {showTutorialVideo && (
                <TutorialVideoModal
                    isOpen={showTutorialVideo}
                    onClose={() => setShowTutorialVideo(false)}
                    role={tutorialRole}
                />
            )}

            {/* Premium real-time student overlay battle thinking bubble notification */}
            {activeBattleNotification && (
                <div className="battle-notification-bubble-overlay animate-bubble-pop-in">
                    <div className="bubble-content">
                        <button 
                            className="bubble-close-x" 
                            onClick={() => setActiveBattleNotification(null)}
                            title="Dismiss Notification"
                        >
                            ×
                        </button>
                        <div className="bubble-header-row">
                            <span className="bubble-icon-battle">⚔️</span>
                            <span className="bubble-title-text">Competition Arena Calling!</span>
                        </div>
                        <p className="bubble-message-text">
                            Teacher <strong>{activeBattleNotification.teacherName}</strong> started a competition:<br/>
                            <span className="bubble-battle-title">"{activeBattleNotification.title}"</span>
                        </p>
                        <button 
                            className="bubble-join-action-btn"
                            onClick={() => {
                                const compId = activeBattleNotification.competitionId;
                                setActiveBattleNotification(null);
                                
                                // Route directly to the competition page
                                navigate(`/student/competition/${compId}`);
                            }}
                        >
                            Join the Competition Now! ⚔️
                        </button>
                    </div>
                    <div className="bubble-thinking-dots">
                        <span className="dot dot-1"></span>
                        <span className="dot dot-2"></span>
                        <span className="dot dot-3"></span>
                    </div>
                </div>
            )}
        </nav >
    );
}

export default Navbar;
