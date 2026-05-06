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
          
          {/* Jet Ski Racing - TOP 1 */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/jetski')}>
            <div className="card-image-wrapper">
              <div className="card-badge"><Zap size={14} fill="currentColor" /> FAST PACED</div>
              <img src="/img/games/jetski_cover.png" alt="Jet Ski Racing" className="card-bg-img" />
              <div className="card-overlay">
                <div className="overlay-content">
                  <div className="game-stats">
                    <span><Timer size={16} /> 5 MINS</span>
                    <span><Trophy size={16} /> RANKED</span>
                  </div>
                  <h3>Jet Ski Racing</h3>
                  <p>Master the waves and speed to victory. Unlock with 5 math questions!</p>
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Math Racer - TOP 2 */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/math-racer')}>
            <div className="card-image-wrapper">
              <div className="card-badge racer"><Zap size={14} fill="currentColor" /> TURBO</div>
              <img src="/img/games/racer_cover.png" alt="Math Racer" className="card-bg-img" />
              <div className="card-overlay">
                <div className="overlay-content">
                  <div className="game-stats">
                    <span><Timer size={16} /> 3 MINS</span>
                    <span><Trophy size={16} /> F1 GP</span>
                  </div>
                  <h3>Math Racer</h3>
                  <p>Race F1 cars against AI bots! Answer correctly for a fiery speed boost.</p>
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Bunny Run - TOP 3 */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/cave-runner')}>
            <div className="card-image-wrapper">
              <div className="card-badge bunny"><Zap size={14} fill="currentColor" /> ADVENTURE</div>
              <img src="/img/games/bunny_cover.png" alt="Bunny Run" className="card-bg-img" />
              <div className="card-overlay">
                <div className="overlay-content">
                  <div className="game-stats">
                    <span><Timer size={16} /> ENDLESS</span>
                    <span><Trophy size={16} /> ARCADE</span>
                  </div>
                  <h3>Bunny Run</h3>
                  <p>Hop & Harvest! Jump over rocks and fires to collect carrots.</p>
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Cartoon Airplanes - TOP 4 */}
          <div className="game-card-premium" onClick={() => navigate('/student/games/airplanes')}>
            <div className="card-image-wrapper">
              <div className="card-badge" style={{background: '#0ea5e9'}}><Zap size={14} fill="currentColor" /> PUZZLE</div>
              <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>✈️</div>
              <div className="card-overlay">
                <div className="overlay-content">
                  <div className="game-stats">
                    <span><Timer size={16} /> RELAXING</span>
                    <span><Trophy size={16} /> JIGSAW</span>
                  </div>
                  <h3>Cartoon Airplanes</h3>
                  <p>Solve beautiful airplane jigsaw puzzles. Unlock with 5 math questions!</p>
                  <button className="play-hover-btn">PLAY NOW</button>
                </div>
              </div>
            </div>
          </div>

          {/* Image Puzzle */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/image-puzzle')}>
            <div className="game-thumbnail thumb-image">
              <div className="piece">🧩</div>
              <div className="piece">🧩</div>
              <div className="piece">🧩</div>
              <div className="piece"></div>
            </div>
            <div className="game-card-body">
              <h3>Image Puzzle</h3>
              <p>Slide and arrange jigsaw puzzle pieces into the correct image!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>


          {/* Sudoku Master */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/sudoku')}>
            <div className="game-thumbnail" style={{ background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{fontSize: '4rem'}}>🧩</span>
            </div>
            <div className="game-card-body">
              <h3>Sudoku Master</h3>
              <p>Sharpen your focus and solve the logic grid!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* KenKen Logic */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/kenken')}>
            <div className="game-thumbnail" style={{ background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{fontSize: '4rem'}}>🧮</span>
            </div>
            <div className="game-card-body">
              <h3>KenKen Logic</h3>
              <p>Combine math operations and logic to fill the grid!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GamesMenu;

