import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Gamepad2, Swords, BookOpen, Plus } from 'lucide-react'
import soundEffects from '../../utils/soundEffects'
import CreateCompetitionModal from '../../components/navbar/CreateCompetitionModal';
import '../../reusable.css'
import './QuestionType.css'

function QuestionType() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCreateCompetition, setShowCreateCompetition] = useState(false)
  const [showResourcesModal, setShowResourcesModal] = useState(false)
  
  // Battle arena join state
  const [showJoinBattleModal, setShowJoinBattleModal] = useState(false)
  const [compIdInput, setCompIdInput] = useState('')
  const [joinCompError, setJoinCompError] = useState(null)
  const [joiningComp, setJoiningComp] = useState(false)

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
          <span 
            className="questionType-option resources-card" 
            onClick={() => {
              soundEffects.playClick();
              setShowResourcesModal(true);
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="option-icon-wrapper">
              <BookOpen size={64} strokeWidth={2} className="resources-icon" style={{ color: '#3b82f6' }} />
            </div>
            <h3 className="option-title">Resources</h3>
            <img src="/img/mcq_preview.png" alt="Pre-made Resources Preview" className="card-preview-screenshot" />
          </span>
          
          {(userRole === 'Teacher' || userRole === 'School' || userRole === 'Admin') && (
            <Link to={'/teacher/question-bank'} className="questionType-option create-questions-card" onClick={() => soundEffects.playClick()}>
              <div className="option-icon-wrapper">
                <Plus size={64} strokeWidth={2} className="create-icon" style={{ color: '#eab308' }} />
              </div>
              <h3 className="option-title">Create Questions</h3>
              <img src="/img/create_questions_cover.png" alt="Create Questions Preview" className="card-preview-screenshot" />
            </Link>
          )}

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

          {/* Card 4: Live Arena Battles */}
          {!isAuth ? (
            <span 
              className="questionType-option battle-card-option locked-card" 
              onClick={(e) => {
                e.preventDefault();
                soundEffects.playClick();
                setShowUpgradeModal(true);
              }}
            >
              <div className="option-icon-wrapper">
                <Swords size={64} strokeWidth={2} className="mcq-icon" />
              </div>
              <h3 className="option-title">Live Battles <span className="card-lock-badge">🔒</span></h3>
              <img src="/img/battle_arena_preview.png" alt="Live Battle Arena Preview" className="card-preview-screenshot" />
            </span>
          ) : userRole === 'Student' ? (
            <span 
              className="questionType-option battle-card-option" 
              onClick={() => {
                soundEffects.playClick();
                setShowJoinBattleModal(true);
              }}
            >
              <div className="option-icon-wrapper">
                <Swords size={64} strokeWidth={2} className="mcq-icon" style={{ color: '#fff' }} />
              </div>
              <h3 className="option-title">Live Battles</h3>
              <img src="/img/battle_arena_preview.png" alt="Live Battle Arena Preview" className="card-preview-screenshot" />
            </span>
          ) : userRole === 'Teacher' ? (
            <span 
              className="questionType-option battle-card-option" 
              onClick={() => {
                soundEffects.playClick();
                setShowCreateCompetition(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="option-icon-wrapper">
                <Swords size={64} strokeWidth={2} className="mcq-icon" style={{ color: '#fff' }} />
              </div>
              <h3 className="option-title">Live Battles</h3>
              <img src="/img/battle_arena_preview.png" alt="Live Battle Arena Preview" className="card-preview-screenshot" />
            </span>
          ) : (
            <Link 
              to="/dashboard-school" 
              className="questionType-option battle-card-option" 
              onClick={() => soundEffects.playClick()}
            >
              <div className="option-icon-wrapper">
                <Swords size={64} strokeWidth={2} className="mcq-icon" />
              </div>
              <h3 className="option-title">Live Battles</h3>
              <img src="/img/battle_arena_preview.png" alt="Live Battle Arena Preview" className="card-preview-screenshot" />
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

      {showJoinBattleModal && (
        <div className="upgrade-overlay" onClick={() => { setShowJoinBattleModal(false); setJoinCompError(null); }}>
          <div className="upgrade-modal-card battle-join-popup-card animate-comp-pop-in" onClick={(e) => e.stopPropagation()}>
            <button className="upgrade-close-btn" onClick={() => { setShowJoinBattleModal(false); setJoinCompError(null); }}>×</button>
            <div className="upgrade-modal-header">
              <span className="lock-large-icon">⚔️</span>
              <h2>Enter Battle Arena</h2>
            </div>
            <p className="upgrade-modal-text">
              Your teacher started a live battle! Paste the Competition ID below to enter the arena and compete:
            </p>
            <div className="battle-join-input-box" style={{ margin: '1.5rem 0', width: '100%' }}>
              <input
                type="text"
                className="battle-id-input-field"
                placeholder="Paste Competition ID here..."
                value={compIdInput}
                onChange={e => { setCompIdInput(e.target.value); setJoinCompError(null); }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '2px solid rgba(0,0,0,0.1)',
                  fontSize: '16px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {joinCompError && (
                <p className="battle-error-message" style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px', fontWeight: '600' }}>
                  ⚠️ {joinCompError}
                </p>
              )}
            </div>
            <div className="upgrade-modal-actions" style={{ width: '100%', display: 'flex', gap: '12px' }}>
              <button 
                className="upgrade-btn-primary" 
                disabled={joiningComp}
                onClick={() => {
                  const id = compIdInput.trim();
                  if (!id) { setJoinCompError('Please paste a valid Competition ID from your teacher.'); return; }
                  soundEffects.playClick();
                  
                  // Eagerly trigger automatic fullscreen using active user gesture
                  const docEl = document.documentElement;
                  if (docEl.requestFullscreen) {
                      docEl.requestFullscreen().catch(() => {});
                  } else if (docEl.webkitRequestFullscreen) {
                      docEl.webkitRequestFullscreen();
                  }

                  setJoiningComp(true);
                  navigate(`/student/competition/${id}`);
                }}
                style={{ flex: 1 }}
              >
                {joiningComp ? 'Entering Arena...' : 'Join Battle! ⚔️'}
              </button>
              <button 
                className="upgrade-btn-secondary" 
                onClick={() => { setShowJoinBattleModal(false); setJoinCompError(null); }}
                style={{ flex: '0 0 auto' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateCompetition && (
        <CreateCompetitionModal
          onClose={() => setShowCreateCompetition(false)}
        />
      )}

      {showResourcesModal && (
        <div className="upgrade-overlay" onClick={() => setShowResourcesModal(false)}>
          <div className="upgrade-modal-card resources-select-modal animate-comp-pop-in" onClick={(e) => e.stopPropagation()}>
            <button className="upgrade-close-btn" onClick={() => setShowResourcesModal(false)}>×</button>
            <div className="upgrade-modal-header">
              <span className="lock-large-icon">📚</span>
              <h2>{t('academy.resources', 'Pre-made Resources')}</h2>
            </div>
            <p className="upgrade-modal-text">
              Select the format of the pre-made question sheets to start practicing:
            </p>
            <div className="resources-options-grid" style={{ display: 'flex', gap: '1.5rem', margin: '2rem 0', width: '100%' }}>
              <div 
                className="resource-type-option mcq-select" 
                onClick={() => {
                  soundEffects.playClick();
                  setShowResourcesModal(false);
                  navigate('/system/65a4963482dbaac16d820fc6');
                }}
                style={{
                  flex: 1,
                  padding: '24px 16px',
                  borderRadius: '16px',
                  border: '2px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ background: 'rgba(101, 198, 238, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Circle size={32} color="#65C6EE" strokeWidth={2.5} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '18px', color: 'var(--text-color, #333)' }}>{t('academy.freeWorksheets')}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Multiple Choice questions</p>
              </div>
              <div 
                className="resource-type-option completion-select" 
                onClick={() => {
                  soundEffects.playClick();
                  setShowResourcesModal(false);
                  navigate('/system/65a4964b82dbaac16d820fc8');
                }}
                style={{
                  flex: 1,
                  padding: '24px 16px',
                  borderRadius: '16px',
                  border: '2px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ background: 'rgba(248, 117, 170, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircle2 size={32} color="#F875AA" strokeWidth={2.5} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '18px', color: 'var(--text-color, #333)' }}>
                  {isTopsoroban ? 'TOPSOROBAN' : t('academy.masterMinds')}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Completion/direct entry questions</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionType
