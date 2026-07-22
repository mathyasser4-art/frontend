import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, GraduationCap, CheckCircle, Users, BookOpen } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './TeacherHelpModal.css';

const TeacherHelpModal = ({ onClose }) => {
    const navigate = useNavigate();

    return (
        <div className="teacher-help-overlay">
            <div className="teacher-help-card">
                <div className="help-header">
                    <div className="help-icon-title">
                        <GraduationCap size={32} color="#ff4757" />
                        <h2>Teacher Excellence Hub</h2>
                    </div>
                    <button className="help-close" onClick={() => { soundEffects.playClick(); onClose(); }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="help-content">
                    <section className="help-section">
                        <h3>🚀 How Abacus Heroes Works</h3>
                        <p>
                            Welcome to the ultimate platform for abacus education! We combine **fun gameplay** with **structured learning**. 
                            Students solve math challenges to progress in games, ensuring constant practice while they have fun.
                        </p>
                    </section>

                    <section className="help-section step-by-step">
                        <h3>🛠️ Step-by-Step Guide for Teachers</h3>
                        
                        {/* Step 1 */}
                        <div className="step-item">
                            <span className="step-number">1</span>
                            <div className="step-content-box">
                                <div className="step-desc">
                                    <strong>Enter Question Pages:</strong> Click <strong>"START PRACTICING NOW 🚀"</strong> below or select the **Academy Section** on the home page. Choose a Level/Subject and click a Unit/Chapter to enter its worksheets.
                                </div>
                                <div className="step-media">
                                    <img src="/img/step1_enter_academy.png" alt="Step 1 Preview" className="step-screenshot-inline" />
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="step-item">
                            <span className="step-number">2</span>
                            <div className="step-content-box">
                                <div className="step-desc">
                                    <strong>Solve & Test Questions:</strong> Use the interactive **Virtual Abacus** and onscreen custom numeric keyboard to practice and test the questions exactly as students see them.
                                </div>
                                <div className="step-media">
                                    <img src="/img/step2_test_solve.png" alt="Step 2 Preview" className="step-screenshot-inline" />
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="step-item">
                            <span className="step-number">3</span>
                            <div className="step-content-box">
                                <div className="step-desc">
                                    <strong>Assign Homework:</strong> While viewing questions, click <strong>"Add to Pocket"</strong> (for individual questions) or <strong>"Add All to Pocket"</strong> (to grab the entire worksheet). Open your **Question Pocket** (bag icon), select your classes, set a title & timer, and click <strong>"Create Assignment"</strong> to instantly assign it!
                                </div>
                                <div className="step-media">
                                    <img src="/img/step3_assign_homework.png" alt="Step 3 Preview" className="step-screenshot-inline" />
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="step-item">
                            <span className="step-number">4</span>
                            <div className="step-content-box">
                                <div className="step-desc">
                                    <strong>Track Progress & Reports:</strong> Assigned homework is uploaded and sent to your linked students' dashboards. Once they complete the homework, you will instantly receive a detailed report for every student as well as a combined class report with performance insights!
                                </div>
                                <div className="step-media">
                                    <img src="/img/step4_track_reports.png" alt="Step 4 Preview" className="step-screenshot-inline" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="help-grid">
                        <div className="help-feature-card">
                            <Users size={24} className="feat-icon" />
                            <h4>Student Management</h4>
                            <p>Easily create and manage student accounts. Each student gets their own login to track progress.</p>
                        </div>
                        <div className="help-feature-card">
                            <BookOpen size={24} className="feat-icon" />
                            <h4>Smart Homework</h4>
                            <p>Assign online homework tailored to each level. Students complete it through interactive games.</p>
                        </div>
                        <div className="help-feature-card">
                            <CheckCircle size={24} className="feat-icon" />
                            <h4>Auto-Correction</h4>
                            <p>No more manual grading! Our system automatically checks and corrects homework in real-time.</p>
                        </div>
                    </div>

                    <section className="help-section registration-info">
                        <h3>📋 Quick Student Registration</h3>
                        <p>
                            Simply fill out the **Registration List** with your students' names. 
                            Our system will automatically generate unique accounts for every student you add!
                        </p>
                        <div className="screenshot-container">
                            <img src="/img/registration_form_real.png" alt="Registration List Preview" className="help-screenshot" />
                            <div className="screenshot-caption">Fill this list to create student accounts instantly!</div>
                            <button 
                                className="help-btn-secondary registration-btn" 
                                style={{ marginTop: '1.2rem', width: '100%', borderRadius: '15px' }}
                                onClick={() => {
                                    soundEffects.playClick();
                                    onClose();
                                    navigate('/teacher/registration');
                                }}
                            >
                                📋 GO TO REGISTRATION FILE ➜
                            </button>
                        </div>
                    </section>

                    <section className="help-section features-cta">
                        <h3>Discover Unlimited Possibilities</h3>
                        <p>
                            There is so much more to explore! From advanced reporting to student engagement tools, 
                            discover how our features can transform your classroom.
                        </p>
                        <div className="cta-action">
                            <button className="help-btn-secondary" onClick={() => { 
                                soundEffects.playClick(); 
                                onClose();
                                setTimeout(() => {
                                    document.getElementById('discover-features-title')?.scrollIntoView({ behavior: 'smooth' });
                                }, 300);
                            }}>
                                🚀 EXPLORE ALL FEATURES
                            </button>
                        </div>
                    </section>
                </div>

                <div className="help-footer">
                    <button className="help-btn-primary" onClick={() => { 
                        soundEffects.playClick(); 
                        onClose(); 
                        setTimeout(() => {
                            document.getElementById('academy-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                    }}>
                        START PRACTICING NOW 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherHelpModal;
