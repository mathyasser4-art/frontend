import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, GraduationCap, Gamepad2, BookOpen } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './StudentHelpModal.css';

const StudentHelpModal = ({ onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isAuth = !!localStorage.getItem('token');
    const role = localStorage.getItem('auth_role');

    const handleHomeworkClick = () => {
        soundEffects.playClick();
        onClose();
        if (isAuth && role === 'Student') {
            navigate('/dashboard/student');
        } else {
            navigate('/auth/login');
        }
    };

    return (
        <div className="student-help-overlay">
            <div className="student-help-card compact-modal">
                <div className="help-header">
                    <div className="help-icon-title">
                        <GraduationCap size={28} color="#3b82f6" />
                        <h2>{t('studentHelp.title', 'Student Hub')}</h2>
                    </div>
                    <button className="help-close" onClick={() => { soundEffects.playClick(); onClose(); }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="help-content compact-content">
                    <div className="help-grid">
                        <div className="help-feature-card">
                            <Gamepad2 size={28} className="feat-icon blue-icon" />
                            <h4>{t('studentHelp.games', 'Play Epic Games')}</h4>
                            <p>{t('studentHelp.gamesDesc', 'Solve math to win in fun games!')}</p>
                        </div>
                        <div className="help-feature-card">
                            <BookOpen size={28} className="feat-icon purple-icon" />
                            <h4>{t('studentHelp.homework', 'Solve Homework')}</h4>
                            <p>{t('studentHelp.homeworkDesc', 'Do your assignments easily.')}</p>
                        </div>
                    </div>

                    <div className="help-footer">
                        <button className="help-btn-primary" onClick={handleHomeworkClick}>
                            {isAuth && role === 'Student' 
                                ? t('studentHelp.goHomework', '📚 GO TO MY HOMEWORK') 
                                : t('studentHelp.loginStart', '🔑 LOGIN TO START HOMEWORK')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentHelpModal;
