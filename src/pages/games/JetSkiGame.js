import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import './JetSkiGame.css';

const QUESTIONS_TO_UNLOCK = 3;

const JetSkiGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing'
  const [difficulty, setDifficulty] = useState('0');
  const iframeUrl = "https://html5.gamemonetize.co/q1rhn9oouokiujejarumihyal58tpbp0/";
  
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
    setGameState('locked');
  };

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
    <div className="jetski-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="jetski-container">
        <div className="jetski-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
        </div>

        {gameState === 'menu' && (
          <div className="jetski-menu">
            <div className="game-badge">
              <Trophy size={48} color="#fbbf24" />
            </div>
            <h1>Jet Ski Racing 🌊</h1>
            <p>Master the waves and race your way to victory!</p>
            <div className="unlock-info">
              <p>Solve <strong>{QUESTIONS_TO_UNLOCK} math questions</strong> to unlock the race!</p>
            </div>
            
            <div className="difficulty-selection">
              <button className="diff-card easy" onClick={() => startGame('0')}>
                <span className="lvl">Level 0</span>
                <span className="type">Junior Racer</span>
              </button>
              <button className="diff-card medium" onClick={() => startGame('1')}>
                <span className="lvl">Level 1</span>
                <span className="type">Pro Driver</span>
              </button>
              <button className="diff-card hard" onClick={() => startGame('2')}>
                <span className="lvl">Level 2</span>
                <span className="type">Wave Master</span>
              </button>
              <button className="diff-card expert" onClick={() => startGame('3')}>
                <span className="lvl">Level 3</span>
                <span className="type">Legend</span>
              </button>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'locked') && (
          <div className="game-view-area">
            {gameState === 'playing' && (
              <iframe 
                src={iframeUrl}
                className="jetski-iframe"
                title="Jet Ski Racing"
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="0"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
              />
            )}

            {gameState === 'locked' && question && (
              <div className="jetski-lock-overlay">
                <div className="lock-card">
                  <div className="lock-icon">
                    <Lock size={40} />
                  </div>
                  <h3>Ready to Race?</h3>
                  <p>Solve to unlock: <strong>{QUESTIONS_TO_UNLOCK - solvedCount} remaining</strong></p>
                  
                  <div className="progress-bar-container">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(solvedCount / QUESTIONS_TO_UNLOCK) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="math-problem-box">{question.text}</div>
                  
                  <div className="math-options-grid">
                    {question.options.map((opt, i) => (
                      <button 
                        key={i} 
                        className="math-opt-button"
                        onClick={() => handleAnswer(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {feedback && (
                    <div className={`math-feedback ${feedback}`}>
                      {feedback === 'correct' ? "Excellent! Next one..." : "Oops! Let's try another one."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JetSkiGame;
