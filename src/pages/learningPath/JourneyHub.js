import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sparkles, BookOpen, Layers, X, CheckCircle, Flame, Compass } from 'lucide-react';
import getSystem from '../../api/system/getSystem.api';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import { fetchStudentJourneyOverview, getProgress } from '../../utils/learningPathProgress';
import Navbar from '../../components/navbar/Navbar';
import './JourneyHub.css';
import adventureMapBg from '../../img/adventure_map_bg.jpg';

// Import Custom Generated Wumpa Illustrations
import cardBasicImg from '../../img/wumpa_card_basic.jpg';
import cardLevel1Img from '../../img/wumpa_card_level1.jpg';
import cardLevel2Img from '../../img/wumpa_card_level2.jpg';
import cardLevel3Img from '../../img/wumpa_card_level3.jpg';
import cardLevel4Img from '../../img/wumpa_card_level4.jpg';
import cardLevel5Img from '../../img/wumpa_card_level5.jpg';

const ADVENTURE_WORLDS = [
  {
    key: 'basic',
    matcher: (name) => name.toLowerCase().includes('basic') || name.toLowerCase().includes('أساس') || name.toLowerCase().includes('0'),
    titleEn: 'Jungle Hatchery',
    titleAr: 'مستعمرة الغابة',
    badgeLabel: 'Basic Adventure',
    badgeLabelAr: 'مغامرة المبتدئين',
    icon: '🐣',
    image: cardBasicImg,
    themeColor: '#10b981',
    themeBorder: '#059669',
    themeGlow: 'rgba(16, 185, 129, 0.45)',
    woodClass: 'wood-jungle'
  },
  {
    key: 'level1',
    matcher: (name) => name.toLowerCase().includes('level 1') || name.toLowerCase().includes('مستوى 1') || name.toLowerCase().includes('المستوى 1'),
    titleEn: 'Wumpa Coast',
    titleAr: 'شاطئ وومبا',
    badgeLabel: 'Adventure 1',
    badgeLabelAr: 'المغامرة 1',
    icon: '⭐️',
    image: cardLevel1Img,
    themeColor: '#f59e0b',
    themeBorder: '#d97706',
    themeGlow: 'rgba(245, 158, 11, 0.45)',
    woodClass: 'wood-beach'
  },
  {
    key: 'level2',
    matcher: (name) => name.toLowerCase().includes('level 2') || name.toLowerCase().includes('مستوى 2') || name.toLowerCase().includes('المستوى 2'),
    titleEn: 'Lava Caverns',
    titleAr: 'كهوف الحمم البركانية',
    badgeLabel: 'Adventure 2',
    badgeLabelAr: 'المغامرة 2',
    icon: '🌟',
    image: cardLevel2Img,
    themeColor: '#ef4444',
    themeBorder: '#dc2626',
    themeGlow: 'rgba(239, 68, 68, 0.5)',
    woodClass: 'wood-volcano'
  },
  {
    key: 'level3',
    matcher: (name) => name.toLowerCase().includes('level 3') || name.toLowerCase().includes('مستوى 3') || name.toLowerCase().includes('المستوى 3'),
    titleEn: 'Sky Temple',
    titleAr: 'معبد السحاب والصواعق',
    badgeLabel: 'Adventure 3',
    badgeLabelAr: 'المغامرة 3',
    icon: '⚡️',
    image: cardLevel3Img,
    themeColor: '#06b6d4',
    themeBorder: '#0891b2',
    themeGlow: 'rgba(6, 182, 212, 0.45)',
    woodClass: 'wood-sky'
  },
  {
    key: 'level4',
    matcher: (name) => name.toLowerCase().includes('level 4') || name.toLowerCase().includes('مستوى 4') || name.toLowerCase().includes('المستوى 4'),
    titleEn: 'Golden Ruins',
    titleAr: 'أطلال التيكي الذهبية',
    badgeLabel: 'Adventure 4',
    badgeLabelAr: 'المغامرة 4',
    icon: '🏆',
    image: cardLevel4Img,
    themeColor: '#a855f7',
    themeBorder: '#9333ea',
    themeGlow: 'rgba(168, 85, 247, 0.45)',
    woodClass: 'wood-ruins'
  },
  {
    key: 'level5',
    matcher: (name) => name.toLowerCase().includes('level 5') || name.toLowerCase().includes('مستوى 5') || name.toLowerCase().includes('المستوى 5'),
    titleEn: 'Master Citadel',
    titleAr: 'القلعة الأسطورية',
    badgeLabel: 'Master Adventure',
    badgeLabelAr: 'المغامرة الكبرى',
    icon: '👑',
    image: cardLevel5Img,
    themeColor: '#eab308',
    themeBorder: '#ca8a04',
    themeGlow: 'rgba(234, 179, 8, 0.55)',
    woodClass: 'wood-citadel'
  },
];

const getAdventureWorld = (systemName, index) => {
    const raw = String(systemName || '');
    const found = ADVENTURE_WORLDS.find(w => w.matcher(raw));
    if (found) return found;
    return ADVENTURE_WORLDS[index % ADVENTURE_WORLDS.length];
};

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
        getSystem(setLoading, (data) => {
            const valid = (data || []).filter(s => s.systemName && s.systemName.trim().length > 0);
            setSystemData(valid);
        }, questionTypeID);

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

    // Live completion percentage calculation based on actual questions/chapters score
    const getSystemPercentage = (sys) => {
        const sysId = String(sys._id);
        if (overviewStats[sysId] !== undefined) {
            return overviewStats[sysId].completionPercentage || 0;
        }

        // Local storage calculation based on actual question score %
        const subjects = sys.subjects || [];
        if (subjects.length === 0) return 0;

        let totalScoreSum = 0;
        let totalCount = 0;

        subjects.forEach(sub => {
            const prog = getProgress(userId, sub._id);
            const scoreValues = Object.values(prog.scores || {});
            if (scoreValues.length > 0) {
                scoreValues.forEach(s => {
                    totalScoreSum += Number(s || 0);
                    totalCount++;
                });
            } else {
                totalCount += 1;
            }
        });

        if (totalCount === 0) return 0;
        return Math.min(100, Math.round(totalScoreSum / totalCount));
    };

    // Subject score inside modal
    const getSubjectPercentage = (sys, sub) => {
        const sysId = String(sys._id);
        const subId = String(sub._id);

        if (overviewStats[sysId]?.subjects) {
            const match = overviewStats[sysId].subjects.find(s => String(s.subjectId) === subId);
            if (match && match.completionPercentage !== undefined) {
                return match.completionPercentage;
            }
        }

        const prog = getProgress(userId, sub._id);
        const scoreValues = Object.values(prog.scores || {});
        if (scoreValues.length > 0) {
            const sum = scoreValues.reduce((a, b) => a + Number(b || 0), 0);
            return Math.min(100, Math.round(sum / scoreValues.length));
        }
        return 0;
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
                            className="hub-back-btn wumpa-wood-btn"
                            onClick={() => {
                                soundEffects.playClick();
                                navigate('/student/homework');
                            }}
                        >
                            <ArrowLeft size={18} />
                            <span>{isArabic ? 'لوحة التحكم' : 'Dashboard'}</span>
                        </button>
                    </div>

                    <div className="hub-title-group">
                        <div className="hub-badge-pill wumpa-tiki-pill">
                            <Sparkles size={16} />
                            <span>{isArabic ? 'خريطة المغامرات التعليمية' : 'WUMPA ADVENTURE WORLDS'}</span>
                            <Sparkles size={16} />
                        </div>
                        <h1 className="journey-hub-title">
                            {isArabic ? 'اختر مغامرتك' : 'CHOOSE YOUR ADVENTURE'}
                        </h1>
                        <p className="journey-hub-subtitle">
                            {isArabic ? 'اختر مستواك التعليمي واكتشف نسبة إنجازك في كل مغامرة!' : 'Pick your adventure level and conquer every mathematical challenge!'}
                        </p>
                    </div>
                    
                    {loading ? (
                        <div className="hub-loader">
                            <div className="hub-spinner" />
                            <p>{isArabic ? 'جاري استدعاء خرائط وومبا...' : 'Unfolding Wumpa Adventure Maps...'}</p>
                        </div>
                    ) : (
                        <div className="hub-grid">
                            {systemData.map((sys, idx) => {
                                const world = getAdventureWorld(sys.systemName, idx);
                                const topicCount = sys.subjects?.length || 0;
                                const completionPct = getSystemPercentage(sys);
                                const isMastered = completionPct >= 100;
                                const isStarted = completionPct > 0;

                                return (
                                    <div 
                                        key={sys._id} 
                                        className={`wumpa-card ${world.woodClass} ${isMastered ? 'card-mastered' : ''}`}
                                        onClick={() => handleSelectLevel(sys)}
                                        style={{
                                            '--theme-color': world.themeColor,
                                            '--theme-border': world.themeBorder,
                                            '--theme-glow': world.themeGlow,
                                        }}
                                    >
                                        {/* Top Image Banner */}
                                        <div className="wumpa-card-art-frame">
                                            <img 
                                                src={world.image} 
                                                alt={sys.systemName}
                                                className="wumpa-card-art-img"
                                                loading="lazy"
                                            />
                                            <div className="wumpa-card-art-overlay" />
                                            
                                            {/* Level Badge in Corner */}
                                            <div className="wumpa-card-badge">
                                                <span className="badge-icon">{world.icon}</span>
                                                <span className="badge-text">
                                                    {isArabic ? world.badgeLabelAr : world.badgeLabel}
                                                </span>
                                            </div>

                                            {/* World Subtitle on Art */}
                                            <div className="wumpa-art-title-tag">
                                                <Compass size={13} />
                                                <span>{isArabic ? world.titleAr : world.titleEn}</span>
                                            </div>
                                        </div>

                                        {/* Card Body with Wumpa Planks */}
                                        <div className="wumpa-card-body">
                                            <h3 className="wumpa-card-title">{sys.systemName.trim()}</h3>
                                            
                                            <div className="wumpa-card-topics-count">
                                                <Layers size={14} />
                                                <span>{topicCount} {topicCount === 1 ? (isArabic ? 'تدريب' : 'Topic') : (isArabic ? 'تدريبات' : 'Topics')}</span>
                                            </div>

                                            {/* ── LIVE COMPLETION PROGRESS BAR ── */}
                                            <div className="wumpa-progress-box">
                                                <div className="wumpa-progress-row">
                                                    <span className="wumpa-prog-lbl">
                                                        {isArabic ? 'نسبة التقدم' : 'COMPLETION'}
                                                    </span>
                                                    <span className="wumpa-prog-val" style={{ color: isMastered ? '#34d399' : world.themeColor }}>
                                                        {completionPct}%
                                                    </span>
                                                </div>

                                                <div className="wumpa-progress-track">
                                                    <div 
                                                        className="wumpa-progress-fill"
                                                        style={{ 
                                                            width: `${Math.max(completionPct, 4)}%`,
                                                            background: isMastered
                                                                ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                                                : `linear-gradient(90deg, ${world.themeColor} 0%, #fff 100%)`,
                                                            boxShadow: `0 0 14px ${world.themeGlow}`
                                                        }}
                                                    />
                                                </div>

                                                <div className="wumpa-progress-footer">
                                                    {isMastered ? (
                                                        <span className="wumpa-sub-mastered"><CheckCircle size={13} /> {isArabic ? 'تم إتقان المغامرة!' : 'Adventure Mastered!'}</span>
                                                    ) : isStarted ? (
                                                        <span>{completionPct}% {isArabic ? 'مكتمل حتى الآن' : 'Completed so far'}</span>
                                                    ) : (
                                                        <span>{isArabic ? 'مغامرة جديدة جاهزة للبدء' : 'Ready to start'}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 3D Wumpa Wooden Button */}
                                            <button className="wumpa-action-btn">
                                                <span>{isStarted ? (isArabic ? 'تابع المغامرة' : 'Continue Adventure') : (isArabic ? 'ابدأ المغامرة' : 'Start Adventure')}</span>
                                                <span>{isStarted ? '🚀' : '⚔️'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Topic Selection Modal in Wumpa Theme */}
            {activeSystemModal && (
                <div className="wumpa-topic-modal-overlay" onClick={() => setActiveSystemModal(null)}>
                    <div className="wumpa-topic-modal-frame" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="wumpa-topic-close-btn" 
                            onClick={() => {
                                soundEffects.playClick();
                                setActiveSystemModal(null);
                            }}
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="wumpa-topic-modal-header">
                            <span className="wumpa-modal-tiki">🗿</span>
                            <div>
                                <h2>{activeSystemModal.systemName.trim()}</h2>
                                <p>{isArabic ? 'اختر التدريب للانطلاق في مغامرة وومبا:' : 'Select a training stage to enter the Wumpa adventure map:'}</p>
                            </div>
                        </div>

                        <div className="wumpa-topic-list">
                            {(activeSystemModal.subjects || []).map((sub, sIdx) => {
                                const subPct = getSubjectPercentage(activeSystemModal, sub);
                                const isSubDone = subPct >= 70;

                                return (
                                    <button
                                        key={sub._id}
                                        className={`wumpa-topic-row-btn ${isSubDone ? 'stage-done' : ''}`}
                                        onClick={() => launchSubject(activeSystemModal, sub)}
                                    >
                                        <div className="wumpa-topic-num">#{sIdx + 1}</div>
                                        <div className="wumpa-topic-info">
                                            <span className="wumpa-topic-title">{sub.subjectName}</span>
                                            {subPct > 0 && (
                                                <div className="wumpa-topic-mini-track">
                                                    <div 
                                                        className="wumpa-topic-mini-fill"
                                                        style={{ width: `${subPct}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="wumpa-topic-badge-col">
                                            {isSubDone ? (
                                                <span className="wumpa-pill-done"><CheckCircle size={13} /> {subPct}%</span>
                                            ) : subPct > 0 ? (
                                                <span className="wumpa-pill-prog"><Flame size={13} /> {subPct}%</span>
                                            ) : (
                                                <span className="wumpa-pill-new"><BookOpen size={13} /> {isArabic ? 'ابدأ' : 'Start'}</span>
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
