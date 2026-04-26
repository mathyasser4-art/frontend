import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Timer, Lock, Unlock } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import getGameQuestionsByLevel from '../../api/games/getGameQuestionsByLevel.api';
import './ArcheryGame.css';

const PLAY_TIME_SECONDS = 60;
const IFRAME_URL = "https://play.famobi.com/archery-world-tour";

const ArcheryGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing'
  const [difficulty, setDifficulty] = useState('easy');
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [question, setQuestion] = useState(null);
  const [customQuestions, setCustomQuestions] = useState(null);
  const [feedback, setFeedback] = useState(null);
  
  const timerRef = useRef(null);

  const fetchQuestion = useCallback(async () => {
    try {
      const qs = customQuestions || await getGameQuestionsByLevel(difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2);
      if (!customQuestions) setCustomQuestions(qs);
      
      if (qs && qs.length > 0) {
        const q = qs[Math.floor(Math.random() * qs.length)];
        
        let parsedAnswer = 0;
        if (q.typeOfAnswer === 'MCQ' && q.correctAnswer) parsedAnswer = parseInt(q.correctAnswer);
        else if (q.typeOfAnswer === 'Essay' && q.answer && q.answer.length > 0) parsedAnswer = parseInt(q.answer[0]);
        else if (q.correctAnswer !== undefined) parsedAnswer = parseInt(q.correctAnswer);
        else if (q.answer !== undefined) parsedAnswer = parseInt(Array.isArray(q.answer) ? q.answer[0] : q.answer);
        
        if (isNaN(parsedAnswer)) parsedAnswer = Math.floor(Math.random() * 20) + 1;

        let options = [parsedAnswer];
        let loopCount = 0;
        while(options.length < 4 && loopCount < 50) {
          loopCount++;
          const fake = parsedAnswer + Math.floor(Math.random() * 10) - 5;
          if (!options.includes(fake) && fake >= 0) options.push(fake);
        }
        while(options.length < 4) {
          options.push(Math.floor(Math.random() * 100));
        }
        options.sort(() => Math.random() - 0.5);
        
        setQuestion({ text: q.questionText || q.question || q.text || `${q.num1} ${q.op} ${q.num2} = ?`, answer: parsedAnswer, options });
      } else {
        generateFallbackQuestion();
      }
    } catch (error) {
      generateFallbackQuestion();
    }
  }, [difficulty, customQuestions]);

  const generateFallbackQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const ans = num1 + num2;
    let options = [ans];
    while(options.length < 4) {
      const fake = ans + Math.floor(Math.random() * 10) - 5;
      if (!options.includes(fake) && fake > 0) options.push(fake);
    }
    options.sort(() => Math.random() - 0.5);
    setQuestion({ text: `${num1} + ${num2} = ?`, answer: ans, options });
  };

  const startGame = async (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setGameState('locked'); // Lock immediately to require a question to start
    setCustomQuestions(null);
  };

  // Lock the game when entering 'locked' state and generate question
  useEffect(() => {
    if (gameState === 'locked') {
      fetchQuestion();
    }
  }, [gameState, fetchQuestion]);

  // Timer Countdown Logic
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameState('locked'); // Lock the game when timer hits 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const handleAnswer = (selectedAns) => {
    if (selectedAns === question.answer) {
      soundEffects.playCorrect();
      setFeedback('correct');
      setTimeout(() => {
        setGameState('playing');
        setTimeLeft(PLAY_TIME_SECONDS);
        setFeedback(null);
      }, 1000);
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <div className="archery-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="archery-container">
        
        {/* Header */}
        <div className="archery-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Arcade Menu</span>
          </button>
          
          {(gameState === 'playing' || gameState === 'locked') && (
            <div className={`timer-box ${timeLeft <= 10 && gameState === 'playing' ? 'warning' : ''}`}>
              <Timer size={24} />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {/* Main Menu */}
        {gameState === 'menu' && (
          <div className="archery-menu">
            <h1>Archery World Tour 🎯</h1>
            <p>Test your aim in this classic archery game!</p>
            <p style={{color: '#64748b', marginTop: '1rem'}}>
              <strong>How it works:</strong> You must solve a math question to unlock the game. Every correct answer gives you <strong>60 seconds</strong> of playtime!
            </p>
            
            <div className="difficulty-buttons">
              <button className="diff-btn easy" onClick={() => startGame('easy')} style={{background: '#4ade80', padding: '1rem 2rem', borderRadius: '16px', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'}}>
                Level 0
              </button>
              <button className="diff-btn medium" onClick={() => startGame('medium')} style={{background: '#fbbf24', padding: '1rem 2rem', borderRadius: '16px', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'}}>
                Level 1
              </button>
              <button className="diff-btn hard" onClick={() => startGame('hard')} style={{background: '#f87171', padding: '1rem 2rem', borderRadius: '16px', border: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'}}>
                Level 2
              </button>
            </div>
          </div>
        )}

        {/* Game Viewport */}
        {(gameState === 'playing' || gameState === 'locked') && (
          <div className="game-viewport">
            
            {/* The External Game via iframe */}
            <iframe 
              src={IFRAME_URL}
              className="archery-iframe"
              title="Archery World Tour"
              scrolling="no"
              allow="autoplay; fullscreen"
            />

            {/* The Math Lock Overlay */}
            {gameState === 'locked' && question && (
              <div className="math-lock-overlay">
                <div className="math-lock-content">
                  <Lock size={48} color="#f59e0b" style={{marginBottom: '1rem'}} />
                  <h2>Time's Up! Game Locked.</h2>
                  <p>Answer the question correctly to earn 60 more seconds of playtime!</p>
                  
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

export default ArcheryGame;
