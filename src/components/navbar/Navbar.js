import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Pusher from 'pusher-js';
import logo from '../../logo.png'
import profileImg from '../../img/avatar-profile.png'
import school from '../../img/school-avatar.png'
import soundEffects from '../../utils/soundEffects'
import TeacherRegistration from '../teacherRegistration/TeacherRegistration'
import TeacherHelpModal from '../teacherHelpModal/TeacherHelpModal'
import StudentHelpModal from '../studentHelpModal/StudentHelpModal'
import CreateHomeworkModal from './CreateHomeworkModal'
import CreateCompetitionModal from './CreateCompetitionModal'
import TutorialVideoModal from '../tutorialVideoModal/TutorialVideoModal'
import { safeLocalStorage } from '../../utils/safeStorage'
import '../../reusable.css'
import './Navbar.css'
import { SHOW_PRICING, ENABLE_CUSTOM_QUESTION_BANK } from '../../config/api.config'

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isAuth = safeLocalStorage.getItem('O_authWEB')
    const role = safeLocalStorage.getItem('auth_role')
    const schoolName = safeLocalStorage.getItem('school_name') || '';
    const userName = safeLocalStorage.getItem('pp_name') || '';
    const userRole = safeLocalStorage.getItem('auth_role') || '';
    
    const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || 
                        (userRole === 'School' && userName.toLowerCase() === 'topsoroban');

    const [showTeacherForm, setShowTeacherForm] = useState(false)
    const [showTeacherHelp, setShowTeacherHelp] = useState(false)
    const [showStudentHelp, setShowStudentHelp] = useState(false)
    const [showCreateHomework, setShowCreateHomework] = useState(false)
    const [showCreateCompetition, setShowCreateCompetition] = useState(false)
    const [showTutorialVideo, setShowTutorialVideo] = useState(false)
    const [tutorialRole, setTutorialRole] = useState('Teacher')
    const [activeBattleNotification, setActiveBattleNotification] = useState(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Global real-time listener for live battle creations (exclusive to logged-in students)
    useEffect(() => {
        if (isAuth && role === 'Student') {
            const pusher = new Pusher('app_e4ed3fcd3045501a594c2640c4d2dd75832ff677', {
                cluster: 'us',
            });

            const channel = pusher.subscribe('global-battle-arena');
            
            channel.bind('battle-created', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
                console.log('[NOTIFICATION] Global live battle event received:', data);
                
                const myTeacherId = safeLocalStorage.getItem('teacher_id');
                // Allow notification if student was created by this teacher, OR student was created by the teacher's school (common in Topsoroban)
                if (myTeacherId && data.teacherId) {
                    const matchesTeacher = String(myTeacherId) === String(data.teacherId);
                    const matchesSchool = data.schoolId && String(myTeacherId) === String(data.schoolId);
                    
                    if (!matchesTeacher && !matchesSchool) {
                        console.log('[NOTIFICATION] Ignoring battle created by a different teacher/school:', data.teacherId);
                        return;
                    }
                }

                // Set the notification details in state
                setActiveBattleNotification({
                    competitionId: data.competitionId,
                    title: data.title,
                    teacherName: data.teacherName
                });

                // Play a warm click sound to notify student
                try {
                    soundEffects.playClick();
                } catch (e) {}
            });

            channel.bind('force-join-student', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
                console.log('[NOTIFICATION] Force join event received:', data);
                if (String(data.studentId) === String(safeLocalStorage.getItem('pp_id'))) {
                    navigate(`/student/competition/${data.competitionId}`);
                }
            });

            // Set up a 60 seconds auto-dismiss timer whenever a battle is received
            let dismissTimer;
            channel.bind('battle-created', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
                const myTeacherId = safeLocalStorage.getItem('teacher_id');
                if (myTeacherId && data.teacherId) {
                    const matchesTeacher = String(myTeacherId) === String(data.teacherId);
                    const matchesSchool = data.schoolId && String(myTeacherId) === String(data.schoolId);
                    if (!matchesTeacher && !matchesSchool) return;
                }
                clearTimeout(dismissTimer);
                dismissTimer = setTimeout(() => {
                    setActiveBattleNotification(null);
                }, 60000); // 60 seconds auto-dismiss
            });

            return () => {
                clearTimeout(dismissTimer);
                channel.unbind_all();
                channel.unsubscribe();
                pusher.disconnect();
            };
        }
    }, [isAuth, role]);

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
                <Link to={'/'} onClick={() => soundEffects.playClick()}><img src={isTopsoroban ? '/img/topsoroban_abacusheroes_logo.png' : logo} alt="" /></Link>
                
                {/* Desktop Center Links */}
                <div className="nav-center-links d-none d-lg-flex">
                    <div className="nav-dropdown">
                        <span className="nav-link">{t('navbar.forTeachers', 'For Teachers ▾')}</span>
                        <div className="dropdown-menu">
                            <span onClick={() => { soundEffects.playClick(); setShowTeacherHelp(true); }} className="dropdown-item">{t('navbar.websiteExplanation', 'Website Explanation')}</span>
                            {false && <span onClick={() => { soundEffects.playClick(); navigate('/teacher/registration'); }} className="dropdown-item">Register as Teacher</span>}
                            <span onClick={() => {
                                soundEffects.playClick();
                                if (role === 'Teacher' || role === 'School') {
                                    setShowCreateHomework(true);
                                } else {
                                    navigate('/auth/login');
                                }
                            }} className="dropdown-item">{t('navbar.createHomework', 'Create Homework')}</span>

                            <span onClick={() => {
                                soundEffects.playClick();
                                setTutorialRole('Teacher');
                                setShowTutorialVideo(true);
                            }} className="dropdown-item">{t('navbar.videos', 'Videos')}</span>
                        </div>
                    </div>
                    <div className="nav-dropdown">
                        <span className="nav-link">{t('navbar.forStudents', 'For Students ▾')}</span>
                        <div className="dropdown-menu">
                            <span onClick={() => { soundEffects.playClick(); setShowStudentHelp(true); }} className="dropdown-item">{t('navbar.websiteExplanation', 'Website Explanation')}</span>
                            <span onClick={() => { soundEffects.playClick(); if (role === 'Student') { navigate('/dashboard/student'); } else { navigate('/auth/login'); } }} className="dropdown-item">{t('navbar.myHomework', 'My Homework')}</span>
                            <span onClick={() => { soundEffects.playClick(); navigate('/student/games-menu'); }} className="dropdown-item">{t('navbar.gameRoom', 'Game Room')}</span>
                            <span onClick={() => {
                                soundEffects.playClick();
                                setTutorialRole('Student');
                                setShowTutorialVideo(true);
                            }} className="dropdown-item">{t('navbar.videos', 'Videos')}</span>
                        </div>
                    </div>
                    {SHOW_PRICING && <Link to="/pricing" onClick={() => soundEffects.playClick()} className="nav-link">{t('navbar.pricing', 'Pricing')}</Link>}
                    <Link to="/contact" onClick={() => soundEffects.playClick()} className="nav-link">{t('navbar.contact', 'Contact')}</Link>
                </div>

                {/* Student Centered Header Homework Button */}
                {role === 'Student' && (
                    <div className="student-header-hw-center">
                        <Link to={'/dashboard/student'} onClick={() => soundEffects.playClick()}>
                            <div className="student-navbar-hw-btn">
                                <span>📝 {t('navbar.homework', 'HOMEWORK')}</span>
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
                        {isAuth && isTopsoroban && safeLocalStorage.getItem('trial_remaining_days') !== null && (
                            <div style={{
                                backgroundColor: Number(safeLocalStorage.getItem('trial_remaining_days')) <= 5 ? '#dc2626' : '#f59e0b',
                                color: '#ffffff',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '0.82rem',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                whiteSpace: 'nowrap'
                            }}>
                                ⏳ {i18n.language === 'ar' 
                                    ? `تجريبي: متبقي ${safeLocalStorage.getItem('trial_remaining_days')} يوم` 
                                    : `Trial: ${safeLocalStorage.getItem('trial_remaining_days')} days left`}
                            </div>
                        )}
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
                    {role === 'School' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="homework-btn"><span className="text-desktop">{t('navbar.homework', 'HOMEWORK')}</span><span className="text-mobile">HW</span></div></Link> : null}
                    {role === 'Teacher' ? (
                        <>
                            <Link to={'/student/games-menu'} onClick={() => soundEffects.playClick()}><div className="games-btn" style={{ marginRight: '10px' }}>{t('navbar.games', 'GAMES')}</div></Link>
                            <Link to={'/dashboard-school/class'} onClick={() => soundEffects.playClick()}>
                                <div className="homework-btn" style={{ backgroundColor: '#3b82f6', border: 'none', marginRight: '10px' }}>{t('navbar.classes', 'CLASSES')}</div>
                            </Link>
                            <Link to={'/teacher/registration'} onClick={() => soundEffects.playClick()}>
                                <div className="teachers-btn"><span className="text-desktop">{t('navbar.addStudents', 'ADD STUDENTS')}</span><span className="text-mobile">+STUDENTS</span></div>
                            </Link>
                        </>
                    ) : null}
                    {role === 'Teacher' ? (
                        <div className="create-homework-nav-btn" onClick={() => { soundEffects.playClick(); setShowCreateHomework(true); }}>
                            <span className="text-desktop">{t('navbar.createHw', 'CREATE HW')}</span><span className="text-mobile">+HW</span>
                        </div>
                    ) : null}
                    {role === 'Teacher' ? (
                        <>
                            <div className="create-battle-nav-btn" onClick={() => { soundEffects.playClick(); setShowCreateCompetition(true); }}>
                                {t('navbar.createCompetition', '⚔️ CREATE A COMPETITION')}
                            </div>
                        </>
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
                          <div className="nav-btn nav-btn-profile">
                            {t('navbar.profile', 'PROFILE')}
                          </div>
                        </Link>
                    ) : (
                        <>
                            {SHOW_PRICING && (
                                <Link to={'/pricing'} onClick={() => soundEffects.playClick()}>
                                    <div className="nav-btn nav-btn-join" style={{ marginRight: '15px' }}>
                                        {t('home.joinNow')}
                                    </div>
                                </Link>
                            )}
                            {false && (
                                <Link to={'/auth/register'} onClick={() => soundEffects.playClick()} style={{ marginRight: '10px' }}>
                                    <div className="nav-btn" style={{ background: '#2563eb', color: 'white', border: 'none' }}>
                                        Sign Up
                                    </div>
                                </Link>
                            )}
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
                <TeacherRegistration
                    onClose={closeTeacherForm}
                    onSave={handleSaveTeacher}
                />
            )}
            {showTeacherHelp && (
                <TeacherHelpModal
                    onClose={() => setShowTeacherHelp(false)}
                />
            )}
            {showStudentHelp && (
                <StudentHelpModal
                    onClose={() => setShowStudentHelp(false)}
                />
            )}
            {showCreateHomework && (
                <CreateHomeworkModal
                    onClose={() => setShowCreateHomework(false)}
                />
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
