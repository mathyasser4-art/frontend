import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, MessageSquare, AlertCircle, TrendingUp, Sparkles, Send, Award, Zap, HelpCircle } from 'lucide-react';
import './AIAssignmentInsights.css';

function AIAssignmentInsights({ allAnswers = [], timeSpent = '' }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Parse questions and extract operator analytics + carry/borrow heuristics
  const analyzeQuestions = () => {
    let correctCount = 0;
    let totalCount = 0;
    let unansweredCount = 0;

    const operators = {
      '+': { correct: 0, total: 0, label: t('ai_insights.addition', 'Addition') },
      '-': { correct: 0, total: 0, label: t('ai_insights.subtraction', 'Subtraction') },
      '*': { correct: 0, total: 0, label: t('ai_insights.multiplication', 'Multiplication') },
      '/': { correct: 0, total: 0, label: t('ai_insights.division', 'Division') }
    };

    let totalCarryQ = 0;
    let carryErrors = 0;
    let totalBorrowQ = 0;
    let borrowErrors = 0;
    let generalIncorrect = 0;

    allAnswers.forEach(item => {
      totalCount++;
      if (item.isCorrect) correctCount++;
      if (item.notAnswer || !item.firstAnswer) unansweredCount++;

      // Heuristic analysis of the question string
      const qStr = item.question || '';
      const cleanQ = qStr.replace(/\s+/g, '').toLowerCase();

      // Extract operator and numbers
      const operatorMatch = cleanQ.match(/[\+\-\*x×/÷:]/);
      const matchedOp = operatorMatch ? operatorMatch[0] : '';
      let operator = '';
      if (['+', '-'].includes(matchedOp)) operator = matchedOp;
      else if (['*', 'x', '×'].includes(matchedOp)) operator = '*';
      else if (['/', '÷', ':'].includes(matchedOp)) operator = '/';

      const numMatches = cleanQ.match(/\d+/g) || [];
      const numbers = numMatches.map(n => parseInt(n, 10));

      if (operator && operators[operator]) {
        operators[operator].total++;
        if (item.isCorrect) {
          operators[operator].correct++;
        }
      }

      // Carry & Borrow heuristics
      let hasCarry = false;
      let hasBorrow = false;

      if (numbers.length >= 2) {
        const num1 = numbers[0];
        const num2 = numbers[1];

        if (operator === '+') {
          const s1 = String(num1);
          const s2 = String(num2);
          const maxLen = Math.max(s1.length, s2.length);
          const p1 = s1.padStart(maxLen, '0');
          const p2 = s2.padStart(maxLen, '0');
          for (let i = 0; i < maxLen; i++) {
            if (parseInt(p1[i], 10) + parseInt(p2[i], 10) >= 10) {
              hasCarry = true;
              break;
            }
          }
        } else if (operator === '-') {
          const s1 = String(num1);
          const s2 = String(num2);
          const maxLen = Math.max(s1.length, s2.length);
          const p1 = s1.padStart(maxLen, '0');
          const p2 = s2.padStart(maxLen, '0');
          for (let i = 0; i < maxLen; i++) {
            if (parseInt(p1[i], 10) < parseInt(p2[i], 10)) {
              hasBorrow = true;
              break;
            }
          }
        }
      }

      if (hasCarry) {
        totalCarryQ++;
        if (!item.isCorrect && !item.notAnswer) carryErrors++;
      }
      if (hasBorrow) {
        totalBorrowQ++;
        if (!item.isCorrect && !item.notAnswer) borrowErrors++;
      }
      if (!item.isCorrect && !item.notAnswer && !hasCarry && !hasBorrow) {
        generalIncorrect++;
      }
    });

    return {
      correctCount,
      totalCount,
      unansweredCount,
      operators,
      totalCarryQ,
      carryErrors,
      totalBorrowQ,
      borrowErrors,
      generalIncorrect
    };
  };

  const stats = analyzeQuestions();

  // Parse time spent (e.g. "01:30" or "90")
  const getPacingSeconds = () => {
    if (!timeSpent) return 10; // fallback
    const parts = timeSpent.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    const secs = parseInt(timeSpent, 10);
    return isNaN(secs) ? 10 : secs;
  };

  const totalSecs = getPacingSeconds();
  const avgTimePerQuestion = stats.totalCount > 0 ? totalSecs / stats.totalCount : 0;

  // Calculate Cognitive Profile (scores 0-100)
  const accuracy = stats.totalCount > 0 ? (stats.correctCount / stats.totalCount) * 100 : 0;
  
  const getSpeedScore = () => {
    if (avgTimePerQuestion <= 3) return 100;
    if (avgTimePerQuestion <= 6) return 92;
    if (avgTimePerQuestion <= 10) return 80;
    if (avgTimePerQuestion <= 18) return 65;
    if (avgTimePerQuestion <= 30) return 45;
    return 30;
  };

  const getAttentionScore = () => {
    // Penalities for unanswered questions and errors on non-carry questions
    const unansweredPenalty = stats.totalCount > 0 ? (stats.unansweredCount / stats.totalCount) * 60 : 0;
    const basicErrorPenalty = stats.totalCount > 0 ? (stats.generalIncorrect / stats.totalCount) * 40 : 0;
    return Math.max(15, Math.round(100 - unansweredPenalty - basicErrorPenalty));
  };

  const getConceptScore = () => {
    // Concepts: how well did they do carrying/borrowing if carrying/borrowing was present?
    const totalConceptsQ = stats.totalCarryQ + stats.totalBorrowQ;
    if (totalConceptsQ === 0) return Math.round(accuracy);
    const conceptErrors = stats.carryErrors + stats.borrowErrors;
    const conceptSuccess = totalConceptsQ - conceptErrors;
    return Math.round((conceptSuccess / totalConceptsQ) * 100);
  };

  const speedScore = getSpeedScore();
  const attentionScore = getAttentionScore();
  const conceptScore = getConceptScore();

  // Find strongest & weakest operator areas
  const getOperatorStrengths = () => {
    let strongest = null;
    let weakest = null;
    let maxAcc = -1;
    let minAcc = 101;

    Object.keys(stats.operators).forEach(op => {
      const data = stats.operators[op];
      if (data.total > 0) {
        const acc = (data.correct / data.total) * 100;
        if (acc > maxAcc) {
          maxAcc = acc;
          strongest = data.label;
        }
        if (acc < minAcc) {
          minAcc = acc;
          weakest = data.label;
        }
      }
    });

    return { strongest, weakest };
  };

  const operatorStrengths = getOperatorStrengths();

  const getTutorComments = () => {
    let positive = '';
    let improvement = '';

    // Generate Positive Comment
    if (accuracy >= 85) {
      positive = `Fantastic work! You achieved a stellar accuracy of ${accuracy.toFixed(0)}%. You have a strong grasp of the concepts in this assignment.`;
    } else if (stats.carryErrors === 0 && stats.borrowErrors === 0 && (stats.totalCarryQ + stats.totalBorrowQ > 0)) {
      positive = `Great job on your technique! You did not make a single carry or borrow error, showing that you are applying the Soroban friend rules correctly.`;
    } else if (avgTimePerQuestion <= 8 && avgTimePerQuestion > 0) {
      positive = `Impressive speed! You solved questions at an average of ${avgTimePerQuestion.toFixed(1)} seconds each, which shows excellent finger dexterity and reflex.`;
    } else {
      positive = `Well done on completing this assignment! Your dedication and effort to finish all questions is the best way to master the abacus.`;
    }

    // Generate Improvement Comment
    if (stats.carryErrors > 0 || stats.borrowErrors > 0) {
      const errorType = stats.carryErrors > 0 && stats.borrowErrors > 0 
        ? 'carrying and borrowing' 
        : stats.carryErrors > 0 ? 'carrying' : 'borrowing';
      improvement = `Pay closer attention when ${errorType} columns. Remember to review your 5-Friends and 10-Friends rules to avoid minor column slips.`;
    } else if (accuracy < 75) {
      improvement = `Try to slow down slightly and double-check your bead positions before submitting. Focus on accuracy first, and speed will follow naturally.`;
    } else if (avgTimePerQuestion > 15) {
      improvement = `To improve your speed, try practicing Anzan (mental abacus) to visualize bead movements in your head without physical delays.`;
    } else {
      improvement = `Keep practicing regularly to maintain this great level. Next time, aim for 100% accuracy by double checking the final bead configuration!`;
    }

    return { positive, improvement };
  };

  const tutorComments = getTutorComments();

  // Initialize tutor message
  useEffect(() => {
    const welcome = {
      sender: 'tutor',
      text: t(
        'ai_insights.tutor_welcome',
        `Hi! I'm your AI Soroban Coach. 🧠 I have completed my analysis on your recent assignment.

👍 **Positive Verdict**: ${tutorComments.positive}

🔧 **Next Step**: ${tutorComments.improvement}

How can I help you improve today?`
      )
    };
    setMessages([welcome]);
  }, [allAnswers, timeSpent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = '';

      const query = text.toLowerCase();
      if (query.includes('speed') || query.includes('fast') || query.includes('time')) {
        reply = `Your average solving speed is **${avgTimePerQuestion.toFixed(1)} seconds** per question (Speed Score: **${speedScore}/100**). 

Here are customized training recommendations to boost your pacing:
1. **Fingering Muscle Memory**: Remember that in Soroban, you must use your thumb ONLY for moving lower beads up, and your index finger for all other movements (moving lower beads down, and upper beads up/down).
2. **Mental Projection (Anzan)**: Do not move beads physically if doing mental math. Try to close your eyes for split seconds and project the red/green beads inside your head.
3. **Pacing Drills**: Set a metronome to 60 BPM and try to make one bead movement per beat!`;
      } 
      else if (query.includes('carry') || query.includes('borrow') || query.includes('error') || query.includes('wrong')) {
        const carryOrBorrowErrors = stats.carryErrors + stats.borrowErrors;
        if (carryOrBorrowErrors > 0) {
          reply = `I identified **${carryOrBorrowErrors} carry/borrow column errors** in your assignment. 

Carry and borrow errors usually happen when transitioning across friend borders:
- **Addition Carry Rule**: When adding a digit exceeds 9 on a column, you must add 1 to the left rod and subtract the "Big Friend" (e.g., to add 8: add 10 on the left, subtract 2 on the current rod).
- **Subtraction Borrow Rule**: When you cannot subtract directly from a rod, subtract 10 from the left rod and add the "Big Friend" (e.g., to subtract 7: subtract 10 on the left, add 3 on the current rod).
*Tip: Practice the 5-Friends (+1=+5-4) and 10-Friends combinations daily to reduce carrying delay!*`;
        } else {
          reply = `Excellent! You made **no carrying or borrowing column errors**! Your concept execution on columns is perfect. 

Your incorrect answers were likely due to minor visualization or entry errors. Try verifying each bead position before confirming your answer next time. Keep up the high accuracy!`;
        }
      } 
      else if (query.includes('abacus rules') || query.includes('how to use') || query.includes('friend')) {
        reply = `Abacus mathematics is built on two core bead-group rules:
1. **5-Friends (Little Friends)**: Used when the column value is less than 5.
   - +4 = +5 - 1
   - +3 = +5 - 2
   - +2 = +5 - 3
   - +1 = +5 - 4
2. **10-Friends (Big Friends)**: Used when adding exceeds 9.
   - +9 = +10 - 1
   - +8 = +10 - 2
   - +7 = +10 - 3
   - +6 = +10 - 4
   - +5 = +10 - 5
Always coordinate your thumb (for lower bead up-action) and index finger. Let me know if you want an example!`;
      } 
      else if (query.includes('recommend') || query.includes('next') || query.includes('practice')) {
        const lowestOp = operatorStrengths.weakest;
        reply = `Based on your cognitive profile, here is your customized growth pathway:
- **Focus Topic**: Dedicate your next practice session to **${lowestOp || 'Subtraction'}**.
- **Attention Focus**: Your attention score is **${attentionScore}/100**. Try to avoid clicking answers too quickly without checking the abacus layout.
- **Goal**: Aim for a target time of **${Math.max(3, avgTimePerQuestion * 0.8).toFixed(1)} seconds** per question on your next run. 

Would you like me to walk you through a sample abacus addition sequence?`;
      } 
      else {
        reply = `I'm analyzing your report details (Accuracy: **${accuracy.toFixed(0)}%**, Concept understanding: **${conceptScore}/100**). 

To give you the best advice:
- Ask me **"How can I solve faster?"** to optimize your speed.
- Ask me **"What carry/borrow rules did I fail?"** to diagnose math formulas.
- Let me know if there's any specific operator rule you'd like to review!`;
      }

      setMessages(prev => [...prev, { sender: 'tutor', text: reply }]);
    }, 800);
  };

  const quickPrompts = [
    { text: t('ai_insights.speed_prompt', 'How can I improve my speed?'), query: 'speed' },
    { text: t('ai_insights.errors_prompt', 'Explain my carry/borrow errors'), query: 'carry' },
    { text: t('ai_insights.rules_prompt', 'Explain abacus friends rules'), query: 'abacus rules' },
    { text: t('ai_insights.next_prompt', 'What should I practice next?'), query: 'recommend' }
  ];

  if (stats.totalCount === 0) return null;

  return (
    <div className="ai-insights-container">
      {/* Banner */}
      <div className="ai-banner">
        <div className="ai-banner-title">
          <Sparkles className="sparkle-icon" />
          <h3>{t('ai_insights.title', 'AI Tutor Insights')}</h3>
        </div>
        <p className="ai-banner-subtitle">
          {t('ai_insights.subtitle', 'Dynamic Soroban diagnostics & coaching recommendations')}
        </p>
      </div>

      <div className="ai-insights-grid">
        {/* Left Side: Diagnostics */}
        <div className="ai-diagnostics-card">
          <div className="card-section-title">
            <Brain className="sec-icon purple" />
            <h4>{t('ai_insights.diagnostics', 'AI Tutor Verdict')}</h4>
          </div>

          <div className="ai-judgment-comments">
            {/* Positive Comment Box */}
            <div className="judgment-box positive-box">
              <div className="judgment-header">
                <Award className="judgment-icon text-good" />
                <h5>What You Did Great</h5>
              </div>
              <p>{tutorComments.positive}</p>
            </div>

            {/* Improvement Comment Box */}
            <div className="judgment-box improvement-box">
              <div className="judgment-header">
                <Zap className="judgment-icon text-warn" />
                <h5>Where to Improve</h5>
              </div>
              <p>{tutorComments.improvement}</p>
            </div>
          </div>

          <div className="ai-quick-stats">
            <div className="quick-stat-item">
              <span className="stat-label">Accuracy</span>
              <span className={`stat-value ${accuracy >= 80 ? 'text-good' : accuracy >= 50 ? 'text-warn' : 'text-danger'}`}>{accuracy.toFixed(0)}%</span>
            </div>
            <div className="quick-stat-item">
              <span className="stat-label">Avg Pace</span>
              <span className="stat-value text-info">{avgTimePerQuestion.toFixed(1)}s</span>
            </div>
            <div className="quick-stat-item">
              <span className="stat-label">Carry Errs</span>
              <span className={`stat-value ${stats.carryErrors > 0 ? 'text-warn' : 'text-good'}`}>{stats.carryErrors}</span>
            </div>
            <div className="quick-stat-item">
              <span className="stat-label">Borrow Errs</span>
              <span className={`stat-value ${stats.borrowErrors > 0 ? 'text-warn' : 'text-good'}`}>{stats.borrowErrors}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Chat with AI Tutor */}
        <div className="ai-chat-card">
          <div className="card-section-title">
            <MessageSquare className="sec-icon pink" />
            <h4>{t('ai_insights.chat_title', 'Chat with AI Soroban Tutor')}</h4>
          </div>

          <div className="chat-window">
            <div className="chat-history">
              {messages.map((m, idx) => (
                <div key={idx} className={`chat-bubble-wrapper ${m.sender === 'user' ? 'user-align' : 'tutor-align'}`}>
                  <div className={`chat-bubble ${m.sender === 'user' ? 'user-bubble' : 'tutor-bubble'}`}>
                    {m.sender !== 'user' && <div className="tutor-avatar">🤖</div>}
                    <div className="chat-text-content">
                      {m.text.split('\n').map((line, lIdx) => (
                        <p key={lIdx} style={{ margin: '4px 0' }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="chat-bubble-wrapper tutor-align">
                  <div className="chat-bubble tutor-bubble">
                    <div className="tutor-avatar">🤖</div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Suggesters */}
            <div className="quick-prompts-container">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  className="quick-prompt-btn"
                  onClick={() => handleSendMessage(qp.text)}
                  disabled={isTyping}
                >
                  {qp.text}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="chat-input-bar">
              <input
                type="text"
                className="chat-input"
                placeholder={t('ai_insights.placeholder', 'Ask a question about this assignment...')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(inputValue);
                }}
                disabled={isTyping}
              />
              <button
                className="chat-send-btn"
                onClick={() => handleSendMessage(inputValue)}
                disabled={isTyping || !inputValue.trim()}
              >
                <Send className="send-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAssignmentInsights;
