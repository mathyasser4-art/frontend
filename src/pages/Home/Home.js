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
import { GraduationCap, Presentation } from 'lucide-react'
import '../../reusable.css'
import './Home.css'

// 🖼️ HOW TO ADD IMAGES:
// Just name your images showcase1.png, showcase2.png, showcase3.png... 
// and place them in public/img/showcase/. 
// The website will automatically find them!
const SHOWCASE_IMAGES = [
  '/img/showcase/showcase1.png',
  '/img/showcase/showcase2.png',
  '/img/showcase/showcase3.png',
  '/img/showcase/showcase4.png',
  '/img/showcase/showcase5.png',
  '/img/showcase/showcase6.png',
  '/img/showcase/showcase7.png',
]

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
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [fading, setFading] = React.useState(false)

  // Auto-advance slides every 2 seconds with a smooth fade
  React.useEffect(() => {
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % SHOWCASE_IMAGES.length)
        setFading(false)
      }, 400) // fade-out duration
    }, 2000)
    return () => clearInterval(timer)
  }, [])

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

      <div className='home'>
        <Navbar />
        <div className="home-container">
          <div className="hero-vertical">
            {/* ── TOP: Title ── */}
            <div className="hero-top-content">
              <div className="home-title">
                <h1 className='text-purple'>{t('home.welcomeTo')}</h1>
                <h1 className='text-red'>{t('home.abacusHeroes')}</h1>
              </div>
            </div>

            {/* ── BOTTOM: Image Slideshow ── */}
            <div className="hero-showcase">
              <div className="magical-screen-wrapper">
                <div className="magical-screen">
                  <div className="screen-content">
                    <img
                      src={`${SHOWCASE_IMAGES[currentSlide]}?t=${new Date().getTime()}`}
                      alt="Gameplay Preview"
                      className={`preview-slide-img ${fading ? 'slide-fade-out' : 'slide-fade-in'}`}
                      onError={() => {
                        // If an image fails, skip to the next one immediately
                        setCurrentSlide(prev => (prev + 1) % SHOWCASE_IMAGES.length);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {!role && (
              <div className="home-options vertical-options">
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
