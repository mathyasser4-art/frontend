import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ChevronLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCcw } from 'lucide-react';
import './MazeGame.css';

// 0: path, 1: wall, 2: door, 3: goal
const INITIAL_MAZE = [
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 2, 0, 1, 3, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 2, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
];

const INITIAL_DOORS = [
  { x: 3, y: 3, problem: '7 + 5', answer: 12, isOpen: false },
  { x: 6, y: 6, problem: '9 * 3', answer: 27, isOpen: false }
];

function MazeGame() {
  const navigate = useNavigate();
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [doors, setDoors] = useState(INITIAL_DOORS);
  const [gameState, setGameState] = useState('playing'); // playing, door-modal, won
  const [currentDoor, setCurrentDoor] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null);

  const handleMove = useCallback((dx, dy) => {
    if (gameState !== 'playing') return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    // Boundary check
    if (newX < 0 || newX >= INITIAL_MAZE[0].length || newY < 0 || newY >= INITIAL_MAZE.length) return;

    const cell = INITIAL_MAZE[newY][newX];

    if (cell === 1) {
      soundEffects.playWrong(); // Thud sound
      return;
    }

    if (cell === 2) {
      const door = doors.find(d => d.x === newX && d.y === newY);
      if (door && !door.isOpen) {
        setCurrentDoor(door);
        setGameState('door-modal');
        soundEffects.playClick();
        return;
      }
    }

    if (cell === 3) {
      setPlayerPos({ x: newX, y: newY });
      setGameState('won');
      soundEffects.playWinSound();
      return;
    }

    setPlayerPos({ x: newX, y: newY });
    soundEffects.playClick(); // Footstep sound
  }, [gameState, playerPos, doors]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowUp') handleMove(0, -1);
      if (e.key === 'ArrowDown') handleMove(0, 1);
      if (e.key === 'ArrowLeft') handleMove(-1, 0);
      if (e.key === 'ArrowRight') handleMove(1, 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, gameState]);

  const handleDoorSubmit = () => {
    if (parseInt(inputValue) === currentDoor.answer) {
      soundEffects.playCorrect();
      setDoors(prev => prev.map(d => d.x === currentDoor.x && d.y === currentDoor.y ? { ...d, isOpen: true } : d));
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
    if (e.key === 'Enter') {
      handleDoorSubmit();
    }
  };

  const resetGame = () => {
    setPlayerPos({ x: 0, y: 0 });
    setDoors(INITIAL_DOORS.map(d => ({ ...d, isOpen: false })));
    setGameState('playing');
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
          <h2>Math Maze 🧩</h2>
        </div>

        <div className="maze-board-container">
          <div className="maze-grid">
            {INITIAL_MAZE.map((row, y) => (
              row.map((cell, x) => {
                const isPlayer = playerPos.x === x && playerPos.y === y;
                const isDoor = cell === 2;
                const door = isDoor ? doors.find(d => d.x === x && d.y === y) : null;
                const isDoorOpen = door?.isOpen;
                
                return (
                  <div key={`${x}-${y}`} className={`maze-cell type-${cell} ${isPlayer ? 'player' : ''} ${isDoorOpen ? 'door-open' : ''}`}>
                    {isPlayer && <div className="player-avatar">😎</div>}
                    {isDoor && !isDoorOpen && !isPlayer && <div className="door-icon">🚪</div>}
                    {cell === 3 && !isPlayer && <div className="goal-icon">🏆</div>}
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
            <div className="maze-instructions">
              <p>Navigate the maze to find the trophy.</p>
              <p>Solve math problems to unlock doors!</p>
            </div>
          </div>
        </div>

        {gameState === 'door-modal' && currentDoor && (
          <div className="door-modal-overlay">
            <div className={`door-modal-content ${feedback}`}>
              <h3>Unlock Door</h3>
              <p className="door-problem">{currentDoor.problem} = ?</p>
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
              <h2>You Did It! 🏆</h2>
              <p>You solved the math problems and found the exit!</p>
              <div className="gameover-actions mt-4">
                <button className="play-again-btn" onClick={resetGame}>
                  <RefreshCcw size={20} /> Play Again
                </button>
                <button className="menu-btn" onClick={() => navigate(-1)}>
                  Exit
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
