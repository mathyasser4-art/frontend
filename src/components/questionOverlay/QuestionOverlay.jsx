import React from 'react';
import './QuestionOverlay.css';
import { Lock } from 'lucide-react';

/**
 * Overlay shown when the Jet Ski game is locked.
 * Props:
 *   - question: { text:string, options:string[], answer:string }
 *   - solvedCount: number of correctly solved questions so far
 *   - total: total questions required to unlock
 *   - onAnswer: (selectedOption) => void
 *   - feedback: 'correct' | 'wrong' | null
 */
const QuestionOverlay = ({ question, solvedCount, total, onAnswer, feedback }) => {
  const remaining = total - solvedCount;
  const progressPercent = (solvedCount / total) * 100;

  return (
    <div className="question-overlay">
      <div className="overlay-card glass">
        <div className="icon-wrapper">
          <Lock size={48} />
        </div>
        <h3 className="overlay-title">Ready to Race?</h3>
        <p className="overlay-subtitle">
          Solve to unlock: <strong>{remaining} remaining</strong>
        </p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="problem-box">{question?.text}</div>
        <div className="options-grid">
          {question?.options.map((opt, i) => (
            <button key={i} className="option-btn" onClick={() => onAnswer(opt)}>
              {opt}
            </button>
          ))}
        </div>
        {feedback && (
          <div className={`feedback ${feedback}`}>
            {feedback === 'correct' ? 'Excellent! Next one...' : "Oops! Let's try another one."}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionOverlay;
