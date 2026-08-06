import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import { getSchoolCompetitionEvents, registerStudentsForEvent } from '../../api/competitionEvent/competitionEvent.api';
import API_BASE_URL from '../../config/api.config';
import { Trophy, Calendar, Users, CheckCircle, Search, X } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './UpcomingCompetitionsHub.css';

function UpcomingCompetitionsHub() {
    const [events, setEvents] = useState([]);
    const [myStudents, setMyStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const teacherID = localStorage.getItem('pp_id');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('O_authWEB');
            const [eventsRes, studentsRes] = await Promise.all([
                getSchoolCompetitionEvents(),
                fetch(`${API_BASE_URL}/student/getStudent/1`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'authrization': `pracYas09${token}`
                    }
                }).then(r => r.json()).catch(() => ({ message: 'error' }))
            ]);

            if (eventsRes.message === 'success') {
                setEvents(eventsRes.events || []);
            }

            if (studentsRes && studentsRes.message === 'success' && Array.isArray(studentsRes.allStudent)) {
                setMyStudents(studentsRes.allStudent);
            }
        } catch (err) {
            console.error('Error fetching competitions hub data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSelector = (eventCard) => {
        soundEffects.playClick();
        setSelectedEvent(eventCard);

        // Pre-select students already registered by this teacher for this event
        const existingRegs = (eventCard.registrations || [])
            .filter(r => String(r.teacher?._id || r.teacher) === String(teacherID))
            .map(r => String(r.student?._id || r.student));

        setSelectedStudentIds(existingRegs);
    };

    const handleToggleStudent = (studentId) => {
        soundEffects.playClick();
        setSelectedStudentIds(prev => 
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        soundEffects.playClick();
        if (selectedStudentIds.length === filteredStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(filteredStudents.map(s => String(s._id)));
        }
    };

    const handleSubmitRegistration = async () => {
        if (!selectedEvent) return;
        soundEffects.playClick();
        setIsSubmitting(true);

        try {
            const res = await registerStudentsForEvent(selectedEvent._id, selectedStudentIds);
            if (res.message === 'success') {
                setToastMessage(`Successfully saved selection for "${selectedEvent.title}"!`);
                setTimeout(() => setToastMessage(null), 4000);
                setSelectedEvent(null);
                fetchData(); // Refresh list
            }
        } catch (err) {
            console.error('Failed to submit student registration:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStudents = myStudents.filter(s => {
        const name = (s.userName || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const query = searchTerm.toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    return (
        <div className="competitions-hub-global">
            <MobileNav role="Teacher" />
            <Navbar />

            <div className="competitions-hub-container">
                <div className="competitions-hub-header">
                    <h1>🏆 Upcoming Competitions Hub</h1>
                    <p>Select a competition card below to register and submit participating students from your classes.</p>
                </div>

                {toastMessage && (
                    <div style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        padding: '14px 24px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        textAlign: 'center',
                        fontWeight: '700',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                    }}>
                        ✓ {toastMessage}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        Loading competition cards...
                    </div>
                ) : events.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <Trophy size={48} color="#fbbf24" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '20px', color: '#f8fafc', margin: '0 0 8px 0' }}>No Upcoming Competition Cards Yet</h3>
                        <p style={{ color: '#94a3b8', margin: 0 }}>Your school account has not published any official competition cards yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="events-cards-grid">
                        {events.map((evt) => {
                            // Calculate total enrolled students for this event
                            const totalEnrolled = (evt.registrations || []).length;
                            const myEnrolledCount = (evt.registrations || [])
                                .filter(r => String(r.teacher?._id || r.teacher) === String(teacherID)).length;

                            return (
                                <div key={evt._id} className="event-card">
                                    <div>
                                        <div className="event-card-header">
                                            <span className="event-card-badge">Official Tournament</span>
                                            {myEnrolledCount > 0 && (
                                                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>
                                                    ✓ {myEnrolledCount} Selected
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="event-card-title">{evt.title}</h3>
                                        <p className="event-card-desc">{evt.description || 'School competition tournament.'}</p>
                                        <div className="event-card-meta">
                                            {evt.eventDate && (
                                                <div className="event-card-meta-item">
                                                    <Calendar size={15} color="#fbbf24" />
                                                    <span>{new Date(evt.eventDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            <div className="event-card-meta-item">
                                                <Users size={15} color="#38bdf8" />
                                                <span>{totalEnrolled} Total Enrolled</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        className="select-students-btn"
                                        onClick={() => handleOpenSelector(evt)}
                                    >
                                        <CheckCircle size={16} />
                                        <span>Select Participating Students</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Student Selector Checklist Modal */}
            {selectedEvent && (
                <div className="selector-modal-overlay">
                    <div className="selector-modal-card">
                        <div className="selector-modal-header">
                            <div>
                                <h3>{selectedEvent.title}</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                                    Check off your students who will participate in this competition.
                                </p>
                            </div>
                            <button className="selector-modal-close" onClick={() => setSelectedEvent(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="selector-modal-body">
                            {/* Search and Select All controls */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '8px 14px'
                                }}>
                                    <Search size={16} color="#94a3b8" />
                                    <input 
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            color: '#f8fafc',
                                            width: '100%',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={handleSelectAll}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        color: '#f8fafc',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {selectedStudentIds.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            {filteredStudents.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0' }}>
                                    No students found.
                                </p>
                            ) : (
                                <div className="students-checklist-grid">
                                    {filteredStudents.map((student) => {
                                        const sId = String(student._id);
                                        const isSelected = selectedStudentIds.includes(sId);

                                        return (
                                            <div 
                                                key={sId}
                                                className={`student-check-row ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleToggleStudent(sId)}
                                            >
                                                <div className="student-check-info">
                                                    <div className="student-check-avatar">
                                                        {student.userName?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="student-check-name">{student.userName}</div>
                                                        {student.email && <div className="student-check-email">{student.email}</div>}
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="selector-modal-footer">
                            <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                                Selected: <strong style={{ color: '#fbbf24' }}>{selectedStudentIds.length}</strong> students
                            </span>
                            <button 
                                className="submit-registration-btn"
                                onClick={handleSubmitRegistration}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Submit Selection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UpcomingCompetitionsHub;
