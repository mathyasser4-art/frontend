import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../logo.png'
import profileImg from '../../img/avatar-profile.png'
import school from '../../img/school-avatar.png'
import soundEffects from '../../utils/soundEffects'
import '../../reusable.css'
import './Navbar.css'

const Navbar = () => {
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')

    return (

        <nav>
            <div className='nav-container d-flex justify-content-space-between align-items-center'>
                <Link to={'/'} onClick={() => soundEffects.playClick()}><img src={logo} alt="" /></Link>
                <div className='nav-right-side d-flex align-items-center'>
                    {role === 'School' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Teacher' ? <Link to={'/dashboard/teacher'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Student' ? <Link to={'/dashboard/student'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'IT' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Supervisor' ? <Link to={'/dashboard/supervisor'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {isAuth ? role === 'School' ? <Link to={'/user/info'} onClick={() => soundEffects.playClick()}><img className='school-avatar' src={school} alt="" /></Link> : <Link to={'/user/info'} onClick={() => soundEffects.playClick()}><img src={profileImg} alt="" /></Link> : <Link to={'/auth/login'} onClick={() => soundEffects.playClick()}><div className="nav-btn">LogIn
                        <div className="nav-btn2"></div>
                    </div></Link>}
                    
                </div>
            </div>
        </nav >
    );
}

export default Navbar;
