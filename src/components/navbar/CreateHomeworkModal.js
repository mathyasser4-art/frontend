import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Circle, CheckCircle2, BookOpen, Layers, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import getClass from '../../api/teacher/getClass.api';
import API_BASE_URL, { ENABLE_CUSTOM_QUESTION_BANK } from '../../config/api.config';
import soundEffects from '../../utils/soundEffects';
import './CreateHomeworkModal.css';

function CreateHomeworkModal({ onClose }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState('type'); // 'type' | 'system' | 'unit' | 'details'
    const [questionTypeID, setQuestionTypeID] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedSystemId, setSelectedSystemId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);

    const [systemData, setSystemData] = useState([]);
    const [unitData, setUnitData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Custom Worksheets states
    const [customChapters, setCustomChapters] = useState([]);
    const [loadingCustom, setLoadingCustom] = useState(false);

    // New states for Assignment Details
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [chapterQuestions, setChapterQuestions] = useState([]);
    const [classesList, setClassesList] = useState([]);
    const [title, setTitle] = useState('');
    const [timer, setTimer] = useState('');
    const [startDate, setStartDate] = useState('');
    const [expiryData, setExpiryData] = useState('');
    const [classesBox, setClassesBox] = useState([]);
    const [classSelector, setClassSelector] = useState('');
    const [forceFlashMode, setForceFlashMode] = useState(false);
    const [assignmentFlashSpeed, setAssignmentFlashSpeed] = useState(1.0);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [assignLoading, setAssignLoading] = useState(false);

    // Load systems when we select the type
    useEffect(() => {
        if (questionTypeID && questionTypeID !== 'custom') {
            getSystem(setLoading, setSystemData, questionTypeID);
        }
    }, [questionTypeID]);

    // Load units when we select a subject
    useEffect(() => {
        if (selectedSubject && questionTypeID !== 'custom') {
            getUnit(setLoading, setUnitData, questionTypeID, selectedSubject._id);
        }
    }, [selectedSubject, questionTypeID]);

    // Load custom worksheets when selected
    useEffect(() => {
        if (questionTypeID === 'custom') {
            setLoadingCustom(true);
            const Token = localStorage.getItem('O_authWEB');
            fetch(`${API_BASE_URL}/chapter/custom`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.message === 'success') {
                        setCustomChapters(data.chapters || []);
                    } else {
                        setErrorMsg(data.message);
                    }
                    setLoadingCustom(false);
                })
                .catch(err => {
                    setErrorMsg(err.message);
                    setLoadingCustom(false);
                });
        }
    }, [questionTypeID]);

    // Load classes when the modal mounts
    useEffect(() => {
        const isAuth = localStorage.getItem('O_authWEB');
        const role = localStorage.getItem('auth_role');
        if (isAuth && (role === 'Teacher' || role === 'School')) {
            getClass(() => {}, setClassesList);
        }
    }, []);

    // Load questions when selectedChapter changes
    useEffect(() => {
        if (selectedChapter) {
            setLoading(true);
            setErrorMsg(null);
            const URL = `${API_BASE_URL}/chapter/getChapterQuestion/${selectedChapter._id}`;
            const Token = localStorage.getItem('O_authWEB');
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
                        setChapterQuestions(responseJson.chapter?.questions || []);
                    } else {
                        setErrorMsg(responseJson.message);
                    }
                    setLoading(false);
                })
                .catch((error) => {
                    setErrorMsg(error.message);
                    setLoading(false);
                });
        }
    }, [selectedChapter]);

    const handleSelectType = (type) => {
        soundEffects.playClick();
        if (type === 'mcq') {
            setQuestionTypeID('65a4963482dbaac16d820fc6');
            setStep('system');
        } else if (type === 'completion') {
            setQuestionTypeID('65a4964b82dbaac16d820fc8');
            setStep('system');
        } else if (type === 'custom') {
            setQuestionTypeID('custom');
            setStep('custom-worksheets');
        }
    };

    const handleSelectSubject = (subject) => {
        soundEffects.playClick();
        setSelectedSubject(subject);
        setStep('unit');
    };

    const handleSelectChapter = (chapter) => {
        soundEffects.playClick();
        setSelectedChapter(chapter);
        setStep('details');
        if (chapter.format) {
            setQuestionTypeID(chapter.format === 'MCQ' ? '65a4963482dbaac16d820fc6' : '65a4964b82dbaac16d820fc8');
        }
    };

    const handleSelectCustomChapter = (chapter) => {
        soundEffects.playClick();
        setSelectedChapter(chapter);
        setStep('details');
        if (chapter.format) {
            setQuestionTypeID(chapter.format === 'MCQ' ? '65a4963482dbaac16d820fc6' : '65a4964b82dbaac16d820fc8');
        }
    };

    const handleBack = () => {
        soundEffects.playClick();
        if (step === 'details') {
            if (questionTypeID === 'custom') {
                setStep('custom-worksheets');
            } else {
                setStep('unit');
            }
            setSelectedChapter(null);
            setChapterQuestions([]);
            setErrorMsg(null);
            setSuccessMsg(null);
        } else if (step === 'custom-worksheets') {
            setStep('type');
            setQuestionTypeID('');
            setCustomChapters([]);
        } else if (step === 'unit') {
            setStep('system');
            setSelectedSubject(null);
            setUnitData([]);
            setSelectedUnitId(null);
        } else if (step === 'system') {
            setStep('type');
            setQuestionTypeID('');
            setSystemData([]);
            setSelectedSystemId(null);
        }
    };

    const toggleSystemExpand = (systemId) => {
        soundEffects.playClick();
        setSelectedSystemId(selectedSystemId === systemId ? null : systemId);
    };

    const toggleUnitExpand = (unitId) => {
        soundEffects.playClick();
        setSelectedUnitId(selectedUnitId === unitId ? null : unitId);
    };

    // Helper translation functions
    const translateName = (name) => {
        const translationKey = `systemNames.${name}`;
        const translated = t(translationKey);
        return translated !== translationKey ? translated : name;
    };

    const addClassToBox = () => {
        soundEffects.playClick();
        if (!classSelector || classSelector === t('questionPage.selectClass')) {
            setErrorMsg(t('questionPage.mustSelectClassFirst', 'You must select a class first'));
        } else {
            setErrorMsg(null);
            if (classSelector === t('questionPage.allClasses')) {
                setClassesBox(classesList);
            } else if (!classesBox.some(c => c.class === classSelector)) {
                const classToAdd = classesList.find(c => c.class === classSelector);
                if (classToAdd) setClassesBox(prev => [...prev, classToAdd]);
            } else {
                setErrorMsg(t('questionPage.classAlreadyAdded', 'Class already added'));
            }
        }
    };

    const removeClassFromBox = (thisClass) => {
        soundEffects.playClick();
        setClassesBox(prev => prev.filter(c => c.class !== thisClass));
    };

    const handleRemoveQuestion = (questionID) => {
        soundEffects.playClick();
        setChapterQuestions(prev => prev.filter(q => q._id !== questionID));
    };

    const handleCreateAssignment = () => {
        soundEffects.playClick();
        if (classesBox.length === 0 || !title) {
            setErrorMsg(t('questionPage.mustSelectClassAndTitle', 'You must select a class and enter a title'));
            return;
        }
        if (chapterQuestions.length === 0) {
            setErrorMsg(t('questionPage.mustHaveQuestions', 'You must have at least one question'));
            return;
        }
        if (startDate && !expiryData) {
            setErrorMsg(t('questionPage.mustAddExpiryDate', 'You must add an expiry date'));
            return;
        }
        if (!startDate && expiryData) {
            setErrorMsg(t('questionPage.mustAddStartDate', 'You must add a start date'));
            return;
        }

        setErrorMsg(null);
        setAssignLoading(true);

        const data = {
            questions: chapterQuestions.map(q => q._id),
            totalPoints: chapterQuestions.reduce((sum, q) => sum + (q.questionPoints || 0), 0),
            timer: timer || undefined,
            attemptsNumber: 1,
            startDate: startDate || undefined,
            endDate: expiryData || undefined,
            classes: classesBox.map(c => c._id),
            title,
            forceFlashMode: forceFlashMode,
            flashSpeed: forceFlashMode ? assignmentFlashSpeed : undefined
        };

        const Token = localStorage.getItem('O_authWEB');
        const URL = `${API_BASE_URL}/assignment/createAssignment`;

        fetch(URL, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'authrization': `pracYas09${Token}`
            },
            body: JSON.stringify(data)
        })
            .then((response) => response.json())
            .then((responseJson) => {
                setAssignLoading(false);
                if (responseJson.message === 'success') {
                    setSuccessMsg(t('questionPage.homeworkAssignedSuccess', 'Homework assigned successfully!'));
                    // Clear fields
                    setTimer('');
                    setExpiryData('');
                    setStartDate('');
                    setTitle('');
                    setClassesBox([]);
                    setForceFlashMode(false);
                    setAssignmentFlashSpeed(1.0);
                    // Close after a brief delay
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                } else {
                    setErrorMsg(responseJson.message);
                }
            })
            .catch((error) => {
                setAssignLoading(false);
                setErrorMsg(error.message);
            });
    };

    return (
        <div className="homework-wizard-overlay" onClick={onClose}>
            <div className="homework-wizard-modal animate-pop-in" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="homework-wizard-header">
                    <div className="header-left">
                        {step !== 'type' && (
                            <button className="wizard-back-btn" onClick={handleBack} title="Back">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2>✨ Create Homework</h2>
                    </div>
                    <button className="wizard-close-btn" onClick={onClose} title="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="wizard-progress-bar">
                    <div className={`progress-step ${step === 'type' ? 'active' : ''} ${step !== 'type' ? 'completed' : ''}`}>
                        <div className="step-num">1</div>
                        <span>Type</span>
                    </div>
                    
                    {questionTypeID !== 'custom' ? (
                        <>
                            <div className="progress-connector"></div>
                            <div className={`progress-step ${step === 'system' ? 'active' : ''} ${step === 'unit' || step === 'details' ? 'completed' : ''}`}>
                                <div className="step-num">2</div>
                                <span>System & Subject</span>
                            </div>
                            <div className="progress-connector"></div>
                            <div className={`progress-step ${step === 'unit' ? 'active' : ''} ${step === 'details' ? 'completed' : ''}`}>
                                <div className="step-num">3</div>
                                <span>Unit & Chapter</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="progress-connector"></div>
                            <div className={`progress-step ${step === 'custom-worksheets' ? 'active' : ''} ${step === 'details' ? 'completed' : ''}`}>
                                <div className="step-num">2</div>
                                <span>Custom Worksheet</span>
                            </div>
                        </>
                    )}
                    
                    <div className="progress-connector"></div>
                    <div className={`progress-step ${step === 'details' ? 'active' : ''}`}>
                        <div className="step-num">{questionTypeID !== 'custom' ? 4 : 3}</div>
                        <span>Details</span>
                    </div>
                </div>

                {/* Modal Body / Steps */}
                <div className="homework-wizard-body">
                    {loading && (
                        <div className="wizard-loader">
                            <div className="spinner"></div>
                            <p>Loading details...</p>
                        </div>
                    )}

                    {!loading && step === 'type' && (
                        <div className="wizard-step-container step-type">
                            <p className="step-instruction">Select the format of the questions for this homework:</p>
                            <div className="type-options-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                <div className="type-card mcq-card" onClick={() => handleSelectType('mcq')}>
                                    <div className="type-icon-circle mcq-icon-bg">
                                        <Circle size={40} className="type-icon" />
                                    </div>
                                    <h3>Multiple Choice (MCQ)</h3>
                                    <p>Students select the correct answer from options.</p>
                                    <button className="select-type-action-btn">Choose MCQ <ChevronRight size={16} /></button>
                                </div>
                                <div className="type-card completion-card" onClick={() => handleSelectType('completion')}>
                                    <div className="type-icon-circle completion-icon-bg">
                                        <CheckCircle2 size={40} className="type-icon" />
                                    </div>
                                    <h3>Completion</h3>
                                    <p>Students write the numeric/final answer directly.</p>
                                    <button className="select-type-action-btn">Choose Completion <ChevronRight size={16} /></button>
                                </div>
                                {ENABLE_CUSTOM_QUESTION_BANK && (
                                    <div className="type-card custom-worksheets-card" onClick={() => handleSelectType('custom')}>
                                        <div className="type-icon-circle custom-icon-bg" style={{ background: 'rgba(124, 58, 237, 0.1)' }}>
                                            <BookOpen size={40} className="type-icon" style={{ color: '#7c3aed' }} />
                                        </div>
                                        <h3>My Custom Worksheets</h3>
                                        <p>Assign worksheets you created from scratch.</p>
                                        <button className="select-type-action-btn">Choose Custom <ChevronRight size={16} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && step === 'custom-worksheets' && (
                        <div className="wizard-step-container step-custom-worksheets">
                            <p className="step-instruction">Select one of your custom worksheets to assign:</p>
                            {loadingCustom ? (
                                <div className="wizard-loader">
                                    <div className="spinner"></div>
                                    <p>Loading custom worksheets...</p>
                                </div>
                            ) : customChapters.length === 0 ? (
                                <div className="wizard-empty-state">
                                    <p>No custom worksheets found. Go to "Create Questions" to make one first!</p>
                                </div>
                            ) : (
                                <div className="custom-worksheets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    {customChapters.map((ws) => (
                                        <div 
                                            key={ws._id} 
                                            className="type-card" 
                                            onClick={() => handleSelectCustomChapter(ws)}
                                            style={{ padding: '1.25rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', background: '#fff' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '18px' }}>📄</span>
                                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{ws.chapterName}</h3>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                                Format: {ws.format} • {ws.questions?.length || 0} Questions
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && step === 'system' && (
                        <div className="wizard-step-container step-system">
                            <p className="step-instruction">Choose a System, then select a Subject:</p>
                            <div className="systems-accordion-list">
                                {systemData.length === 0 ? (
                                    <div className="wizard-empty-state">No systems found.</div>
                                ) : (
                                    systemData.map((system) => {
                                        const isExpanded = selectedSystemId === system._id;
                                        return (
                                            <div key={system._id} className={`system-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="system-accordion-header" onClick={() => toggleSystemExpand(system._id)}>
                                                    <div className="system-title-wrapper">
                                                        <Layers size={18} className="system-icon" />
                                                        <span>{translateName(system.systemName)}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                                {isExpanded && (
                                                    <div className="system-accordion-content">
                                                        {system.subjects?.length === 0 ? (
                                                            <div className="no-subjects-text">No subjects in this system.</div>
                                                        ) : (
                                                            <div className="subjects-grid">
                                                                 {system.subjects?.map((subject) => (
                                                                    <div key={subject._id} className="subject-button" onClick={() => handleSelectSubject(subject)}>
                                                                        <BookOpen size={16} className="subj-icon" />
                                                                        <span>{translateName(subject.subjectName)}</span>
                                                                        <ChevronRight size={14} className="arrow-right-icon" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && step === 'unit' && (
                        <div className="wizard-step-container step-unit">
                            <div className="selected-breadcrumb-path">
                                <span>{questionTypeID === '65a4963482dbaac16d820fc6' ? 'Multiple Choice' : 'Completion'}</span>
                                <ChevronRight size={12} />
                                <span className="breadcrumb-active">{translateName(selectedSubject?.subjectName)}</span>
                            </div>
                            <p className="step-instruction">Expand a Unit, and choose the Chapter (File) for homework questions:</p>
                            
                            <div className="units-accordion-list">
                                {unitData.length === 0 ? (
                                    <div className="wizard-empty-state">No units found for this subject.</div>
                                ) : (
                                    unitData.map((unit) => {
                                        const isExpanded = selectedUnitId === unit._id;
                                        return (
                                            <div key={unit._id} className={`unit-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="unit-accordion-header" onClick={() => toggleUnitExpand(unit._id)}>
                                                    <div className="unit-title-wrapper">
                                                        <Layers size={18} className="unit-icon" />
                                                        <span>{translateName(unit.unitName)}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                                {isExpanded && (
                                                    <div className="unit-accordion-content">
                                                        {unit.chapters?.length === 0 ? (
                                                            <div className="no-chapters-text">No chapters available in this unit.</div>
                                                        ) : (
                                                            <div className="chapters-grid">
                                                                {unit.chapters?.map((chapter) => (
                                                                    <div key={chapter._id} className="chapter-item-btn" onClick={() => handleSelectChapter(chapter)}>
                                                                        <span className="chapter-bullet">📄</span>
                                                                        <span>{translateName(chapter.chapterName)}</span>
                                                                        <span className="chapter-action-pill">Select</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && step === 'details' && (
                        <div className="wizard-step-container step-details">
                            <div className="selected-breadcrumb-path">
                                <span>{questionTypeID === '65a4963482dbaac16d820fc6' ? 'Multiple Choice' : 'Completion'}</span>
                                <ChevronRight size={12} />
                                <span>{translateName(selectedSubject?.subjectName)}</span>
                                <ChevronRight size={12} />
                                <span className="breadcrumb-active">{translateName(selectedChapter?.chapterName)}</span>
                            </div>
                            
                            <div className="details-form-container">
                                <div className="details-form-fields">
                                    <div className="form-group">
                                        <label>{t('questionPage.title', 'Assignment Title')} <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            value={title} 
                                            onChange={e => setTitle(e.target.value)} 
                                            placeholder={t('questionPage.assignmentTitlePlaceholder', 'Enter assignment title')} 
                                            className="details-input"
                                        />
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group flex-1">
                                            <label>{t('questionPage.startDate', 'Start Date')}</label>
                                            <input 
                                                type="date" 
                                                value={startDate} 
                                                onChange={e => setStartDate(e.target.value)} 
                                                className="details-input"
                                            />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>{t('questionPage.expiryDate', 'Expiry Date')}</label>
                                            <input 
                                                type="date" 
                                                value={expiryData} 
                                                onChange={e => setExpiryData(e.target.value)} 
                                                className="details-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group flex-1">
                                            <label>{t('questionPage.timerMinutes', 'Timer (Minutes)')}</label>
                                            <input 
                                                type="number" 
                                                value={timer} 
                                                onChange={e => setTimer(e.target.value)} 
                                                placeholder={t('questionPage.optional', 'Optional')} 
                                                className="details-input"
                                            />
                                        </div>
                                        
                                        <div className="form-group flex-1 d-flex flex-direction-column justify-content-end">
                                            <div 
                                                className={`wizard-force-flash-toggle ${forceFlashMode ? 'active' : ''}`}
                                                onClick={() => setForceFlashMode(!forceFlashMode)}
                                            >
                                                <i className="fa fa-bolt" aria-hidden="true"></i>
                                                <span>{forceFlashMode ? t('questionPage.flashForced', 'Flash Forced') : t('questionPage.flashOptional', 'Flash Optional')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {forceFlashMode && (
                                        <div className="form-group animate-slide-down">
                                            <label>{t('questionPage.flashSpeed', 'Flash Speed (Seconds)')}</label>
                                            <select 
                                                value={assignmentFlashSpeed} 
                                                onChange={(e) => setAssignmentFlashSpeed(parseFloat(e.target.value))}
                                                className="details-select"
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

                                    <div className="form-group">
                                        <label>{t('questionPage.selectClass', 'Select Class')} <span className="required-star">*</span></label>
                                        <div className="class-selector-input-group">
                                            <select 
                                                value={classSelector} 
                                                onChange={e => setClassSelector(e.target.value)}
                                                className="details-select flex-grow-1"
                                            >
                                                <option value="">{t('questionPage.selectClass', 'Select Class')}</option>
                                                {classesList?.length === 0 ? (
                                                    <option>{t('questionPage.noClassesAvailable', 'No classes available')}</option>
                                                ) : (
                                                    <option value={t('questionPage.allClasses', 'All Classes')}>{t('questionPage.allClasses', 'All Classes')}</option>
                                                )}
                                                {classesList?.map(item => (
                                                    <option key={item._id} value={item.class}>{item.class}</option>
                                                ))}
                                            </select>
                                            <button type="button" onClick={addClassToBox} className="add-class-btn">
                                                <Plus size={16} /> {t('questionPage.add', 'Add')}
                                            </button>
                                        </div>
                                    </div>

                                    {classesBox.length > 0 && (
                                        <div className="selected-classes-pills">
                                            {classesBox.map(item => (
                                                <div key={item._id} className="class-pill">
                                                    <span>{item.class}</span>
                                                    <button type="button" onClick={() => removeClassFromBox(item.class)} className="remove-pill-btn">x</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="details-questions-preview">
                                    <h3>📑 Questions Preview ({chapterQuestions.length})</h3>
                                    <div className="questions-preview-list">
                                        {chapterQuestions.map((q, idx) => (
                                            <div key={q._id} className="preview-question-card">
                                                <div className="preview-question-header">
                                                    <span className="q-number">#{idx + 1}</span>
                                                    <span className="q-points">{q.questionPoints} pts</span>
                                                    <button type="button" onClick={() => handleRemoveQuestion(q._id)} className="delete-question-btn" title="Remove question from assignment">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="preview-question-body">
                                                    {q.questionPic && <img src={q.questionPic} alt="Question visual" className="preview-q-img" />}
                                                    <pre>{q.question}</pre>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {errorMsg && <div className="wizard-error-msg">{errorMsg}</div>}
                            {successMsg && <div className="wizard-success-msg">{successMsg}</div>}

                            <div className="details-actions-footer">
                                <button 
                                    type="button" 
                                    className="wizard-submit-btn" 
                                    onClick={handleCreateAssignment}
                                    disabled={assignLoading}
                                >
                                    {assignLoading ? <span className="spinner-small"></span> : '🚀 Create & Assign'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CreateHomeworkModal;
