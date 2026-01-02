import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import logo from '../../logo.png';
import avatarExam from '../../img/avatar-exam.png';
import profileImg from '../../img/avatar-profile.png';
import QuestionLoading from '../../components/questionLoading/QuestionLoading';
import NotLogin from '../../components/notLogin/NotLogin';
import getQuestion from '../../api/question/getQuestion.api';
import createAssignment from '../../api/assignment/createAssignment.api';
import getClass from '../../api/teacher/getClass.api';
import checked from '../../api/question/checkedAnswer.api';
import API_BASE_URL from '../../config/api.config';
import AbacusSimulator from '../../components/abacus/AbacusSimulator';
import soundEffects from '../../utils/soundEffects';
import '../../reusable.css';
import './Question.css';

function Question() {
    // State for Abacus visibility
    const [showAbacus, setShowAbacus] = useState(false);

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

    // Keyboard Variables
    const [isArabic, setIsArabic] = useState(true);
    const [showKeyboard, setShowKeyboard] = useState(false);
    const inputRef = useRef(null);
    const keyboardRef = useRef(null);
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const { chapterID, questionTypeID, subjectID } = useParams();
    const isAuth = localStorage.getItem('O_authWEB');
    const role = localStorage.getItem('auth_role');

    useEffect(() => {
        const handleGetQuestion = () => {
            getQuestion(setLoading, setQuestionData, setThisQuestion, setNumberOfQuestion, setThisQuestionNumber, setTotalSummation, chapterID);
            getClass(setLoading, setClassesList);
        };
        if (isAuth) {
            handleGetQuestion();
        }
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

    // Auto-show keyboard for Essay questions
    useEffect(() => {
        if (thisQuestion?.typeOfAnswer === 'Essay') {
            setShowKeyboard(true);
        } else {
            setShowKeyboard(false);
        }
    }, [thisQuestion]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close keyboard when clicking anywhere except the keyboard itself
            if (keyboardRef.current && !keyboardRef.current.contains(event.target)) {
                setShowKeyboard(false);
            }
        };
        
        if (showKeyboard) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showKeyboard]);

    const renderDigits = () => {
        const digits = isArabic ? arabicDigits : englishDigits;
        
        // Check if we're on desktop (>= 993px) or mobile
        const isDesktop = window.innerWidth >= 993;
        
        if (isDesktop) {
            // Desktop: 3-row layout with 4 columns (0-9 in order)
            // Row 1: 0,1,2,3; Row 2: 4,5,6,7; Row 3: 8,9,×,toggle; Row 4: next (full width)
            return (
                <>
                    <button onClick={() => handleButtonClick(digits[0])} className="digit-button">{digits[0]}</button>
                    <button onClick={() => handleButtonClick(digits[1])} className="digit-button">{digits[1]}</button>
                    <button onClick={() => handleButtonClick(digits[2])} className="digit-button">{digits[2]}</button>
                    <button onClick={() => handleButtonClick(digits[3])} className="digit-button">{digits[3]}</button>
                    
                    <button onClick={() => handleButtonClick(digits[4])} className="digit-button">{digits[4]}</button>
                    <button onClick={() => handleButtonClick(digits[5])} className="digit-button">{digits[5]}</button>
                    <button onClick={() => handleButtonClick(digits[6])} className="digit-button">{digits[6]}</button>
                    <button onClick={() => handleButtonClick(digits[7])} className="digit-button">{digits[7]}</button>
                    
                    <button onClick={() => handleButtonClick(digits[8])} className="digit-button">{digits[8]}</button>
                    <button onClick={() => handleButtonClick(digits[9])} className="digit-button">{digits[9]}</button>
                    <button onClick={handleDelete} className='digit-button btn-red'>×</button>
                    <button onClick={toggleLanguage} className='toggle-btn'>{isArabic ? '123' : '١٢٣'}</button>
                </>
            );
        } else {
            // Mobile: 5-column layout
            // Row 1: 0,1,2,3,4; Row 2: 5,6,7,8,9; Row 3: ×, 123, next (spans 3)
            return (
                <>
                    <button onClick={() => handleButtonClick(digits[0])} className="digit-button">{digits[0]}</button>
                    <button onClick={() => handleButtonClick(digits[1])} className="digit-button">{digits[1]}</button>
                    <button onClick={() => handleButtonClick(digits[2])} className="digit-button">{digits[2]}</button>
                    <button onClick={() => handleButtonClick(digits[3])} className="digit-button">{digits[3]}</button>
                    <button onClick={() => handleButtonClick(digits[4])} className="digit-button">{digits[4]}</button>
                    
                    <button onClick={() => handleButtonClick(digits[5])} className="digit-button">{digits[5]}</button>
                    <button onClick={() => handleButtonClick(digits[6])} className="digit-button">{digits[6]}</button>
                    <button onClick={() => handleButtonClick(digits[7])} className="digit-button">{digits[7]}</button>
                    <button onClick={() => handleButtonClick(digits[8])} className="digit-button">{digits[8]}</button>
                    <button onClick={() => handleButtonClick(digits[9])} className="digit-button">{digits[9]}</button>
                    
                    <button onClick={handleDelete} className='digit-button btn-red'>×</button>
                    <button onClick={toggleLanguage} className='toggle-btn'>{isArabic ? '123' : '١٢٣'}</button>
                </>
            );
        }
    };

    const handleDelete = () => {
        setAnswer(prev => prev.slice(0, -1));
    };

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
            setTimeout(() => {
                nextQuestion();
            }, 300);
        }
    };

    const checkedQuestion = () => {
        if (answer) {
            setError('');
            const index = questionData.findIndex(item => item._id === thisQuestion._id);
            questionData[index].questionAnswer = answer;
            
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
        // Start checking all answers (including unanswered ones)
        setIsCheckingAnswers(true);
        checkAllAnswers();
    };

    const checkAllAnswers = async () => {
        let totalPoints = 0;
        let correctAnswers = 0;
        
        // Create a copy of questionData to update
        const updatedQuestionData = [...questionData];
        
        // Check each question sequentially
        for (let i = 0; i < questionData.length; i++) {
            const question = questionData[i];
            
            if (question.questionAnswer && question.questionAnswer !== '') {
                // Question has an answer - check it
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/question/checkTheAnswer/${question._id}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ questionAnswer: question.questionAnswer })
                        }
                    );
                    
                    const result = await response.json();
                    
                    if (result.message === 'success') {
                        updatedQuestionData[i].correct = true;
                        totalPoints += question.questionPoints;
                        correctAnswers++;
                    } else {
                        updatedQuestionData[i].correct = false;
                    }
                } catch (error) {
                    console.error('Error checking question:', error);
                    updatedQuestionData[i].correct = false;
                }
            } else {
                // Question was not answered - mark as wrong (0 marks)
                updatedQuestionData[i].correct = false;
            }
        }
        
        // Update state with results
        setQuestionData(updatedQuestionData);
        setPoints(totalPoints);
        setAnsweredQuestions(correctAnswers);
        setIsCheckingAnswers(false);
        
        // Show the result popup with winning sound
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
            setError('You must select a class and provide a title.');
        } else if (startDate && !expiryData) {
            setError('You must add the expiry date.');
        } else if (!startDate && expiryData) {
            setError('You must add the start date.');
        } else {
            const data = {
                questions: questionList.map(q => q._id),
                totalPoints: questionList.reduce((sum, q) => sum + q.questionPoints, 0),
                timer: timer || undefined,
                attemptsNumber: attempts || 1,
                startDate: startDate || undefined,
                endDate: expiryData || undefined,
                classes: classesBox.map(c => c._id),
                title
            };
            createAssignment(data, setError, setLoadingOperation, setPocketNumber, setQuestionList, closeQuestionList, setTimer, setAttempts, setExpiryData, setStartDate, setTitle, setClassesBox);
        }
    };

    const addClassToBox = () => {
        if (!classSelector || classSelector === 'Select Class') {
            setError('You must select a class first.');
        } else {
            setError(null);
            if (classSelector === 'All Classes') {
                setClassesBox(classesList);
            } else if (!classesBox.some(c => c.class === classSelector)) {
                const classToAdd = classesList.find(c => c.class === classSelector);
                if (classToAdd) setClassesBox(prev => [...prev, classToAdd]);
            } else {
                setError('This class is already added.');
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
        setAttempts('');
        setExpiryData('');
        setStartDate('');
        setTitle('');
        setClassesBox([]);
        closeQuestionList();
        localStorage.removeItem('cartona');
    };

    if (!isAuth) return <NotLogin />;

    return (
        <>
            <audio ref={audioRef} src="/audio/birds sound no.mp3" loop preload="auto" />
            <audio ref={audioRefCorrect} src="/audio/correct.mp3" preload="auto" />
            <audio ref={audioRefWrong} src="/audio/wrong.mp3" preload="auto" />

            <nav>
                <div className='nav-container d-flex justify-content-space-between align-items-center'>
                    <Link to={'/'} onClick={() => soundEffects.playClick()}><img src={logo} alt='Logo' /></Link>
                    <div className='nav-right-side d-flex align-items-center'>
                        {/* Simplified dashboard links */}
                        <Link to={`/dashboard/${role.toLowerCase()}`} onClick={() => soundEffects.playClick()}><div className='gear'><i className='fa fa-graduation-cap' aria-hidden='true'></i></div></Link>
                        {isAuth ? <Link to={'/user/info'} onClick={() => soundEffects.playClick()}><img src={profileImg} alt='Profile' /></Link> : <Link to={'/auth/login'} onClick={() => soundEffects.playClick()}><div className='nav-btn'>LogIn<div className='nav-btn2'></div></div></Link>}
                    </div>
                </div>
            </nav>

            {loading ? <QuestionLoading /> : (
                <div className='question-container d-flex justify-content-center flex-direction-column align-items-center'>
                    <div className='question-number d-flex'>
                        {numberOfQuestion.map((item, index) => {
                            const question = questionData[index];
                            const isCorrect = question?.correct === true;
                            const isWrong = question?.correct === false;
                            
                            return (
                                <p 
                                    key={item} 
                                    className={`
                                        ${thisQuestionNumber === item ? 'active-question' : ''} 
                                        ${isCorrect ? 'correct-answer' : ''} 
                                        ${isWrong ? 'wrong-answer' : ''}
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
                            <p>Q{thisQuestionNumber}</p>
                            <div className='end-head d-flex align-items-center'>
                                <div title="Open Abacus" className="abacus-button" onClick={() => { soundEffects.playClick(); setShowAbacus(!showAbacus); }}>
                                    <i className="fa fa-calculator" aria-hidden="true"></i>
                                </div>
                                {role === 'Teacher' && <i onClick={() => { soundEffects.playClick(); addAllToPocket(); }} title="Add All to Pocket" className='fa fa-plus-square-o all-question-icon' aria-hidden='true'></i>}
                                {role === 'Teacher' && <i onClick={() => { soundEffects.playClick(); addToPocket(); }} title="Add to Pocket" className='fa fa-plus add-question-icon' aria-hidden='true'></i>}
                                <span className='vertical-line'></span>
                                <p>{thisQuestion?.questionPoints} marks</p>
                            </div>
                        </div>

                        {showAbacus && <AbacusSimulator onClose={() => setShowAbacus(false)} />}

                        <div className='question-form-body'>
                            {thisQuestion?.questionPic && <div className='d-flex question-img justify-content-center align-items-center'><img src={thisQuestion.questionPic} alt="Question visual aid" /></div>}
                            <pre>{thisQuestion?.question}</pre>

                            {thisQuestion?.typeOfAnswer === 'Essay' && (
                                <div className='math-keyboard'>
                                    <p>Write your answer here</p>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input
                                            ref={inputRef} type='text' value={answer} onFocus={handleInputFocus} readOnly
                                            placeholder='Enter the answer' className='input-style'
                                        />
                                        {showKeyboard && (
                                            <div ref={keyboardRef} className='keyboard-container'>
                                                {renderDigits()}
                                                <button className='question-form-btn keyboard-next-btn' onClick={() => { checkedQuestion(); }}>{checkLoading ? <span className='loader'></span> : 'next'}</button>
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
                                <h3 className='mcq-title'>Choose your answer:</h3>
                                <div className='mcq-answer-layout'>
                                    {thisQuestion.wrongAnswer?.map((item, index) => (
                                        <label key={item} className={`mcq-choice ${answer === item ? 'selected' : ''}`}>
                                            <input 
                                                type='radio' 
                                                value={item} 
                                                name={`mcq_${thisQuestion._id}`} 
                                                checked={answer === item}
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
                                <h3 className='mcq-title'>Choose your answer:</h3>
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
                                    <span className='loader'></span> Checking Answers...
                                </>
                            ) : (
                                'End Exam'
                            )}
                        </button>
                    </div>

                    <div className='alert alert-question-error-pocket'>This question is already added to pocket.</div>
                    <div className='alert alert-question-success-pocket'>Success! This question added to pocket.</div>
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
                        <p>Congratulations you have finished the exam</p>
                    </div>
                    <div className='result-popup-body'>
                        <table>
                            <thead><tr><th>Answered</th><th>Result</th><th>Total</th></tr></thead>
                            <tbody><tr><td>{answeredQuestions}</td><td>{points}</td><td>{totalSummation}</td></tr></tbody>
                        </table>
                    </div>
                    <Link to={`/Unit/${questionTypeID}/${subjectID}`} onClick={() => soundEffects.playClick()}><button className='button popup-btn'>Close</button></Link>
                </div>
            </div>
            
            <div className='add-to-class-popup teacher-list-popup question-list-popup class-popup-hide d-none justify-content-center align-items-center'>
                <div className='question-list-container teacher-list-container class-top'>
                    <div className='d-flex align-items-center justify-content-space-between update-popup-head'>
                        <p>Review Questions</p>
                        <div className='d-flex align-items-center question-list-right-side'>
                            <button onClick={() => { soundEffects.playClick(); removeAssignment(); }}>Remove Assignment</button>
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
                            <p>Title:</p>
                            <input type='text' value={title} onChange={e => setTitle(e.target.value)} placeholder='Assignment title (required)' />
                        </div>
                        <div className='timer d-flex align-items-center'>
                            <div><p>Timer (Mins):</p><input type='number' value={timer} onChange={e => setTimer(e.target.value)} placeholder='Optional' /></div>
                            <div><p>Attempts:</p><input type='number' value={attempts} onChange={e => setAttempts(e.target.value)} placeholder='Default: 1' /></div>
                        </div>
                        <div className='timer date-faild d-flex align-items-center'>
                            <div><p>Start Date:</p><input type='date' value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                            <div><p>Expiry Date:</p><input type='date' value={expiryData} onChange={e => setExpiryData(e.target.value)} /></div>
                        </div>
                        <div className='select-container d-flex'>
                            <div className='select-class'>
                                <select value={classSelector} onChange={e => setClassSelector(e.target.value)}>
                                    <option>Select Class</option>
                                    {classesList?.length === 0 ? <option>No classes available</option> : <option>All Classes</option>}
                                    {classesList?.map(item => <option key={item._id}>{item.class}</option>)}
                                </select>
                            </div>
                            <button onClick={addClassToBox}>Add</button>
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
                        <button className='button popup-btn' onClick={closeQuestionList}>Close</button>
                        <button className='button popup-btn2' onClick={handleCreateAssignment}>{loadingOperation ? <span className='loader'></span> : 'Upload'}</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Question;