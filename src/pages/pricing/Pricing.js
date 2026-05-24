import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import './Pricing.css';
import '../../reusable.css';
import { School, GraduationCap, Users, MessageSquare, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';

function Pricing() {
  return (
    <>
      <div className="pricing-page-new">
        <Navbar />
        
        <div className="pricing-container">
          <div className="pricing-header">
            <h1>Join the Abacus Heroes Family! 🚀</h1>
            <p>Choose the path that fits you best and start your journey today</p>
          </div>

          {/* Demo Accounts Banner */}
          <div className="demo-accounts-banner">
            <div className="banner-header">
              <Sparkles size={24} color="#f59e0b" className="sparkle-icon" />
              <h3>Instant Demo Preview!</h3>
            </div>
            <p className="banner-subtitle">
              For a limited time, you can log in with our demo accounts to explore all premium features:
            </p>
            <div className="credentials-container">
              <div className="credential-card">
                <h4>👨‍🏫 Teacher Account</h4>
                <div className="credential-field">Username: <span>teacher</span></div>
                <div className="credential-field">Password: <span>1234</span></div>
              </div>
              <div className="credential-card">
                <h4>🎓 Student Account</h4>
                <div className="credential-field">Username: <span>student</span></div>
                <div className="credential-field">Password: <span>1234</span></div>
              </div>
            </div>
            <Link to="/auth/login" className="banner-login-btn d-flex align-items-center gap-2">
              <span>Log In & Try Now</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="pricing-grid-new">
            {/* 1. Academy Section */}
            <div className="pricing-section academy-section">
              <div className="section-icon">
                <School size={40} color="#6366f1" />
              </div>
              <h2>Academy</h2>
              <p className="section-description">
                Elevate your education center with our professional tools and curriculum.
              </p>
              <div className="section-offer">
                <MessageSquare size={20} />
                <span>Message us to get a special offer for your academy</span>
              </div>
              <ul className="feature-list">
                <li><CheckCircle2 size={18} /> Professional School Dashboard</li>
                <li><CheckCircle2 size={18} /> Unlimited Teachers & Classes</li>
                <li><CheckCircle2 size={18} /> Custom Branding Options</li>
              </ul>
              <Link to="/contact" className="pricing-btn-new academy-btn">
                Contact for Special Offer
              </Link>
            </div>

            {/* 2. Teacher Section */}
            <div className="pricing-section teacher-section featured">
              <div className="popular-tag">MOST POPULAR</div>
              <div className="section-icon">
                <Users size={40} color="#ec4899" />
              </div>
              <h2>Teacher</h2>
              
              <div className="pricing-table-container">
                <div className="promo-badge-container">
                  <span className="promo-badge-text">🔥 30% OFF UNTIL END OF MAY</span>
                </div>
                <p className="table-subtitle">Tiered pricing per student account:</p>
                <table className="teacher-tiers-table">
                  <thead>
                    <tr>
                      <th>Students Count</th>
                      <th>Monthly</th>
                      <th>Semi-Yearly</th>
                      <th>Yearly</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tier-name">Up to 10 <span className="category-label">(A)</span></td>
                      <td><span className="old-price-table">20</span><span className="new-price-table">14 EGP</span></td>
                      <td><span className="old-price-table">110</span><span className="new-price-table">77 EGP</span></td>
                      <td><span className="old-price-table">150</span><span className="new-price-table">105 EGP</span></td>
                    </tr>
                    <tr>
                      <td className="tier-name">10 to 20 <span className="category-label">(B)</span></td>
                      <td><span className="old-price-table">15</span><span className="new-price-table">10.5 EGP</span></td>
                      <td><span className="old-price-table">90</span><span className="new-price-table">63 EGP</span></td>
                      <td><span className="old-price-table">120</span><span className="new-price-table">84 EGP</span></td>
                    </tr>
                    <tr>
                      <td className="tier-name">20 to 50 <span className="category-label">(C)</span></td>
                      <td><span className="old-price-table">12</span><span className="new-price-table">8.4 EGP</span></td>
                      <td><span className="old-price-table">70</span><span className="new-price-table">49 EGP</span></td>
                      <td><span className="old-price-table">100</span><span className="new-price-table">70 EGP</span></td>
                    </tr>
                    <tr>
                      <td className="tier-name">50+ <span className="category-label">(D)</span></td>
                      <td><span className="old-price-table">10</span><span className="new-price-table">7 EGP</span></td>
                      <td><span className="old-price-table">55</span><span className="new-price-table">38.5 EGP</span></td>
                      <td><span className="old-price-table">80</span><span className="new-price-table">56 EGP</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="section-instructions">
                Fill the teacher's registration form with desired classes and student names. Accounts delivered in 24 hours.
              </p>
              <Link to="/contact" className="pricing-btn-new teacher-btn">
                Message Us
              </Link>
            </div>

            {/* 3. Parent or Student Section */}
            <div className="pricing-section student-section">
              <div className="section-icon">
                <GraduationCap size={40} color="#10b981" />
              </div>
              <h2>Parent or Student</h2>
              <p className="section-description">
                Join us to practice questions and play fun educational games!
              </p>
              
              <div className="student-plans-list">
                <div className="student-plan-row">
                  <span className="plan-period">Monthly</span>
                  <span className="plan-price">30 EGP</span>
                </div>
                <div className="student-plan-row">
                  <span className="plan-period">Semi-Yearly</span>
                  <span className="plan-price">150 EGP</span>
                </div>
                <div className="student-plan-row font-bold-row">
                  <span className="plan-period">Yearly</span>
                  <span className="plan-price">240 EGP</span>
                </div>
              </div>

              <div className="free-trial-highlight-box">
                <span className="gift-icon">🎁</span>
                <div className="free-trial-text">
                  <strong>Free Trial Active!</strong>
                  <p>1st Worksheet of Level 0 (MCQ & Completion) is 100% free to try!</p>
                </div>
              </div>

              <ul className="feature-list" style={{ marginTop: '1.5rem' }}>
                <li><CheckCircle2 size={18} /> Access to All Practice Questions</li>
                <li><CheckCircle2 size={18} /> Play All Fun Educational Games</li>
                <li><CheckCircle2 size={18} /> Track Personal Progress</li>
                <li><CheckCircle2 size={18} /> Daily Challenges & Rewards</li>
              </ul>
              <Link to="/contact" className="pricing-btn-new student-btn">
                Message Us
              </Link>
            </div>
          </div>

          {/* Comparison Table Section */}
          <div className="comparison-section">
            <h2 className="comparison-title">Which account type is right for you?</h2>
            <p className="comparison-subtitle">Compare features between a free normal account and a premium subscription</p>
            
            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Features & Benefits</th>
                    <th>Normal (Free Trial)</th>
                    <th>Premium (Paid Plan)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="feature-desc">Level 0 Practice Sheets</td>
                    <td className="free-cell">1st Sheet Only</td>
                    <td className="premium-cell">✓ Unlimited Access</td>
                  </tr>
                  <tr>
                    <td className="feature-desc">Level 1 to 5 Sheets</td>
                    <td className="free-cell">❌ Locked</td>
                    <td className="premium-cell">✓ Unlimited Access</td>
                  </tr>
                  <tr>
                    <td className="feature-desc">Practice Row Sizes</td>
                    <td className="free-cell">2 Rows Only</td>
                    <td className="premium-cell">✓ 3+ Rows (Unlimited)</td>
                  </tr>
                  <tr>
                    <td className="feature-desc">Adventure Games Room</td>
                    <td className="free-cell">❌ Locked</td>
                    <td className="premium-cell">✓ Play All Games</td>
                  </tr>
                  <tr>
                    <td className="feature-desc">Personal Progress Tracking</td>
                    <td className="free-cell">❌ None</td>
                    <td className="premium-cell">✓ Detailed Analytics</td>
                  </tr>
                  <tr>
                    <td className="feature-desc">Homework Assignments</td>
                    <td className="free-cell">❌ None</td>
                    <td className="premium-cell">✓ Complete Assigned Tasks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pricing-footer-info">
            <p>Need help choosing? <Link to="/contact">Contact our support team</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Pricing;