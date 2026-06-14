import React from 'react';
import Navbar from '../../components/navbar/Navbar';
import './Privacy.css';
import '../../reusable.css';

function Privacy() {
  return (
    <div className="privacy-page">
      <Navbar />
      <div className="privacy-container">
        <div className="privacy-header">
          <h1>Privacy Policy</h1>
          <p>Last updated: June 14, 2026</p>
        </div>
        
        <div className="privacy-content">
          <p className="privacy-intro">
            At Abacus Heroes, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information when you use our platform.
          </p>

          <div className="privacy-section">
            <h2>1. Information Collection</h2>
            <p>
              We collect basic information such as names, email addresses, and school affiliations when you register for an account. For students, we also collect usage data, such as game scores, practice times, and homework completion status, to provide and improve our educational services.
            </p>
          </div>

          <div className="privacy-section">
            <h2>2. Use of Information</h2>
            <p>
              Your data is used exclusively to operate the Abacus Heroes platform, personalize the learning experience, and allow teachers and parents to monitor student progress. We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
          </div>

          <div className="privacy-section">
            <h2>3. Data Security</h2>
            <p>
              We implement industry-standard security measures, including encryption and secure servers, to protect your personal information from unauthorized access, alteration, or disclosure.
            </p>
          </div>

          <div className="privacy-section">
            <h2>4. User Rights</h2>
            <p>
              You have the right to access, update, or request the deletion of your account and personal data at any time. If you wish to exercise these rights or have any questions about our privacy practices, please contact our support team.
            </p>
          </div>
          
          <div className="privacy-section">
            <h2>5. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
