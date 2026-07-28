import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, BookOpen, User, LogOut } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import { safeLocalStorage } from '../../utils/safeStorage';
import './MobileNav.css';

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = safeLocalStorage.getItem('O_authWEB');
  const role = safeLocalStorage.getItem('auth_role');

  const getDashboardPath = () => {
    if (role === 'Student') return '/dashboard/student';
    if (role === 'Teacher') return '/dashboard/teacher';
    if (role === 'School' || role === 'IT') return '/dashboard-school';
    if (role === 'Supervisor') return '/dashboard/supervisor';
    return '/';
  };

  const handleLogout = () => {
    try { soundEffects.playClick(); } catch(e) {}
    safeLocalStorage.removeItem('O_authWEB');
    safeLocalStorage.removeItem('auth_role');
    safeLocalStorage.removeItem('pp_name');
    safeLocalStorage.removeItem('pp_id');
    safeLocalStorage.removeItem('school_name');
    navigate('/auth/login');
  };

  if (!isAuth) return null;

  return (
    <nav className="mobile-bottom-nav">
      <Link 
        to="/" 
        className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
        onClick={() => { try { soundEffects.playClick(); } catch(e) {} }}
      >
        <Home size={20} />
        <span>Home</span>
      </Link>

      <Link 
        to={getDashboardPath()} 
        className={`mobile-nav-item ${location.pathname.includes('/dashboard') ? 'active' : ''}`}
        onClick={() => { try { soundEffects.playClick(); } catch(e) {} }}
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </Link>

      {(role === 'School' || role === 'IT' || role === 'Teacher') && (
        <Link 
          to="/dashboard-school/class" 
          className={`mobile-nav-item ${location.pathname.includes('/class') ? 'active' : ''}`}
          onClick={() => { try { soundEffects.playClick(); } catch(e) {} }}
        >
          <BookOpen size={20} />
          <span>Classes</span>
        </Link>
      )}

      <Link 
        to="/user/info" 
        className={`mobile-nav-item ${location.pathname === '/user/info' ? 'active' : ''}`}
        onClick={() => { try { soundEffects.playClick(); } catch(e) {} }}
      >
        <User size={20} />
        <span>Profile</span>
      </Link>

      <button className="mobile-nav-item logout-btn" onClick={handleLogout}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </nav>
  );
};

export default MobileNav;
