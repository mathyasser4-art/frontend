import React, { useEffect, useState } from 'react'
import Navbar from '../../components/navbar/Navbar'
import { Link, useParams } from 'react-router-dom';
import SystemLoading from '../../components/systemLoding/SystemLoading';
import NotLogin from '../../components/notLogin/NotLogin';
import getSystem from '../../api/system/getSystem.api';
import '../../reusable.css'
import './System.css'

function System() {
    const [systemData, setSystemData] = useState()
    const [loading, setLoading] = useState(true)
    const { questionTypeID } = useParams()
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')

    useEffect(() => {
        const getAllSystem = async () => {
            await getSystem(setLoading, setSystemData)
        }
        if (isAuth) {
            getAllSystem()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const dropdownToggle = (e) => {
        let top = 50
        if (e.target.classList.contains('opened')) {
            const links = e.target.children
            for (let i = 0; i < links.length; i++) {
                links[i].style.top = '50px';
                links[i].classList.remove('dwon')
            }
            e.target.style.height = '50px'
            e.target.classList.remove('opened')
        } else {
            const allLinks = document.querySelectorAll(".system-subject");
            const allParent = document.querySelectorAll(".system");
            for (let i = 0; i < allLinks.length; i++) {
                allLinks[i].style.top = '50px';
                allLinks[i].classList.remove('dwon')
            }
            for (let i = 0; i < allParent.length; i++) {
                allParent[i].style.height = '50px';
                allParent[i].classList.remove('opened')
            }
            const links = e.target.children
            for (let i = 0; i < links.length; i++) {
                if (i === 0) {
                    links[i].style.top = `${top}px`;
                    links[i].classList.add('dwon')
                } else {
                    top += 52
                    links[i].style.top = `${top}px`;
                    links[i].classList.add('dwon')
                }
            }
            let hight = 0
            if (e.target.children.length <= 3) {
                hight = e.target.children.length * 80
            } else {
                hight = e.target.children.length * 65
            }
            e.target.style.height = `${hight}px`
            e.target.classList.add('opened')
        }
    }

    if (!isAuth) return (<>
        <nav>
            <div className='nav-mobile'>
                <div className='nav-mobile-container d-flex justify-content-space-around align-items-center'>
                    <Link to={'/'}><i className="fa fa-home" aria-hidden="true"></i></Link>
                    <Link to={'/system/65a4963482dbaac16d820fc6'}><i className={`fa fa-tasks ${questionTypeID === '65a4963482dbaac16d820fc6' ? 'active' : ''}`} aria-hidden="true"></i></Link>
                    <Link to={'/system/65a4964b82dbaac16d820fc8'}><i className={`fa fa-file-text-o ${questionTypeID === '65a4964b82dbaac16d820fc8' ? 'active' : ''}`} aria-hidden="true"></i></Link>
                    <Link to={'/contact'}><i className="fa fa-headphones" aria-hidden="true"></i></Link>
                    <Link to={'/user/info'}><i className="fa fa-user" aria-hidden="true"></i></Link>
                </div>
            </div>
        </nav>
        <NotLogin /></>)

    return (
        <>
            <Navbar />
            <nav>
                <div className='nav-mobile'>
                    <div className='nav-mobile-container d-flex justify-content-space-around align-items-center'>
                        <Link to={'/'}><i className="fa fa-home" aria-hidden="true"></i></Link>
                        <Link to={'/system/65a4963482dbaac16d820fc6'}><i className={`fa fa-tasks ${questionTypeID === '65a4963482dbaac16d820fc6' ? 'active' : ''}`} aria-hidden="true"></i></Link>
                        <Link to={'/system/65a4964b82dbaac16d820fc8'}><i className={`fa fa-file-text-o ${questionTypeID === '65a4964b82dbaac16d820fc8' ? 'active' : ''}`} aria-hidden="true"></i></Link>
                        {role === 'School' ? <Link to={'/dashboard-school'}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null}
                        {role === 'Teacher' ? <Link to={'/dashboard/teacher'}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null}
                        {role === 'Student' ? <Link to={'/dashboard/student'}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null}
                        {role === 'IT' ? <Link to={'/dashboard-school'}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null}
                        {role === 'Supervisor' ? <Link to={'/dashboard/supervisor'}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null}
                        <Link to={'/contact'}><i className="fa fa-headphones" aria-hidden="true"></i></Link>
                        <Link to={'/user/info'}><i className="fa fa-user" aria-hidden="true"></i></Link>
                    </div>
                </div>
            </nav>
            {loading ? <SystemLoading /> : <div className="system-container">
                {systemData?.map(item => {
                    return (
                        <div key={item._id} className="system" onClick={dropdownToggle}>{item.systemName}
                            {item.subjects?.map(subItem => {
                                return (
                                    <Link key={subItem._id} to={`/unit/${questionTypeID}/${subItem._id}`} className='system-subject'>{subItem.subjectName}</Link>
                                )
                            })}
                        </div>
                    )
                })}
            </div>}
        </>
    )
}

export default System