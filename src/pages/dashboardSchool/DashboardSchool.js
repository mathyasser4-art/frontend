import React from 'react'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import TeachersList from '../../components/teachersList/TeachersList'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import student from '../../img/student-bannar.png'
import teacher from '../../img/teacher-bannar.png'
import subject from '../../img/subject-bannar.PNG'
import sopreviser from '../../img/sopreviser-bannar.png'
import classes from '../../img/classes.png'
import IT from '../../img/it.png'
import '../../reusable.css'
import './DashboardSchool.css'

function DashboardSchool() {
    const role = localStorage.getItem('auth_role')
    const userName = localStorage.getItem('pp_name')
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
                    </div>
                </div>
                <TeachersList />
            </div>
        </>
    )
}

export default DashboardSchool
