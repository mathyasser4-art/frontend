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
              <img src="/img/games/jetski_cover.jpg" alt="Jet Ski Racing" className="card-bg-img" />
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
              <img src="/img/games/racer_cover.jpg" alt="Math Racer" className="card-bg-img" />
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
              <img src="/img/games/bunny_cover.jpg" alt="Bunny Run" className="card-bg-img" />
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

          {/* Math Maze */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/maze')}>
            <div className="game-thumbnail thumb-maze">
              <div className="maze-lines"></div>
              <div className="player">🐿️</div>
              <div className="goal">🌰</div>
            </div>
            <div className="game-card-body">
              <h3>Math Maze</h3>
              <p>Navigate a massive maze and unlock doors by solving equations!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* Pattern Puzzle */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/pattern-puzzle')}>
            <div className="game-thumbnail thumb-pattern">
              <div className="block">2</div>
              <div className="block">4</div>
              <div className="block">6</div>
              <div className="block active">?</div>
            </div>
            <div className="game-card-body">
              <h3>Pattern Puzzle</h3>
              <p>Test your logical thinking by cracking sequences and number patterns.</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
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

          {/* Penalty Kick */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/penalty-kick')}>
            <div className="game-thumbnail thumb-penalty" style={{ background: '#4ade80', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '40%', border: '4px solid white', borderBottom: 'none' }}></div>
              <div style={{ fontSize: '3rem', zIndex: 2, marginBottom: '20px' }}>🧤</div>
              <div style={{ fontSize: '2rem', position: 'absolute', bottom: '10px' }}>⚽</div>
            </div>
            <div className="game-card-body">
              <h3>Penalty Kick</h3>
              <p>Answer math questions correctly to outsmart the goalkeeper and score goals!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* Battle Racing Stars Game */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/archery')}>
            <div className="game-thumbnail thumb-archery" style={{ background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{fontSize: '4rem'}}>🏎️</span>
            </div>
            <div className="game-card-body">
              <h3>Battle Racing Stars</h3>
              <p>Solve 5 math questions to earn playtime! Race against opponents!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* Highway Rider Extreme */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/highway-rider')}>
            <div className="game-thumbnail thumb-highway" style={{ background: 'url(https://games.famobi.com/asset/highway-rider-extreme/teaser) center/cover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            </div>
            <div className="game-card-body">
              <h3>Highway Rider Extreme</h3>
              <p>Solve 5 math questions to unlock the road! Fast-paced bike racing.</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* Water Sort Puzzle */}
          <div className="game-card-full legacy" onClick={() => navigate('/student/games/water-sort')}>
            <div className="game-thumbnail thumb-watersort" style={{ background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '5px' }}>
                <div style={{display: 'flex', gap: '10px'}}>
                    <span style={{fontSize: '2.5rem'}}>🧪</span>
                    <span style={{fontSize: '2.5rem'}}>🧪</span>
                </div>
                <div style={{width: '60px', height: '10px', background: '#3b82f6', borderRadius: '5px'}}></div>
            </div>
            <div className="game-card-body">
              <h3>Water Sort Puzzle</h3>
              <p>Solve 5 math questions to unlock! Sort colored liquids into glasses.</p>
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

