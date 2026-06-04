import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import TeacherRegistration from '../../components/teacherRegistration/TeacherRegistration';
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, CheckCircle2, Search, Edit3 } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import addStudent from '../../api/student/addStudent.api';
import getStudent from '../../api/student/getStudent.api';
import updateStudent from '../../api/student/updateStudent.api';
import removeStudent from '../../api/student/removeStudent.api';
import searchStudent from '../../api/student/searchStudent.api';
import getTeacherClass from '../../api/teacher/getClass.api';
import './TeacherRegistrationPage.css';

function TeacherRegistrationPage() {
    // Shared States
    const role = localStorage.getItem('auth_role');
    const teacherId = localStorage.getItem('pp_id');
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'direct'

    // Tab 1: Registration Files States
    const [registrations, setRegistrations] = useState([]);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [expandedRecords, setExpandedRecords] = useState({});

    // Tab 2: Direct Student Accounts States
    const [directStudents, setDirectStudents] = useState([]);
    const [directLoading, setDirectLoading] = useState(false);
    const [directTotalPages, setDirectTotalPages] = useState(1);
    const [directPageNumber, setDirectPageNumber] = useState(1);
    const [directStudentNumber, setDirectStudentNumber] = useState(0);
    const [directClasses, setDirectClasses] = useState([]);
    const [classesLoading, setClassesLoading] = useState(false);

    // Form inputs for direct modals
    const [showDirectAdd, setShowDirectAdd] = useState(false);
    const [showDirectUpdate, setShowDirectUpdate] = useState(false);
    const [directName, setDirectName] = useState('');
    const [directEmail, setDirectEmail] = useState('');
    const [directPassword, setDirectPassword] = useState('');
    const [directClass, setDirectClass] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [directError, setDirectError] = useState(null);
    const [directSaving, setDirectSaving] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        loadRegistrations();
        window.addEventListener('teachersUpdated', loadRegistrations);
        window.addEventListener('teacherDataUpdated', loadRegistrations);
        return () => {
            window.removeEventListener('teachersUpdated', loadRegistrations);
            window.removeEventListener('teacherDataUpdated', loadRegistrations);
        };
    }, []);

    // Load direct students when entering Tab 2 or changing page
    useEffect(() => {
        if (activeTab === 'direct') {
            loadDirectStudents();
        }
    }, [activeTab, directPageNumber]);

    // Load classes list when loaded
    useEffect(() => {
        if (role === 'Teacher') {
            getTeacherClass(setClassesLoading, setDirectClasses);
        }
    }, [role]);

    // Tab 1: File registration loader
    const loadRegistrations = () => {
        const savedTeachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
        const filtered = savedTeachers.filter(r => r.submittedByTeacherId === teacherId);
        setRegistrations(filtered);
    };

    // Tab 2: Direct account loader
    const loadDirectStudents = () => {
        getStudent(setDirectLoading, setDirectStudents, directPageNumber, setDirectStudentNumber, setDirectTotalPages);
    };

    const toggleExpand = (index) => {
        setExpandedRecords(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Tab 1: Save request
    const handleSaveTeacher = (data) => {
        const teacherName = localStorage.getItem('pp_name') || data.teacherName;
        const newRecord = {
            ...data,
            submittedByTeacherId: teacherId,
            submittedByTeacherName: teacherName,
            status: 'under_construction',
        };

        const existingTeachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
        existingTeachers.push(newRecord);
        localStorage.setItem('school_teachers', JSON.stringify(existingTeachers));

        soundEffects.playClick();
        setShowRegisterForm(false);
        
        window.dispatchEvent(new CustomEvent('teachersUpdated'));
        window.dispatchEvent(new CustomEvent('teacherDataUpdated'));
    };

    // Tab 1: Delete request
    const deleteRegistration = (index) => {
        if (window.confirm('Are you sure you want to delete this student registration record?')) {
            const savedTeachers = JSON.parse(localStorage.getItem('school_teachers') || '[]');
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

    // Tab 2: Open Direct Add Modals
    const openAddDirectPopup = () => {
        setDirectName('');
        setDirectEmail('');
        setDirectPassword('');
        setDirectClass('');
        setDirectError(null);
        setShowDirectAdd(true);
    };

    // Tab 2: Open Direct Update Modal
    const openUpdateDirectPopup = (student) => {
        setSelectedStudentId(student._id);
        setDirectName(student.userName);
        setDirectEmail(student.email);
        setDirectClass(student.class ? student.class.class : '');
        setDirectPassword('');
        setDirectError(null);
        setShowDirectUpdate(true);
    };

    // Tab 2: Direct Add Student Submission
    const handleAddDirectStudent = () => {
        if (directName.trim() === '' || directEmail.trim() === '' || directPassword.trim() === '') {
            setDirectError('All fields are required!');
            return;
        }

        let data = {
            userName: directName,
            email: directEmail,
            password: directPassword
        };

        if (directClass && directClass !== 'Select Class') {
            const classObj = directClasses.find(c => c.class === directClass);
            if (classObj) {
                data.class = classObj._id;
            }
        }

        setDirectError(null);
        addStudent(
            data,
            setDirectError,
            setDirectSaving,
            () => {
                setShowDirectAdd(false);
                loadDirectStudents();
            },
            directPageNumber,
            setDirectStudents,
            setDirectStudentNumber,
            setDirectTotalPages
        );
    };

    // Tab 2: Direct Update Student Submission
    const handleUpdateDirectStudent = () => {
        if (directName.trim() === '' || directEmail.trim() === '') {
            setDirectError('Name and Email are required!');
            return;
        }

        let data = {
            userName: directName,
            email: directEmail
        };
        if (directPassword.trim() !== '') {
            data.password = directPassword;
        }

        if (directClass && directClass !== 'Select Class') {
            const classObj = directClasses.find(c => c.class === directClass);
            if (classObj) {
                data.class = classObj._id;
            }
        }

        setDirectError(null);
        updateStudent(
            data,
            setDirectError,
            setDirectSaving,
            () => {
                setShowDirectUpdate(false);
                loadDirectStudents();
            },
            directPageNumber,
            setDirectStudents,
            setDirectStudentNumber,
            selectedStudentId,
            setDirectTotalPages
        );
    };

    // Tab 2: Direct Delete Student Account
    const handleDeleteDirect = (studentID) => {
        if (window.confirm('Are you sure you want to permanently delete this student account?')) {
            removeStudent(
                studentID,
                setDirectError,
                setDirectLoading,
                () => { loadDirectStudents(); },
                directPageNumber,
                setDirectStudents,
                setDirectStudentNumber,
                setDirectTotalPages
            );
        }
    };

    // Tab 2: Direct Search Student
    const searchDirect = (searchKey) => {
        setSearchValue(searchKey);
        if (searchKey === '') {
            loadDirectStudents();
        } else {
            searchStudent(setDirectLoading, setDirectStudents, searchKey);
        }
    };

    const nextDirectPage = () => {
        if (directPageNumber !== directTotalPages) {
            setDirectPageNumber(directPageNumber + 1);
        }
    };

    const prevDirectPage = () => {
        if (directPageNumber !== 1) {
            setDirectPageNumber(directPageNumber - 1);
        }
    };

    return (
        <>
            <MobileNav role={role} />
            <Navbar />
            <div className="teacher-reg-page-container">
                
                {/* Segmented Tab Controls */}
                {role === 'Teacher' && (
                    <div className="segmented-tabs-wrapper" style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.03)', padding: '5px', borderRadius: '12px', maxWidth: '420px', marginBottom: '2.5rem' }}>
                        <button 
                            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                            onClick={() => { soundEffects.playClick(); setActiveTab('requests'); }}
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                border: 'none',
                                borderRadius: '8px',
                                background: activeTab === 'requests' ? '#10b981' : 'transparent',
                                color: activeTab === 'requests' ? '#fff' : '#64748b',
                                fontWeight: '750',
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                boxShadow: activeTab === 'requests' ? '0 4px 10px rgba(16, 185, 129, 0.2)' : 'none'
                            }}
                        >
                            📋 Registration Requests
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
                            onClick={() => { soundEffects.playClick(); setActiveTab('direct'); }}
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                border: 'none',
                                borderRadius: '8px',
                                background: activeTab === 'direct' ? '#10b981' : 'transparent',
                                color: activeTab === 'direct' ? '#fff' : '#64748b',
                                fontWeight: '750',
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                boxShadow: activeTab === 'direct' ? '0 4px 10px rgba(16, 185, 129, 0.2)' : 'none'
                            }}
                        >
                            ⚡ Direct Student Accounts
                        </button>
                    </div>
                )}

                {activeTab === 'requests' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        {/* Direct Accounts Tab Content */}
                        <div className="teacher-reg-header d-flex justify-content-space-between align-items-center">
                            <div>
                                <h1 className="teacher-reg-title" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>⚡ Direct Student Accounts</h1>
                                <p className="teacher-reg-subtitle">Directly manage, create, and search student credentials.</p>
                            </div>
                            <button 
                                className="btn-register-new d-flex align-items-center" 
                                onClick={openAddDirectPopup}
                                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 4px 0 #1e3a8a, 0 8px 16px rgba(59, 130, 246, 0.25)' }}
                            >
                                <Plus size={18} /> Add Student Directly
                            </button>
                        </div>

                        {/* Search Control */}
                        <div className="d-flex align-items-center" style={{ marginBottom: '1.5rem', width: '100%', gap: '15px', position: 'relative' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input 
                                    type="text" 
                                    onChange={(e) => searchDirect(e.target.value)} 
                                    placeholder='Search students by username...' 
                                    style={{ width: '100%', padding: '12px 20px 12px 45px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Direct Table */}
                        {directLoading ? (
                            <div className="text-center" style={{ padding: '4rem 2rem' }}>
                                <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
                                <p style={{ color: '#64748b', fontWeight: '600' }}>Loading students list...</p>
                            </div>
                        ) : (
                            <div className="student-body" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(12px)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.5)', overflowX: 'auto', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.03)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.06)', color: '#475569', fontWeight: '850', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            <th style={{ padding: '14px 12px' }}>#</th>
                                            <th style={{ padding: '14px 12px' }}>Name</th>
                                            <th style={{ padding: '14px 12px' }}>Email</th>
                                            <th style={{ padding: '14px 12px' }}>Class Group</th>
                                            <th style={{ padding: '14px 12px', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {directStudents?.map((item, idx) => (
                                            <tr key={item._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.98rem', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '14px 12px', color: '#64748b', fontWeight: '600' }}>{((directPageNumber - 1) * 20) + idx + 1}</td>
                                                <td style={{ padding: '14px 12px', fontWeight: '800', color: '#1e293b' }}>👤 {item.userName}</td>
                                                <td style={{ padding: '14px 12px', color: '#475569' }}>{item.email}</td>
                                                <td style={{ padding: '14px 12px' }}>
                                                    <span style={{ background: item.class ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0,0,0,0.05)', color: item.class ? '#2563eb' : '#64748b', fontSize: '0.8rem', fontWeight: '800', padding: '4px 10px', borderRadius: '8px' }}>
                                                        {item.class ? item.class.class : 'No Class'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button 
                                                            onClick={() => { soundEffects.playClick(); openUpdateDirectPopup(item); }}
                                                            style={{ background: 'rgba(59, 130, 246, 0.08)', border: 'none', color: '#2563eb', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '750', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Edit3 size={13} /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => { soundEffects.playClick(); handleDeleteDirect(item._id); }}
                                                            style={{ background: 'rgba(239, 68, 68, 0.08)', border: 'none', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '750', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Trash2 size={13} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(!directStudents || directStudents.length === 0) && (
                                    <div className="text-center" style={{ padding: '3rem', color: '#64748b', fontWeight: '600' }}>
                                        No student accounts found. Click "Add Student Directly" to create one!
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Direct Table Pagination */}
                        {!directLoading && searchValue === '' && directStudents?.length > 0 && (
                            <div className="student-footer d-flex align-items-center justify-content-center" style={{ gap: '15px', marginTop: '2rem' }}>
                                <button 
                                    onClick={prevDirectPage} 
                                    disabled={directPageNumber === 1}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: directPageNumber === 1 ? 'rgba(0,0,0,0.03)' : '#fff', cursor: directPageNumber === 1 ? 'not-allowed' : 'pointer', fontWeight: '700' }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontWeight: '750', color: '#475569' }}>Page {directPageNumber} of {directTotalPages}</span>
                                <button 
                                    onClick={nextDirectPage} 
                                    disabled={directPageNumber === directTotalPages}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: directPageNumber === directTotalPages ? 'rgba(0,0,0,0.03)' : '#fff', cursor: directPageNumber === directTotalPages ? 'not-allowed' : 'pointer', fontWeight: '700' }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showRegisterForm && (
                <TeacherRegistration 
                    onClose={() => setShowRegisterForm(false)} 
                    onSave={handleSaveTeacher}
                />
            )}

            {/* Direct Add Student Modal */}
            {showDirectAdd && (
                <div className="upgrade-overlay" onClick={() => setShowDirectAdd(false)}>
                    <div className="upgrade-modal-card animate-comp-pop-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '2rem', borderRadius: '24px', position: 'relative' }}>
                        <button className="upgrade-close-btn" onClick={() => setShowDirectAdd(false)} style={{ fontSize: '24px', top: '15px', right: '15px' }}>×</button>
                        <div className="upgrade-modal-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>👤</span>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: '850', color: '#1e293b', margin: 0 }}>Add Student Account</h2>
                            <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Directly create a student account under your school</p>
                        </div>
                        {directError && (
                            <div className="error error-dengare" style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.9rem', textAlign: 'left' }}>
                                ⚠️ {directError}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', width: '100%' }}>
                            <div>
                                <label style={{ fontWeight: '800', fontSize: '0.88rem', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Username</label>
                                <input 
                                    type="text" 
                                    value={directName} 
                                    onChange={(e) => {
                                        setDirectName(e.target.value);
                                        const cleanUsername = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                                        if (cleanUsername) {
                                            setDirectEmail(`${cleanUsername}@abacusheroes.com`);
                                        } else {
                                            setDirectEmail('');
                                        }
                                    }} 
                                    placeholder="e.g. mahmoud12"
                                    style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: '800', fontSize: '0.88rem', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Email</label>
                                <input 
                                    type="email" 
                                    value={directEmail} 
                                    onChange={(e) => setDirectEmail(e.target.value)} 
                                    placeholder="e.g. mahmoud@school.com"
                                    style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: '800', fontSize: '0.88rem', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                                <input 
                                    type="text" 
                                    value={directPassword} 
                                    onChange={(e) => setDirectPassword(e.target.value)} 
                                    placeholder="Set account password..."
                                    style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: '800', fontSize: '0.88rem', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class Group</label>
                                <select 
                                    value={directClass} 
                                    onChange={(e) => setDirectClass(e.target.value)}
                                    style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', background: '#fff', outline: 'none' }}
                                >
                                    <option>Select Class</option>
                                    {directClasses?.map(c => (
                                        <option key={c._id}>{c.class}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '1.75rem' }}>
                            <button className="upgrade-btn-secondary" onClick={() => setShowDirectAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '750' }}>Cancel</button>
                            <button className="upgrade-btn-primary" onClick={handleAddDirectStudent} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: 'none', fontWeight: '750' }} disabled={directSaving}>
                                {directSaving ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Update Student Modal */}
            {showDirectUpdate && (
                <div className="upgrade-overlay" onClick={() => setShowDirectUpdate(false)}>
                    <div className="upgrade-modal-card animate-comp-pop-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '2rem', borderRadius: '24px', position: 'relative' }}>
                        <button className="upgrade-close-btn" onClick={() => setShowDirectUpdate(false)} style={{ fontSize: '24px', top: '15px', right: '15px' }}>×</button>
                        <div className="upgrade-modal-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📝</span>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: '850', color: '#1e293b', margin: 0 }}>Update Student Account</h2>
                            <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Modify username, email, class group, or password</p>
                        </div>
                        {directError && (
                            <div className="error error-dengare" style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.9rem', textAlign: 'left' }}>
                                ⚠️ {directError}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', width: '100%' }}>
                            <div>
                                <label style={{ fontWeight: '800', fontSize: '0.88rem', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Username</label>
                                <input 
                                    type="text" 
                                    value={directName} 
                                    onChange={(e) => setDirectName(e.target.value)} 
                                    style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: '800', fontSize: '0.88rem', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Email</label>
                                <input 
                                    type="email" 
                                    value={directEmail} 
                                    onChange={(e) => setDirectEmail(e.target.value)} 
                                    style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: '800', fontSize: '0.88rem', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Password (Leave blank to keep same)</label>
                                <input 
                                    type="text" 
                                    value={directPassword} 
                                    onChange={(e) => setDirectPassword(e.target.value)} 
                                    placeholder="Enter new password to change..."
                                    style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontWeight: '800', fontSize: '0.88rem', color: '#475569', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class Group</label>
                                <select 
                                    value={directClass} 
                                    onChange={(e) => setDirectClass(e.target.value)}
                                    style={{ width: '100%', padding: '11px 15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', background: '#fff', outline: 'none' }}
                                >
                                    <option>Select Class</option>
                                    {directClasses?.map(c => (
                                        <option key={c._id}>{c.class}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '1.75rem' }}>
                            <button className="upgrade-btn-secondary" onClick={() => setShowDirectUpdate(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '750' }}>Cancel</button>
                            <button className="upgrade-btn-primary" onClick={handleUpdateDirectStudent} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: 'none', fontWeight: '750' }} disabled={directSaving}>
                                {directSaving ? 'Saving...' : 'Update Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default TeacherRegistrationPage;
