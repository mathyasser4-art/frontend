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
    const { t, i18n } = useTranslation()
    const [systemData, setSystemData] = useState()
    const [loading, setLoading] = useState(true)
    const { questionTypeID } = useParams()
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')
    const navigate = useNavigate()
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const isArabic = i18n.language === 'ar';
    
    // Helper function to translate system names and subjects with fallback mapping
    const translateName = (name) => {
        if (!name) return '';
        const raw = String(name).trim();

        // 1. Direct translation key
        const key = `systemNames.${raw}`;
        const translated = t(key);
        if (translated && translated !== key) return translated;

        // 2. Lowercase key
        const lowerKey = `systemNames.${raw.toLowerCase()}`;
        const lowerTranslated = t(lowerKey);
        if (lowerTranslated && lowerTranslated !== lowerKey) return lowerTranslated;

        // 3. Fallback dictionary for unhandled variations
        const fallbacks = {
            'basic level': isArabic ? 'المستوى الأساسي 🌟' : 'Basic Level 🌟',
            'level 0': isArabic ? 'المستوى 0 🐣' : 'Level 0 🐣',
            'level 1': isArabic ? 'المستوى 1 ⭐️' : 'Level 1 ⭐️',
            'level 2': isArabic ? 'المستوى 2 ⚡️' : 'Level 2 ⚡️',
            'level 3': isArabic ? 'المستوى 3 🚀' : 'Level 3 🚀',
            'level 4': isArabic ? 'المستوى 4 🏆' : 'Level 4 🏆',
            'level 5': isArabic ? 'المستوى 5 👑' : 'Level 5 👑',
            '+- from 1 to 9': isArabic ? 'جمع وطرح من 1 إلى 9' : '+- from 1 to 9',
            'exercises on (ones , tens , hundreds)': isArabic ? 'تمارين على (الآحاد والعشرات والمئات)' : 'Exercises on (Ones, Tens, Hundreds)',
            'friends of 5 (ones and tens)': isArabic ? 'أصدقاء العدد 5 (الآحاد والعشرات)' : 'Friends of 5 (Ones and Tens)',
            'level 3 (friends of 10) +9 +8 .. +1': isArabic ? 'المستوى 3 (أصدقاء العدد 10) +9 +8 .. +1' : 'Level 3 (friends of 10) +9 +8 .. +1',
            'level 4 (friends of 10) -9 -8 .. -1': isArabic ? 'المستوى 4 (أصدقاء العدد 10) -9 -8 .. -1' : 'Level 4 (friends of 10) -9 -8 .. -1'
        };

        const match = fallbacks[raw.toLowerCase()];
        if (match) return match;

        return raw;
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
            {loading ? <SystemLoading /> : <div className={`system-container ${isArabic ? 'rtl-mode' : ''}`}>
                <div className="system-instruction-banner">
                    <span className="banner-icon">💡</span>
                    <div className="banner-text">
                        <h4>{t('system.clickBookToStart', 'Click a Level to Start 📖')}</h4>
                        <p>{t('system.selectBookCard', 'Select any of the level cards below to expand its units and start practicing!')}</p>
                    </div>
                </div>
                {systemData?.map(item => {
                    return (
                        <div key={item._id} className="system" onClick={dropdownToggle}>
                            <span className="system-title-text">{translateName(item.systemName)}</span>
                            {item.subjects?.map((subItem, index) => {
                                const isFreeSystem = item.systemName?.toLowerCase().trim() === 'basic level' || item.systemName?.toLowerCase().trim() === 'level 0';
                                const isFreeSheet = isFreeSystem && index === 0;
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
                                            <span className="subject-title">{translateName(subItem.subjectName)}</span>
                                            <span className="subject-lock-badge">🔒</span>
                                        </span>
                                    )
                                }
                                return (
                                    <Link key={subItem._id} to={`/unit/${questionTypeID}/${subItem._id}`} className='system-subject'>
                                        <span className="subject-title">{translateName(subItem.subjectName)}</span>
                                    </Link>
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
                            <h2>{t('system.upgradeToUse', 'Upgrade to Use')}</h2>
                        </div>
                        <p className="upgrade-modal-text">
                            {t('system.upgradeMessage', 'Guests can only access the first worksheet of Level 0. Subscribe to unlock all levels, worksheets, and educational games!')}
                        </p>
                        <div className="upgrade-modal-actions">
                            <button className="upgrade-btn-primary" onClick={() => { setShowUpgradeModal(false); navigate('/pricing'); }}>
                                {t('system.viewPricing', 'View Pricing Plans 🚀')}
                            </button>
                            <button className="upgrade-btn-secondary" onClick={() => { setShowUpgradeModal(false); navigate('/auth/login'); }}>
                                {t('system.logIn', 'Log In 🔑')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default System