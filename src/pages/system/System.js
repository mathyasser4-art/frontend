import React, { useEffect, useState } from 'react'
import Navbar from '../../components/navbar/Navbar'
import GuestBanner from '../../components/guestBanner/GuestBanner';
import MobileNav from '../../components/mobileNav/MobileNav';
import { Link, useParams } from 'react-router-dom';
import SystemLoading from '../../components/systemLoding/SystemLoading';
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
        getAllSystem()
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

    return (
        <>
            {!isAuth && <GuestBanner />}
            <Navbar />
            <MobileNav role={role} />
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