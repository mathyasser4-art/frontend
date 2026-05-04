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
import hand from '../../img/hand.png'
import '../../reusable.css'
import './Home.css'

function Home() {
  const { t } = useTranslation()
  const role = localStorage.getItem('auth_role')
  const navigate = useNavigate()
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  
  
  return (
    <>
      <MobileNav role={role} />
      
      {/* Floating Help Button */}
      {role === 'Teacher' && (
        <button 
          className="floating-help-btn"
          onClick={() => {
            soundEffects.playClick();
            setShowTutorialModal(true);
          }}
          aria-label="Tutorial Video"
          title="Watch how to assign homework"
        >
          Watch how to assign homework
        </button>
      )}
      
      <div className='home'>
        <Navbar />
        <div className="home-container">
          <div className="hero-split">
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
                  <div className="home-option-card" onClick={() => { soundEffects.playClick(); navigate('/system/65a4963482dbaac16d820fc6'); }}>
                    <div className="option-icon">
                      <GraduationCap size={32} strokeWidth={2.5} />
                    </div>
                    <h3>{t('home.practiceAsStudent')}</h3>
                    <span className="option-badge">{t('home.noLoginRequired')}</span>
                  </div>

                  <div className="home-option-card" onClick={() => { soundEffects.playClick(); setShowTrialModal(true); }}>
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

            <div className="hero-showcase">
              <div className="magical-screen-wrapper">
                <div className="magical-screen">
                  {/* We can use a video or an animated gif here. Using a placeholder for now */}
                  <div className="screen-content">
                    <img src={require('../../img/past-paper.gif')} alt="Gameplay Preview" className="preview-gif" />
                    <div className="play-button-overlay">
                      <div className="play-icon-circle"></div>
                    </div>
                  </div>
                </div>
                <div className="mascot-container">
                  <img src={require('../../img/cute_robot.png')} alt="Abacus Hero Mascot" className="mascot-img" />
                </div>
              </div>
            </div>
          </div>
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
