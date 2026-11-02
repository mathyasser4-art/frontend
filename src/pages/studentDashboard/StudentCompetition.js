import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Pusher from 'pusher-js';
import { getCompetitionDetails, getCompetitionStatus, joinCompetition, updateLiveScore } from '../../api/competition/competition.api';
import { sortParticipants, isPodiumEligible } from '../../utils/competitionRanking';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import Confetti from 'react-confetti';
import { Award, Trophy, Timer, HelpCircle, ArrowRight, Target, Star } from 'lucide-react';
import './StudentCompetition.css';
import CertificateModal from '../../components/certificate/CertificateModal';
import { adjustQuestionOrderAndShuffleMCQ } from '../../utils/questionShuffle';
import { safeLocalStorage, clearUserSession } from '../../utils/safeStorage';
import { useTranslation } from 'react-i18next';

// Helper to extract participant ID safely (handling populated student object, ObjectId string, and guestId)
const getParticipantId = (p) => {
    if (!p) return null;
    if (typeof p === 'string') return p;
    return p.student?._id || (typeof p.student === 'string' ? p.student : null) || p.guestId || p._id || null;
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
    return `${formatted}`;
};

// How often the page re-checks the competition status in case a real-time
// (Pusher) event was missed - flaky school Wi-Fi, a phone that slept, Pusher limits...
const STATUS_POLL_MS = 4000;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function StudentCompetition() {
    const { t } = useTranslation();
    const { competitionId } = useParams();
    const navigate = useNavigate();
    const [competition, setCompetition] = useState(null);
    const [participants, setParticipants] = useState([]);
    // lobby, countdown, active, waiting-for-end, finished
    const [status, setStatus] = useState('lobby');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canRetryJoin, setCanRetryJoin] = useState(false);
    const [initAttempt, setInitAttempt] = useState(0);

    // Active test states
    const [questions, setQuestions] = useState([]);
    const [questionsError, setQuestionsError] = useState(false);
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
    const [isCertOpen, setIsCertOpen] = useState(false);

    const token = safeLocalStorage.getItem('O_authWEB');
    let studentID = safeLocalStorage.getItem('pp_id') || safeLocalStorage.getItem('user_id') || safeLocalStorage.getItem('userId');
    let studentName = safeLocalStorage.getItem('pp_name') || safeLocalStorage.getItem('user_name') || safeLocalStorage.getItem('userName');

    // Strict authentication guard: No guests permitted under any circumstance
    useEffect(() => {
        if (!token || !studentID || studentID === 'undefined' || studentID === 'null') {
            navigate('/auth/login');
        }
    }, [token, studentID, navigate]);

    // Refs to always have latest counts for background score sync
    const correctCountRef = useRef(0);
    const wrongCountRef = useRef(0);
    const totalAnsweredRef = useRef(0);
    const answersMapRef = useRef({});
    const [localFinishedAt, setLocalFinishedAt] = useState(null);
    // Server-time moment of the last answer (used as the finish time)
    const lastAnswerAtRef = useRef(null);
    const wakeLockRef = useRef(null);
    // Background score sync is serialized: only one request is in flight at a time and
    // the latest answers are sent once it completes. Parallel requests used to finish
    // out of order and overwrite newer answers/counts with stale ones.
    const syncInFlightRef = useRef(null);
    const syncPendingRef = useRef(false);
    const finishingRef = useRef(false);

    // ── Server clock ─────────────────────────────────────────────────────────
    // All timing is derived from the server's startedAt/deadline. Device clocks are
    // often minutes off on school tablets, and setTimeout-based countdowns freeze
    // while a phone is locked, so the timer is recomputed from absolute times.
    const serverOffsetRef = useRef(0);       // serverTime - deviceTime (ms)
    const bestRttRef = useRef(Number.POSITIVE_INFINITY);
    const startedAtMsRef = useRef(null);     // server time
    const deadlineMsRef = useRef(null);      // server time
    const statusRef = useRef('lobby');
    const questionsRef = useRef([]);
    const resultsLoadedRef = useRef(false);
    const loadingQuestionsRef = useRef(false);
    const removedHandledRef = useRef(false);
    const authLostRef = useRef(false);
    const pollStatusRef = useRef(null);
    const handleFinishExamRef = useRef(null);
    const optionLockRef = useRef(false);

    const currentQuestion = questions[currentIndex];

    const serverNowMs = () => Date.now() + serverOffsetRef.current;

    const updateServerOffset = (serverNow, sentAt, receivedAt) => {
        const serverMs = new Date(serverNow).getTime();
        if (!Number.isFinite(serverMs)) return;
        const rtt = Math.max(0, receivedAt - sentAt);
        // Keep the measurement with the smallest round trip (most accurate), but
        // refresh it if the device clock was changed meanwhile.
        const candidate = serverMs - (sentAt + receivedAt) / 2;
        if (rtt <= bestRttRef.current || Math.abs(candidate - serverOffsetRef.current) > 5000) {
            bestRttRef.current = rtt;
            serverOffsetRef.current = candidate;
        }
    };

    const applyTiming = (comp) => {
        if (!comp || !comp.startedAt) return;
        const startMs = new Date(comp.startedAt).getTime();
        if (!Number.isFinite(startMs)) return;
        startedAtMsRef.current = startMs;
        deadlineMsRef.current = startMs + (comp.timer || 300) * 1000;
    };

    const changeStatus = (next) => {
        statusRef.current = next;
        setStatus(next);
    };

    // Robust, gesture-authorized Screen Wake Lock request helper
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator && !wakeLockRef.current) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                wakeLockRef.current.addEventListener('release', () => {
                    wakeLockRef.current = null;
                });
            }
        } catch (err) {
            console.warn('[Wake Lock] Failed to acquire Screen Wake Lock:', err);
        }
    };

    useEffect(() => {
        // Prevent background leaks on mobile screens
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        const oldBodyBg = document.body.style.background;
        document.body.style.background = '#090d16'; // Match deep dark blue/purple theme

        // Attempt wake lock on user clicks/touches (even before game starts!)
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

    // Screen Wake Lock API to prevent device from dimming or going to sleep during active gameplay
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

    const restoreMyAnswers = (comp) => {
        const myDetails = (comp.participants || []).find(p => String(getParticipantId(p)) === String(studentID));
        if (!myDetails) return null;
        if (Array.isArray(myDetails.answers) && myDetails.answers.length > 0) {
            const initAnswersMap = { ...answersMapRef.current };
            myDetails.answers.forEach(a => {
                if (!initAnswersMap[a.question]) {
                    initAnswersMap[a.question] = { answer: a.studentAnswer, checked: true, correct: a.isCorrect };
                }
            });
            answersMapRef.current = initAnswersMap;
            setAnswersMap(initAnswersMap);
        }
        correctCountRef.current = myDetails.score || 0;
        setCorrectCount(correctCountRef.current);
        wrongCountRef.current = myDetails.wrongAnswers || 0;
        setWrongCount(wrongCountRef.current);
        const ansCount = Math.max(myDetails.totalAnswered || 0, myDetails.answers ? myDetails.answers.length : 0, Object.keys(answersMapRef.current).length);
        totalAnsweredRef.current = ansCount;
        setTotalAnswered(ansCount);
        return myDetails;
    };

    const fetchDetailsTimed = async () => {
        const sentAt = Date.now();
        const res = await getCompetitionDetails(competitionId);
        if (res && res.message === 'success' && res.competition?.serverNow) {
            updateServerOffset(res.competition.serverNow, sentAt, Date.now());
        }
        return res;
    };

    // Final results: shown only once the SERVER has finalized the competition, so
    // the rank on screen is the same one used for the coins and certificates.
    const loadFinalResults = async () => {
        if (resultsLoadedRef.current) return true;
        const res = await fetchDetailsTimed();
        if (res && res.message === 'success' && res.competition && res.competition.status === 'finished') {
            resultsLoadedRef.current = true;
            setCompetition(res.competition);
            setParticipants(res.competition.participants || []);
            restoreMyAnswers(res.competition);
            calculateBadges(res.competition.participants || [], res.competition.questionsCount || res.competition.questions?.length || 0);
            setTimerRemaining(0);
            setIsCheckingAnswers(false);
            changeStatus('finished');
            setTriggerConfetti(true);
            return true;
        }
        return false;
    };

    // Questions are only handed out once the battle starts (not in the lobby)
    const ensureQuestionsLoaded = async () => {
        if (questionsRef.current.length > 0 || loadingQuestionsRef.current) return;
        loadingQuestionsRef.current = true;
        setQuestionsError(false);
        try {
            for (let attempt = 0; attempt < 6; attempt++) {
                const res = await fetchDetailsTimed();
                const qs = res?.competition?.questions;
                if (res && res.message === 'success' && Array.isArray(qs) && qs.length > 0) {
                    const shuffled = adjustQuestionOrderAndShuffleMCQ(qs);
                    questionsRef.current = shuffled;
                    setQuestions(shuffled);
                    setCompetition(prev => ({ ...(prev || {}), ...res.competition, questions: shuffled }));
                    applyTiming(res.competition);
                    restoreMyAnswers(res.competition);
                    return;
                }
                if (res && res.competition && res.competition.status === 'finished') {
                    await loadFinalResults();
                    return;
                }
                await sleep(800 * (attempt + 1));
            }
            setQuestionsError(true);
        } finally {
            loadingQuestionsRef.current = false;
        }
    };

    // Moves the page into the running battle based on the server's startedAt
    const enterStartedPhase = (comp) => {
        applyTiming(comp);
        ensureQuestionsLoaded();
        const current = statusRef.current;
        if (current === 'finished' || current === 'waiting-for-end') return;
        const now = serverNowMs();
        if (startedAtMsRef.current && now < startedAtMsRef.current) {
            if (current !== 'countdown') {
                soundEffects.playClick();
                changeStatus('countdown');
            }
        } else if (current !== 'active') {
            changeStatus('active');
        }
    };

    // Fetch initial details and join lobby
    useEffect(() => {
        let cancelled = false;
        const initLobby = async () => {
            if (!token || !studentID || studentID === 'undefined' || studentID === 'null') {
                navigate('/auth/login');
                return;
            }
            setLoading(true);
            setError(null);
            setCanRetryJoin(false);
            try {
                // Join the lobby as an authenticated student (retry network hiccups)
                let joinRes = null;
                for (let attempt = 0; attempt < 3; attempt++) {
                    joinRes = await joinCompetition(competitionId, { studentId: studentID, userName: studentName });
                    if (!joinRes || !joinRes.error) break;
                    await sleep(1000 * (attempt + 1));
                }
                if (cancelled) return;
                if (joinRes && joinRes.code === 'AUTH') {
                    handleAuthLost();
                    return;
                }
                if (joinRes && joinRes.code === 'HOST') {
                    navigate(`/teacher/competition/${competitionId}`);
                    return;
                }

                const detailsRes = await fetchDetailsTimed();
                if (cancelled) return;
                if (!detailsRes || detailsRes.message !== 'success') {
                    setError(detailsRes?.message || 'Could not load the competition.');
                    setCanRetryJoin(true);
                    setLoading(false);
                    return;
                }

                const comp = detailsRes.competition;
                setCompetition(comp);
                setParticipants(comp.participants || []);
                const myDetails = restoreMyAnswers(comp);

                if (!myDetails) {
                    // The server would reject every answer, so don't let the student
                    // play a ghost round - tell them exactly why instead.
                    const joinMsg = joinRes && joinRes.message !== 'success' ? joinRes.message : null;
                    if (comp.status === 'lobby') {
                        setError(joinMsg || 'Could not join the competition lobby. Please try again.');
                        setCanRetryJoin(!joinRes || joinRes.code !== 'REMOVED');
                    } else {
                        setError(joinMsg || (comp.status === 'finished'
                            ? 'This competition has already ended.'
                            : 'This competition has already started. You can no longer join it.'));
                    }
                    setLoading(false);
                    return;
                }

                if (comp.status === 'finished') {
                    await loadFinalResults();
                } else if (comp.status === 'active') {
                    if (Array.isArray(comp.questions) && comp.questions.length > 0) {
                        const shuffled = adjustQuestionOrderAndShuffleMCQ(comp.questions);
                        questionsRef.current = shuffled;
                        setQuestions(shuffled);
                    }
                    if (myDetails.finishedAt) {
                        // Already submitted (page refreshed) - wait for the official results
                        finishingRef.current = true;
                        setLocalFinishedAt(myDetails.finishedAt);
                        applyTiming(comp);
                        changeStatus('waiting-for-end');
                    } else {
                        enterStartedPhase(comp);
                    }
                } else {
                    changeStatus('lobby');
                }
                setLoading(false);
            } catch (err) {
                if (cancelled) return;
                setError(err.message);
                setCanRetryJoin(true);
                setLoading(false);
            }
        };
        initLobby();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [competitionId, initAttempt]);

    // The server only accepts answers from a valid login. If it rejects ours (account
    // disabled, token from another server...), log in again and come straight back
    // here - answers already saved are kept on the server.
    const handleAuthLost = () => {
        if (authLostRef.current) return;
        authLostRef.current = true;
        try {
            safeLocalStorage.setItem('post_login_redirect', JSON.stringify({ path: `/student/competition/${competitionId}`, at: Date.now() }));
        } catch (e) { /* storage unavailable */ }
        clearUserSession();
        alert('Please log in again to continue the competition. Your saved answers are kept.');
        window.location.href = '/auth/login';
    };

    const handleRemoved = () => {
        if (removedHandledRef.current) return;
        removedHandledRef.current = true;
        alert("You were removed from this competition by the host teacher.");
        navigate('/dashboard/student');
    };

    // Pusher real-time bindings
    useEffect(() => {
        if (!competitionId) return;

        const pusher = new Pusher('06df370fb33f1263ec1f', {
            cluster: 'eu',
        });

        const channel = pusher.subscribe(`competition-${competitionId}`);

        // Teacher started the competition
        channel.bind('start-competition', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
            if (!data || !data.startedAt) return;
            const comp = { startedAt: data.startedAt, timer: data.timer || 300, status: 'active' };
            setCompetition(prev => ({ ...(prev || {}), ...comp }));
            enterStartedPhase(comp);
        });

        // Student kicked event
        channel.bind('student-kicked', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
            if (data && data.studentId && String(data.studentId) === String(studentID)) {
                handleRemoved();
            }
        });

        // Teacher ended the competition (or it was auto-finalized)
        channel.bind('competition-finished', () => {
            setTimerRemaining(0);
            loadFinalResults();
        });

        // When the connection comes back (phone unlocked, Wi-Fi back), re-sync at once
        pusher.connection.bind('connected', () => {
            if (statusRef.current !== 'finished') pollStatusRef.current?.();
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
            pusher.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [competitionId]);

    // Polling fallback - the battle works even if every Pusher event is lost
    const pollStatus = async () => {
        if (loading || error || statusRef.current === 'finished') return;
        const sentAt = Date.now();
        const res = await getCompetitionStatus(competitionId, studentID);
        if (!res || res.message !== 'success') return;
        updateServerOffset(res.serverNow, sentAt, Date.now());

        if (res.isParticipant === false && statusRef.current !== 'finished') {
            if (res.isRemoved) {
                handleRemoved();
            } else if (res.status === 'lobby') {
                // Our entry vanished (e.g. kicked event missed and host re-allowed) - re-join
                setInitAttempt(n => n + 1);
            }
            return;
        }

        if (res.status === 'finished') {
            await loadFinalResults();
        } else if (res.status === 'active') {
            const comp = { startedAt: res.startedAt, timer: res.timer, status: 'active' };
            applyTiming(comp);
            if (statusRef.current === 'lobby' || statusRef.current === 'countdown') {
                setCompetition(prev => ({ ...(prev || {}), ...comp }));
                enterStartedPhase(comp);
            } else if (questionsRef.current.length === 0) {
                ensureQuestionsLoaded();
            }
        }
    };
    pollStatusRef.current = pollStatus;

    useEffect(() => {
        if (loading || error || status === 'finished') return;
        const interval = setInterval(() => pollStatusRef.current?.(), STATUS_POLL_MS);
        const onVisible = () => {
            if (document.visibilityState === 'visible') pollStatusRef.current?.();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [loading, error, status, competitionId]);

    // Single clock for the 3-2-1 countdown and the battle timer, computed from the
    // server's absolute times (accurate even after the phone was locked).
    useEffect(() => {
        if (status !== 'countdown' && status !== 'active' && status !== 'waiting-for-end') return;
        const tick = () => {
            const now = serverNowMs();
            if (statusRef.current === 'countdown') {
                const msLeft = (startedAtMsRef.current || now) - now;
                if (msLeft <= 0) {
                    setLobbyCountdown(null);
                    changeStatus('active');
                } else {
                    // 3, 2, 1, then "GO" for the last moment
                    setLobbyCountdown(msLeft <= 600 ? 0 : Math.ceil((msLeft - 600) / 1000));
                }
                if (startedAtMsRef.current && deadlineMsRef.current) {
                    setTimerRemaining(Math.round((deadlineMsRef.current - startedAtMsRef.current) / 1000));
                }
                return;
            }
            if (!deadlineMsRef.current) return;
            const remaining = Math.max(0, Math.ceil((deadlineMsRef.current - now) / 1000));
            setTimerRemaining(remaining);
            if (remaining <= 0 && statusRef.current === 'active') {
                handleFinishExamRef.current?.(true);
            }
        };
        tick();
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // Handle physical keyboard inputs for complete/essay answers in competition
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (status !== 'active') return;
            if (!currentQuestion) return;
            if (currentQuestion.typeOfAnswer === 'MCQ' || currentQuestion.typeOfAnswer === 'Graph') return;

            // If typing in another input, ignore
            if (document.activeElement && document.activeElement.tagName === 'INPUT' && !document.activeElement.classList.contains('preview-input')) {
                return;
            }

            // If focused on the main preview input, let native input handle it
            if (document.activeElement && document.activeElement.classList.contains('preview-input')) {
                if (e.key === 'Enter') {
                    handleSubmitAnswer();
                }
                return;
            }

            if ((e.key >= '0' && e.key <= '9') || e.key === '-' || e.key === '.' || e.key === ',') {
                setAnswer(prev => prev + e.key);
            } else if (e.key === 'Backspace') {
                setAnswer(prev => prev.slice(0, -1));
            } else if (e.key === 'Enter') {
                handleSubmitAnswer();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, currentQuestion, answer, currentIndex]);

    const handleDigitClick = (digit) => {
        setAnswer(prev => prev + digit);
        requestWakeLock();
    };

    const handleDelete = () => {
        setAnswer(prev => prev.slice(0, -1));
        requestWakeLock();
    };

    const handleClear = () => {
        setAnswer('');
        requestWakeLock();
    };

    // Applies the server-graded answers returned by the score endpoint
    const applySecureAnswers = (secureAnswers) => {
        if (!Array.isArray(secureAnswers)) return;
        let newCorrectCount = 0;
        let newWrongCount = 0;

        const updated = { ...answersMapRef.current };
        secureAnswers.forEach(ans => {
            const local = updated[ans.question];
            if (local) {
                // Only mark as checked if the student hasn't changed it since this request
                const sameAnswer = String(local.answer) === String(ans.studentAnswer);
                updated[ans.question] = { ...local, correct: sameAnswer ? ans.isCorrect : local.correct, checked: sameAnswer ? true : local.checked };
            } else {
                updated[ans.question] = { answer: ans.studentAnswer, checked: true, correct: ans.isCorrect };
            }
            if (ans.isCorrect) newCorrectCount++;
            else newWrongCount++;
        });
        answersMapRef.current = updated;
        setAnswersMap(updated);

        correctCountRef.current = newCorrectCount;
        setCorrectCount(newCorrectCount);
        wrongCountRef.current = newWrongCount;
        setWrongCount(newWrongCount);
        totalAnsweredRef.current = Math.max(totalAnsweredRef.current, secureAnswers.length);
        setTotalAnswered(totalAnsweredRef.current);
    };

    const buildAnswersPayload = () => Object.entries(answersMapRef.current).map(([qId, data]) => ({
        question: qId,
        studentAnswer: data.answer !== undefined && data.answer !== null ? String(data.answer) : ""
    }));

    // Sends the latest answers; if a request is already running, the newest state is
    // sent right after it finishes (requests never overlap). Failed sends are retried.
    const flushAnswers = () => {
        if (syncInFlightRef.current) {
            syncPendingRef.current = true;
            return syncInFlightRef.current;
        }
        const run = async () => {
            let failures = 0;
            do {
                syncPendingRef.current = false;
                if (finishingRef.current) break; // the final submit carries everything
                try {
                    const response = await updateLiveScore(competitionId, {
                        studentId: studentID,
                        userName: studentName,
                        finished: false,
                        answers: buildAnswersPayload()
                    });
                    if (response && response.message === 'success' && response.answers) {
                        // The backend returns the secure answers map containing isCorrect
                        applySecureAnswers(response.answers);
                        failures = 0;
                    } else if (response && response.code === 'COMPETITION_FINISHED') {
                        loadFinalResults();
                        break;
                    } else if (response && response.code === 'NOT_PARTICIPANT') {
                        break;
                    } else if (response && response.code === 'AUTH') {
                        handleAuthLost();
                        break;
                    } else if (response && (response.error || (response.httpStatus || 0) >= 500) && failures < 3) {
                        // Network / server hiccup: try again shortly with the latest answers
                        failures++;
                        syncPendingRef.current = true;
                        await sleep(700 * failures);
                    }
                } catch (err) {
                    console.error('Background answer sync failed', err);
                }
            } while (syncPendingRef.current);
            syncInFlightRef.current = null;
        };
        syncInFlightRef.current = run();
        return syncInFlightRef.current;
    };

    // Background answer check (fire & forget) — secure flow
    const syncAnswerWithBackend = (questionId, questionAnswer) => {
        // Synchronously ensure answersMapRef has the latest answer so it is never dropped on question 1
        const currentAnswers = {
            ...answersMapRef.current,
            [questionId]: { ...answersMapRef.current[questionId], checked: false, answer: questionAnswer }
        };
        answersMapRef.current = currentAnswers;
        setAnswersMap(currentAnswers);
        lastAnswerAtRef.current = serverNowMs();
        return flushAnswers();
    };

    // After answering question `fromIndex`: go to the next UNANSWERED question
    // (wrapping around to ones that were skipped) and finish only when every question
    // is answered. Answering the last question first used to end the whole exam.
    const advanceFrom = (fromIndex) => {
        const qs = questionsRef.current.length ? questionsRef.current : questions;
        const n = qs.length;
        for (let step = 1; step <= n; step++) {
            const idx = (fromIndex + step) % n;
            if (!answersMapRef.current[qs[idx]._id]) {
                setCurrentIndex(idx);
                setAnswer('');
                return;
            }
        }
        handleFinishExamRef.current?.();
    };

    // Submit answer — homework style: save locally, check in background, move to next immediately
    const handleSubmitAnswer = () => {
        if (statusRef.current !== 'active' || finishingRef.current) return;
        if (!answer.trim()) return;
        requestWakeLock();

        const currentQuestion = questions[currentIndex];
        if (!currentQuestion) return;
        const trimmed = answer.trim();
        const wasAlreadyAnswered = !!answersMapRef.current[currentQuestion._id];

        // Increment total answered only if newly answered
        if (!wasAlreadyAnswered) {
            totalAnsweredRef.current += 1;
            setTotalAnswered(totalAnsweredRef.current);
        }

        // Fire background check (don't await — student moves on immediately)
        syncAnswerWithBackend(currentQuestion._id, trimmed);

        soundEffects.playClick();

        // Move to next question or auto-submit if everything is answered
        setAnswer('');
        advanceFrom(currentIndex);
    };

    // Option selection for MCQ and Graph questions (auto-submits and auto-advances)
    const handleOptionSelect = (selectedVal) => {
        if (statusRef.current !== 'active' || finishingRef.current || optionLockRef.current) return;
        const currentQuestion = questions[currentIndex];
        if (!currentQuestion) return;
        // Ignore a second tap during the 320ms "selected" animation (it used to
        // answer the next question with the same option position)
        optionLockRef.current = true;

        soundEffects.playClick();
        setAnswer(selectedVal);
        requestWakeLock();

        const trimmed = String(selectedVal).trim();
        const wasAlreadyAnswered = !!answersMapRef.current[currentQuestion._id];

        // Increment total answered if not already answered
        if (!wasAlreadyAnswered) {
            totalAnsweredRef.current += 1;
            setTotalAnswered(totalAnsweredRef.current);
        }

        // Fire background check immediately
        syncAnswerWithBackend(currentQuestion._id, trimmed);

        // Auto-advance with 300ms visual select feedback delay
        const indexAtClick = currentIndex;
        setTimeout(() => {
            optionLockRef.current = false;
            if (statusRef.current !== 'active' || finishingRef.current) return;
            setAnswer('');
            advanceFrom(indexAtClick);
        }, 320);
    };

    // Navigate to a specific question (clicking on question number)
    const goToQuestion = (index) => {
        if (statusRef.current !== 'active' || finishingRef.current) return;
        // Save current answer before switching
        if (answer.trim() && questions[currentIndex]) {
            const currentQuestion = questions[currentIndex];
            const trimmed = answer.trim();
            const prevAns = answersMapRef.current[currentQuestion._id]?.answer;
            if (prevAns !== trimmed) {
                if (!prevAns) {
                    totalAnsweredRef.current += 1;
                    setTotalAnswered(totalAnsweredRef.current);
                }
                syncAnswerWithBackend(currentQuestion._id, trimmed);
            }
        }
        setCurrentIndex(index);
        // Restore saved answer if any
        const targetQ = questions[index];
        if (targetQ && answersMapRef.current[targetQ._id]) {
            setAnswer(answersMapRef.current[targetQ._id].answer || '');
        } else {
            setAnswer('');
        }
    };

    const handleFinishExam = async (isTimerExpired = false) => {
        // Guard against double submits (e.g. the timer expiring while the last
        // answer is being submitted)
        if (finishingRef.current) return;

        // Remember the in-flight background sync: the final submit is sent after it so
        // it is the last write. Queued (not yet sent) syncs are skipped from now on -
        // the final submit carries every answer anyway.
        const inFlight = syncInFlightRef.current;
        finishingRef.current = true;

        const deadline = deadlineMsRef.current;
        // Finish time in SERVER time: when the student completed the last question,
        // or the deadline if the time ran out.
        let finishMs = isTimerExpired === true
            ? (deadline || serverNowMs())
            : (lastAnswerAtRef.current || serverNowMs());
        if (deadline) finishMs = Math.min(finishMs, deadline);

        changeStatus('waiting-for-end');
        setLocalFinishedAt(new Date(finishMs));
        setIsCheckingAnswers(true);

        try {
            if (inFlight) await inFlight;
        } catch (e) { /* already logged */ }

        // Final score submit (the server grades the answers; client scores are ignored)
        for (let attempt = 0; attempt < 4; attempt++) {
            try {
                const finalRes = await updateLiveScore(competitionId, {
                    studentId: studentID,
                    userName: studentName,
                    finished: true,
                    finishedAt: new Date(finishMs).toISOString(),
                    answers: buildAnswersPayload()
                });
                if (finalRes && finalRes.message === 'success') {
                    if (finalRes.answers) applySecureAnswers(finalRes.answers);
                    if (finalRes.finishedAt) setLocalFinishedAt(finalRes.finishedAt);
                    break;
                }
                if (finalRes && finalRes.code === 'COMPETITION_FINISHED') {
                    break;
                }
                if (finalRes && finalRes.code === 'AUTH') {
                    handleAuthLost();
                    break;
                }
                if (!finalRes || !(finalRes.error || (finalRes.httpStatus || 0) >= 500)) break;
            } catch (e) {
                console.error("Failed to submit final answers:", e);
            }
            await sleep(800 * (attempt + 1));
        }
        setIsCheckingAnswers(false);

        // Results appear when the server has finalized (teacher ends / time is up)
        pollStatusRef.current?.();
    };
    handleFinishExamRef.current = handleFinishExam;

    const calculateBadges = (allParticipants, totalQuestionsCount = 0) => {
        const ranked = sortParticipants(allParticipants, true);
        const myDetails = ranked.find(p => String(getParticipantId(p)) === String(studentID));
        if (!myDetails) return;

        const myScore = myDetails.score || 0;
        const total = totalQuestionsCount || questionsRef.current.length || 0;
        const currentBadges = [];

        if (myScore === total && total > 0) {
            currentBadges.push({ name: "Sniper Accuracy", desc: "100% Correct Answers", icon: <Target size={24} /> });
        }
        if (myScore >= 1) {
            currentBadges.push({ name: "Arena Combatant", desc: "Solved at least 1 question correctly", icon: <Star size={24} /> });
        }

        const rank = myDetails.displayRank;
        if (isPodiumEligible(myDetails)) {
            if (rank === 1) {
                currentBadges.push({ name: "Arena Champion", desc: "Finished 1st place in the battle!", icon: <Trophy size={24} /> });
            } else if (rank === 2 || rank === 3) {
                currentBadges.push({ name: "Podium Conqueror", desc: `Finished in #${rank} place`, icon: <Award size={24} /> });
            }
        }

        setBadges(currentBadges);
    };

    const formatTimer = (seconds) => {
        if (seconds === null || seconds === undefined || seconds < 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (error) return (
        <div className="error-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px', textAlign: 'center' }}>
            <p>{error}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {canRetryJoin && (
                    <button className="return-to-dash-btn" onClick={() => setInitAttempt(n => n + 1)}>Try again</button>
                )}
                <button className="return-to-dash-btn" onClick={() => navigate('/dashboard/student')}>Back to dashboard</button>
            </div>
        </div>
    );
    if (!competition) return <div className="error-container"><p>Competition not found.</p></div>;

    const totalQuestions = questions.length || competition.questionsCount || competition.questions?.length || 0;
    const sortedParticipants = sortParticipants(participants, status === 'finished');
    const podiumWinners = sortedParticipants.filter(isPodiumEligible).slice(0, 3);
    const myDetails = sortedParticipants.find(p => String(getParticipantId(p)) === String(studentID));
    const myRank = myDetails ? myDetails.displayRank : 0;
    const canGetCertificate = !!myDetails && isPodiumEligible(myDetails) && myRank > 0 && myRank <= 10;

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
            {status === 'lobby' && <MobileNav role="Student" />}
            {status === 'lobby' && <Navbar />}

            {triggerConfetti && <Confetti recycle={false} numberOfPieces={300} />}

            {/* 1. LOBBY WAITING STATE */}
            {status === 'lobby' && (
                <div className="lobby-room-wrapper">
                    <div className="lobby-main-card simple-waiting-card">
                        <h2 className="simple-competition-title">{competition.title}</h2>

                        <div className="simple-waiting-box">
                            <span className="circle-dots-loader-large"></span>
                            <h3 className="simple-waiting-text">
                                {t('studentCompetition.waitingForTeacher')}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. SYNCHRONIZED COUNTDOWN OVERLAY */}
            {status === 'countdown' && (
                <div className="countdown-overlay-fullscreen">
                    <div className="countdown-giant-digits">
                        {lobbyCountdown === 0 ? (
                            <h1 className="zoom-go">{t('studentCompetition.solve')}</h1>
                        ) : (
                            <h1 className="bounce-digit">{lobbyCountdown}</h1>
                        )}
                    </div>
                    <p className="countdown-sub">{t('studentCompetition.getReadyToRace')}</p>
                </div>
            )}

            {/* 2.5 WAITING FOR END OVERLAY */}
            {status === 'waiting-for-end' && (
                <div className="waiting-for-end-wrapper" style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px',
                    color: '#f8fafc',
                    textAlign: 'center',
                    background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)'
                }}>
                    <div className="pulse-circle" style={{ marginBottom: '24px', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6', borderRadius: '50%' }}>
                        <Timer size={48} className="glowing-icon" style={{ color: '#3b82f6', animation: 'pulse 2s infinite' }} />
                    </div>
                    <div className="loader" style={{ marginBottom: '24px' }}></div>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {timerRemaining > 0 ? '⏳ Waiting for Competition to Conclude...' : "⏰ Time's up! Calculating final results..."}
                    </h1>
                    <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '600px', marginBottom: '32px' }}>
                        {isCheckingAnswers
                            ? 'Saving your answers... please keep this page open.'
                            : (timerRemaining > 0
                                ? 'Your answers are saved! Please wait while the remaining time ticks down or until the teacher ends the competition.'
                                : 'Your answers are saved. The final ranking will appear here in a few seconds.')}
                    </p>
                    <div className="live-timer-box" style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        padding: '24px 48px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b' }}>Time Remaining</span>
                        <span style={{ fontSize: '48px', fontWeight: 'mono', color: '#38bdf8', fontFamily: 'monospace' }}>
                            {formatTimer(timerRemaining)}
                        </span>
                    </div>
                </div>
            )}

            {/* 3. ACTIVE LIVE SOLVING GAME — Homework style (no instant correction) */}
            {/* Questions still loading (they are only sent once the battle starts) */}
            {status === 'active' && !currentQuestion && (
                <div className="waiting-for-end-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', color: '#f8fafc', textAlign: 'center', padding: '32px' }}>
                    {questionsError ? (
                        <>
                            <p style={{ fontSize: '18px' }}>Could not load the questions. Please check your connection.</p>
                            <button className="return-to-dash-btn" onClick={() => ensureQuestionsLoaded()}>Try again</button>
                        </>
                    ) : (
                        <>
                            <div className="loader"></div>
                            <p style={{ fontSize: '18px' }}>Loading questions...</p>
                        </>
                    )}
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '28px' }}>{formatTimer(timerRemaining)}</span>
                </div>
            )}

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

                        {/* Only the logged-in student's own progress bar */}
                        <div className="visual-race-track-lanes">
                            {(() => {
                                const pName = studentName;
                                const pAnswered = totalAnswered;
                                const progressPercent = totalQuestions > 0 ? (pAnswered / totalQuestions) * 100 : 0;

                                return (
                                    <div className="lane-row lane-me" style={{ maxWidth: '600px', margin: '0 auto' }}>
                                        <span className="lane-name-lbl" style={{ textAlign: 'center', display: 'block', width: '100%' }}>
                                            <strong>Your Progress:</strong> {pAnswered} / {totalQuestions} Solved
                                        </span>
                                        <div className="lane-road">
                                            <div 
                                                className="lane-runner-progress" 
                                                style={{ width: `${pAnswered > 0 ? Math.max(8, progressPercent) : 0}%` }}
                                            >
                                                <div className="runner-avatar-icon">
                                                    {pName?.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
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
                            {currentQuestion?.typeOfAnswer === 'MCQ' ? (
                                <div className="mcq-battle-wrapper">
                                    <h3 className="mcq-battle-title">🎯 Choose your answer:</h3>
                                    <div className="mcq-battle-options-layout">
                                        {currentQuestion.wrongAnswer?.map((item, index) => {
                                            const isSelected = answer === item;
                                            return (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => handleOptionSelect(item)}
                                                    className={`mcq-battle-choice ${isSelected ? 'selected' : ''}`}
                                                >
                                                    <span className="choice-indicator">
                                                        {isSelected ? '✓' : String.fromCharCode(65 + index)}
                                                    </span>
                                                    <span className="choice-text">{item}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : currentQuestion?.typeOfAnswer === 'Graph' ? (
                                <div className="mcq-battle-wrapper">
                                    <h3 className="mcq-battle-title">📊 Choose your answer graph:</h3>
                                    <div className="graph-battle-options-layout">
                                        {currentQuestion.wrongPicAnswer?.map((item, index) => {
                                            const isSelected = answer === item;
                                            return (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => handleOptionSelect(item)}
                                                    className={`graph-battle-choice ${isSelected ? 'selected' : ''}`}
                                                >
                                                    <div className="graph-choice-img-wrapper">
                                                        <img src={item} alt={`Option ${index + 1}`} />
                                                    </div>
                                                    <span className="choice-indicator">
                                                        {isSelected ? '✓' : String.fromCharCode(65 + index)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <form 
                                    onSubmit={(e) => { e.preventDefault(); handleSubmitAnswer(); }}
                                    style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}
                                >
                                    <div className="answer-preview-screen">
                                        <input 
                                            type="text" 
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            readOnly={/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)}
                                            placeholder="?" 
                                            className="preview-input"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="custom-game-keyboard">
                                        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(digit => (
                                            <button 
                                                key={digit} 
                                                type="button"
                                                onClick={() => handleDigitClick(digit.toString())}
                                                className="key-btn digit-key"
                                            >
                                                {digit}
                                            </button>
                                        ))}
                                        <button type="button" onClick={() => handleDigitClick('0')} className="key-btn digit-key">0</button>
                                        <button type="button" onClick={handleDelete} className="key-btn action-key-clear">⌫</button>
                                        <button type="button" onClick={handleClear} className="key-btn action-key-clear">C</button>
                                    </div>

                                    <button 
                                        type="submit"
                                        className="submit-answer-btn-action"
                                        disabled={!answer.trim()}
                                    >
                                        <span>{!questions.some((q, i) => i !== currentIndex && !answersMap[q._id]) ? 'Submit & Finish' : 'Next'}</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </form>
                            )}
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
                        {(() => {
                            const myDetails = participants.find(p => String(getParticipantId(p)) === String(studentID));
                            const displayCorrect = myDetails?.score !== undefined ? myDetails.score : correctCount;
                            const displayWrong = myDetails?.wrongAnswers !== undefined ? myDetails.wrongAnswers : wrongCount;
                            const displayAnswered = myDetails?.totalAnswered !== undefined ? myDetails.totalAnswered : totalAnswered;
                            const displayUnanswered = Math.max(0, totalQuestions - displayAnswered);
                            const finishedVal = myDetails?.finishedAt || localFinishedAt;

                            return (
                                <div className="personal-results-summary">
                                    <div className="result-stat">
                                        <span className="result-label">Correct</span>
                                        <span className="result-value correct-val">{displayCorrect}</span>
                                    </div>
                                    <div className="result-stat">
                                        <span className="result-label">Wrong</span>
                                        <span className="result-value wrong-val">{displayWrong}</span>
                                    </div>
                                    <div className="result-stat">
                                        <span className="result-label">Unanswered</span>
                                        <span className="result-value unanswered-val">{displayUnanswered}</span>
                                    </div>
                                    <div className="result-stat">
                                        <span className="result-label">Elapsed Time</span>
                                        <span className="result-value" style={{ color: '#38bdf8', fontSize: '20px', fontWeight: '800', marginTop: '6px' }}>
                                            {finishedVal && competition?.startedAt
                                                ? formatElapsedMs(finishedVal, competition.startedAt)
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

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

                        {/* Certificate of Achievement Earned Banner for Top 10 */}
                        {canGetCertificate && (
                            <div className="personal-certificate-earned-banner" style={{
                                margin: '25px 0',
                                padding: '25px',
                                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(219, 39, 119, 0.15) 100%)',
                                border: '2px solid rgba(124, 58, 237, 0.3)',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                textAlign: 'center',
                                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.15)'
                            }}>
                                <span style={{ fontSize: '42px', filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))' }}>🎓</span>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '20px', fontFamily: "'Outfit', sans-serif", fontWeight: '700' }}>
                                        You Earned a Certificate of Achievement!
                                    </h3>
                                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5' }}>
                                        Congratulations! You finished in <strong>#{myRank} Place</strong> in this epic battle arena. 
                                        A professional print-ready Certificate of Excellence has been awarded to you.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsCertOpen(true)}
                                    className="claim-certificate-btn-action"
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '12px 30px',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    🏆 View & Print My Certificate
                                </button>
                            </div>
                        )}

                        {/* Leaderboard standing */}
                        <div className="ranking-table-list-scores">
                            <h3>Lobby Leaderboard & Time Reports</h3>
                            <table className="student-final-scores-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Player</th>
                                        <th>Correct</th>
                                        <th>Wrong</th>
                                        <th>Elapsed Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedParticipants.map((p, idx) => {
                                        const isMe = String(getParticipantId(p)) === String(studentID);
                                        return (
                                            <tr key={p.student?._id || idx} className={isMe ? 'row-is-me' : ''}>
                                                <td><strong>#{p.displayRank}</strong></td>
                                                <td>{p.student?.userName} {isMe && '(You)'}</td>
                                                <td className="score-correct">{p.score} / {totalQuestions}</td>
                                                <td className="score-wrong">{p.wrongAnswers || 0}</td>
                                                <td style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '13px' }}>
                                                    {formatElapsedMs(isMe ? (p.finishedAt || localFinishedAt) : p.finishedAt, competition?.startedAt)}
                                                </td>
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

            {/* Certificate Preview Modal */}
            <CertificateModal
                isOpen={isCertOpen}
                onClose={() => setIsCertOpen(false)}
                studentName={studentName}
                rank={canGetCertificate ? myRank : null}
                score={myDetails?.score}
                totalQuestions={totalQuestions}
                competitionTitle={competition?.title}
                teacherName={competition?.createdBy?.userName || 'Arena Director'}
                isMasterminds={(safeLocalStorage.getItem('school_name') || '').toLowerCase() === 'masterminds'}
            />
        </div>
    );
}

export default StudentCompetition;
