import React, { useState, useEffect } from 'react'
import Navbar from '../../components/navbar/Navbar'
import TrialBanner from '../../components/trialBanner/TrialBanner';
import { Link } from 'react-router-dom'
import MathInput from "react-math-keyboard";
import getAssignment from '../../api/teacher/getAssignment.api'
import getClass from '../../api/teacher/getClass.api';
import updateAssignment from '../../api/assignment/updateAssignment.api';
import removeAssignment from '../../api/assignment/removeAssignment.api';
import DashboardLoading from '../../components/dashboardLoading/DashboardLoading'
import '../../reusable.css'
import './TeacherDashboard.css'

function TeacherDashboard() {
    const [studentList, setStudentList] = useState([])
    const [allAsignment, setAllAsignment] = useState([])
    const [questionList, setQuestionList] = useState([])
    const [assignmentID, setAssignmentID] = useState('')
    let [pocketNumber, setPocketNumber] = useState(0)
    let [timer, setTimer] = useState('')
    let [title, setTitle] = useState('')
    let [attempts, setAttempts] = useState('')
    let [startDate, setStartDate] = useState('')
    let [expiryData, setExpiryData] = useState('')
    let [classSelector, setClassSelector] = useState('')
    const [classesList, setClassesList] = useState([])
    const [classesBox, setClassesBox] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingOperation, setLoadingOperation] = useState(false)
    const [errorOperation, setErrorOperation] = useState(null)
    const [error, setError] = useState(null)
    const isAuth = localStorage.getItem('O_authWEB')
    const isTrialMode = localStorage.getItem('isTrialMode') === 'true'

    useEffect(() => {
        const handleGetAssignment = () => {
            getAssignment(setLoading, setAllAsignment, setError)
            getClass(setLoading, setClassesList)
        }
        if (isAuth) {
            handleGetAssignment()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

    const openQuestionList = (questionList, assignmentID) => {
        setAssignmentID(assignmentID)
        setQuestionList(questionList)
        const findAssignment = allAsignment.filter(e => e._id === assignmentID)[0]
        if (findAssignment.startDate)
            setStartDate(findAssignment.startDate)
        if (findAssignment.endDate)
            setExpiryData(findAssignment.endDate)
        if (findAssignment.timer)
            setTimer(findAssignment.timer)
        setTitle(findAssignment.title)
        setAttempts(findAssignment.attemptsNumber)
        setClassesBox(findAssignment.classes)
        document.querySelector('.question-list-popup').classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            document.querySelector('.question-list-popup').classList.remove('class-popup-hide')
            document.querySelector('.question-list-container').classList.remove('class-top')
        }, 50);
    }

    const closeQuestionList = () => {
        setError(null)
        setQuestionList([])
        setStartDate('')
        setExpiryData('')
        setTimer(0)
        setTitle('')
        setAttempts(0)
        setClassesBox([])
        document.querySelector('.question-list-popup').classList.add('class-popup-hide')
        document.querySelector('.question-list-container').classList.add('class-top')
        setTimeout(() => {
            document.querySelector('.question-list-popup').classList.replace('d-flex', 'd-none')
        }, 300);
    }

    const removeFromPocket = (questionID) => {
        const newPocket = questionList.filter(e => e._id !== questionID)
        setQuestionList(newPocket)
        const lastNumber = pocketNumber - 1
        setPocketNumber(lastNumber)
        if (lastNumber === 0)
            closeQuestionList()
    }

    const removeClassFromBox = (thisClass) => {
        const newArray = classesBox.filter(e => e.class !== thisClass)
        setClassesBox(newArray)
    }

    const handleCreateAssignment = () => {
        if (classesBox.length === 0 || title === '') {
            setErrorOperation('You must select class first and writing the title!!')
        } else if (startDate === '' && expiryData !== '') {
            setErrorOperation('You must add the start date!!')
        } else if (startDate !== '' && expiryData === '') {
            setErrorOperation('You must add the expiry date!!')
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
            const data = { questions: questionPocket, totalPoints, timer: timer === '' ? undefined : timer, attemptsNumber: attempts === '' ? 1 : attempts, startDate: startDate === '' ? undefined : startDate, endDate: expiryData === '' ? undefined : expiryData, classes: classPocket, title }
            updateAssignment(data, setError, assignmentID, setAllAsignment, setLoadingOperation, setPocketNumber, setQuestionList, closeQuestionList, setTimer, setAttempts, setExpiryData, setStartDate)
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

    return (
        <>
            {isTrialMode && <TrialBanner />}
            <nav>
                <div className='nav-mobile'>
                    <div className='nav-mobile-container d-flex justify-content-space-around align-items-center'>
                        <Link to={'/'}><i className="fa fa-home" aria-hidden="true"></i></Link>
                        <Link to={'/system/65a4963482dbaac16d820fc6'}><i className="fa fa-tasks link" aria-hidden="true"></i></Link>
                        <Link to={'/system/65a4964b82dbaac16d820fc8'}><i className="fa fa-file-text-o link" aria-hidden="true"></i></Link>
                        <Link to={'/dashboard/teacher'}><i className="fa fa-graduation-cap active" aria-hidden="true"></i></Link>
                        <Link to={'/contact'}><i className="fa fa-headphones link" aria-hidden="true"></i></Link>
                        <Link to={'/user/info'}><i className="fa fa-user link" aria-hidden="true"></i></Link>
                    </div>
                </div>
            </nav>
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
                                <i onClick={() => openStudentListPopup(item._id)} className="fa fa-eye" aria-hidden="true" title="View Students"></i>
                                <i onClick={() => openQuestionList(item.questions, item._id)} className="fa fa-pencil" aria-hidden="true" title="Edit Assignment"></i>
                                
                                {/* ADDED: PDF Reports Button */}
                                <Link 
                                    to={`/assignment/${item._id}/reports`} 
                                    className="pdf-reports-btn"
                                    title="Student PDF Reports"
                                >
                                    <i className="fa fa-file-pdf-o" aria-hidden="true"></i>
                                </Link>
                                
                                <i onClick={() => openRemovePopup(item._id)} className="fa fa-trash" aria-hidden="true" title="Delete Assignment"></i>
                            </div>
                        </div>
                    )
                })}
            </div>

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
                                    <Link to={`/teacher/assignmentReport/${item.solveBy._id}/${assignmentID}`} key={item.solveBy._id} >
                                        <div className="student-item">
                                            <p>{item.solveBy.userName}</p>
                                        </div>
                                    </Link>
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

            {/*question list popup start */}
            <div className="add-to-class-popup teacher-list-popup question-list-popup class-popup-hide d-none justify-content-center align-items-center">
                <div className='question-list-container teacher-list-container class-top'>
                    <div className="update-popup-head">
                        <p>Update Assignment</p>
                    </div>
                    <div className="add-to-popup-body">
                        {questionList.map(item => {
                            return (
                                <div key={item._id} className="question-form-body form-body-list">
                                    {item?.questionPic ? <div className='d-flex question-img justify-content-center align-items-center'>
                                        <img src={item?.questionPic} alt="" />
                                    </div> : null}
                                    <pre>{item?.question}</pre>
                                    {item?.typeOfAnswer === 'Essay' ? <div className='math-keyboard'>
                                        <p>Write your answer here</p>
                                        <MathInput size="small" />
                                    </div> : null}
                                    {item?.typeOfAnswer === 'MCQ' ? item.wrongAnswer?.map(item => {
                                        return (
                                            <div key={item} className='d-flex mcq-answer align-items-center'>
                                                <input type="radio" id="berries_1" value={item} name="berries" />
                                                <div className="mcq-answer-layout">
                                                    <MathInput size="small" initialLatex={item} />
                                                    <div className="answer-layout"></div>
                                                </div>
                                            </div>
                                        )
                                    }) : null}
                                    {item?.typeOfAnswer === 'Graph' ? item.wrongPicAnswer?.map(item => {
                                        return (
                                            <div key={item} className='d-flex graph-answer'>
                                                <input type="radio" id="berries_1" value={item} name="berries" />
                                                <img src={item} alt="" />
                                            </div>
                                        )
                                    }) : null}
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
                            <div>
                                <p>Timer: (Minutes)</p>
                                <input type="number" value={timer} onChange={(e) => setTimer(e.target.value)} placeholder='Assignment time in minute, if available' />
                            </div>
                            <div>
                                <p>Attempts:</p>
                                <input type="number" value={attempts} onChange={(e) => setAttempts(e.target.value)} placeholder='Enter attempts number (the default is 1)' />
                            </div>
                        </div>

                        <div className="timer date-faild d-flex align-items-center">
                            <div>
                                <p>Start Date:</p>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <p>Expiry Date:</p>
                                <input type="date" value={expiryData} onChange={(e) => setExpiryData(e.target.value)} />
                            </div>
                        </div>

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
                        {errorOperation ? <div className="error error-dengare">{errorOperation}</div> : null}
                    </div>
                    <div className="update-popup-footer">
                        <button className='button popup-btn' onClick={closeQuestionList}>Close</button>
                        <button className='button popup-btn2' onClick={handleCreateAssignment}>{loadingOperation ? <span className="loader"></span> : "Update"}</button>
                    </div>
                </div>
            </div>
            {/*question list popup end */}
        </>
    )
}

export default TeacherDashboard