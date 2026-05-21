import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import './GamesMenu.css';

const GamesMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      <MobileNav role="Student" />
      <Navbar />
      
      <div className="games-menu-page">
        <div className="games-header">
          <button 
            onClick={() => navigate('/dashboard/student')} 
            className="back-button-modern"
          >
            <ArrowLeft size={24} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="menu-title">Adventure Games Room</h1>
          <p className="menu-subtitle">Play, Learn, and Conquer the Leaderboard!</p>
        </div>

        <div className="games-grid-premium">
          
          {/* Jet Ski Racing */}
          <div className="game-item-container" onClick={() => navigate('/student/games/jetski')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/jetski_cover.png" alt="Jet Ski Racing" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>Jet Ski Racing</h3>
                    <p>High speed aquatic math</p>
                    <button className="play-hover-btn">PLAY NOW</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">Jet Ski Racing</h3>
          </div>

          {/* Math Racer */}
          <div className="game-item-container" onClick={() => navigate('/student/games/math-racer')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/racer_cover.png" alt="Math Racer" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>Math Racer</h3>
                    <p>Turbo charged math action</p>
                    <button className="play-hover-btn">PLAY NOW</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">Math Racer</h3>
          </div>

          {/* Bunny Run */}
          <div className="game-item-container" onClick={() => navigate('/student/games/cave-runner')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/bunny_cover.png" alt="Bunny Run" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>Bunny Run</h3>
                    <p>Endless runner fun</p>
                    <button className="play-hover-btn">PLAY NOW</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">Bunny Run</h3>
          </div>

          {/* Maze Game */}
          <div className="game-item-container" onClick={() => navigate('/student/games/maze')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>🧩</div>
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>Maze Game</h3>
                    <p>Navigate and solve math to unlock doors</p>
                    <button className="play-hover-btn">PLAY NOW</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">Maze Game</h3>
          </div>

          {/* Cartoon Airplanes */}
          <div className="game-item-container" onClick={() => navigate('/student/games/airplanes')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>✈️</div>
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>Cartoon Airplanes</h3>
                    <p>Take to the skies</p>
                    <button className="play-hover-btn">PLAY NOW</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">Cartoon Airplanes</h3>
          </div>

          {/* Infinite Mario */}
          <div className="game-item-container" onClick={() => navigate('/student/games/super-mario')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #ef4444 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>🍄</div>
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>Infinite Mario</h3>
                    <p>Classic platforming</p>
                    <button className="play-hover-btn">PLAY NOW</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">Infinite Mario</h3>
          </div>

          {/* Sudoku Master */}
          <div className="game-item-container" onClick={() => navigate('/student/games/sudoku')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>🧩</div>
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>Sudoku Master</h3>
                    <p>Brain teasing puzzles</p>
                    <button className="play-hover-btn">PLAY NOW</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">Sudoku Master</h3>
          </div>

          {/* Abacus Match Challenge */}
          <div className="game-item-container" onClick={() => navigate('/student/games/abacus-match')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/abacus_match_cover.png" alt="Abacus Match" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>Abacus Match</h3>
                    <p>Soroban training challenge</p>
                    <button className="play-hover-btn">PLAY NOW</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">Abacus Match</h3>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GamesMenu;

