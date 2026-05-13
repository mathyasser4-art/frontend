import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import soundEffects from '../../utils/soundEffects';
import './KenKenGame.css';

// KenKen logic: A simplified 4x4 or 6x6 arithmetic grid
const KenKenGame = () => {
  const navigate = useNavigate();
  const containerRef = React.useRef(null);
  const [grid, setGrid] = useState([]);
  const [cages, setCages] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState([null, null]);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'won'
  const [size, setSize] = useState(4);

  const startGame = (s) => {
    soundEffects.playClick();
    setSize(s);
    // Simple 4x4 hardcoded example for stability, can be randomized later
    const example4x4 = {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      solution: [
        [1, 2, 4, 3],
        [3, 4, 2, 1],
        [4, 3, 1, 2],
        [2, 1, 3, 4]
      ],
      cages: [
        { target: 12, op: 'x', cells: [[0,0], [1,0]] },
        { target: 2, op: '/', cells: [[0,1], [0,2]] },
        { target: 3, op: '', cells: [[0,3]] },
        { target: 12, op: 'x', cells: [[1,1], [2,1]] },
        { target: 1, op: '-', cells: [[1,2], [1,3]] },
        { target: 4, op: '', cells: [[2,0]] },
        { target: 3, op: '+', cells: [[2,2], [3,2]] },
        { target: 6, op: 'x', cells: [[2,3], [3,3]] },
        { target: 3, op: '-', cells: [[3,0], [3,1]] },
      ]
    };

    setGrid(example4x4.grid);
    setSolution(example4x4.solution);
    setCages(example4x4.cages);
    setGameState('playing');
    setSelectedCell([null, null]);
  };

  const handleCellClick = (r, c) => {
    soundEffects.playClick();
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num) => {
    const [r, c] = selectedCell;
    if (r === null || gameState !== 'playing') return;

    const newGrid = [...grid];
    newGrid[r][c] = num;
    setGrid(newGrid);

    // Check if correct (optional: only on win check or immediate feedback)
    if (solution[r][c] === num) {
      soundEffects.playCorrect();
    } else {
      soundEffects.playWrong();
    }

    // Check win
    if (newGrid.every((row, ri) => row.every((cell, ci) => cell === solution[ri][ci]))) {
      setGameState('won');
      soundEffects.playWinSound();
    }
  };

  const getCageLabel = (r, c) => {
    const cage = cages.find(cage => cage.cells[0][0] === r && cage.cells[0][1] === c);
    return cage ? `${cage.target}${cage.op}` : '';
  };

  const isInSameCage = (r1, c1, r2, c2) => {
    return cages.some(cage => 
      cage.cells.some(([cr, cc]) => cr === r1 && cc === c1) &&
      cage.cells.some(([cr, cc]) => cr === r2 && cc === c2)
    );
  };

  return (
    <div className="kenken-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="kenken-container">
        <div className="kenken-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games</span>
          </button>
          <h1>KenKen Logic</h1>
        </div>

        {gameState === 'menu' && (
          <div className="kenken-menu">
            <div className="game-icon-large">🧮</div>
            <p>Combine math and logic to fill the grid!</p>
            <div className="diff-grid">
              <button className="diff-card easy" onClick={() => startGame(4)}>4x4 Grid</button>
              <button className="diff-card medium" onClick={() => startGame(6)}>6x6 Grid</button>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'won') && (
          <div className="game-play-area" ref={containerRef}>
            <FullscreenButton targetRef={containerRef} />
            <div className="kenken-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
              {grid.map((row, r) => (
                row.map((cell, c) => (
                  <div 
                    key={`${r}-${c}`}
                    className={`kenken-cell 
                      ${selectedCell[0] === r && selectedCell[1] === c ? 'selected' : ''}
                      ${!isInSameCage(r, c, r-1, c) ? 'border-top' : ''}
                      ${!isInSameCage(r, c, r+1, c) ? 'border-bottom' : ''}
                      ${!isInSameCage(r, c, r, c-1) ? 'border-left' : ''}
                      ${!isInSameCage(r, c, r, c+1) ? 'border-right' : ''}
                    `}
                    onClick={() => handleCellClick(r, c)}
                  >
                    <span className="cage-label">{getCageLabel(r, c)}</span>
                    <span className="cell-value">{cell !== 0 ? cell : ''}</span>
                  </div>
                ))
              ))}
            </div>

            <div className="number-pad">
              {Array.from({ length: size }, (_, i) => i + 1).map(num => (
                <button key={num} onClick={() => handleNumberInput(num)} className="num-btn">
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="win-overlay">
            <div className="win-card">
              <Trophy size={80} color="#fbbf24" />
              <h2>Math Genius!</h2>
              <p>You mastered the KenKen grid!</p>
              <button onClick={() => setGameState('menu')}>Play Another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KenKenGame;
