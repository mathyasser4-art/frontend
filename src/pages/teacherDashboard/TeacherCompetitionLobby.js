import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Pusher from 'pusher-js';
import { getCompetitionDetails, startCompetition, finishCompetition, joinCompetition, removeParticipant } from '../../api/competition/competition.api';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import API_BASE_URL from '../../config/api.config';
import { Play, Users, Trophy, Flag, Timer, Award, CheckCircle } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import Confetti from 'react-confetti';
import { jsPDF } from 'jspdf';
import './TeacherCompetitionLobby.css';
import CertificateModal from '../../components/certificate/CertificateModal';

// Helper to extract participant ID safely (handling populated student object, ObjectId string, and guestId)
const getParticipantId = (p) => {
    if (!p) return null;
    if (typeof p === 'string') return p;
    return p.student?._id || (typeof p.student === 'string' ? p.student : null) || p.guestId || p._id || null;
};

// Helper to extract student display name safely for authenticated users and guests
const getStudentName = (p) => {
    if (!p) return "Student";
    if (p.student?.userName) return p.student.userName;
    if (p.guestName) return p.guestName;
    if (typeof p.student === 'string') return p.student;
    return "Student";
};

// Helper to format elapsed time in minutes, seconds and milliseconds
const formatElapsedMs = (finishedAt, startedAt) => {
    if (!finishedAt || !startedAt) return "—";
    const diffMs = new Date(finishedAt) - new Date(startedAt);
    if (diffMs < 0) return "—";
    
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    const ms = diffMs % 1000;
    
    let formatted = "";
    if (mins > 0) {
        formatted += `${mins}min `;
    }
    formatted += `${secs}s ${ms}ms`;
    return `${formatted} (${diffMs.toLocaleString()} ms)`;
};

function TeacherCompetitionLobby() {
    const { competitionId } = useParams();
    const [competition, setCompetition] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [status, setStatus] = useState('lobby');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [triggerConfetti, setTriggerConfetti] = useState(false);
    const [selectedStudentReport, setSelectedStudentReport] = useState(null);
    const [selectedCertStudent, setSelectedCertStudent] = useState(null);
    const [isBulkCertOpen, setIsBulkCertOpen] = useState(false);
    const [myStudents, setMyStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [timerRemaining, setTimerRemaining] = useState(null);

    const wakeLockRef = useRef(null);

    // Robust, gesture-authorized Screen Wake Lock request helper for teacher
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator && !wakeLockRef.current) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                console.log('[Wake Lock Teacher] Screen Wake Lock acquired successfully with user gesture!');
                
                wakeLockRef.current.addEventListener('release', () => {
                    console.log('[Wake Lock Teacher] Screen Wake Lock was released.');
                    wakeLockRef.current = null;
                });
            }
        } catch (err) {
            console.warn('[Wake Lock Teacher] Failed to acquire Screen Wake Lock:', err);
        }
    };

    useEffect(() => {
        // Prevent background leaks on phone screens
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        const oldBodyBg = document.body.style.background;
        document.body.style.background = '#0f172a'; // Match teacher dark theme background

        // Aggressive Screen Wake Lock on any teacher clicks inside lobby/scoring
        const handleGesture = () => {
            requestWakeLock();
        };
        document.addEventListener('click', handleGesture);
        document.addEventListener('touchstart', handleGesture);

        return () => {
            document.removeEventListener('click', handleGesture);
            document.removeEventListener('touchstart', handleGesture);
            document.body.style.overflowX = '';
            document.documentElement.style.overflowX = '';
            document.body.style.background = oldBodyBg;
        };
    }, []);

    // Screen Wake Lock loop checker for teacher lobby
    useEffect(() => {
        if (status === 'active') {
            requestWakeLock();
        }

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && status === 'active') {
                await requestWakeLock();
            }
        };

        const checkInterval = setInterval(() => {
            if (status === 'active' && !wakeLockRef.current) {
                requestWakeLock();
            }
        }, 15000);

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(checkInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) {
                wakeLockRef.current.release()
                    .then(() => {
                        wakeLockRef.current = null;
                    })
                    .catch(() => {});
            }
        };
    }, [status]);

    // Fetch initial competition details
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await getCompetitionDetails(competitionId);
                if (res.message === 'success') {
                    setCompetition(res.competition);
                    setParticipants(prev => {
                        const dbParticipants = res.competition.participants || [];
                        const merged = [...dbParticipants];
                        prev.forEach(p => {
                            const pId = getParticipantId(p);
                            if (!pId) return;
                            const exists = merged.some(dbP => String(getParticipantId(dbP)) === String(pId));
                            if (!exists) {
                                merged.push(p);
                            }
                        });
                        return merged;
                    });
                    setStatus(res.competition.status || 'lobby');
                    if (res.competition.status === 'finished') {
                        setTriggerConfetti(true);
                    } else if (res.competition.status === 'active' && res.competition.startedAt) {
                        const elapsed = Math.floor((Date.now() - new Date(res.competition.startedAt).getTime()) / 1000);
                        const remaining = res.competition.timer - elapsed;
                        setTimerRemaining(remaining > 0 ? remaining : 0);
                    }
                } else {
                    setError(res.message);
                }
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchDetails();
    }, [competitionId]);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoadingStudents(true);
            try {
                const Token = localStorage.getItem('O_authWEB');
                const res = await fetch(`${API_BASE_URL}/student/getStudent/1`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'authrization': `pracYas09${Token}`
                    }
                });
                const data = await res.json();
                if (data.message === 'success') {
                    setMyStudents(data.allStudent || []);
                }
            } catch (err) {
                console.error('Failed to fetch students:', err);
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchStudents();
    }, []);

    // Polling fallback: re-fetch participants every 5 seconds while in lobby/active state
    // This guarantees the teacher sees new students even if Pusher events are missed
    useEffect(() => {
        if (!competitionId || status === 'finished') return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await getCompetitionDetails(competitionId);
                if (res.message === 'success') {
                    const dbParticipants = res.competition.participants || [];
                    // Sync competition object (ensures startedAt is always fresh)
                    setCompetition(res.competition);
                    setParticipants(prev => {
                        const merged = [...dbParticipants];
                        prev.forEach(p => {
                            const pId = getParticipantId(p);
                            if (!pId) return;
                            const exists = merged.some(dbP => String(getParticipantId(dbP)) === String(pId));
                            if (!exists) {
                                merged.push(p);
                            }
                        });
                        return merged;
                    });
                    // Also sync status from DB
                    if (res.competition.status && res.competition.status !== status) {
                        setStatus(res.competition.status);
                        if (res.competition.status === 'finished') {
                            setTriggerConfetti(true);
                        } else if (res.competition.status === 'active' && res.competition.startedAt) {
                            const elapsed = Math.floor((Date.now() - new Date(res.competition.startedAt).getTime()) / 1000);
                            const remaining = res.competition.timer - elapsed;
                            setTimerRemaining(remaining > 0 ? remaining : 0);
                        }
                    }
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [competitionId, status]);

    // Pusher real-time bindings
    useEffect(() => {
        if (!competitionId) return;

        // Initialize Pusher Channels
        Pusher.logToConsole = true;
        const pusher = new Pusher('06df370fb33f1263ec1f', {
            cluster: 'eu',
        });

        const channel = pusher.subscribe(`competition-${competitionId}`);

        // Listen for new student joining
        channel.bind('student-joined', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
            soundEffects.playClick();
            setParticipants(prev => {
                const exists = prev.some(p => String(getParticipantId(p)) === String(data.studentId));
                if (exists) return prev;
                return [...prev, { student: { _id: data.studentId, userName: data.userName }, guestId: data.studentId, guestName: data.userName, score: 0, totalAnswered: 0, wrongAnswers: 0 }];
            });
        });

        // Listen for live score updates from students
        channel.bind('score-updated', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
            setParticipants(prev => {
                return prev.map(p => {
                    const pId = getParticipantId(p);
                    if (String(pId) === String(data.studentId)) {
                        return { 
                            ...p, 
                            score: data.score, 
                            totalAnswered: data.totalAnswered,
                            wrongAnswers: data.wrongAnswers,
                            finishedAt: data.finishedAt ? new Date(data.finishedAt) : (data.finished ? new Date() : p.finishedAt),
                            answers: data.answers || p.answers
                        };
                    }
                    return p;
                });
            });
        });

        // Listen for competition start (e.g. if page was reloaded by teacher)
        channel.bind('start-competition', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
            setStatus('active');
            if (data && data.timer) {
                setTimerRemaining(data.timer);
            }
        });

        // Listen for student kicked/removed event
        channel.bind('student-kicked', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
            if (data && data.studentId) {
                setParticipants(prev => prev.filter(item => getParticipantId(item) !== String(data.studentId)));
            }
        });

        // Listen for competition finished
        channel.bind('competition-finished', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
            setStatus('finished');
            setTriggerConfetti(true);
            if (data && data.competition) {
                setCompetition(data.competition);
                setParticipants(data.competition.participants || []);
            } else {
                getCompetitionDetails(competitionId).then(res => {
                    if (res.message === 'success') {
                        setCompetition(res.competition);
                        setParticipants(res.competition.participants || []);
                    }
                });
            }
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [competitionId]);

    const handleStart = async () => {
        soundEffects.playClick();
        try {
            const res = await startCompetition(competitionId);
            if (res.message === 'success') {
                setStatus('active');
                setCompetition(res.competition);
                setTimerRemaining(res.competition.timer || 300);
            } else {
                setError(res.message);
            }
        } catch (err) {
            console.error("Failed to start competition:", err);
            setError("Failed to start competition. Please try again.");
        }
    };

    const handleFinish = async () => {
        soundEffects.playClick();
        setStatus('finished');
        setTriggerConfetti(true);
        setTimerRemaining(null);
        try {
            const res = await finishCompetition(competitionId);
            if (res.message === 'success' && res.competition) {
                setCompetition(res.competition);
                if (res.competition.participants) {
                    setParticipants(res.competition.participants);
                }
            }
        } catch (err) {
            console.error("Failed to finish competition:", err);
        }
    };

    // Live Game Timer countdown trigger for Teacher (automatically ends competition when time expires)
    useEffect(() => {
        if (status === 'active' && timerRemaining !== null) {
            if (timerRemaining > 0) {
                const timer = setTimeout(() => {
                    setTimerRemaining(prev => prev - 1);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                // Timer expired! Automatically call handleFinish to end the competition for everyone and show the podium
                setTimerRemaining(null);
                handleFinish();
            }
        }
    }, [status, timerRemaining]);

    const handleForceJoinStudent = async (studentId) => {
        if (!studentId) return;
        const student = myStudents.find(s => s._id === studentId);
        if (!student) return;

        soundEffects.playClick();
        try {
            await joinCompetition(competitionId, { studentId: student._id, userName: student.userName });
            await fetch(`${API_BASE_URL}/competition/mathracer/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelName: 'global-battle-arena',
                    eventName: 'force-join-student',
                    eventData: {
                        studentId: student._id,
                        competitionId: competitionId
                    }
                })
            });
            alert(`Successfully summoned ${student.userName} into the competition!`);
        } catch (err) {
            console.error('Failed to force join student:', err);
            alert('Failed to summon student. Please try again.');
        }
    };

    const handleKickParticipant = async (p) => {
        const targetId = getParticipantId(p);
        if (!targetId) return;
        soundEffects.playClick();

        // Optimistically update local UI state immediately
        setParticipants(prev => prev.filter(item => getParticipantId(item) !== targetId));

        try {
            const res = await removeParticipant(competitionId, targetId);
            if (res.message === 'success' && res.competition) {
                setCompetition(res.competition);
                setParticipants(res.competition.participants || []);
            }
        } catch (err) {
            console.error('Failed to remove participant:', err);
        }
    };

    // HIGHLY PREMIUM MULTI-PAGE COMBINED PDF PERFORMANCE PORTFOLIO GENERATOR
    const handleExportPDF = () => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            let yPos = 40;

            const checkPageBreak = (neededHeight) => {
                if (yPos + neededHeight > pageHeight - 50) {
                    doc.addPage();
                    yPos = 50;
                    return true;
                }
                return false;
            };

            const totalQ = competition?.questions?.length || 0;

            // PAGE 1: DEEP SLATE PREMIUM TITLE BANNER
            doc.setFillColor(30, 41, 59); // Slate-800
            doc.rect(0, 0, pageWidth, 90, 'F');

            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(255, 255, 255);
            doc.text("ABACUS HEROES", 40, 45);

            doc.setFontSize(13);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184); // Slate-400
            doc.text("Master Classroom Performance Portfolio", 40, 68);

            yPos = 130;

            // Competition metadata scorecard
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(1);
            doc.rect(40, yPos - 15, pageWidth - 80, 75, 'FD');

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(71, 85, 105);
            doc.text("Battle Title:", 55, yPos + 5);
            doc.setFont("helvetica", "normal");
            doc.text(competition?.title || "Competition Arena", 150, yPos + 5);

            doc.setFont("helvetica", "bold");
            doc.text("Generated on:", 55, yPos + 25);
            doc.setFont("helvetica", "normal");
            doc.text(new Date().toLocaleString(), 150, yPos + 25);

            doc.setFont("helvetica", "bold");
            doc.text("Total Questions:", 55, yPos + 45);
            doc.setFont("helvetica", "normal");
            doc.text(`${totalQ} Questions`, 150, yPos + 45);

            yPos += 95;

            // CLASSROOM STANDINGS TITLE
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(124, 58, 237); // Purple-600
            doc.text("🏆 Final Standings Leaderboard", 40, yPos);
            yPos += 25;

            // Table Headers
            doc.setFillColor(241, 245, 249);
            doc.rect(40, yPos - 12, pageWidth - 80, 22, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);
            doc.text("Rank", 50, yPos + 3);
            doc.text("Student Name", 100, yPos + 3);
            doc.text("Correct", 240, yPos + 3);
            doc.text("Wrong", 300, yPos + 3);
            doc.text("Accuracy", 360, yPos + 3);
            doc.text("Elapsed Time", 440, yPos + 3);
            yPos += 22;

            // Sort participants using the robust tie-breaker rules
            const sorted = [...participants].sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const aFinished = !!a.finishedAt;
                const bFinished = !!b.finishedAt;
                if (aFinished !== bFinished) return bFinished ? 1 : -1;
                if (a.finishedAt && b.finishedAt) {
                    const diff = new Date(a.finishedAt) - new Date(b.finishedAt);
                    if (diff !== 0) return diff;
                }
                const aWrong = a.wrongAnswers || 0;
                const bWrong = b.wrongAnswers || 0;
                if (aWrong !== bWrong) return aWrong - bWrong;
                return (b.totalAnswered || 0) - (a.totalAnswered || 0);
            });

            // Draw Standings Rows
            sorted.forEach((p, idx) => {
                checkPageBreak(30);

                // Row line divider
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.line(40, yPos + 12, pageWidth - 40, yPos + 12);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(30, 41, 59);

                doc.setFont("helvetica", "bold");
                doc.text(`#${idx + 1}`, 50, yPos);
                doc.setFont("helvetica", "normal");
                doc.text(getStudentName(p), 100, yPos);
                doc.text(`${p.score} / ${totalQ}`, 240, yPos);
                doc.text(`${p.wrongAnswers || 0}`, 300, yPos);
                
                const accuracy = totalQ > 0 ? Math.round((p.score / totalQ) * 100) : 0;
                doc.text(`${accuracy}%`, 360, yPos);

                // Clean elapsed time display without secondary parenthesized display
                const rawTime = p.finishedAt && competition?.startedAt
                    ? new Date(p.finishedAt) - new Date(competition.startedAt)
                    : null;
                const mins = rawTime ? Math.floor(rawTime / 60000) : 0;
                const secs = rawTime ? Math.floor((rawTime % 60000) / 1000) : 0;
                const ms = rawTime ? rawTime % 1000 : 0;
                const cleanTimeStr = rawTime !== null 
                    ? (mins > 0 ? `${mins}min ${secs}s ${ms}ms` : `${secs}s ${ms}ms`) 
                    : "—";

                doc.text(cleanTimeStr, 440, yPos);

                yPos += 28;
            });

            // PAGES 2+: INDIVIDUAL DETAILED REPORT PORTFOLIOS
            sorted.forEach((p) => {
                doc.addPage();
                yPos = 40;

                // Student Sub-header Banner
                doc.setFillColor(124, 58, 237); // Deep Purple
                doc.rect(0, 0, pageWidth, 75, 'F');

                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.setTextColor(255, 255, 255);
                doc.text(`Student Performance: ${getStudentName(p)}`, 40, 42);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(224, 242, 254); // Light Sky
                doc.text(`Email Address: ${p.student?.email || "Student Account"}`, 40, 58);

                yPos = 110;

                // Score metrics box
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(1);
                doc.rect(40, yPos, pageWidth - 80, 52, 'FD');

                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                doc.text("Correct", 60, yPos + 20);
                doc.text("Wrong", 180, yPos + 20);
                doc.text("Unanswered", 300, yPos + 20);
                doc.text("Elapsed Time", 420, yPos + 20);

                doc.setFontSize(14);
                doc.setTextColor(16, 185, 129); // Green
                doc.text(String(p.score), 60, yPos + 40);
                doc.setTextColor(239, 68, 68); // Red
                doc.text(String(p.wrongAnswers || 0), 180, yPos + 40);
                doc.setTextColor(100, 116, 139); // Slate-500
                doc.text(String(totalQ - (p.totalAnswered || 0)), 300, yPos + 40);
                doc.setTextColor(14, 165, 233); // Sky

                const rawTime = p.finishedAt && competition?.startedAt
                    ? new Date(p.finishedAt) - new Date(competition.startedAt)
                    : null;
                const mins = rawTime ? Math.floor(rawTime / 60000) : 0;
                const secs = rawTime ? Math.floor((rawTime % 60000) / 1000) : 0;
                const ms = rawTime ? rawTime % 1000 : 0;
                const cleanTimeStr = rawTime !== null 
                    ? (mins > 0 ? `${mins}min ${secs}s ${ms}ms` : `${secs}s ${ms}ms`) 
                    : "—";

                doc.text(cleanTimeStr, 420, yPos + 40);

                yPos += 95;

                // Breakdown section title
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.setTextColor(30, 41, 59);
                doc.text("📋 Detailed Question-by-Question Breakdown", 40, yPos);
                yPos += 20;

                // Table Headers
                doc.setFillColor(241, 245, 249);
                doc.rect(40, yPos - 12, pageWidth - 80, 22, 'F');
                doc.setFontSize(9);
                doc.setTextColor(71, 85, 105);
                doc.text("Q#", 50, yPos + 3);
                doc.text("Question Text / Formula", 100, yPos + 3);
                doc.text("Student Answer", 270, yPos + 3);
                doc.text("Correct Answer", 380, yPos + 3);
                doc.text("Status", 480, yPos + 3);
                yPos += 22;

                // Table Rows
                competition?.questions?.forEach((q, qIdx) => {
                    checkPageBreak(30);

                    const log = p.answers?.find(
                        a => String(a.question?._id || a.question) === String(q._id)
                    );
                    const isAnswered = !!log;
                    const isCorrect = isAnswered && log.isCorrect;

                    // Row divider line
                    doc.setDrawColor(241, 245, 249);
                    doc.line(40, yPos + 14, pageWidth - 40, yPos + 14);

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(9);
                    doc.setTextColor(30, 41, 59);

                    doc.setFont("helvetica", "bold");
                    doc.text(`Q${qIdx + 1}`, 50, yPos);
                    doc.setFont("helvetica", "normal");
                    
                    const qTxt = q.question || "Graphic Question";
                    doc.text(qTxt, 100, yPos);
                    
                    const sAns = isAnswered ? log.studentAnswer : "—";
                    doc.text(sAns, 270, yPos);

                    const cAns = q.correctAnswer || q.answer?.join(', ') || q.correctPicAnswer || "Check Answer";
                    doc.text(cAns, 380, yPos);

                    if (isCorrect) {
                        doc.setTextColor(16, 185, 129);
                        doc.text("✅ Correct", 480, yPos);
                    } else if (isAnswered) {
                        doc.setTextColor(239, 68, 68);
                        doc.text("❌ Incorrect", 480, yPos);
                    } else {
                        doc.setTextColor(148, 163, 184);
                        doc.text("⚪ Unanswered", 480, yPos);
                    }

                    yPos += 26;
                });
            });

            // Save PDF
            const compTitle = (competition?.title || "Competition").replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`combined_report_${compTitle}.pdf`);
        } catch (err) {
            console.error("Failed to export PDF:", err);
            alert("Failed to export PDF report. Please try again.");
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (error) return <div className="error-container"><p>Error: {error}</p></div>;
    if (!competition) return <div className="error-container"><p>Competition not found.</p></div>;

    const totalQuestions = competition.questions?.length || 0;

    // Helper to sort participants with tie-breakers (highest score, finish speed, accuracy)
    const sortedParticipants = [...participants].sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        
        // Tie-breaker 1: Finished vs Unfinished
        const aFinished = !!a.finishedAt;
        const bFinished = !!b.finishedAt;
        if (aFinished && !bFinished) return -1;
        if (!aFinished && bFinished) return 1;
        
        // Tie-breaker 2: Speed (earlier finishedAt first)
        if (aFinished && bFinished) {
            return new Date(a.finishedAt) - new Date(b.finishedAt);
        }
        
        // Tie-breaker 3: Accuracy (fewer wrong answers first)
        const aWrong = a.wrongAnswers || 0;
        const bWrong = b.wrongAnswers || 0;
        if (aWrong !== bWrong) {
            return aWrong - bWrong;
        }
        
        // Tie-breaker 4: Pace (more total answered first)
        return (b.totalAnswered || 0) - (a.totalAnswered || 0);
    });
    const podiumWinners = sortedParticipants.slice(0, 3);

    return (
        <div className="teacher-competition-lobby-global">
            <MobileNav role="Teacher" />
            <Navbar />

            {triggerConfetti && <Confetti recycle={false} numberOfPieces={300} />}

            <div className="lobby-content-container">
                <header className="lobby-header-card">
                    <div className="header-text">
                        <h1>{competition.title}</h1>
                        <p className="subtitle">Create a competition Host Dashboard</p>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                            <div className="battle-id-badge" style={{
                                marginTop: '15px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                padding: '8px 15px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 'bold' }}>COMPETITION ID:</span>
                                <span style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.05em' }}>{competitionId}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(competitionId);
                                        soundEffects.playClick();
                                        alert("Competition ID copied! Share it with your students.");
                                    }}
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        padding: '4px 10px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                                    }}
                                >
                                    Copy ID
                                </button>
                            </div>

                            <div className="invite-link-badge" style={{
                                marginTop: '15px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                padding: '8px 15px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '13px', color: '#ec4899', fontWeight: 'bold' }}>INVITE LINK:</span>
                                <button
                                    onClick={() => {
                                        const inviteLink = `${window.location.origin}/student/competition/${competitionId}`;
                                        navigator.clipboard.writeText(inviteLink);
                                        soundEffects.playClick();
                                        alert("Invite Link copied! Share it with anyone to join.");
                                    }}
                                    style={{
                                        background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        padding: '4px 10px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)'
                                    }}
                                >
                                    Copy Invite Link
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-pill">
                            <Users size={16} />
                            <span>{participants.length} Active Players</span>
                        </div>
                        <div className="stat-pill">
                            <Timer size={16} />
                            <span>
                                {status === 'active' && timerRemaining !== null 
                                    ? `Time Left: ${Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:${(timerRemaining % 60).toString().padStart(2, '0')}` 
                                    : `${competition.timer / 60} min Duration`}
                            </span>
                        </div>
                    </div>
                </header>

                {/* 1. LOBBY WAITING SCREEN */}
                {status === 'lobby' && (
                    <div className="status-container lobby-waiting-box">
                        <div className="arena-gates-message">
                            <div className="pulse-circle">
                                <Users size={48} className="glowing-icon" />
                            </div>
                            <h2>Waiting for Heroes to enter the Arena...</h2>
                            <p>Students must join this competition from their dashboard.</p>
                        </div>

                        <div className="teacher-student-selector-card" style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '24px',
                            margin: '24px 0',
                            textAlign: 'left'
                        }}>
                            <h3 style={{ fontSize: '18px', color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                👥 Force Join Your Students
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
                                Select a student below to instantly pull them into this competition lobby. If they are online, their screen will automatically open the competition.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <select 
                                    value={selectedStudentId}
                                    onChange={e => setSelectedStudentId(e.target.value)}
                                    style={{
                                        flex: '1 1 250px',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: '#1e293b',
                                        color: '#f8fafc',
                                        border: '1px solid #334155',
                                        outline: 'none',
                                        fontSize: '15px'
                                    }}
                                >
                                    <option value="">-- Select a student --</option>
                                    {myStudents.map(s => (
                                        <option key={s._id} value={s._id}>{s.userName} ({s.email})</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleForceJoinStudent(selectedStudentId)}
                                    disabled={!selectedStudentId}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        background: selectedStudentId ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#334155',
                                        color: '#fff',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        cursor: selectedStudentId ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    🚀 Pull Student into Lobby
                                </button>
                            </div>
                        </div>

                        <div className="participants-grid-wrapper">
                            <h3>Lobby Roster ({participants.length})</h3>
                            {participants.length === 0 ? (
                                <p className="empty-roster-msg">No competitors have joined yet. Tell your students to click "Join Competition" on their dashboards or share the invite link.</p>
                            ) : (
                                <div className="avatar-waiting-grid">
                                    {participants.map((p, idx) => (
                                        <div key={getParticipantId(p) || idx} className="student-avatar-card" style={{ position: 'relative' }}>
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleKickParticipant(p); }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-6px',
                                                    right: '-6px',
                                                    background: '#dc2626',
                                                    color: '#ffffff',
                                                    border: '2px solid #0f172a',
                                                    borderRadius: '50%',
                                                    width: '24px',
                                                    height: '24px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                                    zIndex: 10
                                                }}
                                                title={`Remove ${getStudentName(p)} from competition`}
                                            >
                                                ✕
                                            </button>
                                            <div className="avatar-circle">
                                                {getStudentName(p).charAt(0).toUpperCase()}
                                            </div>
                                            <span className="student-name">{getStudentName(p)}</span>
                                            <span className="joined-badge">Ready</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="action-footer">
                            <button 
                                onClick={handleStart} 
                                className="action-button start-game-btn"
                                disabled={participants.length === 0}
                            >
                                <Play size={20} fill="#fff" />
                                <span>Open Arena Gates (Start)</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. ACTIVE LIVE RACING SCOREBOARD */}
                {status === 'active' && (
                    <div className="status-container live-scoring-box">
                        <div className="live-header-bar" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <div className="live-indicator">
                                    <span className="live-dot"></span>
                                    <h2>Live Competition in Progress</h2>
                                </div>
                                <button onClick={handleFinish} className="action-button end-game-btn">
                                    <Flag size={18} />
                                    <span>End Competition & Show Podium</span>
                                </button>
                            </div>
                            {timerRemaining !== null && (
                                <div style={{ 
                                    alignSelf: 'center', 
                                    background: 'rgba(15, 23, 42, 0.8)', 
                                    border: '2px solid rgba(59, 130, 246, 0.4)', 
                                    borderRadius: '16px', 
                                    padding: '12px 32px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px',
                                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)'
                                }}>
                                    <Timer size={28} color="#38bdf8" />
                                    <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '2px' }}>
                                        {Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:{(timerRemaining % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="live-race-track-list">
                            {sortedParticipants.map((p, idx) => {
                                const progressPercent = totalQuestions > 0 ? ((p.totalAnswered || 0) / totalQuestions) * 100 : 0;
                                const isFinished = !!p.finishedAt;

                                return (
                                    <div key={getParticipantId(p) || idx} className="race-track-row">
                                        <div className="racer-rank">#{idx + 1}</div>
                                        <div className="racer-name-tag">
                                            <span 
                                                className="name name-clickable" 
                                                onClick={() => setSelectedStudentReport(p)}
                                                title="Click to view detailed report card"
                                                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#38bdf8' }}
                                            >
                                                {getStudentName(p)} 📊
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleKickParticipant(p); }}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    color: '#f87171',
                                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                                    borderRadius: '6px',
                                                    padding: '2px 8px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    marginLeft: '8px'
                                                }}
                                                title={`Remove ${getStudentName(p)} from competition`}
                                            >
                                                ✕ Kick
                                            </button>
                                            <span className="score-ratio">
                                                {p.totalAnswered || 0} / {totalQuestions} Solved ({p.score} Correct, {p.wrongAnswers || 0} Wrong)
                                                {isFinished && competition.startedAt && (
                                                    <span style={{ display: 'block', fontSize: '11px', color: '#10b981', marginTop: '3px', fontWeight: 'bold' }}>
                                                        ⏱️ {formatElapsedMs(p.finishedAt, competition.startedAt)}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="track-lane">
                                            <div 
                                                className={`racer-progress-bar ${isFinished ? 'finished-bar' : ''}`}
                                                style={{ width: `${(p.totalAnswered || 0) > 0 ? Math.max(8, progressPercent) : 0}%` }}
                                            >
                                                <div className="racer-avatar-runner">
                                                    {p.student?.userName?.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="racer-wrong-count">
                                            <span className="wrong-label">Wrong:</span>
                                            <strong className="wrong-value">{p.wrongAnswers || 0}</strong>
                                        </div>
                                        <div className="racer-status-icon">
                                            {isFinished ? (
                                                <CheckCircle size={22} className="check-success" />
                                            ) : (
                                                <span className="solving-badge">Solving</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. PODIUM / RESULTS SCREEN */}
                {status === 'finished' && (
                    <div className="status-container podium-results-box">
                        <div className="celebration-title">
                            <Trophy size={48} className="gold-trophy" />
                            <h2>Competition Concluded!</h2>
                            <p>Here are the champions of the Abacus Arena</p>
                        </div>

                        <div className="podium-3d-arena">
                            {/* 2nd Place */}
                            {podiumWinners[1] && (
                                <div className="podium-spot spot-silver">
                                    <Award size={36} className="medal silver-medal" />
                                    <div className="winner-avatar">
                                        {podiumWinners[1].student?.userName?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="winner-name">{podiumWinners[1].student?.userName}</span>
                                    <span className="winner-score">{podiumWinners[1].score} points</span>
                                    <div className="podium-block block-2">2nd</div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {podiumWinners[0] && (
                                <div className="podium-spot spot-gold">
                                    <Trophy size={48} className="medal gold-medal" />
                                    <div className="winner-avatar">
                                        {podiumWinners[0].student?.userName?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="winner-name">{podiumWinners[0].student?.userName}</span>
                                    <span className="winner-score">{podiumWinners[0].score} points</span>
                                    <div className="podium-block block-1">1st</div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {podiumWinners[2] && (
                                <div className="podium-spot spot-bronze">
                                    <Award size={36} className="medal bronze-medal" />
                                    <div className="winner-avatar">
                                        {podiumWinners[2].student?.userName?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="winner-name">{podiumWinners[2].student?.userName}</span>
                                    <span className="winner-score">{podiumWinners[2].score} points</span>
                                    <div className="podium-block block-3">3rd</div>
                                </div>
                            )}
                        </div>

                        <div className="all-rankings-table-wrapper">
                            <h3>Final Leaderboard Standings & Time Reports</h3>
                            <table className="final-scoreboard-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Student</th>
                                        <th>Correct</th>
                                        <th>Wrong</th>
                                        <th>Elapsed Time (ms)</th>
                                        <th>Accuracy Status</th>
                                        <th>Certificate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedParticipants.map((p, idx) => (
                                        <tr key={p.student?._id || idx}>
                                            <td><strong>#{idx + 1}</strong></td>
                                            <td 
                                                className="student-name-cell" 
                                                onClick={() => setSelectedStudentReport(p)}
                                                title="Click to view detailed report card"
                                                style={{ cursor: 'pointer', fontWeight: '600' }}
                                            >
                                                <span style={{ textDecoration: 'underline', color: '#38bdf8' }}>
                                                    {p.student?.userName} 📊
                                                </span>
                                            </td>
                                            <td className="score-correct">{p.score} / {totalQuestions}</td>
                                            <td className="score-wrong">{p.wrongAnswers || 0}</td>
                                            <td style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '13px' }}>
                                                {formatElapsedMs(p.finishedAt, competition.startedAt)}
                                            </td>
                                            <td>
                                                {p.score === totalQuestions ? (
                                                    <span className="badge-flawless">100% Perfect</span>
                                                ) : p.score >= totalQuestions * 0.7 ? (
                                                    <span className="badge-excellent">Excellent</span>
                                                ) : (
                                                    <span className="badge-competitor">Participant</span>
                                                )}
                                            </td>
                                            <td>
                                                {idx < 10 ? (
                                                    <button
                                                        onClick={() => setSelectedCertStudent({
                                                            userName: p.student?.userName,
                                                            rank: idx + 1,
                                                            score: p.score
                                                        })}
                                                        className="print-single-cert-btn"
                                                        style={{
                                                            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            color: '#fff',
                                                            padding: '5px 12px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        🎓 Award Cert
                                                    </button>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontSize: '11px' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="action-footer" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <button 
                                onClick={handleExportPDF} 
                                className="action-button export-pdf-btn"
                                style={{ background: 'linear-gradient(to right, var(--emerald-green), #34d399)', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}
                            >
                                📊 Export Combined PDF Report
                            </button>
                            {participants.length > 0 && (
                                <button 
                                    onClick={() => setIsBulkCertOpen(true)} 
                                    className="action-button bulk-cert-btn"
                                    style={{ background: 'linear-gradient(to right, #7c3aed, #a78bfa)', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)' }}
                                >
                                    🏆 Print Top 10 Certificates
                                </button>
                            )}
                            <Link to="/dashboard/teacher" className="action-button exit-lobby-btn">
                                Return to Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* GORGEOUS PREMIUM DETAIL REPORT MODAL */}
            {selectedStudentReport && (
                <div className="report-modal-overlay" onClick={() => setSelectedStudentReport(null)}>
                    <div className="report-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="report-modal-header">
                            <div className="report-student-meta">
                                <span className="avatar-circle-large">
                                    {selectedStudentReport.student?.userName?.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                    <h2 style={{ margin: 0 }}>{selectedStudentReport.student?.userName}'s Performance Report</h2>
                                    <p className="report-email">{selectedStudentReport.student?.email || "Student Account"}</p>
                                </div>
                            </div>
                            <button className="close-modal-btn" onClick={() => setSelectedStudentReport(null)}>&times;</button>
                        </div>

                        <div className="report-quick-stats">
                            <div className="q-stat-card bg-correct">
                                <h3>{selectedStudentReport.score}</h3>
                                <p>Correct</p>
                            </div>
                            <div className="q-stat-card bg-wrong">
                                <h3>{selectedStudentReport.wrongAnswers || 0}</h3>
                                <p>Wrong</p>
                            </div>
                            <div className="q-stat-card bg-unanswered">
                                <h3>{totalQuestions - (selectedStudentReport.totalAnswered || 0)}</h3>
                                <p>Unanswered</p>
                            </div>
                            <div className="q-stat-card bg-elapsed">
                                <h3 style={{ fontSize: '16px', lineHeight: '32px' }}>
                                    {formatElapsedMs(selectedStudentReport.finishedAt, competition?.startedAt)}
                                </h3>
                                <p>Elapsed Time</p>
                            </div>
                        </div>

                        <div className="report-questions-scroller">
                            <h3 style={{ margin: '0 0 15px 0', borderLeft: '4px solid var(--neon-purple)', paddingLeft: '10px' }}>
                                📋 Detailed Question-by-Question Breakdown
                            </h3>
                            <table className="report-details-table">
                                <thead>
                                    <tr>
                                        <th>Q#</th>
                                        <th>Question</th>
                                        <th>Student's Answer</th>
                                        <th>Correct Answer</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {competition?.questions?.map((q, idx) => {
                                        const log = selectedStudentReport.answers?.find(
                                            a => String(a.question?._id || a.question) === String(q._id)
                                        );
                                        const isAnswered = !!log;
                                        const isCorrect = isAnswered && log.isCorrect;

                                        return (
                                            <tr key={q._id || idx} className={isCorrect ? 'row-correct' : isAnswered ? 'row-wrong' : 'row-unanswered'}>
                                                <td><strong>Q{idx + 1}</strong></td>
                                                <td>
                                                    {q.questionPic && (
                                                        <div className="table-q-pic">
                                                            <img src={q.questionPic} alt="Graphic" />
                                                        </div>
                                                    )}
                                                    <span className="q-text">{q.question || "Graphic Question"}</span>
                                                </td>
                                                <td className="cell-ans font-monospace" style={{ fontWeight: '700' }}>
                                                    {isAnswered ? log.studentAnswer : <span style={{ color: '#64748b' }}>—</span>}
                                                </td>
                                                <td className="cell-ans font-monospace text-emerald">
                                                    {q.correctAnswer || q.answer?.join(', ') || q.correctPicAnswer || "Check Answer"}
                                                </td>
                                                <td>
                                                    {isCorrect ? (
                                                        <span className="rep-badge badge-success">✅ Correct</span>
                                                    ) : isAnswered ? (
                                                        <span className="rep-badge badge-danger">❌ Incorrect</span>
                                                    ) : (
                                                        <span className="rep-badge badge-neutral">⚪ Unanswered</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Preview and Printing Modals */}
            <CertificateModal
                isOpen={!!selectedCertStudent}
                onClose={() => setSelectedCertStudent(null)}
                studentName={selectedCertStudent?.userName}
                rank={selectedCertStudent?.rank}
                score={selectedCertStudent?.score}
                totalQuestions={totalQuestions}
                competitionTitle={competition?.title}
                teacherName={localStorage.getItem('pp_name') || 'Instructor'}
                isMasterminds={(localStorage.getItem('school_name') || '').toLowerCase() !== 'topsoroban'}
            />

            <CertificateModal
                isOpen={isBulkCertOpen}
                onClose={() => setIsBulkCertOpen(false)}
                competitionTitle={competition?.title}
                teacherName={localStorage.getItem('pp_name') || 'Instructor'}
                isMasterminds={(localStorage.getItem('school_name') || '').toLowerCase() !== 'topsoroban'}
                bulkStudents={sortedParticipants.slice(0, 10)}
            />
        </div>
    );
}

export default TeacherCompetitionLobby;
