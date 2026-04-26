import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import getGameQuestionsByLevel from '../../api/games/getGameQuestionsByLevel.api';
import { ChevronLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCcw, Loader2 } from 'lucide-react';
import './MazeGame.css';

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
  
  // Force start cell to have two open routes (right and down) to create a branch right away!
  if (width > 1 && height > 1) {
    grid[0][0].walls.right = false;
    grid[0][1].walls.left = false;
    grid[0][0].walls.bottom = false;
    grid[1][0].walls.top = false;
  }
  
  return grid;
};

const generateQuestion = (customQuestions) => {
  if (customQuestions && customQuestions.length > 0) {
    const q = customQuestions[Math.floor(Math.random() * customQuestions.length)];
    let parsedAnswer = 0;
    if (q.typeOfAnswer === 'MCQ' && q.correctAnswer) parsedAnswer = parseInt(q.correctAnswer);
    else if (q.typeOfAnswer === 'Essay' && q.answer && q.answer.length > 0) parsedAnswer = parseInt(q.answer[0]);
    else if (q.correctAnswer !== undefined) parsedAnswer = parseInt(q.correctAnswer);
    else if (q.answer !== undefined) parsedAnswer = parseInt(Array.isArray(q.answer) ? q.answer[0] : q.answer);
    
    return {
      text: q.question || q.questionText || q.text || `${q.num1} ${q.op} ${q.num2} = ?`,
      answer: parsedAnswer
    };
  }

  // Fallback
  const isAddition = Math.random() > 0.5;
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 20) + 1;
  if (isAddition) return { text: `${num1} + ${num2} = ?`, answer: num1 + num2 };
  else return { text: `${Math.max(num1, num2)} - ${Math.min(num1, num2)} = ?`, answer: Math.abs(num1 - num2) };
};

function MazeGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // menu, loading, playing, door-modal, won
  const [grid, setGrid] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [difficulty, setDifficulty] = useState('0');
  const [customQuestions, setCustomQuestions] = useState(null);
  
  // Door Modal
  const [currentDoor, setCurrentDoor] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null);

  const startGame = async (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setGameState('loading');
    
    const questions = await getGameQuestionsByLevel(level);
    setCustomQuestions(questions);
    
    // Determine size - Increased significantly for more branching paths and brain teaser effect!
    const size = level === '0' ? 10 : level === '1' ? 14 : level === '2' ? 18 : 22;
    const newGrid = generateMaze(size, size);
    
    // Place random doors
    const numDoors = level === '0' ? 2 : level === '1' ? 3 : level === '2' ? 4 : 5;
    let doorsPlaced = 0;
    while(doorsPlaced < numDoors) {
       const rx = Math.floor(Math.random() * size);
       const ry = Math.floor(Math.random() * size);
       // don't place on start or goal
       if ((rx === 0 && ry === 0) || (rx === size-1 && ry === size-1)) continue;
       
       if (!newGrid[ry][rx].isDoor) {
         newGrid[ry][rx].isDoor = true;
         newGrid[ry][rx].doorData = { ...generateQuestion(questions), isOpen: false, x: rx, y: ry };
         doorsPlaced++;
       }
    }
    
    setGrid(newGrid);
    setPlayerPos({ x: 0, y: 0 });
    setGameState('playing');
  };

  const handleMove = useCallback((dx, dy) => {
    if (gameState !== 'playing') return;

    const cell = grid[playerPos.y][playerPos.x];
    if (dx === 0 && dy === -1 && cell.walls.top) { soundEffects.playWrong(); return; }
    if (dx === 1 && dy === 0 && cell.walls.right) { soundEffects.playWrong(); return; }
    if (dx === 0 && dy === 1 && cell.walls.bottom) { soundEffects.playWrong(); return; }
    if (dx === -1 && dy === 0 && cell.walls.left) { soundEffects.playWrong(); return; }

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (newX < 0 || newX >= grid[0].length || newY < 0 || newY >= grid.length) return;

    const targetCell = grid[newY][newX];

    if (targetCell.isDoor && !targetCell.doorData.isOpen) {
      setCurrentDoor(targetCell.doorData);
      setGameState('door-modal');
      soundEffects.playClick();
      return;
    }

    if (targetCell.isGoal) {
      setPlayerPos({ x: newX, y: newY });
      setGameState('won');
      soundEffects.playWinSound();
      return;
    }

    setPlayerPos({ x: newX, y: newY });
    soundEffects.playClick();
  }, [gameState, playerPos, grid]);

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

  const handleDoorSubmit = () => {
    if (parseInt(inputValue) === currentDoor.answer) {
      soundEffects.playCorrect();
      
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
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleDoorKeyDown = (e) => {
    if (e.key === 'Enter') handleDoorSubmit();
  };

  return (
    <>
      <MobileNav role="Student" />
      <Navbar />
      
      <div className="maze-container">
        <div className="racer-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h2>Math Maze 🐿️</h2>
        </div>

        {gameState === 'menu' && (
          <div className="maze-menu">
            <h1>Acorn Maze</h1>
            <p>Help the squirrel find its way to the acorn!</p>
            <p className="subtitle">Solve math problems to break through the locked branches.</p>
            <div className="difficulty-buttons">
              <button className="diff-btn easy" onClick={() => startGame('0')}>Level 0</button>
              <button className="diff-btn medium" onClick={() => startGame('1')}>Level 1</button>
              <button className="diff-btn hard" onClick={() => startGame('2')}>Level 2</button>
              <button className="diff-btn" style={{background: '#4f46e5'}} onClick={() => startGame('3')}>Level 3</button>
            </div>
          </div>
        )}

        {gameState === 'loading' && (
          <div className="maze-menu" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
             <Loader2 size={48} className="spin-animation" color="#d97706" />
             <h3 style={{marginTop: '1rem'}}>Drawing Maze...</h3>
          </div>
        )}

        { (gameState === 'playing' || gameState === 'door-modal' || gameState === 'won') && grid.length > 0 && (
          <div className="maze-board-container">
            <div 
              className="maze-grid algorithmic" 
              style={{ 
                gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`,
                gridTemplateRows: `repeat(${grid.length}, 1fr)`
              }}
            >
              {grid.map((row, y) => (
                row.map((cell, x) => {
                  const isPlayer = playerPos.x === x && playerPos.y === y;
                  const classes = [];
                  if (cell.walls.top) classes.push('wall-t');
                  if (cell.walls.right) classes.push('wall-r');
                  if (cell.walls.bottom) classes.push('wall-b');
                  if (cell.walls.left) classes.push('wall-l');
                  
                  return (
                    <div key={`${x}-${y}`} className={`maze-cell ${classes.join(' ')}`}>
                      {isPlayer && <div className="player-avatar">🐿️</div>}
                      {cell.isDoor && !cell.doorData.isOpen && !isPlayer && <div className="door-icon">🔒</div>}
                      {cell.isGoal && !isPlayer && <div className="goal-icon">🌰</div>}
                    </div>
                  );
                })
              ))}
            </div>
            
            <div className="maze-controls">
              <div className="d-pad">
                <button className="d-btn up" onClick={() => handleMove(0, -1)}><ArrowUp /></button>
                <div className="d-row">
                  <button className="d-btn left" onClick={() => handleMove(-1, 0)}><ArrowLeft /></button>
                  <button className="d-btn right" onClick={() => handleMove(1, 0)}><ArrowRight /></button>
                </div>
                <button className="d-btn down" onClick={() => handleMove(0, 1)}><ArrowDown /></button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'door-modal' && currentDoor && (
          <div className="door-modal-overlay">
            <div className={`door-modal-content ${feedback}`}>
              <h3>Locked Path!</h3>
              <p className="door-problem">{currentDoor.text}</p>
              <div className="door-input-group">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleDoorKeyDown}
                  placeholder="?"
                  autoFocus
                />
                <button onClick={handleDoorSubmit}>Unlock</button>
              </div>
              <button className="cancel-btn" onClick={() => setGameState('playing')}>Go Back</button>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="door-modal-overlay">
            <div className="door-modal-content won">
              <h2>You Found It! 🌰</h2>
              <p>The squirrel got the acorn thanks to your math skills!</p>
              <div className="gameover-actions mt-4" style={{justifyContent: 'center'}}>
                <button className="play-again-btn" onClick={() => setGameState('menu')}>
                  <RefreshCcw size={20} /> Play Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MazeGame;
