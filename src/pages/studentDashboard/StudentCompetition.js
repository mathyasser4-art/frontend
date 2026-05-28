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
    const [lobbyCountdown, setLobbyCountdown] = useState(null);
    const [timerRemaining, setTimerRemaining] = useState(null);
    const [triggerConfetti, setTriggerConfetti] = useState(false);

    // Homework-style: track answers locally, check in background, show results at end
    const [answersMap, setAnswersMap] = useState({}); // { questionId: { answer, checked, correct } }
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [isCheckingAnswers, setIsCheckingAnswers] = useState(false);

    // Badges earned at the end
    const [badges, setBadges] = useState([]);

    const studentID = localStorage.getItem('pp_id');
    const studentName = localStorage.getItem('pp_name') || 'Student';

    // Refs to always have latest counts for background score sync
    const correctCountRef = useRef(0);
    const wrongCountRef = useRef(0);
    const totalAnsweredRef = useRef(0);

    // Fetch initial details and join lobby
    useEffect(() => {
        const initLobby = async () => {
            try {
                // Join the lobby
                console.log('[Competition] Joining competition:', competitionId);
                console.log('[Competition] API Base URL:', API_BASE_URL);
                const joinRes = await joinCompetition(competitionId);
                console.log('[Competition] Join response:', JSON.stringify(joinRes));
                if (joinRes.message !== 'success') {
                    console.warn("[Competition] Could not join lobby:", joinRes.message);
                } else {
                    console.log('[Competition] Successfully joined lobby!');
                }

                // Fetch details
                const detailsRes = await getCompetitionDetails(competitionId);
                if (detailsRes.message === 'success') {
                    setCompetition(detailsRes.competition);
                    setParticipants(prev => {
                        const dbParticipants = detailsRes.competition.participants || [];
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
                        calculateBadges(detailsRes.competition.participants || [], detailsRes.competition.questions?.length || 0);
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

        Pusher.logToConsole = true;
        const pusher = new Pusher('06df370fb33f1263ec1f', {
            cluster: 'eu',
            forceTLS: true
        });

        const channel = pusher.subscribe(`competition-${competitionId}`);

        // Listen for other students joining the lobby
        channel.bind('student-joined', (data) => {
            setParticipants(prev => {
                const exists = prev.some(p => String(p.student?._id || p.student) === String(data.studentId));
                if (exists) return prev;
                return [...prev, { student: { _id: data.studentId, userName: data.userName }, score: 0, totalAnswered: 0, wrongAnswers: 0 }];
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
                            totalAnswered: data.totalAnswered,
                            wrongAnswers: data.wrongAnswers,
                            finishedAt: data.finished ? new Date() : p.finishedAt 
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

    // Background answer check (fire & forget) — like homework flow
    const syncAnswerWithBackend = async (questionId, questionAnswer) => {
        try {
            const response = await fetch(`${API_BASE_URL}/question/checkTheAnswer/${questionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authrization': `pracYas09${localStorage.getItem('O_authWEB')}`
                },
                body: JSON.stringify({ questionAnswer: questionAnswer.trim() })
            });
            const result = await response.json();
            const isCorrect = result.message === 'success';

            // Update the answers map
            setAnswersMap(prev => ({
                ...prev,
                [questionId]: { ...prev[questionId], checked: true, correct: isCorrect }
            }));

            // Update counts
            if (isCorrect) {
                correctCountRef.current += 1;
                setCorrectCount(correctCountRef.current);
            } else {
                wrongCountRef.current += 1;
                setWrongCount(wrongCountRef.current);
            }

            // Broadcast live score update to other participants
            try {
                await updateLiveScore(competitionId, {
                    score: correctCountRef.current,
                    totalAnswered: totalAnsweredRef.current,
                    wrongAnswers: wrongCountRef.current,
                    finished: false
                });
            } catch (e) {
                console.error("Failed to broadcast score:", e);
            }
        } catch (err) {
            console.error('Background sync failed for question', questionId, err);
            setAnswersMap(prev => ({
                ...prev,
                [questionId]: { ...prev[questionId], checked: false, correct: false }
            }));
        }
    };

    // Submit answer — homework style: save locally, check in background, move to next immediately
    const handleSubmitAnswer = () => {
        if (!answer.trim()) return;

        const currentQuestion = questions[currentIndex];
        
        // Save answer locally
        setAnswersMap(prev => ({
            ...prev,
            [currentQuestion._id]: { answer: answer.trim(), checked: false, correct: false }
        }));

        // Increment total answered
        totalAnsweredRef.current += 1;
        setTotalAnswered(totalAnsweredRef.current);

        // Fire background check (don't await — student moves on immediately)
        syncAnswerWithBackend(currentQuestion._id, answer);

        soundEffects.playClick();

        // Move to next question immediately or finish if last
        const isLastQuestion = currentIndex === questions.length - 1;
        setAnswer('');
        
        if (isLastQuestion) {
            handleFinishExam();
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    // Navigate to a specific question (clicking on question number)
    const goToQuestion = (index) => {
        // Save current answer before switching
        if (answer.trim() && questions[currentIndex]) {
            const currentQuestion = questions[currentIndex];
            if (!answersMap[currentQuestion._id]) {
                setAnswersMap(prev => ({
                    ...prev,
                    [currentQuestion._id]: { answer: answer.trim(), checked: false, correct: false }
                }));
                totalAnsweredRef.current += 1;
                setTotalAnswered(totalAnsweredRef.current);
                syncAnswerWithBackend(currentQuestion._id, answer);
            }
        }
        setCurrentIndex(index);
        // Restore saved answer if any
        const targetQ = questions[index];
        if (targetQ && answersMap[targetQ._id]) {
            setAnswer(answersMap[targetQ._id].answer || '');
        } else {
            setAnswer('');
        }
    };

    const handleFinishExam = async () => {
        setStatus('finished');
        setTriggerConfetti(true);
        setIsCheckingAnswers(true);

        // Wait a moment for any pending background checks to complete
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Final score broadcast
        try {
            await updateLiveScore(competitionId, {
                score: correctCountRef.current,
                totalAnswered: totalAnsweredRef.current,
                wrongAnswers: wrongCountRef.current,
                finished: true
            });
        } catch (e) {
            console.error("Failed to broadcast final score:", e);
        }

        // Refresh detail standings
        try {
            const res = await getCompetitionDetails(competitionId);
            if (res.message === 'success') {
                setParticipants(res.competition.participants || []);
                calculateBadges(res.competition.participants || [], res.competition.questions?.length || 0);
            }
        } catch (e) {
            console.error("Failed to refresh standings:", e);
        }

        setIsCheckingAnswers(false);
    };

    const calculateBadges = (allParticipants, total) => {
        const myDetails = allParticipants.find(p => String(p.student?._id || p.student) === String(studentID));
        if (!myDetails) return;

        const myScore = myDetails.score;
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

            {/* 3. ACTIVE LIVE SOLVING GAME — Homework style (no instant correction) */}
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

                        {/* Top Competitor Visual Progress Bars */}
                        <div className="visual-race-track-lanes">
                            {sortedParticipants.slice(0, 4).map((p, idx) => {
                                const isMe = String(p.student?._id || p.student) === String(studentID);
                                // Use local state for current student (instant), Pusher data for others
                                const pAnswered = isMe ? totalAnswered : (p.totalAnswered || 0);
                                const progressPercent = totalQuestions > 0 ? (pAnswered / totalQuestions) * 100 : 0;

                                return (
                                    <div key={p.student?._id || idx} className={`lane-row ${isMe ? 'lane-me' : ''}`}>
                                        <span className="lane-name-lbl">
                                            {p.student?.userName} ({pAnswered} / {totalQuestions} Solved)
                                        </span>
                                        <div className="lane-road">
                                            <div 
                                                className="lane-runner-progress" 
                                                style={{ width: `${pAnswered > 0 ? Math.max(8, progressPercent) : 0}%` }}
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

                    {/* Question number navigation bar */}
                    <div className="competition-question-numbers">
                        {questions.map((q, idx) => {
                            const isActive = idx === currentIndex;
                            const hasAnswer = answersMap[q._id] && !isActive;
                            return (
                                <p 
                                    key={q._id || idx}
                                    className={`${isActive ? 'active-question' : ''} ${hasAnswer ? 'has-answer' : ''}`}
                                    onClick={() => goToQuestion(idx)}
                                >
                                    {idx + 1}
                                </p>
                            );
                        })}
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
                                    className="preview-input"
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
                                disabled={!answer.trim()}
                            >
                                <span>{currentIndex === questions.length - 1 ? 'Submit & Finish' : 'Next'}</span>
                                <ArrowRight size={18} />
                            </button>

                            {/* End Exam button — like homework */}
                            <button
                                onClick={handleFinishExam}
                                className="end-exam-btn-action"
                            >
                                End Exam
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

                        {isCheckingAnswers && (
                            <div className="checking-overlay">
                                <div className="loader"></div>
                                <p>Checking your answers...</p>
                            </div>
                        )}

                        {/* Your personal results summary */}
                        <div className="personal-results-summary">
                            <div className="result-stat">
                                <span className="result-label">Correct</span>
                                <span className="result-value correct-val">{correctCount}</span>
                            </div>
                            <div className="result-stat">
                                <span className="result-label">Wrong</span>
                                <span className="result-value wrong-val">{wrongCount}</span>
                            </div>
                            <div className="result-stat">
                                <span className="result-label">Unanswered</span>
                                <span className="result-value unanswered-val">{totalQuestions - totalAnswered}</span>
                            </div>
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
                                        <th>Correct</th>
                                        <th>Wrong</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedParticipants.map((p, idx) => {
                                        const isMe = String(p.student?._id || p.student) === String(studentID);
                                        return (
                                            <tr key={p.student?._id || idx} className={isMe ? 'row-is-me' : ''}>
                                                <td><strong>#{idx + 1}</strong></td>
                                                <td>{p.student?.userName} {isMe && '(You)'}</td>
                                                <td className="score-correct">{p.score} / {totalQuestions}</td>
                                                <td className="score-wrong">{p.wrongAnswers || 0}</td>
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
