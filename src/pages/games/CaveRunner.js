import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Heart, ShieldAlert, Award, Sun } from 'lucide-react';
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
import './CaveRunner.css';

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

  // Format horizontal math expression "22 + 7 + 11 - 3" into vertical stacked lines (+22 \n +7 \n +11 \n -3)
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

const BunnyRun = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const { t } = useTranslation();

  const [gameState, setGameState] = useState('menu'); // menu, ready, playing, gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [isJumping, setIsJumping] = useState(false);
  const isJumpingRef = useRef(false);
  const [jumpStartTime, setJumpStartTime] = useState(0);
  const jumpStartTimeRef = useRef(0);
  const [isFalling, setIsFalling] = useState(false);
  const isFallingRef = useRef(false);
  const [fallStartTime, setFallStartTime] = useState(0);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const isWaitingRef = useRef(false);
  const [obstaclePos, setObstaclePos] = useState(120);
  const OBSTACLE_TYPES = ['rock', 'tree', 'fire'];
  const [obstacleType, setObstacleType] = useState('rock');
  const [speed, setSpeed] = useState(0.8);

  const obstaclesPassedRef = useRef(0);
  const targetObstaclesRef = useRef(Math.floor(Math.random() * 3) + 3); // Random 3 to 5
  
  const [question, setQuestion] = useState({ text: '' });
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [difficulty, setDifficulty] = useState('0');

  const [coins, setCoins] = useState([]);
  const nextCoinId = useRef(0);
  const gameLoopRef = useRef(null);

  // === Website Question Bank States (like Math Racer) ===
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

  // Load systems on mount
  useEffect(() => {
    if (questionTypeID) {
      getSystem(setLoadingWizard, setSystemData, questionTypeID);
    }
  }, [questionTypeID]);

  // Load units when subject selected
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
        ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
      },
    })
      .then(r => r.json())
      .then(responseJson => {
        if (responseJson.message === 'success' && Array.isArray(responseJson.chapter?.questions)) {
          const shuffled = adjustQuestionOrderAndShuffleMCQ(responseJson.chapter.questions);
          setCustomQuestions(shuffled);
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

  const spawnCoins = useCallback(() => {
    const newCoins = [];
    const basePos = 100 + Math.random() * 20;
    for (let i = 0; i < 3; i++) {
      newCoins.push({
        id: nextCoinId.current++,
        pos: basePos + (i * 12),
        collected: false
      });
    }
    setCoins(newCoins);
  }, []);

  const generateQuestion = (level = difficulty) => {
    // Use website questions if available
    if (customQuestions && customQuestions.length > 0) {
      const qIndex = currentQuestionIndex % customQuestions.length;
      const q = customQuestions[qIndex];

      let text = '';
      const gridRows = parseGridRows(q.question);
      if (gridRows) {
        text = 'ABACUS_GRID';
      } else {
        text = formatQuestionText(q.question || '');
      }

      let opts = [];
      if (q.typeOfAnswer === 'MCQ' && Array.isArray(q.wrongAnswer)) {
        opts = [...q.wrongAnswer];
      }

      const answer = q.correctAnswer || (q.answer && q.answer[0]) || '';

      const shuffled = [...opts];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setQuestion({ text, gridRows });
      setCorrectAnswer(answer);
      setOptions(shuffled);
      return;
    }

    // Fallback: generate arithmetic question locally
    const q = generateArithmeticMcq(level, 4);
    setQuestion({ text: formatQuestionText(q.text) });
    setCorrectAnswer(q.answer);
    setOptions(q.options);
  };

  const startGame = async (selectedLevel) => {
    soundEffects.playClick();
    setDifficulty(selectedLevel);
    setGameState('ready');
    setScore(0);
    setLives(5);
    setSpeed(0.8);
    setObstaclePos(150);
    setObstacleType('rock');
    setIsWaitingForAnswer(false);
    isWaitingRef.current = false;
    setIsFalling(false);
    isFallingRef.current = false;
    isJumpingRef.current = false;
    setIsJumping(false);
    setJumpStartTime(0);
    jumpStartTimeRef.current = 0;
    setFallStartTime(0);
    obstaclesPassedRef.current = 0;
    targetObstaclesRef.current = Math.floor(Math.random() * 3) + 3;
    setCurrentQuestionIndex(0);
    spawnCoins();
    generateQuestion(selectedLevel);
  };

  const startRunning = () => {
    if (gameState !== 'ready') return;
    soundEffects.playClick();
    setGameState('playing');
  };

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    soundEffects.playWrong();
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  const jump = useCallback(() => {
    if (gameState !== 'playing' || isJumpingRef.current || isFallingRef.current || isWaitingRef.current) return;
    
    soundEffects.playClick();
    setIsJumping(true);
    isJumpingRef.current = true;
    setJumpStartTime(Date.now());
    jumpStartTimeRef.current = Date.now();
    
    setTimeout(() => {
      setIsJumping(false);
      isJumpingRef.current = false;
    }, 650);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'ready') {
          startRunning();
        } else if (gameState === 'playing') {
          jump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump]);

  const handleAnswer = (selectedAns) => {
    if (gameState !== 'playing') return;

    // Use string comparison for website questions
    const isCorrect = String(selectedAns).trim() === String(correctAnswer).trim();

    if (isCorrect) {
      soundEffects.playCorrect();
      setScore(s => s + 50);
      setSpeed(s => Math.min(s + 0.1, 3.2));
      jump();
    } else {
      soundEffects.playWrong();
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) handleGameOver();
        return newLives;
      });
    }

    setIsWaitingForAnswer(false);
    isWaitingRef.current = false;
    obstaclesPassedRef.current = 0;
    targetObstaclesRef.current = Math.floor(Math.random() * 3) + 3;

    // Advance to next question
    if (customQuestions && customQuestions.length > 0) {
      setCurrentQuestionIndex(prev => {
        const nextIdx = prev + 1;
        setTimeout(() => generateQuestion(difficulty), 0);
        return nextIdx;
      });
    } else {
      generateQuestion(difficulty);
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();

    const loop = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setObstaclePos(pos => {
        if (isWaitingRef.current || isFallingRef.current) return pos;

        let newPos = pos - (speed * (deltaTime / 16));
        
        let hitObstacle = false;
        const elapsed = isJumpingRef.current ? (Date.now() - jumpStartTimeRef.current) / 650 : 1;
        const isJumpingUp = isJumpingRef.current && elapsed >= 0 && elapsed <= 1;
        
        if (newPos <= 25 && newPos >= 18 && !isJumpingUp) {
          hitObstacle = true;
        }

        if (hitObstacle) {
          soundEffects.playWrong();
          setIsFalling(true);
          isFallingRef.current = true;
          setFallStartTime(Date.now());
          
          setTimeout(() => {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                handleGameOver();
              } else {
                setIsFalling(false);
                isFallingRef.current = false;
                setObstaclePos(150);
                setObstacleType(OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]);
                spawnCoins();
                setGameState('ready'); // PAUSE IN READY STATE AFTER FALL: USER MUST TOUCH/CLICK TO START RUNNING AGAIN!
              }
              return newLives;
            });
          }, 600);
          
          return pos;
        }
        
        if (newPos < -20) {
           obstaclesPassedRef.current += 1;
           
           if (obstaclesPassedRef.current >= targetObstaclesRef.current) {
              setIsWaitingForAnswer(true);
              isWaitingRef.current = true;
           }

           newPos = 120 + Math.random() * 40;
           setObstacleType(OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]);
           spawnCoins();
        }
        
        return newPos;
      });

      setCoins(prevCoins => {
        if (isWaitingRef.current || isFallingRef.current) return prevCoins;
        
        return prevCoins.map(c => {
          if (c.collected) return c;
          const newCoinPos = c.pos - (speed * (deltaTime / 16));
          if (newCoinPos <= 26 && newCoinPos >= 14 && !isFallingRef.current) {
             soundEffects.playNumberClick();
             setScore(s => s + 10);
             return { ...c, pos: newCoinPos, collected: true };
          }
          return { ...c, pos: newCoinPos };
        }).filter(c => c.pos > -10);
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, speed, handleGameOver, spawnCoins]);

  return (
    <div className="cave-runner-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="game-wrapper">
        <div className="game-header-top">
          <button className="back-btn" onClick={() => navigate('/dashboard/student')}>
            <ArrowLeft size={24} />
            <span>Dashboard</span>
          </button>
          
          {(gameState === 'playing' || gameState === 'ready') && (
            <div className="hud" style={{ zIndex: 10 }}>
              <div className="lives">
                {[...Array(5)].map((_, i) => (
                  <Heart 
                    key={i} 
                    size={28} 
                    fill={i < lives ? '#ef4444' : 'transparent'} 
                    color={i < lives ? '#ef4444' : '#cbd5e1'} 
                  />
                ))}
              </div>
              <div className="score-board">
                <Award size={24} color="#fbbf24" />
                <span>{score}</span>
              </div>
            </div>
          )}
        </div>

        <div 
          className={`game-area-premium ${isWaitingForAnswer ? 'frozen' : ''}`}
          onTouchStart={(e) => { e.preventDefault(); jump(); }}
          ref={containerRef}
        >
          <FullscreenButton targetRef={containerRef} />

          {/* Standard 2D Sky, Mountains, and Ground elements */}
          <div className="sky-layer sunny">
            <div className="sun-bright">
              <Sun size={140} color="#fcd34d" strokeWidth={3} />
            </div>
            <div className="sun-glow-bright"></div>
            <div className="clouds-container">
              <div className="cloud-p p1"></div>
              <div className="cloud-p p2"></div>
              <div className="cloud-p p3"></div>
            </div>
          </div>
          
          <div className="mountains-container">
            <div className="mountain-p far"></div>
            <div className="mountain-p mid"></div>
          </div>

          <div className="ground-world">
            <div className="ground-surface">
              <div className="surface-part full"></div>
            </div>
          </div>

          {/* 2D Bunny Character */}
          {gameState !== 'menu' && (
            <div className={`bunny-node ${gameState === 'playing' && !isWaitingForAnswer && !isFalling && !isJumping ? 'running' : ''} ${isJumping ? 'jumping' : ''} ${isFalling ? 'falling' : ''}`}>
              <svg className="bunny-svg" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 40 L35 10 C30 5 45 5 55 25 Z" fill="#cbd5e1" />
                <path d="M48 35 L38 15 C35 12 42 12 48 25 Z" fill="#f43f5e" />
                <ellipse cx="60" cy="65" rx="35" ry="28" fill="#ffffff" />
                <circle cx="80" cy="45" r="22" fill="#ffffff" />
                <path d="M75 35 L65 5 C60 0 75 0 85 22 Z" fill="#ffffff" />
                <path d="M73 32 L67 10 C64 6 72 6 79 22 Z" fill="#f43f5e" />
                <circle cx="87" cy="42" r="4" fill="#0f172a" />
                <circle cx="88" cy="41" r="1.5" fill="#ffffff" />
                <circle cx="101" cy="48" r="3" fill="#f43f5e" />
                <circle cx="82" cy="50" r="5" fill="#fecdd3" />
                <circle cx="25" cy="65" r="10" fill="#f1f5f9" />
                <rect x="45" y="85" width="12" height="10" rx="5" fill="#e2e8f0" />
                <rect x="75" y="85" width="12" height="10" rx="5" fill="#ffffff" />
              </svg>
            </div>
          )}

          {/* 2D Active Obstacles (Rock, Tree, Fire) */}
          {gameState === 'playing' && !isWaitingForAnswer && (
            <div className="obstacle-node" style={{ left: `${obstaclePos}%` }}>
              {obstacleType === 'rock' && (
                <svg className="rock-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 70 L25 30 L50 25 L70 45 L75 70 Z" fill="#64748b" />
                  <path d="M25 30 L50 25 L60 50 L30 65 Z" fill="#94a3b8" />
                  <path d="M15 65 L25 45 L40 68 Z" fill="#475569" />
                </svg>
              )}
              {obstacleType === 'tree' && (
                <svg className="tree-svg" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="35" y="80" width="10" height="40" fill="#78350f" />
                  <path d="M10 85 L40 40 L70 85 Z" fill="#15803d" />
                  <path d="M15 60 L40 20 L65 60 Z" fill="#16a34a" />
                  <path d="M20 35 L40 0 L60 35 Z" fill="#22c55e" />
                </svg>
              )}
              {obstacleType === 'fire' && (
                <svg className="fire-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="15" y="65" width="50" height="12" rx="5" transform="rotate(10 40 70)" fill="#451a03" />
                  <rect x="15" y="65" width="50" height="12" rx="5" transform="rotate(-10 40 70)" fill="#78350f" />
                  <path d="M40 10 C20 30 15 50 25 65 C35 70 45 70 55 65 C65 50 60 30 40 10 Z" fill="#ef4444" />
                  <path d="M40 20 C28 35 25 50 32 62 C38 66 42 66 48 62 C55 50 52 35 40 20 Z" fill="#f97316" />
                  <path d="M40 35 C33 45 32 55 36 60 C39 63 41 63 44 60 C48 55 47 45 40 35 Z" fill="#facc15" />
                </svg>
              )}
            </div>
          )}

          {/* 2D Collectible Carrots */}
          {gameState === 'playing' && !isWaitingForAnswer && coins.map(coin => !coin.collected && (
            <div key={coin.id} className="collectible-node" style={{ left: `${coin.pos}%` }}>
              <svg className="carrot-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 25 C20 15 22 5 25 5 C28 5 30 12 30 18 C30 12 32 5 35 5 C38 5 40 15 30 25 Z" fill="#22c55e" />
                <path d="M30 22 C36 22 35 35 30 55 C25 35 24 22 30 22 Z" fill="#f97316" />
                <line x1="28" y1="28" x2="32" y2="28" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
                <line x1="29" y1="36" x2="31" y2="36" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          ))}

          {isWaitingForAnswer && (
            <div className="math-overlay-modern" style={{ zIndex: 10 }}>
              <div className="math-card">
                <div className="math-question-section">
                  <div className="math-title">Quick Solve!</div>
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
                    <div className="math-q" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate', whiteSpace: 'pre-wrap' }}>
                      {question.text}
                    </div>
                  )}
                </div>
                <div className="math-answer-section">
                  <div className="math-opts">
                    {options.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(opt)}>{opt}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameState === 'ready' && (
            <div 
              className="game-overlay-screen" 
              style={{ zIndex: 10, background: 'rgba(255,255,255,0.88)', cursor: 'pointer' }}
              onClick={startRunning}
              onTouchStart={(e) => { e.preventDefault(); startRunning(); }}
            >
              <div className="menu-inner">
                <div className="game-logo" style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>READY TO RUN?</div>
                <p style={{ fontSize: '1.25rem', color: '#334155', marginBottom: '2rem', fontWeight: 600 }}>
                  👉 {t('bunnyRun.tapToStart', 'انقر أو المس أي مكان في الشاشة للبدء!')}
                </p>
                <button 
                  className="retry-btn" 
                  style={{ margin: '0 auto', background: 'linear-gradient(135deg, #10b981, #059669)', padding: '1.2rem 3.5rem', fontSize: '1.6rem', borderRadius: '20px' }}
                  onClick={startRunning}
                >
                  🚀 START RUNNING
                </button>
              </div>
            </div>
          )}

          {gameState === 'menu' && (
            <div className="game-overlay-screen" style={{ zIndex: 10 }}>
              <div className="menu-inner" style={{ maxWidth: '500px', width: '90%' }}>
                <div className="game-logo">BUNNY RUN</div>
                <p>{t('bunnyRun.selectChapter', 'اختر ورقة العمل للعب')}</p>
                
                {wizardError && (
                  <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: '0.5rem 0' }}>{wizardError}</p>
                )}

                {!customQuestions ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', marginBottom: '1rem' }}>
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
                          style={{ padding: '0.7rem', borderRadius: '10px', border: '2px solid #8b5cf6', fontSize: '1rem', background: '#f8fafc' }}
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
                            style={{ padding: '0.7rem', borderRadius: '10px', border: '2px solid #8b5cf6', fontSize: '1rem', background: '#f8fafc' }}
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
                              style={{ padding: '0.7rem', borderRadius: '10px', border: '2px solid #8b5cf6', fontSize: '1rem', background: '#f8fafc' }}
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
                                style={{ padding: '0.7rem', borderRadius: '10px', border: '2px solid #8b5cf6', fontSize: '1rem', background: '#f8fafc' }}
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
                  <div style={{ margin: '1rem 0', padding: '0.8rem 1.2rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>✓ {t('selected', 'تم تحديد')}: <strong>{chapterName}</strong> ({customQuestions.length} {t('questions', 'أسئلة')})</span>
                    <br />
                    <button 
                      onClick={() => { setCustomQuestions(null); setChapterName(''); }}
                      style={{ marginTop: '0.5rem', padding: '0.3rem 1rem', borderRadius: '8px', border: '1px solid #8b5cf6', background: 'white', color: '#8b5cf6', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      {t('change', 'تغيير')}
                    </button>
                  </div>
                )}

                {customQuestions && customQuestions.length > 0 && (
                  <button 
                    className="retry-btn"
                    style={{ margin: '0 auto', background: 'linear-gradient(135deg, #10b981, #059669)', padding: '1rem 3rem', fontSize: '1.5rem', borderRadius: '16px' }}
                    onClick={() => startGame('0')}
                  >
                    🚀 {t('start_game', 'ابدأ اللعب')}
                  </button>
                )}
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="game-overlay-screen" style={{ zIndex: 10 }}>
              <div className="menu-inner">
                <ShieldAlert size={80} color="#ef4444" />
                <h2>CRASHED!</h2>
                <p className="final-s">Final Score: {score}</p>
                <button className="retry-btn" onClick={() => startGame(difficulty)}>
                  <RotateCcw /> PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BunnyRun;
