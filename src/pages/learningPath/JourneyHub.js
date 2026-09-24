import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sparkles, BookOpen, Layers, X, CheckCircle, Flame } from 'lucide-react';
import getSystem from '../../api/system/getSystem.api';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import { UNIT_THEME_PALETTE } from './LearningPath';
import { fetchStudentJourneyOverview, getProgress } from '../../utils/learningPathProgress';
import Navbar from '../../components/navbar/Navbar';
import './JourneyHub.css';
import adventureMapBg from '../../img/adventure_map_bg.jpg';

const LEVEL_BADGES = [
  { icon: '🐣', badgeLabel: 'Basic' },
  { icon: '⭐️', badgeLabel: 'Stage 1' },
  { icon: '🌟', badgeLabel: 'Stage 2' },
  { icon: '⚡️', badgeLabel: 'Stage 3' },
  { icon: '🏆', badgeLabel: 'Stage 4' },
  { icon: '👑', badgeLabel: 'Stage 5' },
];

const JourneyHub = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const navigate = useNavigate();
    const userId = safeLocalStorage.getItem('pp_id') || 'guest';

    const [systemData, setSystemData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSystemModal, setActiveSystemModal] = useState(null);
    const [overviewStats, setOverviewStats] = useState({});

    const questionTypeID = '65a4963482dbaac16d820fc6';

    useEffect(() => {
        // 1. Fetch systems
        getSystem(setLoading, (data) => {
            const valid = (data || []).filter(s => s.systemName && s.systemName.trim().length > 0);
            setSystemData(valid);
        }, questionTypeID);

        // 2. Fetch live completion overview from backend
        if (userId && userId !== 'guest') {
            fetchStudentJourneyOverview(userId).then((overview) => {
                if (overview && Array.isArray(overview)) {
                    const statsMap = {};
                    overview.forEach(item => {
                        statsMap[String(item.systemId)] = item;
                    });
                    setOverviewStats(statsMap);
                }
            });
        }
    }, [userId]);

    // Compute completion percentage for a system (backend first, local storage fallback)
    const getSystemPercentage = (sys) => {
        const sysId = String(sys._id);
        if (overviewStats[sysId] !== undefined) {
            return overviewStats[sysId].completionPercentage || 0;
        }

        // Local storage fallback calculation
        const subjects = sys.subjects || [];
        if (subjects.length === 0) return 0;

        let completed = 0;
        subjects.forEach(sub => {
            const prog = getProgress(userId, sub._id);
            completed += (prog.completedChapters || []).length;
        });

        // Approximate 1 lesson per subject as baseline
        const totalEstimated = Math.max(subjects.length, 1);
        return Math.min(100, Math.round((completed / totalEstimated) * 100));
    };

    // Get subject completion percentage inside modal
    const getSubjectPercentage = (sys, sub) => {
        const sysId = String(sys._id);
        const subId = String(sub._id);

        if (overviewStats[sysId]?.subjects) {
            const match = overviewStats[sysId].subjects.find(s => String(s.subjectId) === subId);
            if (match) return match.completionPercentage || 0;
        }

        const prog = getProgress(userId, sub._id);
        const count = prog.completedChapters?.length || 0;
        return count > 0 ? 100 : 0;
    };

    const handleSelectLevel = (sys) => {
        soundEffects.playClick();
        const subjects = sys.subjects || [];
        if (subjects.length > 1) {
            setActiveSystemModal(sys);
        } else if (subjects.length === 1) {
            launchSubject(sys, subjects[0]);
        } else {
            launchSubject(sys, { _id: sys._id, subjectName: sys.systemName });
        }
    };

    const launchSubject = (sys, subject) => {
        soundEffects.playClick();
        const saved = {
            subjectId: subject._id,
            subjectName: subject.subjectName,
            systemId: sys._id,
            systemName: sys.systemName
        };
        safeLocalStorage.setItem('lp_selected_subject', JSON.stringify(saved));
        safeLocalStorage.setItem('learning_path_last_subject', JSON.stringify(saved));
        navigate('/student/learning-path');
    };

    return (
        <div className={`journey-hub-wrapper ${isArabic ? 'rtl' : ''}`} style={{ backgroundImage: `url(${adventureMapBg})` }}>
            <Navbar />
            <div className="journey-hub-overlay">
                <div className="journey-hub-container">
                    <div className="hub-header-actions">
                        <button 
                            className="hub-back-btn"
                            onClick={() => {
                                soundEffects.playClick();
                                navigate('/student/homework');
                            }}
                        >
                            <ArrowLeft size={18} />
                            <span>{t('journey.dashboard', isArabic ? 'لوحة التحكم' : 'Dashboard')}</span>
                        </button>
                    </div>

                    <div className="hub-title-group">
                        <div className="hub-badge-pill">
                            <Sparkles size={16} />
                            <span>{t('journey.realmsTitle', isArabic ? 'عوالم المغامرة التعليمية' : 'ADVENTURE REALMS')}</span>
                        </div>
                        <h1 className="journey-hub-title">{t('journey.chooseRealm', isArabic ? 'اختر مستواك التعليمي' : 'CHOOSE YOUR REALM')}</h1>
                        <p className="journey-hub-subtitle">
                            {t('journey.subtitle', isArabic ? 'تابع رحلتك وتحدياتك واكتشف نسبة إنجازك في كل مرحلة!' : 'Track your adventure progress and conquer each mathematical world!')}
                        </p>
                    </div>
                    
                    {loading ? (
                        <div className="hub-loader">
                            <div className="hub-spinner" />
                            <p>{isArabic ? 'جاري تجهيز الخرائط...' : 'Summoning ancient maps...'}</p>
                        </div>
                    ) : (
                        <div className="hub-grid">
                            {systemData.map((sys, idx) => {
                                const theme = UNIT_THEME_PALETTE[idx % UNIT_THEME_PALETTE.length];
                                const badge = LEVEL_BADGES[idx % LEVEL_BADGES.length];
                                const topicCount = sys.subjects?.length || 0;
                                const completionPct = getSystemPercentage(sys);
                                const isMastered = completionPct >= 100;
                                const isStarted = completionPct > 0;

                                return (
                                    <div 
                                        key={sys._id} 
                                        className={`hub-card ${isMastered ? 'card-mastered' : ''}`}
                                        onClick={() => handleSelectLevel(sys)}
                                        style={{
                                            '--card-color': theme.color,
                                            '--card-glow': theme.colorGlow,
                                            '--card-bg': theme.colorBg,
                                            '--card-border': theme.accentBorder
                                        }}
                                    >
                                        <div className="hub-card-badge">
                                            {isMastered ? '🏆 Mastered' : badge.badgeLabel}
                                        </div>
                                        <div className="hub-card-icon">{badge.icon || theme.icon}</div>
                                        <h3 className="hub-card-title">{sys.systemName.trim()}</h3>
                                        
                                        <div className="hub-card-meta">
                                            <Layers size={14} />
                                            <span>{topicCount} {topicCount === 1 ? (isArabic ? 'تدريب' : 'Topic') : (isArabic ? 'تدريبات' : 'Topics')}</span>
                                        </div>

                                        {/* ── LIVE COMPLETION PROGRESS BAR ── */}
                                        <div className="hub-card-progress-container">
                                            <div className="hub-card-progress-header">
                                                <span className="hub-progress-lbl">
                                                    {isArabic ? 'نسبة الإنجاز' : 'COMPLETION'}
                                                </span>
                                                <span className="hub-progress-pct" style={{ color: isMastered ? '#34d399' : theme.color }}>
                                                    {completionPct}%
                                                </span>
                                            </div>

                                            <div className="hub-card-progress-track">
                                                <div 
                                                    className="hub-card-progress-fill"
                                                    style={{ 
                                                        width: `${Math.max(completionPct, 4)}%`,
                                                        background: isMastered
                                                            ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                                            : `linear-gradient(90deg, ${theme.color} 0%, #fff 100%)`,
                                                        boxShadow: `0 0 12px ${theme.colorGlow}`
                                                    }}
                                                />
                                            </div>

                                            <div className="hub-card-progress-sub">
                                                {isMastered ? (
                                                    <span className="sub-mastered"><CheckCircle size={12} /> {isArabic ? 'تم إتقان المستوى بالكامل!' : 'Level Mastered!'}</span>
                                                ) : isStarted ? (
                                                    <span>{completionPct}% {isArabic ? 'مكتمل' : 'Completed'}</span>
                                                ) : (
                                                    <span>{isArabic ? 'مرحلة جديدة جاهزة للبدء' : 'Ready to start'}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="hub-card-btn">
                                            <span>{isStarted ? (isArabic ? 'متابعة الرحلة' : 'Continue Quest') : (isArabic ? 'دخول العالم' : 'Enter Realm')}</span>
                                            <span>{isStarted ? '🚀' : '⚔️'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Topic Selection Modal when level has multiple sheets/topics */}
            {activeSystemModal && (
                <div className="hub-topic-modal-overlay" onClick={() => setActiveSystemModal(null)}>
                    <div className="hub-topic-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="hub-topic-close" 
                            onClick={() => {
                                soundEffects.playClick();
                                setActiveSystemModal(null);
                            }}
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="hub-topic-modal-header">
                            <h2>{activeSystemModal.systemName.trim()}</h2>
                            <p>{isArabic ? 'اختر التدريب للبدء في خريطة التحدي:' : 'Choose your training stage to start the adventure:'}</p>
                        </div>

                        <div className="hub-topic-list">
                            {(activeSystemModal.subjects || []).map((sub, sIdx) => {
                                const subPct = getSubjectPercentage(activeSystemModal, sub);
                                const isSubDone = subPct >= 70;

                                return (
                                    <button
                                        key={sub._id}
                                        className={`hub-topic-item-btn ${isSubDone ? 'topic-done' : ''}`}
                                        onClick={() => launchSubject(activeSystemModal, sub)}
                                    >
                                        <span className="hub-topic-number">#{sIdx + 1}</span>
                                        <div className="hub-topic-text-col">
                                            <span className="hub-topic-name">{sub.subjectName}</span>
                                            {subPct > 0 && (
                                                <div className="hub-topic-mini-bar">
                                                    <div 
                                                        className="hub-topic-mini-fill"
                                                        style={{ width: `${subPct}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="hub-topic-score-badge">
                                            {isSubDone ? (
                                                <span className="badge-done"><CheckCircle size={14} /> {subPct}%</span>
                                            ) : subPct > 0 ? (
                                                <span className="badge-prog"><Flame size={14} /> {subPct}%</span>
                                            ) : (
                                                <span className="badge-new"><BookOpen size={14} /> {isArabic ? 'ابدأ' : 'Start'}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JourneyHub;
