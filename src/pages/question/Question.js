import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../logo.png';
import avatarExam from '../../img/avatar-exam.png';
import profileImg from '../../img/avatar-profile.png';
import QuestionLoading from '../../components/questionLoading/QuestionLoading';
import Navbar from '../../components/navbar/Navbar';

import getQuestion from '../../api/question/getQuestion.api';
import createAssignment from '../../api/assignment/createAssignment.api';
import getClass from '../../api/teacher/getClass.api';
import checked from '../../api/question/checkedAnswer.api';
import API_BASE_URL from '../../config/api.config';
import AbacusSimulator from '../../components/abacus/AbacusSimulator';
import soundEffects from '../../utils/soundEffects';
import { ArrowRight, Maximize2, Minimize2, Printer } from 'lucide-react';
import '../../reusable.css';
import './Question.css';
import jsPDF from 'jspdf';

// ── Abacus grid helpers ───────────────────────────────────────────────────────

// Accepts both lowercase (op/val) and uppercase (OP/VAL) key formats.
// Robust: trims whitespace, handles parse errors gracefully.
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

const getRowOp  = (row) => (row.op  !== undefined ? row.op  : (row.OP  !== undefined ? row.OP  : ''));
const getRowVal = (row) => (row.val !== undefined ? row.val : (row.VAL !== undefined ? row.VAL : ''));

const renderQuestion = (question) => {
    const gridRows = parseGridRows(question?.question);
    if (gridRows) {
        return (
            <div className="abacus-grid-view">
                <table className="abacus-display-table">
                    <tbody>
                        {gridRows.map((row, i) => (
                            <tr key={i}>
                                <td className="op-cell">{getRowOp(row)}</td>
                                <td className="val-cell">{getRowVal(row)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    return <pre>{question?.question}</pre>;
};

// Helper functions for PDF worksheet generation
const buildWorksheetLines = (question, index, pdf, maxWidth) => {
    const rawLines = [`Q${index + 1}`];

    const grid = parseGridRows(question?.question);
    if (grid) {
        rawLines.push(...grid.map(row => `${getRowOp(row)} ${getRowVal(row)}`.trim()));
    } else if (question?.question) {
        rawLines.push(...String(question.question).split('\n').filter(line => line.trim()));
    }

    if (question?.typeOfAnswer === 'MCQ' && Array.isArray(question?.wrongAnswer)) {
        rawLines.push('Options:');
        question.wrongAnswer.forEach((choice, choiceIndex) => {
            rawLines.push(`${String.fromCharCode(65 + choiceIndex)}. ${choice}`);
        });
    }

    if (question?.typeOfAnswer === 'Graph') {
        rawLines.push('Choose the correct graph option.');
    }

    if (question?.questionPic) {
        rawLines.push('[This question includes an image in the app view.]');
    }

    return rawLines.flatMap(line => pdf.splitTextToSize(String(line), maxWidth));
};

// ── Arabic digit normaliser ───────────────────────────────────────────────────
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const normalizeToWesternDigits = (str) => {
    if (!str) return str;
    return String(str)
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => ARABIC_DIGITS.indexOf(d).toString())
        .trim();
};

// ─────────────────────────────────────────────────────────────────────────────

function Question() {
    const { t } = useTranslation();
    
    // State for Abacus visibility
    const [showAbacus, setShowAbacus] = useState(false);

    // State for Flash Mode
    const [flashMode, setFlashMode] = useState(false);
    const [currentFlashLine, setCurrentFlashLine] = useState(0);
    const [isFlashing, setIsFlashing] = useState(false);
    const [flashSpeed, setFlashSpeed] = useState(1.0); // Default 1 second
    const [hasFlashedOnce, setHasFlashedOnce] = useState(false); // Track if flashing has started at least once

    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    const [showReportDropdown, setShowReportDropdown] = useState(false);
    const reportRef = useRef(null);

    const handleReportQuestion = async (issueType) => {
        if (!thisQuestion?._id) return;
        soundEffects.playClick();
        try {
            const response = await fetch(`${API_BASE_URL}/question/report-error`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authrization': `pracYas09${localStorage.getItem('O_authWEB')}`
                },
                body: JSON.stringify({
                    questionID: thisQuestion._id,
                    issueType: issueType,
                    teacherComment: `Reported as ${issueType} by teacher`
                })
            });
            const data = await response.json();
            if (data.message === 'success') {
                setFlaggedQuestions(prev => ({
                    ...prev,
                    [thisQuestion._id]: data.status === 'reported' ? issueType : null
                }));
            }
        } catch (err) {
            console.error('Failed to report question:', err);
        }
        setShowReportDropdown(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (reportRef.current && !reportRef.current.contains(event.target)) {
                setShowReportDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [questionData, setQuestionData] = useState();
    const [thisQuestion, setThisQuestion] = useState();
    const [numberOfQuestion, setNumberOfQuestion] = useState([]);
    const [thisQuestionNumber, setThisQuestionNumber] = useState();
    const [loading, setLoading] = useState(true);
    const [checkLoading, setCheckLoading] = useState(false);
    const [loadingOperation, setLoadingOperation] = useState(false);
    const [isCorrect, setIsCorrect] = useState(true);
    const [isCheckingAnswers, setIsCheckingAnswers] = useState(false);
    const audioRef = useRef(null);
    const [totalSummation, setTotalSummation] = useState(0);
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState(null);
    let [points, setPoints] = useState(0);
    const [questionList, setQuestionList] = useState([]);
    const [classesList, setClassesList] = useState([]);
    const [classesBox, setClassesBox] = useState([]);
    let [classSelector, setClassSelector] = useState('');

    const audioRefCorrect = useRef(null);
    const audioRefWrong = useRef(null);


    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handleUserInteraction = () => {
            audio.play().catch(error => console.log('Audio playback failed:', error));
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        };
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        return () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        };
    }, []);

    let [pocketNumber, setPocketNumber] = useState(0);
    let [timer, setTimer] = useState('');
    let [attempts, setAttempts] = useState('');
    let [startDate, setStartDate] = useState('');
    let [expiryData, setExpiryData] = useState('');
    let [title, setTitle] = useState('');
    let [answeredQuestions, setAnsweredQuestions] = useState(0);
    const [forceFlashMode, setForceFlashMode] = useState(false);
    const [assignmentFlashSpeed, setAssignmentFlashSpeed] = useState(1.0);

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Keyboard Variables
    const [isArabic, setIsArabic] = useState(false);
    const [showKeyboard, setShowKeyboard] = useState(false);
    const inputRef = useRef(null);
    const keyboardRef = useRef(null);
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const { chapterID, questionTypeID, subjectID } = useParams();
    const isAuth = localStorage.getItem('O_authWEB');
    const role = localStorage.getItem('auth_role');

    // PDF download function for worksheet
    const downloadWorksheetPDF = () => {
        if (!Array.isArray(questionData) || questionData.length === 0) return;

        soundEffects.playClick();

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const marginX = 14;
        const maxWidth = pageWidth - (marginX * 2);

        const drawHeader = (pdfInstance, isFirstPage = false) => {
            // Draw logo at top-right
            const logoWidth = 28;
            const logoHeight = 8;
            const logoX = pageWidth - marginX - logoWidth;
            const logoY = 12;
            try {
                pdfInstance.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
            } catch (err) {
                console.error("Failed to add logo to PDF", err);
            }

            if (isFirstPage) {
                let headerY = 18;
                pdfInstance.setFont('helvetica', 'bold');
                pdfInstance.setFontSize(18);
                pdfInstance.setTextColor(44, 62, 80);
                pdfInstance.text('Question Worksheet', marginX, headerY);
                headerY += 8;

                pdfInstance.setFont('helvetica', 'normal');
                pdfInstance.setFontSize(10);
                pdfInstance.setTextColor(110, 110, 110);
                pdfInstance.text(`Questions: ${questionData.length} | Chapter: ${chapterID}`, marginX, headerY);
                
                headerY += 6;
                pdfInstance.setDrawColor(220, 225, 230);
                pdfInstance.setLineWidth(0.5);
                pdfInstance.line(marginX, headerY, pageWidth - marginX, headerY);
                
                return headerY + 8;
            } else {
                pdfInstance.setDrawColor(220, 225, 230);
                pdfInstance.setLineWidth(0.5);
                pdfInstance.line(marginX, 22, pageWidth - marginX, 22);
                return 28;
            }
        };

        let y = drawHeader(pdf, true);

        // Group questions into rows of 5
        const numCols = 5;
        const colGap = 3;
        const colWidth = (maxWidth - (colGap * (numCols - 1))) / numCols;

        for (let i = 0; i < questionData.length; i += numCols) {
            const chunk = questionData.slice(i, i + numCols);
            
            const chunkWithLines = chunk.map((q, chunkIdx) => {
                const questionIndex = i + chunkIdx;
                const lines = buildWorksheetLines(q, questionIndex, pdf, colWidth - 4);
                const blockHeight = (lines.length * 5) + 8;
                return { q, lines, blockHeight };
            });

            const maxRowHeight = Math.max(...chunkWithLines.map(item => item.blockHeight));

            if (y + maxRowHeight > pageHeight - 14) {
                pdf.addPage();
                y = drawHeader(pdf, false);
            }

            chunkWithLines.forEach((item, colIdx) => {
                const x = marginX + colIdx * (colWidth + colGap);
                
                pdf.setDrawColor(224, 224, 224);
                pdf.setLineWidth(0.2);
                pdf.roundedRect(x, y, colWidth, maxRowHeight, 3, 3);

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.setTextColor(55, 65, 81);
                
                item.lines.forEach((line, lineIdx) => {
                    pdf.text(line, x + 2, y + 6 + (lineIdx * 5));
                });
            });

            y += maxRowHeight + colGap;
        }

        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        pdf.save(`question-worksheet-${chapterID}-${timestamp}.pdf`);
    };

    useEffect(() => {
        const handleGetQuestion = () => {
            getQuestion(setLoading, setQuestionData, setThisQuestion, setNumberOfQuestion, setThisQuestionNumber, setTotalSummation, chapterID);
            if (isAuth) {
                getClass(setLoading, setClassesList);
            }
        };
        handleGetQuestion();
    }, [chapterID, isAuth]);

    useEffect(() => {
        let cartonaList = localStorage.getItem('cartona');
        if (cartonaList) {
            cartonaList = JSON.parse(cartonaList);
            setQuestionList(cartonaList);
            setPocketNumber(cartonaList.length);
        }
    }, []);

    const handleButtonClick = (digit) => {
        setAnswer(prev => prev + digit);
    };

    const toggleLanguage = () => {
        setIsArabic(prev => !prev);
    };

    const handleInputFocus = (e) => {
        e.preventDefault();
        setShowKeyboard(true);
    };

    // Auto-show keyboard for Essay questions and keep it open
    useEffect(() => {
        if (thisQuestion?.typeOfAnswer === 'Essay') {
            setShowKeyboard(true);
        } else {
            setShowKeyboard(false);
        }
    }, [thisQuestion]);

    const renderDigits = () => {
        const digits = isArabic ? arabicDigits : englishDigits;
        
        // Updated layout: 3-column grid (same as Assignment page)
        // Row 1: 7,8,9; Row 2: 4,5,6; Row 3: 1,2,3; Row 4: 0,×,123
        return (
            <>
                {/* Row 1: 7, 8, 9 */}
                <button onClick={() => handleButtonClick(digits[7])} className="digit-button digit-num">{digits[7]}</button>
                <button onClick={() => handleButtonClick(digits[8])} className="digit-button digit-num">{digits[8]}</button>
                <button onClick={() => handleButtonClick(digits[9])} className="digit-button digit-num">{digits[9]}</button>
                
                {/* Row 2: 4, 5, 6 */}
                <button onClick={() => handleButtonClick(digits[4])} className="digit-button digit-num">{digits[4]}</button>
                <button onClick={() => handleButtonClick(digits[5])} className="digit-button digit-num">{digits[5]}</button>
                <button onClick={() => handleButtonClick(digits[6])} className="digit-button digit-num">{digits[6]}</button>
                
                {/* Row 3: 1, 2, 3 */}
                <button onClick={() => handleButtonClick(digits[1])} className="digit-button digit-num">{digits[1]}</button>
                <button onClick={() => handleButtonClick(digits[2])} className="digit-button digit-num">{digits[2]}</button>
                <button onClick={() => handleButtonClick(digits[3])} className="digit-button digit-num">{digits[3]}</button>
                
                {/* Row 4: 0, ×, 123 */}
                <button onClick={() => handleButtonClick(digits[0])} className="digit-button digit-num">{digits[0]}</button>
                <button onClick={handleDelete} className='digit-button digit-action'>×</button>
                <button onClick={toggleLanguage} className='digit-button digit-action'>
                    {isArabic ? '123' : '١٢٣'}
                </button>
            </>
        );
    };

    const handleDelete = () => {
        setAnswer(prev => prev.slice(0, -1));
    };

    // Flash Mode Functions
    const getQuestionLines = () => {
        if (!thisQuestion?.question) return [];
        const gridRows = parseGridRows(thisQuestion.question);
        if (gridRows) return gridRows.map(row => `${getRowOp(row)}${getRowVal(row)}`);
        return thisQuestion.question.split('\n').filter(line => line.trim());
    };

    const toggleFullscreen = () => {
        soundEffects.playClick();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(err => console.log('Fullscreen error:', err));
        } else {
            document.exitFullscreen?.();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFlashMode = () => {
        soundEffects.playClick();
        setFlashMode(prev => !prev);
        setIsFlashing(false);
        setCurrentFlashLine(0);
    };

    const startFlashing = () => {
        soundEffects.playClick();
        setIsFlashing(true);
        setCurrentFlashLine(0);
        setHasFlashedOnce(true); // Mark that flashing has been initiated
    };

    // Flash Mode Animation Effect with gap between lines - STOPS after one loop
    useEffect(() => {
        if (flashMode && isFlashing) {
            const lines = getQuestionLines();
            
            if (currentFlashLine < lines.length) {
                // Show line for selected duration, then 0.1s gap before next line
                const displayTime = flashSpeed * 1000; // Convert to milliseconds
                const timer = setTimeout(() => {
                    setCurrentFlashLine(prev => prev + 1);
                }, displayTime + 100); // Display time + 0.1 second gap
                
                return () => clearTimeout(timer);
            } else {
                // All lines shown, STOP flashing (one loop only)
                setIsFlashing(false);
            }
        }
    }, [flashMode, isFlashing, currentFlashLine, flashSpeed]);

    // Reset flash animation when question changes, auto-start if already flashed once
    useEffect(() => {
        if (flashMode) {
            setCurrentFlashLine(0);
            // Auto-start flashing for new questions if user has already started flashing once
            if (hasFlashedOnce) {
                setIsFlashing(true);
            }
        } else {
            setIsFlashing(false);
            setCurrentFlashLine(0);
        }
    }, [thisQuestion?._id, flashMode, hasFlashedOnce]);

    const nextQuestion = () => {
        soundEffects.playClick();
        const activeNumber = parseInt(document.querySelector('.active-question').innerText);
        
        // Check if this is the last question - auto-end exam
        if (activeNumber === questionData.length) {
            openResulPopup();
            return;
        }
        
        if (activeNumber < questionData.length) {
            const newNumber = activeNumber + 1;
            document.querySelectorAll('.question-number p').forEach(p => {
                p.classList.remove('active-question');
                if (parseInt(p.innerText) === newNumber) {
                    p.classList.add('active-question');
                }
            });
            const question = questionData[newNumber - 1];
            setThisQuestion(question);
            setThisQuestionNumber(newNumber);
            setAnswer(question.questionAnswer || '');
            setError('');
        }
    };

    const previousQuestion = () => {
        soundEffects.playClick();
        const activeNumber = parseInt(document.querySelector('.active-question').innerText);
        if (activeNumber > 1) {
            const newNumber = activeNumber - 1;
            document.querySelectorAll('.question-number p').forEach(p => {
                p.classList.remove('active-question');
                if (parseInt(p.innerText) === newNumber) {
                    p.classList.add('active-question');
                }
            });
            const question = questionData[newNumber - 1];
            setThisQuestion(question);
            setThisQuestionNumber(newNumber);
            setAnswer(question.questionAnswer || '');
            setError('');
        }
    };

    const putQuestion = (e) => {
        soundEffects.playClick();
        // Save current answer before switching questions
        if (answer !== '' && thisQuestion) {
            const currentIndex = questionData.findIndex(item => item._id === thisQuestion._id);
            if (currentIndex !== -1) {
                questionData[currentIndex].questionAnswer = answer;
                // Fire background check only if not already synced
                if (!questionData[currentIndex].checked) {
                    syncAnswerWithBackend(thisQuestion._id, answer, currentIndex);
                }
            }
        }
        document.querySelectorAll('.question-number p').forEach(p => p.classList.remove('active-question'));
        e.target.classList.add('active-question');
        const questionIndex = parseInt(e.target.innerText) - 1;
        setThisQuestion(questionData[questionIndex]);
        setThisQuestionNumber(questionIndex + 1);
        setAnswer(questionData[questionIndex].questionAnswer || '');
        setError('');
    };

    const showAlert = () => {
        audioRefWrong.current.play();
        const alertEl = document.querySelector('.alert-question');
        alertEl.classList.add('alert-active');
        setTimeout(() => alertEl.classList.remove('alert-active'), 3500);
    };

    const showeEndAlert = () => {
        const alertEl = document.querySelector('.alert-question-end');
        alertEl.classList.add('alert-active');
        setTimeout(() => alertEl.classList.remove('alert-active'), 3500);
    };

    const showAlertSuccess = () => {
        audioRefCorrect.current.play();
        const alertEl = document.querySelector('.alert');
        alertEl.classList.add('alert-active');
        setTimeout(() => alertEl.classList.remove('alert-active'), 3500);
    };

    const openModelAnswer = () => {
        const popup = document.querySelector('.model-answer-popup');
        popup.classList.replace('d-none', 'd-flex');
        setTimeout(() => {
            popup.classList.remove('answer-popup-hide');
            popup.querySelector('.popup-container').classList.remove('popup-top');
        }, 50);
    };

    const closeModelAnswer = () => {
        const popup = document.querySelector('.model-answer-popup');
        popup.classList.add('answer-popup-hide');
        popup.querySelector('.popup-container').classList.add('popup-top');
        setTimeout(() => popup.classList.replace('d-flex', 'd-none'), 300);
    };

    const handleChecked = (value) => {
        setAnswer(value);
        // For MCQ and Graph questions, save answer and move to next
        if (thisQuestion?.typeOfAnswer === 'MCQ' || thisQuestion?.typeOfAnswer === 'Graph') {
            const index = questionData.findIndex(item => item._id === thisQuestion._id);
            questionData[index].questionAnswer = value;
            // Fire background check immediately on MCQ/Graph selection
            syncAnswerWithBackend(thisQuestion._id, value, index);
            setTimeout(() => {
                nextQuestion();
            }, 300);
        }
    };

    // Eagerly check a single answer in the background (fire & forget).
    // Marks question.checked = true on success, false on failure (safety catch).
    const syncAnswerWithBackend = async (questionId, questionAnswer, index) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/question/checkTheAnswer/${questionId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questionAnswer: normalizeToWesternDigits(questionAnswer) })
                }
            );
            const result = await response.json();
            questionData[index].correct = result.message === 'success';
            questionData[index].checked = true;
        } catch (err) {
            console.error('Background sync failed for question', questionId, err);
            questionData[index].checked = false; // Will be re-checked at End Exam
        }
    };

    const checkedQuestion = () => {
        if (answer) {
            setError('');
            const index = questionData.findIndex(item => item._id === thisQuestion._id);
            questionData[index].questionAnswer = answer;
            // Fire background check — don't await, student moves on immediately
            syncAnswerWithBackend(thisQuestion._id, answer, index);

            // Check if this is the last question - auto-end exam
            if (thisQuestionNumber === questionData.length) {
                openResulPopup();
            } else {
                nextQuestion();
            }
        } else {
            setError('There is no answer yet!!');
        }
    };

    const openResulPopup = () => {
        // Hide keyboard when showing results
        setShowKeyboard(false);
        // Start checking all answers (including unanswered ones)
        setIsCheckingAnswers(true);
        checkAllAnswers();
    };

    const checkAllAnswers = async () => {
        const updatedQuestionData = [...questionData];

        // Only questions with an answer that weren't synced in the background
        const needsCheck = questionData
            .map((q, i) => ({ q, i }))
            .filter(({ q }) => q.questionAnswer && q.questionAnswer !== '' && !q.checked);

        // Safety catch: run these remaining ones in parallel (not sequential)
        await Promise.all(needsCheck.map(async ({ q, i }) => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/question/checkTheAnswer/${q._id}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ questionAnswer: normalizeToWesternDigits(q.questionAnswer) })
                    }
                );
                const result = await response.json();
                updatedQuestionData[i].correct = result.message === 'success';
            } catch (error) {
                console.error('Error checking question:', error);
                updatedQuestionData[i].correct = false;
            }
        }));

        // Tally results (using cached correct values for already-synced questions)
        let totalPoints = 0;
        let correctAnswers = 0;
        updatedQuestionData.forEach((q, i) => {
            if (!q.questionAnswer || q.questionAnswer === '') {
                updatedQuestionData[i].correct = false;
            }
            if (updatedQuestionData[i].correct === true) {
                totalPoints += questionData[i].questionPoints;
                correctAnswers++;
            }
        });

        setQuestionData(updatedQuestionData);
        setPoints(totalPoints);
        setAnsweredQuestions(correctAnswers);
        setIsCheckingAnswers(false);

        soundEffects.playWinSound();
        const popup = document.querySelector('.result-popup');
        popup.classList.replace('d-none', 'd-flex');
        setTimeout(() => {
            popup.classList.remove('result-popup-hide');
            popup.querySelector('.result-popup-container').classList.remove('popup-top');
        }, 50);
    };


    const showPocketError = () => {
        const alertEl = document.querySelector('.alert-question-error-pocket');
        alertEl.classList.add('alert-active');
        setTimeout(() => alertEl.classList.remove('alert-active'), 3500);
    };

    const showPocketSucsses = () => {
        const alertEl = document.querySelector('.alert-question-success-pocket');
        alertEl.classList.add('alert-active');
        setTimeout(() => alertEl.classList.remove('alert-active'), 3500);
    };

    const storeAtCarton = (questions) => {
        localStorage.setItem('cartona', JSON.stringify(questions));
    };

    const addToPocket = () => {
        if (questionList.some(q => q._id === thisQuestion._id)) {
            showPocketError();
        } else {
            const newQuestionList = [...questionList, thisQuestion];
            setQuestionList(newQuestionList);
            setPocketNumber(newQuestionList.length);
            storeAtCarton(newQuestionList);
            showPocketSucsses();
        }
    };

    const addAllToPocket = () => {
        // Merge existing questions with new ones, filtering out duplicates
        const existingIds = questionList.map(q => q._id);
        const newQuestions = questionData.filter(q => !existingIds.includes(q._id));
        const newQuestionList = [...questionList, ...newQuestions];
        
        setQuestionList(newQuestionList);
        setPocketNumber(newQuestionList.length);
        storeAtCarton(newQuestionList);
        showPocketSucsses();
    };

    const removeFromPocket = (questionID) => {
        const newPocket = questionList.filter(q => q._id !== questionID);
        setQuestionList(newPocket);
        setPocketNumber(newPocket.length);
        storeAtCarton(newPocket);
        if (newPocket.length === 0) closeQuestionList();
    };

    const openQuestionList = () => {
        const popup = document.querySelector('.question-list-popup');
        popup.classList.replace('d-none', 'd-flex');
        setTimeout(() => {
            popup.classList.remove('class-popup-hide');
            popup.querySelector('.question-list-container').classList.remove('class-top');
        }, 50);
    };

    const closeQuestionList = () => {
        setError(null);
        const popup = document.querySelector('.question-list-popup');
        popup.classList.add('class-popup-hide');
        popup.querySelector('.question-list-container').classList.add('class-top');
        setTimeout(() => popup.classList.replace('d-flex', 'd-none'), 300);
    };

    const handleCreateAssignment = () => {
        if (classesBox.length === 0 || !title) {
            setError(t('questionPage.mustSelectClassAndTitle'));
        } else if (startDate && !expiryData) {
            setError(t('questionPage.mustAddExpiryDate'));
        } else if (!startDate && expiryData) {
            setError(t('questionPage.mustAddStartDate'));
        } else {
            const data = {
                questions: questionList.map(q => q._id),
                totalPoints: questionList.reduce((sum, q) => sum + q.questionPoints, 0),
                timer: timer || undefined,
                attemptsNumber: 1,
                startDate: startDate || undefined,
                endDate: expiryData || undefined,
                classes: classesBox.map(c => c._id),
                title,
                forceFlashMode: forceFlashMode,
                flashSpeed: forceFlashMode ? assignmentFlashSpeed : undefined
            };
            createAssignment(data, setError, setLoadingOperation, setPocketNumber, setQuestionList, closeQuestionList, setTimer, setExpiryData, setStartDate, setTitle, setClassesBox, setForceFlashMode, setAssignmentFlashSpeed);
        }
    };

    const addClassToBox = () => {
        if (!classSelector || classSelector === t('questionPage.selectClass')) {
            setError(t('questionPage.mustSelectClassFirst'));
        } else {
            setError(null);
            if (classSelector === t('questionPage.allClasses')) {
                setClassesBox(classesList);
            } else if (!classesBox.some(c => c.class === classSelector)) {
                const classToAdd = classesList.find(c => c.class === classSelector);
                if (classToAdd) setClassesBox(prev => [...prev, classToAdd]);
            } else {
                setError(t('questionPage.classAlreadyAdded'));
            }
        }
    };

    const removeClassFromBox = (thisClass) => {
        setClassesBox(prev => prev.filter(c => c.class !== thisClass));
    };

    const removeAssignment = () => {
        setPocketNumber(0);
        setQuestionList([]);
        setTimer('');
        setExpiryData('');
        setStartDate('');
        setTitle('');
        setClassesBox([]);
        setForceFlashMode(false);
        setAssignmentFlashSpeed(1.0);
        closeQuestionList();
        localStorage.removeItem('cartona');
    };

    return (
        <>

            <audio ref={audioRef} src="/audio/birds sound no.mp3" loop preload="auto" />
            <audio ref={audioRefCorrect} src="/audio/correct.mp3" preload="auto" />
            <audio ref={audioRefWrong} src="/audio/wrong.mp3" preload="auto" />

            <div className={isFullscreen ? 'fullscreen-navbar-hidden' : ''}>
                <Navbar />
            </div>

            {loading ? <QuestionLoading /> : (
                <div className='question-container d-flex justify-content-center flex-direction-column align-items-center'>
                    <div className='question-number d-flex'>
                        {numberOfQuestion.map((item, index) => {
                            const question = questionData[index];
                        const isActive = thisQuestionNumber === item;
                            const hasAnswer = !isActive && !!question?.questionAnswer;
                            return (
                                <p 
                                    key={item} 
                                    className={`
                                        ${isActive ? 'active-question' : ''} 
                                        ${hasAnswer ? 'has-answer' : ''}
                                    `.trim()} 
                                    onClick={putQuestion}
                                >
                                    {item}
                                </p>
                            );
                        })}
                    </div>

                    <div className='question-content-wrapper d-flex'>
                        <div className='question-form'>
                        <div className='question-form-head d-flex justify-content-space-between align-items-center'>
                            <p>Q{thisQuestionNumber}/{questionData?.length || 0}</p>
                            <div className='end-head d-flex align-items-center'>
                                {role === 'Teacher' && thisQuestion && (
                                    <div ref={reportRef} style={{ position: 'relative' }}>
                                        <div 
                                            title={t('questionPage.reportError', 'Report Question Error')} 
                                            className={`report-error-button ${flaggedQuestions[thisQuestion._id] ? 'flagged-' + flaggedQuestions[thisQuestion._id] : ''}`} 
                                            onClick={() => { soundEffects.playClick(); setShowReportDropdown(!showReportDropdown); }}
                                        >
                                            <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
                                        </div>
                                        {showReportDropdown && (
                                            <div className="report-dropdown">
                                                <button 
                                                    className={`report-dropdown-item ${flaggedQuestions[thisQuestion._id] === 'answer' ? 'active' : ''}`}
                                                    onClick={() => handleReportQuestion('answer')}
                                                >
                                                    🔴 {t('questionPage.wrongAnswer', 'Wrong Answer')}
                                                </button>
                                                <button 
                                                    className={`report-dropdown-item ${flaggedQuestions[thisQuestion._id] === 'skill' ? 'active' : ''}`}
                                                    onClick={() => handleReportQuestion('skill')}
                                                >
                                                    🟠 {t('questionPage.wrongSkill', 'Wrong Skill')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button
                                    type="button"

                                    title={t('questionPage.downloadWorksheet', 'Download Worksheet PDF')}
                                    className="worksheet-print-btn"
                                    onClick={downloadWorksheetPDF}
                                    disabled={!questionData?.length}
                                >
                                    <Printer size={18} color="#fff" />
                                </button>
                                <div
                                    title={isFullscreen ? t('questionPage.exitFullscreen', 'Exit Fullscreen') : t('questionPage.fullscreen', 'Fullscreen')}
                                    className="fullscreen-button"
                                    onClick={toggleFullscreen}
                                >
                                    {isFullscreen ? <Minimize2 size={16} color="#fff" /> : <Maximize2 size={16} color="#fff" />}
                                </div>
                                <div 
                                    title={t('questionPage.flashMode', 'Flash Mode')} 
                                    className={`flash-mode-button ${flashMode ? 'flash-active' : ''}`} 
                                    onClick={toggleFlashMode}
                                >
                                    <i className="fa fa-bolt" aria-hidden="true"></i>
                                </div>
                                {flashMode && (
                                    <div className='flash-speed-control'>
                                        <label>{t('questionPage.flashSpeed')}</label>
                                        <select 
                                            value={flashSpeed} 
                                            onChange={(e) => setFlashSpeed(parseFloat(e.target.value))}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="0.5">0.5s</option>
                                            <option value="1.0">1.0s</option>
                                            <option value="1.5">1.5s</option>
                                            <option value="2.0">2.0s</option>
                                            <option value="2.5">2.5s</option>
                                            <option value="3.0">3.0s</option>
                                        </select>
                                    </div>
                                )}
                                <div title={t('questionPage.openAbacus')} className="abacus-button" onClick={() => { soundEffects.playClick(); setShowAbacus(!showAbacus); }}>
                                    <i className="fa fa-calculator" aria-hidden="true"></i>
                                </div>
                                {role === 'Teacher' && (

                                    <div 
                                        title={t('questionPage.addAllToPocket')} 
                                        className="pocket-all-button" 
                                        onClick={() => { soundEffects.playClick(); addAllToPocket(); }}
                                    >
                                        <i className="fa fa-plus-square-o" aria-hidden="true"></i>
                                    </div>
                                )}
                                {role === 'Teacher' && (
                                    <div 
                                        title={t('questionPage.addToPocket')} 
                                        className="pocket-button" 
                                        onClick={() => { soundEffects.playClick(); addToPocket(); }}
                                    >
                                        <i className="fa fa-plus" aria-hidden="true"></i>
                                    </div>
                                )}
                            </div>

                        </div>

                        {showAbacus && <AbacusSimulator onClose={() => setShowAbacus(false)} />}

                        <div className='question-form-body'>
                            {thisQuestion?.questionPic && <div className='d-flex question-img justify-content-center align-items-center'><img src={thisQuestion.questionPic} alt="Question visual aid" /></div>}
                            
                            {flashMode ? (
                                <div className="flash-mode-question">
                                    {!hasFlashedOnce && !isFlashing ? (
                                        <button 
                                            className="start-flash-btn" 
                                            onClick={startFlashing}
                                        >
                                            {t('questionPage.start', 'Start')}
                                        </button>
                                    ) : isFlashing && currentFlashLine < getQuestionLines().length ? (
                                        <div className="flash-line flash-fade-out" key={currentFlashLine}>
                                            {getQuestionLines()[currentFlashLine]}
                                        </div>
                                    ) : (
                                        <div className="flash-answer-text">
                                            {t('questionPage.answer', 'ANSWER')}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                renderQuestion(thisQuestion)
                            )}

                            {thisQuestion?.typeOfAnswer === 'Essay' && (
                                <div className='math-keyboard'>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input
                                            ref={inputRef} type='text' value={answer} onFocus={handleInputFocus} readOnly
                                            placeholder={t('questionPage.enterAnswer')} className='input-style'
                                        />
                                        {showKeyboard && (
                                            <div ref={keyboardRef} className='keyboard-container'>
                                                {renderDigits()}
                                                <button className='question-form-btn keyboard-next-btn digit-next' onClick={() => { checkedQuestion(); }}>{checkLoading ? <span className='loader'></span> : <ArrowRight size={24} />}</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(thisQuestion?.typeOfAnswer !== 'MCQ' && thisQuestion?.typeOfAnswer !== 'Graph') && <p className='text-error'>{error}</p>}
                        </div>
                        </div>

                        {/* MCQ Container beside question box */}
                        {thisQuestion?.typeOfAnswer === 'MCQ' && (
                            <div className='mcq-container'>
                                <h3 className='mcq-title'>{t('questionPage.chooseAnswer')}</h3>
                                <div className='mcq-answer-layout'>
                                    {thisQuestion.wrongAnswer?.filter(item => item && String(item).trim() !== '').map((item, index) => (
                                        <label key={item} className={`mcq-choice ${answer && answer === item ? 'selected' : ''}`}>
                                            <input 
                                                type='radio' 
                                                value={item} 
                                                name={`mcq_${thisQuestion._id}`} 
                                                checked={answer && answer === item}
                                                onChange={e => handleChecked(e.target.value)} 
                                            />
                                            <span className='mcq-text'>{item}</span>
                                        </label>
                                    ))}
                                </div>
                                {error && <p className='text-error mcq-error'>{error}</p>}
                            </div>
                        )}

                        {/* Graph Container beside question box */}
                        {thisQuestion?.typeOfAnswer === 'Graph' && (
                            <div className='mcq-container graph-container'>
                                <h3 className='mcq-title'>{t('questionPage.chooseAnswer')}</h3>
                                <div className='graph-answer-layout'>
                                    {thisQuestion.wrongPicAnswer?.map((item, index) => (
                                        <label key={item} className={`graph-choice ${answer === item ? 'selected' : ''}`}>
                                            <input 
                                                type='radio' 
                                                value={item} 
                                                name={`graph_${thisQuestion._id}`}
                                                checked={answer === item}
                                                onChange={e => handleChecked(e.target.value)} 
                                            />
                                            <img src={item} alt="Graph answer choice" />
                                        </label>
                                    ))}
                                </div>
                                {error && <p className='text-error mcq-error'>{error}</p>}
                            </div>
                        )}
                    </div>

                    <div className='question-end-btn d-flex'>
                        <button onClick={() => { soundEffects.playEndSound(); openResulPopup(); }} disabled={isCheckingAnswers}>
                            {isCheckingAnswers ? (
                                <>
                                    <span className='loader'></span> {t('questionPage.checkingAnswers')}
                                </>
                            ) : (
                                t('questionPage.endExam')
                            )}
                        </button>
                    </div>

                    <div className='alert alert-question-error-pocket'>{t('questionPage.questionAlreadyInPocket')}</div>
                    <div className='alert alert-question-success-pocket'>{t('questionPage.questionAddedToPocket')}</div>
                </div>
            )}

            <div onClick={() => { soundEffects.playClick(); openQuestionList(); }} className={`question-pocket d-flex justify-content-center align-items-center ${pocketNumber > 0 ? '' : 'hide-question-pocket'}`}>
                <i className='fa fa-gift' aria-hidden='true'></i>
                <div className='pocket-number d-flex justify-content-center align-items-center'><p>{pocketNumber}</p></div>
            </div>


            <div className='result-popup result-popup-hide d-none justify-content-center align-items-center'>
                <div className='result-popup-container popup-top'>
                    <div className='result-popup-head'>
                        <div className='d-flex justify-content-center align-items-center'><img src={avatarExam} alt="Exam avatar" /></div>
                        <p>{t('questionPage.congratulations')}</p>
                    </div>
                    <div className='result-popup-body'>
                        <table>
                            <thead><tr><th>{t('questionPage.answered')}</th><th>{t('questionPage.result')}</th><th>{t('questionPage.total')}</th></tr></thead>
                            <tbody><tr><td>{answeredQuestions}</td><td>{points}</td><td>{totalSummation}</td></tr></tbody>
                        </table>
                    </div>
                    <Link to={`/Unit/${questionTypeID}/${subjectID}`} onClick={() => soundEffects.playClick()}><button className='button popup-btn'>Close</button></Link>
                </div>
            </div>
            
            <div className='add-to-class-popup teacher-list-popup question-list-popup class-popup-hide d-none justify-content-center align-items-center'>
                <div className='question-list-container teacher-list-container class-top'>
                    <div className='d-flex align-items-center justify-content-space-between update-popup-head'>
                        <p>{t('questionPage.reviewQuestions')}</p>
                        <div className='d-flex align-items-center question-list-right-side'>
                            <div 
                                title={t('questionPage.forceFlashMode', 'Force Flash Mode for Students')} 
                                className={`force-flash-toggle ${forceFlashMode ? 'force-flash-active' : ''}`}
                                onClick={() => { soundEffects.playClick(); setForceFlashMode(!forceFlashMode); }}
                            >
                                <i className="fa fa-bolt" aria-hidden="true"></i>
                                <span>{forceFlashMode ? t('questionPage.flashForced', 'Flash Forced') : t('questionPage.flashOptional', 'Flash Optional')}</span>
                            </div>
                            {forceFlashMode && (
                                <div className='flash-speed-selector' style={{marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                    <label style={{fontSize: '13px', color: '#666', whiteSpace: 'nowrap'}}>{t('questionPage.flashSpeed', 'Flash Speed:')}</label>
                                    <select 
                                        value={assignmentFlashSpeed} 
                                        onChange={(e) => { soundEffects.playClick(); setAssignmentFlashSpeed(parseFloat(e.target.value)); }}
                                        style={{padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px'}}
                                    >
                                        <option value="0.5">0.5s</option>
                                        <option value="1.0">1.0s</option>
                                        <option value="1.5">1.5s</option>
                                        <option value="2.0">2.0s</option>
                                        <option value="2.5">2.5s</option>
                                        <option value="3.0">3.0s</option>
                                    </select>
                                </div>
                            )}
                            <button onClick={() => { soundEffects.playClick(); removeAssignment(); }}>{t('questionPage.removeAssignment')}</button>
                            <p className='question-list-close' onClick={() => { soundEffects.playClick(); closeQuestionList(); }}>x</p>
                        </div>
                    </div>
                    <div className='add-to-popup-body'>
                        {questionList.map(item => (
                            <div key={item._id} className='question-form-body form-body-list'>
                                {item.questionPic && <div className='d-flex question-img'><img src={item.questionPic} alt="Pocket question" /></div>}
                                <pre>{item.question}</pre>
                                <div onClick={() => removeFromPocket(item._id)} className='remove-question'><i className='fa fa-trash' aria-hidden='true'></i></div>
                            </div>
                        ))}
                        <div className='assignment-title'>
                            <p>{t('questionPage.title')}</p>
                            <input type='text' value={title} onChange={e => setTitle(e.target.value)} placeholder={t('questionPage.assignmentTitlePlaceholder')} />
                        </div>
                        <div className='timer d-flex align-items-center'>
                            <div style={{width: '100%'}}><p>{t('questionPage.timerMinutes')}</p><input type='number' value={timer} onChange={e => setTimer(e.target.value)} placeholder={t('questionPage.optional')} /></div>
                        </div>
                        <div className='timer date-faild d-flex align-items-center'>
                            <div><p>{t('questionPage.startDate')}</p><input type='date' value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                            <div><p>{t('questionPage.expiryDate')}</p><input type='date' value={expiryData} onChange={e => setExpiryData(e.target.value)} /></div>
                        </div>
                        <div className='select-container d-flex'>
                            <div className='select-class'>
                                <select value={classSelector} onChange={e => setClassSelector(e.target.value)} translate="no" className="notranslate">
                                    <option>{t('questionPage.selectClass')}</option>
                                    {classesList?.length === 0 ? <option>{t('questionPage.noClassesAvailable')}</option> : <option>{t('questionPage.allClasses')}</option>}
                                    {classesList?.map(item => <option key={item._id}>{item.class}</option>)}
                                </select>
                            </div>
                            <button onClick={addClassToBox} translate="no" className="notranslate">{t('questionPage.add')}</button>
                        </div>
                        <div className='class-selector-container d-flex flex-wrap align-items-center'>
                            {classesBox?.map(item => (
                                <div key={item._id} className='class-selector'>
                                    <p>{item.class}</p>
                                    <div onClick={() => removeClassFromBox(item.class)}><p>x</p></div>
                                </div>
                            ))}
                        </div>
                        {error && <div className='error error-dengare'>{error}</div>}
                    </div>
                    <div className='update-popup-footer'>
                        <button className='button popup-btn' onClick={closeQuestionList}>{t('questionPage.close')}</button>
                        <button className='button popup-btn2' onClick={handleCreateAssignment}>{loadingOperation ? <span className='loader'></span> : t('questionPage.upload')}</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Question;