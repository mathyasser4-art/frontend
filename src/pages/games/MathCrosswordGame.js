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
  const iframeUrl = "https://zapgames.io/math-crossword-puzzle-genius-edition";
  
  const startGame = () => {
    soundEffects.playClick();
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
            <h1>Math Crossword Puzzle 🧩</h1>
            <p>Challenge your brain with the Genius Edition of Math Crossword!</p>
            
            <div className="play-section">
              <button className="play-big-btn" onClick={startGame}>
                PLAY NOW
              </button>
            </div>

            <div className="game-features">
              <div className="feature">
                <span>🧠</span>
                <p>Genius Edition</p>
              </div>
              <div className="feature">
                <span>⚡</span>
                <p>Brain Training</p>
              </div>
              <div className="feature">
                <span>🏆</span>
                <p>Logic Master</p>
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
              scrolling="yes"
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
