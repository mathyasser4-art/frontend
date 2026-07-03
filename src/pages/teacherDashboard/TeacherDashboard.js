import React, { useState, useEffect } from 'react'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import TrialBanner from '../../components/trialBanner/TrialBanner';
import UpgradePrompt from '../../components/upgradePrompt/UpgradePrompt';
import { Link, useNavigate } from 'react-router-dom'
import MathInput from "react-math-keyboard";
import { X, Swords, Trophy, ChevronRight } from 'lucide-react'
import getAssignment from '../../api/teacher/getAssignment.api'
import getClass from '../../api/teacher/getClass.api';
import duplicateAssignment from '../../api/assignment/duplicateAssignment.api';
import removeAssignment from '../../api/assignment/removeAssignment.api';
import DashboardLoading from '../../components/dashboardLoading/DashboardLoading'
import { History } from 'lucide-react'
import soundEffects from '../../utils/soundEffects'
import { getTeacherCompetitions } from '../../api/competition/competition.api';
import CreateCompetitionModal from '../../components/navbar/CreateCompetitionModal';
import tipStudent from '../../api/user/tipStudent.api';
import '../../reusable.css'
import './TeacherDashboard.css'

function TeacherDashboard() {
    const navigate = useNavigate();
    const [studentList, setStudentList] = useState([])
    const [allAsignment, setAllAsignment] = useState([])
    const [questionList, setQuestionList] = useState([])
    const [assignmentID, setAssignmentID] = useState('')
    let [pocketNumber, setPocketNumber] = useState(0)
    let [timer, setTimer] = useState('')
    let [title, setTitle] = useState('')
    let [attempts, setAttempts] = useState('')

    let [classSelector, setClassSelector] = useState('')
    const [classesList, setClassesList] = useState([])
    const [classesBox, setClassesBox] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingOperation, setLoadingOperation] = useState(false)
    const [errorOperation, setErrorOperation] = useState(null)
    const [error, setError] = useState(null)
    const [forceFlashMode, setForceFlashMode] = useState(false)
    const [assignmentFlashSpeed, setAssignmentFlashSpeed] = useState(1.0)
    const isAuth = localStorage.getItem('O_authWEB')
    const isTrialMode = localStorage.getItem('isTrialMode') === 'true'

    // Competition states
    const [myCompetitions, setMyCompetitions] = useState([])
    const [compLoading, setCompLoading] = useState(true)
    const [showCreateComp, setShowCreateComp] = useState(false)

    useEffect(() => {
        const handleGetAssignment = () => {
            getAssignment(setLoading, setAllAsignment, setError)
            getClass(setLoading, setClassesList)
        }
        if (isAuth) {
            handleGetAssignment()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch teacher's competitions
    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const res = await getTeacherCompetitions();
                if (res.message === 'success') {
                    setMyCompetitions(res.competitions || []);
                }
            } catch (e) {
                console.error('Could not load competitions:', e);
            } finally {
                setCompLoading(false);
            }
        };
        if (isAuth) fetchCompetitions();
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreateCompetition = (newComp) => {
        // Called after CreateCompetitionModal successfully creates a competition
        // The modal navigates to the lobby itself, but we refresh the list
        setMyCompetitions(prev => [newComp, ...prev]);
    };

    const openStudentListPopup = (assignmentID) => {
        const findAssignment = allAsignment.filter(e => e._id === assignmentID)[0]
        setStudentList(findAssignment.students)
        setAssignmentID(assignmentID)
        document.querySelector('.student-list-popup').classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            document.querySelector('.student-list-popup').classList.remove('class-popup-hide')
            document.querySelector('.student-list-container').classList.remove('class-top')
        }, 50);
    }

    const closeStudentListPopup = () => {
        document.querySelector('.student-list-popup').classList.add('class-popup-hide')
        document.querySelector('.student-list-container').classList.add('class-top')
        setTimeout(() => {
            document.querySelector('.student-list-popup').classList.replace('d-flex', 'd-none')
        }, 300);
    }

    // NEW: Open re-assign popup instead of edit popup
    const openReassignPopup = (questionList, assignmentID) => {
        setAssignmentID(assignmentID)
        setQuestionList(questionList)
        const findAssignment = allAsignment.filter(e => e._id === assignmentID)[0]
        
        // Pre-fill with similar data, but allow teacher to modify
        // Don't set dates - force teacher to set new dates
        setStartDate('')
        setExpiryData('')
        
        // Pre-fill timer from original
        if (findAssignment.timer)
            setTimer(findAssignment.timer)
        else
            setTimer('')
            
        // Suggest a new title based on original
        setTitle(findAssignment.title + ' (Copy)')
        
        // Pre-fill flash mode from original
        if (findAssignment.forceFlashMode)
            setForceFlashMode(findAssignment.forceFlashMode)
        else
            setForceFlashMode(false)
        if (findAssignment.flashSpeed)
            setAssignmentFlashSpeed(findAssignment.flashSpeed)
        else
            setAssignmentFlashSpeed(1.0)
            
        setClassesBox(findAssignment.classes)
        
        document.querySelector('.reassign-popup').classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            document.querySelector('.reassign-popup').classList.remove('class-popup-hide')
            document.querySelector('.reassign-container').classList.remove('class-top')
        }, 50);
    }

    const closeReassignPopup = () => {
        setError(null)
        setQuestionList([])
        setStartDate('')
        setExpiryData('')
        setTimer('')
        setTitle('')
        setForceFlashMode(false)
        setAssignmentFlashSpeed(1.0)
        setClassesBox([])
        document.querySelector('.reassign-popup').classList.add('class-popup-hide')
        document.querySelector('.reassign-container').classList.add('class-top')
        setTimeout(() => {
            document.querySelector('.reassign-popup').classList.replace('d-flex', 'd-none')
        }, 300);
    }

    const removeFromPocket = (questionID) => {
        const newPocket = questionList.filter(e => e._id !== questionID)
        setQuestionList(newPocket)
        const lastNumber = pocketNumber - 1
        setPocketNumber(lastNumber)
    }

    const removeClassFromBox = (thisClass) => {
        const newArray = classesBox.filter(e => e.class !== thisClass)
        setClassesBox(newArray)
    }

    // NEW: Handle re-assigning (duplicating) an assignment
    const handleReassignAssignment = () => {
        if (classesBox.length === 0 || title === '') {
            setErrorOperation('You must select class first and write the title!!')

        } else {
            const questionPocket = []
            const classPocket = []
            let totalPoints = 0
            for (let index = 0; index < questionList.length; index++) {
                const element = questionList[index];
                questionPocket.push(element._id)
                totalPoints += element.questionPoints
            }
            for (let index = 0; index < classesBox.length; index++) {
                const element = classesBox[index];
                classPocket.push(element._id)
            }
            const data = { 
                questions: questionPocket, 
                totalPoints, 
                timer: timer === '' ? undefined : timer, 
                attemptsNumber: 1, 
                classes: classPocket, 
                title,
                forceFlashMode: forceFlashMode,
                flashSpeed: forceFlashMode ? assignmentFlashSpeed : undefined
            }
            duplicateAssignment(data, setError, assignmentID, setAllAsignment, setLoadingOperation, setPocketNumber, setQuestionList, closeReassignPopup, setTimer, setTitle, setForceFlashMode, setAssignmentFlashSpeed)
        }
    }

    const addClassToBox = () => {
        if (classSelector === '' || classSelector === 'Select Class' || classSelector === 'There is no classes for this teacher') {
            setError('You must select class first')
        } else {
            setError(null)
            if (classSelector === 'All Classes') {
                setClassesBox(classesList)
            } else {
                const findClass = classesBox.filter(e => e.class === classSelector)[0]
                if (findClass) {
                    setError('This class is already added')
                } else {
                    const getClass = classesList.filter(e => e.class === classSelector)[0]
                    setClassesBox(classesBox => [...classesBox, getClass]);
                }
            }
        }
    }

    // remove assignment func start
    const openRemovePopup = (assignmentID) => {
        setAssignmentID(assignmentID)
        setError(null)
        document.querySelector('.remove-class-popup').classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            document.querySelector('.remove-class-popup').classList.remove('class-popup-hide')
            document.querySelector('.remove-class-container').classList.remove('class-top')
        }, 50);
    }

    const closeRemovePopup = () => {
        document.querySelector('.remove-class-popup').classList.add('class-popup-hide')
        document.querySelector('.remove-class-container').classList.add('class-top')
        setTimeout(() => {
            document.querySelector('.remove-class-popup').classList.replace('d-flex', 'd-none')
        }, 300);
    }

    const handleRemoveAssignment = () => {
        removeAssignment(assignmentID, setError, setLoadingOperation, closeRemovePopup, setAllAsignment)
    }
    // remove assignment func end

    const schoolName = localStorage.getItem('school_name') || '';
    const userName = localStorage.getItem('pp_name') || '';
    const userRole = localStorage.getItem('auth_role') || '';
    
    const handleTipStudent = async (studentId, studentName) => {
        const amount = window.prompt(`How many coins do you want to gift to ${studentName}?`);
        if (!amount || isNaN(amount) || amount <= 0) return;
        
        const confirmTip = window.confirm(`Are you sure you want to send ${amount} coins to ${studentName}? This will be deducted from your balance.`);
        if (!confirmTip) return;

        setLoadingOperation(true);
        const res = await tipStudent(studentId, parseInt(amount));
        setLoadingOperation(false);

        if (res.message === 'success') {
            window.alert(`Successfully gifted ${amount} coins to ${studentName}! Your new balance is ${res.coins} coins.`);
        } else {
            window.alert(`Failed to tip: ${res.message}`);
        }
    }
    
    const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || 
                        (userRole === 'School' && userName.toLowerCase() === 'topsoroban');

    return (
        <div className={isTopsoroban ? 'topsoroban-theme-global' : ''}>
            {isTrialMode && <TrialBanner />}
            <MobileNav role="Teacher" />
            <Navbar />

            <div className="teacher-dashboard-container">
                {loading ? <DashboardLoading /> : (error) ? <div className='d-flex justify-content-center'><div className="error">{error}</div> </div> : allAsignment?.map(item => {
                    return (
                        <div key={item._id} className="assignment-teacher-item d-flex justify-content-space-between align-items-center">
                            <div className="assignment-info">
                                <p className="assignment-title">{item.title}</p>
                                <div className="assignment-details">
                                    <span>Points: {item.totalPoints}</span>
                                    <span>Students: {item.students?.length || 0}</span>
                                    <span>Questions: {item.questions?.length || 0}</span>
                                </div>
                            </div>
                            <div className="assignment-icon d-flex align-items-center">
                                {/* Sleek textual Reports Hub button */}
                                <Link 
                                    to={`/assignment/${item._id}/reports`} 
                                    className="reports-hub-btn d-flex align-items-center"
                                    title="Homework Reports Hub (Detailed, Combined & Historical)"
                                    onClick={() => soundEffects.playClick()}
                                >
                                    <i className="fa fa-bar-chart" aria-hidden="true" style={{marginRight: '6px'}}></i> Reports
                                </Link>

                                <i onClick={() => openReassignPopup(item.questions, item._id)} className="fa fa-copy" aria-hidden="true" title="Re-assign Assignment (Create New Copy)"></i>
                                <i onClick={() => openRemovePopup(item._id)} className="fa fa-trash" aria-hidden="true" title="Delete Assignment"></i>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ========== LIVE COMPETITION PANEL ========== */}
            <div className="competition-dashboard-panel">
                <div className="comp-panel-header">
                    <div className="comp-panel-title">
                        <Swords size={22} className="comp-sword-icon" />
                        <h2>Create a competition</h2>
                    </div>
                    <button
                        id="create-competition-btn"
                        className="comp-create-btn"
                        onClick={() => { soundEffects.playClick(); setShowCreateComp(true); }}
                    >
                        ⚔️ Create a competition
                    </button>
                </div>

                {/* My Competitions List */}
                <div className="comp-list-wrapper">
                    <h3 className="comp-list-title">Your Past Competitions</h3>
                    {compLoading ? (
                        <div className="comp-loading-msg">Loading competitions...</div>
                    ) : myCompetitions.length === 0 ? (
                        <div className="comp-empty-state">
                            <Trophy size={40} className="comp-empty-icon" />
                            <p>No competitions yet. Create your first one above!</p>
                        </div>
                    ) : (
                        <div className="comp-items-grid">
                            {myCompetitions.map(comp => (
                                <Link
                                    key={comp._id}
                                    to={`/teacher/competition/${comp._id}`}
                                    className={`comp-item-card status-${comp.status}`}
                                    onClick={soundEffects.playClick}
                                >
                                    <div className="comp-item-info">
                                        <span className={`comp-status-dot dot-${comp.status}`}></span>
                                        <div>
                                            <h4 className="comp-item-title">{comp.title}</h4>
                                            <p className="comp-item-meta">
                                                {comp.participants?.length || 0} players • {comp.timer / 60} min
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="comp-arrow" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* ========== LIVE COMPETITION PANEL END ========== */}

            {/* Create Competition Modal */}
            {showCreateComp && (
                <CreateCompetitionModal
                    onClose={() => setShowCreateComp(false)}
                />
            )}

            {/*student list popup start */}
            <div className="add-to-class-popup student-list-popup class-popup-hide d-none justify-content-center align-items-center">
                <div className='add-to-class-container student-list-container class-top'>
                    <div className="update-popup-head">
                        <p>Students List</p>
                    </div>
                    <div className="add-to-popup-body">
                        {studentList?.length === 0 ? <p>Oops!!No student has passed this exam.</p> :
                            studentList?.map(item => {
                                return (
                                    <div key={item.solveBy._id} className="student-item-wrapper">
                                        <Link to={`/teacher/assignmentReport/${item.solveBy._id}/${assignmentID}`} className="student-item-link">
                                            <div className="student-item">
                                                <p>{item.solveBy.userName}</p>
                                            </div>
                                        </Link>
                                        <Link 
                                            to={`/teacher/student/${item.solveBy._id}/history`} 
                                            className="student-history-icon"
                                            title="View Full Assignment History"
                                        >
                                            <History size={20} />
                                        </Link>
                                        <div 
                                            className="student-tip-icon" 
                                            title={`Gift Coins to ${item.solveBy.userName}`}
                                            onClick={() => handleTipStudent(item.solveBy._id, item.solveBy.userName)}
                                            style={{ cursor: 'pointer', marginLeft: '10px', fontSize: '20px' }}
                                        >
                                            🪙
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                    <div className="update-popup-footer">
                        <button className='button popup-btn' onClick={closeStudentListPopup}>Close</button>
                    </div>
                </div>
            </div>
            {/*student list popup end */}

            {/* remove Assignment popup start */}
            <div className="remove-class-popup class-popup-hide d-none justify-content-center align-items-center">
                <div className='remove-class-container class-top'>
                    <div className="update-popup-head">
                        <p>Remove Assignment</p>
                    </div>
                    {error ? <div className="error error-dengare">{error}</div> : null}
                    <div className="remove-popup-body">
                        <p>Are you sure you want to delete this Assignment?</p>
                    </div>
                    <div className="update-popup-footer">
                        <button className='button popup-btn' onClick={closeRemovePopup}>No</button>
                        <button onClick={handleRemoveAssignment} className='button popup-btn2'>{loadingOperation ? <span className="loader"></span> : "Yes"}</button>
                    </div>
                </div>
            </div>
            {/* remove Assignment popup end */}

            {/* Re-assign Assignment popup start */}
            <div className="add-to-class-popup teacher-list-popup reassign-popup class-popup-hide d-none justify-content-center align-items-center">
                <div className='reassign-container teacher-list-container class-top'>
                    <div className="update-popup-head d-flex align-items-center justify-content-space-between">
                        <div>
                            <p>Re-assign Assignment (Create New Copy)</p>
                            <p style={{fontSize: '14px', color: '#666', marginTop: '5px'}}>This will create a NEW assignment with the same questions</p>
                        </div>
                        <div className='d-flex align-items-center' style={{gap: '10px'}}>
                            <div 
                                title={forceFlashMode ? 'Flash Mode Forced for Students' : 'Flash Mode Optional for Students'} 
                                className={`force-flash-toggle ${forceFlashMode ? 'force-flash-active' : ''}`}
                                onClick={() => { soundEffects.playClick(); setForceFlashMode(!forceFlashMode); }}
                                style={{
                                    cursor: 'pointer',
                                    padding: '8px 12px',
                                    backgroundColor: forceFlashMode ? '#4CAF50' : '#FF9800',
                                    borderRadius: '8px',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: forceFlashMode ? '0 0 10px rgba(76, 175, 80, 0.5)' : 'none'
                                }}
                            >
                                <i className="fa fa-bolt" aria-hidden="true" style={{color: '#ffffff', fontSize: '16px'}}></i>
                                <span style={{color: '#ffffff', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap'}}>
                                    {forceFlashMode ? 'Flash Forced' : 'Flash Optional'}
                                </span>
                            </div>
                            {forceFlashMode && (
                                <div className='flash-speed-selector' style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <label style={{fontSize: '13px', color: '#666', whiteSpace: 'nowrap'}}>Flash Speed:</label>
                                    <select 
                                        value={assignmentFlashSpeed} 
                                        onChange={(e) => { soundEffects.playClick(); setAssignmentFlashSpeed(parseFloat(e.target.value)); }}
                                        style={{padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px'}}
                                    >
                                        <option value="0.5">0.5s</option>
                                        <option value="1.0">1.0s</option>
                                        <option value="1.5">1.5s</option>
                                        <option value="2.0">2.0s</option>
                                        <option value="2.5">2.5s</option>
                                        <option value="3.0">3.0s</option>
                                    </select>
                                </div>
                            )}
                            <X 
                                onClick={() => { soundEffects.playClick(); closeReassignPopup(); }} 
                                style={{cursor: 'pointer', color: '#666'}} 
                                size={24}
                            />
                        </div>
                    </div>
                    <div className="add-to-popup-body">
                        {questionList.map(item => {
                            return (
                                <div key={item._id} className="question-form-body form-body-list">
                                    {item?.questionPic ? <div className='d-flex question-img justify-content-center align-items-center'>
                                        <img src={item?.questionPic} alt="" />
                                    </div> : null}
                                    <pre>{item?.question}</pre>
                                    <div onClick={() => removeFromPocket(item._id)} className="remove-question">
                                        <i className="fa fa-trash" aria-hidden="true"></i>
                                    </div>
                                </div>
                            )
                        })}
                        <div className='assignment-title'>
                            <p>Title:</p>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Enter the title of assignment (required)' />
                        </div>
                        <div className="timer d-flex align-items-center">
                            <div style={{width: '100%'}}>
                                <p>Timer: (Minutes)</p>
                                <input type="number" value={timer} onChange={(e) => setTimer(e.target.value)} placeholder='Assignment time in minute, if available' />
                            </div>
                        </div>



                        {isTrialMode ? (
                            <UpgradePrompt 
                                message="Upgrade to create classes and assign homework to real students"
                                ctaText="Upgrade to Get Classes"
                            />
                        ) : (
                            <>
                                <div className="select-container d-flex">
                                    <div className="select-class">
                                        <select value={classSelector} onChange={(e) => setClassSelector(e.target.value)}>
                                            <option>Select Class</option>
                                            {classesList?.length === 0 ? <option>There is no classes for this teacher</option> : <option>All Classes</option>}
                                            {classesList?.map(item => {
                                                return (
                                                    <option key={item._id}>{item.class}</option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                    <button onClick={addClassToBox}>Add</button>
                                </div>
                                <div className='class-selector-container d-flex flex-wrap align-items-center'>
                                    {classesBox?.map(item => {
                                        return (
                                            <div key={item._id} className="class-selector">
                                                <p>{item.class}</p>
                                                <div onClick={() => removeClassFromBox(item.class)}>
                                                    <p>x</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                        {errorOperation ? <div className="error error-dengare">{errorOperation}</div> : null}
                    </div>
                    <div className="update-popup-footer">
                        <button className='button popup-btn' onClick={closeReassignPopup}>Cancel</button>
                        <button className='button popup-btn2' onClick={handleReassignAssignment}>{loadingOperation ? <span className="loader"></span> : "Create New Assignment"}</button>
                    </div>
                </div>
            </div>
            {/* Re-assign Assignment popup end */}
        </div>
    )
}

export default TeacherDashboard