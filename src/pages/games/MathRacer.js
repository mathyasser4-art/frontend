import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ChevronLeft, Trophy, Timer, Star, RefreshCcw, Medal, Users, Copy, ArrowRight, ShieldAlert, BookOpen, Layers, Swords, Circle, CheckCircle2, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import ArithmeticMcqDebugPanel from '../../components/debug/ArithmeticMcqDebugPanel';
import Pusher from 'pusher-js';
import API_BASE_URL from '../../config/api.config';
import Draggable from 'react-draggable';
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


function MathRacer() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  // Custom Questions States
  const [customQuestions, setCustomQuestions] = useState(location.state?.customQuestions || null);
  const customQuestionsRef = useRef(customQuestions);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    customQuestionsRef.current = customQuestions;
  }, [customQuestions]);

  const [chapterName, setChapterName] = useState(location.state?.chapterName || '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [essayAnswer, setEssayAnswer] = useState('');

  // Wizard Question Selector States
  const { t, i18n } = useTranslation();
  const [wizardStep, setWizardStep] = useState('system'); // Forced to system
  const [questionTypeID, setQuestionTypeID] = useState('65a4963482dbaac16d820fc6'); // Force MCQ
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [systemData, setSystemData] = useState([]);
  const [unitData, setUnitData] = useState([]);
  const [loadingWizard, setLoadingWizard] = useState(false);
  const [customWorksheets, setCustomWorksheets] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState(location.state?.chapterId || '');
  const [wizardError, setWizardError] = useState(null);

  const loadCustomWorksheets = () => {
      setLoadingWizard(true);
      setWizardError(null);
      const Token = localStorage.getItem('O_authWEB');
      fetch(`${API_BASE_URL}/chapter/custom`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
          }
      })
          .then(res => res.json())
          .then(data => {
              if (data.message === 'success') {
                  setCustomWorksheets(data.chapters || []);
                  setWizardStep('custom-ws');
                  setSearchQuery('');
              } else {
                  setWizardError(data.message);
              }
              setLoadingWizard(false);
          })
          .catch(err => {
              setWizardError(err.message);
              setLoadingWizard(false);
          });
  };

  const loadMyAssignments = () => {
      setLoadingWizard(true);
      setWizardError(null);
      const Token = localStorage.getItem('O_authWEB');
      fetch(`${API_BASE_URL}/teacher/getAssignment`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
          }
      })
          .then(res => res.json())
          .then(data => {
              if (data.message === 'success') {
                  setMyAssignments(data.allAssignment || []);
                  setWizardStep('assignments');
                  setSearchQuery('');
              } else {
                  setWizardError(data.message);
              }
              setLoadingWizard(false);
          })
          .catch(err => {
              setWizardError(err.message);
              setLoadingWizard(false);
          });
  };

  useEffect(() => {
      if (questionTypeID && questionTypeID !== 'custom') {
          getSystem(setLoadingWizard, setSystemData, questionTypeID);
      }
  }, [questionTypeID]);

  useEffect(() => {
      if (selectedSubject && questionTypeID !== 'custom') {
          getUnit(setLoadingWizard, setUnitData, questionTypeID, selectedSubject._id);
      }
  }, [selectedSubject, questionTypeID]);

  const handleSelectType = (type) => {
      soundEffects.playClick();
      setQuestionTypeID(type === 'mcq' ? '65a4963482dbaac16d820fc6' : '65a4964b82dbaac16d820fc8');
      setWizardStep('system');
  };

  const handleSelectSubject = (subject) => {
      soundEffects.playClick();
      setSelectedSubject(subject);
      setWizardStep('unit');
  };

  const handleSelectChapter = (chapter) => {
      soundEffects.playClick();
      setLoadingWizard(true);
      setWizardError(null);
      setSelectedChapterId(chapter._id);
      setChapterName(chapter.chapterName);
      
      const URL = `${API_BASE_URL}/chapter/getChapterQuestion/${chapter._id}`;
      const Token = localStorage.getItem('O_authWEB');
      fetch(URL, {
          method: 'get',
          headers: { 
              'Content-Type': 'application/json',
              ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
          },
      })
          .then(r => r.json())
          .then(responseJson => {
              if (responseJson.message === 'success') {
                  setCustomQuestions(responseJson.chapter?.questions || []);
              } else {
                  setWizardError(responseJson.message);
              }
              setLoadingWizard(false);
          })
          .catch(err => {
              setWizardError(err.message);
              setLoadingWizard(false);
          });
  };

  const handleWizardBack = () => {
      soundEffects.playClick();
      if (wizardStep === 'custom-ws' || wizardStep === 'assignments' || wizardStep === 'type') {
          setWizardStep('source');
          setWizardError(null);
      } else if (wizardStep === 'unit') {
          setWizardStep('system');
          setSelectedSubject(null);
          setUnitData([]);
          setSelectedUnitId(null);
      } else if (wizardStep === 'system') {
          setWizardStep('type');
          setQuestionTypeID('');
          setSystemData([]);
          setSelectedSystemId(null);
      }
  };

  const toggleSystemExpand = (id) => {
      soundEffects.playClick();
      setSelectedSystemId(id);
  };

  const toggleUnitExpand = (id) => {
      soundEffects.playClick();
      setSelectedUnitId(id);
  };

  const translateName = (name) => {
      if (!name) return '';
      const key = `systemNames.${name}`;
      const translated = t(key);
      return translated !== key ? translated : name;
  };

  // Matchmaking & Multiplayer States
  const userRole = localStorage.getItem('auth_role') || '';
  const isTeacher = userRole === 'Teacher' || userRole === 'School';

  const [gameMode, setGameMode] = useState(isTeacher ? 'multi' : 'single'); // 'single' or 'multi'
  const [multiRole, setMultiRole] = useState(null); // 'host' or 'guest'
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [players, setPlayers] = useState([]); // [{ id, name, color, distance, score, finished, time, isBoosting }]
  const [lobbyStatus, setLobbyStatus] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [hostQuestionCount, setHostQuestionCount] = useState(10);
  const [activeQuestionCount, setActiveQuestionCount] = useState(10);
  const [hostIsRacing, setHostIsRacing] = useState(false); // Default host to spectator mode

  // User Credentials
  const [myName] = useState(() => {
    let name = localStorage.getItem('pp_name') || localStorage.getItem('guest_name');
    if (!name) {
      name = 'Racer ' + Math.floor(100 + Math.random() * 900);
      localStorage.setItem('guest_name', name);
    }
    return name;
  });

  const [myId] = useState(() => {
    let id = localStorage.getItem('pp_id') || localStorage.getItem('guest_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guest_id', id);
    }
    return id;
  });
  
  const F1_COLORS = ['#3b82f6', '#f43f5e', '#8b5cf6', '#10b981', '#fbbf24'];
  const CAR_SKINS = { 'car_red': '#ef4444', 'car_purple': '#a855f7', 'car_gold': '#fbbf24' };
  const [mySkinColor, setMySkinColor] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('O_authWEB');
    if (token) {
      fetch(`${API_BASE_URL}/user/userAuthorize/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.message === 'success' && data.userInfo?.currentCarSkin) {
            setMySkinColor(CAR_SKINS[data.userInfo.currentCarSkin] || null);
          }
        })
        .catch(console.error);
    }
  }, []);

  const [gameState, setGameState] = useState('menu'); // 'menu', 'lobby', 'countdown', 'playing', 'gameover'
  const [countdownValue, setCountdownValue] = useState(3);
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
  const lastCorrectIndexRef = useRef(-1);

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

    const pusher = new Pusher('app_e4ed3fcd3045501a594c2640c4d2dd75832ff677', {
      wsHost: 'ws-us.apinator.io',
      wsPort: 80,
      wssPort: 443,
      forceTLS: true,
      enabledTransports: ['ws', 'wss']
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
        color: mySkinColor || F1_COLORS[0],
        distance: 0,
        score: 0,
        finished: false,
        time: null,
        isBoosting: false,
        isSpectator: !hostIsRacing
      };
      setPlayers([hostPlayer]);

      // Host listens for new players joining
      channel.bind('student-joined', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
        soundEffects.playClick();
        setPlayers(prev => {
          if (prev.some(p => p.id === data.id)) return prev;

          const nextColor = F1_COLORS[prev.length % F1_COLORS.length];
          const newPlayer = {
            id: data.id,
            name: data.name,
            color: data.skinColor || nextColor,
            distance: 0,
            score: 0,
            finished: false,
            time: null,
            isBoosting: false,
            isSpectator: false
          };
          
          return [...prev, newPlayer];
        });
      });

      // Host listens to score/distance updates from active guest players
      channel.bind('player-progress', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
        setPlayers(prev => prev.map(p => 
          p.id === data.id ? { ...p, distance: data.distance, score: data.score, isBoosting: !!data.isBoosting } : p
        ));
      });

      // Host listens to finished signal from active guest players
      channel.bind('player-finished', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
        setPlayers(prev => prev.map(p => 
          p.id === data.id ? { ...p, finished: true, time: data.time } : p
        ));
      });

    } else {
      // Guest player listens to full lobby syncing from the host
      channel.bind('sync-lobby', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
        console.log('[LOBBY] Synced roster from host:', data);
        setPlayers(data.players);
        if (data.questionCount) {
          setActiveQuestionCount(data.questionCount);
        }
        if (data.hasCustomQuestions && data.chapterName) {
          setChapterName(data.chapterName || '');
          // Fetch custom questions from database to avoid large Pusher payloads
          const Token = localStorage.getItem('O_authWEB');
          fetch(`${API_BASE_URL}/chapter/getChapterQuestion/${data.chapterName}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
            }
          })
            .then(res => res.json())
            .then(resJson => {
              if (resJson.message === 'success' && resJson.chapter?.questions) {
                setCustomQuestions(resJson.chapter.questions);
                customQuestionsRef.current = resJson.chapter.questions;
              }
            })
            .catch(err => console.error('[MathRacer] Error fetching guest questions:', err));
        }
      });

      // Guest listens to host's race start trigger
      channel.bind('start-game', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
        setDifficulty(data.difficulty);
        if (data.questionCount) {
          setActiveQuestionCount(data.questionCount);
        }
        if (data.customQuestions && data.customQuestions.length > 0) {
          setCustomQuestions(data.customQuestions);
          customQuestionsRef.current = data.customQuestions;
        }
        startCountdownThenPlay(data.difficulty, data.customQuestions || customQuestionsRef.current);
      });

      // Guest listens to host early exit
      channel.bind('end-race-early', () => {
        setGameState('lobby');
        setPlayers([]);
        alert('The host has ended the race.');
      });

      // Guest listens to score/distance updates from host/other guests
      channel.bind('player-progress', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
        setPlayers(prev => prev.map(p => 
          p.id === data.id ? { ...p, distance: data.distance, score: data.score, isBoosting: !!data.isBoosting } : p
        ));
      });

      // Guest listens to finished signals from host/other guests
      channel.bind('player-finished', (data) => {
            if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
        setPlayers(prev => prev.map(p => 
          p.id === data.id ? { ...p, finished: true, time: data.time } : p
        ));
      });

      channel.bind('host-end-race', () => {
        soundEffects.playEndSound();
        alert('The host has closed the race.');
        disconnectPusher();
        setGameState('menu');
      });

      // Notify host that we entered the room only after successful subscription
      channel.bind('pusher:subscription_succeeded', () => {
        broadcastPusherEvent(roomCode, 'student-joined', {
          id: myId,
          name: myName,
          skinColor: mySkinColor
        });
      });
      
      // Fallback: public channels sometimes don't reliably fire subscription_succeeded
      setTimeout(() => {
        broadcastPusherEvent(roomCode, 'student-joined', {
          id: myId,
          name: myName,
          skinColor: mySkinColor
        });
      }, 1000);
    }
  };

  useEffect(() => {
    if (gameState === 'lobby' && multiRole === 'host' && roomId) {
      setPlayers(prev => prev.map(p => p.id === myId ? { ...p, isSpectator: !hostIsRacing } : p));
    }
  }, [hostIsRacing, gameState, multiRole, roomId, myId]);

  useEffect(() => {
    if (gameState === 'lobby' && multiRole === 'host' && roomId) {
      broadcastPusherEvent(roomId, 'sync-lobby', {
        players: players,
        hasCustomQuestions: !!customQuestions,
        chapterName: selectedChapterId || chapterName,
        questionCount: hostQuestionCount
      });
    }
  }, [players, hostQuestionCount, hostIsRacing, gameState, multiRole, roomId, customQuestions, selectedChapterId, chapterName]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setInputRoomId(roomParam);
      setRoomId(roomParam);
      setGameMode('multi');
      setMultiRole('guest');
      setGameState('lobby');
      initPusherMultiplayer(roomParam, 'guest');
    }
  }, [location.search]);

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

  const copyShareLink = () => {
    soundEffects.playClick();
    const shareLink = `${window.location.origin}/student/games/math-racer?room=${roomId}`;
    navigator.clipboard.writeText(shareLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  // Generate a random addition/subtraction MCQ problem (always consistent), or load a custom question.
  const generateProblem = (diff, index = currentQuestionIndex, questions = customQuestions) => {
    const normalize = (val) => String(val !== undefined && val !== null ? val : "").trim();
    const shuffleOptionsWithAntiConsecutive = (optsList, correctAns) => {
      if (!optsList || optsList.length <= 1) return optsList;
      let arr = [...optsList];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      let correctIdx = arr.findIndex(opt => normalize(opt) === normalize(correctAns));
      
      if (correctIdx !== -1 && correctIdx === lastCorrectIndexRef.current && arr.length > 1) {
        let newIdx = (correctIdx + 1 + Math.floor(Math.random() * (arr.length - 1))) % arr.length;
        [arr[correctIdx], arr[newIdx]] = [arr[newIdx], arr[correctIdx]];
        correctIdx = newIdx;
      }
      
      if (correctIdx !== -1) {
        lastCorrectIndexRef.current = correctIdx;
      }
      return arr;
    };

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

      const answer = q.correctAnswer || (q.answer && q.answer[0]) || q.correctPicAnswer || '';
      const shuffledOptions = shuffleOptionsWithAntiConsecutive(options, answer);

      setCurrentProblem({
        text: text === 'ABACUS_GRID' ? 'ABACUS_GRID' : formatQuestionText(text),
        options: shuffledOptions,
        answer,
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
    const shuffledOptions = shuffleOptionsWithAntiConsecutive(options, answer);

    setCurrentProblem({ text: `${num1} ${operator} ${num2} = ?`, answer, options: shuffledOptions });
  };

  const triggerFullscreen = () => {
    const elem = containerRef.current;
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
  };

  const startCountdownThenPlay = (selectedLevel, specificQuestions = null) => {
    soundEffects.playClick();
    setDifficulty(selectedLevel);
    setScore(0);
    setTimeElapsed(0);
    setPlayerDistance(0);
    setBot1Distance(0);
    setBot2Distance(0);
    setFeedback(null);
    setCurrentQuestionIndex(0);
    setEssayAnswer('');
    
    // Auto-fullscreen
    triggerFullscreen();

    setGameState('countdown');
    setCountdownValue(3);
    
    const playBeep = (freq, duration) => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
      } catch(e) {}
    };

    playBeep(400, 0.5); // First red light

    generateProblem(selectedLevel, 0, specificQuestions || customQuestions);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
        playBeep(400, 0.5); // Next red lights
      } else if (count === 0) {
        setCountdownValue('GO!');
        playBeep(800, 0.8); // Green light!
      } else {
        clearInterval(interval);
        setGameState('playing');
      }
    }, 1000);
  };

  const startGame = (selectedLevel) => {
    startCountdownThenPlay(selectedLevel, customQuestions);
  };

  // Host Action: Trigger race start for all players
  const handleHostStartRace = (selectedLevel) => {
    if (players.length < 1) return; // Allow practice alone, or multiple
    soundEffects.playClick();
    setDifficulty(selectedLevel);
    setActiveQuestionCount(hostQuestionCount);
    
    // Broadcast start race config to all guests
    broadcastPusherEvent(roomId, 'start-game', { 
      difficulty: selectedLevel,
      questionCount: hostQuestionCount,
      customQuestions: customQuestions ? customQuestions.slice(0, 30) : null
    });
    
    // Initialize host gameplay
    startCountdownThenPlay(selectedLevel, customQuestions);
  };

  const renderQuestionSelector = (isHostMode = false) => {
    return (
      <div style={{ textAlign: 'left', marginTop: '5px' }}>
        <h3 style={{ color: isHostMode ? 'black' : '#3b82f6', margin: '0 0 5px', fontSize: '18px', fontWeight: 'bold' }}>
          question resource (worksheets)
        </h3>
        
        {!customQuestions ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {systemData.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('loading_worksheets', 'Loading worksheets...')}</p>
              ) : (
                <>
                  <select
                    value={selectedSystemId || ''}
                    onChange={(e) => {
                      toggleSystemExpand(e.target.value);
                      setSelectedSubject(null);
                      setSelectedUnitId(null);
                      setUnitData([]);
                    }}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold', width: '100%', outline: 'none' }}
                  >
                    <option value="" disabled>{t('mathRacer.select_system', 'select...')}</option>
                    {systemData.map(system => (
                      <option key={system._id} value={system._id}>{translateName(system.systemName)}</option>
                    ))}
                  </select>

                  {selectedSystemId && (
                    <select
                      value={selectedSubject?._id || ''}
                      onChange={(e) => {
                        const system = systemData.find(s => s._id === selectedSystemId);
                        const subject = system?.subjects?.find(sub => sub._id === e.target.value);
                        if (subject) handleSelectSubject(subject);
                      }}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold', width: '100%', outline: 'none' }}
                    >
                      <option value="" disabled>{t('mathRacer.select_subject', 'select...')}</option>
                      {systemData.find(s => s._id === selectedSystemId)?.subjects?.map(subject => (
                        <option key={subject._id} value={subject._id}>{translateName(subject.subjectName)}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
            
            {selectedSubject && unitData.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select
                  value={selectedUnitId || ''}
                  onChange={(e) => {
                    toggleUnitExpand(e.target.value);
                  }}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold', width: '100%', outline: 'none' }}
                >
                  <option value="" disabled>{t('mathRacer.select_unit', 'select...')}</option>
                  {unitData.map(unit => (
                    <option key={unit._id} value={unit._id}>{translateName(unit.unitName)}</option>
                  ))}
                </select>

                {selectedUnitId && (
                  <select
                    value=""
                    onChange={(e) => {
                      const unit = unitData.find(u => u._id === selectedUnitId);
                      const chapter = unit?.chapters?.find(c => c._id === e.target.value);
                      if (chapter) handleSelectChapter(chapter);
                    }}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold', width: '100%', outline: 'none' }}
                  >
                    <option value="" disabled>{t('select_chapter', 'Select Chapter...')}</option>
                    {unitData.find(u => u._id === selectedUnitId)?.chapters?.map(chapter => (
                      <option key={chapter._id} value={chapter._id}>📄 {translateName(chapter.chapterName)}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#10b981', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: 'bold', marginBottom: '15px' }}>
            ✓ Selected: {chapterName} ({customQuestions.length} Qs)
            <button onClick={() => setCustomQuestions(null)} style={{ marginLeft: '10px', background: 'transparent', border: '1px solid white', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>Change</button>
          </div>
        )}

        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ color: isHostMode ? '#38bdf8' : '#3b82f6', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {t('number_of_questions', 'number of questions')} ({isHostMode ? hostQuestionCount : activeQuestionCount || 10})
          </h3>
          <input
            type="number"
            min="1"
            value={isHostMode ? hostQuestionCount : activeQuestionCount || 10} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val > 0) {
                if (isHostMode) setHostQuestionCount(val);
                else setActiveQuestionCount(val);
              }
            }}
            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px', width: '60px' }}
          />
        </div>

        {!isHostMode && customQuestions && (
          <button onClick={() => startGame('easy')} style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#3b82f6', color: 'white', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer' }}>
            {t('start_single_player', 'Start Single Player Race')}
          </button>
        )}
      </div>
    );
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
            if (prev >= RACE_LENGTH - 0.01) endGame();
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
      if (multiRole === 'host' && !hostIsRacing) {
        // If host is spectator, check if any active racer finished or all finished
        const activeRacers = players.filter(p => !p.isSpectator);
        if (activeRacers.length > 0 && activeRacers.some(p => p.finished)) {
          if (activeRacers.every(p => p.finished)) {
            endGame();
          }
        }
        return;
      }

      // Synchronize player distance with others in room
      broadcastPusherEvent(roomId, 'player-progress', {
        id: myId,
        distance: playerDistance,
        score: score,
        isBoosting: feedback === 'correct'
      });

      // Victory Check
      if (playerDistance >= RACE_LENGTH - 0.01) {
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
  }, [playerDistance, gameState, gameMode, roomId, multiRole, hostIsRacing, players]);

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
      const jumpDist = (gameMode === 'multi' && activeQuestionCount) ? (RACE_LENGTH / activeQuestionCount) : (difficulty === 'easy' || difficulty === '0' ? 15 : difficulty === 'medium' || difficulty === '1' ? 12 : 10);
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
      const sorted = [...players].filter(p => !p.isSpectator).sort((a, b) => {
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
    const cameraDistance = (multiRole === 'host' && !hostIsRacing) ? Math.max(0, ...players.map(p => p.distance || 0)) : playerDistance;
    const relative = distance - cameraDistance;
    const visual = 20 + (relative * 0.6); 
    return Math.max(-20, Math.min(90, visual));
  };

  const getFinishLineVisualPosition = () => {
    const cameraDistance = (multiRole === 'host' && !hostIsRacing) ? Math.max(0, ...players.map(p => p.distance || 0)) : playerDistance;
    const relative = RACE_LENGTH - cameraDistance;
    const visual = 20 + (relative * 0.6); 
    return visual;
  };

  const handleLeaveLobby = () => {
    if (multiRole === 'host') {
      const confirmLeave = window.confirm('Are you sure you want to exit? This will close the lobby for all connected students.');
      if (!confirmLeave) return;
      broadcastPusherEvent(roomId, 'end-race-early', {});
    }
    soundEffects.playClick();
    if (channelRef.current) {
      pusherRef.current.unsubscribe(`mathracer-${roomId}`);
      channelRef.current = null;
    }
    setGameState('menu');
    setMultiRole(null);
    setRoomId('');
    setPlayers([]);
  };

  // Add beforeunload listener to warn host if they try to close tab during race or lobby
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (multiRole === 'host' && (gameState === 'lobby' || gameState === 'playing' || gameState === 'countdown')) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [multiRole, gameState]);

  const handleHostCloseRace = () => {
    if (window.confirm('Are you sure you want to end the race for all players?')) {
      soundEffects.playClick();
      broadcastPusherEvent(roomId, 'host-end-race', {});
      disconnectPusher();
      setGameState('menu');
    }
  };

  // Get final placement list for podium
  const getPodiumList = () => {
    return [...players].filter(p => !p.isSpectator).sort((a, b) => {
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
            <span>{t('back', 'Back')}</span>
          </button>
          <h2>{t('math_racer', 'Math Racer')} 🏎️💨</h2>
          


          {multiRole === 'host' && (gameState === 'playing' || gameState === 'lobby') && (
            <button onClick={handleHostCloseRace} className="host-close-race-btn" title={t('close_race', 'Close Race for All Players')}>
              ✕ {t('close_race', 'Close Race')}
            </button>
          )}
        </div>

        {gameState === 'menu' && (
          <div className="racer-menu">
            <div className="racer-logo">
              <F1CarSVG color={mySkinColor || "#3b82f6"} name="" />
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
            {!isTeacher && (
              <div className="game-mode-tabs">
                <button 
                  className={`mode-tab ${gameMode === 'single' ? 'active' : ''}`}
                  onClick={() => { soundEffects.playClick(); setGameMode('single'); }}
                >
                  🤖 {t('mathRacer.single_player', 'Single Player')}
                </button>
                <button 
                  className={`mode-tab ${gameMode === 'multi' ? 'active' : ''}`}
                  onClick={() => { soundEffects.playClick(); setGameMode('multi'); }}
                >
                  👥 {t('mathRacer.multiplayer', 'Multiplayer')}
                </button>
              </div>
            )}

            {gameMode === 'single' ? (
              <div className="single-player-setup">
                {renderQuestionSelector(false)}
              </div>
            ) : (
              <div className="multi-player-setup compact-multiplayer">
                <h3>{t('mathRacer.challenge_friends', 'Challenge Friends in Real-Time!')}</h3>
                
                <div className="multiplayer-actions-panel compact-panel">
                  <div className="host-section-card compact-card">
                    <h4>{t('mathRacer.host_new_match', 'Host a New Match')}</h4>
                    <button className="btn-multi-host" onClick={handleCreateRoom}>
                      🚀 {t('mathRacer.host_a_race', 'Host a Race')}
                    </button>
                  </div>
                  
                  <div className="join-divider">
                    <span>{t('or', 'OR')}</span>
                  </div>

                  <div className="join-section-card compact-card">
                    <h4>{t('mathRacer.join_existing_match', 'Join Existing Match')}</h4>
                    <div className="join-input-group">
                      <input 
                        type="text" 
                        placeholder={t('mathRacer.enter_code', 'ENTER CODE')}
                        maxLength="2"
                        value={inputRoomId}
                        onChange={(e) => setInputRoomId(e.target.value)}
                        className="multi-join-input"
                      />
                      <button className="btn-multi-join" onClick={handleJoinRoom}>
                        {t('mathRacer.join_roster', 'Join')}
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
        {['lobby', 'countdown', 'playing'].includes(gameState) && (
          <div className="racer-gameplay" ref={containerRef}>
            {gameState === 'playing' && <FullscreenButton targetRef={containerRef} />}
            
            {gameState === 'lobby' && (
              <Draggable handle=".lobby-drag-handle">
                <div className="racer-lobby-panel" style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '2px solid #ef4444' }}>
                  <div className="lobby-drag-handle" style={{ background: '#ef4444', color: 'white', padding: '8px', textAlign: 'center', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', cursor: 'move' }}>
                    {t('mathRacer.matchLobby', 'Racers Room')}
                  </div>

                  {multiRole === 'host' && (
                    <div style={{ marginBottom: '10px' }}>
                      <h4 style={{ color: '#ef4444', fontSize: '16px', margin: '0 0 5px', fontWeight: 'bold' }}>{t('mathRacer.connectedRacers', 'Connected Racers')}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {players.map((player, idx) => (
                          <div key={player.id || idx} style={{ color: '#eab308', fontSize: '15px', fontWeight: 'bold', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span>• {player.name}</span>
                            {player.id === myId && multiRole === 'host' && (
                               <span style={{ color: '#f97316', fontSize: '13px' }}>
                                 (Host - {player.isSpectator ? 'Watching' : 'Participating'})
                                 <button className="switch-btn-glow" onClick={() => setHostIsRacing(!!player.isSpectator)} style={{ marginLeft: '10px', padding: '4px 12px', fontSize: '14px', background: '#f97316', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                   Switch
                                 </button>
                               </span>
                            )}
                          </div>
                        ))}
                        {players.length === 0 && (
                          <div style={{ color: '#eab308', fontSize: '14px' }}>Loading...</div>
                        )}
                      </div>
                    </div>
                  )}

                  {multiRole === 'host' ? (
                    <div style={{ marginBottom: '5px' }}>
                      {renderQuestionSelector(true)}

                      <div style={{ background: '#f0fdf4', border: '2px dashed #10b981', borderRadius: '8px', padding: '15px', textAlign: 'center', marginTop: '10px' }}>
                        <p style={{ color: '#10b981', fontWeight: 'bold', margin: '0 0 5px', fontSize: '18px' }}>Use Code: <span style={{ fontSize: '24px', letterSpacing: '2px' }}>{roomId}</span></p>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '8px 0', fontWeight: 'bold' }}>OR</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button onClick={copyShareLink} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{isLinkCopied ? t('mathRacer.linkCopied', 'Copied!') : t('mathRacer.copyLink', 'Copy Invite Link')}</button>
                        </div>
                      </div>

                      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button className="start-race-btn-glow" onClick={() => { if(!customQuestions){ alert('Please select questions first'); return;} handleHostStartRace('easy'); }}>
                          {t('start_race', 'Start Race')}
                        </button>
                        <button onClick={handleLeaveLobby} style={{ padding: '10px', background: '#ef4444', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                          {t('cancel', 'Cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '10px', color: '#10b981', fontWeight: 'bold', textAlign: 'center', fontSize: '1.2rem', padding: '20px' }}>
                      🏎️ {t('mathRacer.waitingHost', 'Waiting for Host to start...')}
                    </div>
                  )}
                </div>
              </Draggable>
            )}

        {/* ============================================================
           COUNTDOWN OVERLAY (CRASH BANDICOOT STYLE)
           ============================================================ */}
        {gameState === 'countdown' && (
          <div className="traffic-light-container" style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 150,
            display: 'flex',
            gap: '20px',
            background: '#1e293b',
            padding: '20px 30px',
            borderRadius: '40px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.8)',
            border: '4px solid #334155'
          }}>
            {[3, 2, 1].map((num) => {
              const isOn = typeof countdownValue === 'number' ? countdownValue <= num : true;
              const isGreen = countdownValue === 'GO!';
              return (
                <div key={num} className="traffic-light" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: isGreen ? '#10b981' : (isOn ? '#ef4444' : '#475569'),
                  boxShadow: isGreen 
                    ? '0 0 40px #10b981, inset 0 0 20px rgba(255,255,255,0.5)' 
                    : (isOn ? '0 0 40px #ef4444, inset 0 0 20px rgba(255,255,255,0.5)' : 'inset 0 0 10px rgba(0,0,0,0.5)'),
                  border: '4px solid #0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.1s ease',
                  opacity: isOn ? 1 : 0.4
                }}>
                  {isGreen && <span style={{color:'white', fontWeight:'900', fontSize:'20px'}}>GO</span>}
                </div>
              );
            })}
          </div>
        )}

        {gameState === 'playing' && (
          <>
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
          </>
        )}

        {/* The Infinite Journey Track (VISIBLE IN LOBBY, COUNTDOWN, AND PLAYING) */}
        {['lobby', 'countdown', 'playing'].includes(gameState) && (
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
                        <F1CarSVG color={mySkinColor || "#3b82f6"} name="You" isBoosting={feedback === 'correct'} />
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
                  players.filter(p => !p.isSpectator).map((player, idx) => {
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
          )}

            {gameState === 'playing' && (
              <>
                {multiRole === 'host' && !hostIsRacing ? (
                  <div className="racer-spectator-panel" style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '20px 30px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px'
                  }}>
                    <h3 style={{ color: '#38bdf8', fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🏎️</span> Live Race Spectator Dashboard
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, textAlign: 'center' }}>
                      You are hosting this race in spectator mode. Watch your students compete live on the track above!
                    </p>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <span style={{ color: '#cbd5e1', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Active Racers</span>
                        <strong style={{ color: '#10b981', fontSize: '18px' }}>{players.filter(p => !p.isSpectator).length}</strong>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <span style={{ color: '#cbd5e1', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Target Questions</span>
                        <strong style={{ color: '#a78bfa', fontSize: '18px' }}>{activeQuestionCount || 'Unlimited'}</strong>
                      </div>
                    </div>
                    <button
                      onClick={endGame}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        padding: '10px 24px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      🏁 End Race & Show Podium
                    </button>
                  </div>
                ) : (
                <div className={`problem-container ${feedback} ${currentProblem.typeOfAnswer || ''} ${customQuestions ? 'side-by-side' : ''}`}>
                  
                  <div className="racer-question-section">
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
                  </div>

                  <div className="racer-answer-section">
                    {/* Answer Inputs / Choices */}
                    {currentProblem.typeOfAnswer === 'Essay' ? (
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
              </>
            )}
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
