import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ChevronLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCcw, Loader2, Volume2, VolumeX, Trophy, Clock } from 'lucide-react';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import './MazeGame.css';

// Using a placeholder character for now as image generation failed
const CHARACTER_URL = 'https://api.dicebear.com/7.x/bottts/svg?seed=toothpaste&backgroundColor=b6e3f4';

const generateMaze = (width, height) => {
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
        isGoal: false
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
  
  return grid;
};

const generateQuestion = (level) => {
  const q = generateArithmeticMcq(level, 4);
  return { text: q.text, answer: q.answer };
};

function MazeGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // menu, loading, playing, door-modal, won
  const [grid, setGrid] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [difficulty, setDifficulty] = useState('0');
  const [level, setLevel] = useState(1);
  const totalLevels = 15;
  
  // Stats
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const timerRef = useRef(null);

  // Door Modal
  const [currentDoor, setCurrentDoor] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null);

  const startGame = async (diff) => {
    if (isSoundEnabled) soundEffects.playClick();
    setDifficulty(diff);
    setGameState('loading');
    setLevel(1);
    setTimeLeft(120);
    
    // Determine size
    const size = diff === '0' ? 8 : diff === '1' ? 10 : diff === '2' ? 12 : 14;
    const newGrid = generateMaze(size, size);
    
    // Place random doors
    const numDoors = diff === '0' ? 2 : diff === '1' ? 3 : diff === '2' ? 4 : 5;
    let doorsPlaced = 0;
    while(doorsPlaced < numDoors) {
       const rx = Math.floor(Math.random() * size);
       const ry = Math.floor(Math.random() * size);
       if ((rx === 0 && ry === 0) || (rx === size-1 && ry === size-1)) continue;
       
       if (!newGrid[ry][rx].isDoor) {
         newGrid[ry][rx].isDoor = true;
         newGrid[ry][rx].doorData = { ...generateQuestion(diff), isOpen: false, x: rx, y: ry };
         doorsPlaced++;
       }
    }
    
    setGrid(newGrid);
    setPlayerPos({ x: 0, y: 0 });
    setGameState('playing');
  };

  const nextLevel = () => {
    if (level < totalLevels) {
      setLevel(prev => prev + 1);
      const size = difficulty === '0' ? 8 : difficulty === '1' ? 10 : difficulty === '2' ? 12 : 14;
      const newGrid = generateMaze(size, size);
      
      const numDoors = difficulty === '0' ? 2 : difficulty === '1' ? 3 : difficulty === '2' ? 4 : 5;
      let doorsPlaced = 0;
      while(doorsPlaced < numDoors) {
         const rx = Math.floor(Math.random() * size);
         const ry = Math.floor(Math.random() * size);
         if ((rx === 0 && ry === 0) || (rx === size-1 && ry === size-1)) continue;
         if (!newGrid[ry][rx].isDoor) {
           newGrid[ry][rx].isDoor = true;
           newGrid[ry][rx].doorData = { ...generateQuestion(difficulty), isOpen: false, x: rx, y: ry };
           doorsPlaced++;
         }
      }
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

    const cell = grid[playerPos.y][playerPos.x];
    if (dx === 0 && dy === -1 && cell.walls.top) { if (isSoundEnabled) soundEffects.playWrong(); return; }
    if (dx === 1 && dy === 0 && cell.walls.right) { if (isSoundEnabled) soundEffects.playWrong(); return; }
    if (dx === 0 && dy === 1 && cell.walls.bottom) { if (isSoundEnabled) soundEffects.playWrong(); return; }
    if (dx === -1 && dy === 0 && cell.walls.left) { if (isSoundEnabled) soundEffects.playWrong(); return; }

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (newX < 0 || newX >= grid[0].length || newY < 0 || newY >= grid.length) return;

    const targetCell = grid[newY][newX];

    if (targetCell.isDoor && !targetCell.doorData.isOpen) {
      setCurrentDoor(targetCell.doorData);
      setGameState('door-modal');
      if (isSoundEnabled) soundEffects.playClick();
      return;
    }

    if (targetCell.isGoal) {
      setPlayerPos({ x: newX, y: newY });
      if (isSoundEnabled) soundEffects.playCorrect();
      setTimeout(nextLevel, 300);
      return;
    }

    setPlayerPos({ x: newX, y: newY });
    if (isSoundEnabled) soundEffects.playClick();
  }, [gameState, playerPos, grid, isSoundEnabled, level, difficulty]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp') handleMove(0, -1);
      if (e.key === 'ArrowDown') handleMove(0, 1);
      if (e.key === 'ArrowLeft') handleMove(-1, 0);
      if (e.key === 'ArrowRight') handleMove(1, 0);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameState('won'); // End game if time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDoorSubmit = () => {
    if (parseInt(inputValue) === currentDoor.answer) {
      if (isSoundEnabled) soundEffects.playCorrect();
      
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[currentDoor.y][currentDoor.x].doorData.isOpen = true;
        return newGrid;
      });
      
      setPlayerPos({ x: currentDoor.x, y: currentDoor.y });
      setGameState('playing');
      setCurrentDoor(null);
      setInputValue('');
      setFeedback(null);
    } else {
      if (isSoundEnabled) soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleDoorKeyDown = (e) => {
    if (e.key === 'Enter') handleDoorSubmit();
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
             <div className="menu-card">
                <div className="menu-icon-wrapper">
                   <Trophy size={64} color="#a855f7" />
                </div>
                <h1>MAZE GAME</h1>
                <p>Navigate through the maze and solve math problems to unlock doors!</p>
                <div className="difficulty-grid">
                  <button className="diff-card level-0" onClick={() => startGame('0')}>
                    <span className="lvl">Level 0</span>
                    <span className="desc">Easy</span>
                  </button>
                  <button className="diff-card level-1" onClick={() => startGame('1')}>
                    <span className="lvl">Level 1</span>
                    <span className="desc">Normal</span>
                  </button>
                  <button className="diff-card level-2" onClick={() => startGame('2')}>
                    <span className="lvl">Level 2</span>
                    <span className="desc">Hard</span>
                  </button>
                  <button className="diff-card level-3" onClick={() => startGame('3')}>
                    <span className="lvl">Level 3</span>
                    <span className="desc">Expert</span>
                  </button>
                </div>
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
                
                <div className="hud-timer">
                  <Clock size={24} />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                
                <div className="hud-level">
                  <span>{level}/{totalLevels}</span>
                </div>
              </div>

              <div className="maze-viewport">
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

        {gameState === 'door-modal' && currentDoor && (
          <div className="maze-overlay">
            <div className={`maze-modal ${feedback}`}>
              <h3>LOCKED!</h3>
              <div className="problem-box">
                {currentDoor.text}
              </div>
              <div className="input-group-modern">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleDoorKeyDown}
                  placeholder="?"
                  autoFocus
                />
                <button onClick={handleDoorSubmit}>GO</button>
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
                    <span>Level</span>
                    <strong>{level}</strong>
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
