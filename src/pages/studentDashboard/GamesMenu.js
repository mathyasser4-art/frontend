import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Timer, Trophy, Zap } from 'lucide-react';
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
          <div className="game-card-premium" onClick={() => navigate('/student/games/jetski')}>
            <div className="card-image-wrapper">
              <img src="/img/games/jetski_cover.png" alt="Jet Ski Racing" className="card-bg-img" />
              <div className="card-overlay">
                <div className="overlay-content">
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Math Racer */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/math-racer')}>
            <div className="card-image-wrapper">
              <img src="/img/games/racer_cover.png" alt="Math Racer" className="card-bg-img" />
              <div className="card-overlay">
                <div className="overlay-content">
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Bunny Run */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/cave-runner')}>
            <div className="card-image-wrapper">
              <img src="/img/games/bunny_cover.png" alt="Bunny Run" className="card-bg-img" />
              <div className="card-overlay">
                <div className="overlay-content">
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Cartoon Airplanes */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/airplanes')}>
            <div className="card-image-wrapper">
              <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>✈️</div>
              <div className="card-overlay">
                <div className="overlay-content">
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Infinite Mario */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/super-mario')}>
            <div className="card-image-wrapper">
              <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #ef4444 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>🍄</div>
              <div className="card-overlay">
                <div className="overlay-content">
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Sudoku Master */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/sudoku')}>
            <div className="card-image-wrapper">
              <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>🧩</div>
              <div className="card-overlay">
                <div className="overlay-content">
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* KenKen Logic */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/kenken')}>
            <div className="card-image-wrapper">
              <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>🧮</div>
              <div className="card-overlay">
                <div className="overlay-content">
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GamesMenu;

