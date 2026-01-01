import React, { useState, useEffect } from 'react'
import Navbar from '../../components/navbar/Navbar'
import { Link } from 'react-router-dom'
import getClass from '../../api/student/getClass.api'
import DashboardLoading from '../../components/dashboardLoading/DashboardLoading'
import book from '../../img/book.png'
import AssignmentLoading from '../../components/assignmentLoading/AssignmentLoading'
import getAssignment from '../../api/student/getAssignment.api'
import '../../reusable.css'
import './StudentDashboard.css'

function StudentDashboard() {
    const [teacherList, setTeacherList] = useState([])
    const [allAsignment, setAllAsignment] = useState([])
    const [className, setClassName] = useState('')
    const [loading, setLoading] = useState(true)
    const [loadingOperation, setLoadingOperation] = useState(false)
    const [error, setError] = useState(null)
    const isAuth = localStorage.getItem('O_authWEB')

    useEffect(() => {
        const handleGetClass = () => {
            getClass(setLoading, setClassName, setTeacherList)
        }
        if (isAuth) {
            handleGetClass()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const getAllAssignment = (teacherID) => {
        getAssignment(setLoadingOperation, setAllAsignment, setError, teacherID)
    }

    const openHomeWorkList = (teacherID) => {
        getAllAssignment(teacherID)
        document.querySelector('.assignment-popup').classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            document.querySelector('.assignment-popup').classList.remove('class-popup-hide')
            document.querySelector('.assignment-popup-container').classList.remove('popup-top')
        }, 50);
    }

    const closeHomeWorkList = () => {
        setError(null)
        document.querySelector('.assignment-popup').classList.add('class-popup-hide')
        document.querySelector('.assignment-popup-container').classList.add('popup-top')
        setTimeout(() => {
            document.querySelector('.assignment-popup').classList.replace('d-flex', 'd-none')
        }, 300);
    }

    return (
        <>
            <nav>
                <div className='nav-mobile'>
                    <div className='nav-mobile-container d-flex justify-content-space-around align-items-center'>
                        <Link to={'/'}><i className="fa fa-home" aria-hidden="true"></i></Link>
                        <Link to={'/system/65a4963482dbaac16d820fc6'}><i className="fa fa-tasks link" aria-hidden="true"></i></Link>
                        <Link to={'/system/65a4964b82dbaac16d820fc8'}><i className="fa fa-file-text-o link" aria-hidden="true"></i></Link>
                        <Link to={'/dashboard/student'}><i className="fa fa-graduation-cap active" aria-hidden="true"></i></Link>
                        <Link to={'/contact'}><i className="fa fa-headphones link" aria-hidden="true"></i></Link>
                        <Link to={'/user/info'}><i className="fa fa-user link" aria-hidden="true"></i></Link>
                    </div>
                </div>
            </nav>
            <Navbar />
            <div className="student-dashboard-container">
                {loading ? <DashboardLoading /> : className === '' ? <p className='text-red text-center'>You are not placed in any class yet</p> :
                    <div className="student-dashboard-body">
                        <p>{className}</p>
                        {teacherList?.map(item => {
                            return (
                                <div key={item._id} onClick={() => openHomeWorkList(item._id)} className="teacher-item">
                                    <p>{item.userName} ({item?.subject?.schoolSubjectName})</p>
                                </div>
                            )
                        })}
                    </div>
                }
            </div>

            {/* assignment popup start */}
            <div className="assignment-popup class-popup-hide d-none justify-content-center align-items-center">
                <div className='assignment-popup-container popup-top'>
                    <div className="update-popup-head">
                        <p>HomeWork</p>
                        <button onClick={closeHomeWorkList} className="popup-close-btn" aria-label="Close">
                            <i className="fa fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                        {loadingOperation ? <AssignmentLoading /> :
                            allAsignment?.map(item => {
                                return (
                                    <div key={item._id} className="popup-body assignment-popup-body">
                                        <div className="assignment-item d-flex align-items-center justify-content-space-between">
                                            <div className="assignment-content">
                                                <h2>{item.title}</h2>
                                                <div className='d-flex align-items-center assignment-body-container'>
                                                    <div className='assignment-body d-flex align-items-center'>
                                                        <i className="fa fa-clock-o" aria-hidden="true"></i>
                                                        <p>{item?.timer ? `${item.timer} Minuts` : 'Open'}</p>
                                                    </div>
                                                    <div className='assignment-body d-flex align-items-center'>
                                                        <i className="fa fa-recycle" aria-hidden="true"></i>
                                                        <p>{item?.attemptsNumber} Attempts</p>
                                                    </div>
                                                </div>
                                                <div className="assignment-text">
                                                    <pre>{`◉ This exam was suspended
for a period of time and number of attempts
when you start it, the timer starts counting ${item?.timer ? `(${item.timer} Minuts)` : '(Open)'}
and you have (${item?.attemptsNumber} Attempts) to finshing exam.`}
                                                    </pre>
                                                </div>
                                            </div>
                                            <div className="assignment-poster">
                                                <img src={book} alt="" />
                                            </div>
                                        </div>
                                        <div className="assignment-footer d-flex flex-wrap align-items-center justify-content-space-between">
                                            <div className="text-footer">
                                                {item?.startDate ? <p>Start Date: {item?.startDate}</p> : null}
                                                {item?.endDate ? <p>Expiry Date: {item?.endDate}</p> : null}
                                            </div>
                                            <Link to={`/student/assignment/${item._id}`}><button>Go To Assignment →</button></Link>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    {error ? <p className='text-center'>{error}</p> : null}
                    <button className='button popup-btn' onClick={closeHomeWorkList}>Close</button>
                </div>
            </div>
            {/* assignment popup end */}
        </>
    )
}

export default StudentDashboard