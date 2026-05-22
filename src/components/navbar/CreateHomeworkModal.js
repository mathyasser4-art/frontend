import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Circle, CheckCircle2, BookOpen, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import soundEffects from '../../utils/soundEffects';
import './CreateHomeworkModal.css';

function CreateHomeworkModal({ onClose }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState('type'); // 'type' | 'system' | 'unit'
    const [questionTypeID, setQuestionTypeID] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedSystemId, setSelectedSystemId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);

    const [systemData, setSystemData] = useState([]);
    const [unitData, setUnitData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load systems when we select the type
    useEffect(() => {
        if (questionTypeID) {
            getSystem(setLoading, setSystemData, questionTypeID);
        }
    }, [questionTypeID]);

    // Load units when we select a subject
    useEffect(() => {
        if (selectedSubject) {
            getUnit(setLoading, setUnitData, questionTypeID, selectedSubject._id);
        }
    }, [selectedSubject, questionTypeID]);

    const handleSelectType = (type) => {
        soundEffects.playClick();
        if (type === 'mcq') {
            setQuestionTypeID('65a4963482dbaac16d820fc6');
        } else {
            setQuestionTypeID('65a4964b82dbaac16d820fc8');
        }
        setStep('system');
    };

    const handleSelectSubject = (subject) => {
        soundEffects.playClick();
        setSelectedSubject(subject);
        setStep('unit');
    };

    const handleSelectChapter = (chapter) => {
        soundEffects.playClick();
        onClose();
        navigate(`/question/${chapter._id}/${questionTypeID}/${selectedSubject._id}`);
    };

    const handleBack = () => {
        soundEffects.playClick();
        if (step === 'unit') {
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
                    <div className="progress-connector"></div>
                    <div className={`progress-step ${step === 'system' ? 'active' : ''} ${step === 'unit' ? 'completed' : ''}`}>
                        <div className="step-num">2</div>
                        <span>System & Subject</span>
                    </div>
                    <div className="progress-connector"></div>
                    <div className={`progress-step ${step === 'unit' ? 'active' : ''}`}>
                        <div className="step-num">3</div>
                        <span>Unit & Chapter</span>
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
                            <div className="type-options-grid">
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
                                    <h3>Completion (MasterMinds)</h3>
                                    <p>Students write the numeric/final answer directly.</p>
                                    <button className="select-type-action-btn">Choose Completion <ChevronRight size={16} /></button>
                                </div>
                            </div>
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
                </div>
            </div>
        </div>
    );
}

export default CreateHomeworkModal;
