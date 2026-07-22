import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, GraduationCap, Users, BookOpen } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './TeacherHelpModal.css';

const TeacherHelpModal = ({ onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="teacher-help-overlay">
            <div className="teacher-help-card compact-modal">
                <div className="help-header">
                    <div className="help-icon-title">
                        <GraduationCap size={28} color="#ff4757" />
                        <h2>{t('teacherHelp.title', 'Teacher Hub')}</h2>
                    </div>
                    <button className="help-close" onClick={() => { soundEffects.playClick(); onClose(); }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="help-content compact-content">
                    <div className="help-grid">
                        <div className="help-feature-card">
                            <Users size={24} className="feat-icon" />
                            <h4>{t('teacherHelp.students', 'Manage Students')}</h4>
                            <p>{t('teacherHelp.studentsDesc', 'Add and manage student accounts easily.')}</p>
                        </div>
                        <div className="help-feature-card">
                            <BookOpen size={24} className="feat-icon" />
                            <h4>{t('teacherHelp.homework', 'Assign Homework')}</h4>
                            <p>{t('teacherHelp.homeworkDesc', 'Create and assign worksheets effortlessly.')}</p>
                        </div>
                    </div>

                    <div className="help-footer">
                        <button className="help-btn-primary" onClick={() => { 
                            soundEffects.playClick(); 
                            onClose(); 
                            navigate('/teacher/registration');
                        }}>
                            {t('teacherHelp.addStudentsBtn', 'Add Students')}
                        </button>
                        <button className="help-btn-secondary" onClick={() => { 
                            soundEffects.playClick(); 
                            onClose(); 
                            setTimeout(() => {
                                document.getElementById('academy-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 300);
                        }}>
                            {t('teacherHelp.practiceBtn', 'Start Practicing')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherHelpModal;
