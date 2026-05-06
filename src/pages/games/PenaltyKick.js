import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import './PenaltyKick.css';

// Images
import keeperImg from '../../img/football_keeper.png';
import ballImg from '../../img/football_ball.png';
import playerImg from '../../img/player.png';

// Sounds
const audioCheer = new Audio('https://actions.google.com/sounds/v1/crowds/crowd_cheering.ogg');
const audioAww = new Audio('https://actions.google.com/sounds/v1/crowds/crowd_groan.ogg');
const audioWhistle = new Audio('https://actions.google.com/sounds/v1/sports/referee_whistle.ogg');
const kickSound = new Audio('https://actions.google.com/sounds/v1/sports/football_kick.ogg');

const ZONES = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

const PenaltyKick = () => {
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('menu');
  const [difficulty, setDifficulty] = useState('0');
  const [question, setQuestion] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);

  const [keeperDive, setKeeperDive] = useState('');
  const [ballTarget, setBallTarget] = useState('');

  const [stats, setStats] = useState({ goals: 0, saves: 0 });
  const [streak, setStreak] = useState(0);

  // 🔥 Power system
  const [power, setPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);

  // =============================
  // Generate Question
  // =============================
  const fetchQuestion = useCallback((level) => {
    const q = generateArithmeticMcq(level !== undefined ? level : difficulty, 4);
    setQuestion({ text: q.text, answer: q.answer, options: q.options });
  }, [difficulty]);

  // =============================
  // Start Game
  // =============================
  const startGame = (level) => {
    setDifficulty(level);
    setGameState('question');
    fetchQuestion(level);
  };

  // =============================
  // Handle Answer
  // =============================
  const handleAnswer = (selectedAns) => {
    const correct = selectedAns === question.answer;
    setIsAnswerCorrect(correct);
    setGameState('aiming');
    audioWhistle.play();
  };

  // =============================
  // Power Charging
  // =============================
  useEffect(() => {
    let interval;

    if (isCharging) {
      interval = setInterval(() => {
        setPower(prev => {
          if (prev >= 100) return 0;
          return prev + 5;
        });
      }, 50);
    }

    return () => clearInterval(interval);
  }, [isCharging]);

  // =============================
  // Kick Logic
  // =============================
  const handleKick = (zone) => {
    if (gameState !== 'aiming') return;

    setIsCharging(false);
    setBallTarget(zone);
    setGameState('kicking');
    kickSound.play();

    const reactionSpeed = {
      '0': 900,
      '1': 700,
      '2': 500,
      '3': 300
    };

    const successChance = isAnswerCorrect ? (power / 100) : 0.2;
    const isGoal = Math.random() < successChance;

    setTimeout(() => {
      let dive;

      if (isGoal) {
        const wrongZones = ZONES.filter(z => z !== zone);
        dive = wrongZones[Math.floor(Math.random() * wrongZones.length)];
      } else {
        dive = zone;
      }

      setKeeperDive(dive);
    }, reactionSpeed[difficulty]);

    setTimeout(() => {
      setGameState('result');

      if (isGoal) {
        audioCheer.play();
        setStats(prev => ({ ...prev, goals: prev.goals + 1 }));
        setStreak(prev => prev + 1);
      } else {
        audioAww.play();
        setStats(prev => ({ ...prev, saves: prev.saves + 1 }));
        setStreak(0);
      }

      // Reset
      setTimeout(() => {
        setGameState('question');
        setBallTarget('');
        setKeeperDive('');
        setPower(0);
        setIsAnswerCorrect(null);
        fetchQuestion();
      }, 2500);

    }, 700);
  };

  // =============================
  // Ball Movement (Curve + Depth)
  // =============================
  const getBallStyle = () => {
    const curve = power > 70 ? 30 : 0;

    const positions = {
      'top-left': { bottom: '50%', left: `calc(20% - ${curve}px)` },
      'top-center': { bottom: '50%', left: '50%' },
      'top-right': { bottom: '50%', left: `calc(80% + ${curve}px)` },
      'bottom-left': { bottom: '25%', left: `calc(20% - ${curve}px)` },
      'bottom-center': { bottom: '25%', left: '50%' },
      'bottom-right': { bottom: '25%', left: `calc(80% + ${curve}px)` }
    };

    return positions[ballTarget] || { bottom: '5%', left: '50%' };
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="penalty-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="penalty-container">

        {/* HEADER */}
        <div className="game-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={24} />
            <span>Fun Games Menu</span>
          </button>

          <div className="stats-bar">
            <div className="stat-pill goals">⚽ {stats.goals}</div>
            <div className="stat-pill saves">🧤 {stats.saves}</div>
            <div className="stat-pill">🔥 {streak}</div>
          </div>
        </div>

        {/* GAME AREA */}
        <div className="game-area">
          <div className="grass-field" />

          {/* Player */}
          <div className="player">
            <img src={playerImg} alt="player" />
          </div>

          {/* Goal */}
          <div className="goal-net">
            <div className="goal-net-texture" />
            {ZONES.map(zone => (
              <div
                key={zone}
                className={`target-zone ${gameState === 'aiming' ? 'active' : ''}`}
                onClick={() => handleKick(zone)}
              />
            ))}
          </div>

          {/* Keeper */}
          <div className={`keeper ${keeperDive ? `dive-${keeperDive}` : ''}`}>
            <img src={keeperImg} alt="keeper" />
          </div>

          {/* Ball */}
          <div className={`ball ${gameState === 'kicking' ? 'kicking' : ''}`}>
            <img src={ballImg} alt="ball" />
          </div>

          {/* POWER BAR */}
          {gameState === 'aiming' && (
            <div className="power-bar-container">
              <div className="power-bar">
                <div className="power-fill" style={{ width: `${power}%` }} />
              </div>

              <button
                className="shoot-btn"
                onMouseDown={() => setIsCharging(true)}
                onMouseUp={() => setIsCharging(false)}
              >
                HOLD & RELEASE
              </button>
            </div>
          )}

          {/* RESULT */}
          {gameState === 'result' && (
            <div className="feedback-overlay">
              {streak > 2 ? "🔥 AMAZING!" : ""}
            </div>
          )}

          {/* QUESTION */}
          {gameState === 'question' && question && (
            <div className="math-overlay">
              <div className="question-box">
                <h2>{question.text}</h2>

                <div className="options-grid">
                  {question.options.map((opt, i) => (
                    <button key={i} className="option-btn" onClick={() => handleAnswer(opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MENU */}
          {gameState === 'menu' && (
            <div className="math-overlay">
              <div className="question-box">
                <h2>Penalty Kick</h2>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="option-btn" onClick={() => startGame('0')}>Easy</button>
                  <button className="option-btn" onClick={() => startGame('1')}>Medium</button>
                  <button className="option-btn" onClick={() => startGame('2')}>Hard</button>
                  <button className="option-btn" onClick={() => startGame('3')}>Pro</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PenaltyKick;