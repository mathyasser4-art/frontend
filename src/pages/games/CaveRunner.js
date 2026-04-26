import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, RotateCcw, Heart, ShieldAlert, Award } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import getGameQuestionsByLevel from '../../api/games/getGameQuestionsByLevel.api';
import { Loader2 } from 'lucide-react';

import './CaveRunner.css';

const BunnyRun = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isJumping, setIsJumping] = useState(false);
  const isJumpingRef = useRef(false);
  const [isFalling, setIsFalling] = useState(false);
  const isFallingRef = useRef(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const isWaitingRef = useRef(false);
  const [obstaclePos, setObstaclePos] = useState(120); // percentage 120 to -GAP_WIDTH
  const [obstacleType, setObstacleType] = useState('gap'); // 'gap' or 'rock'
  const [speed, setSpeed] = useState(1); // game speed

  const GAP_WIDTH = 20;
  
  // Timed Question State
  const timeSinceLastQuestionRef = useRef(0);
  const QUESTION_INTERVAL = 10000; // 10 seconds
  
  // Math Question State
  const [question, setQuestion] = useState({ num1: 0, num2: 0, op: '+' });
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [customQuestions, setCustomQuestions] = useState(null);
  const [difficulty, setDifficulty] = useState('0');

  // Coins State
  const [coins, setCoins] = useState([]);
  const nextCoinId = useRef(0);

  const gameLoopRef = useRef(null);

  const spawnCoins = useCallback(() => {
    const newCoins = [];
    for (let i = 0; i < 3; i++) {
      newCoins.push({
        id: nextCoinId.current++,
        pos: 100 + (i * 25), // Spaced out
        collected: false
      });
    }
    setCoins(newCoins);
  }, []);

  const generateQuestion = (customQ = null) => {
    const qArray = customQ !== null ? customQ : customQuestions;
    
    if (qArray && qArray.length > 0) {
      const randomIndex = Math.floor(Math.random() * qArray.length);
      const q = qArray[randomIndex];
      
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

      setQuestion({ text: q.question || q.questionText || q.text || `${q.num1} ${q.op} ${q.num2} = ?` });
      setCorrectAnswer(parsedAnswer);

      // Generate fake options for Cave Runner
      let opts = [parsedAnswer];
      while (opts.length < 3) {
        const wrongOpt = parsedAnswer + (Math.floor(Math.random() * 9) - 4);
        if (wrongOpt !== parsedAnswer && !opts.includes(wrongOpt)) {
          opts.push(wrongOpt);
        }
      }
      setOptions(opts.sort(() => Math.random() - 0.5));
      return;
    }

    const isAddition = Math.random() > 0.5;
    let num1, num2, answer;

    if (isAddition) {
      num1 = Math.floor(Math.random() * 5) + 1;
      num2 = Math.floor(Math.random() * 5) + 1;
      answer = num1 + num2;
    } else {
      num1 = Math.floor(Math.random() * 6) + 4; // 4 to 9
      num2 = Math.floor(Math.random() * num1) + 1; 
      answer = num1 - num2;
    }

    setQuestion({ text: `${num1} ${isAddition ? '+' : '-'} ${num2} = ?` });
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

  const startGame = async (selectedLevel) => {
    soundEffects.playClick();
    setDifficulty(selectedLevel);
    setGameState('loading');

    const questions = await getGameQuestionsByLevel(selectedLevel);
    setCustomQuestions(questions);

    setGameState('playing');
    setScore(0);
    setLives(3);
    setSpeed(1.2);
    setObstaclePos(120);
    setObstacleType('gap');
    setIsWaitingForAnswer(false);
    isWaitingRef.current = false;
    setIsFalling(false);
    isFallingRef.current = false;
    isJumpingRef.current = false;
    setIsJumping(false);
    timeSinceLastQuestionRef.current = 0;
    spawnCoins();
    generateQuestion(questions);
  };

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    soundEffects.playWrong();
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  const jump = useCallback(() => {
    if (gameState !== 'playing' || isJumpingRef.current || isFallingRef.current || isWaitingRef.current) return;
    
    soundEffects.playClick();
    setIsJumping(true);
    isJumpingRef.current = true;
    
    setTimeout(() => {
      setIsJumping(false);
      isJumpingRef.current = false;
    }, 800); // jump animation duration
  }, [gameState]);

  // Listen for spacebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  const handleAnswer = (selectedAns) => {
    if (gameState !== 'playing') return;

    if (selectedAns === correctAnswer) {
      soundEffects.playWinSound();
      setScore(s => s + 50);
      setSpeed(s => Math.min(s + 0.15, 3.5)); // Increase speed dynamically
    } else {
      soundEffects.playWrong();
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) handleGameOver();
        return newLives;
      });
    }

    // Unfreeze and reset question timer
    setIsWaitingForAnswer(false);
    isWaitingRef.current = false;
    timeSinceLastQuestionRef.current = 0;
    generateQuestion();
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();

    const loop = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (!isWaitingRef.current && !isFallingRef.current) {
        timeSinceLastQuestionRef.current += deltaTime;

        // Check if it's time to ask a question
        if (timeSinceLastQuestionRef.current >= QUESTION_INTERVAL) {
          setIsWaitingForAnswer(true);
          isWaitingRef.current = true;
        }
      }

      setObstaclePos(pos => {
        if (isWaitingRef.current || isFallingRef.current) return pos;

        let newPos = pos - (speed * (deltaTime / 16));
        
        // Check collision based on obstacle type
        let hitObstacle = false;
        
        if (obstacleType === 'gap') {
          // Gap is from newPos to newPos + GAP_WIDTH (20)
          if (newPos <= 15 && (newPos + GAP_WIDTH) >= 20 && !isJumpingRef.current && !isFallingRef.current) {
            hitObstacle = true;
          }
        } else if (obstacleType === 'rock') {
          // Rock is at newPos. Width is approx 5%.
          if (newPos <= 18 && newPos >= 12 && !isJumpingRef.current && !isFallingRef.current) {
            hitObstacle = true;
          }
        }

        if (hitObstacle) {
          // Hit the obstacle! Fall down / trip!
          soundEffects.playWrong();
          setIsFalling(true);
          isFallingRef.current = true;
          
          setTimeout(() => {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                handleGameOver();
              } else {
                setIsFalling(false);
                isFallingRef.current = false;
                setObstaclePos(120); // Reset obstacle far away
                setObstacleType(Math.random() > 0.5 ? 'gap' : 'rock');
                spawnCoins();
              }
              return newLives;
            });
          }, 600);
          
          return pos; // Stop moving obstacle during fall
        }
        
        // Loop obstacle infinitely
        if (newPos < -GAP_WIDTH) {
           newPos = 120 + Math.random() * 50; // Random distance before next obstacle
           setObstacleType(Math.random() > 0.5 ? 'gap' : 'rock');
           spawnCoins(); // Spawn new coins with the new obstacle
        }
        
        return newPos;
      });

      // Move coins
      setCoins(prevCoins => {
        if (isWaitingRef.current || isFallingRef.current) return prevCoins;
        
        return prevCoins.map(c => {
          if (c.collected) return c;
          const newCoinPos = c.pos - (speed * (deltaTime / 16));
          // Collect if it hits the player
          if (newCoinPos <= 20 && newCoinPos >= 10 && !isFallingRef.current) {
             soundEffects.playNumberClick();
             setScore(s => s + 10);
             return { ...c, pos: newCoinPos, collected: true };
          }
          return { ...c, pos: newCoinPos };
        }).filter(c => c.pos > -10);
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, speed, handleGameOver, spawnCoins]);

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

        <div 
          className={`game-area ${gameState === 'playing' && !isWaitingForAnswer && !isFalling ? 'moving' : ''} ${isWaitingForAnswer ? 'frozen' : ''}`}
          onClick={jump}
        >
          {/* Background Layers */}
          <div className="bg-layer cave-back"></div>
          <div className="bg-layer cave-mid"></div>
          <div className="bg-layer scenery-layer">
            <span className="scenery-item" style={{left: '10%'}}>🌲</span>
            <span className="scenery-item" style={{left: '35%'}}>🌻</span>
            <span className="scenery-item" style={{left: '60%'}}>🌲</span>
            <span className="scenery-item" style={{left: '85%'}}>🌼</span>
            <span className="scenery-item" style={{left: '110%'}}>🌲</span>
            <span className="scenery-item" style={{left: '135%'}}>🌻</span>
            <span className="scenery-item" style={{left: '160%'}}>🌲</span>
            <span className="scenery-item" style={{left: '185%'}}>🌼</span>
          </div>
          <div className="bg-layer cave-front"></div>
          
          {/* Ground */}
          <div className="ground-container">
            {obstacleType === 'gap' ? (
              <>
                <div className="ground-segment" style={{ position: 'absolute', left: 0, width: `${Math.max(0, obstaclePos)}%` }}></div>
                <div className="gap-segment" style={{ position: 'absolute', left: `${obstaclePos}%`, width: `${GAP_WIDTH}%` }}></div>
                <div className="ground-segment" style={{ position: 'absolute', left: `${obstaclePos + GAP_WIDTH}%`, right: 0 }}></div>
              </>
            ) : (
              <>
                <div className="ground-segment" style={{ position: 'absolute', left: 0, right: 0 }}></div>
                <div className="cartoony-rock" style={{ left: `${obstaclePos}%` }}></div>
              </>
            )}
          </div>

          {gameState === 'menu' && (
            <div className="menu-overlay">
              <div className="logo-box">
                <h1>Bunny Run</h1>
                <p>Run, calculate, and jump!</p>
              </div>
              <div className="instructions">
                <p>Solve the math problem before the rock hits you!</p>
                <p>Select the correct answer to JUMP.</p>
              </div>
              <div className="difficulty-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="start-btn" onClick={() => startGame('0')}>Level 0</button>
                <button className="start-btn" onClick={() => startGame('1')}>Level 1</button>
                <button className="start-btn" onClick={() => startGame('2')}>Level 2</button>
                <button className="start-btn" style={{background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'}} onClick={() => startGame('3')}>Level 3</button>
              </div>
            </div>
          )}

          {gameState === 'loading' && (
            <div className="menu-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={48} className="spin-animation" color="#10b981" />
              <h3 style={{ marginTop: '1rem', color: 'white' }}>Loading Questions...</h3>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="menu-overlay game-over">
              <ShieldAlert size={64} color="#ef4444" className="mb-4" />
              <h1>Game Over!</h1>
              <p className="final-score">Final Score: {score}</p>
              <button className="start-btn restart" onClick={() => startGame(difficulty)}>
                <RotateCcw size={24} />
                PLAY AGAIN
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <>
              {/* Math Panel (Appears every 10 seconds) */}
              {isWaitingForAnswer && (
                <div className="math-panel">
                  <div className="math-panel-header">Earn Bonus Carrots!</div>
                  <div className="math-question">{question.text}</div>
                  <div className="math-options">
                    {options.map((opt, i) => (
                      <button 
                        key={i} 
                        className="math-opt-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent jumping
                          handleAnswer(opt);
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Character */}
              <div className={`character ${isJumping ? 'jumping' : ''} ${isFalling ? 'falling' : ''} ${!isJumping && !isFalling ? 'running' : ''}`}>
                🐇
              </div>

              {/* Carrots */}
              {coins.map(coin => !coin.collected && (
                <div key={coin.id} className="carrot-item" style={{ left: `${coin.pos}%` }}>🥕</div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BunnyRun;
