import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/navbar/Navbar'

import MobileNav from '../../components/mobileNav/MobileNav';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SystemLoading from '../../components/systemLoding/SystemLoading';
import getSystem from '../../api/system/getSystem.api';
import '../../reusable.css'
import './System.css'

function System() {
    const { t } = useTranslation()
    const [systemData, setSystemData] = useState()
    const [loading, setLoading] = useState(true)
    const { questionTypeID } = useParams()
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')
    const navigate = useNavigate()
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    
    // Helper function to translate system names
    const translateName = (name) => {
        const translationKey = `systemNames.${name}`
        const translated = t(translationKey)
        // If translation exists and is different from the key, use it; otherwise use original
        return translated !== translationKey ? translated : name
    }

    useEffect(() => {
        const getAllSystem = async () => {
            await getSystem(setLoading, setSystemData, questionTypeID)
        }
        getAllSystem()
    }, [questionTypeID]) // eslint-disable-line react-hooks/exhaustive-deps

    const dropdownToggle = (e) => {
        const card = e.currentTarget
        let top = 50
        if (card.classList.contains('opened')) {
            const links = card.children
            for (let i = 0; i < links.length; i++) {
                links[i].style.top = '50px';
                links[i].classList.remove('dwon')
            }
            card.style.height = '50px'
            card.classList.remove('opened')
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
            const links = card.children
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
            if (card.children.length <= 3) {
                hight = card.children.length * 80
            } else {
                hight = card.children.length * 65
            }
            card.style.height = `${hight}px`
            card.classList.add('opened')
        }
    }

    return (
        <>

            <Navbar />
            <MobileNav role={role} />
            {loading ? <SystemLoading /> : <div className="system-container">
                <div className="system-instruction-banner">
                    <span className="banner-icon">💡</span>
                    <div className="banner-text">
                        <h4>Click a Book to Start</h4>
                        <p>Select any of the book cards below to expand its units and start practicing!</p>
                    </div>
                </div>
                {systemData?.map(item => {
                    return (
                        <div key={item._id} className="system" onClick={dropdownToggle}>{translateName(item.systemName)}
                            {item.subjects?.map((subItem, index) => {
                                const isLevelZero = item.systemName?.toLowerCase() === 'level 0';
                                const isFreeSheet = isLevelZero && index === 0;
                                const isLocked = !isAuth && !isFreeSheet;

                                if (isLocked) {
                                    return (
                                        <span 
                                            key={subItem._id} 
                                            className='system-subject locked'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowUpgradeModal(true);
                                            }}
                                        >
                                            {translateName(subItem.subjectName)}
                                            <span className="subject-lock-badge">🔒</span>
                                        </span>
                                    )
                                }
                                return (
                                    <Link key={subItem._id} to={`/unit/${questionTypeID}/${subItem._id}`} className='system-subject'>{translateName(subItem.subjectName)}</Link>
                                )
                            })}
                        </div>
                    )
                })}
            </div>}

            {showUpgradeModal && (
                <div className="upgrade-overlay" onClick={() => setShowUpgradeModal(false)}>
                    <div className="upgrade-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="upgrade-close-btn" onClick={() => setShowUpgradeModal(false)}>×</button>
                        <div className="upgrade-modal-header">
                            <span className="lock-large-icon">🔒</span>
                            <h2>Upgrade to Use</h2>
                        </div>
                        <p className="upgrade-modal-text">
                            Guests can only access the first worksheet of Level 0. Subscribe to unlock all levels, worksheets, and educational games!
                        </p>
                        <div className="upgrade-modal-actions">
                            <button className="upgrade-btn-primary" onClick={() => { setShowUpgradeModal(false); navigate('/pricing'); }}>
                                View Pricing Plans
                            </button>
                            <button className="upgrade-btn-secondary" onClick={() => { setShowUpgradeModal(false); navigate('/auth/login'); }}>
                                Log In
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default System