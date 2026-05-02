import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, RotateCcw, Heart, ShieldAlert, Award } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';

import './CaveRunner.css';

// SVG Assets for high quality and no broken links
const BunnySVG = () => (
  <svg viewBox="0 0 100 100" className="bunny-svg">
    <ellipse cx="50" cy="65" rx="30" ry="25" fill="#f8fafc" />
    <circle cx="50" cy="35" r="20" fill="#f8fafc" />
    <ellipse cx="42" cy="15" rx="8" ry="18" fill="#f8fafc" transform="rotate(-10, 42, 15)" />
    <ellipse cx="58" cy="15" rx="8" ry="18" fill="#f8fafc" transform="rotate(10, 58, 15)" />
    <ellipse cx="42" cy="15" rx="4" ry="12" fill="#fda4af" transform="rotate(-10, 42, 15)" />
    <ellipse cx="58" cy="15" rx="4" ry="12" fill="#fda4af" transform="rotate(10, 58, 15)" />
    <circle cx="43" cy="32" r="3" fill="#1e293b" />
    <circle cx="57" cy="32" r="3" fill="#1e293b" />
    <circle cx="50" cy="40" r="4" fill="#fda4af" />
    <path d="M 45 65 Q 50 70 55 65" stroke="#cbd5e1" fill="none" strokeWidth="2" />
  </svg>
);

const CarrotSVG = () => (
  <svg viewBox="0 0 60 60" className="carrot-svg">
    <path d="M 30 10 L 45 50 Q 30 55 15 50 Z" fill="#fb923c" />
    <path d="M 30 10 C 25 0, 35 0, 30 10" fill="#4ade80" stroke="#22c55e" strokeWidth="2" />
    <path d="M 30 10 C 20 5, 25 5, 30 10" fill="#4ade80" stroke="#22c55e" strokeWidth="2" />
    <path d="M 30 10 C 35 5, 40 5, 30 10" fill="#4ade80" stroke="#22c55e" strokeWidth="2" />
    <path d="M 22 25 L 38 25" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
    <path d="M 25 35 L 35 35" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CrateSVG = () => (
  <svg viewBox="0 0 100 100" className="crate-svg">
    <rect x="5" y="5" width="90" height="90" fill="#78350f" rx="8" />
    <rect x="15" y="15" width="70" height="70" fill="#92400e" rx="4" />
    <path d="M 15 15 L 85 85 M 85 15 L 15 85" stroke="#78350f" strokeWidth="6" />
    <rect x="5" y="5" width="90" height="90" fill="none" stroke="#451a03" strokeWidth="4" rx="8" />
  </svg>
);

const BunnyRun = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [isJumping, setIsJumping] = useState(false);
  const isJumpingRef = useRef(false);
  const [isFalling, setIsFalling] = useState(false);
  const isFallingRef = useRef(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const isWaitingRef = useRef(false);
  const [obstaclePos, setObstaclePos] = useState(120); // percentage 120 to -GAP_WIDTH
  const OBSTACLE_TYPES = ['gap', 'rock', 'pine_tree', 'fire'];
  const [obstacleType, setObstacleType] = useState('gap'); // 'gap' or 'rock' or 'pine_tree' or 'fire'
  const [speed, setSpeed] = useState(1); // game speed

  const GAP_WIDTH = 20;
  
  // Timed Question State
  const timeSinceLastQuestionRef = useRef(0);
  const QUESTION_INTERVAL = 10000; // 10 seconds
  
  // Math Question State
  const [question, setQuestion] = useState({ num1: 0, num2: 0, op: '+' });
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
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

  const generateQuestion = (level = difficulty) => {
    const q = generateArithmeticMcq(level, 3);
    setQuestion({ text: q.text });
    setCorrectAnswer(q.answer);
    setOptions(q.options);
  };

  const startGame = async (selectedLevel) => {
    soundEffects.playClick();
    setDifficulty(selectedLevel);
    setGameState('playing');
    setScore(0);
    setLives(5);
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
    generateQuestion(selectedLevel);
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
    }, 700); // slightly faster jump for better feel
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
    generateQuestion(difficulty);
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
        } else {
          // Rock, Pine Tree, Fire is at newPos. Width is approx 5-10%.
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
                setObstacleType(OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]);
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
                {[...Array(5)].map((_, i) => (
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

        <div className={`game-area-premium ${isWaitingForAnswer ? 'frozen' : ''}`}>
          {/* Animated Background Layers */}
          <div className="sky-layer">
            <div className="sun-glow"></div>
            <div className="clouds-container">
              <div className="cloud-p p1"></div>
              <div className="cloud-p p2"></div>
              <div className="cloud-p p3"></div>
            </div>
          </div>
          
          <div className="mountains-container">
            <div className="mountain-p far"></div>
            <div className="mountain-p mid"></div>
          </div>

          <div className="ground-world">
            <div className="ground-surface">
              {obstacleType === 'gap' ? (
                <>
                  <div className="surface-part" style={{ width: `${obstaclePos}%` }}></div>
                  <div className="surface-gap" style={{ width: `${GAP_WIDTH}%` }}></div>
                  <div className="surface-part" style={{ flex: 1 }}></div>
                </>
              ) : (
                <div className="surface-part full"></div>
              )}
            </div>

            {obstacleType === 'rock' && (
              <div className="obstacle-node" style={{ left: `${obstaclePos}%` }}>
                <CrateSVG />
              </div>
            )}

            {coins.map(coin => !coin.collected && (
              <div key={coin.id} className="collectible-node" style={{ left: `${coin.pos}%` }}>
                <CarrotSVG />
              </div>
            ))}
          </div>

          {gameState === 'playing' && (
            <div className={`bunny-node ${isJumping ? 'jumping' : ''} ${isFalling ? 'falling' : ''} ${!isJumping && !isFalling ? 'running' : ''}`}>
              <BunnySVG />
            </div>
          )}

          {isWaitingForAnswer && (
            <div className="math-overlay-modern">
              <div className="math-card">
                <div className="math-title">Quick Solve!</div>
                <div className="math-q">{question.text}</div>
                <div className="math-opts">
                  {options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gameState === 'menu' && (
            <div className="game-overlay-screen">
              <div className="menu-inner">
                <div className="game-logo">BUNNY RUN</div>
                <p>Jump over crates and gaps. Collect carrots for points!</p>
                <div className="diff-select">
                  <button className="lvl-btn l0" onClick={() => startGame('0')}>Level 0</button>
                  <button className="lvl-btn l1" onClick={() => startGame('1')}>Level 1</button>
                  <button className="lvl-btn l2" onClick={() => startGame('2')}>Level 2</button>
                  <button className="lvl-btn l3" onClick={() => startGame('3')}>Level 3</button>
                </div>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="game-overlay-screen">
              <div className="menu-inner">
                <ShieldAlert size={80} color="#ef4444" />
                <h2>CRASHED!</h2>
                <p className="final-s">Final Score: {score}</p>
                <button className="retry-btn" onClick={() => startGame(difficulty)}>
                  <RotateCcw /> PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BunnyRun;

