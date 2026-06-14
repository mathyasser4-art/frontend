import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import QuestionOverlay from '../../components/questionOverlay/QuestionOverlay';
import './MinigolfGame.css';

const MinigolfGame = () => {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'in_game_lock'
  const [difficulty, setDifficulty] = useState('0');
  const iframeUrl = "/minigolf/index.html";
  
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchQuestion = useCallback(async () => {
    const q = generateArithmeticMcq(difficulty, 4);
    setQuestion({ text: q.text, answer: q.answer, options: q.options });
  }, [difficulty]);

  const startGame = async (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'in_game_lock') {
      fetchQuestion();
    }
  }, [gameState, fetchQuestion]);

  // Handle answers from native postMessage (if supported)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'minigolf_level_complete') {
        // Trigger a question when a level is completed
        setGameState('in_game_lock');
      } else if (event.data && event.data.type === 'mario_answer') { // reuse answer format
        if (question && question.options) {
          const selectedAns = question.options[event.data.index];
          handleAnswer(selectedAns);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [question, gameState]);

  // Fallback: interval-based math lock (e.g. every 60 seconds) if level hooks are absent
  // But the requirement is "after every level then push". We will try to rely on messages first.
  // We can add an interval if we don't get 'level_complete' messages.
  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setGameState('in_game_lock');
      }, 45000); // 45 seconds as a fallback
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
        setGameState('playing');
        setFeedback(null);
      }, 1000);
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      setTimeout(() => {
        fetchQuestion();
        setFeedback(null);
      }, 1000);
    }
  };

  return (
    <div className="minigolf-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="minigolf-container">
        <div className="minigolf-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
        </div>

        {gameState === 'menu' && (
          <div className="minigolf-menu">
            <div className="game-badge">
              <Trophy size={48} color="#65a30d" />
            </div>
            <h1>Minigolf ⛳</h1>
            <p>Answer math questions between holes to play!</p>
            
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

        {(gameState === 'playing' || gameState === 'in_game_lock') && (
          <div className="game-view-area" ref={containerRef}>
            <FullscreenButton targetRef={containerRef} />
            <iframe 
              ref={iframeRef}
              src={iframeUrl}
              className="minigolf-iframe"
              title="Minigolf"
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />

            {gameState === 'in_game_lock' && question && (
              <QuestionOverlay 
                question={question}
                solvedCount={0}
                total={1}
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

export default MinigolfGame;
