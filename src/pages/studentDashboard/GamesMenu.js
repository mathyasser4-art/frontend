import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
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
            className="back-button" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '1.2rem' }}
          >
            <ArrowLeft size={24} />
            Back
          </button>
          <h1>Fun Games Room</h1>
        </div>

        <div className="games-grid">
          
          {/* Bunny Run */}
          <div className="game-card-full" onClick={() => navigate('/student/games/cave-runner')}>
            <div className="game-thumbnail thumb-bunny">
              <div className="sun"></div>
              <div className="ground"></div>
              <div className="character">🐇</div>
              <div className="carrot">🥕</div>
            </div>
            <div className="game-card-body">
              <h3>Bunny Run</h3>
              <p>Jump over obstacles and collect carrots while solving quick math problems!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* Math Racer */}
          <div className="game-card-full" onClick={() => navigate('/student/games/math-racer')}>
            <div className="game-thumbnail thumb-racer">
              <div className="lines"></div>
              <div className="car1">🏎️</div>
              <div className="car2" style={{filter: 'hue-rotate(90deg)'}}>🏎️</div>
              <div className="finish"></div>
            </div>
            <div className="game-card-body">
              <h3>Math Racer</h3>
              <p>Race your Formula 1 car against AI bots! Answer correctly to trigger your fiery boost.</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* Math Maze */}
          <div className="game-card-full" onClick={() => navigate('/student/games/maze')}>
            <div className="game-thumbnail thumb-maze">
              <div className="maze-lines"></div>
              <div className="player">🐿️</div>
              <div className="goal">🌰</div>
            </div>
            <div className="game-card-body">
              <h3>Math Maze</h3>
              <p>Navigate a massive, procedurally generated maze and unlock doors by solving equations!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* Pattern Puzzle */}
          <div className="game-card-full" onClick={() => navigate('/student/games/pattern-puzzle')}>
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
          <div className="game-card-full" onClick={() => navigate('/student/games/image-puzzle')}>
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
          <div className="game-card-full" onClick={() => navigate('/student/games/penalty-kick')}>
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
          <div className="game-card-full" onClick={() => navigate('/student/games/archery')}>
            <div className="game-thumbnail thumb-archery" style={{ background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{fontSize: '4rem'}}>🏎️</span>
            </div>
            <div className="game-card-body">
              <h3>Battle Racing Stars</h3>
              <p>Solve math questions to earn playtime! Race against opponents in this fun multiplayer game!</p>
              <button className="play-now-btn">
                <Play size={20} fill="currentColor" /> Play Now
              </button>
            </div>
          </div>

          {/* Highway Rider Extreme */}
          <div className="game-card-full" onClick={() => navigate('/student/games/highway-rider')}>
            <div className="game-thumbnail thumb-highway" style={{ background: 'url(https://games.famobi.com/asset/highway-rider-extreme/teaser) center/cover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            </div>
            <div className="game-card-body">
              <h3>Highway Rider Extreme</h3>
              <p>Solve 3 math questions to unlock the road! Put on a helmet and race down the highway.</p>
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
