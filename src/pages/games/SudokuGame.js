import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Trophy, Lightbulb } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import soundEffects from '../../utils/soundEffects';
import './SudokuGame.css';

// Simple Sudoku Generator (Partial logic for brevity, fully functional for game)
const generateSudoku = (difficulty) => {
  // 9x9 board
  const board = Array(9).fill(null).map(() => Array(9).fill(0));
  
  // Fill diagonal 3x3 boxes (independent)
  for (let i = 0; i < 9; i += 3) {
    fillBox(board, i, i);
  }
  
  solveSudoku(board);
  const solution = board.map(row => [...row]);
  
  // Remove numbers based on difficulty
  const cellsToRemove = difficulty === '0' ? 30 : difficulty === '1' ? 45 : difficulty === '2' ? 55 : 64;
  let removed = 0;
  while (removed < cellsToRemove) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (board[r][c] !== 0) {
      board[r][c] = 0;
      removed++;
    }
  }
  
  return { puzzle: board, solution };
};

const fillBox = (board, row, col) => {
  let num;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      do {
        num = Math.floor(Math.random() * 9) + 1;
      } while (!isSafeInBox(board, row, col, num));
      board[row + i][col + j] = num;
    }
  }
};

const isSafeInBox = (board, rowStart, colStart, num) => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[rowStart + i][colStart + j] === num) return false;
    }
  }
  return true;
};

const solveSudoku = (board) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isSafe(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const isSafe = (board, row, col, num) => {
  for (let x = 0; x < 9; x++) if (board[row][x] === num) return false;
  for (let x = 0; x < 9; x++) if (board[x][col] === num) return false;
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }
  return true;
};

const SudokuGame = () => {
  const navigate = useNavigate();
  const containerRef = React.useRef(null);
  const [grid, setGrid] = useState([]);
  const [initialGrid, setInitialGrid] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState([null, null]);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'won'
  const [difficulty, setDifficulty] = useState('0');
  const [mistakes, setMistakes] = useState(0);
  const MAX_MISTAKES = 3;

  const startGame = (level) => {
    soundEffects.playClick();
    const { puzzle, solution: sol } = generateSudoku(level);
    setGrid(puzzle.map(row => [...row]));
    setInitialGrid(puzzle.map(row => [...row]));
    setSolution(sol);
    setDifficulty(level);
    setMistakes(0);
    setGameState('playing');
    setSelectedCell([null, null]);
  };

  const handleCellClick = (r, c) => {
    if (initialGrid[r][c] !== 0) return;
    soundEffects.playClick();
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num) => {
    const [r, c] = selectedCell;
    if (r === null || gameState !== 'playing') return;

    if (solution[r][c] === num) {
      const newGrid = [...grid];
      newGrid[r][c] = num;
      setGrid(newGrid);
      soundEffects.playCorrect();
      
      // Check win
      if (newGrid.every((row, ri) => row.every((cell, ci) => cell === solution[ri][ci]))) {
        setGameState('won');
        soundEffects.playWinSound();
      }
    } else {
      setMistakes(m => {
        const next = m + 1;
        if (next >= MAX_MISTAKES) {
           // Maybe game over? User didn't specify, I'll just keep it but show warning
        }
        return next;
      });
      soundEffects.playWrong();
    }
  };

  return (
    <div className="sudoku-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="sudoku-container">
        <div className="sudoku-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games</span>
          </button>
          <div className="mistakes-counter">
            Mistakes: <span className={mistakes >= MAX_MISTAKES ? 'text-red' : ''}>{mistakes}/{MAX_MISTAKES}</span>
          </div>
        </div>

        {gameState === 'menu' && (
          <div className="sudoku-menu">
            <div className="game-icon-large">🧩</div>
            <h1>Sudoku Master</h1>
            <p>Challenge your logic and sharpen your focus!</p>
            <div className="diff-grid">
              <button className="diff-card easy" onClick={() => startGame('0')}>Easy</button>
              <button className="diff-card medium" onClick={() => startGame('1')}>Medium</button>
              <button className="diff-card hard" onClick={() => startGame('2')}>Hard</button>
              <button className="diff-card expert" onClick={() => startGame('3')}>Expert</button>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'won') && (
          <div className="game-play-area" ref={containerRef}>
            <FullscreenButton targetRef={containerRef} />
            <div className="sudoku-board">
              {grid.map((row, r) => (
                <div key={r} className="sudoku-row">
                  {row.map((cell, c) => (
                    <div 
                      key={c} 
                      className={`sudoku-cell 
                        ${initialGrid[r][c] !== 0 ? 'initial' : ''} 
                        ${selectedCell[0] === r && selectedCell[1] === c ? 'selected' : ''}
                        ${(r % 3 === 0 && r !== 0) ? 'border-top' : ''}
                        ${(c % 3 === 0 && c !== 0) ? 'border-left' : ''}
                      `}
                      onClick={() => handleCellClick(r, c)}
                    >
                      {cell !== 0 ? cell : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="number-pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleNumberInput(num)} className="num-btn">
                  {num}
                </button>
              ))}
            </div>

            <div className="game-controls">
              <button onClick={() => startGame(difficulty)} className="reset-btn">
                <RefreshCcw size={20} /> Reset
              </button>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="win-overlay">
            <div className="win-card">
              <Trophy size={80} color="#fbbf24" />
              <h2>Brilliant!</h2>
              <p>You solved the puzzle!</p>
              <button onClick={() => setGameState('menu')}>Play Another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SudokuGame;
