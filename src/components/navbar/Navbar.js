import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import '../../reusable.css'
import './Navbar.css'

const Navbar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')
    const [showTeacherForm, setShowTeacherForm] = useState(false)
    const [showTeacherHelp, setShowTeacherHelp] = useState(false)
    const [showStudentHelp, setShowStudentHelp] = useState(false)
    const [showCreateHomework, setShowCreateHomework] = useState(false)
    const [showCreateCompetition, setShowCreateCompetition] = useState(false)
    const [showTutorialVideo, setShowTutorialVideo] = useState(false)
    const [tutorialRole, setTutorialRole] = useState('Teacher')

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
        const teacherID = localStorage.getItem('pp_id')
        const dataWithTeacherId = {
            ...data,
            submittedByTeacherId: teacherID,
            submittedByTeacherName: localStorage.getItem('pp_name'),
            status: 'under_construction'
        }
        
        // Store in a combined key that includes teacher data
        const existingTeachers = JSON.parse(localStorage.getItem('school_teachers') || '[]')
        existingTeachers.push(dataWithTeacherId)
        localStorage.setItem('school_teachers', JSON.stringify(existingTeachers))
        
        soundEffects.playClick()
        setShowTeacherForm(false)
        // Dispatch both events so both teacher and school dashboards update
        window.dispatchEvent(new CustomEvent('teachersUpdated'))
        window.dispatchEvent(new CustomEvent('teacherDataUpdated'))
    }

    return (

        <nav>
            <div className='nav-container d-flex justify-content-space-between align-items-center'>
                <Link to={'/'} onClick={() => soundEffects.playClick()}><img src={logo} alt="" /></Link>
                
                {/* Desktop Center Links */}
                <div className="nav-center-links d-none d-lg-flex">
                    <div className="nav-dropdown">
                        <span className="nav-link">For Teachers ▾</span>
                        <div className="dropdown-menu">
                            <span onClick={() => { soundEffects.playClick(); setShowTeacherHelp(true); }} className="dropdown-item">Website Explanation</span>
                            <span onClick={() => { soundEffects.playClick(); navigate('/teacher/registration'); }} className="dropdown-item">Register as Teacher</span>
                            <span onClick={() => {
                                soundEffects.playClick();
                                if (role === 'Teacher' || role === 'School') {
                                    setShowCreateHomework(true);
                                } else {
                                    navigate('/auth/login');
                                }
                            }} className="dropdown-item">Create Homework</span>
                            <span onClick={() => {
                                soundEffects.playClick();
                                setTutorialRole('Teacher');
                                setShowTutorialVideo(true);
                            }} className="dropdown-item">Videos</span>
                        </div>
                    </div>
                    <div className="nav-dropdown">
                        <span className="nav-link">For Students ▾</span>
                        <div className="dropdown-menu">
                            <span onClick={() => { soundEffects.playClick(); setShowStudentHelp(true); }} className="dropdown-item">Website Explanation</span>
                            <span onClick={() => { soundEffects.playClick(); if (role === 'Student') { navigate('/dashboard/student'); } else { navigate('/auth/login'); } }} className="dropdown-item">My Homework</span>
                            <span onClick={() => { soundEffects.playClick(); navigate('/student/games-menu'); }} className="dropdown-item">Game Room</span>
                            <span onClick={() => {
                                soundEffects.playClick();
                                setTutorialRole('Student');
                                setShowTutorialVideo(true);
                            }} className="dropdown-item">Videos</span>
                        </div>
                    </div>
                    <Link to="/pricing" onClick={() => soundEffects.playClick()} className="nav-link">Pricing</Link>
                    <Link to="/contact" onClick={() => soundEffects.playClick()} className="nav-link">Contact</Link>
                </div>

                <div className='nav-right-side d-flex align-items-center'>
                    {role === 'School' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="homework-btn">HOMEWORK</div></Link> : null}
                    {role === 'Teacher' ? <Link to={'/teacher/registration'} onClick={() => soundEffects.playClick()}><div className="teachers-btn">ADD STUDENTS</div></Link> : null}
                    {role === 'Teacher' ? (
                        <div className="create-homework-nav-btn" onClick={() => { soundEffects.playClick(); setShowCreateHomework(true); }}>
                            CREATE HW
                        </div>
                    ) : null}
                    {role === 'Teacher' ? (
                        <div className="create-battle-nav-btn" onClick={() => { soundEffects.playClick(); setShowCreateCompetition(true); }}>
                            ⚔️ BATTLE
                        </div>
                    ) : null}
                    {role === 'Teacher' ? <Link to={'/dashboard/teacher'} onClick={() => soundEffects.playClick()}><div className="homework-btn teacher-reports-btn">HOMEWORK REPORTS</div></Link> : null}
                    {role === 'Student' ? (
                        <>
                            <Link to={'/student/games-menu'} onClick={() => soundEffects.playClick()}><div className="games-btn">GAMES</div></Link>
                            <Link to={'/dashboard/student'} onClick={() => soundEffects.playClick()}><div className="homework-btn">HOMEWORK</div></Link>
                        </>
                    ) : null}
                    {role === 'IT' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="homework-btn">HOMEWORK</div></Link> : null}
                    {role === 'Supervisor' ? <Link to={'/dashboard/supervisor'} onClick={() => soundEffects.playClick()}><div className="homework-btn">HOMEWORK</div></Link> : null}
                    {isAuth ? (
                      <Link to={'/user/info'} onClick={() => soundEffects.playClick()}>
                        <div className="nav-btn nav-btn-profile">
                          PROFILE
                        </div>
                      </Link>
                    ) : (
                        <>
                            <Link to={'/pricing'} onClick={() => soundEffects.playClick()}>
                                <div className="nav-btn nav-btn-join" style={{ marginRight: '15px' }}>
                                    {t('home.joinNow')}
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
        </nav >
    );
}

export default Navbar;
