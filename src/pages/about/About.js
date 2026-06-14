import React from 'react';
import Navbar from '../../components/navbar/Navbar';
import './About.css';
import '../../reusable.css';

function About() {
  return (
    <div className="about-page">
      <Navbar />
      <div className="about-container">
        <div className="about-header">
          <h1>About Abacus Heroes</h1>
          <p>Empowering minds through mental arithmetic and interactive learning.</p>
        </div>
        
        <div className="about-content">
          <div className="about-section">
            <h2>Our Mission</h2>
            <p>
              Abacus Heroes is a revolutionary educational platform designed to make mental arithmetic and abacus learning engaging, interactive, and highly effective. We believe that learning math should be an exciting adventure, not a chore!
            </p>
            <p>
              Our mission is to empower students with rapid calculation skills through gamified learning, while providing teachers and schools with powerful, automated tools to manage classes, assign homework, and track progress seamlessly.
            </p>
          </div>

          <div className="about-section">
            <h2>Why Choose Us?</h2>
            <ul className="about-features">
              <li><strong>Interactive Games:</strong> Practice math while playing fun and engaging games.</li>
              <li><strong>Automated Grading:</strong> Teachers save time with our auto-grading homework system.</li>
              <li><strong>Comprehensive Analytics:</strong> Track progress, identify weaknesses, and improve over time.</li>
              <li><strong>Global Competitions:</strong> Participate in live battles and earn professional certificates.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
