import React from 'react';
import { X, GraduationCap, CheckCircle, Users, BookOpen } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './TeacherHelpModal.css';

const TeacherHelpModal = ({ onClose }) => {
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
                    <button className="help-btn-primary" onClick={() => { soundEffects.playClick(); onClose(); }}>
                        GOT IT, THANKS!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherHelpModal;
