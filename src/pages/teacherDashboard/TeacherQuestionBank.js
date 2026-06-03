import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Edit3, BookOpen, ChevronDown, Circle, CheckCircle2, Image, ArrowLeft, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import API_BASE_URL from '../../config/api.config';
import soundEffects from '../../utils/soundEffects';
import './TeacherQuestionBank.css';

function TeacherQuestionBank() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Navigation and Selection States
    const [questionTypeID, setQuestionTypeID] = useState('65a4963482dbaac16d820fc6'); // Default to MCQ
    const [systemData, setSystemData] = useState([]);
    const [unitData, setUnitData] = useState([]);
    const [selectedSystemId, setSelectedSystemId] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);

    // Question Loading States
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [operationLoading, setOperationLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null); // null for new, question object for edit

    // Form Field States
    const [questionText, setQuestionText] = useState('');
    const [questionPoints, setQuestionPoints] = useState(1);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    
    // MCQ Form States
    const [mcqCorrectAnswer, setMcqCorrectAnswer] = useState('');
    const [mcqWrongOption1, setMcqWrongOption1] = useState('');
    const [mcqWrongOption2, setMcqWrongOption2] = useState('');
    const [mcqWrongOption3, setMcqWrongOption3] = useState('');

    // Completion/Essay Form States
    const [essayAnswers, setEssayAnswers] = useState('');

    const fileInputRef = useRef(null);

    const loadChapterQuestions = useCallback(() => {
        setLoading(true);
        setErrorMsg(null);
        const Token = localStorage.getItem('O_authWEB');
        const URL = `${API_BASE_URL}/chapter/getChapterQuestion/${selectedChapter._id}`;
        
        fetch(URL, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
            },
        })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.message === 'success') {
                    setQuestions(responseJson.chapter?.questions || []);
                } else {
                    setErrorMsg(responseJson.message);
                }
                setLoading(false);
            })
            .catch((error) => {
                setErrorMsg(error.message);
                setLoading(false);
            });
    }, [selectedChapter]);

    // Fetch systems when question type changes
    useEffect(() => {
        if (questionTypeID) {
            setSelectedSystemId(null);
            setSelectedSubject(null);
            setSelectedUnitId(null);
            setSelectedChapter(null);
            setQuestions([]);
            getSystem(setLoading, setSystemData, questionTypeID);
        }
    }, [questionTypeID]);

    // Fetch units when subject changes
    useEffect(() => {
        if (selectedSubject) {
            setSelectedUnitId(null);
            setSelectedChapter(null);
            setQuestions([]);
            getUnit(setLoading, setUnitData, questionTypeID, selectedSubject._id);
        }
    }, [selectedSubject, questionTypeID]);

    // Fetch questions when chapter is selected
    useEffect(() => {
        if (selectedChapter) {
            loadChapterQuestions();
        }
    }, [selectedChapter, loadChapterQuestions]);

    const handleSelectSubject = (subject) => {
        soundEffects.playClick();
        setSelectedSubject(subject);
    };

    const handleSelectChapter = (chapter) => {
        soundEffects.playClick();
        setSelectedChapter(chapter);
    };

    const toggleSystemExpand = (systemId) => {
        soundEffects.playClick();
        setSelectedSystemId(selectedSystemId === systemId ? null : systemId);
    };

    const toggleUnitExpand = (unitId) => {
        soundEffects.playClick();
        setSelectedUnitId(selectedUnitId === unitId ? null : unitId);
    };

    const translateName = (name) => {
        const translationKey = `systemNames.${name}`;
        const translated = t(translationKey);
        return translated !== translationKey ? translated : name;
    };

    // Open Modal for New Question
    const handleOpenCreateModal = () => {
        soundEffects.playClick();
        setEditingQuestion(null);
        setQuestionText('');
        setQuestionPoints(1);
        setImageFile(null);
        setImagePreview('');
        setMcqCorrectAnswer('');
        setMcqWrongOption1('');
        setMcqWrongOption2('');
        setMcqWrongOption3('');
        setEssayAnswers('');
        setErrorMsg(null);
        setShowModal(true);
    };

    // Open Modal for Editing Question
    const handleOpenEditModal = (q) => {
        soundEffects.playClick();
        setEditingQuestion(q);
        setQuestionText(q.question || '');
        setQuestionPoints(q.questionPoints || 1);
        setImageFile(null);
        setImagePreview(q.questionPic || '');
        
        if (q.typeOfAnswer === 'MCQ') {
            setMcqCorrectAnswer(q.correctAnswer || '');
            setMcqWrongOption1(q.wrongAnswer?.[0] || '');
            setMcqWrongOption2(q.wrongAnswer?.[1] || '');
            setMcqWrongOption3(q.wrongAnswer?.[2] || '');
        } else {
            setEssayAnswers(q.answer?.join(', ') || '');
        }
        setErrorMsg(null);
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemovePreviewImage = () => {
        setImageFile(null);
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSaveQuestion = (e) => {
        e.preventDefault();
        soundEffects.playClick();

        if (!questionText.trim()) {
            setErrorMsg('Question text is required');
            return;
        }

        const isMCQ = questionTypeID === '65a4963482dbaac16d820fc6';

        if (isMCQ) {
            if (!mcqCorrectAnswer.trim() || !mcqWrongOption1.trim() || !mcqWrongOption2.trim() || !mcqWrongOption3.trim()) {
                setErrorMsg('All options (1 Correct and 3 Wrong options) are required for Multiple Choice questions.');
                return;
            }
        } else {
            if (!essayAnswers.trim()) {
                setErrorMsg('At least one correct answer is required.');
                return;
            }
        }

        setErrorMsg(null);
        setOperationLoading(true);

        const Token = localStorage.getItem('O_authWEB');
        const formData = new FormData();

        formData.append('question', questionText.trim());
        formData.append('questionPoints', questionPoints);
        formData.append('typeOfAnswer', isMCQ ? 'MCQ' : 'Essay');
        formData.append('chapter', selectedChapter._id);
        formData.append('index', 'last');

        if (imageFile) {
            formData.append('image', imageFile);
        }

        if (isMCQ) {
            formData.append('correctAnswer', mcqCorrectAnswer.trim());
            formData.append('wrongAnswer', mcqWrongOption1.trim());
            formData.append('wrongAnswer', mcqWrongOption2.trim());
            formData.append('wrongAnswer', mcqWrongOption3.trim());
        } else {
            const answers = essayAnswers.split(',').map(s => s.trim()).filter(Boolean);
            answers.forEach(ans => formData.append('answer', ans));
        }

        const isEditing = !!editingQuestion;
        const URL = isEditing 
            ? `${API_BASE_URL}/question/updateQuestion/${editingQuestion._id}`
            : `${API_BASE_URL}/question/addQuestion`;

        fetch(URL, {
            method: isEditing ? 'put' : 'post',
            headers: {
                'authrization': `pracYas09${Token}`
            },
            body: formData
        })
            .then((response) => response.json())
            .then((responseJson) => {
                setOperationLoading(false);
                if (responseJson.message === 'success') {
                    setSuccessMsg(isEditing ? 'Question updated successfully!' : 'Question added successfully!');
                    setShowModal(false);
                    loadChapterQuestions();
                    setTimeout(() => setSuccessMsg(null), 3000);
                } else {
                    setErrorMsg(responseJson.message || 'An error occurred while saving.');
                }
            })
            .catch((error) => {
                setOperationLoading(false);
                setErrorMsg(error.message || 'Network error.');
            });
    };

    const handleDeleteQuestion = (questionID) => {
        if (!window.confirm('Are you sure you want to delete this custom question?')) return;
        
        soundEffects.playClick();
        setOperationLoading(true);
        setErrorMsg(null);

        const Token = localStorage.getItem('O_authWEB');
        const URL = `${API_BASE_URL}/question/deleteQuestion/${questionID}/${selectedChapter._id}`;

        fetch(URL, {
            method: 'delete',
            headers: {
                'Content-Type': 'application/json',
                'authrization': `pracYas09${Token}`
            }
        })
            .then((response) => response.json())
            .then((responseJson) => {
                setOperationLoading(false);
                if (responseJson.message === 'success') {
                    setSuccessMsg('Question deleted successfully!');
                    loadChapterQuestions();
                    setTimeout(() => setSuccessMsg(null), 3000);
                } else {
                    setErrorMsg(responseJson.message);
                }
            })
            .catch((error) => {
                setOperationLoading(false);
                setErrorMsg(error.message);
            });
    };

    const userTeacherId = localStorage.getItem('pp_id');

    return (
        <div className="question-bank-layout">
            <Navbar />
            <MobileNav role="Teacher" />

            <div className="question-bank-container">
                {/* Header Section */}
                <div className="qb-header">
                    <button className="qb-back-btn" onClick={() => navigate('/dashboard/teacher')}>
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                    <div className="qb-title-row">
                        <h1>📁 Teacher Question Bank</h1>
                        <p>Upload, organize, and customize questions for your homework assignments.</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="qb-main-grid">
                    {/* Left Column: System/Subject/Chapter Selector */}
                    <div className="qb-selector-sidebar">
                        {/* 1. Question Type Switcher */}
                        <div className="qb-type-switcher">
                            <button 
                                className={`type-switch-btn ${questionTypeID === '65a4963482dbaac16d820fc6' ? 'active' : ''}`}
                                onClick={() => { soundEffects.playClick(); setQuestionTypeID('65a4963482dbaac16d820fc6'); }}
                            >
                                <Circle size={16} /> MCQ Format
                            </button>
                            <button 
                                className={`type-switch-btn ${questionTypeID === '65a4964b82dbaac16d820fc8' ? 'active' : ''}`}
                                onClick={() => { soundEffects.playClick(); setQuestionTypeID('65a4964b82dbaac16d820fc8'); }}
                            >
                                <CheckCircle2 size={16} /> Completion Format
                            </button>
                        </div>

                        {/* 2. Systems Accordion */}
                        <div className="qb-systems-list">
                            <h3>Choose Book & Unit</h3>
                            {loading && systemData.length === 0 ? (
                                <div className="qb-loading-state">Loading books...</div>
                            ) : systemData.length === 0 ? (
                                <div className="qb-empty-state">No systems found.</div>
                            ) : (
                                systemData.map((system) => {
                                    const isExpanded = selectedSystemId === system._id;
                                    return (
                                        <div key={system._id} className={`system-node ${isExpanded ? 'expanded' : ''}`}>
                                            <div className="system-node-header" onClick={() => toggleSystemExpand(system._id)}>
                                                <span>{translateName(system.systemName)}</span>
                                                <ChevronDown size={16} className="arrow-icon" />
                                            </div>
                                            {isExpanded && (
                                                <div className="system-node-content">
                                                    {system.subjects?.map((subject) => {
                                                        const isSubActive = selectedSubject?._id === subject._id;
                                                        return (
                                                            <div 
                                                                key={subject._id} 
                                                                className={`subject-node-item ${isSubActive ? 'active' : ''}`}
                                                                onClick={() => handleSelectSubject(subject)}
                                                            >
                                                                <BookOpen size={14} />
                                                                <span>{translateName(subject.subjectName)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* 3. Units & Chapters List */}
                        {selectedSubject && (
                            <div className="qb-units-list animate-slide-in">
                                <h3>Units in {translateName(selectedSubject.subjectName)}</h3>
                                {unitData.length === 0 ? (
                                    <div className="qb-empty-state">No units found.</div>
                                ) : (
                                    unitData.map((unit) => {
                                        const isExpanded = selectedUnitId === unit._id;
                                        return (
                                            <div key={unit._id} className={`unit-node ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="unit-node-header" onClick={() => toggleUnitExpand(unit._id)}>
                                                    <span>{translateName(unit.unitName)}</span>
                                                    <ChevronDown size={16} className="arrow-icon" />
                                                </div>
                                                {isExpanded && (
                                                    <div className="unit-node-content">
                                                        {unit.chapters?.map((chapter) => {
                                                            const isChActive = selectedChapter?._id === chapter._id;
                                                            return (
                                                                <div 
                                                                    key={chapter._id} 
                                                                    className={`chapter-node-item ${isChActive ? 'active' : ''}`}
                                                                    onClick={() => handleSelectChapter(chapter)}
                                                                >
                                                                    📄 {translateName(chapter.chapterName)}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Question Viewer */}
                    <div className="qb-content-panel">
                        {successMsg && <div className="qb-success-banner">{successMsg}</div>}
                        {errorMsg && <div className="qb-error-banner">{errorMsg}</div>}

                        {!selectedChapter ? (
                            <div className="qb-instruction-card">
                                <HelpCircle size={48} className="help-icon" />
                                <h2>No Chapter Selected</h2>
                                <p>Select a worksheet format, choose a Book, select a Subject, and expand a Unit to choose a Chapter and load its questions.</p>
                            </div>
                        ) : (
                            <div className="qb-questions-list-wrapper">
                                <div className="qb-list-header">
                                    <div className="chapter-badge">
                                        📄 {translateName(selectedChapter.chapterName)}
                                    </div>
                                    <button className="qb-add-question-btn" onClick={handleOpenCreateModal}>
                                        <Plus size={16} /> Add Custom Question
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="qb-loading-box">
                                        <div className="qb-spinner"></div>
                                        <p>Loading questions...</p>
                                    </div>
                                ) : questions.length === 0 ? (
                                    <div className="qb-empty-box">
                                        <p>No questions in this chapter yet. Click "Add Custom Question" to create one!</p>
                                    </div>
                                ) : (
                                    <div className="qb-cards-grid">
                                        {questions.map((q, idx) => {
                                            const isCustom = q.createdBy && String(q.createdBy) === String(userTeacherId);
                                            return (
                                                <div key={q._id} className={`qb-question-card ${isCustom ? 'custom-q' : ''}`}>
                                                    <div className="qb-card-header">
                                                        <span className="q-index-pill">Q{idx + 1}</span>
                                                        <span className="q-points-pill">{q.questionPoints} pts</span>
                                                        <span className={`q-type-badge ${isCustom ? 'custom-badge' : 'system-badge'}`}>
                                                            {isCustom ? 'Custom' : 'System'}
                                                        </span>
                                                        
                                                        {isCustom && (
                                                            <div className="q-actions">
                                                                <button 
                                                                    onClick={() => handleOpenEditModal(q)} 
                                                                    className="q-action-btn edit-btn" 
                                                                    title="Edit Question"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteQuestion(q._id)} 
                                                                    className="q-action-btn delete-btn" 
                                                                    title="Delete Question"
                                                                    disabled={operationLoading}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="qb-card-body">
                                                        {q.questionPic && (
                                                            <div className="qb-q-image-container">
                                                                <img src={q.questionPic} alt="Question visual" />
                                                            </div>
                                                        )}
                                                        <pre className="q-text">{q.question}</pre>
                                                    </div>

                                                    <div className="qb-card-footer">
                                                        {q.typeOfAnswer === 'MCQ' ? (
                                                            <div className="q-answers-display">
                                                                <div className="mcq-option correct">
                                                                    <span className="bullet">✓</span> {q.correctAnswer}
                                                                </div>
                                                                {q.wrongAnswer?.map((opt, oIdx) => (
                                                                    <div key={oIdx} className="mcq-option wrong">
                                                                        <span className="bullet">✗</span> {opt}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="q-answers-display">
                                                                <span className="essay-label">Accepted Answers:</span>
                                                                <div className="essay-pills">
                                                                    {q.answer?.map((ans, aIdx) => (
                                                                        <span key={aIdx} className="essay-pill">{ans}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Creation/Editing Modal */}
            {showModal && (
                <div className="qb-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="qb-modal-card animate-pop-in" onClick={(e) => e.stopPropagation()}>
                        <div className="qb-modal-header">
                            <h2>{editingQuestion ? '✏️ Edit Question' : '✨ Add Custom Question'}</h2>
                            <button className="qb-modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuestion} className="qb-modal-form">
                            {/* Question Text */}
                            <div className="form-group">
                                <label>Question Text/Formula <span className="required-star">*</span></label>
                                <textarea 
                                    value={questionText} 
                                    onChange={e => setQuestionText(e.target.value)} 
                                    placeholder="Enter your question text or math terms here (e.g. 5 + 2)"
                                    rows={4}
                                    required
                                />
                                <small className="helper-text">For math racers or vertical terms, separate values with newlines.</small>
                            </div>

                            {/* Point Value */}
                            <div className="form-group">
                                <label>Question Points <span className="required-star">*</span></label>
                                <input 
                                    type="number" 
                                    value={questionPoints} 
                                    onChange={e => setQuestionPoints(parseInt(e.target.value) || 1)} 
                                    min={1}
                                    max={100}
                                    required
                                />
                            </div>

                            {/* Question Image (Cloudinary Upload) */}
                            <div className="form-group">
                                <label>Question Image (Optional)</label>
                                <div className="image-upload-wrapper">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange}
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                    />
                                    <button 
                                        type="button" 
                                        className="upload-btn-trigger"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Image size={16} /> Choose Image file
                                    </button>
                                    
                                    {imagePreview && (
                                        <div className="image-upload-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <button 
                                                type="button" 
                                                className="remove-preview-btn"
                                                onClick={handleRemovePreviewImage}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* MCQ Dynamic Fields */}
                            {questionTypeID === '65a4963482dbaac16d820fc6' ? (
                                <div className="form-mcq-fields animate-fade-in">
                                    <h3>Configure Options</h3>
                                    <div className="form-group">
                                        <label>Correct Answer <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            value={mcqCorrectAnswer} 
                                            onChange={e => setMcqCorrectAnswer(e.target.value)} 
                                            placeholder="Enter the correct option"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Wrong Option 1 <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            value={mcqWrongOption1} 
                                            onChange={e => setMcqWrongOption1(e.target.value)} 
                                            placeholder="Enter incorrect option 1"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Wrong Option 2 <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            value={mcqWrongOption2} 
                                            onChange={e => setMcqWrongOption2(e.target.value)} 
                                            placeholder="Enter incorrect option 2"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Wrong Option 3 <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            value={mcqWrongOption3} 
                                            onChange={e => setMcqWrongOption3(e.target.value)} 
                                            placeholder="Enter incorrect option 3"
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Completion Dynamic Fields */
                                <div className="form-completion-fields animate-fade-in">
                                    <h3>Configure Answers</h3>
                                    <div className="form-group">
                                        <label>Accepted Correct Answers <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            value={essayAnswers} 
                                            onChange={e => setEssayAnswers(e.target.value)} 
                                            placeholder="e.g. 10, +10, ten"
                                            required
                                        />
                                        <small className="helper-text">Separate multiple acceptable variations with a comma (,).</small>
                                    </div>
                                </div>
                            )}

                            {errorMsg && <div className="form-error-banner">{errorMsg}</div>}

                            <div className="form-actions-row">
                                <button 
                                    type="button" 
                                    className="form-cancel-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="form-submit-btn"
                                    disabled={operationLoading}
                                >
                                    {operationLoading ? <span className="qb-loader-small"></span> : 'Save Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherQuestionBank;
