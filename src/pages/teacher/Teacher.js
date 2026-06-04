import React, { useState, useEffect } from 'react'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import student from '../../img/avatar-profile.png'
import addTeacher from '../../api/teacher/addTeacher.api'
import getTeacher from '../../api/teacher/getTeacher.api'
import getSubject from '../../api/subject/getSubject.api'
import updateTeacher from '../../api/teacher/updateTeacher.api'
import removeTeacher from '../../api/teacher/removeTeacher.api'
import searchTeacher from '../../api/teacher/searchTeacher.api'
import DashboardLoading from '../../components/dashboardLoading/DashboardLoading'
import '../../reusable.css'
import './Teacher.css'

function Teacher() {
    const [teacherName, setTeacherName] = useState('')
    const [teacherEmail, setTeacherEmail] = useState('')
    const [teacherPassword, setTeacherPassword] = useState('')
    const [subject, setSubject] = useState('')
    const [maxStudents, setMaxStudents] = useState('')
    const [searchValue, setSearchValue] = useState('')
    const [teacherID, setTeacherID] = useState('')
    const [allTeacher, setAllTeacher] = useState([])
    const [expandedTeacherId, setExpandedTeacherId] = useState(null)
    let [pageNumber, setPageNumber] = useState(1)
    const [totalPage, setTotalPage] = useState()
    const [teacherNumber, setTeacherNumber] = useState(0)
    const [allSubject, setAllSubject] = useState([])
    const [loadingOperation, setLoadingOperation] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [subjectLoading, setSubjectLoading] = useState(true)
    let number = 1
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')

    useEffect(() => {
        const getAllTeacher = () => {
            getTeacher(setLoading, setAllTeacher, pageNumber, setTeacherNumber, setTotalPage)
            getSubject(setSubjectLoading, setAllSubject)
        }
        if (isAuth) {
            getAllTeacher()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // add student func start
    const openAddPopup = () => {
        setTeacherName('')
        setTeacherEmail('')
        setTeacherPassword('')
        setError(null)
        setSubject('')
        setMaxStudents('')
        document.querySelector('.add-student-popup').classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            document.querySelector('.add-student-popup').classList.remove('student-popup-hide')
            document.querySelector('.add-student-container').classList.remove('update-top')
        }, 50);
    }

    const closeAddPopup = () => {
        document.querySelector('.add-student-popup').classList.add('student-popup-hide')
        document.querySelector('.add-student-container').classList.add('update-top')
        setTimeout(() => {
            document.querySelector('.add-student-popup').classList.replace('d-flex', 'd-none')
        }, 300);
    }

    const newTeacher = () => {
        if (teacherName === '' || teacherEmail === '' || teacherPassword === '' || subject === '' || subject === 'Select Subject') {
            setError('All field is required!!')
        } else {
            const subjectID = allSubject.filter(e => e.schoolSubjectName === subject)[0]._id
            const data = { 
                userName: teacherName, 
                email: teacherEmail, 
                password: teacherPassword, 
                subject: subjectID,
                maxStudents: maxStudents !== '' ? Number(maxStudents) : 0
            }
            addTeacher(data, setError, setLoadingOperation, closeAddPopup, pageNumber, setAllTeacher, setTeacherNumber, setTotalPage)
        }
    }
    // add student func start

    // update student func start
    const openUpdatePopup = (teacherID, teacherName, teacherEmail, subject, maxStudentsVal) => {
        setTeacherID(teacherID)
        setTeacherName(teacherName)
        setTeacherEmail(teacherEmail)
        setSubject(subject)
        setMaxStudents(maxStudentsVal !== undefined && maxStudentsVal !== null ? maxStudentsVal : '')
        setTeacherPassword('')
        setError(null)
        document.querySelector('.update-student-popup').classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            document.querySelector('.update-student-popup').classList.remove('student-popup-hide')
            document.querySelector('.update-student-container').classList.remove('update-top')
        }, 50);
    }

    const closeUpdatePopup = () => {
        document.querySelector('.update-student-popup').classList.add('student-popup-hide')
        document.querySelector('.update-student-container').classList.add('update-top')
        setTimeout(() => {
            document.querySelector('.update-student-popup').classList.replace('d-flex', 'd-none')
        }, 300);
    }

    const handleUpdateTeacher = () => {
        if (teacherName === '' || teacherEmail === '' || subject === '' || subject === 'Select Subject' || subject === undefined) {
            setError('All field is required!!')
        } else {
            const subjectID = allSubject.filter(e => e.schoolSubjectName === subject)[0]._id
            const data = { 
                userName: teacherName, 
                email: teacherEmail, 
                password: teacherPassword !== '' ? teacherPassword : undefined, 
                subject: subjectID,
                maxStudents: maxStudents !== '' ? Number(maxStudents) : 0
            }
            updateTeacher(data, setError, setLoadingOperation, closeUpdatePopup, pageNumber, setAllTeacher, setTeacherNumber, teacherID, setTotalPage)
        }
    }
    // update student func start

    // remove student func start
    const openRemovePopup = (teacherID) => {
        setTeacherID(teacherID)
        setError(null)
        document.querySelector('.remove-student-popup').classList.replace('d-none', 'd-flex')
        setTimeout(() => {
            document.querySelector('.remove-student-popup').classList.remove('student-popup-hide')
            document.querySelector('.remove-student-container').classList.remove('update-top')
        }, 50);
    }

    const closeRemovePopup = () => {
        document.querySelector('.remove-student-popup').classList.add('student-popup-hide')
        document.querySelector('.remove-student-container').classList.add('update-top')
        setTimeout(() => {
            document.querySelector('.remove-student-popup').classList.replace('d-flex', 'd-none')
        }, 300);
    }

    const handleRemoveTeacher = () => {
        removeTeacher(teacherID, setError, setLoadingOperation, closeRemovePopup, pageNumber, setAllTeacher, setTeacherNumber, setTotalPage)
    }
    // remove student func start

    const search = (searchKey) => {
        setSearchValue(searchKey)
        if (searchKey === '') {
            getTeacher(setLoading, setAllTeacher, pageNumber, setTeacherNumber, setTotalPage)
        } else {
            searchTeacher(setLoading, setAllTeacher, searchKey)
        }
    }


    const showPassword = () => {
        const inputPassword = document.querySelector('.input-password')
        if (inputPassword.type === 'password')
            inputPassword.type = 'text'
        else
            inputPassword.type = 'password'
    }

    const showUpdatePassword = () => {
        const inputPassword = document.querySelector('.input-password-update')
        if (inputPassword.type === 'password')
            inputPassword.type = 'text'
        else
            inputPassword.type = 'password'
    }

    const next = () => {
        if (pageNumber !== totalPage) {
            const lastPage = pageNumber + 1
            setPageNumber(lastPage)
            getTeacher(setLoading, setAllTeacher, pageNumber, setTeacherNumber, setTotalPage)
        }
    }

    const previous = () => {
        if (pageNumber !== 1) {
            const lastPage = pageNumber - 1
            setPageNumber(lastPage)
            getTeacher(setLoading, setAllTeacher, pageNumber, setTeacherNumber, setTotalPage)
        }
    }

    const toggleExpandTeacher = (teacherID) => {
        setExpandedTeacherId(prev => prev === teacherID ? null : teacherID)
    }
    return (
        <>
            <MobileNav role={role} />
            <Navbar />
            <div className="teacher-container">
                <div className="teacher-header d-flex align-items-center">
                    <input type="text" onChange={(e) => search(e.target.value)} placeholder='Enter teacher name...' />
                    <div className='add-squer d-flex justify-content-space-around align-items-center' onClick={openAddPopup}><p>+</p></div>
                </div>
                <div className="teacher-body">
                    {loading ? <DashboardLoading /> : <table>
                        <tbody className='teacher-header-body'>
                            <tr>
                                <td className='text-purple'>{teacherNumber}</td>
                                <td>Name ⌄</td>
                                <td>Email ⌄</td>
                                <td>Subject ⌄</td>
                                <td>Student Limit ⌄</td>
                                <td>Classes ⌄</td>
                                <td>Action ⌄</td>
                            </tr>
                        </tbody>
                        {allTeacher?.map(item => {
                            return (
                                <React.Fragment key={item._id}>
                                    <tbody className={`teacher-row ${expandedTeacherId === item._id ? 'expanded' : ''}`}>
                                        <tr onClick={() => toggleExpandTeacher(item._id)} style={{ cursor: 'pointer' }}>
                                            <td>{number++}</td>
                                            <td className='d-flex teacher-name align-items-center'>
                                                <img src={student} alt="" />
                                                <p>{item.userName}</p>
                                            </td>
                                            <td>{item.email}</td>
                                            <td>{item?.subject?.schoolSubjectName}</td>
                                            <td>{item.maxStudents || 0}</td>
                                            <td>
                                                <div className="d-flex align-items-center" style={{ color: '#5d17eb' }}>
                                                    {expandedTeacherId === item._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </td>
                                            <td className="teacher-action" onClick={(e) => e.stopPropagation()}>
                                                <i className="fa fa-pencil" onClick={() => openUpdatePopup(item._id, item.userName, item.email, item?.subject?.schoolSubjectName, item.maxStudents)} aria-hidden="true"></i>
                                                <i className="fa fa-trash" onClick={() => openRemovePopup(item._id)} aria-hidden="true"></i>
                                            </td>
                                        </tr>
                                        {expandedTeacherId === item._id && (
                                            <tr className="expanded-content-row">
                                                <td colSpan="7">
                                                    <div className="teacher-classes-container">
                                                        <h4 className="classes-title">Assigned Classes</h4>
                                                        {item.classList && item.classList.length > 0 ? (
                                                            <div className="classes-grid">
                                                                {item.classList.map((cls, idx) => (
                                                                    <Link to={`/dashboard-school/class/${cls._id}/homework`} key={idx} className="class-pill" style={{ textDecoration: 'none' }}>
                                                                        <span className="class-icon">🏫</span>
                                                                        <span className="class-name">{cls.class}</span>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="no-classes-msg">
                                                                <p>Oops! This teacher hasn't been assigned to any classes yet.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody><br />
                                </React.Fragment>
                            )
                        })}
                    </table>}
                </div>
                {loading ? null : (searchValue !== '') ? null : (allTeacher.length === 0) ? (pageNumber === 1) ? null : <div className="teacher-footer d-flex align-items-center">
                    <button onClick={previous}>Previous</button>
                    <button onClick={next}>Next</button>
                </div> : <div className="teacher-footer d-flex align-items-center">
                    <button onClick={previous}>Previous</button>
                    <button onClick={next}>Next</button>
                </div>}
            </div>

            {/* add student popup start */}
            <div className="add-student-popup student-popup-hide d-none justify-content-center align-items-center">
                <div className='add-student-container update-top'>
                    <div className="add-popup-head">
                        <p>Add New Teacher</p>
                    </div>
                    {error ? <div className="error error-dengare">{error}</div> : null}
                    <div className="add-popup-body">
                        <label>Teacher Name</label>
                        <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder='MR Yasser Ahmed' />
                        <label>Teacher Email</label>
                        <input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} placeholder='yasserahmed@teacher.com' />
                        <label>Teacher Password</label>
                        <input className='input-password' value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} type="password" placeholder='Yass1803cz@vv' />
                        <div className="show-password d-flex align-items-center">
                            <input type="checkbox" onClick={showPassword} />
                            <p>Show Password</p>
                        </div>
                        <label>Student Limit</label>
                        <input type="number" value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} placeholder='e.g. 50' min="0" />
                        <div className="add-popup-select-class">
                            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                                <option>Select Subject</option>
                                {subjectLoading ? <option>Waiting Subjects...</option> : null}
                                {allSubject?.map(item => {
                                    return (
                                        <option key={item._id}>{item.schoolSubjectName}</option>
                                    )
                                })}
                            </select>
                        </div>
                    </div>
                    <div className="update-popup-footer">
                        <button className='button popup-btn' onClick={closeAddPopup}>Cancel</button>
                        <button className='button popup-btn2' onClick={newTeacher}>{loadingOperation ? <span className="loader"></span> : "Add"}</button>
                    </div>
                </div>
            </div>
            {/* add student popup end */}

            {/* update student popup start */}
            <div className="update-student-popup student-popup-hide d-none justify-content-center align-items-center">
                <div className='update-student-container update-top'>
                    <div className="update-popup-head">
                        <p>Update Teacher</p>
                    </div>
                    {error ? <div className="error error-dengare">{error}</div> : null}
                    <div className="update-popup-body">
                        <label>Teacher Name</label>
                        <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} type="text" placeholder='MR Yasser Ahmed' />
                        <label>Teacher Email</label>
                        <input value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} type="email" placeholder='yasserahmed@teacher.com' />
                        <label>Teacher Password</label>
                        <input value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} className='input-password input-password-update' type="password" placeholder='●●●●●●●●●●●●●●●●●●●●●●●' />
                        <div className="show-password d-flex align-items-center">
                            <input type="checkbox" onClick={showUpdatePassword} />
                            <p>Show Password</p>
                        </div>
                        <label>Student Limit</label>
                        <input type="number" value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} placeholder='e.g. 50' min="0" />
                        <div className="update-popup-select-class">
                            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                                {subject ? <option>{subject}</option> : <option>Select Subject</option>}
                                {allSubject?.map(item => {
                                    return (
                                        <option key={item._id}>{item.schoolSubjectName}</option>
                                    )
                                })}
                            </select>
                        </div>
                    </div>
                    <div className="update-popup-footer">
                        <button className='button popup-btn' onClick={closeUpdatePopup}>Cancel</button>
                        <button className='button popup-btn2' onClick={handleUpdateTeacher}>{loadingOperation ? <span className="loader"></span> : "Update"}</button>
                    </div>
                </div>
            </div>
            {/* update student popup end */}

            {/* remove student popup start */}
            <div className="remove-student-popup student-popup-hide d-none justify-content-center align-items-center">
                <div className='remove-student-container update-top'>
                    <div className="update-popup-head">
                        <p>Remove Teacher</p>
                    </div>
                    {error ? <div className="error error-dengare">{error}</div> : null}
                    <div className="remove-popup-body">
                        <h3 className='text-red'>WARNING!!</h3>
                        <p>If you remove this teacher, all his assignment will be deleted also.</p>
                    </div>
                    <div className="update-popup-footer">
                        <button className='button popup-btn' onClick={closeRemovePopup}>Cancel</button>
                        <button className='button popup-btn2' onClick={handleRemoveTeacher}>{loadingOperation ? <span className="loader"></span> : "Delete"}</button>
                    </div>
                </div>
            </div>
            {/* remove student popup end */}


        </>
    )
}

export default Teacher