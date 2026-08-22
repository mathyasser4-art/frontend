import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trophy, RotateCcw, Flag, Sparkles, Volume2 } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import { useTranslation } from 'react-i18next';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import API_BASE_URL from '../../config/api.config';
import { adjustQuestionOrderAndShuffleMCQ } from '../../utils/questionShuffle';
import './MinigolfGame.css';

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

// Course Holes Definition (Coordinates in 800x600 canvas space)
const HOLES = [
  {
    name: 'Hole 1: Greenfield Starter',
    par: 2,
    ballStart: { x: 120, y: 300 },
    holePos: { x: 680, y: 300 },
    walls: [
      { x1: 50, y1: 150, x2: 750, y2: 150 },
      { x1: 750, y1: 150, x2: 750, y2: 450 },
      { x1: 750, y1: 450, x2: 50, y2: 450 },
      { x1: 50, y1: 450, x2: 50, y2: 150 },
      // Fun middle obstacle bumper
      { x1: 400, y1: 220, x2: 400, y2: 380, isBumper: true }
    ],
    sandTraps: [],
    waterHazards: [],
    windmill: null
  },
  {
    name: 'Hole 2: Sand Trap Alley',
    par: 3,
    ballStart: { x: 100, y: 480 },
    holePos: { x: 700, y: 140 },
    walls: [
      { x1: 50, y1: 80, x2: 750, y2: 80 },
      { x1: 750, y1: 80, x2: 750, y2: 520 },
      { x1: 750, y1: 520, x2: 50, y2: 520 },
      { x1: 50, y1: 520, x2: 50, y2: 80 },
      // L-shape wall
      { x1: 380, y1: 80, x2: 380, y2: 360 },
      { x1: 380, y1: 360, x2: 550, y2: 360 }
    ],
    sandTraps: [
      { x: 420, y: 120, width: 140, height: 160 }
    ],
    waterHazards: [],
    windmill: null
  },
  {
    name: 'Hole 3: Windmill Wonder',
    par: 3,
    ballStart: { x: 120, y: 300 },
    holePos: { x: 680, y: 300 },
    walls: [
      { x1: 60, y1: 120, x2: 740, y2: 120 },
      { x1: 740, y1: 120, x2: 740, y2: 480 },
      { x1: 740, y1: 480, x2: 60, y2: 480 },
      { x1: 60, y1: 480, x2: 60, y2: 120 },
      { x1: 400, y1: 120, x2: 400, y2: 240 },
      { x1: 400, y1: 360, x2: 400, y2: 480 }
    ],
    sandTraps: [
      { x: 220, y: 220, width: 100, height: 160 }
    ],
    waterHazards: [],
    windmill: { x: 400, y: 300, radius: 55, angle: 0, speed: 0.03 }
  },
  {
    name: 'Hole 4: Island Green',
    par: 3,
    ballStart: { x: 100, y: 300 },
    holePos: { x: 660, y: 300 },
    walls: [
      { x1: 50, y1: 100, x2: 750, y2: 100 },
      { x1: 750, y1: 100, x2: 750, y2: 500 },
      { x1: 750, y1: 500, x2: 50, y2: 500 },
      { x1: 50, y1: 500, x2: 50, y2: 100 }
    ],
    sandTraps: [],
    waterHazards: [
      { x: 280, y: 100, width: 160, height: 400 }
    ],
    windmill: null
  },
  {
    name: 'Hole 5: Championship Labyrinth',
    par: 4,
    ballStart: { x: 100, y: 120 },
    holePos: { x: 680, y: 480 },
    walls: [
      { x1: 50, y1: 60, x2: 750, y2: 60 },
      { x1: 750, y1: 60, x2: 750, y2: 540 },
      { x1: 750, y1: 540, x2: 50, y2: 540 },
      { x1: 50, y1: 540, x2: 50, y2: 60 },
      // Zig-zag walls
      { x1: 260, y1: 60, x2: 260, y2: 380 },
      { x1: 500, y1: 220, x2: 500, y2: 540 }
    ],
    sandTraps: [
      { x: 300, y: 400, width: 150, height: 100 }
    ],
    waterHazards: [
      { x: 300, y: 100, width: 150, height: 120 }
    ],
    windmill: { x: 600, y: 260, radius: 45, angle: 0, speed: 0.04 }
  }
];

const MinigolfGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'math_challenge', 'hole_complete', 'game_complete'
  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [powerBoostActive, setPowerBoostActive] = useState(false);

  // Ball physics state in ref for animation frame smoothness
  const ballRef = useRef({
    x: HOLES[0].ballStart.x,
    y: HOLES[0].ballStart.y,
    vx: 0,
    vy: 0,
    radius: 9,
    isMoving: false,
    lastStrokePos: { x: HOLES[0].ballStart.x, y: HOLES[0].ballStart.y }
  });

  const isAimingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragCurrentRef = useRef({ x: 0, y: 0 });
  const windmillAngleRef = useRef(0);

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

  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);

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
        'Authorization': `Bearer ${Token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setLoadingWizard(false);
        if (data && data.data && data.data.questions && data.data.questions.length > 0) {
          const shuffledQuestions = adjustQuestionOrderAndShuffleMCQ(data.data.questions);
          setCustomQuestions(shuffledQuestions);
          setCurrentQuestionIndex(0);
        } else {
          setWizardError(t('no_questions_found', 'لم يتم العثور على أسئلة في هذا الدرس'));
        }
      })
      .catch(err => {
        setLoadingWizard(false);
        setWizardError(t('failed_loading_questions', 'فشل في تحميل الأسئلة'));
      });
  };

  const fetchQuestion = useCallback(() => {
    if (customQuestions && customQuestions.length > 0) {
      const q = customQuestions[currentQuestionIndex % customQuestions.length];
      setCurrentQuestionIndex(prev => prev + 1);

      let opts = [];
      if (q.wrongAnswer && Array.isArray(q.wrongAnswer)) {
        opts = [...q.wrongAnswer];
        if (!opts.includes(q.correctAnswer)) {
          opts.push(q.correctAnswer);
        }
      } else {
        const gen = generateArithmeticMcq('1', 4);
        opts = gen.options;
      }
      
      const shuffledOptions = [...opts].sort(() => Math.random() - 0.5);
      const grid = parseGridRows(q.question);

      setQuestion({
        text: grid ? 'ABACUS_GRID' : formatQuestionText(q.question),
        gridRows: grid,
        answer: String(q.correctAnswer || q.answer),
        options: shuffledOptions.map(String),
        questionPic: q.questionPic
      });
    } else {
      const q = generateArithmeticMcq('1', 4);
      setQuestion({
        text: formatQuestionText(q.text),
        answer: String(q.answer),
        options: q.options.map(String)
      });
    }
  }, [customQuestions, currentQuestionIndex]);

  const startGolfGame = () => {
    soundEffects.playClick();
    setCurrentHoleIdx(0);
    setStrokes(0);
    setTotalStrokes(0);
    setPowerBoostActive(false);
    resetBallForHole(0);
    setGameState('playing');
  };

  const resetBallForHole = (holeIdx) => {
    const hole = HOLES[holeIdx];
    ballRef.current = {
      x: hole.ballStart.x,
      y: hole.ballStart.y,
      vx: 0,
      vy: 0,
      radius: 9,
      isMoving: false,
      lastStrokePos: { x: hole.ballStart.x, y: hole.ballStart.y }
    };
    setStrokes(0);
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updatePhysics = () => {
      const ball = ballRef.current;
      const hole = HOLES[currentHoleIdx];

      if (ball.isMoving) {
        // Friction: Normal green = 0.982, Sand = 0.88, Power Boost = 0.995
        let friction = powerBoostActive ? 0.993 : 0.982;

        // Check Sand Trap overlap
        for (const sand of hole.sandTraps) {
          if (
            ball.x >= sand.x && ball.x <= sand.x + sand.width &&
            ball.y >= sand.y && ball.y <= sand.y + sand.height
          ) {
            friction = 0.88;
          }
        }

        // Apply velocity
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= friction;
        ball.vy *= friction;

        // Stop ball when speed is tiny
        if (Math.abs(ball.vx) < 0.08 && Math.abs(ball.vy) < 0.08) {
          ball.vx = 0;
          ball.vy = 0;
          ball.isMoving = false;
        }

        // Wall collisions
        for (const wall of hole.walls) {
          // Line segment collision detection
          const distToWall = pointToSegmentDistance(ball.x, ball.y, wall.x1, wall.y1, wall.x2, wall.y2);
          if (distToWall <= ball.radius) {
            // Reflect velocity vector
            const dx = wall.x2 - wall.x1;
            const dy = wall.y2 - wall.y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;

            const dot = ball.vx * nx + ball.vy * ny;
            const bounceRestitution = wall.isBumper ? 1.25 : 0.78;
            ball.vx = (ball.vx - 2 * dot * nx) * bounceRestitution;
            ball.vy = (ball.vy - 2 * dot * ny) * bounceRestitution;

            // Push ball slightly out of wall
            ball.x += nx * (ball.radius - distToWall + 2);
            ball.y += ny * (ball.radius - distToWall + 2);

            try { soundEffects.playClick(); } catch (e) {}
          }
        }

        // Windmill Collision
        if (hole.windmill) {
          windmillAngleRef.current += hole.windmill.speed;
          const wm = hole.windmill;
          // 4 blades
          for (let b = 0; b < 4; b++) {
            const angle = windmillAngleRef.current + (b * Math.PI) / 2;
            const bx = wm.x + Math.cos(angle) * wm.radius;
            const by = wm.y + Math.sin(angle) * wm.radius;
            const dist = pointToSegmentDistance(ball.x, ball.y, wm.x, wm.y, bx, by);
            if (dist <= ball.radius + 4) {
              ball.vx = -ball.vx * 1.1 + Math.cos(angle) * 3;
              ball.vy = -ball.vy * 1.1 + Math.sin(angle) * 3;
              try { soundEffects.playClick(); } catch (e) {}
            }
          }
        }

        // Water Hazard Check
        for (const water of hole.waterHazards) {
          if (
            ball.x >= water.x && ball.x <= water.x + water.width &&
            ball.y >= water.y && ball.y <= water.y + water.height
          ) {
            // Splash! Reset to last stroke
            ball.x = ball.lastStrokePos.x;
            ball.y = ball.lastStrokePos.y;
            ball.vx = 0;
            ball.vy = 0;
            ball.isMoving = false;
            try { soundEffects.playWrong(); } catch (e) {}
          }
        }

        // Hole Cup Collision
        const distToHole = Math.hypot(ball.x - hole.holePos.x, ball.y - hole.holePos.y);
        if (distToHole < 18 && Math.hypot(ball.vx, ball.vy) < 6.5) {
          // Ball sunk into hole!
          ball.vx = 0;
          ball.vy = 0;
          ball.isMoving = false;
          soundEffects.playCorrect();

          setTimeout(() => {
            fetchQuestion();
            setGameState('math_challenge');
          }, 400);
        }
      }
    };

    const drawCourse = () => {
      ctx.clearRect(0, 0, 800, 600);
      const hole = HOLES[currentHoleIdx];
      const ball = ballRef.current;

      // 1. Lush Green Fairway Background
      const greenGrad = ctx.createLinearGradient(0, 0, 800, 600);
      greenGrad.addColorStop(0, '#22c55e');
      greenGrad.addColorStop(0.5, '#16a34a');
      greenGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = greenGrad;
      ctx.fillRect(0, 0, 800, 600);

      // Subtle Green Grass Striping
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let x = 0; x < 800; x += 40) {
        ctx.fillRect(x, 0, 20, 600);
      }

      // 2. Sand Traps
      for (const sand of hole.sandTraps) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.roundRect(sand.x, sand.y, sand.width, sand.height, 24);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#a16207';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.fillText('SAND', sand.x + sand.width / 2 - 16, sand.y + sand.height / 2);
      }

      // 3. Water Hazards
      for (const water of hole.waterHazards) {
        const waterGrad = ctx.createLinearGradient(water.x, water.y, water.x + water.width, water.y + water.height);
        waterGrad.addColorStop(0, '#38bdf8');
        waterGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = waterGrad;
        ctx.beginPath();
        ctx.roundRect(water.x, water.y, water.width, water.height, 20);
        ctx.fill();
        ctx.strokeStyle = '#0369a1';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.fillText('🌊 WATER', water.x + water.width / 2 - 28, water.y + water.height / 2);
      }

      // 4. Course Walls & Bumpers
      for (const wall of hole.walls) {
        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
        if (wall.isBumper) {
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.strokeStyle = '#fbcfe8';
          ctx.lineWidth = 6;
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 12;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      }

      // 5. Windmill Obstacle
      if (hole.windmill) {
        const wm = hole.windmill;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(wm.x, wm.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 4 Windmill blades
        for (let b = 0; b < 4; b++) {
          const angle = windmillAngleRef.current + (b * Math.PI) / 2;
          const bx = wm.x + Math.cos(angle) * wm.radius;
          const by = wm.y + Math.sin(angle) * wm.radius;

          ctx.beginPath();
          ctx.moveTo(wm.x, wm.y);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // 6. Hole Cup & Flag ⛳
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(hole.holePos.x, hole.holePos.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Flagpole
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hole.holePos.x, hole.holePos.y);
      ctx.lineTo(hole.holePos.x, hole.holePos.y - 45);
      ctx.stroke();

      // Red Flag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(hole.holePos.x, hole.holePos.y - 45);
      ctx.lineTo(hole.holePos.x + 24, hole.holePos.y - 34);
      ctx.lineTo(hole.holePos.x, hole.holePos.y - 23);
      ctx.closePath();
      ctx.fill();

      // Flag Number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillText(`${currentHoleIdx + 1}`, hole.holePos.x + 6, hole.holePos.y - 31);

      // 7. Aiming Trajectory Indicator
      if (isAimingRef.current && !ball.isMoving) {
        const dx = dragStartRef.current.x - dragCurrentRef.current.x;
        const dy = dragStartRef.current.y - dragCurrentRef.current.y;
        const pullDist = Math.min(Math.hypot(dx, dy), 140);
        const aimAngle = Math.atan2(dy, dx);

        // Dashed aim line
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + Math.cos(aimAngle) * (pullDist * 2.2), ball.y + Math.sin(aimAngle) * (pullDist * 2.2));
        ctx.stroke();
        ctx.setLineDash([]);

        // Power arc around ball
        const powerPercent = pullDist / 140;
        ctx.strokeStyle = powerPercent > 0.75 ? '#ef4444' : powerPercent > 0.45 ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 22, 0, Math.PI * 2 * powerPercent);
        ctx.stroke();
      }

      // 8. The Golf Ball
      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(ball.x + 3, ball.y + 4, ball.radius, ball.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball Gradient
      const ballGrad = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, ball.radius);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.7, '#f1f5f9');
      ballGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Power boost glow
      if (powerBoostActive) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const loop = () => {
      updatePhysics();
      drawCourse();
      animId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animId);
  }, [gameState, currentHoleIdx, powerBoostActive]);

  // Helper point-to-segment distance
  const pointToSegmentDistance = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  };

  // Mouse & Touch Controls
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    if (gameState !== 'playing' || ballRef.current.isMoving) return;
    const coords = getCanvasCoords(e);
    const distToBall = Math.hypot(coords.x - ballRef.current.x, coords.y - ballRef.current.y);

    if (distToBall < 60) {
      isAimingRef.current = true;
      dragStartRef.current = coords;
      dragCurrentRef.current = coords;
    }
  };

  const handlePointerMove = (e) => {
    if (!isAimingRef.current) return;
    dragCurrentRef.current = getCanvasCoords(e);
  };

  const handlePointerUp = () => {
    if (!isAimingRef.current) return;
    isAimingRef.current = false;

    const dx = dragStartRef.current.x - dragCurrentRef.current.x;
    const dy = dragStartRef.current.y - dragCurrentRef.current.y;
    const pullDist = Math.min(Math.hypot(dx, dy), 140);

    if (pullDist > 10) {
      const power = (pullDist / 140) * 16;
      const angle = Math.atan2(dy, dx);

      ballRef.current.lastStrokePos = { x: ballRef.current.x, y: ballRef.current.y };
      ballRef.current.vx = Math.cos(angle) * power;
      ballRef.current.vy = Math.sin(angle) * power;
      ballRef.current.isMoving = true;

      setStrokes(prev => prev + 1);
      setTotalStrokes(prev => prev + 1);
      soundEffects.playClick();
    }
  };

  // Math Challenge Answer Logic
  const handleAnswer = (selectedAns) => {
    if (String(selectedAns).trim() === String(question.answer).trim()) {
      soundEffects.playCorrect();
      setFeedback('correct');

      setTimeout(() => {
        setFeedback(null);
        if (currentHoleIdx + 1 < HOLES.length) {
          const nextHole = currentHoleIdx + 1;
          setCurrentHoleIdx(nextHole);
          resetBallForHole(nextHole);
          setPowerBoostActive(true);
          setGameState('playing');
        } else {
          setGameState('game_complete');
        }
      }, 900);
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => {
        fetchQuestion();
        setFeedback(null);
      }, 1000);
    }
  };

  return (
    <div className="minigolf-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="minigolf-container">
        <div className="minigolf-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
        </div>

        {gameState === 'menu' && (
          <div className="minigolf-menu">
            <div className="game-badge">
              <Trophy size={48} color="#10b981" />
            </div>
            <h1>Math Master Minigolf ⛳</h1>
            <p>{t('minigolf.selectWorksheet', 'اختر ورقة العمل لتخصيص أسئلة الجولف وتحدي الحفر!')}</p>

            {wizardError && (
              <p style={{ color: '#ef4444', fontSize: '0.95rem', margin: '0.5rem 0' }}>{wizardError}</p>
            )}

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
                      style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #10b981', fontSize: '1rem', background: '#f8fafc' }}
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
                        style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #10b981', fontSize: '1rem', background: '#f8fafc' }}
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
                          style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #10b981', fontSize: '1rem', background: '#f8fafc' }}
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
                            style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #10b981', fontSize: '1rem', background: '#f8fafc' }}
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
              <div style={{ margin: '1rem auto', maxWidth: '500px', padding: '0.8rem 1.2rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>✓ {t('selected', 'تم تحديد')}: <strong>{chapterName}</strong> ({customQuestions.length} {t('questions', 'أسئلة')})</span>
                <br />
                <button 
                  onClick={() => { setCustomQuestions(null); setChapterName(''); }}
                  style={{ marginTop: '0.5rem', padding: '0.4rem 1.2rem', borderRadius: '8px', border: '1px solid #10b981', background: 'white', color: '#10b981', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  {t('change', 'تغيير')}
                </button>
              </div>
            )}

            <button 
              className="golf-play-btn"
              onClick={startGolfGame}
            >
              ⛳ TEE OFF NOW
            </button>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'math_challenge') && (
          <div className="golf-game-view" ref={containerRef}>
            <div className="golf-top-hud">
              <div className="hud-pill">
                <Flag size={18} color="#10b981" />
                <span>{HOLES[currentHoleIdx].name} (Par {HOLES[currentHoleIdx].par})</span>
              </div>
              <div className="hud-pill">
                <span>Strokes: <strong>{strokes}</strong></span>
              </div>
              <div className="hud-pill">
                <Trophy size={18} color="#f59e0b" />
                <span>Total: <strong>{totalStrokes}</strong></span>
              </div>
              {powerBoostActive && (
                <div className="hud-pill boost-pill">
                  <Sparkles size={18} color="#a855f7" />
                  <span>Super Putt Active!</span>
                </div>
              )}
            </div>

            <FullscreenButton targetRef={containerRef} />

            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="golf-canvas"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
              <div className="golf-drag-hint">
                👉 Drag back on the ball to aim and set power, then release to putt!
              </div>
            </div>

            {/* Side-by-Side Question Modal */}
            {gameState === 'math_challenge' && question && (
              <div className="golf-math-overlay">
                <div className="golf-math-card" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  <div className="golf-question-section">
                    <div className="golf-math-badge">
                      🏆 HOLE IN! SOLVE TO ADVANCE
                    </div>

                    {question.text === 'ABACUS_GRID' && question.gridRows ? (
                      <div className="racer-abacus-grid-view">
                        <table className="racer-abacus-display-table" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                          <tbody>
                            {question.gridRows.map((row, i) => (
                              <tr key={i}>
                                <td className="op-cell">{getRowOp(row)}</td>
                                <td className="val-cell">{getRowVal(row)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="golf-math-text" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate', whiteSpace: 'pre-wrap' }}>
                        {question.text}
                      </div>
                    )}

                    {question.questionPic && (
                      <img src={question.questionPic} alt="Question Diagram" className="golf-question-img" />
                    )}
                  </div>

                  <div className="golf-answer-section">
                    <div className="golf-options-grid">
                      {question.options?.map((opt, i) => (
                        <button 
                          key={i} 
                          className="golf-option-btn" 
                          onClick={() => handleAnswer(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {feedback && (
                    <div className={`golf-feedback-banner ${feedback}`}>
                      {feedback === 'correct' ? '🎉 Great Shot! Moving to Next Hole!' : '❌ Incorrect! Try Again!'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'game_complete' && (
          <div className="minigolf-menu">
            <Trophy size={80} color="#fbbf24" style={{ margin: '0 auto 1.5rem' }} />
            <h1>🏆 TOURNAMENT CHAMPION!</h1>
            <p>You completed all 5 holes with a total score of <strong>{totalStrokes}</strong> strokes!</p>
            <button className="golf-play-btn" onClick={startGolfGame}>
              <RotateCcw size={20} /> PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinigolfGame;
