import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import './WaterSortGame.css';

const QUESTIONS_TO_UNLOCK = 5;

const WaterSortGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing'
  const [difficulty, setDifficulty] = useState('0');
  const iframeUrl = "https://html5.gamedistribution.com/bba6ae893ed4493eb3553c93637db902/?gd_sdk_referrer_url=https%3A%2F%2Fabacusheroes.com";
  
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
    <div className="watersort-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="watersort-container">
        
        {/* Header */}
        <div className="watersort-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Fun Games Menu</span>
          </button>
        </div>

        {/* Main Menu */}
        {gameState === 'menu' && (
          <div className="watersort-menu">
            <h1>Water Sort Puzzle 🧪</h1>
            <p>Sort the colored water in the glasses until all colors are in the same glass!</p>
            <p style={{color: '#64748b', marginTop: '1rem'}}>
              <strong>How it works:</strong> You must solve <strong>5 math questions</strong> to unlock the game!
            </p>
            
            <div className="difficulty-buttons">
              <button className="diff-btn level-0" onClick={() => startGame('0')}>Level 0</button>
              <button className="diff-btn level-1" onClick={() => startGame('1')}>Level 1</button>
              <button className="diff-btn level-2" onClick={() => startGame('2')}>Level 2</button>
              <button className="diff-btn level-3" onClick={() => startGame('3')}>Level 3</button>
            </div>
          </div>
        )}

        {/* Game Viewport */}
        {(gameState === 'playing' || gameState === 'locked') && (
          <div className="game-viewport">
            
            {/* The External Game via iframe */}
            {gameState === 'playing' && (
              <iframe 
                src={iframeUrl}
                className="watersort-iframe"
                title="Water Sort Puzzle"
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="0"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
              />
            )}

            {/* The Math Lock Overlay */}
            {gameState === 'locked' && question && (
              <div className="math-lock-overlay">
                <div className="math-lock-content">
                  <Lock size={48} color="#f59e0b" style={{marginBottom: '1rem'}} />
                  <h2>Unlock the Game</h2>
                  <p>Answer <strong>{QUESTIONS_TO_UNLOCK - solvedCount} more</strong> questions correctly to unlock the game!</p>
                  
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${(solvedCount / QUESTIONS_TO_UNLOCK) * 100}%` }}></div>
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

export default WaterSortGame;
