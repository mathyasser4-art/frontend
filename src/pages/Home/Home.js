import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import QuestionType from '../questionType/QuestionType'
import FeaturesSection from '../../components/featuresSection/FeaturesSection'
import TeacherTrialModal from '../../components/teacherTrialModal/TeacherTrialModal'
import TutorialVideoModal from '../../components/tutorialVideoModal/TutorialVideoModal'
import soundEffects from '../../utils/soundEffects'
import { GraduationCap, Presentation, X, Play } from 'lucide-react'
import '../../reusable.css'
import './Home.css'

// 🎬 REPLACE this with your YouTube video ID (the part after ?v= in the URL)
// Example: https://www.youtube.com/watch?v=ABC123 → 'ABC123'
const SHOWCASE_VIDEO_ID = 'dQw4w9WgXcQ'

const GAME_PREVIEWS = [
  { emoji: '🌊', name: 'Jet Ski Racing',  badge: 'FAST PACED', color: '#0ea5e9', path: '/student/games/jetski' },
  { emoji: '🏎️', name: 'Math Racer',      badge: 'TURBO',      color: '#f59e0b', path: '/student/games/math-racer' },
  { emoji: '🏹', name: 'Battle Racing',   badge: 'RANKED',     color: '#ef4444', path: '/student/games/archery' },
  { emoji: '🧩', name: 'Math Crossword',  badge: 'GENIUS',     color: '#a855f7', path: '/student/games/math-crossword' },
  { emoji: '🐰', name: 'Bunny Run',       badge: 'ENDLESS',    color: '#22c55e', path: '/student/games/cave-runner' },
]

function Home() {
  const { t } = useTranslation()
  const role = localStorage.getItem('auth_role')
  const navigate = useNavigate()
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  const openVideo = () => {
    soundEffects.playClick()
    setShowVideoModal(true)
  }

  return (
    <>
      <MobileNav role={role} />

      {/* Floating Help Button */}
      {role === 'Teacher' && (
        <button
          className="floating-help-btn"
          onClick={() => { soundEffects.playClick(); setShowTutorialModal(true) }}
          aria-label="Tutorial Video"
          title="Watch how to assign homework"
        >
          Watch how to assign homework
        </button>
      )}

      {/* ── VIDEO MODAL ── */}
      {showVideoModal && (
        <div className="video-modal-backdrop" onClick={() => setShowVideoModal(false)}>
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setShowVideoModal(false)}>
              <X size={28} />
            </button>
            <div className="video-modal-frame">
              <iframe
                src={`https://www.youtube.com/embed/${SHOWCASE_VIDEO_ID}?autoplay=1&rel=0`}
                title="Abacus Heroes Showcase"
                allow="autoplay; fullscreen"
                allowFullScreen
                frameBorder="0"
              />
            </div>
            <p className="video-modal-caption">🎮 See Abacus Heroes in Action!</p>
          </div>
        </div>
      )}

      <div className='home'>
        <Navbar />
        <div className="home-container">
          <div className="hero-split">
            {/* ── LEFT: Text + CTA ── */}
            <div className="hero-text-content">
              <div className="home-title">
                <h1 className='text-purple'>{t('home.welcomeTo')}</h1>
                <h1 className='text-red'>{t('home.abacusHeroes')}</h1>
              </div>
              <div className="home-paragraph">
                <p>{t('home.tagline')}</p>
              </div>

              {!role && (
                <div className="home-options">
                  <div className="home-option-card" onClick={() => { soundEffects.playClick(); navigate('/system/65a4963482dbaac16d820fc6') }}>
                    <div className="option-icon">
                      <GraduationCap size={32} strokeWidth={2.5} />
                    </div>
                    <h3>{t('home.practiceAsStudent')}</h3>
                    <span className="option-badge">{t('home.noLoginRequired')}</span>
                  </div>

                  <div className="home-option-card" onClick={() => { soundEffects.playClick(); setShowTrialModal(true) }}>
                    <div className="option-icon teacher-icon">
                      <Presentation size={32} strokeWidth={2.5} />
                    </div>
                    <h3>{t('home.tryTeacherFeatures')}</h3>
                    <span className="option-badge trial-badge">{t('home.freeTrialBadge')}</span>
                  </div>
                </div>
              )}

              <Link to="/pricing" className="home-btn" onClick={() => soundEffects.playClick()}>
                <span className="btn-text">{t('home.joinNow')}</span>
                <span className="btn-arrow">→</span>
              </Link>
            </div>

            {/* ── RIGHT: Mascot + Clickable Screen ── */}
            <div className="hero-showcase">
              <div className="magical-screen-wrapper">
                <div className="magical-screen clickable-screen" onClick={openVideo} title="Watch our games!">
                  <div className="screen-content">
                    <img src={require('../../img/past-paper.gif')} alt="Gameplay Preview" className="preview-gif" />
                    <div className="play-button-overlay">
                      <div className="play-icon-circle">
                        <Play size={22} color="#FF6B6B" fill="#FF6B6B" style={{ marginLeft: 4 }} />
                      </div>
                    </div>
                    <div className="screen-label">▶ Watch Our Games</div>
                  </div>
                </div>
                <div className="mascot-container">
                  <img src={require('../../img/cute_robot.png')} alt="Abacus Hero Mascot" className="mascot-img" />
                </div>
              </div>
            </div>
          </div>

          {/* ── GAME STRIP ── */}
          {!role && (
            <div className="game-strip">
              <p className="strip-label">🎮 Jump straight into a game</p>
              <div className="strip-cards">
                {GAME_PREVIEWS.map((g) => (
                  <div
                    key={g.path}
                    className="strip-card"
                    style={{ '--card-color': g.color }}
                    onClick={() => { soundEffects.playClick(); navigate(g.path) }}
                  >
                    <span className="strip-emoji">{g.emoji}</span>
                    <span className="strip-name">{g.name}</span>
                    <span className="strip-badge">{g.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <TeacherTrialModal isOpen={showTrialModal} onClose={() => setShowTrialModal(false)} />
      <TutorialVideoModal isOpen={showTutorialModal} onClose={() => setShowTutorialModal(false)} />

      <div className='home-mobile'>
        <Navbar />
        <div className="home-title">
          <h1 className='text-purple'>{t('home.welcomeTo')}</h1>
          <h1 className='text-red'>{t('home.abacusHeroes')}</h1>
        </div>
      </div>
      <QuestionType />
      <FeaturesSection />
    </>
  )
}

export default Home
