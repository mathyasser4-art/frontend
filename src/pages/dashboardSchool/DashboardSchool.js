import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import TeachersList from '../../components/teachersList/TeachersList';
import { Link } from 'react-router-dom';
import { MessageCircle, AlertTriangle, Users, Trophy, Plus, FileText, Download, Calendar, Trash2 } from 'lucide-react';
import student from '../../img/student-bannar.png';
import teacher from '../../img/teacher-bannar.png';
import subject from '../../img/subject-bannar.PNG';
import sopreviser from '../../img/sopreviser-bannar.png';
import classes from '../../img/classes.png';
import IT from '../../img/it.png';
import API_BASE_URL from '../../config/api.config';
import { createCompetitionEvent, getSchoolCompetitionEvents, deleteCompetitionEvent } from '../../api/competitionEvent/competitionEvent.api';
import { jsPDF } from 'jspdf';
import '../../reusable.css';
import './DashboardSchool.css';

function DashboardSchool() {
    const role = localStorage.getItem('auth_role');
    const userName = localStorage.getItem('pp_name');
    const [reportCount, setReportCount] = useState(0);

    // Competition Event Cards state
    const [events, setEvents] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDate, setNewDate] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/question/reports`, {
                    headers: {
                        'authrization': `pracYas09${localStorage.getItem('O_authWEB')}`
                    }
                });
                const data = await response.json();
                if (data.message === 'success' && data.reports) {
                    setReportCount(data.reports.length);
                }
            } catch (err) {
                console.error('Failed to fetch question reports:', err);
            }
        };
        fetchReports();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await getSchoolCompetitionEvents();
            if (res.message === 'success') {
                setEvents(res.events || []);
            }
        } catch (err) {
            console.error('Failed to fetch competition events:', err);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setIsCreating(true);
        try {
            const res = await createCompetitionEvent({
                title: newTitle,
                description: newDesc,
                eventDate: newDate
            });
            if (res.message === 'success') {
                setNewTitle('');
                setNewDesc('');
                setNewDate('');
                setShowCreateModal(false);
                fetchEvents();
            }
        } catch (err) {
            console.error('Failed to create competition event:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this competition card?')) return;
        try {
            const res = await deleteCompetitionEvent(eventId);
            if (res.message === 'success') {
                fetchEvents();
            }
        } catch (err) {
            console.error('Failed to delete event:', err);
        }
    };

    // Word (.docx) Export Generator
    const handleExportWord = (eventCard) => {
        try {
            const title = eventCard.title || 'Competition Registration Report';
            const dateStr = eventCard.eventDate ? new Date(eventCard.eventDate).toLocaleDateString() : 'N/A';
            
            // Group registrations by teacher
            const teacherMap = {};
            (eventCard.registrations || []).forEach(r => {
                const tName = r.teacher?.userName || 'Teacher';
                if (!teacherMap[tName]) teacherMap[tName] = [];
                teacherMap[tName].push(r.student?.userName || 'Student');
            });

            let rowsHtml = '';
            Object.keys(teacherMap).forEach(tName => {
                rowsHtml += `<tr style="background-color: #f1f5f9;"><td colspan="2" style="padding: 10px; font-weight: bold; font-size: 14pt; color: #1e293b;">Teacher: ${tName} (${teacherMap[tName].length} Students)</td></tr>`;
                teacherMap[tName].forEach((sName, idx) => {
                    rowsHtml += `<tr><td style="padding: 8px; border: 1px solid #cbd5e1; width: 10%;">${idx + 1}</td><td style="padding: 8px; border: 1px solid #cbd5e1; width: 90%;">${sName}</td></tr>`;
                });
            });

            const wordHtml = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><title>${title}</title><style>body{font-family:Arial,sans-serif;} table{width:100%;border-collapse:collapse;margin-top:20px;}</style></head>
                <body>
                    <div style="text-align:center; padding: 20px;">
                        <h1 style="color:#2563eb;margin:0;">ABACUS HEROES</h1>
                        <h2 style="color:#475569;margin:5px 0;">${userName || 'School'} - Official Competition Roster</h2>
                        <h3 style="color:#0f172a;margin:15px 0;">${title}</h3>
                        <p style="font-size:12pt;color:#64748b;">Event Date: ${dateStr} | Total Enrolled Students: ${(eventCard.registrations || []).length}</p>
                    </div>
                    <hr/>
                    <table>
                        <thead>
                            <tr style="background:#2563eb;color:white;">
                                <th style="padding:10px;">#</th>
                                <th style="padding:10px;">Student Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml || '<tr><td colspan="2" style="padding:15px;text-align:center;">No registered students yet.</td></tr>'}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/\s+/g, '_')}_Word_Report.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export Word document:', err);
        }
    };

    // PDF Report Generator with Dual Logo Header
    const handleExportPDF = (eventCard) => {
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.width;

            // Top Header Header Banner
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, pageWidth, 75, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text("ABACUS HEROES", 40, 45);

            doc.setFontSize(13);
            doc.text((userName || "SCHOOL OFFICIAL REPORT").toUpperCase(), pageWidth - 40, 45, { align: 'right' });

            // Title & Meta
            let yPos = 110;
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(eventCard.title || "Competition Registration Report", pageWidth / 2, yPos, { align: 'center' });

            yPos += 22;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const dateStr = eventCard.eventDate ? new Date(eventCard.eventDate).toLocaleDateString() : 'N/A';
            doc.text(`Event Date: ${dateStr}   |   Total Enrolled Competitors: ${(eventCard.registrations || []).length}`, pageWidth / 2, yPos, { align: 'center' });

            yPos += 30;

            // Group by teacher
            const teacherMap = {};
            (eventCard.registrations || []).forEach(r => {
                const tName = r.teacher?.userName || 'Teacher';
                if (!teacherMap[tName]) teacherMap[tName] = [];
                teacherMap[tName].push(r.student?.userName || 'Student');
            });

            const teacherNames = Object.keys(teacherMap);
            if (teacherNames.length === 0) {
                doc.setFontSize(12);
                doc.setTextColor(148, 163, 184);
                doc.text("No students have been registered for this competition yet.", pageWidth / 2, yPos + 40, { align: 'center' });
            } else {
                teacherNames.forEach((tName) => {
                    if (yPos > 740) { doc.addPage(); yPos = 50; }

                    doc.setFillColor(241, 245, 249);
                    doc.rect(40, yPos, pageWidth - 80, 26, 'F');

                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(15, 23, 42);
                    doc.text(`Teacher: ${tName} (${teacherMap[tName].length} Students)`, 50, yPos + 18);

                    yPos += 34;

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(51, 65, 85);

                    teacherMap[tName].forEach((sName, idx) => {
                        if (yPos > 740) { doc.addPage(); yPos = 50; }
                        doc.text(`${idx + 1}. ${sName}`, 60, yPos);
                        yPos += 18;
                    });

                    yPos += 14;
                });
            }

            doc.save(`${(eventCard.title || 'Competition').replace(/\s+/g, '_')}_PDF_Report.pdf`);
        } catch (err) {
            console.error('Failed to export PDF report:', err);
        }
    };

    return (
        <>
            <MobileNav role={role} />
            <Navbar />
            <div className="dashboard-school">
                <div className="dashboard-school-header">
                    <p className='text-purple'>Welcome to</p>
                    <p>{userName} Dashboard</p>
                </div>
                <div className="dashboard-school-body">
                    <div className="fs-col d-flex justify-content-space-around align-items-center flex-wrap">
                        <Link to={'/dashboard-school/student'}><img src={student} alt="" /></Link>
                        <Link to={'/dashboard-school/teacher'}><img src={teacher} alt="" /></Link>
                        <Link to={'/dashboard-school/subject'}><img src={subject} alt="" /></Link>
                        <Link to={'/dashboard-school/supervisor'}><img src={sopreviser} alt="" /></Link>
                        <Link to={'/dashboard-school/class'}><img src={classes} alt="" /></Link>
                        {role === 'IT' ? <img src={IT} alt="" /> : <Link to={'/dashboard-school/it'}><img src={IT} alt="" /></Link>}
                        <Link to={'/dashboard-school/chats'} style={{ textDecoration: 'none' }}>
                            <div style={{
                                width: '250px', height: '120px', margin: '10px', 
                                background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', 
                                borderRadius: '15px', display: 'flex', flexDirection: 'column', 
                                alignItems: 'center', justifyContent: 'center', color: 'white',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <MessageCircle size={40} />
                                <h3 style={{ margin: '10px 0 0 0', fontFamily: 'sans-serif' }}>Live Chats</h3>
                            </div>
                        </Link>
                        <Link to={'/dashboard-school/live'} style={{ textDecoration: 'none' }}>
                            <div style={{
                                width: '250px', height: '120px', margin: '10px', 
                                background: 'linear-gradient(135deg, #10b981, #059669)', 
                                borderRadius: '15px', display: 'flex', flexDirection: 'column', 
                                alignItems: 'center', justifyContent: 'center', color: 'white',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                <Users size={40} />
                                <h3 style={{ margin: '10px 0 0 0', fontFamily: 'sans-serif' }}>Live Dashboard</h3>
                            </div>
                        </Link>
                        <Link to={'/dashboard-school/reported-questions'} style={{ textDecoration: 'none' }}>
                            <div style={{
                                width: '250px', height: '120px', margin: '10px', 
                                background: 'linear-gradient(135deg, #f59e0b, #ef4444)', 
                                borderRadius: '15px', display: 'flex', flexDirection: 'column', 
                                alignItems: 'center', justifyContent: 'center', color: 'white',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                position: 'relative'
                            }}>
                                <AlertTriangle size={40} />
                                <h3 style={{ margin: '10px 0 0 0', fontFamily: 'sans-serif' }}>Flagged Questions</h3>
                                {reportCount > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '-10px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                        border: '2px solid white'
                                    }}>
                                        {reportCount}
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* --- SCHOOL COMPETITION CARDS & EXPORT SECTION --- */}
                    <div style={{
                        marginTop: '40px',
                        padding: '30px',
                        background: '#ffffff',
                        borderRadius: '20px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Trophy color="#f59e0b" size={28} /> Official Competition Cards
                                </h2>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                                    Create competition cards for your school. Teachers can enroll students and you can export Word & PDF reports.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Link to="/teacher/competitions-hub" style={{ textDecoration: 'none' }}>
                                    <button style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 18px',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        🏆 View Teacher Hub
                                    </button>
                                </Link>
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 18px',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Plus size={18} /> Create Competition Card
                                </button>
                            </div>
                        </div>

                        {events.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                No competition cards published yet. Click "Create Competition Card" to publish your first tournament!
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '20px'
                            }}>
                                {events.map((evt) => {
                                    const totalCount = (evt.registrations || []).length;

                                    return (
                                        <div key={evt._id} style={{
                                            background: '#f8fafc',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '16px',
                                            padding: '20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{evt.title}</h3>
                                                    <button 
                                                        onClick={() => handleDeleteEvent(evt._id)}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                                        title="Delete Card"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px', lineHeight: '1.4' }}>
                                                    {evt.description || 'School competition tournament.'}
                                                </p>
                                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
                                                    {evt.eventDate && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={14} color="#f59e0b" />
                                                            <span>{new Date(evt.eventDate).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Users size={14} color="#2563eb" />
                                                        <span><strong>{totalCount}</strong> Enrolled</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleExportWord(evt)}
                                                    style={{
                                                        flex: 1,
                                                        background: '#2563eb',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        fontWeight: 'bold',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <FileText size={14} /> Word (.doc)
                                                </button>
                                                <button 
                                                    onClick={() => handleExportPDF(evt)}
                                                    style={{
                                                        flex: 1,
                                                        background: '#059669',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        fontWeight: 'bold',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <Download size={14} /> PDF Report
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <TeachersList />

                {/* Create Competition Card Modal */}
                {showCreateModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '30px',
                            maxWidth: '500px',
                            width: '100%',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Publish New Competition Card</h3>
                            <form onSubmit={handleCreateEvent}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                                        Competition Title *
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. National Soroban Championship 2026"
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                                        Description
                                    </label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Enter competition details or rules..."
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                                        Event Date
                                    </label>
                                    <input 
                                        type="date"
                                        value={newDate}
                                        onChange={e => setNewDate(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        style={{
                                            background: '#e2e8f0',
                                            color: '#475569',
                                            border: 'none',
                                            padding: '10px 18px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isCreating}
                                        style={{
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 18px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {isCreating ? 'Publishing...' : 'Publish Card'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default DashboardSchool;
