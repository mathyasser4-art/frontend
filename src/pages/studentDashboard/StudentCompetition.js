import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Pusher from 'pusher-js';
import { getCompetitionDetails, joinCompetition, updateLiveScore } from '../../api/competition/competition.api';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import AbacusSimulator from '../../components/abacus/AbacusSimulator';
import soundEffects from '../../utils/soundEffects';
import Confetti from 'react-confetti';
import { Award, Trophy, Users, Timer, HelpCircle, ArrowRight, Zap, Target, Star } from 'lucide-react';
import API_BASE_URL from '../../config/api.config';
import './StudentCompetition.css';

function StudentCompetition() {
    const { competitionId } = useParams();
    const navigate = useNavigate();
    const [competition, setCompetition] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [status, setStatus] = useState('lobby'); // lobby, countdown, active, finished
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Active test states
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [checking, setChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [lobbyCountdown, setLobbyCountdown] = useState(null);
    const [timerRemaining, setTimerRemaining] = useState(null);
    const [triggerConfetti, setTriggerConfetti] = useState(false);

    // Badges earned at the end
    const [badges, setBadges] = useState([]);

    const studentID = localStorage.getItem('pp_id');
    const studentName = localStorage.getItem('pp_name') || 'Student';

    // Fetch initial details and join lobby
    useEffect(() => {
        const initLobby = async () => {
            try {
                // Join the lobby
                const joinRes = await joinCompetition(competitionId);
                if (joinRes.message !== 'success') {
                    // If already started/finished, we might get an error
                    console.log("Could not join lobby:", joinRes.message);
                }

                // Fetch details
                const detailsRes = await getCompetitionDetails(competitionId);
                if (detailsRes.message === 'success') {
                    setCompetition(detailsRes.competition);
                    setParticipants(detailsRes.competition.participants || []);
                    setQuestions(detailsRes.competition.questions || []);
                    
                    const compStatus = detailsRes.competition.status;
                    setStatus(compStatus);

                    if (compStatus === 'active') {
                        // If already active, sync the timer based on startedAt
                        const elapsed = Math.floor((Date.now() - new Date(detailsRes.competition.startedAt).getTime()) / 1000);
                        const remaining = detailsRes.competition.timer - elapsed;
                        setTimerRemaining(remaining > 0 ? remaining : 0);
                    } else if (compStatus === 'finished') {
                        setTriggerConfetti(true);
                        calculateBadges(detailsRes.competition.participants || []);
                    }
                } else {
                    setError(detailsRes.message);
                }
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        initLobby();
    }, [competitionId]);

    // Pusher real-time bindings
    useEffect(() => {
        if (!competitionId) return;

        const pusher = new Pusher('18e355bfbafee7a1aa57', {
            cluster: 'eu',
            forceTLS: true
        });

        const channel = pusher.subscribe(`competition-${competitionId}`);

        // Listen for other students joining the lobby
        channel.bind('student-joined', (data) => {
            setParticipants(prev => {
                const exists = prev.some(p => String(p.student?._id || p.student) === String(data.studentId));
                if (exists) return prev;
                return [...prev, { student: { _id: data.studentId, userName: data.userName }, score: 0 }];
            });
        });

        // Listen for live score updates from other participants
        channel.bind('score-updated', (data) => {
            setParticipants(prev => {
                return prev.map(p => {
                    const pId = p.student?._id || p.student;
                    if (String(pId) === String(data.studentId)) {
                        return { 
                            ...p, 
                            score: data.score, 
                            finishedAt: data.finished ? new Date() : null 
                        };
                    }
                    return p;
                });
            });
        });

        // Listen for teacher starting the competition
        channel.bind('start-competition', (data) => {
            soundEffects.playClick();
            setStatus('countdown');
            setLobbyCountdown(3);
            setTimerRemaining(data.timer);
        });

        // Listen for teacher ending the competition
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

    // 3-2-1 Lobby countdown trigger
    useEffect(() => {
        if (status === 'countdown' && lobbyCountdown !== null) {
            if (lobbyCountdown > 0) {
                const timer = setTimeout(() => {
                    setLobbyCountdown(prev => prev - 1);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                setStatus('active');
            }
        }
    }, [status, lobbyCountdown]);

    // Live Game Timer countdown trigger
    useEffect(() => {
        if (status === 'active' && timerRemaining !== null) {
            if (timerRemaining > 0) {
                const timer = setTimeout(() => {
                    setTimerRemaining(prev => prev - 1);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                // Game auto-ends on client timer expiry
                handleFinishExam();
            }
        }
    }, [status, timerRemaining]);

    const handleDigitClick = (digit) => {
        setAnswer(prev => prev + digit);
    };

    const handleDelete = () => {
        setAnswer(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setAnswer('');
    };

    // Submitting answer to check
    const handleSubmitAnswer = async () => {
        if (!answer.trim() || checking) return;
        setChecking(true);

        const currentQuestion = questions[currentIndex];

        try {
            // Check if correct using checkTheAnswer endpoint
            const res = await fetch(`${API_BASE_URL}/question/checkTheAnswer/${currentQuestion._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authrization': `pracYas09${localStorage.getItem('O_authWEB')}`
                },
                body: JSON.stringify({ questionAnswer: answer.trim() })
            });
            const resJson = await res.json();

            let newScore = score;
            if (resJson.message === 'success') {
                soundEffects.playCorrect?.();
                newScore = score + 1;
                setScore(newScore);
                setIsCorrect(true);
            } else {
                soundEffects.playWrong?.();
                setIsCorrect(false);
            }

            // Broadcast score update
            const isLastQuestion = currentIndex === questions.length - 1;
            await updateLiveScore(competitionId, { 
                score: newScore, 
                finished: isLastQuestion 
            });

            // Transition delay
            setTimeout(() => {
                setIsCorrect(null);
                setAnswer('');
                setChecking(false);
                if (isLastQuestion) {
                    handleFinishExam();
                } else {
                    setCurrentIndex(prev => prev + 1);
                }
            }, 1000);

        } catch (err) {
            console.error("Failed to check answer:", err);
            setChecking(false);
        }
    };

    const handleFinishExam = () => {
        setStatus('finished');
        setTriggerConfetti(true);
        // Refresh detail standings to calculate final badge rewards
        getCompetitionDetails(competitionId).then(res => {
            if (res.message === 'success') {
                setParticipants(res.competition.participants || []);
                calculateBadges(res.competition.participants || []);
            }
        });
    };

    const calculateBadges = (allParticipants) => {
        const myDetails = allParticipants.find(p => String(p.student?._id || p.student) === String(studentID));
        if (!myDetails) return;

        const myScore = myDetails.score;
        const total = questions.length;
        const currentBadges = [];

        if (myScore === total && total > 0) {
            currentBadges.push({ name: "Sniper Accuracy", desc: "100% Correct Answers", icon: <Target size={24} /> });
        }
        if (myScore >= 1) {
            currentBadges.push({ name: "Arena Combatant", desc: "Solved at least 1 question correctly", icon: <Star size={24} /> });
        }
        
        // Find if we are in the top 3
        const sorted = [...allParticipants].sort((a, b) => b.score - a.score);
        const rank = sorted.findIndex(p => String(p.student?._id || p.student) === String(studentID)) + 1;

        if (rank === 1) {
            currentBadges.push({ name: "Arena Champion", desc: "Finished 1st place in the battle!", icon: <Trophy size={24} /> });
        } else if (rank === 2 || rank === 3) {
            currentBadges.push({ name: "Podium Conqueror", desc: `Finished in #${rank} place`, icon: <Award size={24} /> });
        }

        setBadges(currentBadges);
    };

    const formatTimer = (seconds) => {
        if (seconds === null || seconds < 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (error) return <div className="error-container"><p>Error: {error}</p></div>;
    if (!competition) return <div className="error-container"><p>Competition not found.</p></div>;

    const totalQuestions = questions.length;
    const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
    const podiumWinners = sortedParticipants.slice(0, 3);
    const currentQuestion = questions[currentIndex];

    // Helper to render current question
    const renderAbacusQuestion = () => {
        if (!currentQuestion?.question) return null;
        
        // Try parsing abacus grid format
        if (currentQuestion.question.trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(currentQuestion.question);
                if (Array.isArray(parsed)) {
                    return (
                        <div className="abacus-grid-card">
                            <table className="abacus-solving-table">
                                <tbody>
                                    {parsed.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="row-op">{row.op || row.OP || ''}</td>
                                            <td className="row-val">{row.val || row.VAL || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
            } catch (e) { /* fallback */ }
        }
        return <pre className="raw-question-text">{currentQuestion.question}</pre>;
    };

    return (
        <div className="student-competition-global">
            <MobileNav role="Student" />
            <Navbar />

            {triggerConfetti && <Confetti recycle={false} numberOfPieces={300} />}

            {/* 1. LOBBY WAITING STATE */}
            {status === 'lobby' && (
                <div className="lobby-room-wrapper">
                    <div className="lobby-main-card">
                        <header className="lobby-head-box">
                            <h2>{competition.title}</h2>
                            <div className="status-label">
                                <span className="pulse-dot"></span>
                                <span>Waiting for Teacher to Start...</span>
                            </div>
                        </header>

                        <div className="arena-split-layout">
                            {/* Warm-up Arena */}
                            <div className="warmup-station-panel">
                                <h3>🖐️ Warm-up Station</h3>
                                <p className="subtitle">Slide abacus beads to warm up your fingers while waiting!</p>
                                <div className="abacus-embed-container">
                                    <AbacusSimulator />
                                </div>
                            </div>

                            {/* Active Student List */}
                            <div className="competitors-list-panel">
                                <h3>⚔️ Connected Combatants ({participants.length})</h3>
                                <div className="students-lobby-scroller">
                                    {participants.map((p, idx) => {
                                        const isMe = String(p.student?._id || p.student) === String(studentID);
                                        return (
                                            <div key={p.student?._id || idx} className={`lobby-racer-card ${isMe ? 'racer-me' : ''}`}>
                                                <div className="racer-avatar">
                                                    {p.student?.userName?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="racer-name">
                                                    {p.student?.userName} {isMe && '(You)'}
                                                </span>
                                                <span className="racer-status">Ready</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. SYNCHRONIZED COUNTDOWN OVERLAY */}
            {status === 'countdown' && (
                <div className="countdown-overlay-fullscreen">
                    <div className="countdown-giant-digits">
                        {lobbyCountdown === 0 ? (
                            <h1 className="zoom-go">SOLVE!</h1>
                        ) : (
                            <h1 className="bounce-digit">{lobbyCountdown}</h1>
                        )}
                    </div>
                    <p className="countdown-sub">Get ready to race...</p>
                </div>
            )}

            {/* 3. ACTIVE LIVE SOLVING GAME */}
            {status === 'active' && currentQuestion && (
                <div className="active-arena-gameplay-wrapper">
                    {/* Race Track Header */}
                    <div className="game-race-track-header">
                        <div className="track-hud-bar">
                            <span className="hud-pill">
                                <Timer size={16} />
                                <strong>{formatTimer(timerRemaining)}</strong>
                            </span>
                            <span className="hud-pill">
                                <HelpCircle size={16} />
                                <strong>Question {currentIndex + 1} / {totalQuestions}</strong>
                            </span>
                        </div>

                        {/* Top 3 Competitor Visual Progress Bars */}
                        <div className="visual-race-track-lanes">
                            {sortedParticipants.slice(0, 4).map((p, idx) => {
                                const isMe = String(p.student?._id || p.student) === String(studentID);
                                const progressPercent = totalQuestions > 0 ? (p.score / totalQuestions) * 100 : 0;

                                return (
                                    <div key={p.student?._id || idx} className={`lane-row ${isMe ? 'lane-me' : ''}`}>
                                        <span className="lane-name-lbl">{p.student?.userName}</span>
                                        <div className="lane-road">
                                            <div 
                                                className="lane-runner-progress" 
                                                style={{ width: `${Math.max(8, progressPercent)}%` }}
                                            >
                                                <div className="runner-avatar-icon">
                                                    {p.student?.userName?.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="question-solving-box-grid">
                        {/* Question display card */}
                        <div className="solving-question-card-wrapper">
                            {currentQuestion.questionPic && (
                                <div className="question-graphic-container">
                                    <img src={currentQuestion.questionPic} alt="Question Graphic" />
                                </div>
                            )}

                            {renderAbacusQuestion()}
                        </div>

                        {/* Answer Input Panel */}
                        <div className="input-solving-keyboard-wrapper">
                            <div className="answer-preview-screen">
                                <input 
                                    type="text" 
                                    value={answer}
                                    readOnly 
                                    placeholder="?" 
                                    className={`preview-input ${isCorrect === true ? 'border-success' : isCorrect === false ? 'border-wrong' : ''}`}
                                />
                            </div>

                            <div className="custom-game-keyboard">
                                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(digit => (
                                    <button 
                                        key={digit} 
                                        onClick={() => handleDigitClick(digit.toString())}
                                        className="key-btn digit-key"
                                    >
                                        {digit}
                                    </button>
                                ))}
                                <button onClick={() => handleDigitClick('0')} className="key-btn digit-key">0</button>
                                <button onClick={handleDelete} className="key-btn action-key-clear">⌫</button>
                                <button onClick={handleClear} className="key-btn action-key-clear">C</button>
                            </div>

                            <button 
                                onClick={handleSubmitAnswer}
                                className="submit-answer-btn-action"
                                disabled={!answer.trim() || checking}
                            >
                                <span>Submit Answer</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. CONCLUDED / PODIUM DISPLAY */}
            {status === 'finished' && (
                <div className="podium-lobby-room-wrapper">
                    <div className="podium-main-card">
                        <div className="results-celebration-header">
                            <Trophy size={48} className="gold-trophy" />
                            <h2>Battle Completed!</h2>
                            <p>Here are the final standings of the Abacus Arena</p>
                        </div>

                        {/* 3D Podium */}
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

                        {/* Badges and Rewards Section */}
                        {badges.length > 0 && (
                            <div className="personal-medals-earned-section">
                                <h3>🏅 Your Medals Earned</h3>
                                <div className="badges-list-row">
                                    {badges.map((badge, idx) => (
                                        <div key={idx} className="badge-item-card">
                                            <div className="badge-icon-badge">{badge.icon}</div>
                                            <div className="badge-details">
                                                <h4>{badge.name}</h4>
                                                <p>{badge.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Leaderboard standing */}
                        <div className="ranking-table-list-scores">
                            <h3>Lobby Leaderboard</h3>
                            <table className="student-final-scores-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Player</th>
                                        <th>Solved</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedParticipants.map((p, idx) => {
                                        const isMe = String(p.student?._id || p.student) === String(studentID);
                                        return (
                                            <tr key={p.student?._id || idx} className={isMe ? 'row-is-me' : ''}>
                                                <td><strong>#{idx + 1}</strong></td>
                                                <td>{p.student?.userName} {isMe && '(You)'}</td>
                                                <td>{p.score} / {totalQuestions}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="podium-footer-actions">
                            <button 
                                onClick={() => navigate('/dashboard/student')}
                                className="return-to-dash-btn"
                            >
                                Exit Arena
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentCompetition;
