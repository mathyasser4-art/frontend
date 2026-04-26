import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import getGameQuestionsByLevel from '../../api/games/getGameQuestionsByLevel.api';
import { ChevronLeft, Trophy, Timer, Star, RefreshCcw, Medal, Loader2 } from 'lucide-react';
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
      <path d="M 5,28 L 5,18 L 15,18 L 25,5 L 55,5 L 75,18 L 95,18 L 95,28 Z" fill={color} />
      {/* Spoiler */}
      <path d="M 5,18 L 10,10 L 15,15 Z" fill="#1e293b" />
      {/* Windows */}
      <path d="M 18,18 L 27,7 L 38,7 L 38,18 Z" fill="#94a3b8" />
      <path d="M 41,18 L 41,7 L 53,7 L 68,18 Z" fill="#94a3b8" />
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
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentProblem, setCurrentProblem] = useState({ text: '', answer: 0 });
  const [customQuestions, setCustomQuestions] = useState(null); // Array of questions from backend
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
  
  // Race Distances
  const [playerDistance, setPlayerDistance] = useState(0);
  const [bot1Distance, setBot1Distance] = useState(0);
  const [bot2Distance, setBot2Distance] = useState(0);
  
  const RACE_LENGTH = 200;
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Generate a random problem based on difficulty, or use custom questions
  const generateProblem = (diff, customQ = null) => {
    const qArray = customQ !== null ? customQ : customQuestions;
    
    // If we have custom questions, pick a random one
    if (qArray && qArray.length > 0) {
      const randomIndex = Math.floor(Math.random() * qArray.length);
      const q = qArray[randomIndex];
      
      // Parse answer depending on if it's MCQ (correctAnswer) or Essay/Completion (answer array)
      let parsedAnswer = 0;
      if (q.typeOfAnswer === 'MCQ' && q.correctAnswer) {
        parsedAnswer = parseInt(q.correctAnswer);
      } else if (q.typeOfAnswer === 'Essay' && q.answer && q.answer.length > 0) {
        parsedAnswer = parseInt(q.answer[0]);
      } else if (q.correctAnswer !== undefined) {
        parsedAnswer = parseInt(q.correctAnswer);
      } else if (q.answer !== undefined) {
        parsedAnswer = parseInt(Array.isArray(q.answer) ? q.answer[0] : q.answer);
      }

      setCurrentProblem({
        text: q.question || q.questionText || q.text || `${q.num1} ${q.op} ${q.num2} = ?`,
        answer: parsedAnswer
      });
      setInputValue('');
      return;
    }

    // Fallback Auto-generation
    let num1, num2, operator, answer;
    
    if (diff === '0' || diff === 'easy') {
      operator = Math.random() > 0.5 ? '+' : '-';
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      if (operator === '-' && num1 < num2) {
        let temp = num1; num1 = num2; num2 = temp;
      }
    } else if (diff === '1' || diff === 'medium') {
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

  const startGame = async (selectedLevel) => {
    soundEffects.playClick();
    setDifficulty(selectedLevel);
    setGameState('loading');
    
    // Attempt to fetch custom questions for the selected level
    const questions = await getGameQuestionsByLevel(selectedLevel);
    setCustomQuestions(questions);

    setScore(0);
    setTimeElapsed(0);
    setPlayerDistance(0);
    setBot1Distance(0);
    setBot2Distance(0);
    setGameState('playing');
    setFeedback(null);
    generateProblem(selectedLevel, questions);
  };

  const endGame = () => {
    soundEffects.playEndSound();
    setGameState('gameover');
    clearInterval(timerRef.current);
  };

  // Main Game Loop (Timer & Bots)
  useEffect(() => {
    if (gameState === 'playing') {
      // 1-second timer (Elapsed time)
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      
      // Bot movement & Win Check (10 times per second)
      const botInterval = setInterval(() => {
        setBot1Distance(prev => {
          const newDist = prev + (difficulty === 'easy' ? 0.15 : difficulty === 'medium' ? 0.22 : 0.28) + (Math.random() * 0.05);
          if (newDist >= RACE_LENGTH) endGame();
          return newDist;
        });
        setBot2Distance(prev => {
          const newDist = prev + (difficulty === 'easy' ? 0.18 : difficulty === 'medium' ? 0.25 : 0.32) + (Math.random() * 0.05);
          if (newDist >= RACE_LENGTH) endGame();
          return newDist;
        });
        setPlayerDistance(prev => {
          if (prev >= RACE_LENGTH) endGame();
          return prev;
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
      soundEffects.playWrong();
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
        soundEffects.playWrong();
        setFeedback('wrong');
        setInputValue('');
      }
    }
  };

  const handleCorrectAnswer = () => {
    soundEffects.playCorrect();
    setScore(prev => prev + 10);
    setPlayerDistance(prev => {
      const jumpDist = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 12 : 10;
      return prev + jumpDist;
    });
    setFeedback('correct');
    
    setTimeout(() => {
      generateProblem(difficulty);
      setFeedback(null);
    }, 200);
  };

  // Determine Placement
  const getPlacement = () => {
    let place = 1;
    if (bot1Distance > playerDistance) place++;
    if (bot2Distance > playerDistance) place++;
    return place;
  };

  const getVisualPosition = (distance) => {
    // Player is always anchored at ~20% visually. We scale the relative distance.
    const relative = distance - playerDistance;
    const visual = 20 + (relative * 0.6); 
    return Math.max(-20, Math.min(90, visual));
  };

  const getFinishLineVisualPosition = () => {
    const relative = RACE_LENGTH - playerDistance;
    const visual = 20 + (relative * 0.6); 
    return visual;
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
              <button className="diff-btn easy" onClick={() => startGame('0')}>
                Level 0
              </button>
              <button className="diff-btn medium" onClick={() => startGame('1')}>
                Level 1
              </button>
              <button className="diff-btn hard" onClick={() => startGame('2')}>
                Level 2
              </button>
              <button className="diff-btn hard" style={{background: '#4f46e5'}} onClick={() => startGame('3')}>
                Level 3
              </button>
            </div>
          </div>
        )}

        {gameState === 'loading' && (
          <div className="racer-menu" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
             <Loader2 size={48} className="spin-animation" color="#3b82f6" />
             <h3 style={{marginTop: '1rem'}}>Loading Questions...</h3>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="racer-gameplay">
            <div className="game-stats">
              <div className="stat-box timer-box">
                <Timer size={24} color="#fff" />
                <span style={{ color: '#fff' }}>{timeElapsed}s</span>
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
                {/* Finish Line */}
                <div className="finish-line" style={{ left: `${getFinishLineVisualPosition()}%` }}></div>
                
                {/* Lane 1: Bot 1 */}
                <div className="lane">
                  <div className="lane-marker"></div>
                  <div className="racer-car" style={{ left: `${getVisualPosition(bot1Distance)}%` }}>
                    <CarSVG color="#f43f5e" name="Bot 1" />
                  </div>
                </div>
                {/* Lane 2: Player */}
                <div className="lane player-lane">
                  <div className="lane-marker"></div>
                  <div className={`racer-car ${feedback === 'correct' ? 'accelerating' : ''} ${feedback === 'wrong' ? 'stalling' : ''}`} style={{ left: `${getVisualPosition(playerDistance)}%`, zIndex: 10 }}>
                    <CarSVG color="#3b82f6" name="You" />
                  </div>
                </div>
                {/* Lane 3: Bot 2 */}
                <div className="lane">
                  <div className="racer-car" style={{ left: `${getVisualPosition(bot2Distance)}%` }}>
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
            <h2>Race Finished! 🏁</h2>
            
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
