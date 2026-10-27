import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import './GamesMenu.css';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import { isFeaturesUnlocked, openReferralLockModal } from '../../utils/featureLock';

const GamesMenu = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const isAuth = safeLocalStorage.getItem('O_authWEB');
  const role = safeLocalStorage.getItem('auth_role') || 'Student';

  const [isUnlocked, setIsUnlocked] = useState(isFeaturesUnlocked());

  useEffect(() => {
    const handleFeaturesUnlocked = () => {
      setIsUnlocked(isFeaturesUnlocked());
    };
    window.addEventListener('features-unlocked', handleFeaturesUnlocked);
    window.addEventListener('storage', handleFeaturesUnlocked);
    return () => {
      window.removeEventListener('features-unlocked', handleFeaturesUnlocked);
      window.removeEventListener('storage', handleFeaturesUnlocked);
    };
  }, []);

  const handleGameSelect = (path, title, imgCover) => {
    soundEffects.playClick();
    if (isFeaturesUnlocked()) {
      navigate(path);
    } else {
      openReferralLockModal({ title, path });
    }
  };

  return (
    <div className="dashboard-layout" dir={isArabic ? 'rtl' : 'ltr'}>
      <MobileNav role={role} />
      <Navbar />
      
      <div className="games-menu-page">
        <div className="games-header">
          <button 
            onClick={() => navigate(isAuth ? (role === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student') : '/')} 
            className="back-button-modern"
          >
            <ArrowLeft size={24} style={{ transform: isArabic ? 'scaleX(-1)' : 'none' }} />
            <span>{isAuth ? (role === 'Teacher' ? (isArabic ? 'لوحة المعلم' : 'Teacher Dashboard') : t('gamesMenu.backToDashboard', 'Back to Dashboard')) : (isArabic ? 'العودة للرئيسية' : 'Back to Home')}</span>
          </button>
          
          <h1 className="menu-title">{t('gamesMenu.title', 'Adventure Games Room')}</h1>
          <p className="menu-subtitle">
            {isUnlocked 
              ? t('gamesMenu.subtitle', 'Play, Learn, and Conquer the Leaderboard!')
              : (isArabic 
                  ? '🔒 ألعاب الحساب والذكاء مقفلة! شارك المنصة مع زملائك لفتحها فوراً' 
                  : '🔒 Math & intelligence games are locked! Share with colleagues to unlock instantly')}
          </p>

          {/* Referral Unlock Banner */}
          {!isUnlocked ? (
            <div className="referral-menu-unlock-banner" onClick={() => openReferralLockModal()}>
              <div className="banner-left">
                <span className="banner-icon-badge">🔒 🎁</span>
                <div className="banner-text">
                  <h4>{isArabic ? 'غرفة الألعاب مقفلة!' : 'Games Room Locked!'}</h4>
                  <p>
                    {role === 'Teacher'
                      ? (isArabic 
                          ? 'شارك منصة أبطال العداد مع زميل معلّم عبر واتساب للحصول على تصريح فوري 48 ساعة لجميع الألعاب والمسابقات!' 
                          : 'Share Abacus Heroes with a fellow teacher on WhatsApp for an instant 48h full access pass!')
                      : (isArabic
                          ? 'شارك المنصة مع أصدقائك عبر واتساب للحصول على تصريح فوري 48 ساعة لجميع الألعاب والسباقات!'
                          : 'Share with friends on WhatsApp for an instant 48h full game pass!')}
                  </p>
                </div>
              </div>
              <button className="banner-action-btn">
                💬 {isArabic ? 'مشاركة عبر واتساب (فتح فوري)' : 'Share on WhatsApp (Instant Unlock)'}
              </button>
            </div>
          ) : (
            <div className="referral-menu-unlocked-banner">
              <span>✨ {isArabic ? 'جميع الألعاب مفتوحة لك بالكامل! استمتع باللعب والمنافسة 🎮' : 'All games are unlocked! Enjoy playing and competing 🎮'}</span>
            </div>
          )}
        </div>

        <div className="games-grid-premium">
          
          {/* Math Racer */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/math-racer', t('gamesMenu.mathRacer', 'Math Racer'), '/img/games/racer_cover.png')}>
            <div className={`game-card-premium ${isUnlocked ? 'free-game-card' : 'locked-game-card'}`}>
              <div className="card-image-wrapper">
                <img src="/img/games/racer_cover.png" alt="Math Racer" className="card-bg-img" />
                <div className={`card-badge ${isUnlocked ? 'free-play-badge' : 'vip-locked-badge'}`}>
                  <span>{isUnlocked ? '✨ ' + (isArabic ? 'مفتوح للعب' : 'UNLOCKED') : '🔒 ' + (isArabic ? 'مقفلة • شارك لفتحها' : 'Locked • Share')}</span>
                </div>
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mathRacer', 'Math Racer')}</h3>
                    <p>{t('gamesMenu.mathRacerDesc', 'Turbo charged math action')}</p>
                    <button className={`play-hover-btn ${isUnlocked ? 'play-free-btn' : 'locked-hover-btn'}`}>
                      {isUnlocked ? t('gamesMenu.playNow', 'PLAY NOW') + ' 🏎️' : (isArabic ? '🔒 افتح اللعبة (مشاركة)' : '🔒 UNLOCK (Share)')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">
              {t('gamesMenu.mathRacer', 'Math Racer')} 
              <span className={isUnlocked ? 'free-label-pill' : 'locked-label-pill'}>
                {isUnlocked ? (isArabic ? 'مفتوح' : 'OPEN') : (isArabic ? '🔒 مقفل' : '🔒 LOCKED')}
              </span>
            </h3>
          </div>

          {/* Bunny Run */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/cave-runner', t('gamesMenu.bunnyRun', 'Bunny Run'), '/img/games/bunny_cover.png')}>
            <div className={`game-card-premium ${!isUnlocked ? 'locked-game-card' : ''}`}>
              <div className="card-image-wrapper">
                <img src="/img/games/bunny_cover.png" alt="Bunny Run" className="card-bg-img" />
                {!isUnlocked && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'مقفلة • شارك لفتحها' : 'Locked • Share'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.bunnyRun', 'Bunny Run')}</h3>
                    <p>{t('gamesMenu.bunnyRunDesc', 'Endless runner fun')}</p>
                    <button className={`play-hover-btn ${!isUnlocked ? 'locked-hover-btn' : ''}`}>
                      {isUnlocked ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة (مشاركة)' : '🔒 UNLOCK (Share)')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">
              {t('gamesMenu.bunnyRun', 'Bunny Run')}
              {!isUnlocked && <span className="locked-label-pill">{isArabic ? '🔒 مقفل' : '🔒 LOCKED'}</span>}
            </h3>
          </div>

          {/* Super Mario */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/super-mario', t('gamesMenu.infiniteMario', 'Super Mario'), '/img/games/mario_cover.png')}>
            <div className={`game-card-premium ${!isUnlocked ? 'locked-game-card' : ''}`}>
              <div className="card-image-wrapper">
                <img src="/img/games/mario_cover.png" alt="Super Mario" className="card-bg-img" />
                {!isUnlocked && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'مقفلة • شارك لفتحها' : 'Locked • Share'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.infiniteMario', 'Super Mario')}</h3>
                    <p>{t('gamesMenu.infiniteMarioDesc', 'Classic platforming & math blocks')}</p>
                    <button className={`play-hover-btn ${!isUnlocked ? 'locked-hover-btn' : ''}`}>
                      {isUnlocked ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة (مشاركة)' : '🔒 UNLOCK (Share)')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">
              {t('gamesMenu.infiniteMario', 'Super Mario')}
              {!isUnlocked && <span className="locked-label-pill">{isArabic ? '🔒 مقفل' : '🔒 LOCKED'}</span>}
            </h3>
          </div>

          {/* Maze Game */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/maze', t('gamesMenu.mazeGame', 'Maze Game'), '/img/games/maze_cover.png')}>
            <div className={`game-card-premium ${!isUnlocked ? 'locked-game-card' : ''}`}>
              <div className="card-image-wrapper">
                <img src="/img/games/maze_cover.png" alt="Maze Game" className="card-bg-img" />
                {!isUnlocked && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'مقفلة • شارك لفتحها' : 'Locked • Share'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mazeGame', 'Maze Game')}</h3>
                    <p>{t('gamesMenu.mazeGameDesc', 'Navigate and solve math to unlock doors')}</p>
                    <button className={`play-hover-btn ${!isUnlocked ? 'locked-hover-btn' : ''}`}>
                      {isUnlocked ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة (مشاركة)' : '🔒 UNLOCK (Share)')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">
              {t('gamesMenu.mazeGame', 'Maze Game')}
              {!isUnlocked && <span className="locked-label-pill">{isArabic ? '🔒 مقفل' : '🔒 LOCKED'}</span>}
            </h3>
          </div>

          {/* Sudoku Master */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/sudoku', t('gamesMenu.sudokuMaster', 'Sudoku Master'), '/img/games/sudoku_cover.png')}>
            <div className={`game-card-premium ${!isUnlocked ? 'locked-game-card' : ''}`}>
              <div className="card-image-wrapper">
                <img src="/img/games/sudoku_cover.png" alt="Sudoku Master" className="card-bg-img" />
                {!isUnlocked && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'مقفلة • شارك لفتحها' : 'Locked • Share'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.sudokuMaster', 'Sudoku Master')}</h3>
                    <p>{t('gamesMenu.sudokuMasterDesc', 'Brain teasing puzzles')}</p>
                    <button className={`play-hover-btn ${!isUnlocked ? 'locked-hover-btn' : ''}`}>
                      {isUnlocked ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة (مشاركة)' : '🔒 UNLOCK (Share)')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">
              {t('gamesMenu.sudokuMaster', 'Sudoku Master')}
              {!isUnlocked && <span className="locked-label-pill">{isArabic ? '🔒 مقفل' : '🔒 LOCKED'}</span>}
            </h3>
          </div>

          {/* Abacus Match Challenge */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/abacus-match', t('gamesMenu.abacusMatch', 'Abacus Match'), '/img/games/abacus_match_cover.png')}>
            <div className={`game-card-premium ${!isUnlocked ? 'locked-game-card' : ''}`}>
              <div className="card-image-wrapper">
                <img src="/img/games/abacus_match_cover.png" alt="Abacus Match" className="card-bg-img" />
                {!isUnlocked && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'مقفلة • شارك لفتحها' : 'Locked • Share'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.abacusMatch', 'Abacus Match')}</h3>
                    <p>{t('gamesMenu.abacusMatchDesc', 'Soroban training challenge')}</p>
                    <button className={`play-hover-btn ${!isUnlocked ? 'locked-hover-btn' : ''}`}>
                      {isUnlocked ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة (مشاركة)' : '🔒 UNLOCK (Share)')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">
              {t('gamesMenu.abacusMatch', 'Abacus Match')}
              {!isUnlocked && <span className="locked-label-pill">{isArabic ? '🔒 مقفل' : '🔒 LOCKED'}</span>}
            </h3>
          </div>

          {/* Math Tanks */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/tanks', t('gamesMenu.mathTanks', 'Math Tanks'), '/img/games/tanks_cover.png')}>
            <div className={`game-card-premium ${!isUnlocked ? 'locked-game-card' : ''}`}>
              <div className="card-image-wrapper">
                <img src="/img/games/tanks_cover.png" alt="Math Tanks" className="card-bg-img" />
                {!isUnlocked && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'مقفلة • شارك لفتحها' : 'Locked • Share'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.mathTanks', 'Math Tanks')}</h3>
                    <p>{t('gamesMenu.mathTanksDesc', 'Aim, solve, and blast rivals in the arena!')}</p>
                    <button className={`play-hover-btn ${!isUnlocked ? 'locked-hover-btn' : ''}`}>
                      {isUnlocked ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة (مشاركة)' : '🔒 UNLOCK (Share)')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">
              {t('gamesMenu.mathTanks', 'Math Tanks')}
              {!isUnlocked && <span className="locked-label-pill">{isArabic ? '🔒 مقفل' : '🔒 LOCKED'}</span>}
            </h3>
          </div>

          {/* Minigolf */}
          <div className="game-item-container" onClick={() => handleGameSelect('/student/games/minigolf', t('gamesMenu.minigolf', 'Minigolf'), '/img/games/minigolf_cover.png')}>
            <div className={`game-card-premium ${!isUnlocked ? 'locked-game-card' : ''}`}>
              <div className="card-image-wrapper">
                <img src="/img/games/minigolf_cover.png" alt="Minigolf" className="card-bg-img" />
                {!isUnlocked && (
                  <div className="card-badge vip-locked-badge">
                    <span>🔒 {isArabic ? 'مقفلة • شارك لفتحها' : 'Locked • Share'}</span>
                  </div>
                )}
                <div className="card-overlay">
                  <div className="overlay-content">
                    <h3>{t('gamesMenu.minigolf', 'Minigolf')}</h3>
                    <p>{t('gamesMenu.minigolfDesc', 'Putt your way through math challenges!')}</p>
                    <button className={`play-hover-btn ${!isUnlocked ? 'locked-hover-btn' : ''}`}>
                      {isUnlocked ? t('gamesMenu.playNow', 'PLAY NOW') : (isArabic ? '🔒 افتح اللعبة (مشاركة)' : '🔒 UNLOCK (Share)')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="game-card-title">
              {t('gamesMenu.minigolf', 'Minigolf')}
              {!isUnlocked && <span className="locked-label-pill">{isArabic ? '🔒 مقفل' : '🔒 LOCKED'}</span>}
            </h3>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GamesMenu;
