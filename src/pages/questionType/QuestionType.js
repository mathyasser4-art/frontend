import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Gamepad2 } from 'lucide-react'
import soundEffects from '../../utils/soundEffects'
import '../../reusable.css'
import './QuestionType.css'

function QuestionType() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const isAuth = localStorage.getItem('O_authWEB')
  
  const schoolName = localStorage.getItem('school_name') || '';
  const userName = localStorage.getItem('pp_name') || '';
  const userRole = localStorage.getItem('auth_role') || '';
  
  const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || 
                      (userRole === 'School' && userName.toLowerCase() === 'topsoroban');

  return (
    <div id="academy-section" className={`questionType ${isTopsoroban ? 'topsoroban-theme' : ''}`}>
      {/* Academy Main Header */}
      <div className="academy-section-header">
        <h2 className="academy-main-title">🚀 Start Solving Questions & Playing Games Now!</h2>
        <p className="academy-main-subtitle">Practice worksheets or play interactive abacus math games</p>
      </div>

      <div className="questionType-container">
        <div className="questionType-title">
          {isTopsoroban ? (
            <h3>
              <span translate="no" className="notranslate" style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4)' }}>
                TOPSOROBAN
              </span>
            </h3>
          ) : (
            <img 
              src="/img/masterminds_logo.png" 
              alt="MASTERMINDS" 
              className="masterminds-logo-title" 
            />
          )}
          <div className="line" style={{ marginTop: '0.2rem' }}></div>
          
          {/* Sub-header above the cards */}
          <h4 className="cards-selection-title">Choose the type of questions or play games:</h4>
        </div>
        <div className="questionType-options">
          <Link to={'/system/65a4963482dbaac16d820fc6'} className="questionType-option mcq" onClick={() => soundEffects.playClick()}>
            <div className="option-icon-wrapper">
              <Circle size={64} strokeWidth={2} className="mcq-icon" />
            </div>
            <h3 className="option-title">{t('academy.freeWorksheets')}</h3>
            <img src="/img/mcq_preview.png" alt="Multiple Choice Questions Preview" className="card-preview-screenshot" />
          </Link>
          
          <Link to={'/system/65a4964b82dbaac16d820fc8'} className="questionType-option mastermind" onClick={() => soundEffects.playClick()}>
            <div className="option-icon-wrapper">
              <CheckCircle2 size={64} strokeWidth={2} className="completion-icon" />
            </div>
            <h3 className="option-title">
              <span translate="no" className="notranslate">
                {isTopsoroban ? 'TOPSOROBAN' : t('academy.masterMinds')}
              </span>
            </h3>
            <img src="/img/completion_preview.png" alt="Completion Questions Preview" className="card-preview-screenshot" />
          </Link>

          {!isAuth ? (
            <span 
              className="questionType-option games-card-option locked-card" 
              onClick={(e) => {
                e.preventDefault();
                soundEffects.playClick();
                setShowUpgradeModal(true);
              }}
            >
              <div className="option-icon-wrapper">
                <Gamepad2 size={64} strokeWidth={2} className="mcq-icon" />
              </div>
              <h3 className="option-title">Fun Games <span className="card-lock-badge">🔒</span></h3>
              <img src="/img/games/racer_cover.png" alt="Fun Games Preview" className="card-preview-screenshot" />
            </span>
          ) : (
            <Link to={'/student/games-menu'} className="questionType-option games-card-option" onClick={() => soundEffects.playClick()}>
              <div className="option-icon-wrapper">
                <Gamepad2 size={64} strokeWidth={2} className="mcq-icon" />
              </div>
              <h3 className="option-title">Fun Games</h3>
              <img src="/img/games/racer_cover.png" alt="Fun Games Preview" className="card-preview-screenshot" />
            </Link>
          )}
        </div>
      </div>

      {showUpgradeModal && (
        <div className="upgrade-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="upgrade-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="upgrade-close-btn" onClick={() => setShowUpgradeModal(false)}>×</button>
            <div className="upgrade-modal-header">
              <span className="lock-large-icon">🔒</span>
              <h2>Upgrade to Use</h2>
            </div>
            <p className="upgrade-modal-text">
              Guests cannot access the Fun Games room. Subscribe to play all interactive educational games!
            </p>
            <div className="upgrade-modal-actions">
              <button className="upgrade-btn-primary" onClick={() => { setShowUpgradeModal(false); navigate('/pricing'); }}>
                View Pricing Plans
              </button>
              <button className="upgrade-btn-secondary" onClick={() => { setShowUpgradeModal(false); navigate('/auth/login'); }}>
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionType
