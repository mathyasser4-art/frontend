import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import QuestionOverlay from '../../components/questionOverlay/QuestionOverlay';
import './JetSkiGame.css';

const QUESTIONS_TO_UNLOCK = 5;
const MID_GAME_INTERVAL = 10000; // Trigger question every 10 seconds

const JetSkiGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing'
  const [difficulty, setDifficulty] = useState('0');
  const iframeUrl = "https://html5.gamemonetize.co/q1rhn9oouokiujejarumihyal58tpbp0/";
  
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [isMidGame, setIsMidGame] = useState(false);
  const midGameTimerRef = useRef(null);

  const fetchQuestion = useCallback(async () => {
    const q = generateArithmeticMcq(difficulty, 4);
    setQuestion({ text: q.text, answer: q.answer, options: q.options });
  }, [difficulty]);

  const startGame = async (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setSolvedCount(0);
    setIsMidGame(false);
    setGameState('locked');
  };

  // Timer Management
  useEffect(() => {
    if (gameState === 'locked') {
      fetchQuestion();
    }
    
    // Only run the timer if we are playing AND not currently in a mid-game challenge
    if (gameState === 'playing' && !isMidGame) {
      midGameTimerRef.current = setInterval(() => {
        setIsMidGame(true);
        setSolvedCount(0);
        fetchQuestion();
      }, MID_GAME_INTERVAL);
    }

    return () => {
      if (midGameTimerRef.current) {
        clearInterval(midGameTimerRef.current);
        midGameTimerRef.current = null;
      }
    };
  }, [gameState, isMidGame, fetchQuestion]);

  const handleAnswer = (selectedAns) => {
    if (selectedAns === question.answer) {
      soundEffects.playCorrect();
      setFeedback('correct');
      setTimeout(() => {
        const newCount = solvedCount + 1;
        const goal = isMidGame ? 1 : QUESTIONS_TO_UNLOCK;

        if (newCount >= goal) {
          if (isMidGame) {
            setIsMidGame(false); // This will trigger the useEffect to restart the timer
          } else {
            setGameState('playing');
          }
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
            {(gameState === 'playing') && (
              <iframe 
                src={iframeUrl}
                className={`jetski-iframe ${isMidGame ? 'hidden-game' : ''}`}
                title="Jet Ski Racing"
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="0"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
              />
            )}

            {(gameState === 'locked' || isMidGame) && question && (
              <QuestionOverlay 
                question={question}
                solvedCount={solvedCount}
                total={isMidGame ? 1 : QUESTIONS_TO_UNLOCK}
                onAnswer={handleAnswer}
                feedback={feedback}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JetSkiGame;
