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
import { safeLocalStorage } from '../../utils/safeStorage'
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
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const role = safeLocalStorage.getItem('auth_role')
  const isAuth = Boolean(safeLocalStorage.getItem('O_authWEB'))
  const navigate = useNavigate()
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [showTeacherTrialModal, setShowTeacherTrialModal] = useState(false)
  const [showTeacherHelp, setShowTeacherHelp] = useState(false)
  const [showStudentHelp, setShowStudentHelp] = useState(false)
  const [showDemoQuiz, setShowDemoQuiz] = useState(false)
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [fading, setFading] = React.useState(false)

  // Top Persona Switcher: 'Student' (default with unlocked Level 1 Journey) vs 'Teacher'
  const [activePersona, setActivePersona] = useState(() => {
    if (isAuth && role) {
      if (role === 'Teacher' || role === 'School' || role === 'IT' || role === 'Supervisor') {
        return 'Teacher';
      }
      return 'Student';
    }
    return safeLocalStorage.getItem('home_active_persona') || 'Student';
  });

  // Automatically match active persona to user's real role if logged in
  React.useEffect(() => {
    if (isAuth && role) {
      if (role === 'Teacher' || role === 'School' || role === 'IT' || role === 'Supervisor') {
        setActivePersona('Teacher');
      } else {
        setActivePersona('Student');
      }
    }
  }, [isAuth, role]);

  const handlePersonaChange = (newPersona) => {
    soundEffects.playClick();
    setActivePersona(newPersona);
    safeLocalStorage.setItem('home_active_persona', newPersona);
  };



  // Auto-advance slides every 2 seconds with a smooth fade
  React.useEffect(() => {
    let fadeTimer = null;
    const timer = setInterval(() => {
      setFading(true);
      fadeTimer = setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % SHOWCASE_IMAGES.length);
        setFading(false);
      }, 400); // fade-out duration
    }, 2000);
    return () => {
      clearInterval(timer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, []);

  // Auto open demo quiz removed based on user request
  return (
    <>
      <MobileNav role={role} />

      <div className='home-page-root'>
        <Navbar />

        <div className='home'>
          <div className="home-container">
            
            {/* ── TOP ROLE / PERSONA SELECTOR (STUDENT vs TEACHER) - Only for visitors not logged in ── */}
            {!isAuth && (
              <div className="persona-toggle-container">
                <div className="persona-toggle-track">
                  <button
                    type="button"
                    className={`persona-toggle-tab ${activePersona === 'Student' ? 'active-student' : ''}`}
                    onClick={() => handlePersonaChange('Student')}
                    aria-label="Student View"
                  >
                    <span className="persona-icon">🎓</span>
                    <span className="persona-title">{t('home.studentSelector', 'أنا طالب / Student')}</span>
                    <span className="persona-badge-glow">FREE LEVEL 1</span>
                  </button>
                  <button
                    type="button"
                    className={`persona-toggle-tab ${activePersona === 'Teacher' ? 'active-teacher' : ''}`}
                    onClick={() => handlePersonaChange('Teacher')}
                    aria-label="Teacher View"
                  >
                    <span className="persona-icon">👨‍🏫</span>
                    <span className="persona-title">{t('home.teacherSelector', 'أنا معلّم / Teacher')}</span>
                    <span className="persona-badge-trial">3-DAY TRIAL</span>
                  </button>
                </div>
              </div>
            )}

            <div className="hero-hybrid">
              {/* ── LEFT COLUMN: Text and Buttons ── */}
              {activePersona === 'Student' ? (
                <div className="hero-left">
                  <div className="hero-text-box hero-student-box">
                    <div className="hero-student-tag">
                      <span className="tag-dot">●</span>
                      <span>{t('home.studentTag', '🌟 وضع الأبطال والمغامرين | Hero Quest Mode')}</span>
                    </div>
                    <div className="home-title">
                      <h1 className="text-dark">{t('home.studentTitle1', 'Smart Games.')}</h1>
                      <h1 className="text-orange">{t('home.studentTitle2', 'Epic Learning Journey.')}</h1>
                      <h1 className="text-red">{t('home.studentTitle3', 'Level 1 Free to Play!')}</h1>
                    </div>
                    <div className="home-paragraph">
                      <p>{t('home.studentDesc1', 'Embark on the Archipelago math adventure & race in turbo Math Racer.')}</p>
                      <p>{t('home.studentDesc2', 'Explore Level 1 for free right now — no credit card, no login required!')}</p>
                    </div>
                    <div className="hero-buttons student-hero-buttons">
                      <div className="hero-btn-wrapper">
                        <button 
                          className="home-btn journey-btn-epic"
                          onClick={() => { 
                            soundEffects.playClick(); 
                            navigate('/student/learning-path'); 
                          }}
                        >
                          <span className="btn-text">🗺️ {t('home.startJourneyFree', 'ENTER THE JOURNEY (LEVEL 1 FREE)')}</span>
                        </button>
                        <div className="btn-subtitle">{t('home.journeySubtitle', 'Play lessons, answer questions & level up')}</div>
                      </div>
                      <div className="hero-btn-wrapper">
                        <button 
                          className="home-btn racer-btn-epic"
                          onClick={() => { 
                            soundEffects.playClick(); 
                            navigate('/student/games/math-racer'); 
                          }}
                        >
                          <span className="btn-text">🏎️ {t('home.playMathRacerFree', 'PLAY MATH RACER (FREE)')}</span>
                        </button>
                        <div className="btn-subtitle">{t('home.racerSubtitle', 'High speed mental math car race')}</div>
                      </div>
                    </div>
                    <div className="student-helper-row">
                      <button 
                        type="button"
                        className="student-how-btn"
                        onClick={() => { soundEffects.playClick(); setShowStudentHelp(true); }}
                      >
                        🎓 {t('home.explainingStudents', 'How does it work for students?')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hero-left">
                  <div className="hero-text-box">
                    <div className="home-title">
                      <h1 className="text-dark">{t('home.smartGames', 'Smart Games.')}</h1>
                      <h1 className="text-dark">{t('home.smarterTeaching', 'Smarter Teaching.')}</h1>
                      <h1 className="text-red">{t('home.betterResults', 'Better Results.')}</h1>
                    </div>
                    <div className="home-paragraph">
                      <p>{t('home.heroDesc1', 'The all-in-one platform for Egyptian schools,')}</p>
                      <p>{t('home.heroDesc2', 'Al-Moasser curriculum homework & auto-correction.')}</p>
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
              )}

              {/* ── RIGHT COLUMN: Showcase ── */}
              {activePersona === 'Student' ? (
                <div className="hero-right">
                  <div className="journey-preview-card">
                    <div className="journey-card-header">
                      <div className="journey-header-left">
                        <span className="journey-map-icon">🗺️</span>
                        <div>
                          <h3 className="journey-header-title">{isArabic ? 'رحلة أبطال العداد' : 'THE LEARNING JOURNEY'}</h3>
                          <span className="journey-header-sub">{isArabic ? 'جزر الأباكس • مغامرة الحساب الذهني' : 'Abacus Archipelago • Mental Math Quest'}</span>
                        </div>
                      </div>
                      <span className="journey-level1-free-pill">🔓 {isArabic ? 'المستوى 1 مجاناً' : 'LEVEL 1 UNLOCKED'}</span>
                    </div>

                    <div className="journey-map-canvas-preview">
                      <img src="/img/adventure_map_bg.jpg" alt="Journey Map" className="journey-preview-bg" />

                      {/* Connecting path line SVG */}
                      <svg className="preview-trail-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 18 72 Q 35 48, 52 58 T 84 32" fill="none" stroke="rgba(251, 191, 36, 0.85)" strokeWidth="3" strokeDasharray="4 4" />
                      </svg>
                      
                      {/* Visual node 1: Lesson 1 (Unlocked) */}
                      <div className="preview-node node-pos-1" onClick={() => navigate('/student/learning-path')}>
                        <div className="node-glow-ring" />
                        <div className="node-bubble unlocked-bubble">
                          <span className="node-num">1</span>
                        </div>
                        <div className="node-label-popup">
                          <span className="node-unit-tag">{isArabic ? '🧮 المستوى 1' : '🧮 Level 1'}</span>
                          <span className="node-title">{isArabic ? 'الجمع المباشر على العداد' : 'Direct Addition & Beads'}</span>
                          <span className="node-badge-free">{isArabic ? '✓ متاح مجاناً' : '✓ FREE TO PLAY'}</span>
                        </div>
                      </div>

                      {/* Visual node 2: Lesson 2 (Unlocked) */}
                      <div className="preview-node node-pos-2" onClick={() => navigate('/student/learning-path')}>
                        <div className="node-glow-ring" />
                        <div className="node-bubble unlocked-bubble">
                          <span className="node-num">2</span>
                        </div>
                        <div className="node-label-popup">
                          <span className="node-unit-tag">{isArabic ? '🧮 المستوى 1' : '🧮 Level 1'}</span>
                          <span className="node-title">{isArabic ? 'الطرح المباشر البسيط' : 'Direct Subtraction'}</span>
                          <span className="node-badge-free">{isArabic ? '✓ متاح مجاناً' : '✓ FREE TO PLAY'}</span>
                        </div>
                      </div>

                      {/* Visual node 3: Lesson 3 (Trial) */}
                      <div className="preview-node node-pos-3 locked" onClick={() => navigate('/student/learning-path')}>
                        <div className="node-bubble locked-bubble">
                          <span className="node-lock">🔒</span>
                        </div>
                        <div className="node-label-popup">
                          <span className="node-unit-tag">{isArabic ? '🌟 أصدقاء 5' : '🌟 Small Friends'}</span>
                          <span className="node-title">{isArabic ? 'قاعدة (+5) المساعد الصغير' : 'Small Friends (+5 Rule)'}</span>
                          <span className="node-badge-trial">3-DAY TRIAL</span>
                        </div>
                      </div>

                      {/* Visual node 4: Unit 2 (Trial) */}
                      <div className="preview-node node-pos-4 locked" onClick={() => navigate('/student/learning-path')}>
                        <div className="node-bubble locked-bubble">
                          <span className="node-lock">🔒</span>
                        </div>
                        <div className="node-label-popup">
                          <span className="node-unit-tag">{isArabic ? '⚡ أصدقاء 10' : '⚡ Big Friends'}</span>
                          <span className="node-title">{isArabic ? 'قاعدة (+10) المساعد الكبير' : 'Big Friends (+10 Rule)'}</span>
                          <span className="node-badge-trial">3-DAY TRIAL</span>
                        </div>
                      </div>

                      {/* Mascot Preview */}
                      <div className="preview-mascot-wrap" onClick={() => navigate('/student/learning-path')}>
                        <div className="mascot-speech">Level 1 Free! 🚀</div>
                        <img src="/img/hero_character.jpg" alt="Hero Mascot" className="preview-mascot-img" />
                      </div>
                    </div>

                    <div className="journey-card-footer">
                      <button 
                        className="journey-play-now-cta"
                        onClick={() => {
                          soundEffects.playClick();
                          navigate('/student/learning-path');
                        }}
                      >
                        <span>⚡ {t('home.tryLevel1Now', 'Explore Level 1 Map (Free)')}</span>
                        <span className="cta-arrow">➔</span>
                      </button>
                    </div>
                  </div>

                  {/* Scroll Down Arrow */}
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
              ) : (
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
              )}
            </div>
          </div>
        </div>

        <div className='home-mobile'>
          {/* Mobile version with persona toggle */}
          <div className="mobile-hero-container">
            {!isAuth && (
              <div className="persona-toggle-container mobile-toggle-container">
                <div className="persona-toggle-track">
                  <button
                    type="button"
                    className={`persona-toggle-tab ${activePersona === 'Student' ? 'active-student' : ''}`}
                    onClick={() => handlePersonaChange('Student')}
                  >
                    <span className="persona-icon">🎓</span>
                    <span className="persona-title">{t('home.studentSelector', 'طالب / Student')}</span>
                    <span className="persona-badge-glow">FREE</span>
                  </button>
                  <button
                    type="button"
                    className={`persona-toggle-tab ${activePersona === 'Teacher' ? 'active-teacher' : ''}`}
                    onClick={() => handlePersonaChange('Teacher')}
                  >
                    <span className="persona-icon">👨‍🏫</span>
                    <span className="persona-title">{t('home.teacherSelector', 'معلّم / Teacher')}</span>
                    <span className="persona-badge-trial">TRIAL</span>
                  </button>
                </div>
              </div>
            )}

            {activePersona === 'Student' ? (
              <>
                <div className="hero-text-box mobile-hero-box hero-student-box">
                  <div className="home-title mobile-title text-center">
                    <h1 className="text-dark">{t('home.studentTitle1', 'Smart Games.')}</h1>
                    <h1 className="text-orange">{t('home.studentTitle2', 'Epic Learning Journey.')}</h1>
                    <h1 className="text-red">{t('home.studentTitle3', 'Level 1 Free to Play!')}</h1>
                  </div>
                  <div className="home-paragraph text-center">
                    <p>{t('home.studentDesc1', 'Embark on the math adventure & race in turbo Math Racer.')}</p>
                  </div>
                </div>

                <div className="journey-preview-card mobile-journey-card">
                  <div className="journey-card-header">
                    <span className="journey-map-icon">🗺️</span>
                    <span className="journey-header-title">{isArabic ? 'رحلة الأبطال: المستوى 1 مجاناً' : 'JOURNEY: LEVEL 1 UNLOCKED'}</span>
                  </div>
                  <div className="journey-map-canvas-preview">
                    <img src="/img/adventure_map_bg.jpg" alt="Journey Map" className="journey-preview-bg" />
                    <div className="preview-node node-pos-1" onClick={() => navigate('/student/learning-path')}>
                      <div className="node-glow-ring" />
                      <div className="node-bubble unlocked-bubble"><span className="node-num">1</span></div>
                    </div>
                    <div className="preview-node node-pos-2" onClick={() => navigate('/student/learning-path')}>
                      <div className="node-glow-ring" />
                      <div className="node-bubble unlocked-bubble"><span className="node-num">2</span></div>
                    </div>
                    <div className="preview-mascot-wrap" onClick={() => navigate('/student/learning-path')}>
                      <img src="/img/hero_character.jpg" alt="Hero Mascot" className="preview-mascot-img" />
                    </div>
                  </div>
                </div>

                <div className="hero-buttons mobile-buttons">
                  <div className="hero-btn-wrapper">
                    <button 
                      className="home-btn journey-btn-epic"
                      onClick={() => { soundEffects.playClick(); navigate('/student/learning-path'); }}
                    >
                      <span className="btn-text">🗺️ {t('home.startJourneyFree', 'EXPLORE LEVEL 1 FREE')}</span>
                    </button>
                    <div className="btn-subtitle">{t('home.journeySubtitle', 'Play lessons & level up')}</div>
                  </div>
                  <div className="hero-btn-wrapper">
                    <button 
                      className="home-btn racer-btn-epic"
                      onClick={() => { soundEffects.playClick(); navigate('/student/games/math-racer'); }}
                    >
                      <span className="btn-text">🏎️ {t('home.playMathRacerFree', 'PLAY MATH RACER (FREE)')}</span>
                    </button>
                    <div className="btn-subtitle">{t('home.racerSubtitle', 'High speed mental math')}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

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
      </div>

      <TutorialVideoModal isOpen={showTutorialModal} onClose={() => setShowTutorialModal(false)} />
      {showTeacherTrialModal && <TeacherTrialModal onClose={() => setShowTeacherTrialModal(false)} />}
      {showTeacherHelp && <TeacherHelpModal onClose={() => setShowTeacherHelp(false)} />}
      {showStudentHelp && <StudentHelpModal onClose={() => setShowStudentHelp(false)} />}

      <QuestionType />


      {showDemoQuiz && <DemoQuizModal onClose={() => setShowDemoQuiz(false)} />}
    </>
  )
}

export default Home

