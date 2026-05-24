import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Award, Sparkles } from 'lucide-react';
import AbacusSimulator from '../abacus/AbacusSimulator';
import soundEffects from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import '../../reusable.css';
import '../../pages/question/Question.css';
import './DemoQuizModal.css';

const DEMO_QUESTIONS = [
    {
        id: 1,
        rows: [
            { op: "", val: "5" },
            { op: "+", val: "3" }
        ],
        choices: ["6", "7", "8", "9"],
        correctAnswer: "8"
    },
    {
        id: 2,
        rows: [
            { op: "", val: "7" },
            { op: "-", val: "2" },
            { op: "+", val: "4" }
        ],
        choices: ["7", "8", "9", "10"],
        correctAnswer: "9"
    },
    {
        id: 3,
        rows: [
            { op: "", val: "10" },
            { op: "+", val: "5" },
            { op: "-", val: "3" }
        ],
        choices: ["11", "12", "13", "14"],
        correctAnswer: "12"
    }
];

function DemoQuizModal({ onClose }) {
    const navigate = useNavigate();
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showAbacus, setShowAbacus] = useState(true);
    const [wrongSelection, setWrongSelection] = useState(null);
    const [correctSelection, setCorrectSelection] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = DEMO_QUESTIONS[currentIdx];

    const handleClose = () => {
        localStorage.setItem('hasSeenDemoQuiz', 'true');
        onClose();
    };

    const handleChoiceClick = (choice) => {
        if (wrongSelection || correctSelection || isFinished) return;

        setSelectedAnswer(choice);

        if (choice === currentQuestion.correctAnswer) {
            // Correct Answer
            setCorrectSelection(choice);
            soundEffects.playCorrect();

            setTimeout(() => {
                if (currentIdx < DEMO_QUESTIONS.length - 1) {
                    // Go to next question
                    setCurrentIdx(prev => prev + 1);
                    setSelectedAnswer(null);
                    setCorrectSelection(null);
                    setWrongSelection(null);
                } else {
                    // Finished last question
                    setIsFinished(true);
                    triggerCelebration();
                }
            }, 1000);
        } else {
            // Wrong Answer
            setWrongSelection(choice);
            soundEffects.playWrong();

            setTimeout(() => {
                setWrongSelection(null);
                setSelectedAnswer(null);
            }, 1000);
        }
    };

    const triggerCelebration = () => {
        soundEffects.playWinSound();
        // Trigger confetti
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6b81', '#70a1ff']
        });
        
        // Continuous light bursts of confetti for 2 seconds
        let end = Date.now() + 2000;
        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const navigateToRegister = () => {
        soundEffects.playClick();
        handleClose();
        window.open('https://m.me/abacusheroes', '_blank');
    };

    const navigateToPricing = () => {
        soundEffects.playClick();
        handleClose();
        window.open('https://m.me/abacusheroes', '_blank');
    };

    return (
        <div className="demo-quiz-overlay" onClick={handleClose}>
            <div className="demo-quiz-card" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="demo-quiz-header d-flex justify-content-space-between align-items-center">
                    <div className="demo-badge d-flex align-items-center">
                        <Sparkles size={16} className="sparkle-icon" />
                        <span>Try Abacus Heroes</span>
                    </div>
                    
                    <div className="demo-header-actions d-flex align-items-center">
                        <div 
                            title="Toggle Abacus" 
                            className="abacus-button" 
                            onClick={() => { soundEffects.playClick(); setShowAbacus(!showAbacus); }}
                        >
                            <i className="fa fa-calculator" aria-hidden="true"></i>
                        </div>
                        <button className="demo-close-btn" onClick={handleClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                {!isFinished ? (
                    <div className="demo-quiz-body">
                        <div className="demo-progress-text">
                            Question {currentIdx + 1} of {DEMO_QUESTIONS.length}
                        </div>

                        {/* Abacus Simulator - Rendered Inline above questions */}
                        {showAbacus && (
                            <div className="demo-abacus-inline">
                                <AbacusSimulator onClose={() => setShowAbacus(false)} />
                            </div>
                        )}
                        
                        <div className="demo-question-content d-flex">
                            {/* Vertical math display inside question box */}
                            <div className="question-form demo-question-box">
                                <div className="question-form-body">
                                    <div className="abacus-grid-view">
                                        <table className="abacus-display-table">
                                            <tbody>
                                                {currentQuestion.rows.map((row, i) => (
                                                    <tr key={i}>
                                                        <td className="op-cell">{row.op}</td>
                                                        <td className="val-cell">{row.val}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* MCQ choices */}
                            <div className="mcq-container demo-mcq-box">
                                <h3 className="mcq-title">Choose the correct answer:</h3>
                                <div className="mcq-answer-layout">
                                    {currentQuestion.choices.map((choice) => {
                                        const isSelected = selectedAnswer === choice;
                                        const isCorrectAns = correctSelection === choice;
                                        const isWrongAns = wrongSelection === choice;
                                        
                                        let choiceClass = "";
                                        if (isSelected) choiceClass = "selected";
                                        if (isCorrectAns) choiceClass = "selected correct-choice";
                                        if (isWrongAns) choiceClass = "selected wrong-choice";

                                        return (
                                            <label 
                                                key={choice} 
                                                className={`mcq-choice demo-choice ${choiceClass}`}
                                                onClick={() => handleChoiceClick(choice)}
                                            >
                                                <input 
                                                    type="radio" 
                                                    value={choice} 
                                                    name={`demo_${currentQuestion.id}`}
                                                    checked={isSelected}
                                                    readOnly 
                                                />
                                                <span className="mcq-text">{choice}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Final Celebratory Screen */
                    <div className="demo-celebration-screen text-center">
                        <div className="celebration-icon-wrapper">
                            <Award size={64} className="award-icon" />
                        </div>
                        <h2 className="celebration-title">Fantastic Job! 🎉</h2>
                        <p className="celebration-subtitle">
                            You successfully solved all the mental arithmetic questions!
                        </p>
                        
                        <div className="celebration-features">
                            <p>✔️ Practice 500+ interactive math worksheets</p>
                            <p>✔️ Create student accounts & automatically track homework</p>
                            <p>✔️ Unlock interactive adventure math games</p>
                        </div>

                        <div className="celebration-actions d-flex flex-direction-column gap-2">
                            <button className="demo-btn-primary" onClick={navigateToRegister}>
                                Join Us Now
                            </button>
                            <button className="demo-btn-secondary" onClick={navigateToPricing}>
                                Try the Free
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DemoQuizModal;
