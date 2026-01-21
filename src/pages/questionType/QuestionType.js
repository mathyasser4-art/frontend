import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom';
import soundEffects from '../../utils/soundEffects'
import '../../reusable.css'
import './QuestionType.css'

function QuestionType() {
  const { t } = useTranslation()
  
  return (
    <div className='questionType'>
      <div className="questionType-container">
        <div className="questionType-title">
          <h3>{t('academy.chooseYourAcademy')}</h3>
          <div className="line"></div>
        </div>
        <div className="questionType-options">
          <Link to={'/system/65a4963482dbaac16d820fc6'} className="questionType-option" onClick={() => soundEffects.playClick()}>
            <span className="option-emoji">⚡</span>
            <h3 className="option-title">{t('academy.freeWorksheets')}</h3>
            <p className="option-subtitle">{t('academy.freeWorksheetsDesc')}</p>
          </Link>
          
          <Link to={'/system/65a4964b82dbaac16d820fc8'} className="questionType-option mastermind" onClick={() => soundEffects.playClick()}>
            <span className="option-emoji">🧠</span>
            <h3 className="option-title">{t('academy.masterMinds')}</h3>
            <p className="option-subtitle">{t('academy.masterMindsDesc')}</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default QuestionType