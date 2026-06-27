import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import QuestionType from '../questionType/QuestionType'
import FeaturesSection from '../../components/featuresSection/FeaturesSection'
import TeacherTrialModal from '../../components/teacherTrialModal/TeacherTrialModal'
import TutorialVideoModal from '../../components/tutorialVideoModal/TutorialVideoModal'
import TeacherHelpModal from '../../components/teacherHelpModal/TeacherHelpModal'
import StudentHelpModal from '../../components/studentHelpModal/StudentHelpModal'
import DemoQuizModal from '../../components/demoQuiz/DemoQuizModal'
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
  { emoji: '🌊', image: '/img/games/jetski_cover.png', name: 'Jet Ski Racing',  badge: 'FAST PACED', color: '#0ea5e9', path: '/student/games/jetski' },
  { emoji: '🏎️', image: '/img/games/racer_cover.png', name: 'Math Racer',      badge: 'TURBO',      color: '#f59e0b', path: '/student/games/math-racer' },
  { emoji: '🏹', image: '/img/games/battle_racing_cover.png', name: 'Battle Racing',   badge: 'RANKED',     color: '#ef4444', path: '/student/games/archery' },
  { emoji: '🧩', image: '/img/games/bunny_cover.png', name: 'Math Crossword',  badge: 'GENIUS',     color: '#a855f7', path: '/student/games/math-crossword' },
  { emoji: '🐰', image: '/img/games/bunny_cover.png', name: 'Bunny Run',       badge: 'ENDLESS',    color: '#22c55e', path: '/student/games/cave-runner' },
]

function Home() {
  const { t } = useTranslation()
  const role = localStorage.getItem('auth_role')
  const navigate = useNavigate()
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [showTeacherTrialModal, setShowTeacherTrialModal] = useState(false)
  const [showTeacherHelp, setShowTeacherHelp] = useState(false)
  const [showStudentHelp, setShowStudentHelp] = useState(false)
  const [showDemoQuiz, setShowDemoQuiz] = useState(false)
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

  React.useEffect(() => {
    const isAuthUser = localStorage.getItem('O_authWEB');
    const hasSeenDemo = localStorage.getItem('hasSeenDemoQuiz') === 'true';
    if (!isAuthUser && !hasSeenDemo) {
      // Auto open demo quiz overlay for first-time guest visitors
      setShowDemoQuiz(true);
    }
  }, []);

  return (
    <>
      <MobileNav role={role} />



      <div className='home'>
        <Navbar />
        <div className="home-container">
          
          <div className="hero-hybrid">
            {/* ── LEFT: Text and Buttons ── */}
            <div className="hero-left">
              <div className="hero-text-box">
                <div className="home-title">
                  <h1 className="text-dark">{t('home.smartGames', 'Smart Games.')}</h1>
                  <h1 className="text-dark">{t('home.smarterTeaching', 'Smarter Teaching.')}</h1>
                  <h1 className="text-red">{t('home.betterResults', 'Better Results.')}</h1>
                </div>
                <div className="home-paragraph">
                  <p>{t('home.heroDesc1', 'The all-in-one platform for abacus learning,')}</p>
                  <p>{t('home.heroDesc2', 'homework management & automatic correction.')}</p>
                </div>
                <div className="hero-buttons">
                  <div className="hero-btn-wrapper">
                    <button 
                      className="home-btn pink-btn"
                      onClick={() => { soundEffects.playClick(); setShowTeacherHelp(true); }}
                    >
                      <span className="btn-text">👤 {t('home.explainingTeachers', 'EXPLAINING FOR TEACHERS')}</span>
                    </button>
                    <div className="btn-subtitle">{t('home.teacherSubtitle', 'Manage my class & homework')}</div>
                  </div>
                  <div className="hero-btn-wrapper">
                    <button 
                      className="home-btn blue-btn"
                      onClick={() => { 
                        soundEffects.playClick(); 
                        setShowStudentHelp(true);
                      }}
                    >
                      <span className="btn-text">🎓 {t('home.explainingStudents', 'EXPLAINING FOR STUDENTS')}</span>
                    </button>
                    <div className="btn-subtitle">{t('home.studentSubtitle', 'Play, practice & solve homework')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Showcase & Illustration ── */}
            <div className="hero-right">
              <div className="showcase-title">
                <h2>{t('home.seeHowItWorks', 'See How It Works')}</h2>
              </div>
              <div className="hero-showcase small-showcase">
                <div className="magical-screen-wrapper">
                  <div className="magical-screen">
                    <div className="screen-content">
                      <img
                        src={SHOWCASE_IMAGES[currentSlide]}
                        alt="Gameplay Preview"
                        className={`preview-slide-img ${fading ? 'slide-fade-out' : 'slide-fade-in'}`}
                        onError={() => {
                          setCurrentSlide(prev => (prev + 1) % SHOWCASE_IMAGES.length);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scroll Down Arrow (Request 6) */}
              <div className="scroll-down-arrow desktop-only-arrow" onClick={() => {
                const el = document.getElementById('academy-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>
                <span className="scroll-arrow-text">Practice Section</span>
                <div className="scroll-arrow-chevron">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


       <TutorialVideoModal isOpen={showTutorialModal} onClose={() => setShowTutorialModal(false)} />
      {showTeacherTrialModal && <TeacherTrialModal onClose={() => setShowTeacherTrialModal(false)} />}
      {showTeacherHelp && <TeacherHelpModal onClose={() => setShowTeacherHelp(false)} />}
      {showStudentHelp && <StudentHelpModal onClose={() => setShowStudentHelp(false)} />}

      <div className='home-mobile'>
        <Navbar />
        {/* Mobile version remains similar but uses the new text/buttons below the showcase */}
        <div className="mobile-hero-container">
           <div className="hero-text-box mobile-hero-box">
             <div className="home-title mobile-title text-center">
                <h1 className="text-dark">{t('home.smartGames', 'Smart Games.')}</h1>
                <h1 className="text-dark">{t('home.smarterTeaching', 'Smarter Teaching.')}</h1>
                <h1 className="text-red">{t('home.betterResults', 'Better Results.')}</h1>
             </div>
           </div>
           <div className="hero-showcase mobile-hero-showcase">
            <div className="magical-screen-wrapper">
              <div className="magical-screen">
                <div className="screen-content">
                  <img
                    src={SHOWCASE_IMAGES[currentSlide]}
                    alt="Gameplay Preview"
                    className={`preview-slide-img ${fading ? 'slide-fade-out' : 'slide-fade-in'}`}
                    onError={() => {
                      setCurrentSlide(prev => (prev + 1) % SHOWCASE_IMAGES.length);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="hero-buttons mobile-buttons">
              <div className="hero-btn-wrapper">
                <button className="home-btn pink-btn" onClick={() => { soundEffects.playClick(); setShowTeacherHelp(true); }}>
                  <span className="btn-text">👨‍🏫 {t('home.explainingTeachers', 'EXPLAINING FOR TEACHERS')}</span>
                </button>
                <div className="btn-subtitle">{t('home.teacherSubtitle', 'Manage class & homework')}</div>
              </div>
              <div className="hero-btn-wrapper">
                <button className="home-btn blue-btn" onClick={() => { soundEffects.playClick(); setShowStudentHelp(true); }}>
                  <span className="btn-text">🎓 {t('home.explainingStudents', 'EXPLAINING FOR STUDENTS')}</span>
                </button>
                <div className="btn-subtitle">{t('home.studentSubtitle', 'Play & solve homework')}</div>
              </div>
          </div>
          {/* Scroll Down Arrow Mobile (Request 6) */}
          <div className="scroll-down-arrow mobile-scroll-arrow" onClick={() => {
            const el = document.getElementById('academy-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>
            <span className="scroll-arrow-text">Practice Section</span>
            <div className="scroll-arrow-chevron">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <QuestionType />
      <FeaturesSection />

      {showDemoQuiz && <DemoQuizModal onClose={() => setShowDemoQuiz(false)} />}
    </>
  )
}

export default Home

