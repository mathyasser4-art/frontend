import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import QuestionOverlay from '../../components/questionOverlay/QuestionOverlay';
import './HexGLGame.css';

const QUESTIONS_TO_UNLOCK = 5;

const HexGLGame = () => {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing', 'revive_locked', 'in_game_lock'
  const [difficulty, setDifficulty] = useState('0');
  const iframeUrl = "/hexgl/index.html";
  
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [questionsNeeded, setQuestionsNeeded] = useState(QUESTIONS_TO_UNLOCK);

  const fetchQuestion = useCallback(async () => {
    const q = generateArithmeticMcq(difficulty, 4);
    setQuestion({ text: q.text, answer: q.answer, options: q.options });
  }, [difficulty]);

  const startGame = async (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setSolvedCount(0);
    setQuestionsNeeded(QUESTIONS_TO_UNLOCK);
    setGameState('locked');
  };

  useEffect(() => {
    if (gameState === 'locked' || gameState === 'revive_locked' || gameState === 'in_game_lock') {
      fetchQuestion();
    }
  }, [gameState, fetchQuestion]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'hexgl_died') {
        setQuestionsNeeded(1); 
        setSolvedCount(0);
        setGameState('revive_locked');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 20-second dynamic Math Lock interval
  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'hexgl_pause' }, '*');
        }
        setQuestionsNeeded(1);
        setSolvedCount(0);
        setGameState('in_game_lock');
      }, 20000); // 20 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  const handleAnswer = (selectedAns) => {
    if (selectedAns === question.answer) {
      soundEffects.playCorrect();
      setFeedback('correct');
      setTimeout(() => {
        const newCount = solvedCount + 1;
        if (newCount >= questionsNeeded) {
          if (gameState === 'revive_locked') {
             if (iframeRef.current && iframeRef.current.contentWindow) {
                 iframeRef.current.contentWindow.postMessage({ type: 'hexgl_revive' }, '*');
             }
          } else if (gameState === 'in_game_lock') {
             if (iframeRef.current && iframeRef.current.contentWindow) {
                 iframeRef.current.contentWindow.postMessage({ type: 'hexgl_resume' }, '*');
             }
          }
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
        if (gameState === 'revive_locked') {
            // Failed revive -> let the game over screen show by resuming, or reload
            setGameState('playing'); 
        } else if (gameState === 'in_game_lock') {
            fetchQuestion();
        } else {
            fetchQuestion();
        }
        setFeedback(null);
      }, 1000);
    }
  };

  return (
    <div className="hexgl-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="hexgl-container">
        <div className="hexgl-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
        </div>

        {gameState === 'menu' && (
          <div className="hexgl-menu">
            <div className="game-badge">
              <Trophy size={48} color="#0ea5e9" />
            </div>
            <h1>HexGL 🚀</h1>
            <p>Solve math questions to unlock this futuristic 3D racing game!</p>
            <div className="unlock-info">
              <p>Solve <strong>{QUESTIONS_TO_UNLOCK} math questions</strong> to unlock the game. If you crash, answer another to revive!</p>
            </div>
            
            <div className="difficulty-selection">
              <button className="diff-card easy" onClick={() => startGame('0')}>
                <span className="lvl">Level 0</span>
                <span className="type">Beginner</span>
              </button>
              <button className="diff-card medium" onClick={() => startGame('1')}>
                <span className="lvl">Level 1</span>
                <span className="type">Explorer</span>
              </button>
              <button className="diff-card hard" onClick={() => startGame('2')}>
                <span className="lvl">Level 2</span>
                <span className="type">Adventurer</span>
              </button>
              <button className="diff-card expert" onClick={() => startGame('3')}>
                <span className="lvl">Level 3</span>
                <span className="type">Legend</span>
              </button>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'locked' || gameState === 'revive_locked' || gameState === 'in_game_lock') && (
          <div className="game-view-area">
            <iframe 
              ref={iframeRef}
              src={iframeUrl}
              className="hexgl-iframe"
              title="HexGL"
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />

            {/* Render QuestionOverlay for all locks since HexGL UI overlay is better than 8-bit text */}
            {(gameState === 'locked' || gameState === 'revive_locked' || gameState === 'in_game_lock') && question && (
              <QuestionOverlay 
                question={question}
                solvedCount={solvedCount}
                total={questionsNeeded}
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

export default HexGLGame;
