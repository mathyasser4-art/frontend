import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ArrowLeft, Trophy, Users, Copy, ArrowRight, Shield, Target, Play, Sparkles } from 'lucide-react';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import Pusher from 'pusher-js';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import { useTranslation } from 'react-i18next';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import API_BASE_URL from '../../config/api.config';
import { adjustQuestionOrderAndShuffleMCQ } from '../../utils/questionShuffle';
import './TanksGame.css';

// Tank Color Schemes
const TANK_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#fbbf24', '#a855f7'];

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

const getRowOp = (row) => {
  const op = (row.op !== undefined ? row.op : (row.OP !== undefined ? row.OP : ''));
  return (!op || op.trim() === '') ? '+' : op;
};
const getRowVal = (row) => (row.val !== undefined ? row.val : (row.VAL !== undefined ? row.VAL : ''));

const formatQuestionText = (text) => {
  if (!text) return '';
  const trimmed = String(text).trim();
  if (trimmed.startsWith('[')) return text;
  
  if (trimmed.includes('\n')) {
    return trimmed.split('\n').map(line => line.trim()).join('\n');
  }

  const tokens = trimmed.replace(/=\s*\?$/, '').trim().split(/\s+/);
  if (tokens.length >= 3 && tokens.some(t => t === '+' || t === '-')) {
    let resultLines = [];
    let currentOp = '+';
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok === '+' || tok === '-') {
        currentOp = tok;
      } else if (!isNaN(tok) || /^[\d٠-٩]+$/.test(tok)) {
        resultLines.push((currentOp === '+' && resultLines.length > 0 ? '+' : (currentOp === '-' ? '-' : '')) + tok);
      } else {
        resultLines.push(tok);
      }
    }
    if (resultLines.length > 1) {
      return resultLines.join('\n');
    }
  }

  return text;
};

const TanksGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Matchmaking & Multiplayer States
  const [gameMode, setGameMode] = useState('single'); // 'single' or 'multi'
  const [multiRole, setMultiRole] = useState(null); // 'host' or 'guest'
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [lobbyStatus, setLobbyStatus] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [players, setPlayers] = useState([]); // [{ id, name, color, x, y, angle, turretAngle, health, defeated }]

  const [gameState, setGameState] = useState('menu'); // 'menu', 'lobby', 'playing', 'gameover'
  const [difficulty, setDifficulty] = useState('0'); // '0', '1', '2', '3'
  
  // Math MCQ states
  const [showMathCard, setShowMathCard] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [ammo, setAmmo] = useState(3);
  const [score, setScore] = useState(0);

  // === Website Question Bank States ===
  const [customQuestions, setCustomQuestions] = useState(location.state?.customQuestions || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chapterName, setChapterName] = useState(location.state?.chapterName || '');
  const questionTypeID = '65a4963482dbaac16d820fc6'; // MCQ type
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [systemData, setSystemData] = useState([]);
  const [unitData, setUnitData] = useState([]);
  const [loadingWizard, setLoadingWizard] = useState(false);
  const [wizardError, setWizardError] = useState(null);

  // Victory / Leaderboard States
  const [leaderboard, setLeaderboard] = useState([]); // [{ name, score, place }]

  // Local Credentials
  const myName = localStorage.getItem('pp_name') || 'Tanker ' + Math.floor(100 + Math.random() * 900);
  const myId = localStorage.getItem('pp_id') || 'tank_' + Math.random().toString(36).substr(2, 9);
  const [myColor, setMyColor] = useState(TANK_COLORS[0]);

  // Sockets references
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const keysPressed = useRef({});
  const mousePos = useRef({ x: 0, y: 0 });

  // Game Engine Entities (Ref-based for 60 FPS update loop)
  const myTankRef = useRef({
    id: myId,
    name: myName,
    color: TANK_COLORS[0],
    x: 100,
    y: 100,
    angle: 0,
    turretAngle: 0,
    health: 100,
    defeated: false,
    isShielded: false,
    shieldTimer: 0,
    lastFired: 0
  });

  const remoteTanksRef = useRef({}); // { playerId: tankData }
  const bulletsRef = useRef([]); // [{ id, ownerId, x, y, vx, vy, color }]
  const particlesRef = useRef([]); // [{ x, y, vx, vy, color, size, alpha, type, life }]
  const obstaclesRef = useRef([
    { x: 250, y: 150, width: 80, height: 160 },
    { x: 450, y: 350, width: 160, height: 80 },
    { x: 150, y: 400, width: 80, height: 80 },
    { x: 550, y: 120, width: 80, height: 80 }
  ]);

  const arenaWidth = 800;
  const arenaHeight = 600;
  const gameLoopId = useRef(null);
  const socketSendTimer = useRef(null);

  useEffect(() => {
    if (questionTypeID) {
      getSystem(setLoadingWizard, setSystemData, questionTypeID);
    }
  }, [questionTypeID]);

  useEffect(() => {
    if (selectedSubject) {
      getUnit(setLoadingWizard, setUnitData, questionTypeID, selectedSubject._id);
    }
  }, [selectedSubject]);

  const translateName = (name) => {
    if (!name) return '';
    const key = `systemNames.${name}`;
    const translated = t(key);
    return translated !== key ? translated : name;
  };

  const handleSelectChapter = (chapter) => {
    soundEffects.playClick();
    setLoadingWizard(true);
    setWizardError(null);
    setChapterName(chapter.chapterName);

    const URL = `${API_BASE_URL}/chapter/getChapterQuestion/${chapter._id}`;
    const Token = localStorage.getItem('O_authWEB');
    fetch(URL, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        ...(Token ? { 'authrization': `pracYas09${Token}`, 'Authorization': `Bearer ${Token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        setLoadingWizard(false);
        const questionsList = (data.message === 'success' && Array.isArray(data.chapter?.questions))
          ? data.chapter.questions
          : (data.data && Array.isArray(data.data.questions))
          ? data.data.questions
          : (Array.isArray(data.questions) ? data.questions : null);

        if (questionsList && questionsList.length > 0) {
          const shuffledQuestions = adjustQuestionOrderAndShuffleMCQ(questionsList);
          setCustomQuestions(shuffledQuestions);
          setCurrentQuestionIndex(0);
        } else {
          setWizardError(data.message || t('no_questions_found', 'لم يتم العثور على أسئلة في هذا الدرس'));
        }
      })
      .catch(err => {
        setLoadingWizard(false);
        setWizardError(err.message || t('failed_loading_questions', 'فشل في تحميل الأسئلة'));
      });
  };

  // Clean up sockets
  const disconnectPusher = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unbind_all();
    }
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnectPusher();
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
      if (socketSendTimer.current) clearInterval(socketSendTimer.current);
    };
  }, [disconnectPusher]);

  // Proxy broadcaster
  const broadcastPusherEvent = async (roomCode, eventName, eventData) => {
    try {
      await fetch(`${API_BASE_URL}/competition/mathracer/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelName: `tanks-${roomCode}`,
          eventName,
          eventData
        })
      });
    } catch (err) {
      console.error(`[MULTIPLAYER] Broadcaster error for ${eventName}:`, err);
    }
  };

  // Setup lobby join/copy feedback
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    soundEffects.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Generate math MCQ question
  const fetchNewQuestion = useCallback(() => {
    if (customQuestions && customQuestions.length > 0) {
      const q = customQuestions[currentQuestionIndex % customQuestions.length];
      setCurrentQuestionIndex(prev => prev + 1);

      let opts = [];
      if (q.wrongAnswer && Array.isArray(q.wrongAnswer)) {
        opts = [...q.wrongAnswer];
      } else {
        const gen = generateArithmeticMcq(difficulty, 4);
        opts = gen.options;
      }

      const correct = q.correctAnswer || (q.answer && q.answer[0]) || q.answer;
      if (correct !== undefined && !opts.includes(correct)) {
        opts.push(correct);
      }
      
      const shuffledOptions = [...opts].sort(() => Math.random() - 0.5);
      const grid = parseGridRows(q.question);

      setCurrentQuestion({
        text: grid ? 'ABACUS_GRID' : formatQuestionText(q.question),
        gridRows: grid,
        answer: String(correct),
        options: shuffledOptions.map(String),
        questionPic: q.questionPic
      });
      setFeedback(null);
    } else {
      const q = generateArithmeticMcq(difficulty, 4);
      setCurrentQuestion({
        text: formatQuestionText(q.text),
        answer: String(q.answer),
        options: q.options.map(String)
      });
      setFeedback(null);
    }
  }, [customQuestions, currentQuestionIndex, difficulty]);

  // Handle MCQ answer submission
  const handleAnswer = (selectedOption) => {
    if (String(selectedOption).trim() === String(currentQuestion.answer).trim()) {
      soundEffects.playCorrect();
      setFeedback('correct');
      setScore(s => s + 30);
      
      setTimeout(() => {
        setAmmo(3);
        setShowMathCard(false);
        // Grant blue shield shield for 5 seconds
        myTankRef.current.isShielded = true;
        myTankRef.current.shieldTimer = 300; // ~5 seconds at 60 FPS
        
        // Push shield visual particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          particlesRef.current.push({
            x: myTankRef.current.x,
            y: myTankRef.current.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            color: '#38bdf8',
            size: Math.random() * 4 + 2,
            alpha: 1,
            life: 30,
            type: 'spark'
          });
        }
      }, 800);
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => {
        fetchNewQuestion();
      }, 1000);
    }
  };

  // Lobby handlers
  const handleHostGame = () => {
    soundEffects.playClick();
    // 1-digit room code matching Math Racer
    const code = Math.floor(1 + Math.random() * 9).toString();
    setRoomId(code);
    setMultiRole('host');
    setGameState('lobby');
    setLobbyStatus('Waiting for challengers to enter the battlefield...');
    initPusherMultiplayer(code, 'host');
  };

  const handleJoinGame = () => {
    soundEffects.playClick();
    if (!inputRoomId) {
      alert('Please enter a valid room code');
      return;
    }
    setRoomId(inputRoomId);
    setMultiRole('guest');
    setGameState('lobby');
    setLobbyStatus('Connecting to the secure battle room...');
    initPusherMultiplayer(inputRoomId, 'guest');
  };

  const initPusherMultiplayer = (roomCode, roleType) => {
    disconnectPusher();

    const pusher = new Pusher('app_e4ed3fcd3045501a594c2640c4d2dd75832ff677', {
      cluster: 'us',
    });
    pusherRef.current = pusher;

    const channelName = `tanks-${roomCode}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', () => {
      broadcastPusherEvent(roomCode, 'tanks-joined', {
        id: myId,
        name: myName,
        color: myColor
      });
    });

    channel.bind('tanks-joined', (data) => {
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
      if (data.id === myId) return;

      setPlayers(prev => {
        if (prev.some(p => p.id === data.id)) return prev;
        const newPlayers = [...prev, data];
        
        if (roleType === 'host') {
          broadcastPusherEvent(roomCode, 'tanks-host-echo', {
            hostId: myId,
            hostName: myName,
            hostColor: myColor,
            guests: newPlayers
          });
        }
        return newPlayers;
      });
    });

    channel.bind('tanks-host-echo', (data) => {
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
      if (roleType !== 'guest') return;
      
      setPlayers(prev => {
        let roster = [...prev];
        if (data.hostId !== myId && !roster.some(p => p.id === data.hostId)) {
          roster.push({ id: data.hostId, name: data.hostName, color: data.hostColor });
        }
        if (Array.isArray(data.guests)) {
          data.guests.forEach(g => {
            if (g.id !== myId && !roster.some(p => p.id === g.id)) {
              roster.push(g);
            }
          });
        }
        return roster;
      });
    });

    channel.bind('tanks-start-match', () => {
      soundEffects.playClick();
      setGameState('playing');
      setupGameArena();
    });

    channel.bind('tanks-sync-state', (data) => {
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
      if (data.id === myId) return;

      if (!remoteTanksRef.current[data.id]) {
        remoteTanksRef.current[data.id] = { ...data };
      } else {
        Object.assign(remoteTanksRef.current[data.id], data);
      }
    });

    channel.bind('tanks-fire-bullet', (data) => {
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
      if (data.ownerId === myId) return;

      soundEffects.playGunshot();
      bulletsRef.current.push({
        id: data.id,
        ownerId: data.ownerId,
        x: data.x,
        y: data.y,
        vx: data.vx,
        vy: data.vy,
        color: data.color
      });
    });

    channel.bind('tanks-player-defeated', (data) => {
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
      if (remoteTanksRef.current[data.id]) {
        remoteTanksRef.current[data.id].defeated = true;
        remoteTanksRef.current[data.id].health = 0;
      }
    });
  };

  const handleStartMultiplayerMatch = () => {
    broadcastPusherEvent(roomId, 'tanks-start-match', {});
    setGameState('playing');
    setupGameArena();
  };

  const startSinglePlayer = (diff) => {
    soundEffects.playClick();
    setGameMode('single');
    setDifficulty(diff);
    setGameState('playing');
    setupGameArena(true, diff);
  };

  const setupGameArena = (isSingle = false, diff = '0') => {
    setAmmo(3);
    setScore(0);
    setShowMathCard(false);

    const spawnPoints = [
      { x: 100, y: 100 },
      { x: 700, y: 500 },
      { x: 700, y: 100 },
      { x: 100, y: 500 }
    ];

    myTankRef.current = {
      id: myId,
      name: myName,
      color: myColor,
      x: spawnPoints[0].x,
      y: spawnPoints[0].y,
      angle: 0,
      turretAngle: 0,
      health: 100,
      defeated: false,
      isShielded: false,
      shieldTimer: 0,
      lastFired: 0
    };

    remoteTanksRef.current = {};
    bulletsRef.current = [];
    particlesRef.current = [];

    if (isSingle) {
      const aiCount = diff === '0' ? 1 : diff === '1' ? 2 : 3;
      for (let i = 0; i < aiCount; i++) {
        const aiId = 'ai_bot_' + i;
        const spawn = spawnPoints[i + 1] || spawnPoints[1];
        remoteTanksRef.current[aiId] = {
          id: aiId,
          name: `Bot Alpha-${i + 1}`,
          color: TANK_COLORS[i + 1] || '#ef4444',
          x: spawn.x,
          y: spawn.y,
          angle: Math.PI,
          turretAngle: Math.PI,
          health: 100,
          defeated: false,
          isAI: true,
          aiMoveTimer: 0,
          aiDir: { dx: 0, dy: 0 },
          aiShootTimer: Math.random() * 60 + 60
        };
      }
    } else {
      players.forEach((p, idx) => {
        const spawn = spawnPoints[idx + 1] || spawnPoints[1];
        remoteTanksRef.current[p.id] = {
          id: p.id,
          name: p.name,
          color: p.color,
          x: spawn.x,
          y: spawn.y,
          angle: 0,
          turretAngle: 0,
          health: 100,
          defeated: false
        };
      });
    }

    startGameLoop();
  };

  const startGameLoop = () => {
    if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastTime = performance.now();

    const loop = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      updatePhysics();
      renderArena(ctx);

      gameLoopId.current = requestAnimationFrame(loop);
    };

    gameLoopId.current = requestAnimationFrame(loop);

    if (gameMode === 'multi') {
      socketSendTimer.current = setInterval(() => {
        if (myTankRef.current && !myTankRef.current.defeated) {
          broadcastPusherEvent(roomId, 'tanks-sync-state', {
            id: myId,
            x: myTankRef.current.x,
            y: myTankRef.current.y,
            angle: myTankRef.current.angle,
            turretAngle: myTankRef.current.turretAngle,
            health: myTankRef.current.health,
            isShielded: myTankRef.current.isShielded
          });
        }
      }, 50);
    }
  };

  const updatePhysics = () => {
    const myTank = myTankRef.current;
    if (!myTank.defeated) {
      let moveSpeed = 2.5;
      let dx = 0;
      let dy = 0;

      if (keysPressed.current['w'] || keysPressed.current['W'] || keysPressed.current['ArrowUp']) dy -= 1;
      if (keysPressed.current['s'] || keysPressed.current['S'] || keysPressed.current['ArrowDown']) dy += 1;
      if (keysPressed.current['a'] || keysPressed.current['A'] || keysPressed.current['ArrowLeft']) dx -= 1;
      if (keysPressed.current['d'] || keysPressed.current['D'] || keysPressed.current['ArrowRight']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;

        const nextX = myTank.x + dx * moveSpeed;
        const nextY = myTank.y + dy * moveSpeed;

        if (!checkObstacleCollision(nextX, nextY, 20)) {
          myTank.x = Math.max(25, Math.min(arenaWidth - 25, nextX));
          myTank.y = Math.max(25, Math.min(arenaHeight - 25, nextY));
          myTank.angle = Math.atan2(dy, dx);
        }
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const scaleX = arenaWidth / rect.width;
        const scaleY = arenaHeight / rect.height;
        const mouseX = (mousePos.current.x - rect.left) * scaleX;
        const mouseY = (mousePos.current.y - rect.top) * scaleY;
        myTank.turretAngle = Math.atan2(mouseY - myTank.y, mouseX - myTank.x);
      }

      if (myTank.isShielded) {
        myTank.shieldTimer--;
        if (myTank.shieldTimer <= 0) {
          myTank.isShielded = false;
        }
      }
    }

    Object.values(remoteTanksRef.current).forEach(bot => {
      if (bot.isAI && !bot.defeated) {
        bot.aiMoveTimer--;
        if (bot.aiMoveTimer <= 0) {
          bot.aiMoveTimer = Math.floor(Math.random() * 60 + 40);
          const angle = Math.random() * Math.PI * 2;
          bot.aiDir = { dx: Math.cos(angle), dy: Math.sin(angle) };
        }

        const nextX = bot.x + bot.aiDir.dx * 1.5;
        const nextY = bot.y + bot.aiDir.dy * 1.5;

        if (!checkObstacleCollision(nextX, nextY, 20)) {
          bot.x = Math.max(25, Math.min(arenaWidth - 25, nextX));
          bot.y = Math.max(25, Math.min(arenaHeight - 25, nextY));
          bot.angle = Math.atan2(bot.aiDir.dy, bot.aiDir.dx);
        }

        bot.turretAngle = Math.atan2(myTank.y - bot.y, myTank.x - bot.x);

        bot.aiShootTimer--;
        if (bot.aiShootTimer <= 0) {
          bot.aiShootTimer = Math.floor(Math.random() * 120 + 80);
          fireBullet(bot.id, bot.x, bot.y, bot.turretAngle, bot.color);
        }
      }
    });

    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const b = bulletsRef.current[i];
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < 0 || b.x > arenaWidth || b.y < 0 || b.y > arenaHeight || checkObstacleCollision(b.x, b.y, 4)) {
        createExplosion(b.x, b.y, b.color, 8);
        bulletsRef.current.splice(i, 1);
        continue;
      }

      if (b.ownerId !== myId && !myTank.defeated) {
        if (Math.hypot(b.x - myTank.x, b.y - myTank.y) < 22) {
          createExplosion(b.x, b.y, '#ef4444', 16);
          bulletsRef.current.splice(i, 1);
          if (!myTank.isShielded) {
            myTank.health -= 25;
            soundEffects.playWrong();
            if (myTank.health <= 0) {
              myTank.defeated = true;
              soundEffects.playLoseSound();
              if (gameMode === 'multi') {
                broadcastPusherEvent(roomId, 'tanks-player-defeated', { id: myId });
              }
              checkMatchFinish();
            }
          }
          continue;
        }
      }

      Object.values(remoteTanksRef.current).forEach(t => {
        if (b.ownerId !== t.id && !t.defeated) {
          if (Math.hypot(b.x - t.x, b.y - t.y) < 22) {
            createExplosion(b.x, b.y, '#fbbf24', 16);
            bulletsRef.current.splice(i, 1);
            t.health -= 35;
            if (t.health <= 0) {
              t.defeated = true;
              setScore(s => s + 100);
              soundEffects.playCorrect();
              checkMatchFinish();
            }
          }
        }
      });
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = p.life / 30;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const checkObstacleCollision = (x, y, radius) => {
    return obstaclesRef.current.some(obs => {
      return (
        x + radius > obs.x &&
        x - radius < obs.x + obs.width &&
        y + radius > obs.y &&
        y - radius < obs.y + obs.height
      );
    });
  };

  const createExplosion = (x, y, color, count) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: Math.floor(Math.random() * 20 + 15),
        type: 'spark'
      });
    }
  };

  const fireBullet = (ownerId, x, y, angle, color) => {
    const bulletSpeed = 7;
    const spawnDist = 26;
    const bx = x + Math.cos(angle) * spawnDist;
    const by = y + Math.sin(angle) * spawnDist;

    bulletsRef.current.push({
      id: Math.random().toString(),
      ownerId,
      x: bx,
      y: by,
      vx: Math.cos(angle) * bulletSpeed,
      vy: Math.sin(angle) * bulletSpeed,
      color
    });

    if (ownerId === myId && gameMode === 'multi') {
      broadcastPusherEvent(roomId, 'tanks-fire-bullet', {
        id: Math.random().toString(),
        ownerId: myId,
        x: bx,
        y: by,
        vx: Math.cos(angle) * bulletSpeed,
        vy: Math.sin(angle) * bulletSpeed,
        color
      });
    }
  };

  const checkMatchFinish = () => {
    const myTank = myTankRef.current;
    const allRemotesDefeated = Object.values(remoteTanksRef.current).every(t => t.defeated);

    if (myTank.defeated || allRemotesDefeated) {
      setTimeout(() => {
        const ranks = [];
        if (!myTank.defeated) {
          ranks.push({ name: myName, score: score + 200, place: 1 });
        }
        Object.values(remoteTanksRef.current).forEach((t, i) => {
          ranks.push({ name: t.name, score: t.defeated ? 50 : 150, place: t.defeated ? 3 : 2 });
        });
        if (myTank.defeated) {
          ranks.push({ name: myName, score: score, place: ranks.length + 1 });
        }
        setLeaderboard(ranks);
        setGameState('gameover');
      }, 1000);
    }
  };

  const renderArena = (ctx) => {
    ctx.clearRect(0, 0, arenaWidth, arenaHeight);

    // Floor Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < arenaWidth; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, arenaHeight);
      ctx.stroke();
    }
    for (let y = 0; y < arenaHeight; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(arenaWidth, y);
      ctx.stroke();
    }

    // Arena Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(obs.x + 6, obs.y + 6, obs.width - 12, obs.height - 12);
    });

    // Bullets
    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Render Remote Tanks
    Object.values(remoteTanksRef.current).forEach(t => {
      if (!t.defeated) renderTank(ctx, t);
    });

    // Render Player Tank
    if (!myTankRef.current.defeated) {
      renderTank(ctx, myTankRef.current, true);
    }
  };

  const renderTank = (ctx, tank, isMe = false) => {
    ctx.save();
    ctx.translate(tank.x, tank.y);

    // Tank Body
    ctx.rotate(tank.angle);
    ctx.fillStyle = tank.color;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -14, 36, 28, 6);
    ctx.fill();
    ctx.stroke();

    // Tread lines
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, -16, 32, 4);
    ctx.fillRect(-16, 12, 32, 4);

    ctx.rotate(-tank.angle);

    // Turret
    ctx.rotate(tank.turretAngle);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, -3, 22, 6); // Cannon Barrel
    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(-tank.turretAngle);

    // Shield Aura
    if (tank.isShielded) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Health Bar
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-20, -26, 40, 5);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-20, -26, (tank.health / 100) * 40, 5);

    // Name Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tank.name, 0, -32);

    ctx.restore();
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseMove = (e) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasClick = () => {
    if (gameState !== 'playing' || myTankRef.current.defeated) return;

    if (ammo > 0) {
      setAmmo(prev => prev - 1);
      soundEffects.playGunshot();
      fireBullet(myId, myTankRef.current.x, myTankRef.current.y, myTankRef.current.turretAngle, myColor);
    } else {
      // Out of Ammo! Trigger side-by-side Math Challenge
      if (!showMathCard) {
        soundEffects.playNumberClick();
        fetchNewQuestion();
        setShowMathCard(true);
      }
    }
  };

  return (
    <div className="tanks-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="tanks-container" ref={containerRef}>
        <div className="tanks-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
          {gameState === 'playing' && (
            <div className="hud-stats">
              <div className="stat-pill"><Shield size={16} color="#38bdf8" /> <span>Shield: {myTankRef.current.isShielded ? 'Active' : 'Offline'}</span></div>
              <div className="stat-pill"><Target size={16} color="#fd5d5d" /> <span>Ammo: {ammo} / 3</span></div>
              <div className="stat-pill"><Trophy size={16} color="#fbbf24" /> <span>Score: {score}</span></div>
            </div>
          )}
        </div>

        {gameState === 'menu' && (
          <div className="tanks-menu">
            <div className="tanks-badge">🚀</div>
            <h1>Math Tanks 2D</h1>
            <p>{t('tanks.subtitle', 'صوّب، حل المسائل الحسابية، واقضِ على الدبابات المنافسة في ساحة المعركة!')}</p>

            {wizardError && (
              <p style={{ color: '#ef4444', fontSize: '0.95rem', margin: '0.5rem 0' }}>{wizardError}</p>
            )}

            {/* Website Question Bank Wizard */}
            {!customQuestions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '500px', margin: '0 auto 1.5rem', width: '100%' }}>
                {loadingWizard ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>{t('loading_worksheets', 'جاري تحميل أوراق العمل...')}</p>
                ) : systemData.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>{t('loading_worksheets', 'جاري تحميل أوراق العمل...')}</p>
                ) : (
                  <>
                    <select
                      value={selectedSystemId || ''}
                      onChange={(e) => {
                        setSelectedSystemId(e.target.value);
                        setSelectedSubject(null);
                        setSelectedUnitId(null);
                        setUnitData([]);
                      }}
                      style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #38bdf8', fontSize: '1rem', background: '#0f172a', color: 'white' }}
                    >
                      <option value="" disabled>{t('mathRacer.select_system', 'اختر النظام التعليمي...')}</option>
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
                          if (subject) {
                            soundEffects.playClick();
                            setSelectedSubject(subject);
                            setSelectedUnitId(null);
                          }
                        }}
                        style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #38bdf8', fontSize: '1rem', background: '#0f172a', color: 'white' }}
                      >
                        <option value="" disabled>{t('mathRacer.select_subject', 'اختر المادة الدراسية...')}</option>
                        {systemData.find(s => s._id === selectedSystemId)?.subjects?.map(subject => (
                          <option key={subject._id} value={subject._id}>{translateName(subject.subjectName)}</option>
                        ))}
                      </select>
                    )}

                    {selectedSubject && unitData.length > 0 && (
                      <>
                        <select
                          value={selectedUnitId || ''}
                          onChange={(e) => {
                            soundEffects.playClick();
                            setSelectedUnitId(e.target.value);
                          }}
                          style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #38bdf8', fontSize: '1rem', background: '#0f172a', color: 'white' }}
                        >
                          <option value="" disabled>{t('mathRacer.select_unit', 'اختر الوحدة الدراسية...')}</option>
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
                            style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #38bdf8', fontSize: '1rem', background: '#0f172a', color: 'white' }}
                          >
                            <option value="" disabled>{t('select_chapter', 'اختر الدرس / الورقة...')}</option>
                            {unitData.find(u => u._id === selectedUnitId)?.chapters?.map(chapter => (
                              <option key={chapter._id} value={chapter._id}>📄 {translateName(chapter.chapterName)}</option>
                            ))}
                          </select>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div style={{ margin: '1rem auto', maxWidth: '500px', padding: '0.8rem 1.2rem', background: 'rgba(56, 189, 248, 0.1)', border: '2px solid #38bdf8', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>✓ {t('selected', 'تم تحديد')}: <strong>{chapterName}</strong> ({customQuestions.length} {t('questions', 'أسئلة')})</span>
                <br />
                <button 
                  onClick={() => { setCustomQuestions(null); setChapterName(''); }}
                  style={{ marginTop: '0.5rem', padding: '0.4rem 1.2rem', borderRadius: '8px', border: '1px solid #38bdf8', background: 'transparent', color: '#38bdf8', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  {t('change', 'تغيير')}
                </button>
              </div>
            )}

            <div className="color-selector">
              <span>Choose Tank Color:</span>
              <div className="colors-grid">
                {TANK_COLORS.map(c => (
                  <button 
                    key={c} 
                    className={`color-btn ${myColor === c ? 'active' : ''}`} 
                    style={{ backgroundColor: c }}
                    onClick={() => { setMyColor(c); myTankRef.current.color = c; soundEffects.playClick(); }}
                  />
                ))}
              </div>
            </div>

            <div className="mode-selection">
              <div className="mode-card single-card">
                <h3>Single Player</h3>
                <p>Train against automated AI Tanks</p>
                <div className="diff-buttons">
                  <button className="diff-launch easy" onClick={() => startSinglePlayer('0')}>Junior</button>
                  <button className="diff-launch medium" onClick={() => startSinglePlayer('1')}>Pro</button>
                  <button className="diff-launch hard" onClick={() => startSinglePlayer('2')}>Legend</button>
                </div>
              </div>

              <div className="mode-card multi-card">
                <h3>Live Multiplayer Arena</h3>
                <p>Battle real-time students over Pusher</p>
                <div className="multi-actions">
                  <button className="action-btn host-btn" onClick={handleHostGame}>Host Game</button>
                  <div className="join-action">
                    <input 
                      type="text" 
                      maxLength="1" 
                      placeholder="Code (1-9)" 
                      value={inputRoomId} 
                      onChange={e => setInputRoomId(e.target.value.replace(/\D/g, ''))}
                    />
                    <button className="action-btn join-btn" onClick={handleJoinGame}><ArrowRight size={18} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'lobby' && (
          <div className="tanks-lobby">
            <div className="lobby-header-panel">
              <Users size={32} color="#38bdf8" />
              <h2>Battle Lobby Room</h2>
              <div className="room-code-badge" onClick={copyRoomCode}>
                <span>Code: <strong>{roomId}</strong></span>
                <Copy size={16} />
              </div>
              {isCopied && <span className="copy-tip">Copied to Clipboard!</span>}
            </div>

            <p className="lobby-status">{lobbyStatus}</p>

            <div className="roster-panel">
              <h3>Connected Roster ({players.length + 1}/4)</h3>
              <div className="players-list">
                <div className="player-badge me">
                  <span className="bullet-tank" style={{ backgroundColor: myColor }} />
                  <span>{myName} (You)</span>
                  <span className="role-tag">Host</span>
                </div>
                {players.map(p => (
                  <div key={p.id} className="player-badge">
                    <span className="bullet-tank" style={{ backgroundColor: p.color }} />
                    <span>{p.name}</span>
                    <span className="role-tag guest">Challenger</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lobby-actions">
              {multiRole === 'host' ? (
                <>
                  <div className="difficulty-row">
                    <span>Difficulty:</span>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                      <option value="0">Easy Math</option>
                      <option value="1">Medium Math</option>
                      <option value="2">Hard Math</option>
                      <option value="3">Advanced</option>
                    </select>
                  </div>
                  <button className="launch-btn" onClick={handleStartMultiplayerMatch}>
                    <Play size={18} /> <span>Launch Match</span>
                  </button>
                </>
              ) : (
                <div className="waiting-pill">Waiting for host to launch battle...</div>
              )}
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="tanks-game-wrapper">
            <FullscreenButton targetRef={containerRef} />
            <canvas 
              ref={canvasRef} 
              width={arenaWidth} 
              height={arenaHeight} 
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
              className="tanks-canvas"
            />

            {/* Side-by-Side Math Reload Card */}
            {showMathCard && currentQuestion && (
              <div className="tanks-math-overlay">
                <div className="tanks-math-card" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  <div className="tanks-question-section">
                    <div className="tanks-math-badge">
                      <Target size={16} /> RELOAD REQUIRED: SOLVE FOR AMMO
                    </div>

                    {currentQuestion.text === 'ABACUS_GRID' && currentQuestion.gridRows ? (
                      <div className="racer-abacus-grid-view">
                        <table className="racer-abacus-display-table" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                          <tbody>
                            {currentQuestion.gridRows.map((row, i) => (
                              <tr key={i}>
                                <td className="op-cell">{getRowOp(row)}</td>
                                <td className="val-cell">{getRowVal(row)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="tanks-math-text" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate', whiteSpace: 'pre-wrap' }}>
                        {currentQuestion.text}
                      </div>
                    )}

                    {currentQuestion.questionPic && (
                      <img src={currentQuestion.questionPic} alt="Question Diagram" className="tanks-question-img" />
                    )}
                  </div>

                  <div className="tanks-answer-section">
                    <div className="tanks-options-grid">
                      {currentQuestion.options?.map((opt, i) => (
                        <button 
                          key={i} 
                          className="tanks-option-btn" 
                          onClick={() => handleAnswer(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {feedback && (
                    <div className={`tanks-feedback-banner ${feedback}`}>
                      {feedback === 'correct' ? '🎉 Ammo Reloaded + Shield Activated!' : '❌ Incorrect! Try Again!'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="tanks-gameover">
            <div className="crown-badge">🏆</div>
            <h2>Match Complete!</h2>
            <p>Excellent effort in the combat zone!</p>

            <div className="leaderboard-card">
              <h3>Battle Standings</h3>
              <div className="leaderboard-ranks">
                {leaderboard.map((item, idx) => (
                  <div key={idx} className={`rank-row place-${item.place}`}>
                    <span className="rank-place">#{item.place}</span>
                    <span className="rank-name">{item.name}</span>
                    <span className="rank-score">{item.score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="lobby-back-btn" 
              onClick={() => {
                setGameState('menu');
                disconnectPusher();
                setPlayers([]);
                setScore(0);
                setAmmo(3);
                myTankRef.current.health = 100;
                myTankRef.current.defeated = false;
              }}
            >
              Back to Game Room Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TanksGame;
