import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import './MathCrosswordGame.css';

const MathCrosswordGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing'
  const [difficulty, setDifficulty] = useState('0');
  
  // Cleaner direct game URL
  const iframeUrl = "https://html5.gamemonetize.co/a1i482y6v6306j553655u9233636666/";
  
  const startGame = (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setGameState('playing');
  };

  return (
    <div className="crossword-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="crossword-container">
        <div className="crossword-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
        </div>

        {gameState === 'menu' && (
          <div className="crossword-menu">
            <div className="game-badge">
              <Trophy size={48} color="#fbbf24" />
            </div>
            <h1>Math Crossword 🧩</h1>
            <p>Challenge your brain with math puzzles!</p>
            
            <div className="difficulty-selection">
              <button className="diff-card easy" onClick={() => startGame('0')}>
                <span className="lvl">Level 0</span>
                <span className="type">Beginner</span>
              </button>
              <button className="diff-card medium" onClick={() => startGame('1')}>
                <span className="lvl">Level 1</span>
                <span className="type">Intermediate</span>
              </button>
              <button className="diff-card hard" onClick={() => startGame('2')}>
                <span className="lvl">Level 2</span>
                <span className="type">Expert</span>
              </button>
              <button className="diff-card expert" onClick={() => startGame('3')}>
                <span className="lvl">Level 3</span>
                <span className="type">Genius</span>
              </button>
            </div>

            <div className="game-features">
              <div className="feature">
                <span>🧠</span>
                <p>Logic Training</p>
              </div>
              <div className="feature">
                <span>⚡</span>
                <p>Speed Math</p>
              </div>
              <div className="feature">
                <span>🏆</span>
                <p>Daily Challenge</p>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="game-view-area">
            <iframe 
              src={iframeUrl}
              className="crossword-iframe"
              title="Math Crossword Puzzle"
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MathCrosswordGame;
