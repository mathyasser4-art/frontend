import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/navbar/Navbar'

import MobileNav from '../../components/mobileNav/MobileNav';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SystemLoading from '../../components/systemLoding/SystemLoading';
import getUnit from '../../api/unit/getUnit.api';
import '../../reusable.css'
import './Unit.css'

function Unit() {
    const { t } = useTranslation()
    const [unitData, setUnitData] = useState()
    const [loading, setLoading] = useState(true)
    const { questionTypeID, subjectID } = useParams()
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')
    const navigate = useNavigate()
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    
    // Helper function to translate unit/chapter names
    const translateName = (name) => {
        const translationKey = `systemNames.${name}`
        const translated = t(translationKey)
        // If translation exists and is different from the key, use it; otherwise use original
        return translated !== translationKey ? translated : name
    }

    useEffect(() => {
        const getAllUnit = async () => {
            await getUnit(setLoading, setUnitData, questionTypeID, subjectID)
        }
        getAllUnit()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const dropdownToggle = (e) => {
        let top = 55
        if (e.target.classList.contains('opened')) {
            const links = e.target.children
            for (let i = 0; i < links.length; i++) {
                links[i].style.top = '55px';
                links[i].classList.remove('dwon')
            }
            e.target.style.height = '55px'
            e.target.classList.remove('opened')
        } else {
            const allLinks = document.querySelectorAll(".unit-chapter");
            const allParent = document.querySelectorAll(".unit");
            for (let i = 0; i < allLinks.length; i++) {
                allLinks[i].style.top = '55px';
                allLinks[i].classList.remove('dwon')
            }
            for (let i = 0; i < allParent.length; i++) {
                allParent[i].style.height = '55px';
                allParent[i].classList.remove('opened')
            }
            const links = e.target.children
            for (let i = 0; i < links.length; i++) {
                if (i === 0) {
                    links[i].style.top = `${top}px`;
                    links[i].classList.add('dwon')
                } else {
                    top += 60
                    links[i].style.top = `${top}px`;
                    links[i].classList.add('dwon')
                }
            }
            let hight = 0
            if (e.target.children.length === 1) {
                hight = 55 + 65
            } else if (e.target.children.length <= 3) {
                hight = 55 + (e.target.children.length * 65)
            } else {
                hight = 55 + (e.target.children.length * 58)
            }
            e.target.style.height = `${hight}px`
            e.target.classList.add('opened')
        }
    }

    return (
        <>

            <Navbar />
            <MobileNav role={role} />
            {loading ? <SystemLoading /> : <div className="unit-container">
                {unitData?.map(item => {
                    const isTwoRows = item.unitName?.toLowerCase().trim() === '2 rows';
                    const isLocked = !isAuth && !isTwoRows;

                    if (isLocked) {
                        return (
                            <div 
                                key={item._id} 
                                className="unit locked" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUpgradeModal(true);
                                }}
                            >
                                {translateName(item.unitName)}
                                <span className="unit-lock-badge">🔒</span>
                            </div>
                        )
                    }

                    const totalQuestions = item.chapters?.reduce((acc, subItem) => acc + (subItem.questions?.length || 0), 0) || 0;
                    const isEmpty = totalQuestions === 0;

                    if (isEmpty) {
                        return (
                            <div 
                                key={item._id} 
                                className="unit empty"
                            >
                                {translateName(item.unitName)}
                            </div>
                        )
                    }

                    return (
                        <div key={item._id} className="unit" onClick={dropdownToggle}>{translateName(item.unitName)}
                            {item.chapters?.map(subItem => {
                                return (
                                    <Link key={subItem._id} to={`/question/${subItem._id}/${questionTypeID}/${subjectID}`} className='unit-chapter'>{translateName(subItem.chapterName)}</Link>
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
                            Guests can only access 2 Rows worksheets under Level 0. Subscribe to unlock 3+ Rows, higher levels, and educational games!
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

export default Unit