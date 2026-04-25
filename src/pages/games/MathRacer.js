import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ChevronLeft, Trophy, Timer, Star, RefreshCcw } from 'lucide-react';
import './MathRacer.css';

function MathRacer() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentProblem, setCurrentProblem] = useState({ text: '', answer: 0 });
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
  const [carPosition, setCarPosition] = useState(0);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Generate a random problem based on difficulty
  const generateProblem = (diff) => {
    let num1, num2, operator, answer;
    
    if (diff === 'easy') {
      // Single digit addition/subtraction
      operator = Math.random() > 0.5 ? '+' : '-';
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      
      if (operator === '-' && num1 < num2) {
        // Swap to avoid negative numbers in easy mode
        let temp = num1;
        num1 = num2;
        num2 = temp;
      }
    } else if (diff === 'medium') {
      // 2-digit addition/subtraction
      operator = Math.random() > 0.5 ? '+' : '-';
      num1 = Math.floor(Math.random() * 90) + 10;
      num2 = Math.floor(Math.random() * 90) + 10;
      
      if (operator === '-' && num1 < num2) {
        let temp = num1;
        num1 = num2;
        num2 = temp;
      }
    } else {
      // Hard: Include multiplication and mixed 2-digit
      const ops = ['+', '-', '*'];
      operator = ops[Math.floor(Math.random() * ops.length)];
      
      if (operator === '*') {
        num1 = Math.floor(Math.random() * 12) + 2;
        num2 = Math.floor(Math.random() * 12) + 2;
      } else {
        num1 = Math.floor(Math.random() * 99) + 10;
        num2 = Math.floor(Math.random() * 99) + 10;
        if (operator === '-' && num1 < num2) {
          let temp = num1;
          num1 = num2;
          num2 = temp;
        }
      }
    }

    if (operator === '+') answer = num1 + num2;
    if (operator === '-') answer = num1 - num2;
    if (operator === '*') answer = num1 * num2;

    setCurrentProblem({ text: `${num1} ${operator} ${num2} = ?`, answer });
    setInputValue('');
  };

  const startGame = (selectedDifficulty) => {
    soundEffects.playClick();
    setDifficulty(selectedDifficulty);
    setScore(0);
    setTimeLeft(60);
    setCarPosition(0);
    setGameState('playing');
    setFeedback(null);
    generateProblem(selectedDifficulty);
  };

  const endGame = () => {
    setGameState('gameover');
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
    
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Keep input focused
  useEffect(() => {
    const handleGlobalClick = () => {
      if (gameState === 'playing' && inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [gameState]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    
    // Only allow numbers and minus sign
    if (!/^-?\d*$/.test(val)) return;
    
    setInputValue(val);

    // Auto-submit if the answer is correct (or just let them press enter? Let's auto-submit for speed racing)
    if (parseInt(val) === currentProblem.answer) {
      handleCorrectAnswer();
    } else if (val.length >= currentProblem.answer.toString().length && parseInt(val) !== currentProblem.answer) {
      // If they typed enough digits but it's wrong, give feedback but don't clear yet
      setFeedback('wrong');
    } else {
      setFeedback(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (parseInt(inputValue) === currentProblem.answer) {
        handleCorrectAnswer();
      } else {
        setFeedback('wrong');
        setInputValue('');
        // Flash red penalty
      }
    }
  };

  const handleCorrectAnswer = () => {
    setScore(prev => prev + 10);
    setCarPosition(prev => Math.min(prev + 5, 90)); // Move car forward, max 90% to stay on screen
    setFeedback('correct');
    
    setTimeout(() => {
      generateProblem(difficulty);
      setFeedback(null);
    }, 200); // Tiny delay for visual feedback
  };

  return (
    <>
      <MobileNav role="Student" />
      <Navbar />
      
      <div className="math-racer-container">
        <div className="racer-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h2>Math Racer 🏎️💨</h2>
        </div>

        {gameState === 'menu' && (
          <div className="racer-menu">
            <div className="racer-logo">🏎️</div>
            <h3>Select Difficulty to Race!</h3>
            <p>Solve math problems to accelerate your car. The faster you solve, the further you go!</p>
            
            <div className="difficulty-buttons">
              <button className="diff-btn easy" onClick={() => startGame('easy')}>
                <Star size={18} /> Easy (1-Digit)
              </button>
              <button className="diff-btn medium" onClick={() => startGame('medium')}>
                <Star size={18} /> <Star size={18} /> Medium (2-Digit)
              </button>
              <button className="diff-btn hard" onClick={() => startGame('hard')}>
                <Star size={18} /> <Star size={18} /> <Star size={18} /> Hard (Mixed)
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="racer-gameplay">
            <div className="game-stats">
              <div className="stat-box timer-box">
                <Timer size={24} color={timeLeft <= 10 ? '#ef4444' : '#fff'} />
                <span style={{ color: timeLeft <= 10 ? '#ef4444' : '#fff' }}>{timeLeft}s</span>
              </div>
              <div className="stat-box score-box">
                <Trophy size={24} color="#f59e0b" />
                <span>{score}</span>
              </div>
            </div>

            <div className="track-container">
              <div className="road">
                <div className="road-lines"></div>
                <div 
                  className={`player-car ${feedback === 'correct' ? 'accelerating' : ''} ${feedback === 'wrong' ? 'stalling' : ''}`}
                  style={{ left: `${carPosition}%` }}
                >
                  🏎️
                </div>
              </div>
            </div>

            <div className={`problem-container ${feedback}`}>
              <div className="problem-text">{currentProblem.text}</div>
              <input
                ref={inputRef}
                type="text"
                className="answer-input"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="?"
                autoFocus
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="racer-gameover">
            <h2>Time's Up! 🏁</h2>
            <div className="final-score">
              <Trophy size={48} color="#f59e0b" />
              <h3>{score}</h3>
              <p>Points Scored</p>
            </div>
            
            <div className="gameover-actions">
              <button className="play-again-btn" onClick={() => startGame(difficulty)}>
                <RefreshCcw size={20} /> Race Again
              </button>
              <button className="menu-btn" onClick={() => setGameState('menu')}>
                Change Difficulty
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MathRacer;
