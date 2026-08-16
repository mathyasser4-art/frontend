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
    
    // Active level card modal
    const [activeLevel, setActiveLevel] = useState(null)
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
            'basic level': isArabic ? 'المستوى الأساسي' : 'Basic Level',
            'level 0': isArabic ? 'المستوى 0' : 'Level 0',
            'level 1': isArabic ? 'المستوى 1' : 'Level 1',
            'level 2': isArabic ? 'المستوى 2' : 'Level 2',
            'level 3': isArabic ? 'المستوى 3' : 'Level 3',
            'level 4': isArabic ? 'المستوى 4' : 'Level 4',
            'level 5': isArabic ? 'المستوى 5' : 'Level 5',
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

    const getLevelBadgeInfo = (name) => {
        const raw = String(name || '').toLowerCase().trim();
        if (raw.includes('basic') || raw.includes('أساسي')) {
            return { icon: '🌟', bgGradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', shadowColor: 'rgba(2, 132, 199, 0.35)', badgeLabel: isArabic ? 'مبتدئ' : 'Basic' };
        }
        if (raw.includes('level 0') || raw.includes('0')) {
            return { icon: '🐣', bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', shadowColor: 'rgba(217, 119, 6, 0.35)', badgeLabel: isArabic ? 'مرحلة 0' : 'Stage 0' };
        }
        if (raw.includes('level 1') || raw.includes('1')) {
            return { icon: '⭐️', bgGradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', shadowColor: 'rgba(5, 150, 105, 0.35)', badgeLabel: isArabic ? 'مرحلة 1' : 'Stage 1' };
        }
        if (raw.includes('level 2') || raw.includes('2')) {
            return { icon: '⚡️', bgGradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', shadowColor: 'rgba(124, 58, 237, 0.35)', badgeLabel: isArabic ? 'مرحلة 2' : 'Stage 2' };
        }
        if (raw.includes('level 3') || raw.includes('3')) {
            return { icon: '🚀', bgGradient: 'linear-gradient(135deg, #f472b6 0%, #e11d48 100%)', shadowColor: 'rgba(225, 29, 72, 0.35)', badgeLabel: isArabic ? 'مرحلة 3' : 'Stage 3' };
        }
        if (raw.includes('level 4') || raw.includes('4')) {
            return { icon: '🏆', bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', shadowColor: 'rgba(180, 83, 9, 0.35)', badgeLabel: isArabic ? 'مرحلة 4' : 'Stage 4' };
        }
        if (raw.includes('level 5') || raw.includes('5')) {
            return { icon: '👑', bgGradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', shadowColor: 'rgba(4, 120, 87, 0.35)', badgeLabel: isArabic ? 'مرحلة 5' : 'Stage 5' };
        }
        return { icon: '🎯', bgGradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', shadowColor: 'rgba(67, 56, 202, 0.35)', badgeLabel: isArabic ? 'تحدي' : 'Challenge' };
    };

    useEffect(() => {
        const getAllSystem = async () => {
            await getSystem(setLoading, setSystemData, questionTypeID)
        }
        getAllSystem()
    }, [questionTypeID]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <Navbar />
            <MobileNav role={role} />
            {loading ? <SystemLoading /> : (
                <div className={`system-game-container ${isArabic ? 'rtl-mode' : ''}`}>
                    {/* Cute Kid Banner */}
                    <div className="game-instruction-banner">
                        <div className="banner-mascot-icon">🎮</div>
                        <div className="banner-text-content">
                            <h4>{t('system.clickBookToStart', 'اختر بطاقة المستوى للبدء 🎯')}</h4>
                            <p>{t('system.selectBookCard', 'اضغط على أي كارت من كروت اللعبة أدناه لعرض الدروس والتطبيقات!')}</p>
                        </div>
                    </div>

                    {/* Game Cards Grid */}
                    <div className="game-cards-grid">
                        {systemData?.map(item => {
                            const badgeInfo = getLevelBadgeInfo(item.systemName);
                            const topicCount = item.subjects?.length || 0;

                            return (
                                <div 
                                    key={item._id} 
                                    className="game-level-card"
                                    onClick={() => setActiveLevel(item)}
                                >
                                    <div className="card-top-shine"></div>
                                    <div className="card-icon-badge" style={{ background: badgeInfo.bgGradient, boxShadow: `0 6px 14px ${badgeInfo.shadowColor}` }}>
                                        <span className="card-big-emoji">{badgeInfo.icon}</span>
                                    </div>
                                    <div className="card-body-content">
                                        <span className="game-stage-tag">{badgeInfo.badgeLabel}</span>
                                        <h3 className="game-card-title">{translateName(item.systemName)}</h3>
                                        <div className="game-topics-pill">
                                            <span>📚 {topicCount} {isArabic ? (topicCount === 1 ? 'موضوع دراسي' : 'موضوعات دراسية') : (topicCount === 1 ? 'Topic' : 'Topics')}</span>
                                        </div>
                                    </div>
                                    <button className="game-open-btn">
                                        <span>{isArabic ? 'افتح الكارت 🚀' : 'Open Stage 🚀'}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Topics Modal Popup */}
            {activeLevel && (
                <div className="game-topics-modal-overlay" onClick={() => setActiveLevel(null)}>
                    <div className="game-topics-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="topics-modal-close" onClick={() => setActiveLevel(null)}>×</button>
                        
                        <div className="topics-modal-header">
                            <span className="modal-header-icon">{getLevelBadgeInfo(activeLevel.systemName).icon}</span>
                            <div>
                                <h2>{translateName(activeLevel.systemName)}</h2>
                                <p>{isArabic ? 'اختر الدرس أو الشيت للبدء في التحدي:' : 'Select a topic to start practicing:'}</p>
                            </div>
                        </div>

                        <div className="topics-list-container">
                            {activeLevel.subjects?.map((subItem, index) => {
                                const isFreeSystem = activeLevel.systemName?.toLowerCase().trim() === 'basic level' || activeLevel.systemName?.toLowerCase().trim() === 'level 0';
                                const isFreeSheet = isFreeSystem && index === 0;
                                const isLocked = !isAuth && !isFreeSheet;

                                if (isLocked) {
                                    return (
                                        <div 
                                            key={subItem._id} 
                                            className="game-topic-item locked"
                                            onClick={() => {
                                                setActiveLevel(null);
                                                setShowUpgradeModal(true);
                                            }}
                                        >
                                            <div className="topic-item-left">
                                                <span className="topic-play-icon">🔒</span>
                                                <span className="topic-item-name">{translateName(subItem.subjectName)}</span>
                                            </div>
                                            <span className="topic-lock-label">{isArabic ? 'مغلق (اشترك للفتح)' : 'Locked'}</span>
                                        </div>
                                    );
                                }

                                return (
                                    <Link 
                                        key={subItem._id} 
                                        to={`/unit/${questionTypeID}/${subItem._id}`} 
                                        className="game-topic-item playable"
                                    >
                                        <div className="topic-item-left">
                                            <span className="topic-play-icon">🎯</span>
                                            <span className="topic-item-name">{translateName(subItem.subjectName)}</span>
                                        </div>
                                        <span className="topic-start-btn">{isArabic ? 'ابدأ الآن ▶️' : 'Start ▶️'}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade Modal */}
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