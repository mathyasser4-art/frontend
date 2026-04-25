import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { ChevronLeft, Trophy, Timer, Star, RefreshCcw, Medal } from 'lucide-react';
import './MathRacer.css';

const CarSVG = ({ color, name }) => (
  <div className="car-wrapper">
    <div className="car-label">{name}</div>
    <svg viewBox="0 0 100 40" width="90" height="36" xmlns="http://www.w3.org/2000/svg">
      {/* Exhaust Smoke (Animated in CSS) */}
      <circle className="exhaust-smoke" cx="-5" cy="25" r="4" fill="#cbd5e1" opacity="0" />
      <circle className="exhaust-smoke delay-1" cx="-15" cy="22" r="6" fill="#cbd5e1" opacity="0" />
      
      {/* Tires */}
      <circle cx="20" cy="35" r="8" fill="#1e293b"/>
      <circle cx="80" cy="35" r="8" fill="#1e293b"/>
      {/* Rims */}
      <circle cx="20" cy="35" r="3" fill="#cbd5e1"/>
      <circle cx="80" cy="35" r="3" fill="#cbd5e1"/>
      
      {/* Body */}
      <path d="M 5,28 L 5,18 L 25,18 L 45,5 L 75,5 L 85,18 L 95,18 L 95,28 Z" fill={color} />
      {/* Spoiler */}
      <path d="M 5,18 L 15,10 L 15,15 Z" fill="#1e293b" />
      {/* Windows */}
      <path d="M 32,18 L 47,7 L 58,7 L 58,18 Z" fill="#94a3b8" />
      <path d="M 61,18 L 61,7 L 72,7 L 82,18 Z" fill="#94a3b8" />
      {/* Lights */}
      <rect x="92" y="20" width="3" height="4" fill="#fbbf24" />
      <rect x="5" y="20" width="2" height="4" fill="#ef4444" />
      {/* Details */}
      <rect x="0" y="24" width="8" height="3" fill="#64748b" />
    </svg>
  </div>
);

function MathRacer() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentProblem, setCurrentProblem] = useState({ text: '', answer: 0 });
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
  
  // Race Positions (0 to 90%)
  const [playerPosition, setPlayerPosition] = useState(0);
  const [bot1Position, setBot1Position] = useState(0);
  const [bot2Position, setBot2Position] = useState(0);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Generate a random problem based on difficulty
  const generateProblem = (diff) => {
    let num1, num2, operator, answer;
    
    if (diff === 'easy') {
      operator = Math.random() > 0.5 ? '+' : '-';
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      if (operator === '-' && num1 < num2) {
        let temp = num1; num1 = num2; num2 = temp;
      }
    } else if (diff === 'medium') {
      operator = Math.random() > 0.5 ? '+' : '-';
      num1 = Math.floor(Math.random() * 90) + 10;
      num2 = Math.floor(Math.random() * 90) + 10;
      if (operator === '-' && num1 < num2) {
        let temp = num1; num1 = num2; num2 = temp;
      }
    } else {
      const ops = ['+', '-', '*'];
      operator = ops[Math.floor(Math.random() * ops.length)];
      if (operator === '*') {
        num1 = Math.floor(Math.random() * 12) + 2;
        num2 = Math.floor(Math.random() * 12) + 2;
      } else {
        num1 = Math.floor(Math.random() * 99) + 10;
        num2 = Math.floor(Math.random() * 99) + 10;
        if (operator === '-' && num1 < num2) {
          let temp = num1; num1 = num2; num2 = temp;
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
    setPlayerPosition(0);
    setBot1Position(0);
    setBot2Position(0);
    setGameState('playing');
    setFeedback(null);
    generateProblem(selectedDifficulty);
  };

  const endGame = () => {
    setGameState('gameover');
    clearInterval(timerRef.current);
  };

  // Main Game Loop (Timer & Bots)
  useEffect(() => {
    if (gameState === 'playing') {
      // 1-second timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Bot movement (10 times per second for smooth animation)
      const botInterval = setInterval(() => {
        setBot1Position(prev => {
          if (prev >= 90) return 90;
          // Target 90% in ~50 seconds => 90 / 500 = 0.18 per tick
          return prev + (Math.random() * 0.12 + 0.12);
        });
        setBot2Position(prev => {
          if (prev >= 90) return 90;
          // Target 90% in ~55 seconds => 90 / 550 = 0.16 per tick
          return prev + (Math.random() * 0.15 + 0.08); 
        });
      }, 100);
      
      if (inputRef.current) inputRef.current.focus();
      
      return () => {
        clearInterval(timerRef.current);
        clearInterval(botInterval);
      };
    }
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
    if (!/^-?\d*$/.test(val)) return;
    setInputValue(val);

    if (parseInt(val) === currentProblem.answer) {
      handleCorrectAnswer();
    } else if (val.length >= currentProblem.answer.toString().length && parseInt(val) !== currentProblem.answer) {
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
      }
    }
  };

  const handleCorrectAnswer = () => {
    setScore(prev => prev + 10);
    // Move player based on difficulty
    const jump = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    setPlayerPosition(prev => Math.min(prev + jump, 90));
    setFeedback('correct');
    
    setTimeout(() => {
      generateProblem(difficulty);
      setFeedback(null);
    }, 200);
  };

  // Determine Placement
  const getPlacement = () => {
    let place = 1;
    if (bot1Position > playerPosition) place++;
    if (bot2Position > playerPosition) place++;
    return place;
  };

  return (
    <>
      <MobileNav role="Student" />
      <Navbar />
      
      <div className="math-racer-container">
        <div className="racer-header">
          <button onClick={() => navigate(-1)} className="back-button">
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h2>Math Racer 🏎️💨</h2>
        </div>

        {gameState === 'menu' && (
          <div className="racer-menu">
            <div className="racer-logo">
              <CarSVG color="#3b82f6" name="" />
            </div>
            <h3>Select Difficulty to Race!</h3>
            <p>Compete against AI racers on the endless highway. Solve math problems correctly to accelerate your car and take 1st place!</p>
            
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
              <div className="stat-box placement-box">
                <Medal size={24} color="#10b981" />
                <span>{getPlacement()}{getPlacement() === 1 ? 'st' : getPlacement() === 2 ? 'nd' : 'rd'}</span>
              </div>
              <div className="stat-box score-box">
                <Trophy size={24} color="#f59e0b" />
                <span>{score}</span>
              </div>
            </div>

            {/* The Infinite Journey Track */}
            <div className={`track-container ${gameState === 'playing' ? 'is-moving' : ''}`}>
              <div className="sky-bg"></div>
              <div className="mountains-bg"></div>
              <div className="trees-bg"></div>
              
              <div className="road">
                {/* Lane 1: Bot 1 */}
                <div className="lane">
                  <div className="lane-marker"></div>
                  <div className="racer-car" style={{ left: `${bot1Position}%` }}>
                    <CarSVG color="#f43f5e" name="Bot 1" />
                  </div>
                </div>
                {/* Lane 2: Player */}
                <div className="lane player-lane">
                  <div className="lane-marker"></div>
                  <div className={`racer-car ${feedback === 'correct' ? 'accelerating' : ''} ${feedback === 'wrong' ? 'stalling' : ''}`} style={{ left: `${playerPosition}%`, zIndex: 10 }}>
                    <CarSVG color="#3b82f6" name="You" />
                  </div>
                </div>
                {/* Lane 3: Bot 2 */}
                <div className="lane">
                  <div className="racer-car" style={{ left: `${bot2Position}%` }}>
                    <CarSVG color="#8b5cf6" name="Bot 2" />
                  </div>
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
            
            <div className="results-podium">
              <div className="final-placement">
                <Medal size={40} color="#10b981" />
                <h3>{getPlacement()}{getPlacement() === 1 ? 'st' : getPlacement() === 2 ? 'nd' : 'rd'} Place</h3>
              </div>
              <div className="final-score">
                <Trophy size={40} color="#f59e0b" />
                <h3>{score}</h3>
                <p>Points</p>
              </div>
            </div>
            
            <div className="gameover-actions">
              <button className="play-again-btn" onClick={() => startGame(difficulty)}>
                <RefreshCcw size={20} /> Race Again
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

export default MathRacer;
