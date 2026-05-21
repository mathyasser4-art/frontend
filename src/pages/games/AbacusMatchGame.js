import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCcw, Trophy, Star, Play } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import soundEffects from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import './AbacusMatchGame.css';

// Rod colors for visual aid (thousands: red, hundreds: orange, tens: green, ones: blue)
const ROD_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // reversed when rendering from left to right

const AbacusMatchGame = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Game state
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'won'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard', 'expert'
  const [rodCount, setRodCount] = useState(4);
  const [targetNumber, setTargetNumber] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  
  // Timer state
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Abacus beads state
  const [rods, setRods] = useState([]);
  const [shake, setShake] = useState(false);
  const [showFeedback, setShowFeedback] = useState(null); // 'correct', 'wrong', null

  // Create initial state for rods based on difficulty/rod count
  const createRods = (count) => {
    return Array(count).fill(null).map(() => ({
      topBeadActive: false,
      bottomBeadsActive: [false, false, false, false],
    }));
  };

  // Generate target number based on difficulty
  const generateTarget = (diff) => {
    switch (diff) {
      case 'easy': // Units: 1-9
        return Math.floor(Math.random() * 9) + 1;
      case 'medium': // Tens: 10-99
        return Math.floor(Math.random() * 90) + 10;
      case 'hard': // Hundreds: 100-999
        return Math.floor(Math.random() * 900) + 100;
      case 'expert': // Thousands: 1000-9999
        return Math.floor(Math.random() * 9000) + 1000;
      default:
        return Math.floor(Math.random() * 9) + 1;
    }
  };

  // Start the game
  const startGame = (level) => {
    soundEffects.playClick();
    const count = 4; // Always use 4 rods for a complete abacus layout across all levels

    setDifficulty(level);
    setRodCount(count);
    setGameState('playing');
    setScore(0);
    setRound(1);
    setMistakes(0);
    setSeconds(0);
    setTimerActive(true);
    
    const target = generateTarget(level);
    setTargetNumber(target);
    setRods(createRods(count));
    setCurrentValue(0);
    setShowFeedback(null);
  };

  // Timer Effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  // Calculate value dynamically when rods state changes
  useEffect(() => {
    let total = 0;
    rods.forEach((rod, i) => {
      let rodValue = 0;
      if (rod.topBeadActive) rodValue += 5;
      rodValue += rod.bottomBeadsActive.filter(isActive => isActive).length;
      total += rodValue * Math.pow(10, rods.length - 1 - i);
    });
    setCurrentValue(total);
  }, [rods]);

  const handleTopBeadClick = (rodIndex) => {
    soundEffects.playNumberClick();
    const newRods = JSON.parse(JSON.stringify(rods));
    newRods[rodIndex].topBeadActive = !newRods[rodIndex].topBeadActive;
    setRods(newRods);
  };

  const handleBottomBeadClick = (rodIndex, beadIndex) => {
    soundEffects.playNumberClick();
    const newRods = JSON.parse(JSON.stringify(rods));
    const isClickedBeadActive = newRods[rodIndex].bottomBeadsActive[beadIndex];
    for (let i = 0; i < 4; i++) {
      if (isClickedBeadActive) {
        if (i >= beadIndex) newRods[rodIndex].bottomBeadsActive[i] = false;
      } else {
        if (i <= beadIndex) newRods[rodIndex].bottomBeadsActive[i] = true;
      }
    }
    setRods(newRods);
  };

  const handleReset = () => {
    soundEffects.playClick();
    setRods(createRods(rodCount));
  };

  // Submit Answer validation
  const checkAnswer = () => {
    if (currentValue === targetNumber) {
      soundEffects.playCorrect();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
      
      setScore(s => s + 1);
      setShowFeedback('correct');

      setTimeout(() => {
        setShowFeedback(null);
        if (round >= 10) {
          setGameState('won');
          setTimerActive(false);
          soundEffects.playWinSound();
        } else {
          setRound(r => r + 1);
          const nextTarget = generateTarget(difficulty);
          setTargetNumber(nextTarget);
          setRods(createRods(rodCount));
          setCurrentValue(0);
        }
      }, 1500);
    } else {
      soundEffects.playWrong();
      setShake(true);
      setMistakes(m => m + 1);
      setShowFeedback('wrong');
      setTimeout(() => {
        setShake(false);
        setShowFeedback(null);
      }, 1000);
    }
  };

  // Format time (MM:SS)
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get color for bead depending on rod index (reversed so rightmost rod is units/blue)
  const getBeadColor = (rodIndex) => {
    const reversedIndex = rodCount - 1 - rodIndex;
    return ROD_COLORS[reversedIndex % ROD_COLORS.length];
  };



  return (
    <div className="abacus-game-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="game-wrapper-modern" ref={containerRef}>
        
        {/* DIFFICULTY MENU STATE */}
        {gameState === 'menu' && (
          <div className="menu-container-modern">
            <button onClick={() => navigate('/student/games-menu')} className="back-btn-top">
              <ArrowLeft size={20} /> Back to Games
            </button>
            <div className="menu-card-modern">
              <span className="game-emoji">🧮</span>
              <h1>Abacus Match Challenge</h1>
              <p>Train your brain! Represent the correct target number on the Soroban abacus.</p>
              
              <div className="difficulty-selection-grid">
                <button className="diff-card-modern easy" onClick={() => startGame('easy')}>
                  <h3>Easy (Units)</h3>
                  <p>Numbers 1 - 9 (1 Rod)</p>
                </button>
                
                <button className="diff-card-modern medium" onClick={() => startGame('medium')}>
                  <h3>Medium (Tens)</h3>
                  <p>Numbers 10 - 99 (2 Rods)</p>
                </button>
                
                <button className="diff-card-modern hard" onClick={() => startGame('hard')}>
                  <h3>Hard (Hundreds)</h3>
                  <p>Numbers 100 - 999 (3 Rods)</p>
                </button>
                
                <button className="diff-card-modern expert" onClick={() => startGame('expert')}>
                  <h3>Expert (Thousands)</h3>
                  <p>Numbers 1000 - 9999 (4 Rods)</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE GAMEPLAY STATE */}
        {gameState === 'playing' && (
          <div className="gameplay-container-modern">
            <div className="game-header-bar">
              <button onClick={() => { soundEffects.playClick(); setGameState('menu'); setTimerActive(false); }} className="exit-game-btn">
                <ArrowLeft size={18} /> Menu
              </button>
              
              <div className="game-stats-container">
                <div className="stat-pill">
                  <Star size={16} className="stat-icon-star" />
                  <span>Score: {score}/10</span>
                </div>
                <div className="stat-pill">
                  <span>Round: {round}/10</span>
                </div>
                <div className="stat-pill">
                  <span>Time: {formatTime(seconds)}</span>
                </div>
                <div className="stat-pill mistakes-pill">
                  <span>Mistakes: {mistakes}</span>
                </div>
              </div>
              <FullscreenButton targetRef={containerRef} />
            </div>

            <div className="game-arena">
              
              {/* Target Panel */}
              <div className="target-panel-modern">
                <h2>Represent this number:</h2>
                <div className="target-number-badge">
                  {targetNumber}
                </div>
              </div>

              {/* Interactive Abacus Card */}
              <div className={`abacus-board-card ${shake ? 'shake-abacus' : ''}`}>
                <div className="abacus-wooden-outer">
                  <div className="abacus-wooden-inner">
                    {/* Beam divider runs horizontally */}
                    <div className="abacus-beam-divider"></div>

                    {/* Rods and beads rendering */}
                    <div className="abacus-rods-container">
                      {rods.map((rod, rodIndex) => {
                        const beadColor = getBeadColor(rodIndex);
                        
                        return (
                          <div key={rodIndex} className="abacus-rod-column">
                            {/* Value helper label on top */}
                            <div className="rod-place-label">
                              {rodCount - 1 - rodIndex === 3 ? 'Th' :
                               rodCount - 1 - rodIndex === 2 ? 'H' :
                               rodCount - 1 - rodIndex === 1 ? 'T' : 'U'}
                            </div>

                            <div className="abacus-rod-wire">
                              {/* Upper Deck Bead (5-value) */}
                              <div className="upper-deck-container">
                                <div
                                  className={`abacus-bead ${rod.topBeadActive ? 'bead-active-down' : ''}`}
                                  style={{
                                    '--bead-color': beadColor,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleTopBeadClick(rodIndex)}
                                ></div>
                              </div>

                              {/* Divider spacer represents the horizontal beam */}
                              <div className="divider-gap"></div>

                              {/* Lower Deck Beads (4 beads, 1-value each) */}
                              <div className="lower-deck-container">
                                {rod.bottomBeadsActive.map((isActive, beadIndex) => (
                                  <div
                                    key={beadIndex}
                                    className={`abacus-bead ${isActive ? 'bead-active-up' : ''}`}
                                    style={{
                                      '--bead-color': beadColor,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleBottomBeadClick(rodIndex, beadIndex)}
                                  ></div>
                                ))}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Interactive Feedback banner */}
                {showFeedback && (
                  <div className={`feedback-overlay-banner ${showFeedback}`}>
                    {showFeedback === 'correct' ? '🎉 EXCELLENT! CORRECT!' : '❌ OOPS! TRY AGAIN'}
                  </div>
                )}
              </div>

              {/* Game Control Action Buttons */}
              <div className="game-action-row">
                <button onClick={handleReset} className="action-btn-modern secondary">
                  <RefreshCcw size={18} /> Reset Abacus
                </button>
                <button onClick={checkAnswer} className="action-btn-modern primary check-btn">
                  Check Answer 🚀
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VICTORY/WON STATE */}
        {gameState === 'won' && (
          <div className="won-container-modern">
            <div className="won-card-modern">
              <Trophy className="trophy-gold" size={72} />
              <h1>Challenge Completed!</h1>
              <p className="won-subtitle">You have completed all 10 rounds of {difficulty} level!</p>

              <div className="victory-stats-grid">
                <div className="victory-stat-box">
                  <span className="v-label">Final Score</span>
                  <span className="v-val">{score}/10</span>
                </div>
                <div className="victory-stat-box">
                  <span className="v-label">Total Time</span>
                  <span className="v-val">{formatTime(seconds)}</span>
                </div>
                <div className="victory-stat-box">
                  <span className="v-label">Total Mistakes</span>
                  <span className="v-val">{mistakes}</span>
                </div>
              </div>

              <div className="won-actions-row">
                <button onClick={() => startGame(difficulty)} className="btn-won-action primary">
                  <RefreshCcw size={18} /> Play Again
                </button>
                <button onClick={() => setGameState('menu')} className="btn-won-action secondary">
                  <Play size={18} /> Change Level
                </button>
                <button onClick={() => navigate('/student/games-menu')} className="btn-won-action exit">
                  Exit Room
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AbacusMatchGame;
