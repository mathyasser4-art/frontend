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
    customQuestionsRef.current = customQuestions;
  }, [customQuestions]);

  const [chapterName, setChapterName] = useState(location.state?.chapterName || '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [essayAnswer, setEssayAnswer] = useState('');

  // Wizard Question Selector States
  const { t } = useTranslation();
  const [wizardStep, setWizardStep] = useState('source'); // 'source' | 'type' | 'system' | 'unit' | 'custom-ws' | 'assignments'
  const [questionTypeID, setQuestionTypeID] = useState('');
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
      setSelectedSystemId(selectedSystemId === id ? null : id);
  };

  const toggleUnitExpand = (id) => {
      soundEffects.playClick();
      setSelectedUnitId(selectedUnitId === id ? null : id);
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
  const [hostQuestionCount, setHostQuestionCount] = useState(15);
  const [activeQuestionCount, setActiveQuestionCount] = useState(null);
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
          const updated = [...prev, newPlayer];
          
          // Broadcast full lobby roster back to all guest players
          broadcastPusherEvent(roomCode, 'sync-lobby', { 
            players: updated,
            hasCustomQuestions: !!customQuestions,
            chapterName: selectedChapterId || chapterName,
            questionCount: hostQuestionCount
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
        setDifficulty(data.difficulty);
        if (data.questionCount) {
          setActiveQuestionCount(data.questionCount);
        }
        setGameState('playing');
        setScore(0);
        setTimeElapsed(0);
        setPlayerDistance(0);
        setFeedback(null);
        setCurrentQuestionIndex(0);
        setEssayAnswer('');
        
        // Use custom questions from local ref first (since fetched in sync-lobby), fallback to pusher data if any
        const localQuestions = customQuestionsRef.current;
        if (localQuestions && localQuestions.length > 0) {
          generateProblem(data.difficulty, 0, localQuestions);
        } else if (data.customQuestions && data.customQuestions.length > 0) {
          setCustomQuestions(data.customQuestions);
          customQuestionsRef.current = data.customQuestions;
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
    }
  };

  useEffect(() => {
    if (gameState === 'lobby' && multiRole === 'host' && roomId) {
      setPlayers(prev => {
        const updated = prev.map(p => p.id === myId ? { ...p, isSpectator: !hostIsRacing } : p);
        broadcastPusherEvent(roomId, 'sync-lobby', {
          players: updated,
          hasCustomQuestions: !!customQuestions,
          chapterName: selectedChapterId || chapterName,
          questionCount: hostQuestionCount
        });
        return updated;
      });
    }
  }, [hostQuestionCount, hostIsRacing, gameState, multiRole, roomId, customQuestions, selectedChapterId, chapterName]);

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
    setActiveQuestionCount(hostQuestionCount);
    
    // Broadcast start race config to all guests
    broadcastPusherEvent(roomId, 'start-game', { 
      difficulty: selectedLevel,
      questionCount: hostQuestionCount,
      customQuestions: customQuestions ? customQuestions.slice(0, 30) : null
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

  const renderQuestionSelector = (isHostMode = false) => {
    if (customQuestions) {
      return (
        <div className="custom-race-banner" style={{ margin: '20px 0', padding: '25px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '2px solid #10b981', borderRadius: '20px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}>
          <span className="banner-badge" style={{ background: '#10b981', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>✓ QUESTIONS SELECTED</span>
          <h3 style={{ color: '#f8fafc', margin: '15px 0 8px', fontSize: '22px', fontWeight: 'bold' }}>{chapterName || 'Selected Worksheet'}</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 20px', fontSize: '15px' }}>Loaded {customQuestions.length} questions for the F1 Race.</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isHostMode ? (
              <button className="diff-btn easy" style={{ width: '100%', maxWidth: '280px', margin: 0, padding: '14px 28px', fontSize: '16px', fontWeight: '800', borderRadius: '14px', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)' }} onClick={() => startGame('easy')}>
                🏎️ Start Single Player Race
              </button>
            ) : (
              <button className="diff-btn easy" style={{ width: '100%', maxWidth: '280px', margin: 0, padding: '14px 28px', fontSize: '16px', fontWeight: '800', borderRadius: '14px', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)' }} onClick={() => handleHostStartRace('easy')}>
                🚀 Launch Multiplayer Race
              </button>
            )}
            <button className="clear-custom-btn" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '2px solid #ef4444', color: '#fca5a5', padding: '14px 28px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => { setCustomQuestions(null); setWizardStep('source'); }}>
              Change Questions
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="racer-question-selector-card" style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '30px',
        marginTop: '25px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {wizardStep !== 'source' && (
              <button onClick={handleWizardBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 style={{ color: '#38bdf8', fontSize: '20px', margin: 0, fontWeight: 'bold' }}>
              {wizardStep === 'source' ? '📚 Choose Questions Source' : wizardStep === 'type' ? '📝 Select Question Type' : wizardStep === 'system' ? '🗂️ Select System & Subject' : wizardStep === 'unit' ? '📂 Select Unit & Chapter' : wizardStep === 'custom-ws' ? '📄 My Question Bank' : '📋 My Assigned Homeworks'}
            </h3>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '20px' }}>
            Step {wizardStep === 'source' ? '1' : wizardStep === 'type' ? '2' : wizardStep === 'system' ? '3' : wizardStep === 'unit' ? '4' : '2'}
          </span>
        </div>

        {loadingWizard && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <i className="fa fa-spinner fa-spin" style={{ fontSize: '32px', color: '#38bdf8', marginBottom: '15px' }}></i>
            <p style={{ color: '#cbd5e1', fontSize: '16px', margin: 0 }}>Loading questions data...</p>
          </div>
        )}

        {wizardError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
            ⚠️ {wizardError}
          </div>
        )}

        {!loadingWizard && wizardStep === 'source' && (
          <div>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '25px' }}>Select from where you want to load questions for this F1 race:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div 
                onClick={() => { soundEffects.playClick(); setWizardStep('type'); }}
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '25px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                className="racer-source-card"
              >
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <BookOpen size={32} color="#38bdf8" />
                </div>
                <h4 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 8px', fontWeight: 'bold' }}>Textbook Worksheets</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.5' }}>Choose from standard book systems, units, and chapters.</p>
                <button style={{ marginTop: 'auto', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}>Select Source</button>
              </div>

              <div 
                onClick={loadCustomWorksheets}
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '25px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                className="racer-source-card"
              >
                <div style={{ background: 'rgba(167, 139, 250, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Layers size={32} color="#a78bfa" />
                </div>
                <h4 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 8px', fontWeight: 'bold' }}>My Question Bank</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.5' }}>Choose from worksheets and custom questions you created.</p>
                <button style={{ marginTop: 'auto', background: '#a78bfa', color: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}>Select Source</button>
              </div>

              <div 
                onClick={loadMyAssignments}
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '25px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                className="racer-source-card"
              >
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Swords size={32} color="#f43f5e" />
                </div>
                <h4 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 8px', fontWeight: 'bold' }}>My Assigned Homeworks</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.5' }}>Select questions from homework you previously assigned.</p>
                <button style={{ marginTop: 'auto', background: '#f43f5e', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}>Select Source</button>
              </div>
            </div>
          </div>
        )}

        {!loadingWizard && wizardStep === 'type' && (
          <div>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '25px' }}>Select the format of questions for this race:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div 
                onClick={() => handleSelectType('mcq')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '25px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease' }}
                className="racer-source-card"
              >
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <Circle size={32} color="#38bdf8" />
                </div>
                <h4 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 8px', fontWeight: 'bold' }}>Choose Questions</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Students pick the correct answer from 4 options.</p>
              </div>
              <div 
                onClick={() => handleSelectType('completion')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '25px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease' }}
                className="racer-source-card"
              >
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <CheckCircle2 size={32} color="#f43f5e" />
                </div>
                <h4 style={{ color: '#f8fafc', fontSize: '18px', margin: '0 0 8px', fontWeight: 'bold' }}>Complete Questions</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Students type the numeric answer directly using keypad.</p>
              </div>
            </div>
          </div>
        )}

        {!loadingWizard && wizardStep === 'custom-ws' && (
          <div>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '20px' }}>Select one of your custom worksheets to load its questions:</p>
            <input 
              type="text"
              placeholder="Search worksheets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', marginBottom: '25px', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {customWorksheets
                .filter(ws => ws.chapterName?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(ws => (
                  <div 
                    key={ws._id} 
                    onClick={() => handleSelectChapter(ws)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    className="racer-source-card"
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '20px' }}>📄</span>
                        <h4 style={{ color: '#f8fafc', fontSize: '16px', margin: 0, fontWeight: 'bold' }}>{ws.chapterName}</h4>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                        Format: {ws.format === 'MCQ' ? 'Choose' : 'Complete'} • {ws.questions?.length || 0} Questions
                      </p>
                    </div>
                    <button style={{ marginTop: '15px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}>Load Questions</button>
                  </div>
                ))}
              {customWorksheets.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '15px', textAlign: 'center', width: '100%', padding: '30px 0', gridColumn: '1 / -1' }}>No custom worksheets found in your Question Bank.</p>
              )}
            </div>
          </div>
        )}

        {!loadingWizard && wizardStep === 'assignments' && (
          <div>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '20px' }}>Select a past assignment to load its questions:</p>
            <input 
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', marginBottom: '25px', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {myAssignments
                .filter(assign => assign.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(assign => (
                  <div 
                    key={assign._id} 
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedChapterId(assign._id);
                      setChapterName(assign.title);
                      setCustomQuestions(assign.questions || []);
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    className="racer-source-card"
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '20px' }}>📋</span>
                        <h4 style={{ color: '#f8fafc', fontSize: '16px', margin: 0, fontWeight: 'bold' }}>{assign.title}</h4>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                        {assign.questions?.length || 0} Questions
                      </p>
                    </div>
                    <button style={{ marginTop: '15px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}>Load Questions</button>
                  </div>
                ))}
              {myAssignments.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '15px', textAlign: 'center', width: '100%', padding: '30px 0', gridColumn: '1 / -1' }}>No past assignments found.</p>
              )}
            </div>
          </div>
        )}

        {!loadingWizard && wizardStep === 'system' && (
          <div>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '20px' }}>Choose a System, then select a Subject:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {systemData.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '15px', textAlign: 'center', padding: '30px 0' }}>No systems found.</p>
              ) : (
                systemData.map(system => {
                  const isExpanded = selectedSystemId === system._id;
                  return (
                    <div key={system._id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => toggleSystemExpand(system._id)}
                        style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.08)' : 'transparent', fontWeight: 'bold', color: '#f8fafc' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Layers size={20} color="#38bdf8" />
                          <span>{translateName(system.systemName)}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                          {system.subjects?.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No subjects in this system.</p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                              {system.subjects?.map(subject => (
                                <div 
                                  key={subject._id} 
                                  onClick={() => handleSelectSubject(subject)}
                                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease' }}
                                  className="racer-subject-btn"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <BookOpen size={16} color="#38bdf8" />
                                    <span>{translateName(subject.subjectName)}</span>
                                  </div>
                                  <ChevronRight size={16} color="#64748b" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {!loadingWizard && wizardStep === 'unit' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px', marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: '12px' }}>
              <span>{questionTypeID === '65a4963482dbaac16d820fc6' ? 'Choose' : 'Complete'}</span>
              <ChevronRight size={14} />
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{translateName(selectedSubject?.subjectName)}</span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '20px' }}>Expand a Unit, and choose the Chapter to load its questions:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {unitData.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '15px', textAlign: 'center', padding: '30px 0' }}>No units found for this subject.</p>
              ) : (
                unitData.map(unit => {
                  const isExpanded = selectedUnitId === unit._id;
                  return (
                    <div key={unit._id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => toggleUnitExpand(unit._id)}
                        style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.08)' : 'transparent', fontWeight: 'bold', color: '#f8fafc' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Layers size={20} color="#a78bfa" />
                          <span>{translateName(unit.unitName)}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                          {unit.chapters?.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No chapters available.</p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                              {unit.chapters?.map(chapter => (
                                <div 
                                  key={chapter._id} 
                                  onClick={() => handleSelectChapter(chapter)}
                                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease' }}
                                  className="racer-chapter-btn"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '16px' }}>📄</span>
                                    <span>{translateName(chapter.chapterName)}</span>
                                  </div>
                                  <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>Select</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
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

  // Lobby cleanup when leaving waiting lobby
  const handleLeaveLobby = () => {
    soundEffects.playClick();
    disconnectPusher();
    setGameState('menu');
  };

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
            <span>Back</span>
          </button>
          <h2>Math Racer 🏎️💨</h2>
          {multiRole === 'host' && (gameState === 'playing' || gameState === 'lobby') && (
            <button onClick={handleHostCloseRace} className="host-close-race-btn" title="Close Race for All Players">
              ✕ Close Race
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
                  🤖 Single Player
                </button>
                <button 
                  className={`mode-tab ${gameMode === 'multi' ? 'active' : ''}`}
                  onClick={() => { soundEffects.playClick(); setGameMode('multi'); }}
                >
                  👥 Multiplayer
                </button>
              </div>
            )}

            {gameMode === 'single' ? (
              <div className="single-player-setup">
                {renderQuestionSelector(false)}
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

            <div className="room-code-display-card" style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))',
              border: '2px solid #ec4899',
              borderRadius: '20px',
              padding: '25px',
              marginBottom: '25px',
              boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)'
            }}>
              <span className="room-label" style={{ color: '#f43f5e', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🔗 INVITE LINK & ROOM CODE
              </span>
              <div className="code-badge-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                <button 
                  className="btn-copy-link-premium" 
                  onClick={copyShareLink}
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                    border: 'none',
                    borderRadius: '14px',
                    color: '#ffffff',
                    padding: '14px 28px',
                    fontSize: '16px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '350px',
                    boxShadow: '0 6px 20px rgba(236, 72, 153, 0.5)',
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {isLinkCopied ? '✓ Copied Invite Link!' : <><Copy size={20} /> 1-Click Copy Invite Link</>}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.4)', padding: '8px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Room Code:</span>
                  <span className="room-code-value" style={{ fontSize: '24px', letterSpacing: '4px', color: '#38bdf8', fontWeight: 'bold' }}>{roomId}</span>
                  <button 
                    className="btn-copy-code" 
                    onClick={copyRoomCode}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#cbd5e1',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isCopied ? '✓ Copied Code' : <><Copy size={14} /> Copy Code</>}
                  </button>
                </div>
              </div>
              <p className="server-status-label" style={{ marginTop: '20px', marginBottom: 0, color: '#10b981', fontWeight: '600' }}>🚦 {lobbyStatus}</p>
            </div>

            <div className="lobby-players-grid">
              <h4>Connected Racers ({players.length})</h4>
              <div className="roster-list">
                {players.map((player, idx) => (
                  <div key={player.id || idx} className="roster-player-item">
                    <div className="player-badge-color" style={{ backgroundColor: player.color }}></div>
                    <div className="player-profile-detail">
                      <span className="roster-player-name">{player.name}</span>
                      <span className="roster-player-rank">{player.id === myId && multiRole === 'host' ? (player.isSpectator ? '👁️ Room Host (Spectator)' : '🏁 Room Host (Driver)') : '🔥 Contender'}</span>
                    </div>
                    <span className="ready-indicator">{player.isSpectator ? 'Observing 👁️' : 'Ready to Race ✓'}</span>
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
                <div className="host-role-config-card" style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ color: '#f8fafc', fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>👥</span> Host Participation Mode
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>
                    Choose whether you want to participate in the race as a driver or observe your students as a spectator.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setHostIsRacing(false);
                      }}
                      style={{
                        flex: '1',
                        minWidth: '150px',
                        background: !hostIsRacing ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${!hostIsRacing ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '12px',
                        color: !hostIsRacing ? '#ffffff' : '#cbd5e1',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: !hostIsRacing ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
                      }}
                    >
                      👁️ Spectator Mode
                    </button>
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setHostIsRacing(true);
                      }}
                      style={{
                        flex: '1',
                        minWidth: '150px',
                        background: hostIsRacing ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${hostIsRacing ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '12px',
                        color: hostIsRacing ? '#ffffff' : '#cbd5e1',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: hostIsRacing ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none'
                      }}
                    >
                      🏎️ Join Race as Driver
                    </button>
                  </div>
                </div>

                <div className="question-count-config-card" style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '25px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ color: '#f8fafc', fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>⚙️</span> Configure Race Length (Number of Questions)
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>
                    Control how many correct answers are required for students to cross the finish line.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {[5, 10, 15, 20, 30, 50].map(num => (
                      <button
                        key={num}
                        onClick={() => { soundEffects.playClick(); setHostQuestionCount(num); }}
                        style={{
                          background: hostQuestionCount === num ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${hostQuestionCount === num ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '10px',
                          color: hostQuestionCount === num ? '#ffffff' : '#cbd5e1',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: hostQuestionCount === num ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                        }}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Custom Amount:</span>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={hostQuestionCount}
                      onChange={e => setHostQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        color: '#ffffff',
                        padding: '6px 12px',
                        width: '80px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    />
                  </div>
                </div>

                {renderQuestionSelector(true)}
              </div>
            ) : (
              <div className="guest-waiting-panel">
                <div className="guest-spinner"></div>
                <p>Waiting for Host to launch the F1 race...</p>
                {activeQuestionCount && (
                  <p style={{ color: '#10b981', fontSize: '15px', marginTop: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>🏁</span> Race Length set to {activeQuestionCount} Questions
                  </p>
                )}
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
