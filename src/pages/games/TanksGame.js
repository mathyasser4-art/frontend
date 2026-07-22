import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ArrowLeft, Trophy, Users, Copy, ArrowRight, Shield, Target, Play } from 'lucide-react';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import Pusher from 'pusher-js';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import API_BASE_URL from '../../config/api.config';
import './TanksGame.css';

// Tank Color Schemes
const TANK_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#fbbf24', '#a855f7'];

const TanksGame = () => {
  const navigate = useNavigate();
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
    const q = generateArithmeticMcq(difficulty, 4);
    setCurrentQuestion({ text: q.text, answer: q.answer, options: q.options });
    setFeedback(null);
  }, [difficulty]);

  // Handle MCQ answer submission
  const handleAnswer = (selectedOption) => {
    if (selectedOption === currentQuestion.answer) {
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
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomId(code);
    setMultiRole('host');
    setGameState('lobby');
    setLobbyStatus('Waiting for challengers to enter the battlefield...');
    initPusherMultiplayer(code, 'host');
  };

  const handleJoinGame = () => {
    soundEffects.playClick();
    if (!inputRoomId || inputRoomId.length !== 4) {
      alert('Please enter a valid 4-digit room code');
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

    const pusher = new Pusher('06df370fb33f1263ec1f', {
      cluster: 'eu'
    });
    pusherRef.current = pusher;

    const channelName = `tanks-${roomCode}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', () => {
      // Send self join event
      broadcastPusherEvent(roomCode, 'tanks-joined', {
        id: myId,
        name: myName,
        color: myColor
      });
    });

    // Handle incoming players
    channel.bind('tanks-joined', (data) => {
      if (data.id === myId) return;

      setPlayers(prev => {
        if (prev.some(p => p.id === data.id)) return prev;
        const newPlayers = [...prev, data];
        
        // Echo profile back if host
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
      if (roleType !== 'guest') return;
      
      setPlayers(prev => {
        let roster = [...prev];
        // Ensure host is in roster
        if (!roster.some(p => p.id === data.hostId)) {
          roster.push({ id: data.hostId, name: data.hostName, color: data.hostColor });
        }
        // Ensure other guests are in roster
        data.guests.forEach(g => {
          if (g.id !== myId && !roster.some(p => p.id === g.id)) {
            roster.push(g);
          }
        });
        return roster;
      });
    });

    // Game starting trigger
    channel.bind('tanks-start', (data) => {
      setDifficulty(data.difficulty);
      setGameState('playing');
    });

    // Sync tank positions and angles
    channel.bind('tanks-move', (data) => {
      if (data.id === myId) return;
      remoteTanksRef.current[data.id] = {
        ...remoteTanksRef.current[data.id],
        id: data.id,
        name: data.name,
        color: data.color,
        x: data.x,
        y: data.y,
        angle: data.angle,
        turretAngle: data.turretAngle,
        health: data.health,
        isShielded: data.isShielded,
        defeated: data.defeated
      };
    });

    // Fired bullets sync
    channel.bind('tanks-fire', (data) => {
      if (data.ownerId === myId) return;
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

    // Hit registration sync
    channel.bind('tanks-hit', (data) => {
      // Remove local bullet
      bulletsRef.current = bulletsRef.current.filter(b => b.id !== data.bulletId);

      // Trigger explosion particles locally
      createExplosion(data.x, data.y, data.color);

      // If this hit ME, deduct health locally
      if (data.targetId === myId) {
        if (myTankRef.current.isShielded) {
          myTankRef.current.isShielded = false; // Pop shield instead
          return;
        }
        myTankRef.current.health = Math.max(0, myTankRef.current.health - 20);
        if (myTankRef.current.health <= 0 && !myTankRef.current.defeated) {
          myTankRef.current.defeated = true;
          broadcastPusherEvent(roomCode, 'tanks-defeated', { id: myId, name: myName });
        }
      }
    });

    // Defeated player sync
    channel.bind('tanks-defeated', (data) => {
      if (remoteTanksRef.current[data.id]) {
        remoteTanksRef.current[data.id].defeated = true;
        remoteTanksRef.current[data.id].health = 0;
      }
      createBigExplosion(data.x || 400, data.y || 300, data.color || '#ef4444');
    });

    // Force game over sync
    channel.bind('tanks-gameover', (data) => {
      setLeaderboard(data.ranks);
      setGameState('gameover');
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
    });
  };

  const handleStartMultiplayerMatch = () => {
    soundEffects.playClick();
    if (players.length === 0) {
      alert('You need at least one guest in the lobby to start!');
      return;
    }
    // Broadcast starting configuration
    broadcastPusherEvent(roomId, 'tanks-start', { difficulty });
    setGameState('playing');
  };

  // Launch Single Player
  const startSinglePlayer = (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setGameState('playing');
    setGameMode('single');

    // Reset Self Tank position & statistics
    myTankRef.current.x = 100;
    myTankRef.current.y = 100;
    myTankRef.current.health = 100;
    myTankRef.current.defeated = false;
    myTankRef.current.isShielded = false;
    myTankRef.current.color = myColor;

    // Spawn 3 AI Bots
    remoteTanksRef.current = {
      bot1: {
        id: 'bot1',
        name: 'AI Alpha (Bot)',
        color: '#ef4444',
        x: 700,
        y: 150,
        angle: Math.PI,
        turretAngle: Math.PI,
        health: 100,
        defeated: false,
        isBot: true,
        lastFired: 0
      },
      bot2: {
        id: 'bot2',
        name: 'AI Beta (Bot)',
        color: '#fbbf24',
        x: 680,
        y: 500,
        angle: Math.PI,
        turretAngle: Math.PI,
        health: 100,
        defeated: false,
        isBot: true,
        lastFired: 0
      },
      bot3: {
        id: 'bot3',
        name: 'AI Gamma (Bot)',
        color: '#a855f7',
        x: 200,
        y: 500,
        angle: 0,
        turretAngle: 0,
        health: 100,
        defeated: false,
        isBot: true,
        lastFired: 0
      }
    };

    bulletsRef.current = [];
    particlesRef.current = [];
  };

  // Local Particle Generators
  const createExplosion = (x, y, color) => {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 5 + 1.5,
        alpha: 1,
        life: 40,
        type: 'spark'
      });
    }
  };

  const createBigExplosion = (x, y, color) => {
    soundEffects.playWrong();
    // Huge rings
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 8 + 3,
        alpha: 1,
        life: 60,
        type: 'smoke'
      });
    }
  };

  // Collision utility with obstacles
  const checkWallCollision = (x, y, radius = 18) => {
    // Canvas bounds
    if (x - radius < 0 || x + radius > arenaWidth || y - radius < 0 || y + radius > arenaHeight) {
      return true;
    }
    // Block obstacles
    for (let obstacle of obstaclesRef.current) {
      if (
        x + radius > obstacle.x &&
        x - radius < obstacle.x + obstacle.width &&
        y + radius > obstacle.y &&
        y - radius < obstacle.y + obstacle.height
      ) {
        return true;
      }
    }
    return false;
  };

  // Keyboard mapping bindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || showMathCard) return;
      keysPressed.current[e.code] = true;
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, showMathCard]);

  // Aim tracking
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = arenaWidth / rect.width;
    const scaleY = arenaHeight / rect.height;
    mousePos.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Firing local bullets
  const handleCanvasClick = () => {
    if (gameState !== 'playing' || showMathCard || myTankRef.current.defeated) return;

    if (ammo <= 0) {
      soundEffects.playWrong();
      setShowMathCard(true);
      fetchNewQuestion();
      return;
    }

    const now = Date.now();
    if (now - myTankRef.current.lastFired < 400) return; // Fire rate limit 400ms

    myTankRef.current.lastFired = now;
    setAmmo(a => a - 1);

    soundEffects.playClick();

    const barrelLength = 32;
    const muzzleX = myTankRef.current.x + Math.cos(myTankRef.current.turretAngle) * barrelLength;
    const muzzleY = myTankRef.current.y + Math.sin(myTankRef.current.turretAngle) * barrelLength;

    const bulletSpeed = 7;
    const bulletVx = Math.cos(myTankRef.current.turretAngle) * bulletSpeed;
    const bulletVy = Math.sin(myTankRef.current.turretAngle) * bulletSpeed;
    const bulletId = 'b_' + myId + '_' + now;

    const bulletObj = {
      id: bulletId,
      ownerId: myId,
      x: muzzleX,
      y: muzzleY,
      vx: bulletVx,
      vy: bulletVy,
      color: myColor
    };

    bulletsRef.current.push(bulletObj);

    // Muzzle particle flash
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        x: muzzleX,
        y: muzzleY,
        vx: bulletVx * 0.3 + (Math.random() - 0.5) * 2,
        vy: bulletVy * 0.3 + (Math.random() - 0.5) * 2,
        color: '#fdba74',
        size: Math.random() * 4 + 1.5,
        alpha: 1,
        life: 15,
        type: 'spark'
      });
    }

    // Broadcast firing to multiplayer
    if (gameMode === 'multi') {
      broadcastPusherEvent(roomId, 'tanks-fire', bulletObj);
    }
  };

  // Physics updating and Canvas rendering Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Socket position broadcast timer (20 updates/second)
    if (gameMode === 'multi') {
      socketSendTimer.current = setInterval(() => {
        if (myTankRef.current.defeated) return;
        broadcastPusherEvent(roomId, 'tanks-move', {
          id: myId,
          name: myName,
          color: myColor,
          x: myTankRef.current.x,
          y: myTankRef.current.y,
          angle: myTankRef.current.angle,
          turretAngle: myTankRef.current.turretAngle,
          health: myTankRef.current.health,
          isShielded: myTankRef.current.isShielded,
          defeated: myTankRef.current.defeated
        });
      }, 50);
    }

    const updateLoop = () => {
      // 1. UPDATE PHYSICAL STATES
      // Player Movement Logic
      const myTank = myTankRef.current;
      if (!myTank.defeated && !showMathCard) {
        let speed = 0;
        let rotation = 0;

        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) speed = 2.4;
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) speed = -1.6;
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) rotation = -0.04;
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) rotation = 0.04;

        myTank.angle += rotation;
        const newX = myTank.x + Math.cos(myTank.angle) * speed;
        const newY = myTank.y + Math.sin(myTank.angle) * speed;

        if (!checkWallCollision(newX, newY)) {
          myTank.x = newX;
          myTank.y = newY;
        }

        // Steer Turret towards cursor
        const dx = mousePos.current.x - myTank.x;
        const dy = mousePos.current.y - myTank.y;
        myTank.turretAngle = Math.atan2(dy, dx);

        // Shield decaying
        if (myTank.isShielded) {
          myTank.shieldTimer--;
          if (myTank.shieldTimer <= 0) {
            myTank.isShielded = false;
          }
        }
      }

      // Single-player AI Bots Logic
      if (gameMode === 'single') {
        Object.values(remoteTanksRef.current).forEach(bot => {
          if (bot.defeated) return;

          // Simple random wandering steer
          if (Math.random() < 0.02) {
            bot.targetAngle = (Math.random() * Math.PI * 2);
          }

          if (bot.targetAngle !== undefined) {
            const angleDiff = bot.targetAngle - bot.angle;
            bot.angle += Math.sign(angleDiff) * 0.02;
          }

          // Move bot forward smoothly
          const botSpeed = 1.2;
          const nextBotX = bot.x + Math.cos(bot.angle) * botSpeed;
          const nextBotY = bot.y + Math.sin(bot.angle) * botSpeed;

          if (!checkWallCollision(nextBotX, nextBotY, 18)) {
            bot.x = nextBotX;
            bot.y = nextBotY;
          } else {
            bot.targetAngle = bot.angle + Math.PI * 0.5 + Math.random(); // Bounce
          }

          // Target Turret directly to the player
          const botDx = myTank.x - bot.x;
          const botDy = myTank.y - bot.y;
          bot.turretAngle = Math.atan2(botDy, botDx);

          // Shoot AI bullet periodically
          const now = Date.now();
          if (now - bot.lastFired > 3000 + Math.random() * 2000 && !myTank.defeated) {
            bot.lastFired = now;

            const barrelLength = 32;
            const bMuzX = bot.x + Math.cos(bot.turretAngle) * barrelLength;
            const bMuzY = bot.y + Math.sin(bot.turretAngle) * barrelLength;
            const bSpd = 5.5;

            bulletsRef.current.push({
              id: 'b_bot_' + bot.id + '_' + now,
              ownerId: bot.id,
              x: bMuzX,
              y: bMuzY,
              vx: Math.cos(bot.turretAngle) * bSpd,
              vy: Math.sin(bot.turretAngle) * bSpd,
              color: bot.color
            });
          }
        });
      }

      // Update bullet positions and handle hits
      let bullets = bulletsRef.current;
      bullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
      });

      // Bounding collision checks for walls
      bullets = bullets.filter(bullet => {
        const isHitWall = checkWallCollision(bullet.x, bullet.y, 4);
        if (isHitWall) {
          createExplosion(bullet.x, bullet.y, '#94a3b8');
          return false;
        }
        return true;
      });

      // Hit registration on Tanks
      bullets = bullets.filter(bullet => {
        // Test Player Tank
        if (bullet.ownerId !== myId && !myTank.defeated) {
          const distanceSelf = Math.hypot(bullet.x - myTank.x, bullet.y - myTank.y);
          if (distanceSelf < 18) {
            createExplosion(bullet.x, bullet.y, bullet.color);
            if (myTank.isShielded) {
              myTank.isShielded = false; // Shield absorbs bullet
            } else {
              myTank.health = Math.max(0, myTank.health - 20);
              soundEffects.playWrong();
              if (myTank.health <= 0) {
                myTank.defeated = true;
                createBigExplosion(myTank.x, myTank.y, myColor);
                if (gameMode === 'multi') {
                  broadcastPusherEvent(roomId, 'tanks-defeated', { id: myId, name: myName, x: myTank.x, y: myTank.y, color: myColor });
                }
              }
            }
            if (gameMode === 'multi') {
              broadcastPusherEvent(roomId, 'tanks-hit', { bulletId: bullet.id, targetId: myId, x: bullet.x, y: bullet.y, color: bullet.color });
            }
            return false;
          }
        }

        // Test rivals
        for (let rival of Object.values(remoteTanksRef.current)) {
          if (rival.defeated || bullet.ownerId === rival.id) continue;

          const distanceRival = Math.hypot(bullet.x - rival.x, bullet.y - rival.y);
          if (distanceRival < 18) {
            createExplosion(bullet.x, bullet.y, bullet.color);

            // Single player hit math
            if (gameMode === 'single') {
              rival.health = Math.max(0, rival.health - 25);
              if (rival.health <= 0) {
                rival.defeated = true;
                setScore(s => s + 100);
                createBigExplosion(rival.x, rival.y, rival.color);
              }
            } else if (gameMode === 'multi' && bullet.ownerId === myId) {
              // Inform room about bullet hitting rival
              broadcastPusherEvent(roomId, 'tanks-hit', { bulletId: bullet.id, targetId: rival.id, x: bullet.x, y: bullet.y, color: bullet.color });
            }
            return false;
          }
        }
        return true;
      });

      bulletsRef.current = bullets;

      // Update Particles
      let particles = particlesRef.current;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / 40);
      });
      particlesRef.current = particles.filter(p => p.life > 0);

      // Check Victory states
      if (gameMode === 'single') {
        const botsRemaining = Object.values(remoteTanksRef.current).some(b => !b.defeated);
        if (!botsRemaining && !myTank.defeated) {
          setLeaderboard([
            { name: myName, score: score, place: 1 },
            { name: 'AI Alpha (Bot)', score: 30, place: 2 },
            { name: 'AI Beta (Bot)', score: 10, place: 3 }
          ]);
          setGameState('gameover');
          return;
        } else if (myTank.defeated) {
          setLeaderboard([
            { name: 'AI Alpha (Bot)', score: 200, place: 1 },
            { name: myName, score: score, place: 2 }
          ]);
          setGameState('gameover');
          return;
        }
      } else if (gameMode === 'multi' && multiRole === 'host') {
        // Host tracks multiplayer defeat status
        const activeTanks = [];
        if (!myTank.defeated) activeTanks.push({ id: myId, name: myName });
        Object.values(remoteTanksRef.current).forEach(t => {
          if (!t.defeated) activeTanks.push({ id: t.id, name: t.name });
        });

        // 1 player left -> Finish competition
        if (activeTanks.length === 1) {
          const finalWinner = activeTanks[0];
          const ranks = [
            { name: finalWinner.name, score: 300, place: 1 },
            ...players.map((p, i) => ({ name: p.name, score: p.id === finalWinner.id ? 300 : 100, place: i + 2 }))
          ];
          broadcastPusherEvent(roomId, 'tanks-gameover', { ranks });
          setLeaderboard(ranks);
          setGameState('gameover');
          return;
        }
      }

      // 2. CANVAS RENDERING
      ctx.clearRect(0, 0, arenaWidth, arenaHeight);

      // Render dark cyber neon grid background
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < arenaWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, arenaHeight);
        ctx.stroke();
      }
      for (let y = 0; y < arenaHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(arenaWidth, y);
        ctx.stroke();
      }

      // Render Obstacles
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      obstaclesRef.current.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        // Inner grid lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.strokeRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
        ctx.strokeStyle = '#38bdf8';
      });

      // Render Particles
      particlesRef.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Bullets
      bulletsRef.current.forEach(bullet => {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render AI/Remote rival tanks
      const drawTank = (tank) => {
        if (tank.defeated) return;

        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate(tank.angle);

        // Tread tracks
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-22, -20, 44, 8);
        ctx.fillRect(-22, 12, 44, 8);

        // Body chassis
        ctx.fillStyle = tank.color;
        ctx.fillRect(-18, -14, 36, 28);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-18, -14, 36, 28);

        ctx.rotate(tank.turretAngle - tank.angle);

        // Turret gun barrel
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, -4, 28, 8);
        ctx.fillStyle = '#334155';
        ctx.fillRect(24, -6, 6, 12);

        // Turret dome
        ctx.fillStyle = tank.color;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Glowing shield ring if active
        if (tank.isShielded) {
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#38bdf8';
          ctx.beginPath();
          ctx.arc(tank.x, tank.y, 25, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Overhead Player details
        ctx.save();
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tank.name, tank.x, tank.y - 32);

        // Red/green health bar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(tank.x - 20, tank.y - 25, 40, 5);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(tank.x - 20, tank.y - 25, 40 * (tank.health / 100), 5);
        ctx.restore();
      };

      // Draw all remote/rival tanks
      Object.values(remoteTanksRef.current).forEach(rival => {
        drawTank(rival);
      });

      // Draw Self Player Tank
      if (!myTank.defeated) {
        drawTank(myTank);
      }

      gameLoopId.current = requestAnimationFrame(updateLoop);
    };

    gameLoopId.current = requestAnimationFrame(updateLoop);

    return () => {
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
      if (socketSendTimer.current) clearInterval(socketSendTimer.current);
    };
  }, [gameState, gameMode, showMathCard, roomId, difficulty, score]);

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
            <p>Aim, solve equations, and blast rivals in the real-time battle arena!</p>

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
                      maxLength="4" 
                      placeholder="Room Code" 
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

            {/* MCQ Gated Ammo Reload Panel */}
            {showMathCard && currentQuestion && (
              <div className="math-reload-card">
                <div className="math-card-header">
                  <Shield size={20} color="#38bdf8" />
                  <h4>RELOAD REQUIRED: Solve to Load Ammo!</h4>
                </div>
                <div className="math-card-question">
                  <p>{currentQuestion.text}</p>
                </div>
                <div className="math-card-options">
                  {currentQuestion.options.map((opt, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleAnswer(opt)}
                      className={`math-opt-btn ${feedback === 'correct' ? 'correct' : ''} ${feedback === 'wrong' ? 'wrong' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
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
