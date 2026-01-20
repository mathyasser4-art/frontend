import React from 'react';
import './DemoInfoBanner.css';

function DemoInfoBanner() {
  return (
    <div className="demo-info-banner">
      <div className="demo-info-content">
        <span className="demo-badge">DEMO MODE</span>
        <p className="demo-text">
          You're using <strong>5 demo classes</strong> with pre-loaded students. 
          Assignments created here are for testing only.
        </p>
      </div>
    </div>
  );
}

export default DemoInfoBanner;
