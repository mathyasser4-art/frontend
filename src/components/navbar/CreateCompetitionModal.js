import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Circle, CheckCircle2, BookOpen, Layers, Trash2, Swords, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import API_BASE_URL from '../../config/api.config';
import soundEffects from '../../utils/soundEffects';
import { createCompetition } from '../../api/competition/competition.api';
import './CreateCompetitionModal.css';

function CreateCompetitionModal({ onClose }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState('source'); // 'source' | 'type' | 'system' | 'unit' | 'custom-ws' | 'assignments' | 'details'
    const [questionTypeID, setQuestionTypeID] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedSystemId, setSelectedSystemId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);

    const [systemData, setSystemData] = useState([]);
    const [unitData, setUnitData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Custom worksheets and assignments
    const [customWorksheets, setCustomWorksheets] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Competition details
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [chapterQuestions, setChapterQuestions] = useState([]);
    const [battleTitle, setBattleTitle] = useState('');
    const [battleTimer, setBattleTimer] = useState(300);
    const [errorMsg, setErrorMsg] = useState(null);
    const [creating, setCreating] = useState(false);

    const loadCustomWorksheets = () => {
        setLoading(true);
        setErrorMsg(null);
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
                    setCustomWorksheets(data.chapters || []);
                    setStep('custom-ws');
                    setSearchQuery('');
                } else {
                    setErrorMsg(data.message);
                }
                setLoading(false);
            })
            .catch(err => {
                setErrorMsg(err.message);
                setLoading(false);
            });
    };

    const loadMyAssignments = () => {
        setLoading(true);
        setErrorMsg(null);
        const Token = localStorage.getItem('O_authWEB');
        fetch(`${API_BASE_URL}/teacher/getAssignment`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'success') {
                    setMyAssignments(data.allAssignment || []);
                    setStep('assignments');
                    setSearchQuery('');
                } else {
                    setErrorMsg(data.message);
                }
                setLoading(false);
            })
            .catch(err => {
                setErrorMsg(err.message);
                setLoading(false);
            });
    };

    // Load systems when question type is selected
    useEffect(() => {
        if (questionTypeID) {
            getSystem(setLoading, setSystemData, questionTypeID);
        }
    }, [questionTypeID]);

    // Load units when subject is selected
    useEffect(() => {
        if (selectedSubject) {
            getUnit(setLoading, setUnitData, questionTypeID, selectedSubject._id);
        }
    }, [selectedSubject, questionTypeID]);

    // Load chapter questions when chapter selected
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
                .then(r => r.json())
                .then(responseJson => {
                    if (responseJson.message === 'success') {
                        setChapterQuestions(responseJson.chapter?.questions || []);
                    } else {
                        setErrorMsg(responseJson.message);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    setErrorMsg(err.message);
                    setLoading(false);
                });
        }
    }, [selectedChapter]);

    const handleSelectType = (type) => {
        soundEffects.playClick();
        setQuestionTypeID(type === 'mcq' ? '65a4963482dbaac16d820fc6' : '65a4964b82dbaac16d820fc8');
        setStep('system');
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
    };

    const handleBack = () => {
        soundEffects.playClick();
        if (step === 'details') {
            if (selectedSubject) {
                setStep('unit');
                setSelectedChapter(null);
                setChapterQuestions([]);
            } else if (selectedChapter) {
                setStep('custom-ws');
                setSelectedChapter(null);
                setChapterQuestions([]);
            } else {
                setStep('assignments');
                setChapterQuestions([]);
            }
            setErrorMsg(null);
        } else if (step === 'custom-ws' || step === 'assignments' || step === 'type') {
            setStep('source');
            setSelectedChapter(null);
            setChapterQuestions([]);
            setErrorMsg(null);
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

    const toggleSystemExpand = (id) => {
        soundEffects.playClick();
        setSelectedSystemId(selectedSystemId === id ? null : id);
    };

    const toggleUnitExpand = (id) => {
        soundEffects.playClick();
        setSelectedUnitId(selectedUnitId === id ? null : id);
    };

    const translateName = (name) => {
        if (!name) return '';
        const key = `systemNames.${name}`;
        const translated = t(key);
        return translated !== key ? translated : name;
    };

    const handleRemoveQuestion = (qId) => {
        soundEffects.playClick();
        setChapterQuestions(prev => prev.filter(q => q._id !== qId));
    };

    const handleLaunchBattle = async () => {
        soundEffects.playClick();
        if (!battleTitle.trim()) {
            setErrorMsg('Please enter a competition title.');
            return;
        }
        if (chapterQuestions.length === 0) {
            setErrorMsg('You must have at least one question.');
            return;
        }
        setErrorMsg(null);
        setCreating(true);
        try {
            const res = await createCompetition({
                title: battleTitle,
                timer: Number(battleTimer),
                questions: chapterQuestions.map(q => q._id)
            });
            if (res.message === 'success') {
                onClose();
                navigate(`/teacher/competition/${res.competition._id}`);
            } else {
                setErrorMsg(res.message);
                setCreating(false);
            }
        } catch (e) {
            setErrorMsg('Failed to create competition. Please try again.');
            setCreating(false);
        }
    };

    return (
        <div className="comp-wizard-overlay" onClick={onClose}>
            <div className="comp-wizard-modal animate-comp-pop-in" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="comp-wizard-header">
                    <div className="comp-header-left">
                        {step !== 'type' && (
                            <button className="comp-wizard-back-btn" onClick={handleBack} title="Back">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="comp-wizard-title-row">
                            <Swords size={22} className="comp-wizard-sword" />
                            <h2>{t('competitionWizard.title', '⚔️ Create a competition')}</h2>
                        </div>
                    </div>
                    <button className="comp-wizard-close-btn" onClick={onClose} title="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress */}
                <div className="comp-wizard-progress">
                    <div className={`comp-prog-step ${step === 'source' ? 'active' : ''} ${step !== 'source' ? 'completed' : ''}`}>
                        <div className="comp-step-num">1</div>
                        <span>{t('competitionWizard.source', 'Source')}</span>
                    </div>
                    
                    {step === 'custom-ws' || step === 'assignments' || (selectedChapter && !selectedSubject) ? (
                        <>
                            <div className="comp-prog-connector"></div>
                            <div className={`comp-prog-step ${step === 'custom-ws' || step === 'assignments' ? 'active' : ''} ${step === 'details' ? 'completed' : ''}`}>
                                <div className="comp-step-num">2</div>
                                <span>{t('competitionWizard.select', 'Select')}</span>
                            </div>
                            <div className="comp-prog-connector"></div>
                            <div className={`comp-prog-step ${step === 'details' ? 'active' : ''}`}>
                                <div className="comp-step-num">3</div>
                                <span>{t('competitionWizard.launch', 'Launch')}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="comp-prog-connector"></div>
                            <div className={`comp-prog-step ${step === 'type' ? 'active' : ''} ${step !== 'type' && step !== 'source' ? 'completed' : ''}`}>
                                <div className="comp-step-num">2</div>
                                <span>{t('competitionWizard.type', 'Type')}</span>
                            </div>
                            <div className="comp-prog-connector"></div>
                            <div className={`comp-prog-step ${step === 'system' ? 'active' : ''} ${step === 'unit' || step === 'details' ? 'completed' : ''}`}>
                                <div className="comp-step-num">3</div>
                                <span>{t('competitionWizard.system', 'System')}</span>
                            </div>
                            <div className="comp-prog-connector"></div>
                            <div className={`comp-prog-step ${step === 'unit' ? 'active' : ''} ${step === 'details' ? 'completed' : ''}`}>
                                <div className="comp-step-num">4</div>
                                <span>{t('competitionWizard.chapter', 'Chapter')}</span>
                            </div>
                            <div className="comp-prog-connector"></div>
                            <div className={`comp-prog-step ${step === 'details' ? 'active' : ''}`}>
                                <div className="comp-step-num">5</div>
                                <span>{t('competitionWizard.launch', 'Launch')}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Body */}
                <div className="comp-wizard-body">
                    {loading && (
                        <div className="comp-wizard-loader">
                            <div className="comp-spinner"></div>
                            <p>Loading...</p>
                        </div>
                    )}

                    {/* STEP 0: Question Source Selection */}
                    {!loading && step === 'source' && (
                        <div className="comp-step-container">
                            <p className="comp-step-instruction">{t('competitionWizard.selectSource', 'Select the source of questions for your competition:')}</p>
                            <div className="comp-source-grid">
                                <div className="comp-source-card" onClick={() => { soundEffects.playClick(); setStep('type'); }}>
                                    <div className="comp-source-icon-circle">
                                        <BookOpen size={28} />
                                    </div>
                                    <h3>{t('competitionWizard.textbookWorksheets', 'Textbook Worksheets')}</h3>
                                    <p>{t('competitionWizard.textbookWorksheetsDesc', 'Choose from standard book systems, units, and chapters.')}</p>
                                    <button className="comp-source-select-btn">{t('competitionWizard.selectContinue', 'Select & Continue')}</button>
                                </div>
                                <div className="comp-source-card" onClick={loadCustomWorksheets}>
                                    <div className="comp-source-icon-circle">
                                        <Layers size={28} />
                                    </div>
                                    <h3>{t('competitionWizard.myQuestionBank', 'My Question Bank')}</h3>
                                    <p>{t('competitionWizard.myQuestionBankDesc', 'Choose from worksheets and custom questions you created.')}</p>
                                    <button className="comp-source-select-btn">{t('competitionWizard.selectContinue', 'Select & Continue')}</button>
                                </div>
                                <div className="comp-source-card" onClick={loadMyAssignments}>
                                    <div className="comp-source-icon-circle">
                                        <Swords size={28} />
                                    </div>
                                    <h3>{t('competitionWizard.myAssignedHomeworks', 'My Assigned Homeworks')}</h3>
                                    <p>{t('competitionWizard.myAssignedHomeworksDesc', 'Select questions from homework you previously assigned.')}</p>
                                    <button className="comp-source-select-btn">{t('competitionWizard.selectContinue', 'Select & Continue')}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP: Custom Worksheets Selection */}
                    {!loading && step === 'custom-ws' && (
                        <div className="comp-step-container">
                            <p className="comp-step-instruction">{t('competitionWizard.selectCustomWs', 'Select one of your custom worksheets:')}</p>
                            <input 
                                type="text"
                                className="comp-search-bar"
                                placeholder={t('competitionWizard.searchWs', 'Search worksheets...')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <div className="comp-list-items">
                                {customWorksheets
                                    .filter(ws => ws.chapterName?.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(ws => (
                                        <div key={ws._id} className="comp-list-item" onClick={() => {
                                            soundEffects.playClick();
                                            setSelectedChapter(ws);
                                            setBattleTitle(`${ws.chapterName} Competition`);
                                            if (ws.format) {
                                                setQuestionTypeID(ws.format === 'MCQ' ? '65a4963482dbaac16d820fc6' : '65a4964b82dbaac16d820fc8');
                                            }
                                            setStep('details');
                                        }}>
                                            <div className="comp-item-info">
                                                <span className="comp-item-title">📄 {ws.chapterName}</span>
                                                <span className="comp-item-meta">
                                                    Format: {ws.format === 'MCQ' ? t('competitionWizard.formatChoose', 'Choose') : t('competitionWizard.formatComplete', 'Complete')} • {ws.questions?.length || 0} {t('competitionWizard.questionsCount', 'Questions')}
                                                </span>
                                            </div>
                                            <button className="comp-item-select">{t('competitionWizard.selectBtn', 'Select')}</button>
                                        </div>
                                    ))}
                                {customWorksheets.length === 0 && (
                                    <div className="comp-empty-state">{t('competitionWizard.noCustomWs', 'No custom worksheets found in your Question Bank.')}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP: My Assigned Homeworks Selection */}
                    {!loading && step === 'assignments' && (
                        <div className="comp-step-container">
                            <p className="comp-step-instruction">{t('competitionWizard.selectPastAssign', 'Select a past assignment to clone its questions:')}</p>
                            <input 
                                type="text"
                                className="comp-search-bar"
                                placeholder={t('competitionWizard.searchAssign', 'Search assignments...')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <div className="comp-list-items">
                                {myAssignments
                                    .filter(assign => assign.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(assign => (
                                        <div key={assign._id} className="comp-list-item" onClick={() => {
                                            soundEffects.playClick();
                                            setChapterQuestions(assign.questions || []);
                                            setBattleTitle(`${assign.title} Competition`);
                                            setStep('details');
                                        }}>
                                            <div className="comp-item-info">
                                                <span className="comp-item-title">📋 {assign.title}</span>
                                                <span className="comp-item-meta">
                                                    {assign.questions?.length || 0} {t('competitionWizard.questionsCount', 'Questions')}
                                                </span>
                                            </div>
                                            <button className="comp-item-select">{t('competitionWizard.selectBtn', 'Select')}</button>
                                        </div>
                                    ))}
                                {myAssignments.length === 0 && (
                                    <div className="comp-empty-state">{t('competitionWizard.noPastAssign', 'No past assignments found.')}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 1: Question Type */}
                    {!loading && step === 'type' && (
                        <div className="comp-step-container">
                            <p className="comp-step-instruction">{t('competitionWizard.selectFormat', 'Select the format of questions for your competition:')}</p>
                            <div className="comp-type-grid">
                                <div className="comp-type-card comp-mcq-card" onClick={() => handleSelectType('mcq')}>
                                    <div className="comp-type-icon-circle comp-mcq-bg">
                                        <Circle size={40} className="comp-type-icon" />
                                    </div>
                                    <h3>{t('competitionWizard.chooseQuestions', 'Choose Questions')}</h3>
                                    <p>{t('competitionWizard.chooseQuestionsDesc', 'Students pick the correct answer from options.')}</p>
                                    <button className="comp-type-select-btn">{t('competitionWizard.chooseBtn', 'Choose')} <ChevronRight size={16} /></button>
                                </div>
                                <div className="comp-type-card comp-completion-card" onClick={() => handleSelectType('completion')}>
                                    <div className="comp-type-icon-circle comp-completion-bg">
                                        <CheckCircle2 size={40} className="comp-type-icon" />
                                    </div>
                                    <h3>{t('competitionWizard.completeQuestions', 'Complete Questions')}</h3>
                                    <p>{t('competitionWizard.completeQuestionsDesc', 'Students type the numeric answer directly.')}</p>
                                    <button className="comp-type-select-btn">{t('competitionWizard.chooseBtn', 'Choose')} <ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: System & Subject */}
                    {!loading && step === 'system' && (
                        <div className="comp-step-container">
                            <p className="comp-step-instruction">{t('competitionWizard.chooseSystem', 'Choose a System, then select a Subject:')}</p>
                            <div className="comp-systems-list">
                                {systemData.length === 0 ? (
                                    <div className="comp-empty-state">{t('competitionWizard.noSystems', 'No systems found.')}</div>
                                ) : (
                                    systemData.map(system => {
                                        const isExpanded = selectedSystemId === system._id;
                                        return (
                                            <div key={system._id} className={`comp-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="comp-accordion-header" onClick={() => toggleSystemExpand(system._id)}>
                                                    <div className="comp-accordion-title">
                                                        <Layers size={18} className="comp-acc-icon" />
                                                        <span>{translateName(system.systemName)}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                                {isExpanded && (
                                                    <div className="comp-accordion-content">
                                                        {system.subjects?.length === 0 ? (
                                                            <div className="comp-no-items">{t('competitionWizard.noSubjects', 'No subjects in this system.')}</div>
                                                        ) : (
                                                            <div className="comp-subjects-grid">
                                                                {system.subjects?.map(subject => (
                                                                    <div key={subject._id} className="comp-subject-btn" onClick={() => handleSelectSubject(subject)}>
                                                                        <BookOpen size={16} className="comp-subj-icon" />
                                                                        <span>{translateName(subject.subjectName)}</span>
                                                                        <ChevronRight size={14} />
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

                    {/* STEP 3: Unit & Chapter */}
                    {!loading && step === 'unit' && (
                        <div className="comp-step-container">
                            <div className="comp-breadcrumb">
                                <span>{questionTypeID === '65a4963482dbaac16d820fc6' ? t('competitionWizard.formatChoose', 'Choose') : t('competitionWizard.formatComplete', 'Complete')}</span>
                                <ChevronRight size={12} />
                                <span className="comp-breadcrumb-active">{translateName(selectedSubject?.subjectName)}</span>
                            </div>
                            <p className="comp-step-instruction">{t('competitionWizard.expandUnit', 'Expand a Unit, and choose the Chapter for competition questions:')}</p>
                            <div className="comp-systems-list">
                                {unitData.length === 0 ? (
                                    <div className="comp-empty-state">{t('competitionWizard.noUnits', 'No units found for this subject.')}</div>
                                ) : (
                                    unitData.map(unit => {
                                        const isExpanded = selectedUnitId === unit._id;
                                        return (
                                            <div key={unit._id} className={`comp-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="comp-accordion-header" onClick={() => toggleUnitExpand(unit._id)}>
                                                    <div className="comp-accordion-title">
                                                        <Layers size={18} className="comp-acc-icon" />
                                                        <span>{translateName(unit.unitName)}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                                {isExpanded && (
                                                    <div className="comp-accordion-content">
                                                        {unit.chapters?.length === 0 ? (
                                                            <div className="comp-no-items">{t('competitionWizard.noChapters', 'No chapters available.')}</div>
                                                        ) : (
                                                            <div className="comp-chapters-grid">
                                                                {unit.chapters?.map(chapter => (
                                                                    <div key={chapter._id} className="comp-chapter-btn" onClick={() => handleSelectChapter(chapter)}>
                                                                        <span className="comp-chapter-bullet">📄</span>
                                                                        <span>{translateName(chapter.chapterName)}</span>
                                                                        <span className="comp-select-pill">{t('competitionWizard.selectBtn', 'Select')}</span>
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

                    {/* STEP 4: Battle Details */}
                    {!loading && step === 'details' && (
                        <div className="comp-step-container comp-details-step">
                            <div className="comp-breadcrumb">
                                {selectedSubject ? (
                                    <>
                                        <span>{questionTypeID === '65a4963482dbaac16d820fc6' ? t('competitionWizard.formatChoose', 'Choose') : t('competitionWizard.formatComplete', 'Complete')}</span>
                                        <ChevronRight size={12} />
                                        <span>{translateName(selectedSubject?.subjectName)}</span>
                                        <ChevronRight size={12} />
                                        <span className="comp-breadcrumb-active">{translateName(selectedChapter?.chapterName)}</span>
                                    </>
                                ) : selectedChapter ? (
                                    <>
                                        <span>{t('competitionWizard.myQuestionBank', 'My Question Bank')}</span>
                                        <ChevronRight size={12} />
                                        <span className="comp-breadcrumb-active">{selectedChapter.chapterName}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('competitionWizard.myAssignedHomeworks', 'My Assigned Homeworks')}</span>
                                        <ChevronRight size={12} />
                                        <span className="comp-breadcrumb-active">{battleTitle || t('competitionWizard.selectedHomework', 'Selected Homework')}</span>
                                    </>
                                )}
                            </div>

                            <div className="comp-dynamic-count-banner" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', padding: '14px 28px', borderRadius: '18px', margin: '15px 0 25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)' }}>
                                <span style={{ fontSize: '17px' }}>{t('competitionWizard.currentActiveQuestions', '📑 Current Active Questions in Competition:')}</span>
                                <span style={{ fontSize: '22px', background: 'rgba(0,0,0,0.25)', padding: '6px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)' }}>{chapterQuestions.length} {t('competitionWizard.questions', 'Questions')}</span>
                            </div>

                            <div className="comp-details-layout">
                                {/* Left: Settings */}
                                <div className="comp-details-form">
                                    <div className="comp-form-group">
                                        <label>{t('competitionWizard.competitionTitle', '⚔️ Competition Title')} <span className="comp-required">*</span></label>
                                        <input
                                            type="text"
                                            value={battleTitle}
                                            onChange={e => setBattleTitle(e.target.value)}
                                            placeholder={t('competitionWizard.titlePlaceholder', 'e.g. Friday Speed Challenge 🔥')}
                                            className="comp-details-input"
                                        />
                                    </div>
                                    <div className="comp-form-group">
                                        <label><Timer size={14} /> {t('competitionWizard.timerSeconds', 'Timer (seconds)')}</label>
                                        <div className="comp-timer-presets">
                                            {[120, 180, 300, 600, 900].map(tVal => (
                                                <button
                                                    key={tVal}
                                                    type="button"
                                                    className={`comp-preset-btn ${battleTimer === tVal ? 'active' : ''}`}
                                                    onClick={() => { soundEffects.playClick(); setBattleTimer(tVal); }}
                                                >
                                                    {tVal < 60 ? `${tVal}s` : `${tVal / 60}min`}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="number"
                                            value={battleTimer}
                                            onChange={e => setBattleTimer(Number(e.target.value))}
                                            min={30}
                                            max={3600}
                                            className="comp-details-input"
                                            style={{ marginTop: '8px' }}
                                        />
                                        <span className="comp-timer-hint">
                                            = {Math.floor(battleTimer / 60)}min {battleTimer % 60}s {t('competitionWizard.perStudent', 'per student')}
                                        </span>
                                    </div>

                                    {errorMsg && <div className="comp-error-msg">⚠️ {errorMsg}</div>}

                                    <button
                                        className="comp-launch-battle-btn"
                                        onClick={handleLaunchBattle}
                                        disabled={creating}
                                    >
                                        {creating ? <span className="comp-spinner-small"></span> : t('competitionWizard.launchCompetition', '🚀 Launch Competition & Enter Lobby')}
                                    </button>
                                </div>

                                {/* Right: Questions preview */}
                                <div className="comp-questions-preview">
                                    <h3>{t('competitionWizard.questionsPreview', '📑 Questions')} ({chapterQuestions.length})</h3>
                                    <div className="comp-preview-scroll">
                                        {chapterQuestions.map((q, idx) => (
                                            <div key={q._id} className="comp-preview-q-card">
                                                <div className="comp-preview-q-header">
                                                    <span className="comp-q-num">#{idx + 1}</span>
                                                    <span className="comp-q-pts">{q.questionPoints} {t('competitionWizard.pts', 'pts')}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveQuestion(q._id)}
                                                        className="comp-delete-q-btn"
                                                        title="Remove question"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="comp-preview-q-body">
                                                    {q.questionPic && <img src={q.questionPic} alt="Q visual" className="comp-preview-q-img" />}
                                                    <pre>{q.question || t('competitionWizard.graphicQuestion', 'Graphic Question')}</pre>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CreateCompetitionModal;

