import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';
import { useTranslation } from 'react-i18next';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import API_BASE_URL from '../../config/api.config';
import { adjustQuestionOrderAndShuffleMCQ } from '../../utils/questionShuffle';
import './SuperMarioGame.css';

const parseGridRows = (questionText) => {
  if (!questionText) return null;
  const trimmed = String(questionText).trim();
  if (!trimmed.startsWith('[')) return null;
  try {
    const rows = JSON.parse(trimmed);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const first = rows[0];
    if (
      first.op !== undefined || first.OP !== undefined ||
      first.val !== undefined || first.VAL !== undefined
    ) return rows;
  } catch (e) {}
  return null;
};

const getRowOp = (row) => {
  const op = (row.op !== undefined ? row.op : (row.OP !== undefined ? row.OP : ''));
  return (!op || op.trim() === '') ? '+' : op;
};
const getRowVal = (row) => (row.val !== undefined ? row.val : (row.VAL !== undefined ? row.VAL : ''));

const formatQuestionText = (text) => {
  if (!text) return '';
  const trimmed = String(text).trim();
  if (trimmed.startsWith('[')) return text;
  
  if (trimmed.includes('\n')) {
    return trimmed.split('\n').map(line => line.trim()).join('\n');
  }

  const tokens = trimmed.replace(/=\s*\?$/, '').trim().split(/\s+/);
  if (tokens.length >= 3 && tokens.some(t => t === '+' || t === '-')) {
    let resultLines = [];
    let currentOp = '+';
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok === '+' || tok === '-') {
        currentOp = tok;
      } else if (!isNaN(tok) || /^[\d٠-٩]+$/.test(tok)) {
        resultLines.push((currentOp === '+' && resultLines.length > 0 ? '+' : (currentOp === '-' ? '-' : '')) + tok);
      } else {
        resultLines.push(tok);
      }
    }
    if (resultLines.length > 1) {
      return resultLines.join('\n');
    }
  }

  return text;
};

const QUESTIONS_TO_UNLOCK = 5;

const SuperMarioGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'locked', 'playing', 'revive_locked', 'in_game_lock'
  const [difficulty, setDifficulty] = useState('0');
  const iframeUrl = "/mario/index.html";
  
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [questionsNeeded, setQuestionsNeeded] = useState(QUESTIONS_TO_UNLOCK);

  // === Website Question Bank States ===
  const [customQuestions, setCustomQuestions] = useState(location.state?.customQuestions || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chapterName, setChapterName] = useState(location.state?.chapterName || '');
  const questionTypeID = '65a4963482dbaac16d820fc6'; // MCQ type
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [systemData, setSystemData] = useState([]);
  const [unitData, setUnitData] = useState([]);
  const [loadingWizard, setLoadingWizard] = useState(false);
  const [wizardError, setWizardError] = useState(null);

  useEffect(() => {
    if (questionTypeID) {
      getSystem(setLoadingWizard, setSystemData, questionTypeID);
    }
  }, [questionTypeID]);

  useEffect(() => {
    if (selectedSubject) {
      getUnit(setLoadingWizard, setUnitData, questionTypeID, selectedSubject._id);
    }
  }, [selectedSubject]);

  const translateName = (name) => {
    if (!name) return '';
    const key = `systemNames.${name}`;
    const translated = t(key);
    return translated !== key ? translated : name;
  };

  const handleSelectChapter = (chapter) => {
    soundEffects.playClick();
    setLoadingWizard(true);
    setWizardError(null);
    setChapterName(chapter.chapterName);

    const URL = `${API_BASE_URL}/chapter/getChapterQuestion/${chapter._id}`;
    const Token = localStorage.getItem('O_authWEB');
    fetch(URL, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        ...(Token ? { 'authrization': `pracYas09${Token}`, 'Authorization': `Bearer ${Token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        setLoadingWizard(false);
        const questionsList = (data.message === 'success' && Array.isArray(data.chapter?.questions))
          ? data.chapter.questions
          : (data.data && Array.isArray(data.data.questions))
          ? data.data.questions
          : (Array.isArray(data.questions) ? data.questions : null);

        if (questionsList && questionsList.length > 0) {
          const shuffledQuestions = adjustQuestionOrderAndShuffleMCQ(questionsList);
          setCustomQuestions(shuffledQuestions);
          setCurrentQuestionIndex(0);
          currentQuestionIndexRef.current = 0;
        } else {
          setWizardError(data.message || t('no_questions_found', 'لم يتم العثور على أسئلة في هذا الدرس'));
        }
      })
      .catch(err => {
        setLoadingWizard(false);
        setWizardError(err.message || t('failed_loading_questions', 'فشل في تحميل الأسئلة'));
      });
  };

  const currentQuestionIndexRef = useRef(0);

  const loadNextQuestion = useCallback(() => {
    if (customQuestions && customQuestions.length > 0) {
      const idx = currentQuestionIndexRef.current % customQuestions.length;
      currentQuestionIndexRef.current += 1;
      const q = customQuestions[idx];

      let opts = [];
      if (q.wrongAnswer && Array.isArray(q.wrongAnswer)) {
        opts = [...q.wrongAnswer];
      } else {
        const gen = generateArithmeticMcq('1', 4);
        opts = gen.options;
      }

      const correct = q.correctAnswer || (q.answer && q.answer[0]) || q.answer;
      if (correct !== undefined && !opts.includes(correct)) {
        opts.push(correct);
      }
      
      const shuffledOptions = [...opts].sort(() => Math.random() - 0.5);
      const grid = parseGridRows(q.question);

      setQuestion({
        text: grid ? 'ABACUS_GRID' : formatQuestionText(q.question),
        gridRows: grid,
        answer: String(correct),
        options: shuffledOptions.map(String),
        questionPic: q.questionPic
      });
    } else {
      const q = generateArithmeticMcq(difficulty, 4);
      setQuestion({
        text: formatQuestionText(q.text),
        answer: String(q.answer),
        options: q.options.map(String)
      });
    }
  }, [customQuestions, difficulty]);

  const startGame = async (level) => {
    soundEffects.playClick();
    setDifficulty(level);
    setSolvedCount(0);
    setQuestionsNeeded(1);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'revive_locked' || gameState === 'in_game_lock') {
      loadNextQuestion();
    }
  }, [gameState, loadNextQuestion]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'mario_died') {
        setQuestionsNeeded(1); 
        setSolvedCount(0);
        setGameState('revive_locked');
      } else if (event.data && event.data.type === 'mario_answer') {
        if (question && question.options) {
          const selectedAns = question.options[event.data.index];
          handleAnswer(selectedAns);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [question, gameState]);

  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setQuestionsNeeded(1);
        setSolvedCount(0);
        setGameState('in_game_lock');
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  const handleAnswer = (selectedAns) => {
    if (!question || !question.answer) return;
    if (String(selectedAns).trim() === String(question.answer).trim()) {
      soundEffects.playCorrect();
      setFeedback('correct');
      setTimeout(() => {
        const newCount = solvedCount + 1;
        if (newCount >= questionsNeeded) {
          if (iframeRef.current && iframeRef.current.contentWindow) {
              iframeRef.current.contentWindow.postMessage({ type: 'mario_hide_question' }, '*');
          }
          if (gameState === 'revive_locked') {
             if (iframeRef.current && iframeRef.current.contentWindow) {
                 iframeRef.current.contentWindow.postMessage({ type: 'mario_revive' }, '*');
             }
          } else if (gameState === 'in_game_lock') {
             if (iframeRef.current && iframeRef.current.contentWindow) {
                 iframeRef.current.contentWindow.postMessage({ type: 'mario_resume' }, '*');
             }
          }
          setGameState('playing');
          setSolvedCount(0);
        } else {
          setSolvedCount(newCount);
          loadNextQuestion();
        }
        setFeedback(null);
      }, 800);
    } else {
      soundEffects.playWrong();
      setFeedback('wrong');
      if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'mario_wrong_answer' }, '*');
      }
      setTimeout(() => {
        if (gameState === 'revive_locked') {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({ type: 'mario_hide_question' }, '*');
                iframeRef.current.contentWindow.postMessage({ type: 'mario_die_for_real' }, '*');
            }
            setGameState('playing'); 
        } else {
            loadNextQuestion();
        }
        setFeedback(null);
      }, 1000);
    }
  };

  return (
    <div className="super-mario-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="super-mario-container">
        <div className="super-mario-header">
          <button className="back-btn" onClick={() => navigate('/student/games-menu')}>
            <ArrowLeft size={20} />
            <span>Games Menu</span>
          </button>
        </div>

        {gameState === 'menu' && (
          <div className="super-mario-menu">
            <div className="game-badge">
              <Trophy size={48} color="#fbbf24" />
            </div>
            <h1>Super Mario Bros 🍄</h1>
            <p>{t('superMario.selectWorksheet', 'اختر ورقة العمل لحل الأسئلة وفتح المغامرة!')}</p>
            
            {wizardError && (
              <p style={{ color: '#ef4444', fontSize: '0.95rem', margin: '0.5rem 0' }}>{wizardError}</p>
            )}

            {!customQuestions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '500px', margin: '0 auto 1.5rem', width: '100%' }}>
                {loadingWizard ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>{t('loading_worksheets', 'جاري تحميل أوراق العمل...')}</p>
                ) : systemData.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>{t('loading_worksheets', 'جاري تحميل أوراق العمل...')}</p>
                ) : (
                  <>
                    <select
                      value={selectedSystemId || ''}
                      onChange={(e) => {
                        setSelectedSystemId(e.target.value);
                        setSelectedSubject(null);
                        setSelectedUnitId(null);
                        setUnitData([]);
                      }}
                      style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #ef4444', fontSize: '1rem', background: '#f8fafc' }}
                    >
                      <option value="" disabled>{t('mathRacer.select_system', 'اختر النظام التعليمي...')}</option>
                      {systemData.map(system => (
                        <option key={system._id} value={system._id}>{translateName(system.systemName)}</option>
                      ))}
                    </select>

                    {selectedSystemId && (
                      <select
                        value={selectedSubject?._id || ''}
                        onChange={(e) => {
                          const system = systemData.find(s => s._id === selectedSystemId);
                          const subject = system?.subjects?.find(sub => sub._id === e.target.value);
                          if (subject) {
                            soundEffects.playClick();
                            setSelectedSubject(subject);
                            setSelectedUnitId(null);
                          }
                        }}
                        style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #ef4444', fontSize: '1rem', background: '#f8fafc' }}
                      >
                        <option value="" disabled>{t('mathRacer.select_subject', 'اختر المادة الدراسية...')}</option>
                        {systemData.find(s => s._id === selectedSystemId)?.subjects?.map(subject => (
                          <option key={subject._id} value={subject._id}>{translateName(subject.subjectName)}</option>
                        ))}
                      </select>
                    )}

                    {selectedSubject && unitData.length > 0 && (
                      <>
                        <select
                          value={selectedUnitId || ''}
                          onChange={(e) => {
                            soundEffects.playClick();
                            setSelectedUnitId(e.target.value);
                          }}
                          style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #ef4444', fontSize: '1rem', background: '#f8fafc' }}
                        >
                          <option value="" disabled>{t('mathRacer.select_unit', 'اختر الوحدة الدراسية...')}</option>
                          {unitData.map(unit => (
                            <option key={unit._id} value={unit._id}>{translateName(unit.unitName)}</option>
                          ))}
                        </select>

                        {selectedUnitId && (
                          <select
                            value=""
                            onChange={(e) => {
                              const unit = unitData.find(u => u._id === selectedUnitId);
                              const chapter = unit?.chapters?.find(c => c._id === e.target.value);
                              if (chapter) handleSelectChapter(chapter);
                            }}
                            style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid #ef4444', fontSize: '1rem', background: '#f8fafc' }}
                          >
                            <option value="" disabled>{t('select_chapter', 'اختر الدرس / الورقة...')}</option>
                            {unitData.find(u => u._id === selectedUnitId)?.chapters?.map(chapter => (
                              <option key={chapter._id} value={chapter._id}>📄 {translateName(chapter.chapterName)}</option>
                            ))}
                          </select>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div style={{ margin: '1rem auto', maxWidth: '500px', padding: '0.8rem 1.2rem', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>✓ {t('selected', 'تم تحديد')}: <strong>{chapterName}</strong> ({customQuestions.length} {t('questions', 'أسئلة')})</span>
                <br />
                <button 
                  onClick={() => { setCustomQuestions(null); setChapterName(''); }}
                  style={{ marginTop: '0.5rem', padding: '0.4rem 1.2rem', borderRadius: '8px', border: '1px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  {t('change', 'تغيير')}
                </button>
              </div>
            )}
            
            <div className="difficulty-selection">
              <button className="diff-card easy" onClick={() => startGame('0')}>
                <span className="lvl">Level 0</span>
                <span className="type">Beginner</span>
              </button>
              <button className="diff-card medium" onClick={() => startGame('1')}>
                <span className="lvl">Level 1</span>
                <span className="type">Explorer</span>
              </button>
              <button className="diff-card hard" onClick={() => startGame('2')}>
                <span className="lvl">Level 2</span>
                <span className="type">Adventurer</span>
              </button>
              <button className="diff-card expert" onClick={() => startGame('3')}>
                <span className="lvl">Level 3</span>
                <span className="type">Legend</span>
              </button>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'locked' || gameState === 'revive_locked' || gameState === 'in_game_lock') && (
          <div className="game-view-area" ref={containerRef}>
            <FullscreenButton targetRef={containerRef} />
            <iframe 
              ref={iframeRef}
              src={iframeUrl}
              className="super-mario-iframe"
              title="Super Mario Bros"
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />

            {/* Side-by-Side 2x2 Question Modal */}
            {(gameState === 'locked' || gameState === 'revive_locked' || gameState === 'in_game_lock') && question && (
              <div className="super-mario-lock-overlay">
                <div className="mario-math-card" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  <div className="mario-question-section">
                    <div className="mario-math-badge">
                      {gameState === 'revive_locked' ? '❤️ REVIVE CHALLENGE' : gameState === 'in_game_lock' ? '⚡ MATH CHECKPOINT' : `🎯 UNLOCK (${solvedCount + 1}/${questionsNeeded})`}
                    </div>

                    {question.text === 'ABACUS_GRID' && question.gridRows ? (
                      <div className="racer-abacus-grid-view">
                        <table className="racer-abacus-display-table" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                          <tbody>
                            {question.gridRows.map((row, i) => (
                              <tr key={i}>
                                <td className="op-cell">{getRowOp(row)}</td>
                                <td className="val-cell">{getRowVal(row)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="mario-math-text" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate', whiteSpace: 'pre-wrap' }}>
                        {question.text}
                      </div>
                    )}

                    {question.questionPic && (
                      <img src={question.questionPic} alt="Question Diagram" className="mario-question-img" />
                    )}
                  </div>

                  <div className="mario-answer-section">
                    <div className="mario-options-grid">
                      {question.options?.map((opt, i) => (
                        <button 
                          key={i} 
                          className="mario-option-btn" 
                          onClick={() => handleAnswer(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {feedback && (
                    <div className={`mario-feedback-banner ${feedback}`}>
                      {feedback === 'correct' ? '🎉 Correct! Super Jump!' : '❌ Incorrect! Try Again!'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperMarioGame;
