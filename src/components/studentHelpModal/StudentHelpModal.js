import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, GraduationCap, CheckCircle, Gamepad2, Trophy, Sparkles, BookOpen } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './StudentHelpModal.css';

const StudentHelpModal = ({ onClose }) => {
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
            <div className="student-help-card">
                <div className="help-header">
                    <div className="help-icon-title">
                        <GraduationCap size={32} color="#3b82f6" />
                        <h2>Student Adventure Hub</h2>
                    </div>
                    <button className="help-close" onClick={() => { soundEffects.playClick(); onClose(); }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="help-content">
                    <section className="help-section">
                        <h3>🚀 Your Superpowers on Abacus Heroes</h3>
                        <p>
                            Welcome to the most exciting math arena! Here, abacus learning and mental math become your ultimate game superpowers. Play games, earn rewards, and level up your math skills!
                        </p>
                    </section>

                    <div className="help-grid">
                        <div className="help-feature-card">
                            <Gamepad2 size={28} className="feat-icon blue-icon" />
                            <h4>Play Epic Games</h4>
                            <p>Race with jet skis, drive race cars, and run through caves while solving math puzzles.</p>
                        </div>
                        <div className="help-feature-card">
                            <BookOpen size={28} className="feat-icon purple-icon" />
                            <h4>Solve Homework</h4>
                            <p>No more boring worksheets! Solve your teacher's homework assignments directly on the platform with instant grading.</p>
                        </div>
                        <div className="help-feature-card">
                            <Trophy size={28} className="feat-icon gold-icon" />
                            <h4>Win Competitions</h4>
                            <p>Compete with students worldwide, top the leaderboards, and win awesome virtual prizes!</p>
                        </div>
                        <div className="help-feature-card">
                            <Sparkles size={28} className="feat-icon pink-icon" />
                            <h4>Motivating Environment</h4>
                            <p>Collect stars, level up your avatar, and unlock special badges as you practice daily.</p>
                        </div>
                    </div>

                    <section className="help-section hw-guide">
                        <h3>📚 How to Do Your Homework</h3>
                        <div className="guide-steps">
                            <div className="step-card">
                                <div className="step-number">1</div>
                                <div className="step-text">
                                    <strong>Log In</strong>
                                    <p>Log in using the student username and password provided by your teacher.</p>
                                </div>
                            </div>
                            <div className="step-card">
                                <div className="step-number">2</div>
                                <div className="step-text">
                                    <strong>Go to Homework</strong>
                                    <p>Click on the **📚 Homework** button in the menu bar to open your dashboard.</p>
                                </div>
                            </div>
                            <div className="step-card">
                                <div className="step-number">3</div>
                                <div className="step-text">
                                    <strong>Solve & Submit</strong>
                                    <p>Choose an active homework, solve the questions, and submit your answers directly when you are ready!</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="help-footer">
                    <button className="help-btn-primary" onClick={handleHomeworkClick}>
                        {isAuth && role === 'Student' ? '📚 GO TO MY HOMEWORK' : '🔑 LOGIN TO START HOMEWORK'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentHelpModal;
