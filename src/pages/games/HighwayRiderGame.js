import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import './HighwayRiderGame.css';
import './ArcheryGame.css'; // Reuse the lock UI styles

const QUESTIONS_TO_UNLOCK = 3;
const IFRAME_URL = "https://play.famobi.com/highway-rider-extreme";

const HighwayRiderGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing'
  const [difficulty, setDifficulty] = useState('easy');
  
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [solvedCount, setSolvedCount] = useState(0);

  const fetchQuestion = useCallback(async () => {
    const q = generateArithmeticMcq(difficulty, 4);
    setQuestion({ text: q.text, answer: q.answer, options: q.options });
  }, [difficulty]);

  const startGame = async (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setSolvedCount(0);
    setGameState('locked'); // Lock immediately to require a question to start
  };

  // Lock the game when entering 'locked' state and generate question
  useEffect(() => {
    if (gameState === 'locked') {
      fetchQuestion();
    }
  }, [gameState, fetchQuestion]);

  const handleAnswer = (selectedAns) => {
    if (selectedAns === question.answer) {
      soundEffects.playCorrect();
      setFeedback('correct');
      setTimeout(() => {
        const newCount = solvedCount + 1;
        if (newCount >= QUESTIONS_TO_UNLOCK) {
          setGameState('playing');
          setSolvedCount(0);
        } else {
          setSolvedCount(newCount);
          fetchQuestion();
        }
        setFeedback(null);
      }, 1000);
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        fetchQuestion();
      }, 1000);
    }
  };

  return (
    <div className="highway-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="highway-container">
        
        {/* Header */}
        <div className="highway-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Arcade Menu</span>
          </button>
        </div>

        {/* Main Menu */}
        {gameState === 'menu' && (
          <div className="highway-menu">
            <h1>Highway Rider Extreme 🏍️</h1>
            <p>Put your helmet on and race down the highway in this super fast-paced game!</p>
            <p style={{color: '#64748b', marginTop: '1rem'}}>
              <strong>How it works:</strong> You must solve <strong>3 math questions</strong> to completely unlock the game and play forever!
            </p>
            
            <div className="difficulty-buttons">
              <button className="diff-btn easy" onClick={() => startGame('0')} style={{background: '#4ade80', padding: '1rem 2rem', borderRadius: '16px', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'}}>
                Level 0
              </button>
              <button className="diff-btn medium" onClick={() => startGame('1')} style={{background: '#fbbf24', padding: '1rem 2rem', borderRadius: '16px', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'}}>
                Level 1
              </button>
              <button className="diff-btn hard" onClick={() => startGame('2')} style={{background: '#f87171', padding: '1rem 2rem', borderRadius: '16px', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'}}>
                Level 2
              </button>
              <button className="diff-btn" onClick={() => startGame('3')} style={{background: '#4f46e5', padding: '1rem 2rem', borderRadius: '16px', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'}}>
                Level 3
              </button>
            </div>
          </div>
        )}

        {/* Game Viewport */}
        {(gameState === 'playing' || gameState === 'locked') && (
          <div className="game-viewport">
            
            {/* The External Game via iframe */}
            {gameState === 'playing' && (
              <iframe 
                src={IFRAME_URL}
                className="highway-iframe"
                title="Highway Rider Extreme"
                scrolling="no"
                allow="autoplay; fullscreen"
              />
            )}

            {/* The Math Lock Overlay */}
            {gameState === 'locked' && question && (
              <div className="math-lock-overlay">
                <div className="math-lock-content">
                  <Lock size={48} color="#f59e0b" style={{marginBottom: '1rem'}} />
                  <h2>Unlock the Game</h2>
                  <p>Answer <strong>{QUESTIONS_TO_UNLOCK - solvedCount} more</strong> questions correctly to permanently unlock the game!</p>
                  
                  <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '12px', width: '100%', marginBottom: '1rem', overflow: 'hidden' }}>
                    <div style={{ background: '#3b82f6', height: '100%', width: `${(solvedCount / QUESTIONS_TO_UNLOCK) * 100}%`, transition: 'width 0.3s ease' }}></div>
                  </div>
                  
                  <div className="lock-problem">{question.text}</div>
                  
                  <div className="lock-options">
                    {question.options.map((opt, i) => (
                      <button 
                        key={i} 
                        className="lock-option-btn"
                        onClick={() => handleAnswer(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className={`lock-feedback ${feedback || ''}`}>
                    {feedback === 'wrong' && "Oops! Try again."}
                    {feedback === 'correct' && "Correct! Unlocking..."}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default HighwayRiderGame;
