import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/navbar/Navbar'
import QuestionType from '../questionType/QuestionType'
import ContactUS from '../contact/ContactUS'
import soundEffects from '../../utils/soundEffects'
import hand from '../../img/hand.png'
import '../../reusable.css'
import './Home.css'

function Home() {
  const role = localStorage.getItem('auth_role')
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
          
          <Link to="/pricing" className="home-btn" onClick={() => soundEffects.playClick()}>
            <span className="btn-text">JOIN NOW</span>
            <span className="btn-arrow">→</span>
          </Link>
        </div>
      </div>
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