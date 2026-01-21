import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import logo from '../../logo.png'
import profileImg from '../../img/avatar-profile.png'
import school from '../../img/school-avatar.png'
import soundEffects from '../../utils/soundEffects'
import '../../reusable.css'
import './Navbar.css'

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const isAuth = localStorage.getItem('O_authWEB')
    const role = localStorage.getItem('auth_role')
    
    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ar' : 'en';
        i18n.changeLanguage(newLang);
        soundEffects.playClick();
    }

    return (

        <nav>
            <div className='nav-container d-flex justify-content-space-between align-items-center'>
                <Link to={'/'} onClick={() => soundEffects.playClick()}><img src={logo} alt="" /></Link>
                <div className='nav-right-side d-flex align-items-center'>
                    {/* Language Switcher */}
                    <div 
                        className="language-switcher" 
                        onClick={toggleLanguage}
                        style={{ 
                            cursor: 'pointer', 
                            marginRight: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            transition: 'all 0.3s',
                            backgroundColor: 'rgba(138, 43, 226, 0.15)',
                            border: '1px solid rgba(138, 43, 226, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(138, 43, 226, 0.25)';
                            e.currentTarget.style.borderColor = 'rgba(138, 43, 226, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(138, 43, 226, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(138, 43, 226, 0.3)';
                        }}
                        title={i18n.language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
                    >
                        <Languages size={20} color="#8a2be2" strokeWidth={2.5} />
                        <span style={{ color: '#8a2be2', fontSize: '14px', fontWeight: '600' }}>
                            {i18n.language === 'en' ? 'AR' : 'EN'}
                        </span>
                    </div>
                    
                    {role === 'School' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Teacher' ? <Link to={'/dashboard/teacher'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Student' ? <Link to={'/dashboard/student'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'IT' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Supervisor' ? <Link to={'/dashboard/supervisor'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {isAuth ? role === 'School' ? <Link to={'/user/info'} onClick={() => soundEffects.playClick()}><img className='school-avatar' src={school} alt="" /></Link> : <Link to={'/user/info'} onClick={() => soundEffects.playClick()}><img src={profileImg} alt="" /></Link> : <Link to={'/auth/login'} onClick={() => soundEffects.playClick()}><div className="nav-btn">{t('common.login')}
                        <div className="nav-btn2"></div>
                    </div></Link>}
                    
                </div>
            </div>
        </nav >
    );
}

export default Navbar;
