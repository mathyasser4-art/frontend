import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
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
      <nav>
        <div className='nav-mobile'>
          <div className='nav-mobile-container d-flex justify-content-space-around align-items-center'>
            <Link to={'/'} onClick={() => soundEffects.playClick()}><i className="fa fa-home active" aria-hidden="true"></i></Link>
            <Link to={'/system/65a4963482dbaac16d820fc6'} onClick={() => soundEffects.playClick()}><i className="fa fa-tasks link" aria-hidden="true"></i></Link>
            <Link to={'/system/65a4964b82dbaac16d820fc8'} onClick={() => soundEffects.playClick()}><i className="fa fa-file-text-o link" aria-hidden="true"></i></Link>
            {role === 'School' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null }
            {role === 'Teacher' ? <Link to={'/dashboard/teacher'} onClick={() => soundEffects.playClick()}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null }
            {role === 'Student' ? <Link to={'/dashboard/student'} onClick={() => soundEffects.playClick()}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null }
            {role === 'IT' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null }
            {role === 'Supervisor' ? <Link to={'/dashboard/supervisor'} onClick={() => soundEffects.playClick()}><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link> : null }
            <Link to={'/contact'} onClick={() => soundEffects.playClick()}><i className="fa fa-headphones link" aria-hidden="true"></i></Link>
            <Link to={'/user/info'} onClick={() => soundEffects.playClick()}><i className="fa fa-user link" aria-hidden="true"></i></Link>
          </div>
        </div>
      </nav>
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