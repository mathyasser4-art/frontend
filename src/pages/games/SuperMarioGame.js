import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import QuestionOverlay from '../../components/questionOverlay/QuestionOverlay';
import './SuperMarioGame.css';

const QUESTIONS_TO_UNLOCK = 5;

const SuperMarioGame = () => {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing', 'revive_locked', 'in_game_lock'
  const [difficulty, setDifficulty] = useState('0');
  const iframeUrl = "/mario/index.html";
  
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

  // Sync question to iframe for native rendering
  useEffect(() => {
    if ((gameState === 'in_game_lock' || gameState === 'revive_locked') && question) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ 
          type: 'mario_show_question', 
          question: question.text,
          options: question.options.map((opt, i) => `${i+1}) ${opt}`)
        }, '*');
      }
    }
  }, [gameState, question]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'mario_died') {
        setQuestionsNeeded(1); 
        setSolvedCount(0);
        setGameState('revive_locked');
      } else if (event.data && event.data.type === 'mario_answer') {
        // Handle native answer input
        if (question && question.options) {
          const selectedAns = question.options[event.data.index];
          handleAnswer(selectedAns);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [question, gameState]);

  // 20-second dynamic Math Lock interval
  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
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
          if (iframeRef.current && iframeRef.current.contentWindow) {
              iframeRef.current.contentWindow.postMessage({ type: 'mario_hide_question' }, '*');
          }
          if (gameState === 'revive_locked') {
             if (iframeRef.current && iframeRef.current.contentWindow) {
                 iframeRef.current.contentWindow.postMessage({ type: 'mario_revive' }, '*');
             }
          } else if (gameState === 'in_game_lock') {
             if (iframeRef.current && iframeRef.current.contentWindow) {
                 iframeRef.current.contentWindow.postMessage({ type: 'mario_resume' }, '*');
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
      if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'mario_wrong_answer' }, '*');
      }
      setTimeout(() => {
        if (gameState === 'revive_locked') {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({ type: 'mario_hide_question' }, '*');
                iframeRef.current.contentWindow.postMessage({ type: 'mario_die_for_real' }, '*');
            }
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
    <div className="super-mario-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="super-mario-container">
        <div className="super-mario-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
        </div>

        {gameState === 'menu' && (
          <div className="super-mario-menu">
            <div className="game-badge">
              <Trophy size={48} color="#fbbf24" />
            </div>
            <h1>Super Mario Bros 🍄</h1>
            <p>Solve math questions to unlock this classic adventure!</p>
            <div className="unlock-info">
              <p>Solve <strong>{QUESTIONS_TO_UNLOCK} math questions</strong> to unlock the game. If you die, answer another to revive!</p>
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
          <div className="game-view-area" ref={containerRef}>
            <FullscreenButton targetRef={containerRef} />
            <iframe 
              ref={iframeRef}
              src={iframeUrl}
              className="super-mario-iframe"
              title="Super Mario Bros"
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />

            {/* ONLY render QuestionOverlay for the initial 5 questions */}
            {gameState === 'locked' && question && (
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

export default SuperMarioGame;
