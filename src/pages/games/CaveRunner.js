import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, RotateCcw, Heart, ShieldAlert, Award, Sun } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';

import './CaveRunner.css';

// Profile-facing Bunny SVG (Facing Right)
const BunnySVG = () => (
  <svg viewBox="0 0 100 100" className="bunny-svg">
    {/* Body */}
    <ellipse cx="45" cy="70" rx="35" ry="22" fill="#f8fafc" />
    {/* Tail */}
    <circle cx="12" cy="70" r="8" fill="#f1f5f9" />
    {/* Head */}
    <circle cx="70" cy="50" r="20" fill="#f8fafc" />
    {/* Ears */}
    <ellipse cx="65" cy="25" rx="7" ry="20" fill="#f8fafc" transform="rotate(-5, 65, 25)" />
    <ellipse cx="75" cy="25" rx="7" ry="20" fill="#f8fafc" transform="rotate(5, 75, 25)" />
    <ellipse cx="65" cy="25" rx="3" ry="12" fill="#fda4af" transform="rotate(-5, 65, 25)" />
    <ellipse cx="75" cy="25" rx="3" ry="12" fill="#fda4af" transform="rotate(5, 75, 25)" />
    {/* Eye */}
    <circle cx="80" cy="45" r="3" fill="#1e293b" />
    {/* Nose */}
    <circle cx="88" cy="52" r="3" fill="#fda4af" />
    {/* Paws */}
    <ellipse cx="40" cy="88" rx="8" ry="4" fill="#f1f5f9" />
    <ellipse cx="65" cy="88" rx="8" ry="4" fill="#f1f5f9" />
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

  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [isJumping, setIsJumping] = useState(false);
  const isJumpingRef = useRef(false);
  const [isFalling, setIsFalling] = useState(false);
  const isFallingRef = useRef(false);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const isWaitingRef = useRef(false);
  const [obstaclePos, setObstaclePos] = useState(120);
  const OBSTACLE_TYPES = ['gap', 'rock'];
  const [obstacleType, setObstacleType] = useState('gap');
  const [speed, setSpeed] = useState(0.8);

  const GAP_WIDTH = 25;
  const timeSinceLastQuestionRef = useRef(0);
  const QUESTION_INTERVAL = 9000;
  
  const [question, setQuestion] = useState({ text: '' });
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [difficulty, setDifficulty] = useState('0');

  const [coins, setCoins] = useState([]);
  const nextCoinId = useRef(0);
  const gameLoopRef = useRef(null);

  const spawnCoins = useCallback(() => {
    const newCoins = [];
    const basePos = 100 + Math.random() * 20;
    for (let i = 0; i < 3; i++) {
      newCoins.push({
        id: nextCoinId.current++,
        pos: basePos + (i * 12),
        collected: false
      });
    }
    setCoins(newCoins);
  }, []);

  const generateQuestion = (level = difficulty) => {
    const q = generateArithmeticMcq(level, 4);
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
    setSpeed(0.8); // Start slower
    setObstaclePos(150);
    setObstacleType('rock');
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
    }, 700);
  }, [gameState]);

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
      soundEffects.playCorrect();
      setScore(s => s + 50);
      setSpeed(s => Math.min(s + 0.1, 3.2)); // Increase speed gradually
      jump();
    } else {
      soundEffects.playWrong();
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) handleGameOver();
        return newLives;
      });
    }

    setIsWaitingForAnswer(false);
    isWaitingRef.current = false;
    timeSinceLastQuestionRef.current = 0;
    generateQuestion(difficulty);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();

    const loop = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (!isWaitingRef.current && !isFallingRef.current) {
        timeSinceLastQuestionRef.current += deltaTime;

        if (timeSinceLastQuestionRef.current >= QUESTION_INTERVAL) {
          setIsWaitingForAnswer(true);
          isWaitingRef.current = true;
        }
      }

      setObstaclePos(pos => {
        if (isWaitingRef.current || isFallingRef.current) return pos;

        let newPos = pos - (speed * (deltaTime / 16));
        
        // Accurate Collision Detection
        // Bunny center is at ~20%. Bounding box is ~15% to 25%.
        let hitObstacle = false;
        if (obstacleType === 'gap') {
          // If bunny center (20%) is over a gap. Gap starts at pos and ends at pos + GAP_WIDTH.
          if (newPos <= 22 && (newPos + GAP_WIDTH) >= 28 && !isJumpingRef.current) {
            hitObstacle = true;
          }
        } else {
          // If bunny (15-25%) hits rock (pos to pos+8%).
          if (newPos <= 26 && (newPos + 8) >= 14 && !isJumpingRef.current) {
            hitObstacle = true;
          }
        }

        if (hitObstacle) {
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
                setObstaclePos(120);
                setObstacleType(Math.random() > 0.4 ? 'rock' : 'gap');
                spawnCoins();
              }
              return newLives;
            });
          }, 600);
          
          return pos;
        }
        
        if (newPos < -GAP_WIDTH) {
           newPos = 120 + Math.random() * 40;
           setObstacleType(Math.random() > 0.4 ? 'rock' : 'gap');
           spawnCoins();
        }
        
        return newPos;
      });

      setCoins(prevCoins => {
        if (isWaitingRef.current || isFallingRef.current) return prevCoins;
        
        return prevCoins.map(c => {
          if (c.collected) return c;
          const newCoinPos = c.pos - (speed * (deltaTime / 16));
          if (newCoinPos <= 25 && newCoinPos >= 15 && !isFallingRef.current) {
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
          {/* Sunny Background Layers */}
          <div className="sky-layer sunny">
            <div className="sun-bright">
              <Sun size={120} color="#fbbf24" strokeWidth={3} />
            </div>
            <div className="sun-glow-bright"></div>
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


