import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logo from '../../logo.png';

function Footer() {
  const schoolName = localStorage.getItem('school_name') || '';
  const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban');

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/">
            <img src={isTopsoroban ? '/img/topsoroban_abacusheroes_logo.png' : logo} alt="Abacus Heroes Logo" className="footer-logo" />
          </Link>
          <p className="footer-tagline">Smart Games. Smarter Teaching. Better Results.</p>
        </div>
        
        <div className="footer-links-group">
          <h3>Platform</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/auth/login">Login</Link></li>
            <li><Link to="/auth/register">Sign Up</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h3>Company</h3>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Abacus Heroes. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
