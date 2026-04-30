import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import './PenaltyKick.css';

// Import images
import keeperImg from '../../img/football_keeper.png';
import ballImg from '../../img/football_ball.png';
import ArithmeticMcqDebugPanel from '../../components/debug/ArithmeticMcqDebugPanel';

// Sound effects
const audioCheer = new Audio('https://actions.google.com/sounds/v1/crowds/crowd_cheering.ogg');
const audioAww = new Audio('https://actions.google.com/sounds/v1/crowds/crowd_groan.ogg');
const audioWhistle = new Audio('https://actions.google.com/sounds/v1/sports/referee_whistle.ogg');

const ZONES = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

const PenaltyKick = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // menu, question, aiming, kicking, result
  const [difficulty, setDifficulty] = useState('0');
  const [question, setQuestion] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [keeperDive, setKeeperDive] = useState('');
  const [ballTarget, setBallTarget] = useState('');
  
  const [stats, setStats] = useState({ goals: 0, saves: 0 });

  const fetchQuestion = useCallback((level) => {
    const q = generateArithmeticMcq(level !== undefined ? level : difficulty, 4);
    setQuestion({ text: q.text, answer: q.answer, options: q.options });
  }, [difficulty]);

  const startGame = (level) => {
    setDifficulty(level);
    setGameState('question');
    fetchQuestion(level);
  };

  const handleAnswer = (selectedAns) => {
    const correct = selectedAns === question.answer;
    setIsAnswerCorrect(correct);
    setGameState('aiming');
    audioWhistle.play().catch(e => console.log('Audio play failed', e));
  };

  const handleKick = (zone) => {
    if (gameState !== 'aiming') return;
    
    setBallTarget(zone);
    setGameState('kicking');

    // Determine keeper dive based on answer
    let dive;
    if (isAnswerCorrect) {
      // Keeper jumps to a random WRONG zone
      const wrongZones = ZONES.filter(z => z !== zone);
      dive = wrongZones[Math.floor(Math.random() * wrongZones.length)];
    } else {
      // Keeper saves it! (Jumps to the EXACT zone)
      dive = zone;
    }
    setKeeperDive(dive);

    // Wait for animation to finish
    setTimeout(() => {
      setGameState('result');
      if (isAnswerCorrect) {
        audioCheer.play().catch(e => console.log('Audio play failed', e));
        setStats(prev => ({ ...prev, goals: prev.goals + 1 }));
      } else {
        audioAww.play().catch(e => console.log('Audio play failed', e));
        setStats(prev => ({ ...prev, saves: prev.saves + 1 }));
      }
      
      // Reset after a delay
      setTimeout(() => {
        setGameState('question');
        setBallTarget('');
        setKeeperDive('');
        setIsAnswerCorrect(null);
        fetchQuestion();
      }, 2500);
      
    }, 500); // 500ms kick animation
  };

  // Ball positioning logic based on zone
  const getBallStyle = () => {
    if (gameState === 'question' || gameState === 'aiming') {
      return { bottom: '5%', left: '50%' };
    }
    
    // Target positions
    const positions = {
      'top-left': { bottom: '50%', left: '20%' },
      'top-center': { bottom: '50%', left: '50%' },
      'top-right': { bottom: '50%', left: '80%' },
      'bottom-left': { bottom: '25%', left: '20%' },
      'bottom-center': { bottom: '25%', left: '50%' },
      'bottom-right': { bottom: '25%', left: '80%' }
    };
    
    return positions[ballTarget] || { bottom: '5%', left: '50%' };
  };

  return (
    <div className="penalty-page">
      <MobileNav role="Student" />
      <Navbar />
      <ArithmeticMcqDebugPanel />

      <div className="penalty-container">
        <div className="game-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={24} />
            <span>Fun Games Menu</span>
          </button>
          <div className="stats-bar">
            <div className="stat-pill goals">
              ⚽ Goals: {stats.goals}
            </div>
            <div className="stat-pill saves">
              🧤 Saves: {stats.saves}
            </div>
          </div>
        </div>

        <div className="game-area">
          
          {gameState === 'menu' && (
            <div className="math-overlay">
              <div className="question-box" style={{textAlign: 'center'}}>
                <h2>Penalty Kick</h2>
                <p style={{marginBottom: '2rem'}}>Select a difficulty level to start playing!</p>
                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
                  <button className="option-btn" style={{background: '#4ade80'}} onClick={() => startGame('0')}>Level 0</button>
                  <button className="option-btn" style={{background: '#fbbf24'}} onClick={() => startGame('1')}>Level 1</button>
                  <button className="option-btn" style={{background: '#f87171'}} onClick={() => startGame('2')}>Level 2</button>
                  <button className="option-btn" style={{background: '#4f46e5'}} onClick={() => startGame('3')}>Level 3</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Goal Net clickable zones */}
          <div className="goal-net">
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
            <img src={keeperImg} alt="Goalkeeper" />
          </div>

          {/* Ball */}
          <div 
            className={`ball ${gameState === 'kicking' || gameState === 'result' ? 'kicking' : ''}`} 
            style={getBallStyle()}
          >
            <img src={ballImg} alt="Football" />
          </div>

          {/* Result Feedback Overlay */}
          {gameState === 'result' && (
            <div className={`feedback-overlay ${isAnswerCorrect ? 'goal' : 'save'}`}>
              {isAnswerCorrect ? 'GOAL!!! 🥅' : 'SAVED! 🧤'}
            </div>
          )}

          {/* Math Question Overlay */}
          {gameState === 'question' && question && (
            <div className="math-overlay">
              <div className="question-box">
                <h2>{question.text}</h2>
                <div className="options-grid">
                  {question.options.map((opt, i) => (
                    <button 
                      key={i} 
                      className="option-btn"
                      onClick={() => handleAnswer(opt)}
                    >
                      {opt}
                    </button>
                  ))}
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
