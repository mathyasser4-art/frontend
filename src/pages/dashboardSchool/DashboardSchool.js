import React, { useState, useEffect } from 'react'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import TeachersList from '../../components/teachersList/TeachersList'
import { Link } from 'react-router-dom'
import { MessageCircle, AlertTriangle } from 'lucide-react'
import student from '../../img/student-bannar.png'
import teacher from '../../img/teacher-bannar.png'
import subject from '../../img/subject-bannar.PNG'
import sopreviser from '../../img/sopreviser-bannar.png'
import classes from '../../img/classes.png'
import IT from '../../img/it.png'
import API_BASE_URL from '../../config/api.config'
import '../../reusable.css'
import './DashboardSchool.css'

function DashboardSchool() {
    const role = localStorage.getItem('auth_role')
    const userName = localStorage.getItem('pp_name')
    const [reportCount, setReportCount] = useState(0)

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/question/reports`, {
                    headers: {
                        'authrization': `pracYas09${localStorage.getItem('O_authWEB')}`
                    }
                });
                const data = await response.json();
                if (data.message === 'success' && data.reports) {
                    setReportCount(data.reports.length);
                }
            } catch (err) {
                console.error('Failed to fetch question reports:', err);
            }
        };
        fetchReports();
    }, []);

    return (
        <>
            <MobileNav role={role} />
            <Navbar />
            <div className="dashboard-school">
                <div className="dashboard-school-header">
                    <p className='text-purple'>Welcome to</p>
                    <p>{userName} Dashboard</p>
                </div>
                <div className="dashboard-school-body">
                    <div className="fs-col d-flex justify-content-space-around align-items-center flex-wrap">
                        <Link to={'/dashboard-school/student'}><img src={student} alt="" /></Link>
                        <Link to={'/dashboard-school/teacher'}><img src={teacher} alt="" /></Link>
                        <Link to={'/dashboard-school/subject'}><img src={subject} alt="" /></Link>
                        <Link to={'/dashboard-school/supervisor'}><img src={sopreviser} alt="" /></Link>
                        <Link to={'/dashboard-school/class'}><img src={classes} alt="" /></Link>
                        {role === 'IT' ? <img src={IT} alt="" /> : <Link to={'/dashboard-school/it'}><img src={IT} alt="" /></Link>}
                        <Link to={'/dashboard-school/chats'} style={{ textDecoration: 'none' }}>
                            <div style={{
                                width: '250px', height: '120px', margin: '10px', 
                                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', 
                                borderRadius: '15px', display: 'flex', flexDirection: 'column', 
                                alignItems: 'center', justifyContent: 'center', color: 'white',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <MessageCircle size={40} />
                                <h3 style={{ margin: '10px 0 0 0', fontFamily: 'sans-serif' }}>Live Chats</h3>
                            </div>
                        </Link>
                        <Link to={'/dashboard-school/reported-questions'} style={{ textDecoration: 'none' }}>
                            <div style={{
                                width: '250px', height: '120px', margin: '10px', 
                                background: 'linear-gradient(135deg, #f59e0b, #ef4444)', 
                                borderRadius: '15px', display: 'flex', flexDirection: 'column', 
                                alignItems: 'center', justifyContent: 'center', color: 'white',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                position: 'relative'
                            }}>
                                <AlertTriangle size={40} />
                                <h3 style={{ margin: '10px 0 0 0', fontFamily: 'sans-serif' }}>Flagged Questions</h3>
                                {reportCount > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '-10px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                        border: '2px solid white'
                                    }}>
                                        {reportCount}
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>
                </div>
                <TeachersList />
            </div>
        </>
    )
}

export default DashboardSchool

