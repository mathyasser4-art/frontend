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
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(75, 0, 130, 0.15) 100%)',
                            border: '2px solid transparent',
                            backgroundClip: 'padding-box',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(75, 0, 130, 0.25) 100%)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(138, 43, 226, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(75, 0, 130, 0.15) 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        title={i18n.language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
                    >
                        <Languages 
                            size={22} 
                            style={{
                                color: '#8a2be2',
                                filter: 'drop-shadow(0 2px 4px rgba(138, 43, 226, 0.3))'
                            }}
                            strokeWidth={2.5} 
                        />
                        <span style={{ 
                            background: 'linear-gradient(135deg, #8a2be2 0%, #4b0082 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontSize: '15px', 
                            fontWeight: '700',
                            letterSpacing: '0.5px'
                        }}>
                            {i18n.language === 'en' ? 'AR' : 'EN'}
                        </span>
                    </div>
                    
                    {role === 'School' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Teacher' ? <Link to={'/dashboard/teacher'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Student' ? <Link to={'/dashboard/student'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'IT' ? <Link to={'/dashboard-school'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {role === 'Supervisor' ? <Link to={'/dashboard/supervisor'} onClick={() => soundEffects.playClick()}><div className="gear"><i className="fa fa-graduation-cap" aria-hidden="true"></i></div></Link> : null}
                    {isAuth ? role === 'School' ? <Link to={'/user/info'} onClick={() => soundEffects.playClick()}><img className='school-avatar' src={school} alt="" /></Link> : <Link to={'/user/info'} onClick={() => soundEffects.playClick()}><img src={profileImg} alt="" /></Link> : (
                        <>
                            <Link to={'/auth/register'} onClick={() => soundEffects.playClick()}>
                                <div className="nav-btn nav-btn-signup" style={{ marginRight: '15px' }}>
                                    {t('auth.signUp')}
                                    <div className="nav-btn2"></div>
                                </div>
                            </Link>
                            <Link to={'/auth/login'} onClick={() => soundEffects.playClick()}>
                                <div className="nav-btn">
                                    {t('common.login')}
                                    <div className="nav-btn2"></div>
                                </div>
                            </Link>
                        </>
                    )}
                    
                </div>
            </div>
        </nav >
    );
}

export default Navbar;
