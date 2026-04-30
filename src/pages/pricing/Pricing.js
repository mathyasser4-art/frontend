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
              <div className="pricing-info">
                <div className="price-item">
                  <span className="amount">$3</span>
                  <span className="period">/month per student</span>
                </div>
                <div className="price-item annual">
                  <div className="annual-top">
                    <span className="old-price">$20</span>
                    <span className="discount-tag">50% OFF</span>
                  </div>
                  <span className="amount">$10</span>
                  <span className="period">/year per student</span>
                </div>
              </div>
              <div className="teacher-bonus">
                <strong>Bonus:</strong> Get a free account for yourself when you subscribe for 5+ students!
              </div>
              <p className="section-instructions">
                Fill the teacher's registration form with desired classes and student names. Accounts delivered in 24 hours.
              </p>
              <Link to="/auth/register" className="pricing-btn-new teacher-btn">
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
              <div className="pricing-info">
                <div className="price-item">
                  <span className="amount">$3</span>
                  <span className="period">/month</span>
                </div>
                <div className="price-item">
                  <span className="amount">$10</span>
                  <span className="period">/year</span>
                </div>
              </div>
              <ul className="feature-list">
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

          <div className="pricing-footer-info">
            <p>Need help choosing? <Link to="/contact">Contact our support team</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Pricing;