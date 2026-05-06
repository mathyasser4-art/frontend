import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import QuestionOverlay from '../../components/questionOverlay/QuestionOverlay';
import './CartoonAirplanesGame.css';

const QUESTIONS_TO_UNLOCK = 5;

const CartoonAirplanesGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing'
  const [difficulty, setDifficulty] = useState('0');
  const iframeUrl = "https://html5.gamemonetize.co/g8ew6t2w53rvjhi59jy4sjfgejhfvakj/";
  
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
    <div className="airplanes-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="airplanes-container">
        <div className="airplanes-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
        </div>

        {gameState === 'menu' && (
          <div className="airplanes-menu">
            <div className="game-badge">
              <Trophy size={48} color="#fbbf24" />
            </div>
            <h1>Cartoon Airplanes Puzzle ✈️</h1>
            <p>Solve the math questions to unlock beautiful airplane jigsaw puzzles!</p>
            <div className="unlock-info">
              <p>Solve <strong>{QUESTIONS_TO_UNLOCK} math questions</strong> to unlock the puzzles!</p>
            </div>
            
            <div className="difficulty-selection">
              <button className="diff-card easy" onClick={() => startGame('0')}>
                <span className="lvl">Level 0</span>
                <span className="type">Junior Pilot</span>
              </button>
              <button className="diff-card medium" onClick={() => startGame('1')}>
                <span className="lvl">Level 1</span>
                <span className="type">Pro Aviator</span>
              </button>
              <button className="diff-card hard" onClick={() => startGame('2')}>
                <span className="lvl">Level 2</span>
                <span className="type">Sky Master</span>
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
                className="airplanes-iframe"
                title="Cartoon Airplanes"
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="0"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
              />
            )}

            {(gameState === 'locked') && question && (
              <QuestionOverlay 
                question={question}
                solvedCount={solvedCount}
                total={QUESTIONS_TO_UNLOCK}
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

export default CartoonAirplanesGame;
