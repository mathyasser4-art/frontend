import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Pusher from 'pusher-js';
import { getCompetitionDetails, startCompetition, finishCompetition } from '../../api/competition/competition.api';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import { Play, Users, Trophy, Flag, Timer, Award, CheckCircle } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import Confetti from 'react-confetti';
import './TeacherCompetitionLobby.css';

function TeacherCompetitionLobby() {
    const { competitionId } = useParams();
    const [competition, setCompetition] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [status, setStatus] = useState('lobby');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [triggerConfetti, setTriggerConfetti] = useState(false);

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
                            const pId = p.student?._id || p.student;
                            const exists = merged.some(dbP => String(dbP.student?._id || dbP.student) === String(pId));
                            if (!exists) {
                                merged.push(p);
                            }
                        });
                        return merged;
                    });
                    setStatus(res.competition.status || 'lobby');
                    if (res.competition.status === 'finished') {
                        setTriggerConfetti(true);
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

    // Pusher real-time bindings
    useEffect(() => {
        if (!competitionId) return;

        // Initialize Pusher Channels
        Pusher.logToConsole = true;
        const pusher = new Pusher('18e355bfbafee7a1aa57', {
            cluster: 'eu',
            forceTLS: true
        });

        const channel = pusher.subscribe(`competition-${competitionId}`);

        // Listen for new student joining
        channel.bind('student-joined', (data) => {
            soundEffects.playClick();
            setParticipants(prev => {
                const exists = prev.some(p => String(p.student?._id || p.student) === String(data.studentId));
                if (exists) return prev;
                return [...prev, { student: { _id: data.studentId, userName: data.userName }, score: 0, totalAnswered: 0, wrongAnswers: 0 }];
            });
        });

        // Listen for live score updates from students
        channel.bind('score-updated', (data) => {
            setParticipants(prev => {
                return prev.map(p => {
                    const pId = p.student?._id || p.student;
                    if (String(pId) === String(data.studentId)) {
                        return { 
                            ...p, 
                            score: data.score, 
                            totalAnswered: data.totalAnswered,
                            wrongAnswers: data.wrongAnswers,
                            finishedAt: data.finished ? new Date() : null 
                        };
                    }
                    return p;
                });
            });
        });

        // Listen for competition start (e.g. if page was reloaded by teacher)
        channel.bind('start-competition', () => {
            setStatus('active');
        });

        // Listen for competition finished
        channel.bind('competition-finished', () => {
            setStatus('finished');
            setTriggerConfetti(true);
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
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error("Failed to start competition:", err);
        }
    };

    const handleFinish = async () => {
        soundEffects.playClick();
        try {
            const res = await finishCompetition(competitionId);
            if (res.message === 'success') {
                setStatus('finished');
                setTriggerConfetti(true);
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error("Failed to finish competition:", err);
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (error) return <div className="error-container"><p>Error: {error}</p></div>;
    if (!competition) return <div className="error-container"><p>Competition not found.</p></div>;

    const totalQuestions = competition.questions?.length || 0;

    // Helper to sort participants by score desc
    const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
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
                        <p className="subtitle">Live Battle Arena Host Dashboard</p>
                        
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
                            <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 'bold' }}>BATTLE ID:</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.05em' }}>{competitionId}</span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(competitionId);
                                    soundEffects.playClick();
                                    alert("Battle ID copied! Share it with your students.");
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
                                Copy
                            </button>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-pill">
                            <Users size={16} />
                            <span>{participants.length} Active Players</span>
                        </div>
                        <div className="stat-pill">
                            <Timer size={16} />
                            <span>{competition.timer / 60} min Duration</span>
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

                        <div className="participants-grid-wrapper">
                            <h3>Lobby Roster ({participants.length})</h3>
                            {participants.length === 0 ? (
                                <p className="empty-roster-msg">No competitors have joined yet. Tell your students to click "Join Live Battle" on their dashboards.</p>
                            ) : (
                                <div className="avatar-waiting-grid">
                                    {participants.map((p, idx) => (
                                        <div key={p.student?._id || idx} className="student-avatar-card">
                                            <div className="avatar-circle">
                                                {p.student?.userName?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="student-name">{p.student?.userName}</span>
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
                        <div className="live-header-bar">
                            <div className="live-indicator">
                                <span className="live-dot"></span>
                                <h2>Live Competition in Progress</h2>
                            </div>
                            <button onClick={handleFinish} className="action-button end-game-btn">
                                <Flag size={18} />
                                <span>End Battle & Show Podium</span>
                            </button>
                        </div>

                        <div className="live-race-track-list">
                            {sortedParticipants.map((p, idx) => {
                                const progressPercent = totalQuestions > 0 ? ((p.totalAnswered || 0) / totalQuestions) * 100 : 0;
                                const isFinished = !!p.finishedAt;

                                return (
                                    <div key={p.student?._id || idx} className="race-track-row">
                                        <div className="racer-rank">#{idx + 1}</div>
                                        <div className="racer-name-tag">
                                            <span className="name">{p.student?.userName}</span>
                                            <span className="score-ratio">
                                                {p.totalAnswered || 0} / {totalQuestions} Solved ({p.score} Correct, {p.wrongAnswers || 0} Wrong)
                                            </span>
                                        </div>
                                        <div className="track-lane">
                                            <div 
                                                className={`racer-progress-bar ${isFinished ? 'finished-bar' : ''}`}
                                                style={{ width: `${Math.max(8, progressPercent)}%` }}
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
                            <h2>Battle Concluded!</h2>
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
                            <h3>Final Leaderboard Standings</h3>
                            <table className="final-scoreboard-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Student</th>
                                        <th>Correct</th>
                                        <th>Wrong</th>
                                        <th>Accuracy Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedParticipants.map((p, idx) => (
                                        <tr key={p.student?._id || idx}>
                                            <td><strong>#{idx + 1}</strong></td>
                                            <td>{p.student?.userName}</td>
                                            <td className="score-correct">{p.score} / {totalQuestions}</td>
                                            <td className="score-wrong">{p.wrongAnswers || 0}</td>
                                            <td>
                                                {p.score === totalQuestions ? (
                                                    <span className="badge-flawless">100% Perfect</span>
                                                ) : p.score >= totalQuestions * 0.7 ? (
                                                    <span className="badge-excellent">Excellent</span>
                                                ) : (
                                                    <span className="badge-competitor">Participant</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="action-footer">
                            <Link to="/dashboard/teacher" className="action-button exit-lobby-btn">
                                Return to Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeacherCompetitionLobby;
