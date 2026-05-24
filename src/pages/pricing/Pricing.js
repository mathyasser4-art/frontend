import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import './Pricing.css';
import '../../reusable.css';
import { School, GraduationCap, Users, MessageSquare, CheckCircle2 } from 'lucide-react';

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
                <p className="table-subtitle">Tiered pricing based on student count (EGP per student):</p>
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
                      <td>20 EGP</td>
                      <td>110 EGP</td>
                      <td>150 EGP</td>
                    </tr>
                    <tr>
                      <td className="tier-name">10 to 20 <span className="category-label">(B)</span></td>
                      <td>15 EGP</td>
                      <td>90 EGP</td>
                      <td>120 EGP</td>
                    </tr>
                    <tr>
                      <td className="tier-name">20 to 50 <span className="category-label">(C)</span></td>
                      <td>12 EGP</td>
                      <td>70 EGP</td>
                      <td>100 EGP</td>
                    </tr>
                    <tr>
                      <td className="tier-name">50+ <span className="category-label">(D)</span></td>
                      <td>10 EGP</td>
                      <td>55 EGP</td>
                      <td>80 EGP</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="teacher-bonus">
                <strong>Bonus:</strong> Get a free account for yourself when you subscribe for 5+ students!
              </div>
              <p className="section-instructions">
                Fill the teacher's registration form with desired classes and student names. Accounts delivered in 24 hours.
              </p>
              <Link to="/teacher/registration" className="pricing-btn-new teacher-btn">
                Register as Teacher
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
              <Link to="/auth/register" className="pricing-btn-new student-btn">
                Join as Student
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