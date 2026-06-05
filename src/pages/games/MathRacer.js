import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ChevronLeft, Trophy, Timer, Star, RefreshCcw, Medal, Users, Copy, ArrowRight, ShieldAlert } from 'lucide-react';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import ArithmeticMcqDebugPanel from '../../components/debug/ArithmeticMcqDebugPanel';
import Pusher from 'pusher-js';
import API_BASE_URL from '../../config/api.config';
import './MathRacer.css';

const F1CarSVG = ({ color, name, isBoosting }) => (
  <div className="car-wrapper">
    <div className="car-label">{name}</div>
    <svg viewBox="0 0 130 40" width="110" height="34" xmlns="http://www.w3.org/2000/svg">
      {/* Fiery Boost Effect */}
      <path 
        className={`boost-flame ${isBoosting ? 'active' : ''}`} 
        d="M 15,25 Q -5,15 5,25 Q -10,35 15,25 Z" 
        fill="#f97316" 
        style={{ opacity: isBoosting ? 1 : 0, transition: 'opacity 0.2s', transformOrigin: '20px 25px' }}
      />
      <path 
        className={`boost-flame-inner ${isBoosting ? 'active' : ''}`} 
        d="M 15,25 Q 5,20 10,25 Q 0,30 15,25 Z" 
        fill="#fbbf24" 
        style={{ opacity: isBoosting ? 1 : 0, transition: 'opacity 0.2s', transformOrigin: '20px 25px' }}
      />
      
      {/* Front Wing */}
      <path d="M 105,28 L 125,28 L 125,24 L 105,24 Z" fill="#1e293b" />
      <path d="M 115,24 L 115,20 L 100,20 L 100,24 Z" fill={color} />
      
      {/* Main Body */}
      <path d="M 20,25 L 105,25 L 110,28 L 20,28 Z" fill="#334155" /> {/* Underfloor */}
      <path d="M 25,25 L 45,14 L 75,14 L 95,25 Z" fill={color} /> {/* Engine Cover & Nose */}
      <path d="M 95,25 L 115,25 Z" stroke={color} strokeWidth="4" />
      
      {/* Rear Wing */}
      <path d="M 10,12 L 30,12 L 30,22 L 10,22 Z" fill={color} />
      <path d="M 10,8 L 30,8 L 30,12 L 10,12 Z" fill="#1e293b" />
      <path d="M 15,8 L 15,25" stroke="#1e293b" strokeWidth="2" />
      <path d="M 25,8 L 25,25" stroke="#1e293b" strokeWidth="2" />

      {/* Cockpit & Driver */}
      <path d="M 50,14 C 50,8 70,8 70,14 Z" fill="#0f172a" />
      <circle cx="62" cy="10" r="5" fill="#facc15" /> {/* Driver Helmet */}

      {/* Wheels */}
      {/* Front Wheel */}
      <circle cx="95" cy="28" r="11" fill="#0f172a"/>
      <circle cx="95" cy="28" r="5" fill="#94a3b8"/>
      <circle cx="95" cy="28" r="2" fill="#ef4444"/>
      {/* Rear Wheel */}
      <circle cx="35" cy="28" r="13" fill="#0f172a"/>
      <circle cx="35" cy="28" r="6" fill="#94a3b8"/>
      <circle cx="35" cy="28" r="2" fill="#ef4444"/>
    </svg>
  </div>
);


const parseGridRows = (questionText) => {
    if (!questionText) return null;
    const trimmed = String(questionText).trim();
    if (!trimmed.startsWith('[')) return null;
    try {
        const rows = JSON.parse(trimmed);
        if (!Array.isArray(rows) || rows.length === 0) return null;
        const first = rows[0];
        if (
            first.op !== undefined || first.OP !== undefined ||
            first.val !== undefined || first.VAL !== undefined
        ) return rows;
    } catch (e) {}
    return null;
};

const getRowOp  = (row) => {
    const op = (row.op  !== undefined ? row.op  : (row.OP  !== undefined ? row.OP  : ''));
    return (!op || op.trim() === '') ? '+' : op;
};
const getRowVal = (row) => (row.val !== undefined ? row.val : (row.VAL !== undefined ? row.VAL : ''));

const formatQuestionText = (text) => {
    if (!text) return '';
    const trimmed = String(text).trim();
    if (trimmed.startsWith('[')) return text;
    
    return String(text).split('\n').map(line => {
        const trimmedLine = line.trim();
        if (/^[\d٠-٩]+(?:[.,][\d٠-٩]+)?$/.test(trimmedLine)) {
            return '+' + trimmedLine;
        }
        return line;
    }).join('\n');
};

const sanitizeForPusher = (questions) => {
  if (!questions) return null;
  return questions.map(q => ({
    _id: q._id,
    question: q.question,
    typeOfAnswer: q.typeOfAnswer,
    wrongAnswer: q.wrongAnswer || [],
    wrongPicAnswer: q.wrongPicAnswer || [],
    questionPic: q.questionPic || '',
    correctAnswer: q.correctAnswer || '',
    correctPicAnswer: q.correctPicAnswer || '',
    answer: q.answer || []
  }));
};

function MathRacer() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  // Custom Questions States
  const [customQuestions, setCustomQuestions] = useState(location.state?.customQuestions || null);
  const [chapterName, setChapterName] = useState(location.state?.chapterName || '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [essayAnswer, setEssayAnswer] = useState('');

  // Matchmaking & Multiplayer States
  const [gameMode, setGameMode] = useState('single'); // 'single' or 'multi'
  const [multiRole, setMultiRole] = useState(null); // 'host' or 'guest'
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [players, setPlayers] = useState([]); // [{ id, name, color, distance, score, finished, time, isBoosting }]
  const [lobbyStatus, setLobbyStatus] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // User Credentials
  const myName = localStorage.getItem('pp_name') || 'Racer ' + Math.floor(100 + Math.random() * 900);
  const myId = localStorage.getItem('pp_id') || 'usr_' + Math.random().toString(36).substr(2, 9);
  
  const F1_COLORS = ['#3b82f6', '#f43f5e', '#8b5cf6', '#10b981', '#fbbf24'];

  const [gameState, setGameState] = useState('menu'); // 'menu', 'lobby', 'playing', 'gameover'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentProblem, setCurrentProblem] = useState({ text: '', answer: 0, options: [] });
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
  
  // Race Distances (Single player only fallback)
  const [playerDistance, setPlayerDistance] = useState(0);
  const [bot1Distance, setBot1Distance] = useState(0);
  const [bot2Distance, setBot2Distance] = useState(0);
  
  const RACE_LENGTH = 200;
  
  const timerRef = useRef(null);
  const pusherRef = useRef(null);
  const channelRef = useRef(null);

  // Clean up socket subscriptions on unmount
  useEffect(() => {
    return () => {
      disconnectPusher();
    };
  }, []);

  const disconnectPusher = () => {
    if (channelRef.current) {
      channelRef.current.unbind_all();
    }
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
  };

  // Helper to trigger socket event broadcast via backend proxy route
  const broadcastPusherEvent = async (roomCode, eventName, eventData) => {
    try {
      await fetch(`${API_BASE_URL}/competition/mathracer/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelName: `mathracer-${roomCode}`,
          eventName,
          eventData
        })
      });
    } catch (err) {
      console.error(`[MULTIPLAYER] Failed to broadcast ${eventName}:`, err);
    }
  };

  // Initialize Pusher subscriptions and bind events
  const initPusherMultiplayer = (roomCode, roleType) => {
    disconnectPusher();
    setLobbyStatus('Connecting to server...');

    const pusher = new Pusher('06df370fb33f1263ec1f', {
      cluster: 'eu'
    });
    pusherRef.current = pusher;

    const channelName = `mathracer-${roomCode}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    pusher.connection.bind('connected', () => {
      setLobbyStatus('Connected! Waiting for racers...');
    });

    pusher.connection.bind('error', () => {
      setLobbyStatus('Connection error. Please try again.');
    });

    if (roleType === 'host') {
      const hostPlayer = {
        id: myId,
        name: myName,
        color: F1_COLORS[0],
        distance: 0,
        score: 0,
        finished: false,
        time: null,
        isBoosting: false
      };
      setPlayers([hostPlayer]);

      // Host listens for new players joining
      channel.bind('student-joined', (data) => {
        soundEffects.playClick();
        setPlayers(prev => {
          if (prev.some(p => p.id === data.id)) return prev;

          const nextColor = F1_COLORS[prev.length % F1_COLORS.length];
          const newPlayer = {
            id: data.id,
            name: data.name,
            color: nextColor,
            distance: 0,
            score: 0,
            finished: false,
            time: null,
            isBoosting: false
          };
          const updated = [...prev, newPlayer];
          
          // Broadcast full lobby roster back to all guest players
          broadcastPusherEvent(roomCode, 'sync-lobby', { 
            players: updated,
            hasCustomQuestions: !!customQuestions,
            chapterName: chapterName
          });
          return updated;
        });
      });

      // Host listens to score/distance updates from active guest players
      channel.bind('player-progress', (data) => {
        setPlayers(prev => prev.map(p => 
          p.id === data.id ? { ...p, distance: data.distance, score: data.score, isBoosting: !!data.isBoosting } : p
        ));
      });

      // Host listens to finished signal from active guest players
      channel.bind('player-finished', (data) => {
        setPlayers(prev => prev.map(p => 
          p.id === data.id ? { ...p, finished: true, time: data.time } : p
        ));
      });

    } else {
      // Guest player listens to full lobby syncing from the host
      channel.bind('sync-lobby', (data) => {
        console.log('[LOBBY] Synced roster from host:', data);
        setPlayers(data.players);
        if (data.hasCustomQuestions) {
          setChapterName(data.chapterName || '');
        }
      });

      // Guest listens to host's race start trigger
      channel.bind('start-game', (data) => {
        setDifficulty(data.difficulty);
        setGameState('playing');
        setScore(0);
        setTimeElapsed(0);
        setPlayerDistance(0);
        setFeedback(null);
        setCurrentQuestionIndex(0);
        setEssayAnswer('');
        if (data.customQuestions) {
          setCustomQuestions(data.customQuestions);
          generateProblem(data.difficulty, 0, data.customQuestions);
        } else {
          generateProblem(data.difficulty, 0, null);
        }
      });

      // Guest listens to score/distance updates from host/other guests
      channel.bind('player-progress', (data) => {
        setPlayers(prev => prev.map(p => 
          p.id === data.id ? { ...p, distance: data.distance, score: data.score, isBoosting: !!data.isBoosting } : p
        ));
      });

      // Guest listens to finished signals from host/other guests
      channel.bind('player-finished', (data) => {
        setPlayers(prev => prev.map(p => 
          p.id === data.id ? { ...p, finished: true, time: data.time } : p
        ));
      });

      // Immediately notify host that we entered the room
      setTimeout(() => {
        broadcastPusherEvent(roomCode, 'student-joined', {
          id: myId,
          name: myName
        });
      }, 800);
    }
  };

  // Host Action: Create lobby
  const handleCreateRoom = () => {
    soundEffects.playClick();
    const code = Math.floor(10 + Math.random() * 90).toString();
    setRoomId(code);
    setMultiRole('host');
    setGameState('lobby');
    initPusherMultiplayer(code, 'host');
  };

  // Guest Action: Enter lobby code and join
  const handleJoinRoom = () => {
    if (!inputRoomId.trim()) return;
    soundEffects.playClick();
    const code = inputRoomId.trim();
    setRoomId(code);
    setMultiRole('guest');
    setGameState('lobby');
    initPusherMultiplayer(code, 'guest');
  };

  const copyRoomCode = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Generate a random addition/subtraction MCQ problem (always consistent), or load a custom question.
  const generateProblem = (diff, index = currentQuestionIndex, questions = customQuestions) => {
    if (questions && questions.length > 0) {
      const qIndex = index % questions.length;
      const q = questions[qIndex];
      
      let text = '';
      const gridRows = parseGridRows(q.question);
      if (gridRows) {
        text = 'ABACUS_GRID';
      } else {
        text = q.question || '';
      }
      
      let options = [];
      if (q.typeOfAnswer === 'MCQ' && Array.isArray(q.wrongAnswer)) {
        options = q.wrongAnswer;
      } else if (q.typeOfAnswer === 'Graph' && Array.isArray(q.wrongPicAnswer)) {
        options = q.wrongPicAnswer;
      }

      setCurrentProblem({
        text: text === 'ABACUS_GRID' ? 'ABACUS_GRID' : formatQuestionText(text),
        options,
        answer: q.correctAnswer || (q.answer && q.answer[0]) || q.correctPicAnswer || '',
        typeOfAnswer: q.typeOfAnswer,
        gridRows: gridRows || null,
        questionPic: q.questionPic || '',
        _id: q._id
      });
      return;
    }

    let num1, num2, operator, answer;
    
    // Keep levels mapped to tighter/wider ranges.
    if (diff === '0' || diff === 'easy') {
      operator = Math.random() > 0.5 ? '+' : '-';
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      if (operator === '-' && num1 < num2) {
        let temp = num1; num1 = num2; num2 = temp;
      }
    } else if (diff === '1' || diff === 'medium') {
      operator = Math.random() > 0.5 ? '+' : '-';
      num1 = Math.floor(Math.random() * 90) + 10;
      num2 = Math.floor(Math.random() * 90) + 10;
      if (operator === '-' && num1 < num2) {
        let temp = num1; num1 = num2; num2 = temp;
      }
    } else {
      operator = Math.random() > 0.5 ? '+' : '-';
      num1 = Math.floor(Math.random() * 900) + 100;
      num2 = Math.floor(Math.random() * 900) + 100;
      if (operator === '-' && num1 < num2) {
        let temp = num1; num1 = num2; num2 = temp;
      }
    }

    if (operator === '+') answer = num1 + num2;
    if (operator === '-') answer = num1 - num2;

    let options = [answer];
    let loopCount = 0;
    while (options.length < 4 && loopCount < 50) {
      loopCount++;
      const fake = answer + Math.floor(Math.random() * 10) - 5;
      if (!options.includes(fake) && fake >= 0) options.push(fake);
    }
    while(options.length < 4) {
      options.push(Math.floor(Math.random() * 100));
    }
    options.sort(() => Math.random() - 0.5);

    setCurrentProblem({ text: `${num1} ${operator} ${num2} = ?`, answer, options });
  };

  const startGame = (selectedLevel) => {
    soundEffects.playClick();
    setDifficulty(selectedLevel);

    setScore(0);
    setTimeElapsed(0);
    setPlayerDistance(0);
    setBot1Distance(0);
    setBot2Distance(0);
    setGameState('playing');
    setFeedback(null);
    setCurrentQuestionIndex(0);
    setEssayAnswer('');
    generateProblem(selectedLevel, 0, customQuestions);
  };

  // Host Action: Trigger race start for all players
  const handleHostStartRace = (selectedLevel) => {
    if (players.length < 1) return; // Allow practice alone, or multiple
    soundEffects.playClick();
    setDifficulty(selectedLevel);
    
    // Broadcast start race config to all guests
    broadcastPusherEvent(roomId, 'start-game', { 
      difficulty: selectedLevel,
      customQuestions: customQuestions ? sanitizeForPusher(customQuestions) : null
    });
    
    // Initialize host gameplay
    setScore(0);
    setTimeElapsed(0);
    setPlayerDistance(0);
    setGameState('playing');
    setFeedback(null);
    setCurrentQuestionIndex(0);
    setEssayAnswer('');
    generateProblem(selectedLevel, 0, customQuestions);
  };

  const endGame = () => {
    soundEffects.playEndSound();
    setGameState('gameover');
    clearInterval(timerRef.current);
  };

  // Main Game Loop (Timer & Bots)
  useEffect(() => {
    if (gameState === 'playing') {
      // 1-second timer (Elapsed time)
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      
      // Bot movement & Win Check (10 times per second) - only in Single Player VS Bots
      let botInterval;
      if (gameMode === 'single') {
        botInterval = setInterval(() => {
          setBot1Distance(prev => {
            const newDist = prev + (difficulty === 'easy' ? 0.15 : difficulty === 'medium' ? 0.22 : 0.28) + (Math.random() * 0.05);
            if (newDist >= RACE_LENGTH) endGame();
            return newDist;
          });
          setBot2Distance(prev => {
            const newDist = prev + (difficulty === 'easy' ? 0.18 : difficulty === 'medium' ? 0.25 : 0.32) + (Math.random() * 0.05);
            if (newDist >= RACE_LENGTH) endGame();
            return newDist;
          });
          setPlayerDistance(prev => {
            if (prev >= RACE_LENGTH) endGame();
            return prev;
          });
        }, 100);
      }
      
      return () => {
        clearInterval(timerRef.current);
        if (botInterval) clearInterval(botInterval);
      };
    }
  }, [gameState, gameMode, difficulty]);

  // Real-time Multiplayer Distance Synchronizer
  useEffect(() => {
    if (gameState === 'playing' && gameMode === 'multi' && roomId) {
      // Synchronize player distance with others in room
      broadcastPusherEvent(roomId, 'player-progress', {
        id: myId,
        distance: playerDistance,
        score: score,
        isBoosting: feedback === 'correct'
      });

      // Victory Check
      if (playerDistance >= RACE_LENGTH) {
        const finalTime = `${timeElapsed}s`;
        
        broadcastPusherEvent(roomId, 'player-finished', {
          id: myId,
          time: finalTime
        });

        // Mark ourselves as completed locally
        setPlayers(prev => prev.map(p => 
          p.id === myId ? { ...p, finished: true, time: finalTime, distance: playerDistance } : p
        ));

        endGame();
      }
    }
  }, [playerDistance, gameState, gameMode, roomId]);

  const handleOptionClick = (selectedOpt) => {
    const normalize = (val) => String(val !== undefined && val !== null ? val : "").trim();
    if (normalize(selectedOpt) === normalize(currentProblem.answer)) {
      handleCorrectAnswer();
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const handleEssaySubmit = (val = essayAnswer) => {
    const normalizeDigits = (str) => {
      if (!str) return '';
      const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
      return String(str)
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => ARABIC_DIGITS.indexOf(d).toString())
        .trim();
    };

    const normAnswer = normalizeDigits(val);
    const activeQ = customQuestions ? customQuestions[currentQuestionIndex % customQuestions.length] : null;
    const correctAnswersList = activeQ && Array.isArray(activeQ.answer)
      ? activeQ.answer
      : [currentProblem.answer];

    const isCorrect = correctAnswersList.map(normalizeDigits).includes(normAnswer);

    if (isCorrect) {
      handleCorrectAnswer();
      setEssayAnswer('');
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  const handleCorrectAnswer = () => {
    soundEffects.playCorrect();
    setScore(prev => prev + 10);
    
    setPlayerDistance(prev => {
      const jumpDist = difficulty === 'easy' || difficulty === '0' ? 15 : difficulty === 'medium' || difficulty === '1' ? 12 : 10;
      const newDistance = prev + jumpDist;
      
      // Update our local visual lane coordinates
      if (gameMode === 'multi') {
        setPlayers(prevPlayers => prevPlayers.map(p => 
          p.id === myId ? { ...p, distance: newDistance, score: score + 10 } : p
        ));
      }
      return newDistance;
    });
    
    setFeedback('correct');
    
    setTimeout(() => {
      if (customQuestions && customQuestions.length > 0) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        generateProblem(difficulty, nextIndex, customQuestions);
      } else {
        generateProblem(difficulty);
      }
      setFeedback(null);
    }, 200);
  };

  // Handle physical keyboard inputs for essay answers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || currentProblem.typeOfAnswer !== 'Essay') {
        return;
      }
      // If typing in another input, ignore
      if (document.activeElement && document.activeElement.tagName === 'INPUT' && !document.activeElement.classList.contains('racer-essay-input')) {
        return;
      }

      // If they are focused on the racer essay input, let the native input events handle it
      if (document.activeElement && document.activeElement.classList.contains('racer-essay-input')) {
        if (e.key === 'Enter') {
          handleEssaySubmit();
        }
        return;
      }

      if ((e.key >= '0' && e.key <= '9') || e.key === '-' || e.key === '.' || e.key === ',') {
        setEssayAnswer(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setEssayAnswer(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleEssaySubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentProblem.typeOfAnswer, essayAnswer]);


  // Determine Placement
  const getPlacement = () => {
    if (gameMode === 'single') {
      let place = 1;
      if (bot1Distance > playerDistance) place++;
      if (bot2Distance > playerDistance) place++;
      return place;
    } else {
      // Count how many players have a greater distance or completed faster
      const sorted = [...players].sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        if (a.finished && b.finished) {
          return parseInt(a.time) - parseInt(b.time);
        }
        return b.distance - a.distance;
      });
      const myRank = sorted.findIndex(p => p.id === myId) + 1;
      return myRank || 1;
    }
  };

  const getVisualPosition = (distance) => {
    // Player is always anchored at ~20% visually. We scale the relative distance.
    const relative = distance - playerDistance;
    const visual = 20 + (relative * 0.6); 
    return Math.max(-20, Math.min(90, visual));
  };

  const getFinishLineVisualPosition = () => {
    const relative = RACE_LENGTH - playerDistance;
    const visual = 20 + (relative * 0.6); 
    return visual;
  };

  // Lobby cleanup when leaving waiting lobby
  const handleLeaveLobby = () => {
    soundEffects.playClick();
    disconnectPusher();
    setGameState('menu');
  };

  // Get final placement list for podium
  const getPodiumList = () => {
    return [...players].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) {
        return parseInt(a.time) - parseInt(b.time);
      }
      return b.distance - a.distance;
    });
  };

  return (
    <>
      <MobileNav role="Student" />
      <Navbar />
      <ArithmeticMcqDebugPanel />
      
      <div className="math-racer-container">
        <div className="racer-header">
          <button onClick={() => { soundEffects.playClick(); navigate(-1); }} className="back-button">
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h2>Math Racer 🏎️💨</h2>
        </div>

        {gameState === 'menu' && (
          <div className="racer-menu">
            <div className="racer-logo">
              <F1CarSVG color="#3b82f6" name="" />
            </div>

            {customQuestions && (
              <div className="custom-race-banner">
                <span className="banner-badge">🏁 CUSTOM CHAPTER RACE</span>
                <p className="banner-title">
                  Playing with questions from <strong>Chapter {chapterName}</strong> ({customQuestions.length} questions)
                </p>
                <button className="clear-custom-btn" onClick={() => setCustomQuestions(null)}>
                  Clear Custom Questions
                </button>
              </div>
            )}
            
            {/* Premium Lobby Selection Tabs */}
            <div className="game-mode-tabs">
              <button 
                className={`mode-tab ${gameMode === 'single' ? 'active' : ''}`}
                onClick={() => { soundEffects.playClick(); setGameMode('single'); }}
              >
                🤖 Single Player VS Bots
              </button>
              <button 
                className={`mode-tab ${gameMode === 'multi' ? 'active' : ''}`}
                onClick={() => { soundEffects.playClick(); setGameMode('multi'); }}
              >
                👥 Real-Time Multiplayer VS Friends
              </button>
            </div>

            {gameMode === 'single' ? (
              <div className="single-player-setup">
                {customQuestions ? (
                  <>
                    <h3>Start Custom Race!</h3>
                    <p>Compete against AI racers on the endless highway using the questions loaded from the custom set.</p>
                    <div className="difficulty-buttons">
                      <button className="diff-btn easy" style={{ width: '100%', maxWidth: '300px' }} onClick={() => startGame('easy')}>
                        🏎️ Start Custom Race
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Select Difficulty to Race!</h3>
                    <p>Compete against AI racers on the endless highway. Solve math problems correctly to accelerate your car and take 1st place!</p>
                    
                    <div className="difficulty-buttons">
                      <button className="diff-btn easy" onClick={() => startGame('0')}>
                        Level 0
                      </button>
                      <button className="diff-btn medium" onClick={() => startGame('1')}>
                        Level 1
                      </button>
                      <button className="diff-btn hard" onClick={() => startGame('2')}>
                        Level 2
                      </button>
                      <button className="diff-btn hard" style={{background: '#4f46e5'}} onClick={() => startGame('3')}>
                        Level 3
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="multi-player-setup">
                <h3>Challenge Friends in Real-Time!</h3>
                <p>Host your own private F1 room and share your code, or enter a friend's room code to start the high-speed competition!</p>
                
                <div className="multiplayer-actions-panel">
                  <div className="host-section-card">
                    <h4>Host a New Match</h4>
                    <p>Start a racing room and invite up to 4 competitors!</p>
                    <button className="btn-multi-host" onClick={handleCreateRoom}>
                      🚀 Host a Race
                    </button>
                  </div>
                  
                  <div className="join-divider">
                    <span>OR</span>
                  </div>

                  <div className="join-section-card">
                    <h4>Join Existing Match</h4>
                    <p>Enter your competitor's room code to connect:</p>
                    <div className="join-input-group">
                      <input 
                        type="text" 
                        placeholder="Enter 2-Digit Code"
                        maxLength="2"
                        value={inputRoomId}
                        onChange={(e) => setInputRoomId(e.target.value)}
                        className="multi-join-input"
                      />
                      <button className="btn-multi-join" onClick={handleJoinRoom}>
                        Join Roster
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
           MULTIPLAYER LOBBY SCREEN (LOBBY WAITING SCREEN)
           ============================================================ */}
        {gameState === 'lobby' && (
          <div className="racer-lobby-panel">
            <div className="lobby-header-row">
              <h3>🏁 Match Roster Lobby</h3>
              <button className="btn-leave-lobby" onClick={handleLeaveLobby}>
                Exit Lobby
              </button>
            </div>

            {chapterName && (
              <div className="lobby-custom-badge">
                🏎️ Custom Race: Chapter {chapterName}
              </div>
            )}

            <div className="room-code-display-card">
              <span className="room-label">ROOM ENTRY CODE</span>
              <div className="code-badge-group">
                <span className="room-code-value">{roomId}</span>
                <button className="btn-copy-code" onClick={copyRoomCode}>
                  {isCopied ? 'Copied! ✓' : <><Copy size={16} /> Copy Code</>}
                </button>
              </div>
              <p className="server-status-label">🚦 {lobbyStatus}</p>
            </div>

            <div className="lobby-players-grid">
              <h4>Connected Racers ({players.length} / 4)</h4>
              <div className="roster-list">
                {players.map((player, idx) => (
                  <div key={player.id || idx} className="roster-player-item">
                    <div className="player-badge-color" style={{ backgroundColor: player.color }}></div>
                    <div className="player-profile-detail">
                      <span className="roster-player-name">{player.name}</span>
                      <span className="roster-player-rank">{idx === 0 ? '🏁 Room Host' : '🔥 Contender'}</span>
                    </div>
                    <span className="ready-indicator">Ready to Race ✓</span>
                  </div>
                ))}
                {players.length === 0 && (
                  <div className="empty-roster-state">
                    <i className="fa fa-spinner fa-spin"></i>
                    <p>Entering the room roster...</p>
                  </div>
                )}
              </div>
            </div>

            {multiRole === 'host' ? (
              <div className="host-launch-panel">
                {customQuestions ? (
                  <>
                    <h4>Launch Custom Race:</h4>
                    <div className="difficulty-buttons">
                      <button className="diff-btn easy" style={{ width: '100%', maxWidth: '300px' }} onClick={() => handleHostStartRace('easy')}>
                        🚀 Launch Custom Race
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h4>Select Difficulty & Launch Race:</h4>
                    <div className="difficulty-buttons">
                      <button className="diff-btn easy" onClick={() => handleHostStartRace('0')}>
                        🚀 Launch Level 0
                      </button>
                      <button className="diff-btn medium" onClick={() => handleHostStartRace('1')}>
                        🚀 Launch Level 1
                      </button>
                      <button className="diff-btn hard" onClick={() => handleHostStartRace('2')}>
                        🚀 Launch Level 2
                      </button>
                      <button className="diff-btn hard" style={{background: '#4f46e5'}} onClick={() => handleHostStartRace('3')}>
                        🚀 Launch Level 3
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="guest-waiting-panel">
                <div className="guest-spinner"></div>
                <p>Waiting for Host to launch the F1 race...</p>
              </div>
            )}
          </div>
        )}

        {gameState === 'playing' && (
          <div className="racer-gameplay" ref={containerRef}>
            <FullscreenButton targetRef={containerRef} />
            <div className="game-stats">
              <div className="stat-box timer-box">
                <Timer size={24} color="#fff" />
                <span style={{ color: '#fff' }}>{timeElapsed}s</span>
              </div>
              <div className="stat-box placement-box">
                <Medal size={24} color="#10b981" />
                <span>{getPlacement()}{getPlacement() === 1 ? 'st' : getPlacement() === 2 ? 'nd' : 'rd'}</span>
              </div>
              <div className="stat-box score-box">
                <Trophy size={24} color="#f59e0b" />
                <span>{score}</span>
              </div>
            </div>

            {/* The Infinite Journey Track */}
            <div className={`track-container ${gameState === 'playing' ? 'is-moving' : ''}`}>
              <div className="sky-bg"></div>
              <div className="mountains-bg"></div>
              <div className="trees-bg"></div>
              
              <div className="road">
                {/* Finish Line */}
                <div className="finish-line-container" style={{ left: `${getFinishLineVisualPosition()}%` }}>
                  <div className="finish-pole left-pole">
                    <div className="finish-flag">🏁</div>
                  </div>
                  <div className="finish-banner">FINISH LINE</div>
                  <div className="finish-pole right-pole">
                    <div className="finish-flag">🏁</div>
                  </div>
                  <div className="finish-line-checkered"></div>
                </div>
                
                {gameMode === 'single' ? (
                  <>
                    {/* Lane 1: Bot 1 */}
                    <div className="lane">
                      <div className="lane-marker"></div>
                      <div className="racer-car bot-car" style={{ left: `${getVisualPosition(bot1Distance)}%` }}>
                        <F1CarSVG color="#f43f5e" name="Bot 1" />
                      </div>
                    </div>
                    {/* Lane 2: Player */}
                    <div className="lane player-lane">
                      <div className="lane-marker"></div>
                      <div className={`racer-car player-car ${feedback === 'correct' ? 'accelerating' : ''} ${feedback === 'wrong' ? 'stalling' : ''}`} style={{ left: `${getVisualPosition(playerDistance)}%` }}>
                        <F1CarSVG color="#3b82f6" name="You" isBoosting={feedback === 'correct'} />
                      </div>
                    </div>
                    {/* Lane 3: Bot 2 */}
                    <div className="lane">
                      <div className="racer-car bot-car" style={{ left: `${getVisualPosition(bot2Distance)}%` }}>
                        <F1CarSVG color="#8b5cf6" name="Bot 2" />
                      </div>
                    </div>
                  </>
                ) : (
                  /* ============================================================
                     MULTIPLAYER REAL-TIME DYNAMIC ROSTER LANES
                     ============================================================ */
                  players.map((player, idx) => {
                    const isMe = player.id === myId;
                    const carDistance = isMe ? playerDistance : player.distance;
                    const visualLeft = getVisualPosition(carDistance);
                    
                    return (
                      <div key={player.id || idx} className={`lane ${isMe ? 'player-lane' : ''}`}>
                        <div className="lane-marker"></div>
                        <div 
                          className={`racer-car ${isMe ? 'player-car' : 'bot-car'} ${isMe && feedback === 'correct' ? 'accelerating' : ''} ${isMe && feedback === 'wrong' ? 'stalling' : ''}`} 
                          style={{ left: `${visualLeft}%` }}
                        >
                          <F1CarSVG 
                            color={player.color} 
                            name={isMe ? `${player.name} (You)` : player.name} 
                            isBoosting={isMe ? feedback === 'correct' : !!player.isBoosting} 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={`problem-container ${feedback} ${currentProblem.typeOfAnswer || ''}`}>
              
              {/* Optional Question Image */}
              {currentProblem.questionPic && (
                <div className="racer-question-image-wrapper">
                  <img src={currentProblem.questionPic} alt="Question Diagram" className="racer-question-image" />
                </div>
              )}

              {/* Problem Content */}
              {currentProblem.text === 'ABACUS_GRID' && currentProblem.gridRows ? (
                <div className="racer-abacus-grid-view">
                  <table className="racer-abacus-display-table">
                    <tbody>
                      {currentProblem.gridRows.map((row, i) => (
                        <tr key={i}>
                          <td className="op-cell">{getRowOp(row)}</td>
                          <td className="val-cell">{getRowVal(row)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="problem-text" style={{ whiteSpace: 'pre-wrap' }}>{currentProblem.text}</div>
              )}

              {/* Answer Inputs / Choices */}
              {currentProblem.typeOfAnswer === 'Essay' ? (
                /* ==========================================
                   ESSAY / NUMERIC keypad input view
                   ========================================== */
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    handleEssaySubmit(essayAnswer); 
                  }} 
                  className="racer-essay-input-container"
                >
                  <div className="racer-essay-input-row">
                    <input 
                      type="text" 
                      value={essayAnswer} 
                      onChange={(e) => setEssayAnswer(e.target.value)}
                      readOnly={/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)}
                      placeholder="Type Answer..." 
                      className="racer-essay-input"
                      autoFocus
                    />
                    <button 
                      type="submit"
                      className="racer-essay-submit-btn"
                    >
                      OK
                    </button>
                  </div>
                  
                  {/* Visual keypad grid */}
                  <div className="racer-keypad">
                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'].map(num => (
                      <button 
                        key={num} 
                        type="button"
                        onClick={() => setEssayAnswer(prev => prev + num)}
                        className="racer-keypad-btn digit"
                      >
                        {num}
                      </button>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setEssayAnswer(prev => prev.slice(0, -1))}
                      className="racer-keypad-btn clear"
                    >
                      ×
                    </button>
                  </div>
                </form>
              ) : currentProblem.typeOfAnswer === 'Graph' ? (
                /* ==========================================
                   GRAPH image choices
                   ========================================== */
                <div className="math-racer-graph-options">
                  {currentProblem.options && currentProblem.options.map((opt, i) => (
                    <button 
                      key={i} 
                      className="racer-graph-option-btn"
                      onClick={() => handleOptionClick(opt)}
                    >
                      <img src={opt} alt={`Graph choice ${i + 1}`} />
                    </button>
                  ))}
                </div>
              ) : (
                /* ==========================================
                   MCQ (or standard arithmetic fallback)
                   ========================================== */
                <div className="math-racer-options">
                  {currentProblem.options && currentProblem.options.map((opt, i) => (
                    <button 
                      key={i} 
                      className="racer-option-btn"
                      onClick={() => handleOptionClick(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="racer-gameover">
            <h2>Race Finished! 🏁</h2>
            
            {gameMode === 'single' ? (
              <div className="results-podium">
                <div className="final-placement">
                  <Medal size={40} color="#10b981" />
                  <h3>{getPlacement()}{getPlacement() === 1 ? 'st' : getPlacement() === 2 ? 'nd' : 'rd'} Place</h3>
                </div>
                <div className="final-score">
                  <Trophy size={40} color="#f59e0b" />
                  <h3>{score}</h3>
                  <p>Points</p>
                </div>
              </div>
            ) : (
              /* ============================================================
                 MULTIPLAYER REAL-TIME PODIUM LEADERBOARD
                 ============================================================ */
              <div className="multiplayer-leaderboard-card">
                <h3>🏆 Final Roster Leaderboard</h3>
                <div className="leaderboard-list">
                  {getPodiumList().map((player, idx) => {
                    const rank = idx + 1;
                    const isMe = player.id === myId;
                    return (
                      <div key={player.id || idx} className={`leaderboard-item rank-${rank} ${isMe ? 'highlight-me' : ''}`}>
                        <div className="rank-number">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}</div>
                        <div className="player-info">
                          <span className="player-name">{player.name} {isMe && '(You)'}</span>
                          <span className="player-score">Score: {player.score} pts</span>
                        </div>
                        <div className="finish-time-badge">
                          {player.finished ? `🏁 ${player.time}` : '🚗 Racing...'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="gameover-actions">
              {gameMode === 'single' ? (
                <button className="play-again-btn" onClick={() => startGame(difficulty)}>
                  <RefreshCcw size={20} /> Race Again
                </button>
              ) : (
                <button className="play-again-btn" onClick={() => { soundEffects.playClick(); setGameState('lobby'); }}>
                  <Users size={20} /> Back to Lobby
                </button>
              )}
              <button className="menu-btn" onClick={() => { soundEffects.playClick(); disconnectPusher(); setGameState('menu'); }}>
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MathRacer;
