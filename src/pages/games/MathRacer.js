import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import getGameQuestionsByLevel from '../../api/games/getGameQuestionsByLevel.api';
import { ChevronLeft, Trophy, Timer, Star, RefreshCcw, Medal, Loader2 } from 'lucide-react';
import './MathRacer.css';

const F1CarSVG = ({ color, name, isBoosting }) => (
  <div className="car-wrapper">
    <div className="car-label">{name}</div>
    <svg viewBox="0 0 130 40" width="110" height="34" xmlns="http://www.w3.org/2000/svg">
      {/* Fiery Boost Effect */}
      <path 
        className={`boost-flame ${isBoosting ? 'active' : ''}`} 
        d="M 15,25 Q -5,15 5,25 Q -10,35 15,25 Z" 
        fill="#f97316" 
        style={{ opacity: isBoosting ? 1 : 0, transition: 'opacity 0.2s', transformOrigin: '20px 25px' }}
      />
      <path 
        className={`boost-flame-inner ${isBoosting ? 'active' : ''}`} 
        d="M 15,25 Q 5,20 10,25 Q 0,30 15,25 Z" 
        fill="#fbbf24" 
        style={{ opacity: isBoosting ? 1 : 0, transition: 'opacity 0.2s', transformOrigin: '20px 25px' }}
      />
      
      {/* Front Wing */}
      <path d="M 105,28 L 125,28 L 125,24 L 105,24 Z" fill="#1e293b" />
      <path d="M 115,24 L 115,20 L 100,20 L 100,24 Z" fill={color} />
      
      {/* Main Body */}
      <path d="M 20,25 L 105,25 L 110,28 L 20,28 Z" fill="#334155" /> {/* Underfloor */}
      <path d="M 25,25 L 45,14 L 75,14 L 95,25 Z" fill={color} /> {/* Engine Cover & Nose */}
      <path d="M 95,25 L 115,25 Z" stroke={color} strokeWidth="4" />
      
      {/* Rear Wing */}
      <path d="M 10,12 L 30,12 L 30,22 L 10,22 Z" fill={color} />
      <path d="M 10,8 L 30,8 L 30,12 L 10,12 Z" fill="#1e293b" />
      <path d="M 15,8 L 15,25" stroke="#1e293b" strokeWidth="2" />
      <path d="M 25,8 L 25,25" stroke="#1e293b" strokeWidth="2" />

      {/* Cockpit & Driver */}
      <path d="M 50,14 C 50,8 70,8 70,14 Z" fill="#0f172a" />
      <circle cx="62" cy="10" r="5" fill="#facc15" /> {/* Driver Helmet */}

      {/* Wheels */}
      {/* Front Wheel */}
      <circle cx="95" cy="28" r="11" fill="#0f172a"/>
      <circle cx="95" cy="28" r="5" fill="#94a3b8"/>
      <circle cx="95" cy="28" r="2" fill="#ef4444"/>
      {/* Rear Wheel */}
      <circle cx="35" cy="28" r="13" fill="#0f172a"/>
      <circle cx="35" cy="28" r="6" fill="#94a3b8"/>
      <circle cx="35" cy="28" r="2" fill="#ef4444"/>
    </svg>
  </div>
);

function MathRacer() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentProblem, setCurrentProblem] = useState({ text: '', answer: 0, options: [] });
  const [customQuestions, setCustomQuestions] = useState(null); // Array of questions from backend
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

      let options = [parsedAnswer];
      // Generate 3 fake options if we don't have enough
      while (options.length < 4) {
        const fake = parsedAnswer + Math.floor(Math.random() * 10) - 5;
        if (!options.includes(fake) && fake > 0) options.push(fake);
      }
      options.sort(() => Math.random() - 0.5);

      setCurrentProblem({
        text: q.question || q.questionText || q.text || `${q.num1} ${q.op} ${q.num2} = ?`,
        answer: parsedAnswer,
        options
      });
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

    let options = [answer];
    while (options.length < 4) {
      const fake = answer + Math.floor(Math.random() * 10) - 5;
      if (!options.includes(fake) && fake >= 0) options.push(fake);
    }
    options.sort(() => Math.random() - 0.5);

    setCurrentProblem({ text: `${num1} ${operator} ${num2} = ?`, answer, options });
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

  // No longer need to keep input focused since we use buttons
  useEffect(() => {
    // Empty effect to replace the old one
  }, [gameState]);

  const handleOptionClick = (selectedOpt) => {
    if (selectedOpt === currentProblem.answer) {
      handleCorrectAnswer();
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 800);
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
              <F1CarSVG color="#3b82f6" name="" />
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
                <div className="finish-line-container" style={{ left: `${getFinishLineVisualPosition()}%` }}>
                  <div className="finish-pole left-pole">
                    <div className="finish-flag">🏁</div>
                  </div>
                  <div className="finish-banner">FINISH LINE</div>
                  <div className="finish-pole right-pole">
                    <div className="finish-flag">🏁</div>
                  </div>
                  <div className="finish-line-checkered"></div>
                </div>
                
                {/* Lane 1: Bot 1 */}
                <div className="lane">
                  <div className="lane-marker"></div>
                  <div className="racer-car bot-car" style={{ left: `${getVisualPosition(bot1Distance)}%` }}>
                    <F1CarSVG color="#f43f5e" name="Bot 1" />
                  </div>
                </div>
                {/* Lane 2: Player */}
                <div className="lane player-lane">
                  <div className="lane-marker"></div>
                  <div className={`racer-car player-car ${feedback === 'correct' ? 'accelerating' : ''} ${feedback === 'wrong' ? 'stalling' : ''}`} style={{ left: `${getVisualPosition(playerDistance)}%` }}>
                    <F1CarSVG color="#3b82f6" name="You" isBoosting={feedback === 'correct'} />
                  </div>
                </div>
                {/* Lane 3: Bot 2 */}
                <div className="lane">
                  <div className="racer-car bot-car" style={{ left: `${getVisualPosition(bot2Distance)}%` }}>
                    <F1CarSVG color="#8b5cf6" name="Bot 2" />
                  </div>
                </div>
              </div>
            </div>

            <div className={`problem-container ${feedback}`}>
              <div className="problem-text">{currentProblem.text}</div>
              <div className="math-racer-options">
                {currentProblem.options && currentProblem.options.map((opt, i) => (
                  <button 
                    key={i} 
                    className="racer-option-btn"
                    onClick={() => handleOptionClick(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
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
