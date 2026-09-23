import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, BookOpen, Layers, X } from 'lucide-react';
import getSystem from '../../api/system/getSystem.api';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import { UNIT_THEME_PALETTE } from './LearningPath';
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
    const navigate = useNavigate();
    const [systemData, setSystemData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSystemModal, setActiveSystemModal] = useState(null);

    const questionTypeID = '65a4963482dbaac16d820fc6';

    useEffect(() => {
        getSystem(setLoading, (data) => {
            const valid = (data || []).filter(s => s.systemName && s.systemName.trim().length > 0);
            setSystemData(valid);
        }, questionTypeID);
    }, []);

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
        <div className="journey-hub-wrapper" style={{ backgroundImage: `url(${adventureMapBg})` }}>
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
                            <span>Dashboard</span>
                        </button>
                    </div>

                    <div className="hub-title-group">
                        <div className="hub-badge-pill">
                            <Sparkles size={16} />
                            <span>ADVENTURE REALMS</span>
                        </div>
                        <h1 className="journey-hub-title">CHOOSE YOUR REALM</h1>
                        <p className="journey-hub-subtitle">
                            Pick your level and embark on an epic quest through mathematical worlds!
                        </p>
                    </div>
                    
                    {loading ? (
                        <div className="hub-loader">
                            <div className="hub-spinner" />
                            <p>Summoning ancient maps...</p>
                        </div>
                    ) : (
                        <div className="hub-grid">
                            {systemData.map((sys, idx) => {
                                const theme = UNIT_THEME_PALETTE[idx % UNIT_THEME_PALETTE.length];
                                const badge = LEVEL_BADGES[idx % LEVEL_BADGES.length];
                                const topicCount = sys.subjects?.length || 0;

                                return (
                                    <div 
                                        key={sys._id} 
                                        className="hub-card"
                                        onClick={() => handleSelectLevel(sys)}
                                        style={{
                                            '--card-color': theme.color,
                                            '--card-glow': theme.colorGlow,
                                            '--card-bg': theme.colorBg,
                                            '--card-border': theme.accentBorder
                                        }}
                                    >
                                        <div className="hub-card-badge">
                                            {badge.badgeLabel}
                                        </div>
                                        <div className="hub-card-icon">{badge.icon || theme.icon}</div>
                                        <h3 className="hub-card-title">{sys.systemName.trim()}</h3>
                                        <div className="hub-card-meta">
                                            <Layers size={14} />
                                            <span>{topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}</span>
                                        </div>
                                        <div className="hub-card-btn">
                                            <span>Enter Realm</span>
                                            <span>⚔️</span>
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
                            <p>Choose your training stage to start the adventure:</p>
                        </div>

                        <div className="hub-topic-list">
                            {(activeSystemModal.subjects || []).map((sub, sIdx) => (
                                <button
                                    key={sub._id}
                                    className="hub-topic-item-btn"
                                    onClick={() => launchSubject(activeSystemModal, sub)}
                                >
                                    <span className="hub-topic-number">#{sIdx + 1}</span>
                                    <span className="hub-topic-name">{sub.subjectName}</span>
                                    <BookOpen size={16} className="hub-topic-icon" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JourneyHub;
