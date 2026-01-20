import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import MobileNav from '../../components/mobileNav/MobileNav'
import QuestionType from '../questionType/QuestionType'
import ContactUS from '../contact/ContactUS'
import TeacherTrialModal from '../../components/teacherTrialModal/TeacherTrialModal'
import soundEffects from '../../utils/soundEffects'
import { GraduationCap, Presentation } from 'lucide-react'
import hand from '../../img/hand.png'
import '../../reusable.css'
import './Home.css'

function Home() {
  const role = localStorage.getItem('auth_role')
  const navigate = useNavigate()
  const [showTrialModal, setShowTrialModal] = useState(false)
  
  useEffect(() => {
    // Redirect students directly to their dashboard
    if (role === 'Student') {
      navigate('/dashboard/student')
    }
  }, [role, navigate])
  
  return (
    <>
      <MobileNav role={role} />
      <div className='home'>
        <Navbar />
        <div className="home-container">
          <div className="home-title">
            <h1 className='text-purple'>WELCOME TO</h1>
            <h1 className='text-red'>ABACUS HEROES</h1>
          </div>
          <div className="home-paragraph">
            <p>Play the Abacus .. Be a Hero !</p>
          </div>
          
          {!role && (
            <div className="home-options">
              <div className="home-option-card" onClick={() => { soundEffects.playClick(); navigate('/system/65a4963482dbaac16d820fc6'); }}>
                <div className="option-icon">
                  <GraduationCap size={48} strokeWidth={2.5} />
                </div>
                <h3>Practice as Student</h3>
                <p>Start practicing questions for free</p>
                <span className="option-badge">No login required</span>
              </div>

              <div className="home-option-card" onClick={() => { soundEffects.playClick(); setShowTrialModal(true); }}>
                <div className="option-icon teacher-icon">
                  <Presentation size={48} strokeWidth={2.5} />
                </div>
                <h3>Try Teacher Features</h3>
                <p>Test all features with demo students</p>
                <span className="option-badge trial-badge">7-Day Free Trial</span>
              </div>
            </div>
          )}
          
          <Link to="/pricing" className="home-btn" onClick={() => soundEffects.playClick()}>
            <span className="btn-text">JOIN NOW</span>
            <span className="btn-arrow">→</span>
          </Link>
        </div>
      </div>
      
      <TeacherTrialModal isOpen={showTrialModal} onClose={() => setShowTrialModal(false)} />
      <div className='home-mobile'>
        <Navbar />
        <div className="home-title">
          <h1 className='text-purple'>WELCOME TO</h1>
          <h1 className='text-red'>ABACUS HEROES</h1>
        </div>
      </div>
      <QuestionType />
      <ContactUS />
    </>
  )
}

export default Home