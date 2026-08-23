import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, RotateCcw, Sliders, Layers, Search, Sparkles, BookOpen } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import { isUnitVisible, setUnitVisibility, resetAllUnitsVisible, getHiddenUnitIds } from '../../utils/visibilityManager';
import './LevelVisibilityManager.css';

const LevelVisibilityManager = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const role = localStorage.getItem('auth_role');
  const isArabic = i18n.language === 'ar';

  const [loading, setLoading] = useState(false);
  const [systemData, setSystemData] = useState([]);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [unitData, setUnitData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hiddenIds, setHiddenIds] = useState([]);
  const questionTypeID = '65a4963482dbaac16d820fc6'; // MCQ / Standard Type

  useEffect(() => {
    setHiddenIds(getHiddenUnitIds());
    if (questionTypeID) {
      getSystem(setLoading, setSystemData, questionTypeID);
    }
  }, [questionTypeID]);

  // When system loads, select first system by default
  useEffect(() => {
    if (systemData.length > 0 && !selectedSystemId) {
      setSelectedSystemId(systemData[0]._id);
      if (systemData[0].subjects && systemData[0].subjects.length > 0) {
        setSelectedSubject(systemData[0].subjects[0]);
      }
    }
  }, [systemData, selectedSystemId]);

  // Load units when subject changes (pass includeHidden=true to view all units including OFF)
  useEffect(() => {
    if (selectedSubject) {
      getUnit(setLoading, setUnitData, questionTypeID, selectedSubject._id, true);
    }
  }, [selectedSubject]);

  const translateName = (name) => {
    if (!name) return '';
    const key = `systemNames.${name}`;
    const translated = t(key);
    return translated !== key ? translated : name;
  };

  const handleToggle = (unitId) => {
    soundEffects.playClick();
    const currentlyVisible = isUnitVisible(unitId);
    setUnitVisibility(unitId, !currentlyVisible);
    setHiddenIds(getHiddenUnitIds());
  };

  const handleEnableAll = () => {
    soundEffects.playClick();
    resetAllUnitsVisible();
    setHiddenIds([]);
  };

  const handleHideAll = () => {
    soundEffects.playClick();
    unitData.forEach(unit => {
      setUnitVisibility(unit._id, false);
    });
    setHiddenIds(getHiddenUnitIds());
  };

  const filteredUnits = unitData.filter(unit => {
    if (!searchTerm.trim()) return true;
    const name = (unit.unitName || '').toLowerCase();
    const translated = translateName(unit.unitName).toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || translated.includes(search);
  });

  const getUnitLevelBadge = (name) => {
    const raw = String(name || '').toLowerCase();
    if (raw.includes('2') || raw.includes('سطران')) return { label: isArabic ? 'سطران (2 Rows)' : 'Level: 2 Rows', color: '#0284c7', bg: '#e0f2fe' };
    if (raw.includes('3')) return { label: isArabic ? '٣ أسطر (3 Rows)' : 'Level: 3 Rows', color: '#7c3aed', bg: '#f3e8ff' };
    if (raw.includes('4')) return { label: isArabic ? '٤ أسطر (4 Rows)' : 'Level: 4 Rows', color: '#e11d48', bg: '#ffe4e6' };
    if (raw.includes('5')) return { label: isArabic ? '٥ أسطر (5 Rows)' : 'Level: 5 Rows', color: '#b45309', bg: '#fef3c7' };
    return { label: isArabic ? 'مستوى تدريبي' : 'Practice Level', color: '#059669', bg: '#d1fae5' };
  };

  return (
    <div className="visibility-manager-page">
      <MobileNav role={role} />
      <Navbar />

      <div className="visibility-container">
        {/* Header */}
        <div className="visibility-header">
          <button className="back-btn" onClick={() => navigate('/dashboard-school')}>
            <ArrowLeft size={20} />
            <span>{isArabic ? 'العودة للوحة المدرسة' : 'Back to School Dashboard'}</span>
          </button>
          <div className="header-titles">
            <h1>
              <Sliders size={28} color="#8b5cf6" />
              <span>{isArabic ? 'إدارة ظهور المستويات والوحدات' : 'Curriculum & Level Visibility'}</span>
            </h1>
            <p>
              {isArabic 
                ? 'جميع المستويات مفعلة وظاهرة افتراضياً (ON). يمكنك إخفاء أو إظهار أي مستوى بالضغط على زر التبديل.' 
                : 'All curriculum levels are visible (ON) by default. Toggle any level OFF to hide it from student worksheets and game dropdowns.'}
            </p>
          </div>
        </div>

        {/* Filter & Subject Selection Bar */}
        <div className="visibility-controls-card">
          <div className="selectors-row">
            {/* System Selector */}
            <div className="control-group">
              <label><Layers size={16} /> {isArabic ? 'النظام التعليمي' : 'System'}</label>
              <select
                value={selectedSystemId || ''}
                onChange={(e) => {
                  soundEffects.playClick();
                  const sysId = e.target.value;
                  setSelectedSystemId(sysId);
                  const sys = systemData.find(s => s._id === sysId);
                  if (sys && sys.subjects && sys.subjects.length > 0) {
                    setSelectedSubject(sys.subjects[0]);
                  } else {
                    setSelectedSubject(null);
                    setUnitData([]);
                  }
                }}
              >
                {systemData.map(s => (
                  <option key={s._id} value={s._id}>{translateName(s.systemName)}</option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div className="control-group">
              <label><BookOpen size={16} /> {isArabic ? 'المادة الدراسية' : 'Subject'}</label>
              <select
                value={selectedSubject?._id || ''}
                onChange={(e) => {
                  soundEffects.playClick();
                  const subId = e.target.value;
                  const currentSys = systemData.find(s => s._id === selectedSystemId);
                  const sub = currentSys?.subjects?.find(sb => sb._id === subId);
                  if (sub) setSelectedSubject(sub);
                }}
              >
                {systemData.find(s => s._id === selectedSystemId)?.subjects?.map(sub => (
                  <option key={sub._id} value={sub._id}>{translateName(sub.subjectName)}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="control-group search-group">
              <label><Search size={16} /> {isArabic ? 'بحث بالاسم' : 'Search Level'}</label>
              <input
                type="text"
                placeholder={isArabic ? 'ابحث عن مستوى...' : 'Search level...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bulk-actions-row">
            <div className="stats-indicator">
              <span>{isArabic ? 'إجمالي المستويات:' : 'Total Levels:'} <strong>{unitData.length}</strong></span>
              <span> • </span>
              <span style={{ color: '#10b981' }}>
                {isArabic ? 'الظاهرة (ON):' : 'Visible (ON):'} <strong>{unitData.length - hiddenIds.filter(id => unitData.some(u => u._id === id)).length}</strong>
              </span>
              <span> • </span>
              <span style={{ color: '#ef4444' }}>
                {isArabic ? 'المخفية (OFF):' : 'Hidden (OFF):'} <strong>{hiddenIds.filter(id => unitData.some(u => u._id === id)).length}</strong>
              </span>
            </div>

            <div className="action-buttons">
              <button className="bulk-btn enable-all" onClick={handleEnableAll}>
                <CheckCircle2 size={16} />
                <span>{isArabic ? 'تفعيل الكل (ON)' : 'Enable All (ON)'}</span>
              </button>
              <button className="bulk-btn hide-all" onClick={handleHideAll}>
                <EyeOff size={16} />
                <span>{isArabic ? 'إخفاء الكل (OFF)' : 'Hide All (OFF)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Units / Levels List */}
        {loading ? (
          <div className="visibility-loading">
            <div className="spinner"></div>
            <p>{isArabic ? 'جاري تحميل المستويات...' : 'Loading curriculum levels...'}</p>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="empty-units-card">
            <p>{isArabic ? 'لم يتم العثور على مستويات تطابق البحث.' : 'No curriculum levels found.'}</p>
          </div>
        ) : (
          <div className="units-visibility-grid">
            {filteredUnits.map((unit) => {
              const isVisible = isUnitVisible(unit._id);
              const badge = getUnitLevelBadge(unit.unitName);
              const chaptersCount = unit.chapters ? unit.chapters.length : 0;

              return (
                <div key={unit._id} className={`unit-visibility-card ${isVisible ? 'is-visible' : 'is-hidden'}`}>
                  <div className="card-top-row">
                    <span className="unit-badge" style={{ color: badge.color, backgroundColor: badge.bg }}>
                      {badge.label}
                    </span>
                    <div className="status-pill">
                      {isVisible ? (
                        <span className="pill visible"><Eye size={14} /> {isArabic ? 'ظاهر' : 'Visible'}</span>
                      ) : (
                        <span className="pill hidden"><EyeOff size={14} /> {isArabic ? 'مخفي' : 'Hidden'}</span>
                      )}
                    </div>
                  </div>

                  <h3 className="unit-title">{translateName(unit.unitName)}</h3>
                  <p className="unit-subtitle">
                    {chaptersCount} {isArabic ? 'ورقة عمل / تمرين' : 'Exercises / Worksheets'}
                  </p>

                  <div className="card-bottom-row">
                    <span className="visibility-hint">
                      {isVisible 
                        ? (isArabic ? 'متاح للطلاب وفي الألعاب' : 'Visible in worksheets & games') 
                        : (isArabic ? 'مخفي عن الطلاب والألعاب' : 'Hidden from students & games')}
                    </span>

                    {/* Interactive Switch */}
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => handleToggle(unit._id)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelVisibilityManager;
