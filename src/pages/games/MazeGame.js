import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ChevronLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCcw, Loader2, Volume2, VolumeX, Trophy, Clock, Key, Compass, Snowflake, Gem, Sparkles } from 'lucide-react';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import { useTranslation } from 'react-i18next';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import API_BASE_URL from '../../config/api.config';
import { adjustQuestionOrderAndShuffleMCQ } from '../../utils/questionShuffle';
import './MazeGame.css';

const CHARACTER_URL = 'https://api.dicebear.com/7.x/bottts/svg?seed=toothpaste&backgroundColor=b6e3f4';

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

const generateDoorQuestionData = (index, customQs, diff) => {
  if (customQs && customQs.length > 0) {
    const q = customQs[index % customQs.length];
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

    return { text, gridRows, options: shuffled, answer, isOpen: false };
  }

  // Fallback arithmetic
  const q = generateArithmeticMcq(diff, 4);
  return {
    text: formatQuestionText(q.text),
    gridRows: null,
    options: q.options,
    answer: q.answer,
    isOpen: false
  };
};

const generateMaze = (width, height, customQs, diff) => {
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({
        x, y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
        isDoor: false,
        doorData: null,
        isGoal: false,
        hasGem: false
      });
    }
    grid.push(row);
  }

  const stack = [];
  let current = grid[0][0];
  current.visited = true;

  const getUnvisitedNeighbors = (cell) => {
    const neighbors = [];
    const { x, y } = cell;
    if (y > 0 && !grid[y - 1][x].visited) neighbors.push({ cell: grid[y - 1][x], dir: 'top' });
    if (x < width - 1 && !grid[y][x + 1].visited) neighbors.push({ cell: grid[y][x + 1], dir: 'right' });
    if (y < height - 1 && !grid[y + 1][x].visited) neighbors.push({ cell: grid[y + 1][x], dir: 'bottom' });
    if (x > 0 && !grid[y][x - 1].visited) neighbors.push({ cell: grid[y][x - 1], dir: 'left' });
    return neighbors;
  };

  const removeWall = (a, b, dir) => {
    if (dir === 'top') { a.walls.top = false; b.walls.bottom = false; }
    if (dir === 'right') { a.walls.right = false; b.walls.left = false; }
    if (dir === 'bottom') { a.walls.bottom = false; b.walls.top = false; }
    if (dir === 'left') { a.walls.left = false; b.walls.right = false; }
  };

  while (true) {
    const neighbors = getUnvisitedNeighbors(current);
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      stack.push(current);
      removeWall(current, next.cell, next.dir);
      current = next.cell;
      current.visited = true;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else {
      break;
    }
  }
  
  // Set goal
  grid[height - 1][width - 1].isGoal = true;

  // Scatter collectible gems
  let qIdx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((x === 0 && y === 0) || (x === width - 1 && y === height - 1)) continue;
      if (Math.random() < 0.15) {
        grid[y][x].hasGem = true;
      }
    }
  }

  // Place random doors with custom questions
  const numDoors = diff === '0' ? 2 : diff === '1' ? 3 : diff === '2' ? 4 : 5;
  let doorsPlaced = 0;
  while(doorsPlaced < numDoors) {
     const rx = Math.floor(Math.random() * width);
     const ry = Math.floor(Math.random() * height);
     if ((rx === 0 && ry === 0) || (rx === width-1 && ry === height-1)) continue;
     if (!grid[ry][rx].isDoor) {
       grid[ry][rx].isDoor = true;
       grid[ry][rx].hasGem = false;
       grid[ry][rx].doorData = { ...generateDoorQuestionData(qIdx++, customQs, diff), x: rx, y: ry };
       doorsPlaced++;
     }
  }
  
  return grid;
};

function MazeGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [gameState, setGameState] = useState('menu'); // menu, loading, playing, door-modal, won
  const [grid, setGrid] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [difficulty, setDifficulty] = useState('0');
  const [level, setLevel] = useState(1);
  const totalLevels = 10;
  
  // Gameplay & Stats
  const [score, setScore] = useState(0);
  const [gemsCollected, setGemsCollected] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const timerRef = useRef(null);

  // Power-ups State
  const [powerKeys, setPowerKeys] = useState(1);
  const [powerTimeFreeze, setPowerTimeFreeze] = useState(1);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [showPathHelper, setShowPathHelper] = useState(false);

  // Website Question Bank States
  const [customQuestions, setCustomQuestions] = useState(location.state?.customQuestions || null);
  const [chapterName, setChapterName] = useState(location.state?.chapterName || '');
  const questionTypeID = '65a4963482dbaac16d820fc6'; // MCQ
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [systemData, setSystemData] = useState([]);
  const [unitData, setUnitData] = useState([]);
  const [loadingWizard, setLoadingWizard] = useState(false);
  const [wizardError, setWizardError] = useState(null);

  // Touch Swipe Refs
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Door Modal State
  const [currentDoor, setCurrentDoor] = useState(null);
  const [feedback, setFeedback] = useState(null);

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

  const startGame = async (diff) => {
    if (isSoundEnabled) soundEffects.playClick();
    setDifficulty(diff);
    setGameState('loading');
    setLevel(1);
    setTimeLeft(120);
    setScore(0);
    setGemsCollected(0);
    setPowerKeys(1);
    setPowerTimeFreeze(1);
    setIsTimeFrozen(false);
    setShowPathHelper(false);
    
    const size = diff === '0' ? 8 : diff === '1' ? 10 : diff === '2' ? 12 : 14;
    const newGrid = generateMaze(size, size, customQuestions, diff);
    
    setGrid(newGrid);
    setPlayerPos({ x: 0, y: 0 });
    setGameState('playing');
  };

  const nextLevel = () => {
    if (level < totalLevels) {
      setLevel(prev => prev + 1);
      const size = difficulty === '0' ? 8 : difficulty === '1' ? 10 : difficulty === '2' ? 12 : 14;
      const newGrid = generateMaze(size, size, customQuestions, difficulty);
      
      setGrid(newGrid);
      setPlayerPos({ x: 0, y: 0 });
      setGameState('playing');
    } else {
      setGameState('won');
      if (isSoundEnabled) soundEffects.playWinSound();
    }
  };

  const handleMove = useCallback((dx, dy) => {
    if (gameState !== 'playing') return;

    const cell = grid[playerPos.y]?.[playerPos.x];
    if (!cell) return;

    if (dx === 0 && dy === -1 && cell.walls.top) { if (isSoundEnabled) soundEffects.playWrong(); return; }
    if (dx === 1 && dy === 0 && cell.walls.right) { if (isSoundEnabled) soundEffects.playWrong(); return; }
    if (dx === 0 && dy === 1 && cell.walls.bottom) { if (isSoundEnabled) soundEffects.playWrong(); return; }
    if (dx === -1 && dy === 0 && cell.walls.left) { if (isSoundEnabled) soundEffects.playWrong(); return; }

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (newX < 0 || newX >= grid[0].length || newY < 0 || newY >= grid.length) return;

    const targetCell = grid[newY][newX];

    // Check locked door
    if (targetCell.isDoor && !targetCell.doorData.isOpen) {
      setCurrentDoor(targetCell.doorData);
      setGameState('door-modal');
      if (isSoundEnabled) soundEffects.playClick();
      return;
    }

    // Check gem collection
    if (targetCell.hasGem) {
      if (isSoundEnabled) soundEffects.playNumberClick();
      setScore(s => s + 25);
      setTimeLeft(t => t + 5);
      setGemsCollected(g => g + 1);
      setGrid(prev => {
        const updated = prev.map(r => r.map(c => ({ ...c })));
        updated[newY][newX].hasGem = false;
        return updated;
      });
    }

    // Check goal cell
    if (targetCell.isGoal) {
      setPlayerPos({ x: newX, y: newY });
      if (isSoundEnabled) soundEffects.playCorrect();
      setTimeout(nextLevel, 300);
      return;
    }

    setPlayerPos({ x: newX, y: newY });
    if (isSoundEnabled) soundEffects.playClick();
  }, [gameState, playerPos, grid, isSoundEnabled, level, difficulty]);

  // Touch Swipe Gesture Handlers for Mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (gameState !== 'playing') return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 30) {
      if (absX > absY) {
        if (dx > 0) handleMove(1, 0); // Swipe Right
        else handleMove(-1, 0);       // Swipe Left
      } else {
        if (dy > 0) handleMove(0, 1);  // Swipe Down
        else handleMove(0, -1);       // Swipe Up
      }
    }
  };

  // Keyboard controls: Arrow Keys + WASD
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') handleMove(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') handleMove(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleMove(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handleMove(1, 0);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, gameState]);

  // Countdown timer
  useEffect(() => {
    if (gameState === 'playing' && !isTimeFrozen) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameState('won');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, isTimeFrozen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // MCQ Door Submit Handler
  const handleDoorSubmit = (selectedOpt) => {
    const isCorrect = String(selectedOpt).trim() === String(currentDoor.answer).trim();

    if (isCorrect) {
      if (isSoundEnabled) soundEffects.playCorrect();
      setScore(s => s + 50);
      
      setGrid(prev => {
        const updated = prev.map(r => r.map(c => ({ ...c })));
        updated[currentDoor.y][currentDoor.x].doorData.isOpen = true;
        return updated;
      });
      
      setPlayerPos({ x: currentDoor.x, y: currentDoor.y });
      setGameState('playing');
      setCurrentDoor(null);
      setFeedback(null);
    } else {
      if (isSoundEnabled) soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  // Power-up Action: Master Key
  const useMasterKey = () => {
    if (powerKeys > 0 && currentDoor) {
      soundEffects.playCorrect();
      setPowerKeys(k => k - 1);
      setGrid(prev => {
        const updated = prev.map(r => r.map(c => ({ ...c })));
        updated[currentDoor.y][currentDoor.x].doorData.isOpen = true;
        return updated;
      });
      setPlayerPos({ x: currentDoor.x, y: currentDoor.y });
      setGameState('playing');
      setCurrentDoor(null);
      setFeedback(null);
    }
  };

  // Power-up Action: Time Freeze
  const useTimeFreeze = () => {
    if (powerTimeFreeze > 0 && !isTimeFrozen) {
      soundEffects.playClick();
      setPowerTimeFreeze(f => f - 1);
      setIsTimeFrozen(true);
      setTimeout(() => setIsTimeFrozen(false), 10000);
    }
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
    soundEffects.playClick();
  };

  return (
    <div className="maze-game-wrapper">
      <MobileNav role="Student" />
      <Navbar />
      
      <div className="maze-main-container">
        {gameState === 'menu' ? (
          <div className="maze-menu-modern">
             <div className="menu-card" style={{ maxWidth: '540px' }}>
                <div className="menu-icon-wrapper">
                   <Trophy size={64} color="#a855f7" />
                </div>
                <h1>MAZE GAME</h1>
                <p>{t('mazeGame.subtitle', 'تنقل عبر المتاهة وحل أوراق العمل لفتح الأبواب!')}</p>

                {wizardError && (
                  <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: '0.5rem 0' }}>{wizardError}</p>
                )}

                {!customQuestions ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', marginBottom: '1.5rem' }}>
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
                          style={{ padding: '0.75rem', borderRadius: '12px', border: '2px solid #8b5cf6', fontSize: '1rem', background: '#f8fafc' }}
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
                            style={{ padding: '0.75rem', borderRadius: '12px', border: '2px solid #8b5cf6', fontSize: '1rem', background: '#f8fafc' }}
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
                              style={{ padding: '0.75rem', borderRadius: '12px', border: '2px solid #8b5cf6', fontSize: '1rem', background: '#f8fafc' }}
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
                                style={{ padding: '0.75rem', borderRadius: '12px', border: '2px solid #8b5cf6', fontSize: '1rem', background: '#f8fafc' }}
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
                  <div style={{ margin: '1rem 0', padding: '0.8rem 1.2rem', background: 'rgba(168, 85, 247, 0.1)', border: '2px solid #a855f7', borderRadius: '14px', textAlign: 'center' }}>
                    <span style={{ color: '#7c3aed', fontWeight: 700 }}>✓ {t('selected', 'تم تحديد')}: <strong>{chapterName}</strong> ({customQuestions.length} {t('questions', 'أسئلة')})</span>
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
                  <div className="difficulty-grid">
                    <button className="diff-card level-0" onClick={() => startGame('0')}>
                      <span className="lvl">Level 0</span>
                      <span className="desc">Easy (8x8)</span>
                    </button>
                    <button className="diff-card level-1" onClick={() => startGame('1')}>
                      <span className="lvl">Level 1</span>
                      <span className="desc">Normal (10x10)</span>
                    </button>
                    <button className="diff-card level-2" onClick={() => startGame('2')}>
                      <span className="lvl">Level 2</span>
                      <span className="desc">Hard (12x12)</span>
                    </button>
                    <button className="diff-card level-3" onClick={() => startGame('3')}>
                      <span className="lvl">Level 3</span>
                      <span className="desc">Expert (14x14)</span>
                    </button>
                  </div>
                )}

                <button onClick={() => navigate(-1)} className="back-link">
                  <ChevronLeft size={20} /> Back to Games
                </button>
             </div>
          </div>
        ) : gameState === 'loading' ? (
          <div className="maze-loading">
             <Loader2 size={64} className="animate-spin" color="#a855f7" />
             <h2>Preparing Maze...</h2>
          </div>
        ) : (
          <div className="maze-game-layout">
            {/* Left Side: Maze and Top HUD */}
            <div className="maze-game-area">
              <div className="maze-hud">
                <button className="hud-btn sound" onClick={toggleSound}>
                  {isSoundEnabled ? <Volume2 /> : <VolumeX />}
                </button>

                {/* Score & Gems */}
                <div className="hud-chip gem-chip">
                  <Gem size={20} color="#a855f7" />
                  <span>{score} ({gemsCollected} 💎)</span>
                </div>

                {/* Power-up Chips */}
                <div className="hud-powerups">
                  <button 
                    className={`power-chip ${powerTimeFreeze > 0 ? 'active' : 'empty'}`}
                    onClick={useTimeFreeze}
                    title="Freeze Time (10s)"
                  >
                    <Snowflake size={18} />
                    <span>{powerTimeFreeze}</span>
                  </button>
                </div>
                
                <div className={`hud-timer ${isTimeFrozen ? 'frozen' : ''}`}>
                  <Clock size={22} />
                  <span>{formatTime(timeLeft)} {isTimeFrozen && '❄️'}</span>
                </div>
                
                <div className="hud-level">
                  <span>Level {level}/{totalLevels}</span>
                </div>
              </div>

              <div 
                className="maze-viewport"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div className="maze-grid-wrapper">
                  <div className="start-arrow">⬇</div>
                  <div className="maze-render-grid" 
                    style={{ 
                      gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 1fr)`,
                      gridTemplateRows: `repeat(${grid?.length || 0}, 1fr)`
                    }}
                  >
                    {grid.map((row, y) => (
                      row.map((cell, x) => {
                        const isPlayer = playerPos.x === x && playerPos.y === y;
                        const classes = [];
                        if (cell.walls.top) classes.push('w-t');
                        if (cell.walls.right) classes.push('w-r');
                        if (cell.walls.bottom) classes.push('w-b');
                        if (cell.walls.left) classes.push('w-l');
                        
                        return (
                          <div key={`${x}-${y}`} className={`m-cell ${classes.join(' ')}`}>
                            {isPlayer && (
                              <div className="player-indicator">
                                <div className="dot"></div>
                              </div>
                            )}
                            {cell.hasGem && !isPlayer && (
                              <div className="m-gem">💎</div>
                            )}
                            {cell.isDoor && !cell.doorData.isOpen && !isPlayer && (
                              <div className="m-door">🔒</div>
                            )}
                            {cell.isGoal && <div className="m-goal">🏁</div>}
                          </div>
                        );
                      })
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Sidebar */}
            <div className="maze-sidebar">
              <div className="sidebar-header">
                <span className="m-title-part m-1">MAZE</span>
                <span className="m-title-part m-2">GAME</span>
              </div>

              <div className="sidebar-character">
                <img src={CHARACTER_URL} alt="Character" />
              </div>

              <div className="sidebar-controls">
                <div className="dpad-modern">
                  <button className="d-up" onClick={() => handleMove(0, -1)}><ArrowUp /></button>
                  <div className="d-mid">
                    <button className="d-left" onClick={() => handleMove(-1, 0)}><ArrowLeft /></button>
                    <button className="d-right" onClick={() => handleMove(1, 0)}><ArrowRight /></button>
                  </div>
                  <button className="d-down" onClick={() => handleMove(0, 1)}><ArrowDown /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Door Modal: MCQ 2x2 Buttons + Side-by-Side Question Layout */}
        {gameState === 'door-modal' && currentDoor && (
          <div className="maze-overlay">
            <div className={`maze-modal side-by-side ${feedback}`}>
              <div className="maze-modal-content">
                <div className="math-question-section">
                  <div className="math-title">🔒 LOCKED DOOR!</div>
                  {currentDoor.text === 'ABACUS_GRID' && currentDoor.gridRows ? (
                    <div className="racer-abacus-grid-view">
                      <table className="racer-abacus-display-table" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                        <tbody>
                          {currentDoor.gridRows.map((row, i) => (
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
                      {currentDoor.text}
                    </div>
                  )}
                </div>

                <div className="math-answer-section">
                  <div className="math-opts">
                    {currentDoor.options && currentDoor.options.map((opt, i) => (
                      <button 
                        key={i} 
                        className="racer-option-btn" 
                        onClick={() => handleDoorSubmit(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {powerKeys > 0 && (
                    <button className="master-key-btn" onClick={useMasterKey}>
                      <Key size={16} /> Use Master Key ({powerKeys})
                    </button>
                  )}
                </div>
              </div>
              <button className="modal-close" onClick={() => setGameState('playing')}>CANCEL</button>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="maze-overlay">
            <div className="maze-modal winner">
              <Trophy size={64} color="#f59e0b" />
              <h2>MAZE MASTER!</h2>
              <p>Great job solving the math problems and navigating the maze!</p>
              <div className="won-stats">
                 <div className="stat">
                    <span>Score</span>
                    <strong>{score}</strong>
                 </div>
                 <div className="stat">
                    <span>Level</span>
                    <strong>{level}/{totalLevels}</strong>
                 </div>
                 <div className="stat">
                    <span>Time Left</span>
                    <strong>{formatTime(timeLeft)}</strong>
                 </div>
              </div>
              <button className="restart-btn" onClick={() => setGameState('menu')}>
                <RefreshCcw size={20} /> Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MazeGame;
