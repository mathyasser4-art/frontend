import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import './GamesMenu.css';

const GamesMenu = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAuth = localStorage.getItem('O_authWEB');

  return (
    <div className="dashboard-layout">
      <MobileNav role="Student" />
      <Navbar />
      
      <div className={`games-menu-page ${!isAuth ? 'blurred-games-menu' : ''}`}>
        <div className="games-header">
          <button 
            onClick={() => navigate('/dashboard/student')} 
            className="back-button-modern"
          >
            <ArrowLeft size={24} />
            <span>{t('gamesMenu.backToDashboard', 'Back to Dashboard')}</span>
          </button>
          <h1 className="menu-title">{t('gamesMenu.title', 'Adventure Games Room')}</h1>
          <p className="menu-subtitle">{t('gamesMenu.subtitle', 'Play, Learn, and Conquer the Leaderboard!')}</p>
        </div>

        <div className="games-grid-premium">
          
          {/* Math Racer */}
          <div className="game-item-container" onClick={() => navigate('/student/games/math-racer')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/racer_cover.png" alt="Math Racer" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mathRacer', 'Math Racer')}</h3>
                    <p>{t('gamesMenu.mathRacerDesc', 'Turbo charged math action')}</p>
                    <button className="play-hover-btn">{t('gamesMenu.playNow', 'PLAY NOW')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.mathRacer', 'Math Racer')}</h3>
          </div>

          {/* Bunny Run */}
          <div className="game-item-container" onClick={() => navigate('/student/games/cave-runner')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/bunny_cover.png" alt="Bunny Run" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.bunnyRun', 'Bunny Run')}</h3>
                    <p>{t('gamesMenu.bunnyRunDesc', 'Endless runner fun')}</p>
                    <button className="play-hover-btn">{t('gamesMenu.playNow', 'PLAY NOW')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.bunnyRun', 'Bunny Run')}</h3>
          </div>

          {/* Super Mario */}
          <div className="game-item-container" onClick={() => navigate('/student/games/super-mario')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/mario_cover.png" alt="Super Mario" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.infiniteMario', 'Super Mario')}</h3>
                    <p>{t('gamesMenu.infiniteMarioDesc', 'Classic platforming & math blocks')}</p>
                    <button className="play-hover-btn">{t('gamesMenu.playNow', 'PLAY NOW')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.infiniteMario', 'Super Mario')}</h3>
          </div>

          {/* Maze Game */}
          <div className="game-item-container" onClick={() => navigate('/student/games/maze')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/maze_cover.png" alt="Maze Game" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mazeGame', 'Maze Game')}</h3>
                    <p>{t('gamesMenu.mazeGameDesc', 'Navigate and solve math to unlock doors')}</p>
                    <button className="play-hover-btn">{t('gamesMenu.playNow', 'PLAY NOW')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.mazeGame', 'Maze Game')}</h3>
          </div>

          {/* Sudoku Master */}
          <div className="game-item-container" onClick={() => navigate('/student/games/sudoku')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>🧩</div>
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.sudokuMaster', 'Sudoku Master')}</h3>
                    <p>{t('gamesMenu.sudokuMasterDesc', 'Brain teasing puzzles')}</p>
                    <button className="play-hover-btn">{t('gamesMenu.playNow', 'PLAY NOW')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.sudokuMaster', 'Sudoku Master')}</h3>
          </div>

          {/* Abacus Match Challenge */}
          <div className="game-item-container" onClick={() => navigate('/student/games/abacus-match')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/abacus_match_cover.png" alt="Abacus Match" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.abacusMatch', 'Abacus Match')}</h3>
                    <p>{t('gamesMenu.abacusMatchDesc', 'Soroban training challenge')}</p>
                    <button className="play-hover-btn">{t('gamesMenu.playNow', 'PLAY NOW')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.abacusMatch', 'Abacus Match')}</h3>
          </div>

          {/* Math Tanks */}
          <div className="game-item-container" onClick={() => navigate('/student/games/tanks')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <div className="card-bg-img" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7rem'}}>🚀</div>
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mathTanks', 'Math Tanks')}</h3>
                    <p>{t('gamesMenu.mathTanksDesc', 'Aim, solve, and blast rivals in the arena!')}</p>
                    <button className="play-hover-btn">{t('gamesMenu.playNow', 'PLAY NOW')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.mathTanks', 'Math Tanks')}</h3>
          </div>

          {/* Minigolf */}
          <div className="game-item-container" onClick={() => navigate('/student/games/minigolf')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/minigolf_cover.png" alt="Minigolf" className="card-bg-img" />
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.minigolf', 'Minigolf')}</h3>
                    <p>{t('gamesMenu.minigolfDesc', 'Putt your way through math challenges!')}</p>
                    <button className="play-hover-btn">{t('gamesMenu.playNow', 'PLAY NOW')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.minigolf', 'Minigolf')}</h3>
          </div>

        </div>
      </div>

      {!isAuth && (
        <div className="upgrade-overlay">
          <div className="upgrade-modal-card">
            <div className="upgrade-modal-header">
              <span className="lock-large-icon">🔒</span>
              <h2>{t('gamesMenu.upgradeTitle', 'Upgrade to Use')}</h2>
            </div>
            <p className="upgrade-modal-text">
              {t('gamesMenu.upgradeText', 'Public guests cannot access the Adventure Games Room. Subscribe to unlock all interactive educational games!')}
            </p>
            <div className="upgrade-modal-actions">
              <button className="upgrade-btn-primary" onClick={() => navigate('/pricing')}>
                {t('gamesMenu.viewPricing', 'View Pricing Plans')}
              </button>
              <button className="upgrade-btn-secondary" onClick={() => navigate('/auth/login')}>
                {t('gamesMenu.logIn', 'Log In')}
              </button>
              <button className="upgrade-btn-secondary" style={{ marginTop: '0.25rem' }} onClick={() => navigate('/')}>
                {t('gamesMenu.backToHome', 'Back to Home')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesMenu;

