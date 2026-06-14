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



          <div className="pricing-grid-new">
            {/* 1. Academy Section */}
            <div className="pricing-section academy-section">
              <div className="section-icon">
                <School size={40} color="#6366f1" />
              </div>
              <h2>Academy Plans</h2>
              <p className="section-description">
                Tailored solutions for educational institutions of all sizes with dedicated dashboards and analytics.
              </p>
              
              <div className="pricing-table-container">
                <div className="promo-badge-container">
                  <span className="promo-badge-text">🔥 15% OFF FOR QUARTERLY PAYMENTS</span>
                </div>
                <p className="table-subtitle">Pricing per student account:</p>
                <table className="teacher-tiers-table">
                  <thead>
                    <tr>
                      <th>Tier (Students)</th>
                      <th>Monthly</th>
                      <th>Quarterly (Per Term)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tier-name">Starter <span className="category-label">(0-1,000)</span></td>
                      <td>30 EGP/mo</td>
                      <td><span className="new-price-table">25.5 EGP/mo</span><br/><small style={{color: '#64748b'}}>(76.5 EGP total)</small></td>
                    </tr>
                    <tr>
                      <td className="tier-name">Growth <span className="category-label">(1k-5k)</span></td>
                      <td>20 EGP/mo</td>
                      <td><span className="new-price-table">17 EGP/mo</span><br/><small style={{color: '#64748b'}}>(51.0 EGP total)</small></td>
                    </tr>
                    <tr>
                      <td className="tier-name">Pro <span className="category-label">(5k-10k)</span></td>
                      <td>15 EGP/mo</td>
                      <td><span className="new-price-table">12.75 EGP/mo</span><br/><small style={{color: '#64748b'}}>(38.25 EGP total)</small></td>
                    </tr>
                    <tr>
                      <td className="tier-name">Enterprise <span className="category-label">(10k+)</span></td>
                      <td>10 EGP/mo</td>
                      <td><span className="new-price-table">8.5 EGP/mo</span><br/><small style={{color: '#64748b'}}>(25.5 EGP total)</small></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul className="feature-list" style={{ marginTop: '1.5rem' }}>
                <li><CheckCircle2 size={18} /> Professional School Dashboard</li>
                <li><CheckCircle2 size={18} /> Unlimited Teachers & Classes</li>
                <li><CheckCircle2 size={18} /> Custom Branding & Subdomain</li>
              </ul>
              <Link to="/contact" className="pricing-btn-new academy-btn">
                Contact Sales
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
                  <p>1st Worksheet of Level 0 (Choose & Complete) is 100% free to try!</p>
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

          {/* Competitions & Rewards Section */}
          <div className="competitions-rewards-section" style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '2rem', marginTop: '3rem', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '3rem'
          }}>
            <h2 style={{ color: '#b45309', fontSize: '1.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              🏆 Competitions & Rewards
            </h2>
            <p style={{ color: '#78350f', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto 1.5rem' }}>
              The platform provides an advanced system to manage and organize grand competitions for all registered students efficiently and stably. An additional unified fee is calculated:
            </p>
            <div style={{ background: '#eff6ff', border: '2px dashed #3b82f6', borderRadius: '12px', padding: '1.5rem', display: 'inline-block', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#1d4ed8', fontSize: '1.5rem', margin: 0 }}>[ 50 EGP ] only per student participating in the competition</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>(This fixed value applies regardless of the total number of students in the academy or school)</p>
            
            <div style={{ textAlign: 'left', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h4 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏅 What the student and institution get for these fees:
              </h4>
              <p style={{ color: '#334155', lineHeight: '1.6', margin: 0 }}>
                Each competing student automatically and instantly receives a <strong>Certificate of Appreciation in PDF format as a board of honor and reward for their participation and ambition</strong>. The certificate is professionally designed and high quality, bearing the <strong>official logo of your academy</strong> next to the <strong>official Abacus Heroes platform logo</strong>, which formally enhances your institution's brand identity to parents and officially raises your clients' loyalty and trust in your educational services.
              </p>
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