import React from 'react';
import { X } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import './TutorialVideoModal.css';

function TutorialVideoModal({ isOpen, onClose, role }) {
  const handleClose = () => {
    soundEffects.playClick();
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = role === 'Student'
    ? 'Abacus Heroes - Student Guide'
    : 'Abacus Heroes - Teacher Guide';

  return (
    <div className="tutorial-modal-overlay" onClick={handleClose}>
      <div className="tutorial-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="tutorial-modal-close" onClick={handleClose} aria-label="Close tutorial">
          <X size={24} />
        </button>
        
        <div className="tutorial-modal-header">
          <h2>{modalTitle}</h2>
        </div>

        <div className="tutorial-modal-body">
          <div className="tutorial-tips">
            <p className="tip-title">💡 Quick Tips:</p>
            <ul className="tips-list">
              {role === 'Student' ? (
                <>
                  <li>Check your homework regularly for new assignments</li>
                  <li>Practice questions to improve your skills</li>
                  <li>Use the timer to track your progress</li>
                </>
              ) : (
                <>
                  <li>Create engaging assignments for your students</li>
                  <li>Track student progress with detailed reports</li>
                  <li>Set timers and attempt limits for better control</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialVideoModal;
