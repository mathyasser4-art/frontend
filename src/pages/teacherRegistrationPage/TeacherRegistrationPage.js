import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import { Plus, Trash2, Search, Edit3 } from 'lucide-react';
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

    // Tab 2: Direct Student Accounts States
    const [directStudents, setDirectStudents] = useState([]);
    const [directLoading, setDirectLoading] = useState(false);
    const [directTotalPages, setDirectTotalPages] = useState(1);
    const [directPageNumber, setDirectPageNumber] = useState(1);
    const [directClasses, setDirectClasses] = useState([]);

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

    // Load direct students when page changes
    useEffect(() => {
        loadDirectStudents();
    }, [directPageNumber]);

    // Load classes list when loaded
    useEffect(() => {
        if (role === 'Teacher') {
            getTeacherClass(() => {}, setDirectClasses);
        }
    }, [role]);

    // Tab 2: Direct account loader
    const loadDirectStudents = () => {
        getStudent(setDirectLoading, setDirectStudents, directPageNumber, () => {}, setDirectTotalPages);
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
            () => {},
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
            () => {},
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
                () => {},
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
                
                {/* Direct Accounts Content */}
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
                    <div className="d-flex align-items-center justify-content-center" style={{ gap: '15px', marginTop: '2rem' }}>
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
            </div>



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
