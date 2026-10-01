import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import './GamesMenu.css';
import { safeLocalStorage } from '../../utils/safeStorage';
import { hasFullAccess } from '../../utils/trialAccess';
import soundEffects from '../../utils/soundEffects';

const GamesMenu = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const isAuth = safeLocalStorage.getItem('O_authWEB') || hasFullAccess();
  const [lockedGameModal, setLockedGameModal] = useState(null);

  const handleGameSelect = (path, title, imgCover) => {
    soundEffects.playClick();
    // Math racer is unlocked for everyone!
    if (path === '/student/games/math-racer' || isAuth) {
      navigate(path);
    } else {
      setLockedGameModal({ title, imgCover });
    }
  };

  return (
    <div className="dashboard-layout" dir={isArabic ? 'rtl' : 'ltr'}>
      <MobileNav role="Student" />
      <Navbar />
      
      <div className="games-menu-page">
        <div className="games-header">
          <button 
            onClick={() => navigate(isAuth ? '/dashboard/student' : '/')} 
            className="back-button-modern"
          >
            <ArrowLeft size={24} style={{ transform: isArabic ? 'scaleX(-1)' : 'none' }} />
            <span>{isAuth ? t('gamesMenu.backToDashboard', 'Back to Dashboard') : (isArabic ? 'العودة للرئيسية' : 'Back to Home')}</span>
          </button>
          <h1 className="menu-title">{t('gamesMenu.title', 'Adventure Games Room')}</h1>
          <p className="menu-subtitle">
            {isAuth 
              ? t('gamesMenu.subtitle', 'Play, Learn, and Conquer the Leaderboard!')
              : (isArabic 
                  ? '🏎️ سباق الرياضيات متاح مجاناً للجميع! اشترك لتجربة باقي الألعاب' 
                  : '🏎️ Math Racer is 100% Free for Everyone! Subscribe to unlock all games')}
          </p>
        </div>

        <div className="games-grid-premium">
          
          {/* Math Racer - 100% FREE FOR UNLOGGED USERS */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/math-racer', t('gamesMenu.mathRacer', 'Math Racer'), '/img/games/racer_cover.png')}>
            <div className="game-card-premium free-game-card">
              <div className="card-image-wrapper">
                <img src="/img/games/racer_cover.png" alt="Math Racer" className="card-bg-img" />
                <div className="card-badge free-play-badge">
                  <span>✨ {isArabic ? 'مجاني للجميع' : 'FREE TO PLAY'}</span>
                </div>
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mathRacer', 'Math Racer')}</h3>
                    <p>{t('gamesMenu.mathRacerDesc', 'Turbo charged math action')}</p>
                    <button className="play-hover-btn play-free-btn">{t('gamesMenu.playNow', 'PLAY NOW')} 🏎️</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.mathRacer', 'Math Racer')} <span className="free-label-pill">{isArabic ? 'مجاني' : 'FREE'}</span></h3>
          </div>

          {/* Bunny Run */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/cave-runner', t('gamesMenu.bunnyRun', 'Bunny Run'), '/img/games/bunny_cover.png')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/bunny_cover.png" alt="Bunny Run" className="card-bg-img" />
                {!isAuth && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'تجربة 3 أيام' : '3-Day Trial'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.bunnyRun', 'Bunny Run')}</h3>
                    <p>{t('gamesMenu.bunnyRunDesc', 'Endless runner fun')}</p>
                    <button className="play-hover-btn">{isAuth ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة' : '🔒 UNLOCK')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.bunnyRun', 'Bunny Run')}</h3>
          </div>

          {/* Super Mario */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/super-mario', t('gamesMenu.infiniteMario', 'Super Mario'), '/img/games/mario_cover.png')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/mario_cover.png" alt="Super Mario" className="card-bg-img" />
                {!isAuth && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'تجربة 3 أيام' : '3-Day Trial'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.infiniteMario', 'Super Mario')}</h3>
                    <p>{t('gamesMenu.infiniteMarioDesc', 'Classic platforming & math blocks')}</p>
                    <button className="play-hover-btn">{isAuth ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة' : '🔒 UNLOCK')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.infiniteMario', 'Super Mario')}</h3>
          </div>

          {/* Maze Game */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/maze', t('gamesMenu.mazeGame', 'Maze Game'), '/img/games/maze_cover.png')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/maze_cover.png" alt="Maze Game" className="card-bg-img" />
                {!isAuth && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'تجربة 3 أيام' : '3-Day Trial'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mazeGame', 'Maze Game')}</h3>
                    <p>{t('gamesMenu.mazeGameDesc', 'Navigate and solve math to unlock doors')}</p>
                    <button className="play-hover-btn">{isAuth ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة' : '🔒 UNLOCK')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.mazeGame', 'Maze Game')}</h3>
          </div>

          {/* Sudoku Master */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/sudoku', t('gamesMenu.sudokuMaster', 'Sudoku Master'), '/img/games/sudoku_cover.png')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/sudoku_cover.png" alt="Sudoku Master" className="card-bg-img" />
                {!isAuth && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'تجربة 3 أيام' : '3-Day Trial'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.sudokuMaster', 'Sudoku Master')}</h3>
                    <p>{t('gamesMenu.sudokuMasterDesc', 'Brain teasing puzzles')}</p>
                    <button className="play-hover-btn">{isAuth ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة' : '🔒 UNLOCK')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.sudokuMaster', 'Sudoku Master')}</h3>
          </div>

          {/* Abacus Match Challenge */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/abacus-match', t('gamesMenu.abacusMatch', 'Abacus Match'), '/img/games/abacus_match_cover.png')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/abacus_match_cover.png" alt="Abacus Match" className="card-bg-img" />
                {!isAuth && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'تجربة 3 أيام' : '3-Day Trial'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.abacusMatch', 'Abacus Match')}</h3>
                    <p>{t('gamesMenu.abacusMatchDesc', 'Soroban training challenge')}</p>
                    <button className="play-hover-btn">{isAuth ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة' : '🔒 UNLOCK')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.abacusMatch', 'Abacus Match')}</h3>
          </div>

          {/* Math Tanks */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/tanks', t('gamesMenu.mathTanks', 'Math Tanks'), '/img/games/tanks_cover.png')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/tanks_cover.png" alt="Math Tanks" className="card-bg-img" />
                {!isAuth && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'تجربة 3 أيام' : '3-Day Trial'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mathTanks', 'Math Tanks')}</h3>
                    <p>{t('gamesMenu.mathTanksDesc', 'Aim, solve, and blast rivals in the arena!')}</p>
                    <button className="play-hover-btn">{isAuth ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة' : '🔒 UNLOCK')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.mathTanks', 'Math Tanks')}</h3>
          </div>

          {/* Minigolf */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/minigolf', t('gamesMenu.minigolf', 'Minigolf'), '/img/games/minigolf_cover.png')}>
            <div className="game-card-premium">
              <div className="card-image-wrapper">
                <img src="/img/games/minigolf_cover.png" alt="Minigolf" className="card-bg-img" />
                {!isAuth && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'تجربة 3 أيام' : '3-Day Trial'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.minigolf', 'Minigolf')}</h3>
                    <p>{t('gamesMenu.minigolfDesc', 'Putt your way through math challenges!')}</p>
                    <button className="play-hover-btn">{isAuth ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة' : '🔒 UNLOCK')}</button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">{t('gamesMenu.minigolf', 'Minigolf')}</h3>
          </div>

        </div>
      </div>

      {/* Guest Clicked on Locked Game Modal */}
      {lockedGameModal && (
        <div className="upgrade-overlay" onClick={() => setLockedGameModal(null)}>
          <div className="upgrade-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="upgrade-modal-header">
              <span className="lock-large-icon">🔒</span>
              <h2>{isArabic ? `افتح ${lockedGameModal.title}` : `Unlock ${lockedGameModal.title}`}</h2>
            </div>
            <p className="upgrade-modal-text">
              {isArabic 
                ? `لعبة ${lockedGameModal.title} متاحة لجميع مشتركي منصة Abacus Heroes. أنشئ حسابك الآن وابدأ تجربة مجانية كاملة لمدة 3 أيام للوصول لجميع الألعاب والواجبات!` 
                : `${lockedGameModal.title} is available for all Abacus Heroes members. Sign up now to start a 3-Day Free Trial with full access to all 8 games, homework, and competitions!`}
            </p>
            <div className="upgrade-modal-actions">
              <button 
                className="upgrade-btn-primary" 
                onClick={() => {
                  soundEffects.playClick();
                  navigate('/auth/register');
                }}
              >
                🎉 {isArabic ? 'ابدأ تجربة 3 أيام مجاناً' : 'Start 3-Day Free Trial'}
              </button>
              <button 
                className="upgrade-btn-secondary play-mathracer-modal-btn" 
                onClick={() => {
                  soundEffects.playClick();
                  navigate('/student/games/math-racer');
                }}
              >
                🏎️ {isArabic ? 'العب سباق الرياضيات (مجاناً)' : 'Play Math Racer (Free)'}
              </button>
              <button 
                className="upgrade-btn-secondary" 
                onClick={() => {
                  soundEffects.playClick();
                  navigate('/auth/login');
                }}
              >
                🔑 {isArabic ? 'تسجيل الدخول' : 'Log In'}
              </button>
              <button 
                className="upgrade-btn-secondary" 
                style={{ marginTop: '0.25rem', opacity: 0.75 }} 
                onClick={() => setLockedGameModal(null)}
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesMenu;
