import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import { useNavigate } from 'react-router-dom'
import getClass from '../../api/student/getClass.api'
import DashboardLoading from '../../components/dashboardLoading/DashboardLoading'
import getAllAttempts from '../../api/assignment/getAllAttempts.api'
import TutorialVideoModal from '../../components/tutorialVideoModal/TutorialVideoModal'
import AttemptHistory from '../../components/attemptHistory/AttemptHistory'
import API_BASE_URL from '../../config/api.config'
import soundEffects from '../../utils/soundEffects'
import '../../reusable.css'
import './StudentDashboard.css'

function StudentDashboard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [teacherList, setTeacherList] = useState([])
    const [allAsignment, setAllAsignment] = useState([])
    const [className, setClassName] = useState('')
    const [loading, setLoading] = useState(true)
    const [assignmentsLoading, setAssignmentsLoading] = useState(true)
    const [totalAssignments, setTotalAssignments] = useState(0)
    const [unsolvedAssignments, setUnsolvedAssignments] = useState(0)
    const [showTutorialModal, setShowTutorialModal] = useState(false)
    const [showAttemptHistory, setShowAttemptHistory] = useState(false)
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null)
    const [countdownActive, setCountdownActive] = useState(false)
    const [countdownNum, setCountdownNum] = useState(null)
    const [resultsCache, setResultsCache] = useState({}) // {assignmentId: {score, total}}
    const isAuth = localStorage.getItem('O_authWEB')
    const userID = localStorage.getItem('pp_id') || 'unknown'

    // Competition join states
    const [compIdInput, setCompIdInput] = useState('')
    const [joiningComp, setJoiningComp] = useState(false)
    const [joinCompError, setJoinCompError] = useState(null)

    // Check if an assignment has saved progress in localStorage
    const hasInProgress = (assignmentId) => {
        try {
            const key = `assignment_progress_${assignmentId}_${userID}`
            const saved = localStorage.getItem(key)
            if (!saved) return false
            const progress = JSON.parse(saved)
            const isRecent = Date.now() - progress.timestamp < 24 * 60 * 60 * 1000
            return isRecent && progress.questionData && progress.questionData.length > 0
        } catch (e) { return false }
    }

    const countdownIntervalRef = React.useRef(null)

    // Full-page countdown 3-2-1 then navigate
    const startCountdown = (assignmentId) => {
        setCountdownActive(true)
        setCountdownNum(3)
        soundEffects.playClick()
        let count = 3
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = setInterval(() => {
            count--
            if (count > 0) {
                setCountdownNum(count)
            } else {
                clearInterval(countdownIntervalRef.current)
                countdownIntervalRef.current = null
                setCountdownActive(false)
                setCountdownNum(null)
                navigate(`/student/assignment/${assignmentId}`)
            }
        }, 900)
    }

    useEffect(() => {
        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
            }
        }
    }, [])

    // Fetch results for all completed assignments when the popup opens
    const fetchCompletedResults = async (assignments) => {
        const completed = assignments.filter(a => a.isCompleted || a.isSubmitted)
        const cache = {}
        await Promise.all(completed.map(async (a) => {
            try {
                const result = await getAllAttempts(a._id)
                if (result.success && result.statistics) {
                    cache[a._id] = {
                        score: result.statistics.bestScore,
                        total: result.statistics.totalPossiblePoints
                    }
                }
            } catch (e) { /* ignore */ }
        }))
        setResultsCache(cache)
    }

    useEffect(() => {
        const handleGetClass = () => {
            getClass(setLoading, setClassName, setTeacherList)
        }
        if (isAuth) {
            handleGetClass()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch all assignments from all teachers automatically
    useEffect(() => {
        const fetchAllAssignments = async () => {
            if (teacherList && teacherList.length > 0) {
                setAssignmentsLoading(true)
                let combinedAssignments = []
                let totalCount = 0
                let unsolvedCount = 0

                const Token = localStorage.getItem('O_authWEB')
                const promises = teacherList.map(async (teacher) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/student/getAssignment/${teacher._id}`, {
                            method: 'get',
                            headers: {
                                'Content-Type': 'application/json',
                                'authrization': `pracYas09${Token}`
                            },
                        })
                        const responseJson = await response.json()
                        if (responseJson.message === 'success' && responseJson.allAssignment) {
                            const assignments = responseJson.allAssignment.map(a => ({
                                ...a,
                                teacherName: teacher.userName,
                                subjectName: teacher?.subject?.schoolSubjectName
                            }))
                            combinedAssignments.push(...assignments)
                        }
                    } catch (e) {
                        console.error('Error fetching assignments for teacher:', teacher.userName, e)
                    }
                })

                await Promise.all(promises)

                totalCount = combinedAssignments.length
                unsolvedCount = combinedAssignments.filter(a => !a.isCompleted && !a.isSubmitted).length

                // Sort strictly from newest to earliest (using createdAt date, falling back to _id timestamp)
                combinedAssignments.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
                    if (dateB - dateA !== 0) {
                        return dateB - dateA
                    }
                    return b._id.localeCompare(a._id)
                })

                setAllAsignment(combinedAssignments)
                setTotalAssignments(totalCount)
                setUnsolvedAssignments(unsolvedCount)
                setAssignmentsLoading(false)
                
                fetchCompletedResults(combinedAssignments)
            } else {
                setAssignmentsLoading(false)
            }
        }

        fetchAllAssignments()
    }, [teacherList])

    const schoolName = localStorage.getItem('school_name') || '';
    const userName = localStorage.getItem('pp_name') || '';
    const userRole = localStorage.getItem('auth_role') || '';
    
    const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || 
                        (userRole === 'School' && userName.toLowerCase() === 'topsoroban');

    return (
        <div className={isTopsoroban ? 'topsoroban-theme-global' : ''}>
            <MobileNav role="Student" />
            <Navbar />
            


            <div className="student-dashboard-container">
                {loading ? <DashboardLoading /> : (
                    <div className="dashboard-main-menu">
                        <div className="welcome-header">
                            <h2 className="welcome-title">{t('studentDashboard.hello', 'Hello, {{name}}! 👋', { name: userName })}</h2>
                            {className ? (
                                <p className="class-subtitle">{t('studentDashboard.classLabel', 'Class:')} <span className="class-highlight">{className}</span></p>
                            ) : (
                                <p className="text-red text-center">{t('studentDashboard.noClass', 'You are not placed in any class yet')}</p>
                            )}
                        </div>

                        {/* Assignment List Header */}
                        <div className="assignment-list-header">
                            <h3>{t('studentDashboard.homeworkListTitle', '📝 Your Homework List')}</h3>
                            <p className="list-tagline">{t('studentDashboard.homeworkListTagline', 'Solve pending assignments or review your grades below.')}</p>
                        </div>

                        {assignmentsLoading ? (
                            <DashboardLoading />
                        ) : allAsignment.length === 0 ? (
                            <div className="no-assignments-box">
                                <span className="box-icon">🎉</span>
                                <h4>{t('studentDashboard.allCaughtUp', 'All caught up!')}</h4>
                                <p>{t('studentDashboard.noAssignments', 'You have no homework assignments at the moment.')}</p>
                            </div>
                        ) : (
                            <div className="assignments-grid-modern">
                                {allAsignment.map(item => {
                                    const isCompleted = item.isCompleted || item.isSubmitted;
                                    const inProgress = !isCompleted && hasInProgress(item._id);
                                    const cachedResult = resultsCache[item._id];

                                    return (
                                        <div 
                                            key={item._id} 
                                            className={`assignment-card-modern ${isCompleted ? 'completed' : inProgress ? 'in-progress' : 'unsolved'}`}
                                            onClick={() => {
                                                if (isCompleted) {
                                                    soundEffects.playClick();
                                                    navigate(`/student/myReport/${item._id}`);
                                                }
                                            }}
                                            style={isCompleted ? { cursor: 'pointer' } : {}}
                                        >
                                            <div className="card-top-header">
                                                <span className="subject-tag">{item.subjectName || 'Math'}</span>
                                                <span className="teacher-tag">👤 {item.teacherName || 'Teacher'}</span>
                                            </div>

                                            <h4 className="card-assignment-title">{item.title}</h4>

                                            <div className="card-stats-row">
                                                <div className="card-stat">
                                                    <span className="card-stat-icon">📋</span>
                                                    <span className="card-stat-value">{item.questionsNumber || 'Multiple'} {t('studentDashboard.qs', 'Qs')}</span>
                                                </div>
                                                <div className="card-stat">
                                                    <span className="card-stat-icon">⏱️</span>
                                                    <span className="card-stat-value">{item.timer ? `${item.timer} ${t('studentDashboard.min', 'Min')}` : t('studentDashboard.unlimited', 'Unlimited')}</span>
                                                </div>
                                                <div className="card-stat">
                                                    <span className="card-stat-icon">🔄</span>
                                                    <span className="card-stat-value">{item.attemptsNumber || 1} {t('studentDashboard.attempts', 'Attempts')}</span>
                                                </div>
                                            </div>

                                            <div className="card-footer-action">
                                                {isCompleted ? (
                                                    <div className="completed-action-row">
                                                        <span className="completed-badge">{t('studentDashboard.completed', '✓ COMPLETED')}</span>
                                                        {cachedResult && (
                                                            <div className="compact-score-display">
                                                                <span className="score-val">{cachedResult.score}</span>
                                                                <span className="score-tot">/{cachedResult.total} {t('studentDashboard.pts', 'pts')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : inProgress ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startCountdown(item._id);
                                                        }}
                                                        className="assignment-btn resume"
                                                    >
                                                        {t('studentDashboard.resumeHomework', '▶ Resume Homework')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startCountdown(item._id);
                                                        }}
                                                        className="assignment-btn start"
                                                    >
                                                        {t('studentDashboard.startHomework', '🚀 Start Homework')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tutorial Video Modal */}
            <TutorialVideoModal 
                isOpen={showTutorialModal} 
                onClose={() => setShowTutorialModal(false)}
                role="Student"
            />

            {/* Attempt History Modal */}
            {showAttemptHistory && selectedAssignmentId && (
                <AttemptHistory 
                    assignmentID={selectedAssignmentId}
                    onClose={() => {
                        setShowAttemptHistory(false);
                        setSelectedAssignmentId(null);
                    }}
                />
            )}

            {/* Full-page 3-2-1 Countdown Overlay */}
            {countdownActive && (
                <div className="fullpage-countdown-overlay">
                    <div className="fullpage-countdown-content">
                        <div className="fullpage-countdown-ring">
                            <span className="fullpage-countdown-number">{countdownNum}</span>
                        </div>
                        <p className="fullpage-countdown-text">
                            {countdownNum === 3 ? t('studentDashboard.getReady', 'Get Ready...') : countdownNum === 2 ? t('studentDashboard.set', 'Set...') : t('studentDashboard.go', 'Go! 🚀')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default React.memo(StudentDashboard)