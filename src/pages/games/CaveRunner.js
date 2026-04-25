import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, RotateCcw, Heart, ShieldAlert, Award } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';

import './CaveRunner.css';

const CaveRunner = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isJumping, setIsJumping] = useState(false);
  const isJumpingRef = useRef(false);
  const [obstaclePos, setObstaclePos] = useState(100); // percentage 100 to 0
  const [speed, setSpeed] = useState(1); // obstacle speed
  
  // Math Question State
  const [question, setQuestion] = useState({ num1: 0, num2: 0, op: '+' });
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const gameLoopRef = useRef(null);

  const generateQuestion = () => {
    const isAddition = Math.random() > 0.5;
    let num1, num2, answer;

    if (isAddition) {
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 + num2;
    } else {
      num1 = Math.floor(Math.random() * 15) + 5;
      num2 = Math.floor(Math.random() * num1) + 1; // ensure no negative answers
      answer = num1 - num2;
    }

    setQuestion({ num1, num2, op: isAddition ? '+' : '-' });
    setCorrectAnswer(answer);

    // Generate options
    let opts = [answer];
    while (opts.length < 3) {
      const wrongAnswer = answer + (Math.floor(Math.random() * 9) - 4);
      if (wrongAnswer !== answer && wrongAnswer >= 0 && !opts.includes(wrongAnswer)) {
        opts.push(wrongAnswer);
      }
    }
    // Shuffle options
    setOptions(opts.sort(() => Math.random() - 0.5));
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setSpeed(0.8);
    setObstaclePos(100);
    generateQuestion();
    soundEffects.playClick();
  };

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    soundEffects.playError();
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  const handleAnswer = (selectedAns) => {
    if (gameState !== 'playing' || isJumping) return;

    if (selectedAns === correctAnswer) {
      // Correct! Jump!
      soundEffects.playJump();
      setIsJumping(true);
      isJumpingRef.current = true;
      
      // Add score and reset obstacle after jump finishes
      setTimeout(() => {
        setIsJumping(false);
        isJumpingRef.current = false;
        setScore(s => s + 10);
        setSpeed(s => Math.min(s + 0.05, 2.5)); // Increase speed slightly
        setObstaclePos(100);
        generateQuestion();
        soundEffects.playSuccess();
      }, 800); // Match CSS jump animation duration
    } else {
      // Wrong!
      soundEffects.playError();
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) {
          handleGameOver();
        } else {
          // Reset obstacle position to give player another chance
          setObstaclePos(100);
        }
        return newLives;
      });
    }
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();

    const loop = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setObstaclePos(pos => {
        const newPos = pos - (speed * (deltaTime / 16));
        
        // Collision detection (roughly between 10% and 20% on the screen)
        if (newPos <= 20 && newPos >= 10 && !isJumpingRef.current) {
          handleGameOver();
          return 100;
        }
        
        return newPos;
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, speed, isJumping, handleGameOver]);

  return (
    <div className="cave-runner-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="game-wrapper">
        <div className="game-header-top">
          <button className="back-btn" onClick={() => navigate('/dashboard/student')}>
            <ArrowLeft size={24} />
            <span>Dashboard</span>
          </button>
          
          {gameState === 'playing' && (
            <div className="hud">
              <div className="lives">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    size={28} 
                    fill={i < lives ? '#ef4444' : 'transparent'} 
                    color={i < lives ? '#ef4444' : '#cbd5e1'} 
                  />
                ))}
              </div>
              <div className="score-board">
                <Award size={24} color="#fbbf24" />
                <span>{score}</span>
              </div>
            </div>
          )}
        </div>

        <div className={`game-area ${gameState === 'playing' ? 'moving' : ''}`}>
          {/* Background Layers */}
          <div className="bg-layer cave-back"></div>
          <div className="bg-layer cave-mid"></div>
          <div className="bg-layer cave-front"></div>
          
          {/* Ground */}
          <div className="ground"></div>

          {gameState === 'menu' && (
            <div className="menu-overlay">
              <div className="logo-box">
                <h1>Cave Runner</h1>
                <p>Run, calculate, and jump!</p>
              </div>
              <div className="instructions">
                <p>Solve the math problem before the rock hits you!</p>
                <p>Select the correct answer to JUMP.</p>
              </div>
              <button className="start-btn" onClick={startGame}>
                <Play fill="currentColor" size={24} />
                START GAME
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="menu-overlay game-over">
              <ShieldAlert size={64} color="#ef4444" className="mb-4" />
              <h1>Game Over!</h1>
              <p className="final-score">Final Score: {score}</p>
              <button className="start-btn restart" onClick={startGame}>
                <RotateCcw size={24} />
                PLAY AGAIN
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <>
              {/* Character */}
              <div className={`character ${isJumping ? 'jumping' : 'running'}`}>
                🏃‍♂️
              </div>

              {/* Obstacle with Math Question */}
              <div 
                className="obstacle-container"
                style={{ left: `${obstaclePos}%` }}
              >
                <div className="math-question-bubble">
                  {question.num1} {question.op} {question.num2} = ?
                </div>
                <div className="rock">🪨</div>
              </div>
            </>
          )}
        </div>

        {/* Answer Controls */}
        {gameState === 'playing' && (
          <div className="answer-controls">
            {options.map((opt, i) => (
              <button 
                key={i} 
                className="answer-btn"
                onClick={() => handleAnswer(opt)}
                disabled={isJumping}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaveRunner;
