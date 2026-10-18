import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { MathQuillRenderer } from '../../components/mathquill/MathQuillEditor';
import soundEffects from '../../utils/soundEffects';
import { ArrowRight, Maximize2, Minimize2, Printer, FileText } from 'lucide-react';
import '../../reusable.css';
import './Question.css';
import jsPDF from 'jspdf';
import { safeLocalStorage } from '../../utils/safeStorage';
import { markChapterComplete, calculateStars } from '../../utils/learningPathProgress';
import QuestionPdfNoterModal from '../../components/pdfNoter/QuestionPdfNoterModal';
import SavedNotesBoxModal from '../../components/pdfNoter/SavedNotesBoxModal';
import exportPracticeExamPdf from '../../utils/exportPracticeExamPdf';
import { renderLatexInHtml } from '../../utils/latexRenderer';
import 'katex/dist/katex.min.css';

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

const getRowOp  = (row) => {
    const op = (row.op  !== undefined ? row.op  : (row.OP  !== undefined ? row.OP  : ''));
    return (!op || op.trim() === '') ? '+' : op;
};
const getRowVal = (row) => (row.val !== undefined ? row.val : (row.VAL !== undefined ? row.VAL : ''));

const formatQuestionText = (text) => {
    if (!text) return '';
    const trimmed = String(text).trim();
    if (trimmed.startsWith('[')) return text;
    
    return String(text).split('\n').map(line => {
        const trimmedLine = line.trim();
        if (/^[\d٠-٩]+(?:[.,][\d٠-٩]+)?$/.test(trimmedLine)) {
            return '+' + trimmedLine;
        }
        return line;
    }).join('\n');
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

const translateNumbers = (text, toArabic) => {
    if (!toArabic || text == null) return text;
    return String(text).replace(/[0-9]/g, d => ARABIC_DIGITS[parseInt(d, 10)]);
};

const renderQuestion = (question, useArabicNumerals) => {
    let text = question?.question;
    if (!text) return null;

    text = String(text).replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');

    // Check for LaTeX content first (new math questions)
    const isLaTeX = /\\(frac|sqrt|sum|int|prod|times|div|pm|leq|geq|neq|approx|overline|text)/.test(String(text)) ||
                    (/[\^_{}]/.test(String(text)) && /\\/.test(String(text)));
    if (isLaTeX) {
        return (
            <div className="question-math-display">
                <MathQuillRenderer latex={text} className="mq-display-large" />
            </div>
        );
    }

    // Legacy: abacus grid rendering
    const gridRows = parseGridRows(text);
    if (gridRows) {
        return (
            <div className="abacus-grid-view">
                <table className="abacus-display-table">
                    <tbody>
                        {gridRows.map((row, i) => {
                            let op = getRowOp(row);
                            return (
                                <tr key={i}>
                                    <td className="op-cell">
                                        <span style={{ color: op === '+' ? 'transparent' : 'inherit' }}>{op}</span>
                                    </td>
                                    <td className="val-cell">{translateNumbers(getRowVal(row), useArabicNumerals)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    // HTML / Rich text (e.g. from editor or questions with HTML formatting)
    if (/<[a-z][\s\S]*>/i.test(String(text))) {
        return (
            <div 
                className="question-html-clean question-stem-text"
                dangerouslySetInnerHTML={{ __html: renderLatexInHtml(translateNumbers(text, useArabicNumerals)) }}
            />
        );
    }
    
    // Plain text rendering
    let lines = formatQuestionText(text).split('\n');
    return (
        <div className="question-plain-text">
            {lines.map((line, i) => {
                const restOfLine = translateNumbers(line.replace(/^\+/, ''), useArabicNumerals);
                return (
                    <p key={i} className="question-stem-text">{restOfLine}</p>
                );
            })}
        </div>
    );
};

// Helper functions for PDF worksheet generation
const buildWorksheetLines = (question, index, pdf, maxWidth) => {
    const rawLines = [`Q${index + 1}`];

    const grid = parseGridRows(question?.question);
    if (grid) {
        rawLines.push(...grid.map(row => `${getRowOp(row)} ${getRowVal(row)}`.trim()));
    } else if (question?.question) {
        rawLines.push(...String(formatQuestionText(question.question)).split('\n').filter(line => line.trim()));
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
const normalizeToWesternDigits = (str) => {
    if (!str) return str;
    return String(str)
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => ARABIC_DIGITS.indexOf(d).toString())
        .trim();
};

// ─────────────────────────────────────────────────────────────────────────────

function Question() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const isFromLearningPath = location.state?.fromLearningPath === true;
    const isNavigatingRef = useRef(false);
    
    // State for Abacus visibility
    const [showAbacus, setShowAbacus] = useState(false);
    const [useArabicNumerals, setUseArabicNumerals] = useState(false);

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
                    'authrization': `pracYas09${safeLocalStorage.getItem('O_authWEB')}`
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

    const [showNoterModal, setShowNoterModal] = useState(false);
    const [showNotesBoxModal, setShowNotesBoxModal] = useState(false);
    const [savedQuestionNotes, setSavedQuestionNotes] = useState(() => {
        const saved = localStorage.getItem('savedQuestionNotes');
        return saved ? JSON.parse(saved) : [];
    });
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [pdfProgressText, setPdfProgressText] = useState('');

    useEffect(() => {
        localStorage.setItem('savedQuestionNotes', JSON.stringify(savedQuestionNotes));
    }, [savedQuestionNotes]);

    const [eliminatedOptions, setEliminatedOptions] = useState({});

    const toggleEliminateOption = (qId, oIdx) => {
        soundEffects.playClick();
        setEliminatedOptions(prev => {
            const currentList = prev[qId] || [];
            const isEliminated = currentList.includes(oIdx);
            const newList = isEliminated ? currentList.filter(i => i !== oIdx) : [...currentList, oIdx];
            return { ...prev, [qId]: newList };
        });
    };

    const renderChoiceText = (item) => {
        if (!item) return '';
        let str = String(item).trim();
        str = str.replace(/^(\d+)\/(\d+)$/g, '\\frac{$1}{$2}');
        if (/\\(frac|sqrt|pm|times|div|leq|geq|neq|approx|alpha|beta|theta|pi)/.test(str) && !str.includes('$')) {
            str = `$${str}$`;
        }
        const translated = translateNumbers(str, useArabicNumerals);
        return renderLatexInHtml(translated);
    };

    const handleDownloadExamPdf = async () => {
        if (!questionData || questionData.length === 0) {
            alert('No questions loaded to export.');
            return;
        }

        setIsExportingPdf(true);
        setPdfProgressText('Preparing PDF export...');

        try {
            const currentChapter = safeLocalStorage.getItem('current_chapter_name') || 'Practice Exam';
            const teacherDispName = safeLocalStorage.getItem('pp_name') || 'Teacher';

            await exportPracticeExamPdf({
                questions: questionData,
                examTitle: currentChapter,
                teacherName: teacherDispName,
                onProgress: ({ current, total, message }) => {
                    setPdfProgressText(`Page ${current} of ${total}: ${message}`);
                }
            });
        } catch (err) {
            console.error('Download practice exam error:', err);
        } finally {
            setIsExportingPdf(false);
            setPdfProgressText('');
        }
    };
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
    const isAuth = safeLocalStorage.getItem('O_authWEB');
    const role = safeLocalStorage.getItem('auth_role');

    // PDF download function for worksheet
    const downloadWorksheetPDF = () => {
        if (!Array.isArray(questionData) || questionData.length === 0) return;

        soundEffects.playClick();

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const marginX = 14;
        const maxWidth = pageWidth - (marginX * 2);

        const schoolName = safeLocalStorage.getItem('school_name') || '';
        const userName = safeLocalStorage.getItem('pp_name') || '';
        const userRole = safeLocalStorage.getItem('auth_role') || '';
        const isTopsoroban = (schoolName.toLowerCase() === 'topsoroban') || 
                            (userRole === 'School' && userName.toLowerCase() === 'topsoroban');

        const drawHeader = (pdfInstance, isFirstPage = false) => {
            // Draw logo at top-right
            const logoWidth = 28;
            const logoHeight = 8;
            const logoX = pageWidth - marginX - logoWidth;
            const logoY = 12;
            try {
                pdfInstance.addImage(isTopsoroban ? '/img/topsoroban_abacusheroes_logo.png' : logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
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
        let cartonaList = safeLocalStorage.getItem('cartona');
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
                <button type="button" onClick={() => handleButtonClick(digits[7])} className="digit-button digit-num">{digits[7]}</button>
                <button type="button" onClick={() => handleButtonClick(digits[8])} className="digit-button digit-num">{digits[8]}</button>
                <button type="button" onClick={() => handleButtonClick(digits[9])} className="digit-button digit-num">{digits[9]}</button>
                
                {/* Row 2: 4, 5, 6 */}
                <button type="button" onClick={() => handleButtonClick(digits[4])} className="digit-button digit-num">{digits[4]}</button>
                <button type="button" onClick={() => handleButtonClick(digits[5])} className="digit-button digit-num">{digits[5]}</button>
                <button type="button" onClick={() => handleButtonClick(digits[6])} className="digit-button digit-num">{digits[6]}</button>
                
                {/* Row 3: 1, 2, 3 */}
                <button type="button" onClick={() => handleButtonClick(digits[1])} className="digit-button digit-num">{digits[1]}</button>
                <button type="button" onClick={() => handleButtonClick(digits[2])} className="digit-button digit-num">{digits[2]}</button>
                <button type="button" onClick={() => handleButtonClick(digits[3])} className="digit-button digit-num">{digits[3]}</button>
                
                {/* Row 4: 0, ×, 123 */}
                <button type="button" onClick={() => handleButtonClick(digits[0])} className="digit-button digit-num">{digits[0]}</button>
                <button type="button" onClick={handleDelete} className='digit-button digit-action'>×</button>
                <button type="button" onClick={toggleLanguage} className='digit-button digit-action'>
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
        if (gridRows) return gridRows.map((row, i) => {
            let op = getRowOp(row);
            let val = translateNumbers(getRowVal(row), useArabicNumerals);
            return (
                <span key={i} style={{ display: 'inline-flex' }}>
                    <span style={{ color: op === '+' ? 'transparent' : 'inherit', width: op === '+' ? '1ch' : 'auto', textAlign: 'center' }}>{op}</span>
                    <span>{val}</span>
                </span>
            );
        });
        return formatQuestionText(thisQuestion.question)
            .split('\n')
            .filter(line => line.trim())
            .map((line, i) => {
                const hasPlus = line.startsWith('+');
                const restOfLine = translateNumbers(line.replace(/^\+/, ''), useArabicNumerals);
                return (
                    <span key={i} style={{ display: 'inline-flex' }}>
                        {hasPlus && <span style={{ color: 'transparent', width: '1ch', textAlign: 'center' }}>+</span>}
                        <span>{restOfLine}</span>
                    </span>
                );
            });
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

    // Handle physical keyboard inputs for complete/essay answers
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (thisQuestion?.typeOfAnswer !== 'Essay') {
                return;
            }
            // If typing in another input (like assignment title/pocket), ignore
            if (document.activeElement && document.activeElement.tagName === 'INPUT' && !document.activeElement.classList.contains('input-style')) {
                return;
            }

            // If focused on the main input, let native input handle it
            if (document.activeElement && document.activeElement.classList.contains('input-style')) {
                if (e.key === 'Enter') {
                    if (!isNavigatingRef.current) {
                        checkedQuestion();
                    }
                }
                return;
            }

            if ((e.key >= '0' && e.key <= '9') || e.key === '-' || e.key === '.' || e.key === ',') {
                setAnswer(prev => prev + e.key);
            } else if (e.key === 'Backspace') {
                setAnswer(prev => prev.slice(0, -1));
            } else if (e.key === 'Enter') {
                if (!isNavigatingRef.current) {
                    checkedQuestion();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [thisQuestion, answer, thisQuestionNumber]);

    const nextQuestion = () => {
        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;
        setTimeout(() => { isNavigatingRef.current = false; }, 250);

        soundEffects.playClick();
        const activeNumber = thisQuestionNumber;
        
        // Check if this is the last question - auto-end exam
        if (activeNumber >= questionData.length) {
            openResulPopup();
            return;
        }
        
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
    };

    const previousQuestion = () => {
        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;
        setTimeout(() => { isNavigatingRef.current = false; }, 250);

        soundEffects.playClick();
        const activeNumber = thisQuestionNumber;
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
        audioRefWrong.current?.play?.().catch(e => console.log(e));
        const alertEl = document.querySelector('.alert-question');
        if (alertEl) {
            alertEl.classList.add('alert-active');
            setTimeout(() => alertEl.classList.remove('alert-active'), 3500);
        }
    };

    const showeEndAlert = () => {
        const alertEl = document.querySelector('.alert-question-end');
        if (alertEl) {
            alertEl.classList.add('alert-active');
            setTimeout(() => alertEl.classList.remove('alert-active'), 3500);
        }
    };

    const showAlertSuccess = () => {
        audioRefCorrect.current?.play?.().catch(e => console.log(e));
        const alertEl = document.querySelector('.alert');
        if (alertEl) {
            alertEl.classList.add('alert-active');
            setTimeout(() => alertEl.classList.remove('alert-active'), 3500);
        }
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
        if (isNavigatingRef.current) return;
        setAnswer(value);
        // For MCQ and Graph questions, save answer and move to next
        if (thisQuestion?.typeOfAnswer === 'MCQ' || thisQuestion?.typeOfAnswer === 'Graph') {
            const index = questionData.findIndex(item => item._id === thisQuestion._id);
            if (index !== -1) {
                questionData[index].questionAnswer = value;
                syncAnswerWithBackend(thisQuestion._id, value, index);
            }
            setTimeout(() => {
                nextQuestion();
            }, 250);
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
        if (isNavigatingRef.current) return;
        if (answer) {
            setError('');
            const index = questionData.findIndex(item => item._id === thisQuestion._id);
            if (index !== -1) {
                questionData[index].questionAnswer = answer;
                // Fire background check — don't await, student moves on immediately
                syncAnswerWithBackend(thisQuestion._id, answer, index);
            }

            // Check if this is the last question - auto-end exam
            if (thisQuestionNumber >= questionData.length) {
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
        let totalAnswered = 0;
        updatedQuestionData.forEach((q, i) => {
            if (q.questionAnswer !== undefined && q.questionAnswer !== null && q.questionAnswer !== '') {
                totalAnswered++;
            }
            
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
        setAnsweredQuestions(totalAnswered);
        setIsCheckingAnswers(false);

        // ── Learning Path: mark chapter complete ──
        if (isFromLearningPath && chapterID) {
            const userId = safeLocalStorage.getItem('pp_id') || 'guest';
            const percentage = updatedQuestionData.length > 0
                ? Math.round((correctAnswers / updatedQuestionData.length) * 100)
                : 0;
            const stars = calculateStars(percentage);
            markChapterComplete(userId, subjectID, chapterID, stars);
        }

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
        safeLocalStorage.setItem('cartona', JSON.stringify(questions));
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
        const newQuestions = questionData.filter(q => !existingIds.includes(q._id)).map(q => ({
            ...q,
            isArabic: useArabicNumerals
        }));
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
        if (isAuth) {
            getClass(() => {}, setClassesList);
        }
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

        } else {
            const data = {
                questions: questionList.map(q => q._id),
                totalPoints: questionList.reduce((sum, q) => sum + q.questionPoints, 0),
                timer: timer || undefined,
                attemptsNumber: 1,

                classes: classesBox.map(c => c._id),
                title,
                forceFlashMode: forceFlashMode,
                flashSpeed: forceFlashMode ? assignmentFlashSpeed : undefined
            };
            createAssignment(data, setError, setLoadingOperation, setPocketNumber, setQuestionList, closeQuestionList, setTimer, setTitle, setClassesBox, setForceFlashMode, setAssignmentFlashSpeed);
        }
    };

    const addClassToBox = () => {
        const cleanSelector = (classSelector || '').trim().replace(/\s+/g, ' ');
        const selectClassPlaceholder = (t('questionPage.selectClass', 'Select Class') || '').trim().replace(/\s+/g, ' ');
        const allClassesText = (t('questionPage.allClasses', 'All Classes') || '').trim().replace(/\s+/g, ' ');

        if (!cleanSelector || cleanSelector === selectClassPlaceholder) {
            setError(t('questionPage.mustSelectClassFirst', 'You must select a class first'));
        } else {
            setError(null);
            if (cleanSelector === allClassesText || cleanSelector === 'All Classes' || cleanSelector === 'جميع الفصول') {
                setClassesBox(classesList);
            } else if (!classesBox.some(c => (c.class || '').trim().replace(/\s+/g, ' ') === cleanSelector)) {
                const classToAdd = classesList.find(c => (c.class || '').trim().replace(/\s+/g, ' ') === cleanSelector);
                if (classToAdd) {
                    setClassesBox(prev => [...prev, classToAdd]);
                } else {
                    setError(t('questionPage.classNotFound', 'Class could not be found'));
                }
            } else {
                setError(t('questionPage.classAlreadyAdded', 'Class already added'));
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
        setTitle('');
        setClassesBox([]);
        setForceFlashMode(false);
        setAssignmentFlashSpeed(1.0);
        closeQuestionList();
        safeLocalStorage.removeItem('cartona');
    };

    return (
        <>

            <audio ref={audioRefCorrect} src="/audio/correct.mp3" preload="auto" />
            <audio ref={audioRefWrong} src="/audio/wrong.mp3" preload="auto" />

            <div style={{ width: '100%', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e2e8f0', marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold', color: '#4C5287', fontSize: '18px' }}>Practice Session</div>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: '#FF4757', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Exit
                </button>
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

                    <div className='question-content-wrapper'>
                        <div className='question-form'>
                            {role === 'Teacher' && thisQuestion && (
                                <div ref={reportRef} className="report-error-outer-wrapper">
                                    <div 
                                        title={t('questionPage.reportError', 'Report Question Error')} 
                                        className={`report-paper-button ${flaggedQuestions[thisQuestion._id] ? 'flagged-' + flaggedQuestions[thisQuestion._id] : ''}`} 
                                        onClick={() => { soundEffects.playClick(); setShowReportDropdown(!showReportDropdown); }}
                                    >
                                        <FileText size={18} />
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
                            <div className='question-form-head d-flex justify-content-space-between align-items-center'>
                                <p>Q{thisQuestionNumber}/{questionData?.length || 0}</p>
                                <div className='end-head d-flex align-items-center'>
                                <button
                                    type="button"
                                    title={t('questionPage.gamify', 'Gamify with Math Racer')}
                                    className="gamify-button"
                                    onClick={() => {
                                        soundEffects.playClick();
                                        navigate('/student/games/math-racer', {
                                            state: {
                                                customQuestions: questionData,
                                                chapterName: chapterID
                                            }
                                        });
                                    }}
                                    disabled={!questionData?.length}
                                >
                                    <i className="fa fa-gamepad" aria-hidden="true"></i>
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

                                {role === 'Teacher' && (
                                    <>
                                        <button 
                                            type="button"
                                            onClick={() => { soundEffects.playClick(); setShowNoterModal(true); }} 
                                            title="Open interactive solution note with pen, colors, shapes, and eraser" 
                                            className='action-btn noter-btn' 
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)', transition: 'all 0.2s ease', marginLeft: '8px' }}
                                        >
                                            <i className='fa-solid fa-pen-nib' aria-hidden='true'></i>
                                            <span>PDF Note</span>
                                        </button>
                                        
                                        {savedQuestionNotes.length > 0 && (
                                            <button 
                                                type="button"
                                                onClick={() => { soundEffects.playClick(); setShowNotesBoxModal(true); }} 
                                                title="View all saved question notes and export combined PDF or share via WhatsApp" 
                                                className='action-btn notes-box-btn' 
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)', transition: 'all 0.2s ease', marginLeft: '8px' }}
                                            >
                                                <i className='fa-solid fa-box-archive' aria-hidden='true'></i>
                                                <span>Notes Box ({savedQuestionNotes.length})</span>
                                            </button>
                                        )}

                                        <button 
                                            type="button"
                                            onClick={() => { soundEffects.playClick(); handleDownloadExamPdf(); }} 
                                            title="Download Practice Exam PDF" 
                                            disabled={isExportingPdf}
                                            className='action-btn pdf-btn' 
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: isExportingPdf ? '#7c3aed' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: isExportingPdf ? 'not-allowed' : 'pointer', fontSize: '12px', boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)', transition: 'all 0.2s ease', marginLeft: '8px' }}
                                        >
                                            <i className={`fa ${isExportingPdf ? 'fa-circle-o-notch fa-spin' : 'fa-download'}`} aria-hidden='true'></i>
                                            <span>{isExportingPdf ? 'Exporting...' : 'Download Exam'}</span>
                                        </button>

                                        <div 
                                            title={t('questionPage.addAllToPocket')} 
                                            style={{ position: 'relative', width: '42px', height: '42px', padding: '0', margin: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FA709A', backgroundImage: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)', borderRadius: '50%', color: 'white', cursor: 'pointer', boxShadow: '0 8px 18px rgba(250, 112, 154, 0.35)', userSelect: 'none' }}
                                            onClick={() => { soundEffects.playClick(); addAllToPocket(); }}
                                        >
                                            <span style={{ position: 'absolute', top: '50%', left: '22%', transform: 'translate(-50%, -50%)', margin: 0, padding: 0, fontSize: '15px', fontWeight: 'bold', border: 'none', outline: 'none' }}>HW</span>
                                        </div>
                                    </>
                                )}

                            </div>

                        </div>

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
                                renderQuestion(thisQuestion, useArabicNumerals)
                            )}

                            {/* MCQ Choices Stacked Directly Under Question Stem (Matching SAT / mrshahin layout) */}
                            {thisQuestion?.typeOfAnswer === 'MCQ' && (
                                <div className="bluebook-choice-list">
                                    {(thisQuestion.wrongAnswer || []).filter(item => item !== null && item !== undefined && String(item).trim() !== '').map((item, index) => {
                                        const letter = String.fromCharCode(65 + index);
                                        const isSelected = answer && answer === item;
                                        const isEliminated = (eliminatedOptions[thisQuestion?._id] || []).includes(index);

                                        return (
                                            <div key={item} className="bluebook-choice-row">
                                                <button
                                                    type="button"
                                                    className={`bluebook-choice-card ${isSelected ? 'selected' : ''} ${isEliminated ? 'eliminated' : ''}`}
                                                    onClick={() => handleChecked(item)}
                                                >
                                                    <span className="bluebook-choice-badge">{letter}</span>
                                                    <span 
                                                        className="bluebook-choice-text question-html-clean"
                                                        dangerouslySetInnerHTML={{ __html: renderChoiceText(item) }}
                                                    />
                                                </button>

                                                {/* Strikethrough Option Elimination Button */}
                                                <button 
                                                    type="button"
                                                    className={`bluebook-eliminate-btn ${isEliminated ? 'active' : ''}`}
                                                    title={`Eliminate Option ${letter}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleEliminateOption(thisQuestion?._id, index);
                                                    }}
                                                >
                                                    {letter}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {error && <p className='text-error mcq-error'>{error}</p>}
                                </div>
                            )}

                            {/* Graph Choices Stacked Directly Under Question Stem */}
                            {thisQuestion?.typeOfAnswer === 'Graph' && (
                                <div className="bluebook-choice-list graph-choice-list">
                                    {thisQuestion.wrongPicAnswer?.map((item, index) => {
                                        const letter = String.fromCharCode(65 + index);
                                        const isSelected = answer === item;
                                        return (
                                            <div key={item} className="bluebook-choice-row">
                                                <button 
                                                    type="button"
                                                    className={`bluebook-choice-card graph-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleChecked(item)}
                                                >
                                                    <span className="bluebook-choice-badge">{letter}</span>
                                                    <img src={item} alt={`Graph option ${letter}`} className="graph-choice-img" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {error && <p className='text-error mcq-error'>{error}</p>}
                                </div>
                            )}

                            {thisQuestion?.typeOfAnswer === 'Essay' && (
                                <div className='math-keyboard'>
                                    <form 
                                        onSubmit={(e) => { e.preventDefault(); checkedQuestion(); }}
                                        style={{ position: 'relative', width: '100%' }}
                                    >
                                        <input
                                            ref={inputRef} 
                                            type='text' 
                                            value={answer} 
                                            onChange={(e) => setAnswer(e.target.value)}
                                            onFocus={handleInputFocus} 
                                            readOnly={/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)}
                                            placeholder={t('questionPage.enterAnswer')} 
                                            className='input-style'
                                            autoFocus
                                        />
                                        {showKeyboard && (
                                            <div ref={keyboardRef} className='keyboard-container'>
                                                {renderDigits()}
                                                <button type="submit" className='question-form-btn keyboard-next-btn digit-next'>
                                                    {checkLoading ? <span className='loader'></span> : <ArrowRight size={24} />}
                                                </button>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            )}
                            {(thisQuestion?.typeOfAnswer !== 'MCQ' && thisQuestion?.typeOfAnswer !== 'Graph') && <p className='text-error'>{error}</p>}
                        </div>
                    </div>
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
                    {isFromLearningPath ? (
                        <Link to='/student/learning-path' onClick={() => soundEffects.playClick()}><button className='button popup-btn'>Back to Learning Path 🗺️</button></Link>
                    ) : (
                        <Link to={subjectID === 'custom' ? '/teacher/question-bank' : `/Unit/${questionTypeID}/${subjectID}`} onClick={() => soundEffects.playClick()}><button className='button popup-btn'>Close</button></Link>
                    )}
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

                        <div className='select-container d-flex'>
                            <div className='select-class'>
                                <select value={classSelector} onChange={e => setClassSelector(e.target.value)} translate="no" className="notranslate">
                                    <option value="">{t('questionPage.selectClass', 'Select Class')}</option>
                                    {classesList?.length === 0 ? (
                                        <option disabled>{t('questionPage.noClassesAvailable', 'No classes available')}</option>
                                    ) : (
                                        <option value={t('questionPage.allClasses', 'All Classes')}>{t('questionPage.allClasses', 'All Classes')}</option>
                                    )}
                                    {classesList?.map(item => (
                                        <option key={item._id} value={item.class}>{item.class}</option>
                                    ))}
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

            {/* PDF Export Progress Notification */}
            {isExportingPdf && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#333', color: '#fff', padding: '15px 25px', borderRadius: '8px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    <i className='fa fa-circle-o-notch fa-spin'></i>
                    <span>{pdfProgressText || 'Generating Practice Exam PDF...'}</span>
                </div>
            )}

            {/* PDF Noter Modals */}
            {showNoterModal && (
                <QuestionPdfNoterModal 
                    onClose={() => setShowNoterModal(false)}
                    currentQuestion={thisQuestion}
                    questionNumber={thisQuestionNumber}
                    savedNotes={savedQuestionNotes}
                    setSavedNotes={setSavedQuestionNotes}
                />
            )}

            {showNotesBoxModal && (
                <SavedNotesBoxModal 
                    onClose={() => setShowNotesBoxModal(false)}
                    savedNotes={savedQuestionNotes}
                    setSavedNotes={setSavedQuestionNotes}
                    examTitle={safeLocalStorage.getItem('current_chapter_name') || 'Practice Exam'}
                />
            )}
        </>
    );
}

export default Question;