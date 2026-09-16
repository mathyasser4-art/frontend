import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/navbar/Navbar'

import MobileNav from '../../components/mobileNav/MobileNav';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SystemLoading from '../../components/systemLoding/SystemLoading';
import getUnit from '../../api/unit/getUnit.api';
import soundEffects from '../../utils/soundEffects';
import { safeLocalStorage } from '../../utils/safeStorage';
import '../../reusable.css'
import './Unit.css'

import translateCurriculumItem from '../../utils/itemTranslator';

function Unit() {
    const { t, i18n } = useTranslation()
    const [unitData, setUnitData] = useState()
    const [loading, setLoading] = useState(true)
    const { questionTypeID, subjectID } = useParams()
    const isAuth = safeLocalStorage.getItem('O_authWEB')
    const role = safeLocalStorage.getItem('auth_role')
    const navigate = useNavigate()
    
    // Active unit card modal
    const [activeUnit, setActiveUnit] = useState(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const isArabic = i18n.language === 'ar';

    // Helper function to translate unit/chapter names with fallback mapping
    const translateName = (name) => {
        if (!name) return '';
        const raw = String(name).trim();

        // 1. Direct translation key
        const key = `systemNames.${raw}`;
        const translated = t(key);
        if (translated && translated !== key) return translated;

        // 2. Comprehensive fallback translator
        return translateCurriculumItem(raw, isArabic);
    }

    const getUnitBadgeInfo = (name) => {
        const raw = String(name || '').toLowerCase().trim();
        if (raw.includes('2') || raw.includes('سطران')) {
            return { icon: '🔢', bgGradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', shadowColor: 'rgba(2, 132, 199, 0.35)', badgeLabel: isArabic ? 'مستوى بسيط' : '2 Rows' };
        }
        if (raw.includes('3')) {
            return { icon: '🎲', bgGradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', shadowColor: 'rgba(124, 58, 237, 0.35)', badgeLabel: isArabic ? 'مستوى متوسط' : '3 Rows' };
        }
        if (raw.includes('4')) {
            return { icon: '⚡️', bgGradient: 'linear-gradient(135deg, #f472b6 0%, #e11d48 100%)', shadowColor: 'rgba(225, 29, 72, 0.35)', badgeLabel: isArabic ? 'مستوى متقدم' : '4 Rows' };
        }
        if (raw.includes('5')) {
            return { icon: '🏆', bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', shadowColor: 'rgba(180, 83, 9, 0.35)', badgeLabel: isArabic ? 'مستوى محترف' : '5 Rows' };
        }
        return { icon: '📝', bgGradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', shadowColor: 'rgba(5, 150, 105, 0.35)', badgeLabel: isArabic ? 'تمرين' : 'Practice' };
    };

    useEffect(() => {
        const getAllUnit = async () => {
            await getUnit(setLoading, setUnitData, questionTypeID, subjectID)
        }
        getAllUnit()
    }, [questionTypeID, subjectID]) // eslint-disable-line react-hooks/exhaustive-deps

    // Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setActiveUnit(null);
                setShowUpgradeModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <Navbar />
            <MobileNav role={role} />
            {loading ? <SystemLoading /> : (
                <div className={`unit-game-container ${isArabic ? 'rtl-mode' : ''}`}>
                    {/* Back Button */}
                    <button className="unit-back-btn" onClick={() => navigate(`/system/${questionTypeID}`)}>
                        <span>{t('unit.backToLevels', '⬅️ العودة إلى المستويات')}</span>
                    </button>

                    {/* Cute Kid Banner */}
                    <div className="game-instruction-banner">
                        <div className="banner-mascot-icon">🎯</div>
                        <div className="banner-text-content">
                            <h4>{t('unit.selectUnit', 'اختر عدد الأسطر أو نوع التمرين 🎯')}</h4>
                            <p>{t('unit.unitDescription', 'اضغط على أي كارت من الكروت التالية لعرض أوراق العمل والأسئلة!')}</p>
                        </div>
                    </div>

                    {/* Game Cards Grid */}
                    <div className="game-cards-grid">
                        {unitData?.map(item => {
                            const badgeInfo = getUnitBadgeInfo(item.unitName);
                            const chapterCount = item.chapters?.length || 0;
                            const isTwoRows = item.unitName?.toLowerCase().trim() === '2 rows';
                            const isLocked = !isAuth && !isTwoRows;

                            return (
                                <div 
                                    key={item._id} 
                                    className={`game-level-card ${isLocked ? 'locked-card' : ''}`}
                                    onMouseEnter={() => soundEffects.playCardHover()}
                                    onClick={() => {
                                        if (isLocked) {
                                            soundEffects.playClick();
                                            setShowUpgradeModal(true);
                                        } else {
                                            soundEffects.playClick();
                                            setActiveUnit(item);
                                        }
                                    }}
                                >
                                    <div className="card-top-shine"></div>
                                    <div className="card-icon-badge" style={{ background: badgeInfo.bgGradient, boxShadow: `0 6px 14px ${badgeInfo.shadowColor}` }}>
                                        <span className="card-big-emoji">{isLocked ? '🔒' : badgeInfo.icon}</span>
                                    </div>
                                    <div className="card-body-content">
                                        <span className="game-stage-tag">{badgeInfo.badgeLabel}</span>
                                        <h3 className="game-card-title">{translateName(item.unitName)}</h3>
                                        <div className="game-topics-pill">
                                            <span>📝 {chapterCount} {isArabic ? (chapterCount === 1 ? 'ورقة عمل' : 'أوراق عمل') : (chapterCount === 1 ? 'Worksheet' : 'Worksheets')}</span>
                                        </div>
                                    </div>
                                    <button className={`game-open-btn ${isLocked ? 'btn-locked' : ''}`}>
                                        <span>{isLocked ? (isArabic ? 'مغلق (اشترك للفتح) 🔒' : 'Locked 🔒') : (isArabic ? 'افتح التمارين 🚀' : 'Open Topic 🚀')}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Chapters / Worksheets Modal Popup */}
            {activeUnit && (
                <div className="game-topics-modal-overlay" onClick={() => setActiveUnit(null)}>
                    <div className="game-topics-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="topics-modal-close" onClick={() => setActiveUnit(null)}>×</button>
                        
                        <div className="topics-modal-header">
                            <span className="modal-header-icon">{getUnitBadgeInfo(activeUnit.unitName).icon}</span>
                            <div>
                                <h2>{translateName(activeUnit.unitName)}</h2>
                                <p>{t('unit.selectWorksheet', 'اختر الشيت للبدء في الحل:')}</p>
                            </div>
                        </div>

                        <div className="topics-list-container">
                            {activeUnit.chapters?.map(subItem => {
                                return (
                                    <Link 
                                        key={subItem._id} 
                                        to={`/question/${subItem._id}/${questionTypeID}/${subjectID}`} 
                                        className="game-topic-item playable"
                                        onMouseEnter={() => soundEffects.playCardHover()}
                                        onClick={() => soundEffects.playClick()}
                                    >
                                        <div className="topic-item-left">
                                            <span className="topic-play-icon">🎮</span>
                                            <span className="topic-item-name">{translateName(subItem.chapterName)}</span>
                                        </div>
                                        <span className="topic-start-btn">{isArabic ? 'ابدأ الحل ▶️' : 'Solve ▶️'}</span>
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
                            {t('system.upgradeMessage', 'Guests can only access 2 Rows worksheets under Level 0. Subscribe to unlock 3+ Rows, higher levels, and educational games!')}
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

export default Unit