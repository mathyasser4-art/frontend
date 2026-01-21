import React from 'react'
import { Link } from 'react-router-dom';
import soundEffects from '../../utils/soundEffects'
import '../../reusable.css'
import './QuestionType.css'

function QuestionType() {
  return (
    <div className='questionType'>
      <div className="questionType-container">
        <div className="questionType-title">
          <h3>Choose Your Academy</h3>
          <div className="line"></div>
        </div>
        <div className="questionType-options">
          <Link to={'/system/65a4963482dbaac16d820fc6'} className="questionType-option" onClick={() => soundEffects.playClick()}>
            <span className="option-emoji">⚡</span>
            <h3 className="option-title">Free Worksheets</h3>
            <p className="option-subtitle">Enhance your mental math skills with solving extra questions</p>
          </Link>
          
          <Link to={'/system/65a4964b82dbaac16d820fc8'} className="questionType-option mastermind" onClick={() => soundEffects.playClick()}>
            <span className="option-emoji">🧠</span>
            <h3 className="option-title">MasterMinds</h3>
            <p className="option-subtitle">Practice the book questions of master minds academy</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default QuestionType