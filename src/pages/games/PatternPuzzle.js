import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ChevronLeft, RefreshCcw, Star, Brain, Lightbulb } from 'lucide-react';
import './PatternPuzzle.css';

function PatternPuzzle() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
  const [difficulty, setDifficulty] = useState('easy');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [lives, setLives] = useState(3);
  const [hints, setHints] = useState(3);
  const [hintMessage, setHintMessage] = useState('');

  const inputRef = useRef(null);

  const generateSequence = (diff, currentLevel) => {
    let seq = [];
    let ans = 0;
    let hint = '';

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    if (diff === 'easy') {
      // Simple addition or subtraction
      const start = randomInt(1, 20);
      const step = randomInt(2, 10);
      const isAdd = Math.random() > 0.5;
      
      for (let i = 0; i < 4; i++) {
        seq.push(isAdd ? start + (i * step) : start + 50 - (i * step));
      }
      ans = isAdd ? start + (4 * step) : start + 50 - (4 * step);
      hint = isAdd ? `Add ${step} each time` : `Subtract ${step} each time`;
    } 
    else if (diff === 'medium') {
      const type = randomInt(1, 3);
      if (type === 1) {
        // Multiplication
        const start = randomInt(2, 5);
        const factor = randomInt(2, 4);
        for (let i = 0; i < 4; i++) {
          seq.push(start * Math.pow(factor, i));
        }
        ans = start * Math.pow(factor, 4);
        hint = `Multiply by ${factor} each time`;
      } else if (type === 2) {
        // Alternating + and -
        let current = randomInt(10, 50);
        const addStep = randomInt(2, 5);
        const subStep = randomInt(1, 3);
        for (let i = 0; i < 4; i++) {
          seq.push(current);
          if (i % 2 === 0) current += addStep;
          else current -= subStep;
        }
        ans = current;
        hint = `Add ${addStep}, then subtract ${subStep}`;
      } else {
        // Squares
        const start = randomInt(1, 5);
        for (let i = 0; i < 4; i++) {
          seq.push(Math.pow(start + i, 2));
        }
        ans = Math.pow(start + 4, 2);
        hint = `Squares of consecutive numbers`;
      }
    } 
    else {
      // Hard
      const type = randomInt(1, 3);
      if (type === 1) {
        // Fibonacci style
        let a = randomInt(1, 5);
        let b = randomInt(1, 5);
        seq.push(a);
        seq.push(b);
        for (let i = 2; i < 4; i++) {
          const next = a + b;
          seq.push(next);
          a = b;
          b = next;
        }
        ans = a + b;
        hint = `Add the previous two numbers together`;
      } else if (type === 2) {
        // Multiply and add
        const start = randomInt(1, 5);
        const mult = randomInt(2, 3);
        const add = randomInt(1, 5);
        let current = start;
        for (let i = 0; i < 4; i++) {
          seq.push(current);
          current = (current * mult) + add;
        }
        ans = current;
        hint = `Multiply by ${mult} and add ${add}`;
      } else {
        // Primes (simplified, just an array slice)
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
        const startIndex = randomInt(0, primes.length - 6);
        for (let i = 0; i < 4; i++) {
          seq.push(primes[startIndex + i]);
        }
        ans = primes[startIndex + 4];
        hint = `Consecutive prime numbers`;
      }
    }

    setSequence(seq);
    setAnswer(ans);
    setHintMessage(hint);
    setInputValue('');
  };

  const startGame = (diff) => {
    soundEffects.playClick();
    setDifficulty(diff);
    setScore(0);
    setLevel(1);
    setLives(3);
    setHints(3);
    setGameState('playing');
    setFeedback(null);
    generateSequence(diff, 1);
  };

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, sequence]);

  const handleSubmit = () => {
    if (inputValue === '') return;
    
    if (parseInt(inputValue) === answer) {
      soundEffects.playCorrect();
      setFeedback('correct');
      setScore(prev => prev + (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30));
      
      setTimeout(() => {
        setLevel(prev => prev + 1);
        generateSequence(difficulty, level + 1);
        setFeedback(null);
      }, 800);
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setTimeout(() => {
            soundEffects.playEndSound();
            setGameState('gameover');
          }, 800);
        } else {
          setTimeout(() => setFeedback(null), 800);
          setInputValue('');
        }
        return newLives;
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const useHint = () => {
    if (hints > 0) {
      soundEffects.playClick();
      setHints(prev => prev - 1);
      alert(`Hint: ${hintMessage}`);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <>
      <MobileNav role="Student" />
      <Navbar />
      
      <div className="pattern-puzzle-container">
        <div className="racer-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h2>Pattern Puzzle <Brain className="inline-icon" /></h2>
        </div>

        {gameState === 'menu' && (
          <div className="racer-menu">
            <div className="pattern-logo">
              <div className="sequence-preview">
                <span>2</span><span>4</span><span>8</span><span>?</span>
              </div>
            </div>
            <h3>Crack the Code!</h3>
            <p>Analyze the sequence of numbers, discover the hidden mathematical pattern, and find the missing number.</p>
            
            <div className="difficulty-buttons">
              <button className="diff-btn easy" onClick={() => startGame('easy')}>
                <Star size={18} /> Easy
              </button>
              <button className="diff-btn medium" onClick={() => startGame('medium')}>
                <Star size={18} /> <Star size={18} /> Medium
              </button>
              <button className="diff-btn hard" onClick={() => startGame('hard')}>
                <Star size={18} /> <Star size={18} /> <Star size={18} /> Hard
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="pattern-gameplay">
            <div className="game-stats">
              <div className="stat-box">
                <span className="stat-label">Level</span>
                <span>{level}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Score</span>
                <span style={{ color: '#10b981' }}>{score}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Lives</span>
                <span style={{ color: '#ef4444' }}>{'❤️'.repeat(lives)}</span>
              </div>
            </div>

            <div className={`sequence-container ${feedback}`}>
              <h3>What comes next?</h3>
              <div className="sequence-cards">
                {sequence.map((num, idx) => (
                  <div key={idx} className="seq-card fade-in">
                    {num}
                  </div>
                ))}
                <div className="seq-card input-card">
                  <input
                    ref={inputRef}
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="?"
                    disabled={feedback !== null}
                  />
                </div>
              </div>
              
              <div className="gameplay-actions">
                <button 
                  className="hint-btn" 
                  onClick={useHint} 
                  disabled={hints <= 0 || feedback !== null}
                >
                  <Lightbulb size={18} /> Hint ({hints} left)
                </button>
                <button 
                  className="submit-btn" 
                  onClick={handleSubmit}
                  disabled={feedback !== null || inputValue === ''}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="racer-gameover">
            <h2>Game Over! 🧠</h2>
            <p>You ran out of lives.</p>
            
            <div className="results-podium" style={{ justifyContent: 'center' }}>
              <div className="final-score">
                <h3>{score}</h3>
                <p>Total Points</p>
              </div>
              <div className="final-placement">
                <h3>{level}</h3>
                <p>Level Reached</p>
              </div>
            </div>
            
            <div className="gameover-actions">
              <button className="play-again-btn" onClick={() => startGame(difficulty)}>
                <RefreshCcw size={20} /> Play Again
              </button>
              <button className="menu-btn" onClick={() => setGameState('menu')}>
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default PatternPuzzle;
