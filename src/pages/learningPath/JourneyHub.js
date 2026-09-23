import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getSystem from '../../api/system/getSystem.api';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import { UNIT_THEME_PALETTE } from './LearningPath';
import Navbar from '../../components/navbar/Navbar';
import './JourneyHub.css';
import adventureMapBg from '../../img/adventure_map_bg.jpg';

const JourneyHub = () => {
    const navigate = useNavigate();
    const [systemData, setSystemData] = useState([]);
    const [loading, setLoading] = useState(true);

    const questionTypeID = "66fbe53e6bda7d4caed2c159"; // from LearningPath

    useEffect(() => {
        getSystem(setLoading, setSystemData, questionTypeID);
    }, []);

    const handleSelectRealm = (sys) => {
        soundEffects.playClick();
        safeLocalStorage.setItem('learning_path_last_subject', JSON.stringify({
            subjectId: sys._id,
            subjectName: sys.systemName
        }));
        navigate('/student/learning-path');
    };

    return (
        <div className="journey-hub-wrapper" style={{ backgroundImage: `url(${adventureMapBg})` }}>
            <Navbar />
            <div className="journey-hub-overlay">
                <div className="journey-hub-container">
                    <h1 className="journey-hub-title">CHOOSE YOUR REALM</h1>
                    <p className="journey-hub-subtitle">Pick your grade & subject to load the adventure map!</p>
                    
                    {loading ? (
                        <div className="hub-loader">Loading Realms...</div>
                    ) : (
                        <div className="hub-grid">
                            {systemData.map((sys, idx) => {
                                const theme = UNIT_THEME_PALETTE[idx % UNIT_THEME_PALETTE.length];
                                return (
                                    <div 
                                        key={sys._id} 
                                        className="hub-card"
                                        onClick={() => handleSelectRealm(sys)}
                                        style={{
                                            '--card-color': theme.color,
                                            '--card-glow': theme.colorGlow,
                                            '--card-bg': theme.colorBg,
                                            '--card-border': theme.accentBorder
                                        }}
                                    >
                                        <div className="hub-card-icon">{theme.icon}</div>
                                        <h3 className="hub-card-title">{sys.systemName}</h3>
                                        <div className="hub-card-btn">Enter Realm</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JourneyHub;
