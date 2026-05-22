import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import TeacherRegistration from '../../components/teacherRegistration/TeacherRegistration';
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './TeacherRegistrationPage.css';

function TeacherRegistrationPage() {
    const [registrations, setRegistrations] = useState([]);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [expandedRecords, setExpandedRecords] = useState({});
    const role = localStorage.getItem('auth_role');
    const teacherId = localStorage.getItem('pp_id');

    useEffect(() => {
        loadRegistrations();
        window.addEventListener('teachersUpdated', loadRegistrations);
        window.addEventListener('teacherDataUpdated', loadRegistrations);
        return () => {
            window.removeEventListener('teachersUpdated', loadRegistrations);
            window.removeEventListener('teacherDataUpdated', loadRegistrations);
        };
    }, []);

    const loadRegistrations = () => {
        const savedTeachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
        // Filter registrations submitted by this teacher
        const filtered = savedTeachers.filter(r => r.submittedByTeacherId === teacherId);
        setRegistrations(filtered);
    };

    const toggleExpand = (index) => {
        setExpandedRecords(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleSaveTeacher = (data) => {
        const teacherName = localStorage.getItem('pp_name') || data.teacherName;
        const newRecord = {
            ...data,
            submittedByTeacherId: teacherId,
            submittedByTeacherName: teacherName,
            status: 'under_construction', // Default status: Orange dot
        };

        const existingTeachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
        existingTeachers.push(newRecord);
        localStorage.setItem('school_teachers', JSON.stringify(existingTeachers));

        soundEffects.playClick();
        setShowRegisterForm(false);
        
        // Dispatch events so everything updates
        window.dispatchEvent(new CustomEvent('teachersUpdated'));
        window.dispatchEvent(new CustomEvent('teacherDataUpdated'));
    };

    const deleteRegistration = (index) => {
        if (window.confirm('Are you sure you want to delete this student registration record?')) {
            const savedTeachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
            
            // Find the global index of the item we want to delete
            // Since we filtered by teacherId, we need to map filtered index back to global index
            const filteredItem = registrations[index];
            const globalIndex = savedTeachers.findIndex(t => 
                t.submittedByTeacherId === teacherId && 
                t.createdAt === filteredItem.createdAt &&
                t.teacherName === filteredItem.teacherName
            );

            if (globalIndex !== -1) {
                savedTeachers.splice(globalIndex, 1);
                localStorage.setItem('school_teachers', JSON.stringify(savedTeachers));
                loadRegistrations();
                window.dispatchEvent(new CustomEvent('teachersUpdated'));
            }
        }
    };

    return (
        <>
            <MobileNav role={role} />
            <Navbar />
            <div className="teacher-reg-page-container">
                <div className="teacher-reg-header d-flex justify-content-space-between align-items-center">
                    <div>
                        <h1 className="teacher-reg-title">📋 Student Registration Files</h1>
                        <p className="teacher-reg-subtitle">Register your classes and track account creation progress.</p>
                    </div>
                    <button 
                        className="btn-register-new d-flex align-items-center" 
                        onClick={() => { soundEffects.playClick(); setShowRegisterForm(true); }}
                    >
                        <Plus size={18} /> Register New Class
                    </button>
                </div>

                {registrations.length === 0 ? (
                    <div className="empty-registrations-card text-center">
                        <div className="empty-icon">📁</div>
                        <h3>No Registrations Found</h3>
                        <p>Click "Register New Class" above to submit student names for account creation.</p>
                    </div>
                ) : (
                    <div className="registrations-grid">
                        {registrations.map((record, index) => {
                            const isExpanded = expandedRecords[index];
                            const isReady = record.status === 'ready';

                            return (
                                <div key={index} className={`registration-card ${isReady ? 'ready-card' : 'pending-card'}`}>
                                    <div className="registration-card-header d-flex justify-content-space-between align-items-center">
                                        <div className="registration-main-info">
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <h3 className="teacher-name-tag">👨‍🏫 {record.teacherName}</h3>
                                                <div className={`status-badge ${isReady ? 'status-ready' : 'status-pending'}`}>
                                                    <span className={`status-dot-indicator ${isReady ? 'dot-green' : 'dot-orange'}`}></span>
                                                    {isReady ? (
                                                        <span className="status-text d-flex align-items-center gap-1">
                                                            <CheckCircle2 size={13} /> Accounts Ready
                                                        </span>
                                                    ) : (
                                                        <span className="status-text d-flex align-items-center gap-1">
                                                            <Clock size={13} /> Under Construction
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="registration-details-meta">
                                                <span>{record.groups.length} Group{record.groups.length !== 1 ? 's' : ''}</span>
                                                {record.createdAt && (
                                                    <span className="meta-divider">|</span>
                                                )}
                                                {record.createdAt && (
                                                    <span>Submitted: {new Date(record.createdAt).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="registration-card-actions d-flex align-items-center">
                                            <button 
                                                className="btn-toggle-expand" 
                                                onClick={() => { soundEffects.playClick(); toggleExpand(index); }}
                                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                                            >
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                            <button 
                                                className="btn-delete-record" 
                                                onClick={() => { soundEffects.playClick(); deleteRegistration(index); }}
                                                title="Delete Registration"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="registration-card-body">
                                            <div className="teacher-credentials-viewer">
                                                <label className="credentials-view-label">🔑 Student Usernames & Passwords:</label>
                                                {record.credentials ? (
                                                    <pre className="credentials-view-content">{record.credentials}</pre>
                                                ) : (
                                                    <p className="credentials-view-pending">Pending school declaration</p>
                                                )}
                                            </div>
                                            <div className="groups-container">
                                                {record.groups.map((group, gIdx) => (
                                                    <div key={gIdx} className="group-detail-box">
                                                        <div className="group-detail-header d-flex align-items-center">
                                                            <span className="group-tag">Class Group</span>
                                                            <h4>{group.groupName}</h4>
                                                            <span className="student-count-tag">{group.students.length} Students</span>
                                                        </div>
                                                        <div className="group-students-grid">
                                                            {group.students.map((student, sIdx) => (
                                                                <div key={sIdx} className="student-detail-item d-flex align-items-center">
                                                                    <span className="student-bullet"></span>
                                                                    <span>{student}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showRegisterForm && (
                <TeacherRegistration 
                    onClose={() => setShowRegisterForm(false)} 
                    onSave={handleSaveTeacher}
                />
            )}
        </>
    );
}

export default TeacherRegistrationPage;
