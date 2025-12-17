import React from 'react'
import Navbar from '../../components/navbar/Navbar'
import { Link } from 'react-router-dom'
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
            <nav>
                <div className='nav-mobile'>
                    <div className='nav-mobile-container d-flex justify-content-space-around align-items-center'>
                        <Link to={'/'}><i className="fa fa-home" aria-hidden="true"></i></Link>
                        <Link to={'/system/65a4963482dbaac16d820fc6'}><i className="fa fa-tasks link" aria-hidden="true"></i></Link>
                        <Link to={'/system/65a4964b82dbaac16d820fc8'}><i className="fa fa-file-text-o link" aria-hidden="true"></i></Link>
                        <Link to={'/dashboard-school'}><i className="fa fa-graduation-cap active" aria-hidden="true"></i></Link>
                        <Link to={'/contact'}><i className="fa fa-headphones link" aria-hidden="true"></i></Link>
                        <Link to={'/user/info'}><i className="fa fa-user link" aria-hidden="true"></i></Link>
                    </div>
                </div>
            </nav>
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
                    </div>
                </div>
            </div>
        </>
    )
}

export default DashboardSchool