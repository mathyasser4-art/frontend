import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.css';
import logo from '../../logo.png';
import { safeLocalStorage } from '../../utils/safeStorage';
import { SHOW_PRICING } from '../../config/api.config';

function Footer() {
  const { t } = useTranslation();
  const schoolName = safeLocalStorage.getItem('school_name') || '';
  const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban');

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/">
            <img src={isTopsoroban ? '/img/topsoroban_abacusheroes_logo.png' : logo} alt="Abacus Heroes Logo" className="footer-logo" />
          </Link>
          <p className="footer-tagline">{t('home.heroDesc1', 'Smart Games. Smarter Teaching. Better Results.')}</p>
        </div>
        
        <div className="footer-links-group">
          <h3>{t('footer.platform', 'Platform')}</h3>
          <ul>
            <li><Link to="/">{t('footer.home', 'Home')}</Link></li>
            {SHOW_PRICING && <li><Link to="/pricing">{t('navbar.pricing', 'Pricing')}</Link></li>}
            <li><Link to="/auth/login">{t('common.login', 'Login')}</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h3>{t('footer.company', 'Company')}</h3>
          <ul>
            <li><Link to="/about">{t('footer.aboutUs', 'About Us')}</Link></li>
            <li><Link to="/contact">{t('navbar.contact', 'Contact')}</Link></li>
            <li><Link to="/privacy">{t('footer.privacyPolicy', 'Privacy Policy')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Abacus Heroes. {t('footer.allRightsReserved', 'All rights reserved.')}</p>
      </div>
    </footer>
  );
}

export default Footer;
