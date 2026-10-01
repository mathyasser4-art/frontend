import React, { useState, useEffect } from 'react';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import API_BASE_URL from '../../config/api.config';
import { adjustQuestionOrderAndShuffleMCQ } from '../../utils/questionShuffle';
import { useTranslation } from 'react-i18next';
import { translateCurriculumItem } from '../../utils/itemTranslator';
import soundEffects from '../../utils/soundEffects';

const CurriculumWizardModal = ({ isOpen, onClose, onQuestionsFetched }) => {
  const { t, i18n } = useTranslation();
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [systemData, setSystemData] = useState([]);
  const [unitData, setUnitData] = useState([]);
  const [loadingWizard, setLoadingWizard] = useState(false);
  const [wizardError, setWizardError] = useState(null);

  const questionTypeID = '65a4963482dbaac16d820fc6'; 

  useEffect(() => {
    if (isOpen) {
      getSystem(setLoadingWizard, setSystemData, questionTypeID);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedSubject) {
      getUnit(setLoadingWizard, setUnitData, questionTypeID, selectedSubject._id);
    }
  }, [selectedSubject]);

  const translateName = (name) => {
    if (!name) return '';
    const isArabic = (typeof i18n !== 'undefined' && i18n.language === 'ar') || document.documentElement.dir === 'rtl';
    return translateCurriculumItem(name, isArabic);
  };

  const handleSelectChapter = (chapter) => {
    soundEffects.playClick();
    setLoadingWizard(true);
    setWizardError(null);

    const Token = localStorage.getItem('O_authWEB') || '';
    fetch(`${API_BASE_URL}/chapter/getChapterQuestion/${chapter._id}`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        ...(Token ? { 'authrization': `pracYas09${Token}` } : {})
      },
    })
      .then(r => r.json())
      .then(responseJson => {
        if (responseJson.message === 'success' && Array.isArray(responseJson.chapter?.questions)) {
          const shuffled = adjustQuestionOrderAndShuffleMCQ(responseJson.chapter.questions);
          onQuestionsFetched(shuffled, chapter.chapterName);
        } else {
          setWizardError(responseJson.message || 'No questions found.');
        }
        setLoadingWizard(false);
      })
      .catch(err => {
        setWizardError(err.message);
        setLoadingWizard(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', padding: '2rem', borderRadius: '16px',
        maxWidth: '500px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        <h2 style={{ textAlign: 'center', margin: 0, color: '#333' }}>Select Chapter to Play</h2>
        
        {wizardError && <p style={{ color: 'red' }}>{wizardError}</p>}
        {loadingWizard && <p>Loading...</p>}

        <select
          value={selectedSystemId || ''}
          onChange={(e) => {
            setSelectedSystemId(e.target.value);
            setSelectedSubject(null);
            setSelectedUnitId(null);
            setUnitData([]);
          }}
          style={{ padding: '0.7rem', borderRadius: '10px' }}
        >
          <option value="" disabled>Select System...</option>
          {systemData.map(s => <option key={s._id} value={s._id}>{translateName(s.systemName)}</option>)}
        </select>

        {selectedSystemId && (
          <select
            value={selectedSubject?._id || ''}
            onChange={(e) => {
              const system = systemData.find(s => s._id === selectedSystemId);
              const subject = system?.subjects?.find(sub => sub._id === e.target.value);
              if (subject) {
                setSelectedSubject(subject);
                setSelectedUnitId(null);
              }
            }}
            style={{ padding: '0.7rem', borderRadius: '10px' }}
          >
            <option value="" disabled>Select Subject...</option>
            {systemData.find(s => s._id === selectedSystemId)?.subjects?.map(s => (
              <option key={s._id} value={s._id}>{translateName(s.subjectName)}</option>
            ))}
          </select>
        )}

        {selectedSubject && unitData.length > 0 && (
          <select
            value={selectedUnitId || ''}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            style={{ padding: '0.7rem', borderRadius: '10px' }}
          >
            <option value="" disabled>Select Unit...</option>
            {unitData.map(u => <option key={u._id} value={u._id}>{translateName(u.unitName)}</option>)}
          </select>
        )}

        {selectedUnitId && (
          <select
            value=""
            onChange={(e) => {
              const unit = unitData.find(u => u._id === selectedUnitId);
              const chapter = unit?.chapters?.find(c => c._id === e.target.value);
              if (chapter) handleSelectChapter(chapter);
            }}
            style={{ padding: '0.7rem', borderRadius: '10px' }}
          >
            <option value="" disabled>Select Chapter...</option>
            {unitData.find(u => u._id === selectedUnitId)?.chapters?.map(c => (
              <option key={c._id} value={c._id}>?? {translateName(c.chapterName)}</option>
            ))}
          </select>
        )}
        
        <button 
          onClick={onClose} 
          style={{ marginTop: '1rem', padding: '0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'black' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CurriculumWizardModal;
