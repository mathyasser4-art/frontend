import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, RotateCcw, Volume2, VolumeX, ChevronLeft, ChevronRight, Play, Trophy, Sparkles, Compass, Globe } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import getSystem from '../../api/system/getSystem.api';
import getUnit from '../../api/unit/getUnit.api';
import {
  getProgress,
  flattenChapters,
  getChapterStatus,
  getStars,
  getOverallStats,
  resetProgress,
  getScore,
} from '../../utils/learningPathProgress';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import adventureMapBg from '../../img/adventure_map_bg.jpg';
import scienceMapBg from '../../img/science_map_bg.jpg';
import heroCharacterImg from '../../img/hero_character.jpg';
import './LearningPath.css';

// ── 8 Distinct Unit Visual Themes ──
export const UNIT_THEME_PALETTE = [
  {
    id: 'emerald',
    name: 'Emerald Jungle',
    color: '#10b981',
    colorGlow: 'rgba(16, 185, 129, 0.75)',
    colorBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    accentBorder: '#6ee7b7',
    icon: '🌿',
    textColor: '#ecfdf5',
  },
  {
    id: 'amber',
    name: 'Golden Desert Sanctuary',
    color: '#f59e0b',
    colorGlow: 'rgba(245, 158, 11, 0.75)',
    colorBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    accentBorder: '#fde68a',
    icon: '☀️',
    textColor: '#fffbeb',
  },
  {
    id: 'cyan',
    name: 'Glacier Frost Peak',
    color: '#06b6d4',
    colorGlow: 'rgba(6, 182, 212, 0.75)',
    colorBg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    accentBorder: '#a5f3fc',
    icon: '❄️',
    textColor: '#ecfeff',
  },
  {
    id: 'crimson',
    name: 'Volcanic Fortress',
    color: '#ef4444',
    colorGlow: 'rgba(239, 68, 68, 0.75)',
    colorBg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    accentBorder: '#fca5a5',
    icon: '🔥',
    textColor: '#fef2f2',
  },
  {
    id: 'amethyst',
    name: 'Astral Sky Heights',
    color: '#a855f7',
    colorGlow: 'rgba(168, 85, 247, 0.75)',
    colorBg: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    accentBorder: '#e9d5ff',
    icon: '✨',
    textColor: '#faf5ff',
  },
  {
    id: 'orange',
    name: 'Copper Steampunk Valley',
    color: '#f97316',
    colorGlow: 'rgba(249, 115, 22, 0.75)',
    colorBg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    accentBorder: '#fed7aa',
    icon: '⚙️',
    textColor: '#fff7ed',
  },
  {
    id: 'rose',
    name: 'Enchanted Lotus Glade',
    color: '#ec4899',
    colorGlow: 'rgba(236, 72, 153, 0.75)',
    colorBg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    accentBorder: '#fbcfe8',
    icon: '🌸',
    textColor: '#fdf2f8',
  },
  {
    id: 'indigo',
    name: 'Royal Sapphire Citadel',
    color: '#6366f1',
    colorGlow: 'rgba(99, 102, 241, 0.75)',
    colorBg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    accentBorder: '#c7d2fe',
    icon: '👑',
    textColor: '#eef2ff',
  },
];

// ── Master Archipelago Waypoints (For Math, History, English, Default) ──
const ARCHIPELAGO_WAYPOINTS = [
  { x: 11, y: 74 }, { x: 8,  y: 63 }, { x: 9,  y: 52 }, { x: 14, y: 44 },
  { x: 23, y: 37 }, { x: 27, y: 30 }, { x: 29, y: 44 }, { x: 26, y: 58 },
  { x: 33, y: 58 }, { x: 38, y: 54 }, { x: 42, y: 73 }, { x: 47, y: 64 },
  { x: 41, y: 49 }, { x: 48, y: 48 }, { x: 53, y: 47 }, { x: 57, y: 55 },
  { x: 60, y: 41 }, { x: 64, y: 36 }, { x: 62, y: 29 }, { x: 67, y: 26 },
  { x: 74, y: 31 }, { x: 72, y: 44 }, { x: 73, y: 63 }, { x: 77, y: 71 },
  { x: 86, y: 76 }, { x: 91, y: 61 }
];

// ── Space Waypoints (Tailored to Science Cosmic Map Stations) ──
const SCIENCE_SPACE_WAYPOINTS = [
  { x: 9,  y: 81 }, { x: 13, y: 68 }, { x: 20, y: 54 }, { x: 28, y: 43 },
  { x: 33, y: 35 }, { x: 40, y: 44 }, { x: 46, y: 49 }, { x: 50, y: 25 },
  { x: 55, y: 15 }, { x: 65, y: 19 }, { x: 51, y: 80 }, { x: 58, y: 73 },
  { x: 66, y: 60 }, { x: 72, y: 47 }, { x: 78, y: 32 }, { x: 84, y: 35 },
  { x: 81, y: 67 }, { x: 85, y: 75 }
];

// Continuous Spline / Polyline Interpolator helper
function interpolateWaypoints(points, t) {
  const n = points.length;
  if (t <= 0) return points[0];
  if (t >= 1) return points[n - 1];

  const distances = [0];
  let totalDist = 0;
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    totalDist += dist;
    distances.push(totalDist);
  }

  const targetDist = t * totalDist;
  let segIndex = 0;
  for (let i = 0; i < n - 1; i++) {
    if (targetDist >= distances[i] && targetDist <= distances[i + 1]) {
      segIndex = i;
      break;
    }
  }

  const segStartDist = distances[segIndex];
  const segLength = distances[segIndex + 1] - segStartDist;
  const segT = segLength > 0 ? (targetDist - segStartDist) / segLength : 0;

  const p0 = points[segIndex];
  const p1 = points[segIndex + 1];

  return {
    x: p0.x + (p1.x - p0.x) * segT,
    y: p0.y + (p1.y - p0.y) * segT,
  };
}

// ── Subject-Specific Map World Configurations ──
export const WORLD_CONFIGS = {
  math: {
    key: 'math',
    worldTitle: 'Wumpa Archipelago',
    worldSubtitle: 'Mathematical Quest & Islands',
    iconLeft: '🌴',
    iconRight: '🌋',
    bgImage: adventureMapBg,
    filterClass: 'world-archipelago',
    statTokens: {
      livesIcon: '❤️',
      livesLabel: 'LIVES',
      gemsIcon: '💎',
      gemsLabel: 'GEMS',
      starsIcon: '⭐',
      starsLabel: 'STARS',
    },
    waypoints: ARCHIPELAGO_WAYPOINTS,
  },
  science: {
    key: 'science',
    worldTitle: 'Cosmic Odyssey',
    worldSubtitle: 'Galactic Research & Discoveries',
    iconLeft: '🚀',
    iconRight: '🪐',
    bgImage: scienceMapBg,
    filterClass: 'world-science',
    statTokens: {
      livesIcon: '🔋',
      livesLabel: 'CELLS',
      gemsIcon: '⚛️',
      gemsLabel: 'ATOMS',
      starsIcon: '🌟',
      starsLabel: 'NOVAS',
    },
    waypoints: SCIENCE_SPACE_WAYPOINTS,
  },
  history: {
    key: 'history',
    worldTitle: 'Nile Expedition',
    worldSubtitle: 'Ancient Heritage & Civilizations',
    iconLeft: '🏺',
    iconRight: '👑',
    bgImage: adventureMapBg,
    filterClass: 'world-history',
    statTokens: {
      livesIcon: '🪲',
      livesLabel: 'SCARABS',
      gemsIcon: '🪙',
      gemsLabel: 'RELICS',
      starsIcon: '⭐',
      starsLabel: 'SEALS',
    },
    waypoints: ARCHIPELAGO_WAYPOINTS,
  },
  english: {
    key: 'english',
    worldTitle: 'Storybook Realm',
    worldSubtitle: 'Enchanted Kingdom of Words',
    iconLeft: '🏰',
    iconRight: '📖',
    bgImage: adventureMapBg,
    filterClass: 'world-english',
    statTokens: {
      livesIcon: '📜',
      livesLabel: 'SCROLLS',
      gemsIcon: '🔮',
      gemsLabel: 'RUNES',
      starsIcon: '⭐',
      starsLabel: 'BADGES',
    },
    waypoints: ARCHIPELAGO_WAYPOINTS,
  },
};

// Automatic Subject Detector (Option A)
export function detectSubjectWorld(subjectName) {
  if (!subjectName) return WORLD_CONFIGS.math;
  const name = subjectName.toLowerCase();

  if (
    name.includes('scien') ||
    name.includes('علوم') ||
    name.includes('ساينس') ||
    name.includes('phy') ||
    name.includes('chem') ||
    name.includes('bio')
  ) {
    return WORLD_CONFIGS.science;
  }
  if (
    name.includes('social') ||
    name.includes('hist') ||
    name.includes('geog') ||
    name.includes('تاريخ') ||
    name.includes('جغرافيا') ||
    name.includes('دراسات') ||
    name.includes('arabic') ||
    name.includes('عرب') ||
    name.includes('دين') ||
    name.includes('islam')
  ) {
    return WORLD_CONFIGS.history;
  }
  if (
    name.includes('eng') ||
    name.includes('انجليز') ||
    name.includes('french') ||
    name.includes('german') ||
    name.includes('ital') ||
    name.includes('lang') ||
    name.includes('لغ')
  ) {
    return WORLD_CONFIGS.english;
  }
  return WORLD_CONFIGS.math;
}


const LearningPath = () => {
  const navigate = useNavigate();
  const userId = safeLocalStorage.getItem('pp_id') || 'guest';
  const questionTypeID = '65a4963482dbaac16d820fc6';

  // Selector state
  const [showSelector, setShowSelector] = useState(false);
  const [systemData, setSystemData] = useState([]);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectorLoading, setSelectorLoading] = useState(false);

  // Map state
  const [unitData, setUnitData] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [progress, setProgress] = useState({ completedChapters: [], stars: {} });
  const [savedSubjectId, setSavedSubjectId] = useState(null);
  const [savedSubjectName, setSavedSubjectName] = useState('');
  const [savedSystemName, setSavedSystemName] = useState('');

  // Character controller state
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isHopping, setIsHopping] = useState(false);
  const [lockedSpeech, setLockedSpeech] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [heroSpriteUrl, setHeroSpriteUrl] = useState(null);

  const speechTimerRef = useRef(null);
  const characterRef = useRef(null);

  const mapAreaRef = useRef(null);

  // ── 1. Create transparent character sprite on load ──
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = heroCharacterImg;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 400;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          if (r > 235 && g > 235 && b > 235) {
            d[i + 3] = 0;
          } else if (r > 205 && g > 205 && b > 205) {
            const alphaFactor = (255 - Math.max(r, g, b)) / 50;
            d[i + 3] = Math.max(0, Math.min(255, d[i + 3] * alphaFactor));
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setHeroSpriteUrl(canvas.toDataURL('image/png'));
      } catch (e) {
        setHeroSpriteUrl(heroCharacterImg);
      }
    };
    img.onerror = () => setHeroSpriteUrl(heroCharacterImg);
  }, []);

  // ── 2. Load saved subject preference on mount ──
  useEffect(() => {
    const saved = safeLocalStorage.getItem('lp_selected_subject');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedSubjectId(parsed.subjectId);
        setSavedSubjectName(parsed.subjectName || '');
        setSavedSystemName(parsed.systemName || '');
      } catch (e) {
        setShowSelector(true);
      }
    } else {
      setShowSelector(true);
    }
  }, []);

  // ── 3. Fetch units when subject is known ──
  useEffect(() => {
    if (!savedSubjectId) return;
    setMapLoading(true);
    getUnit(
      (loading) => { if (!loading) setMapLoading(false); },
      setUnitData,
      questionTypeID,
      savedSubjectId
    );
  }, [savedSubjectId]);

  // ── 4. Load progress ──
  useEffect(() => {
    if (savedSubjectId) {
      setProgress(getProgress(userId, savedSubjectId));
    }
  }, [savedSubjectId, userId]);

  // ── 5. Load systems for selector ──
  useEffect(() => {
    if (showSelector) {
      getSystem(setSelectorLoading, setSystemData, questionTypeID);
    }
  }, [showSelector]);

  // Automatically detect world based on subject name (Option A)
  const activeWorld = useMemo(() => {
    return detectSubjectWorld(savedSubjectName);
  }, [savedSubjectName]);

  // ── Flatten all chapters & calculate positions ──
  const allChapters = useMemo(() => flattenChapters(unitData), [unitData]);
  const stats = useMemo(() => getOverallStats(progress, allChapters), [progress, allChapters]);

  // Map each chapter to an exact (x, y) waypoint on the detected world map
  const mappedStages = useMemo(() => {
    if (!allChapters || allChapters.length === 0) return [];
    const count = allChapters.length;
    const waypoints = activeWorld.waypoints || ARCHIPELAGO_WAYPOINTS;

    return allChapters.map((chapter, idx) => {
      const t = count === 1 ? 0 : idx / (count - 1);
      const coord = interpolateWaypoints(waypoints, t);
      const status = getChapterStatus(progress, chapter.chapterId, allChapters);
      const stars = getStars(progress, chapter.chapterId);
      const score = getScore(progress, chapter.chapterId);

      // Assign distinct visual unit theme from palette
      const unitTheme = UNIT_THEME_PALETTE[chapter.unitIndex % UNIT_THEME_PALETTE.length];
      const isUnitFirstStage = (idx === 0 || chapter.unitIndex !== allChapters[idx - 1].unitIndex);

      return {
        ...chapter,
        index: idx,
        status,
        stars,
        score,
        x: coord.x,
        y: coord.y,
        biome: `${unitTheme.icon} ${chapter.unitName}`,
        unitTheme,
        isUnitFirstStage,
      };
    });
  }, [allChapters, progress, activeWorld]);

  // Auto-pan camera to follow character on mobile or narrow viewports
  useEffect(() => {
    if (!mapAreaRef.current) return;
    const container = mapAreaRef.current;
    const timer = setTimeout(() => {
      const stageEl = container.querySelector(`.wumpa-portal-node[data-index="${characterIndex}"]`);
      if (stageEl) {
        const containerWidth = container.clientWidth;
        const scrollWidth = container.scrollWidth;
        if (scrollWidth > containerWidth) {
          const targetLeft = stageEl.offsetLeft - containerWidth / 2 + stageEl.clientWidth / 2;
          container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [characterIndex, mappedStages]);


  // Set initial character position to current active stage
  useEffect(() => {
    if (mappedStages.length > 0) {
      const currentIdx = mappedStages.findIndex((s) => s.status === 'current');
      if (currentIdx !== -1) {
        setCharacterIndex(currentIdx);
      } else {
        // If all completed, stand on the last one; else first
        const lastCompleted = mappedStages.reduce(
          (max, s) => (s.status === 'completed' ? Math.max(max, s.index) : max),
          0
        );
        setCharacterIndex(lastCompleted);
      }
    }
  }, [mappedStages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active stage node that the character is currently standing on
  const currentStage = mappedStages[characterIndex] || mappedStages[0];

  // ── Play sound helper ──
  const playSfx = useCallback((type) => {
    if (soundMuted) return;
    if (type === 'hop') soundEffects.playClick();
    if (type === 'win') soundEffects.playWinSound();
    if (type === 'wrong') soundEffects.playWrongSound();
  }, [soundMuted]);

  // ── Movement & Action Handlers ──
  const triggerHop = useCallback(() => {
    setIsHopping(true);
    setTimeout(() => setIsHopping(false), 380);
  }, []);

  const showLockedToast = useCallback((msg) => {
    playSfx('wrong');
    setLockedSpeech(msg);
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    speechTimerRef.current = setTimeout(() => setLockedSpeech(null), 3000);
  }, [playSfx]);

  // Move character to a target stage index
  const moveToStage = useCallback((targetIdx) => {
    if (!mappedStages[targetIdx]) return;
    const targetStage = mappedStages[targetIdx];

    if (targetStage.status === 'locked') {
      showLockedToast(`🔒 Lesson ${targetIdx + 1} is locked! Complete Lesson ${targetIdx} first.`);
      return;
    }

    if (targetIdx !== characterIndex) {
      playSfx('hop');
      triggerHop();
      setCharacterIndex(targetIdx);
      setLockedSpeech(null);
    }
  }, [mappedStages, characterIndex, playSfx, triggerHop, showLockedToast]);

  // Launch quiz for current stage
  const launchCurrentStage = useCallback(() => {
    if (!currentStage) return;
    if (currentStage.status === 'locked') {
      showLockedToast(`🔒 Complete previous lessons first!`);
      return;
    }

    playSfx('hop');
    navigate(`/question/${currentStage.chapterId}/${questionTypeID}/${savedSubjectId}`, {
      state: { fromLearningPath: true },
    });
  }, [currentStage, navigate, questionTypeID, savedSubjectId, playSfx, showLockedToast]);

  // ── Keyboard Controller (Arrows / WASD / Enter / Space) ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if in input or modal
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'KeyD') {
        e.preventDefault();
        if (characterIndex < mappedStages.length - 1) {
          moveToStage(characterIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'KeyA') {
        e.preventDefault();
        if (characterIndex > 0) {
          moveToStage(characterIndex - 1);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        launchCurrentStage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [characterIndex, mappedStages.length, moveToStage, launchCurrentStage]);

  // ── Subject Selector Confirm ──
  const handleSubjectConfirm = useCallback(() => {
    if (!selectedSubject) return;
    const system = systemData.find((s) => s._id === selectedSystemId);
    const saved = {
      subjectId: selectedSubject._id,
      subjectName: selectedSubject.subjectName,
      systemId: selectedSystemId,
      systemName: system?.systemName || '',
    };
    safeLocalStorage.setItem('lp_selected_subject', JSON.stringify(saved));
    setSavedSubjectId(saved.subjectId);
    setSavedSubjectName(saved.subjectName);
    setSavedSystemName(saved.systemName);
    setShowSelector(false);
    playSfx('hop');
  }, [selectedSubject, selectedSystemId, systemData, playSfx]);

  // ── Dev Progress Reset ──
  const handleReset = useCallback(() => {
    if (savedSubjectId) {
      resetProgress(userId, savedSubjectId);
      setProgress({ completedChapters: [], stars: {} });
      setCharacterIndex(0);
      playSfx('hop');
    }
  }, [userId, savedSubjectId, playSfx]);

  // ── Render Subject Selector Modal ──
  if (showSelector) {
    return (
      <div className={`learning-path-page gamified-adventure-view ${activeWorld.filterClass}`}>
        <div className="lp-selector-overlay">
          <div className="wumpa-modal-frame">
            <div className="wumpa-modal-header">
              <span className="wumpa-tiki-mini">{activeWorld.iconLeft}</span>
              <h2>CHOOSE YOUR REALM</h2>
              <span className="wumpa-tiki-mini">{activeWorld.iconRight}</span>
            </div>
            <p className="wumpa-modal-subtitle">Pick your grade & subject to load the adventure map!</p>

            {selectorLoading ? (
              <div className="lp-loading">
                <div className="lp-loading-spinner" />
                <p>Consulting the ancient map...</p>
              </div>
            ) : (
              <div className="wumpa-modal-body">
                <select
                  className="wumpa-select"
                  value={selectedSystemId || ''}
                  onChange={(e) => {
                    setSelectedSystemId(e.target.value);
                    setSelectedSubject(null);
                    playSfx('hop');
                  }}
                >
                  <option value="" disabled>📚 Select Grade...</option>
                  {systemData.map((s) => (
                    <option key={s._id} value={s._id}>{s.systemName}</option>
                  ))}
                </select>

                {selectedSystemId && (
                  <select
                    className="wumpa-select"
                    value={selectedSubject?._id || ''}
                    onChange={(e) => {
                      const system = systemData.find((s) => s._id === selectedSystemId);
                      const sub = system?.subjects?.find((s) => s._id === e.target.value);
                      if (sub) {
                        setSelectedSubject(sub);
                        playSfx('hop');
                      }
                    }}
                  >
                    <option value="" disabled>📖 Select Subject...</option>
                    {systemData
                      .find((s) => s._id === selectedSystemId)
                      ?.subjects?.map((sub) => (
                        <option key={sub._id} value={sub._id}>{sub.subjectName}</option>
                      ))}
                  </select>
                )}

                <button
                  className="wumpa-btn-gold"
                  disabled={!selectedSubject}
                  onClick={handleSubjectConfirm}
                >
                  ⚔️ START EXPEDITION
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render Loading ──
  if (mapLoading) {
    return (
      <div className={`learning-path-page gamified-adventure-view ${activeWorld.filterClass}`}>
        <div className="lp-loading">
          <div className="lp-loading-spinner" />
          <p>Unfolding the {activeWorld.worldTitle}...</p>
        </div>
      </div>
    );
  }

  // Calculate SVG curve connecting all stages
  const pathD = mappedStages.reduce((acc, stage, idx) => {
    if (idx === 0) return `M ${stage.x} ${stage.y}`;
    const prev = mappedStages[idx - 1];
    const cx = (prev.x + stage.x) / 2;
    const cy = (prev.y + stage.y) / 2;
    return `${acc} Q ${prev.x} ${cy}, ${stage.x} ${stage.y}`;
  }, '');

  return (
    <div className={`learning-path-page gamified-adventure-view ${activeWorld.filterClass}`}>
      {/* ── TOP ADVENTURE HUD BANNER (Subject-Themed) ── */}
      <div className="wumpa-top-hud">
        {/* Left Stats: Lives & Back */}
        <div className="wumpa-hud-cluster hud-left">
          <button className="wumpa-icon-btn" onClick={() => navigate('/dashboard/student')} title="Back to Dashboard">
            <ArrowLeft size={18} />
          </button>
          <div className="wumpa-badge badge-lives">
            <span className="wumpa-badge-icon">{activeWorld.statTokens.livesIcon}</span>
            <div className="wumpa-badge-text">
              <span className="badge-lbl">{activeWorld.statTokens.livesLabel}</span>
              <span className="badge-val">99</span>
            </div>
          </div>
          <div className="wumpa-badge badge-trophy">
            <span className="wumpa-badge-icon">🏆</span>
            <div className="wumpa-badge-text">
              <span className="badge-lbl">STAGES</span>
              <span className="badge-val">{stats.completed}/{stats.total}</span>
            </div>
          </div>
        </div>

        {/* Center Title Plank */}
        <div className="wumpa-title-plank">
          <span className="wumpa-tiki-mask">{activeWorld.iconLeft}</span>
          <div className="wumpa-title-content">
            <h1 className="wumpa-main-title">{activeWorld.worldTitle.toUpperCase()}</h1>
            <p className="wumpa-sub-title">
              {savedSystemName ? `${savedSystemName} — ` : ''}{savedSubjectName || activeWorld.worldSubtitle}
            </p>
          </div>
          <span className="wumpa-tiki-mask mask-flip">{activeWorld.iconRight}</span>
        </div>

        {/* Right Stats: Stars & Area & Sound */}
        <div className="wumpa-hud-cluster hud-right">
          <div className="wumpa-badge badge-stars">
            <span className="wumpa-badge-icon">{activeWorld.statTokens.starsIcon}</span>
            <div className="wumpa-badge-text">
              <span className="badge-lbl">{activeWorld.statTokens.starsLabel}</span>
              <span className="badge-val">{stats.totalStars}/{stats.maxStars}</span>
            </div>
          </div>

          <div
            className="wumpa-badge badge-area"
            style={{
              borderColor: currentStage?.unitTheme?.accentBorder || '#64748b',
              boxShadow: `0 4px 14px ${currentStage?.unitTheme?.colorGlow || 'rgba(0,0,0,0.4)'}`,
            }}
          >
            <span className="wumpa-badge-icon">{currentStage?.unitTheme?.icon || '📍'}</span>
            <div className="wumpa-badge-text">
              <span className="badge-lbl">REGION</span>
              <span
                className="badge-val"
                style={{ color: currentStage?.unitTheme?.color || '#a78bfa' }}
              >
                {currentStage?.unitName || 'Adventure Realm'}
              </span>
            </div>
          </div>

          <button
            className="wumpa-icon-btn"
            onClick={() => {
              setShowSelector(true);
              playSfx('hop');
            }}
            title="Change Grade/Subject"
          >
            <BookOpen size={18} />
          </button>

          <button
            className={`wumpa-icon-btn ${soundMuted ? 'muted' : ''}`}
            onClick={() => setSoundMuted(!soundMuted)}
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* ── THE INTERACTIVE WORLD MAP VIEWPORT ── */}
      <div className="wumpa-world-container" ref={mapAreaRef}>
        <div className="wumpa-map-stage">
          {/* Background Map Art */}
          <img
            src={activeWorld.bgImage}
            alt={activeWorld.worldTitle}
            className={`wumpa-bg-map-image ${activeWorld.filterClass}`}
          />

          {/* Golden Trail Connecting Nodes */}
          <svg className="wumpa-trails-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Trail shadow */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(0, 0, 0, 0.45)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="1.5 1.5"
            />
            {/* Golden glowing trail */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(251, 191, 36, 0.85)"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeDasharray="1.2 1.2"
              className="wumpa-trail-glow"
            />
          </svg>

          {/* ── UNIT REALM ARCHWAYS / GATEWAY MILESTONES ── */}
          {mappedStages.map((stage) => {
            if (!stage.isUnitFirstStage) return null;
            return (
              <div
                key={`archway-${stage.unitId || stage.unitIndex}`}
                className="wumpa-unit-archway"
                style={{
                  left: `${stage.x}%`,
                  top: `${stage.y}%`,
                  '--unit-color': stage.unitTheme.color,
                  '--unit-glow': stage.unitTheme.colorGlow,
                  '--unit-grad': stage.unitTheme.colorBg,
                  '--unit-border': stage.unitTheme.accentBorder,
                }}
              >
                <div className="archway-plank">
                  <span className="archway-icon">{stage.unitTheme.icon}</span>
                  <div className="archway-text-col">
                    
                    <span className="archway-name">{stage.unitName}</span>
                  </div>
                </div>
                <div className="archway-pole" />
              </div>
            );
          })}

          {/* ── STAGE PORTAL NODES (Unit Differentiated) ── */}
          {mappedStages.map((stage) => {
            const isCharacterHere = stage.index === characterIndex;
            const isCompleted = stage.status === 'completed';
            const isCurrent = stage.status === 'current';
            const isLocked = stage.status === 'locked';

            return (
              <div
                key={stage.chapterId}
                className={`wumpa-portal-node ${stage.status} ${isCharacterHere ? 'active-target' : ''} theme-${stage.unitTheme.id}`}
                data-index={stage.index}
                style={{
                  left: `${stage.x}%`,
                  top: `${stage.y}%`,
                  '--stage-color': stage.unitTheme.color,
                  '--stage-glow': stage.unitTheme.colorGlow,
                  '--stage-grad': stage.unitTheme.colorBg,
                  '--stage-border': stage.unitTheme.accentBorder,
                }}
                onClick={() => moveToStage(stage.index)}
              >
                {/* Glowing Ground Pedestal with Unit Colors */}
                <div className="portal-pedestal">
                  <div
                    className="pedestal-outer-ring"
                    style={{
                      borderColor: stage.unitTheme.accentBorder,
                      boxShadow: `0 0 14px ${stage.unitTheme.colorGlow}`,
                    }}
                  />
                  <div
                    className="pedestal-inner-core"
                    style={{
                      background: stage.unitTheme.colorBg,
                    }}
                  />
                  <div className="pedestal-glow" />
                </div>

                {/* Stage Badge / Lock */}
                <div
                  className="portal-center-badge"
                  style={
                    isCompleted
                      ? {
                          background: stage.unitTheme.colorBg,
                          borderColor: stage.unitTheme.accentBorder,
                          boxShadow: `0 0 15px ${stage.unitTheme.colorGlow}`,
                        }
                      : isCurrent
                      ? {
                          borderColor: stage.unitTheme.accentBorder,
                          boxShadow: `0 0 18px ${stage.unitTheme.colorGlow}`,
                        }
                      : {}
                  }
                >
                  {isCompleted ? (
                    <span className="badge-check">✓</span>
                  ) : isLocked ? (
                    <span className="badge-lock">🔒</span>
                  ) : (
                    <span className="badge-num">{stage.index + 1}</span>
                  )}
                </div>

                {/* Stars for Completed Stages */}
                {isCompleted && (
                  <div className="portal-floating-stars">
                    {[1, 2, 3].map((starNum) => (
                      <span
                        key={starNum}
                        className={`mini-star ${starNum <= stage.stars ? 'gold' : 'dim'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}

                {/* Current Beacon Glow Ring */}
                {isCurrent && (
                  <div
                    className="portal-beacon-pulse"
                    style={{
                      borderColor: stage.unitTheme.color,
                    }}
                  />
                )}

                {/* Mini Label on Hover/Select */}
                <div
                  className="portal-label-tag"
                  style={{
                    borderLeftColor: stage.unitTheme.color,
                  }}
                >
                  <span
                    className="tag-index"
                    style={{ color: stage.unitTheme.color }}
                  >
                    {stage.unitTheme.icon} Lesson {stage.chapterIndex + 1}
                  </span>
                  <span className="tag-name">{stage.chapterName}</span>
                </div>
              </div>
            );
          })}

          {/* ── CONTROLLABLE MASCOT HERO CHARACTER ── */}
          {currentStage && (
            <div
              ref={characterRef}
              className={`wumpa-hero-mascot ${isHopping ? 'is-hopping' : 'is-idle'}`}
              style={{
                left: `${currentStage.x}%`,
                top: `${currentStage.y}%`,
              }}
              onClick={launchCurrentStage}
            >
              {/* Energy Halo & Shadow with Unit Tint */}
              <div
                className="hero-ground-halo"
                style={{
                  background: `radial-gradient(ellipse at center, ${currentStage.unitTheme.colorGlow} 0%, transparent 80%)`,
                }}
              />
              <div className="hero-ground-shadow" />

              {/* Cartoon Speech Bubble (when locked or clicked) */}
              {lockedSpeech && (
                <div className="hero-speech-bubble">
                  <span>{lockedSpeech}</span>
                  <div className="speech-arrow" />
                </div>
              )}

              {/* Mascot Character Sprite */}
              <div className="hero-sprite-wrapper">
                <img
                  src={heroSpriteUrl || heroCharacterImg}
                  alt="Hero Character Mascot"
                  className="hero-sprite-img"
                />
              </div>

              {/* Ready Indicator Above Head */}
              <div className="hero-ready-beacon">
                <span
                  className="beacon-bounce"
                  style={{ color: currentStage.unitTheme.accentBorder }}
                >
                  ▼
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FLOATING STAGE ACTION DIALOG & CONTROLLER BAR ── */}
      <div
        className="wumpa-bottom-controls"
        style={{
          borderLeft: `6px solid ${currentStage?.unitTheme?.color || '#475569'}`,
        }}
      >
        {/* Left Stage Details Card */}
        <div className="stage-action-card">
          <div className="card-stage-badge">
            <span
              className="badge-biome-pill"
              style={{
                background: currentStage?.unitTheme?.colorBg,
                borderColor: currentStage?.unitTheme?.accentBorder,
              }}
            >
              {currentStage?.unitTheme?.icon} Unit {currentStage ? currentStage.unitIndex + 1 : 1}
            </span>
            <span className="badge-unit-lbl">{currentStage?.unitName}</span>
          </div>

          <div className="card-lesson-info">
            <h3 className="card-lesson-title">
              <span
                className="card-stage-num"
                style={{ color: currentStage?.unitTheme?.accentBorder || '#fbbf24' }}
              >
                STAGE {characterIndex + 1}:
              </span>{' '}
              {currentStage?.chapterName}
            </h3>
            <div className="card-meta-row">
              <div className="card-stars-display">
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`card-star ${currentStage && s <= (currentStage.stars || 0) ? 'filled' : 'empty'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span
                className="card-status-text"
                style={{
                  color:
                    currentStage?.status === 'completed'
                      ? '#34d399'
                      : currentStage?.status === 'current'
                      ? currentStage.unitTheme.accentBorder
                      : '#94a3b8',
                }}
              >
                {currentStage?.status === 'completed'
                  ? '🏆 Completed'
                  : currentStage?.status === 'current'
                  ? '✨ Ready to Play'
                  : '🔒 Locked'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Primary Action Button */}
        <button
          className={`wumpa-play-button ${currentStage?.status === 'locked' ? 'btn-locked' : 'btn-active'}`}
          style={
            currentStage?.status !== 'locked' && currentStage?.unitTheme
              ? {
                  borderTopColor: currentStage.unitTheme.accentBorder,
                  boxShadow: `0 8px 25px ${currentStage.unitTheme.colorGlow}`,
                }
              : {}
          }
          onClick={launchCurrentStage}
          disabled={currentStage?.status === 'locked'}
        >
          <Play size={24} fill="currentColor" />
          <div className="play-btn-text">
            <span className="play-main-lbl">
              {currentStage?.status === 'completed' ? 'REPLAY LESSON' : 'START LESSON'}
            </span>
            <span className="play-hint-lbl">Press [SPACE] or [ENTER]</span>
          </div>
        </button>

        {/* Right Navigation Arrows (Gamepad Style) */}
        <div className="wumpa-dpad-buttons">
          <button
            className="wumpa-nav-btn"
            disabled={characterIndex <= 0}
            onClick={() => moveToStage(characterIndex - 1)}
            title="Previous Stage [← / A]"
          >
            <ChevronLeft size={22} />
            <span>PREV</span>
          </button>

          <button
            className="wumpa-nav-btn"
            disabled={characterIndex >= mappedStages.length - 1}
            onClick={() => moveToStage(characterIndex + 1)}
            title="Next Stage [→ / D]"
          >
            <span>NEXT</span>
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* Dev Reset Progress */}
      <button className="lp-reset-btn" onClick={handleReset} title="Reset Progress for Testing">
        <RotateCcw size={14} style={{ marginRight: 4 }} />
        Reset Progress
      </button>
    </div>
  );
};

export default LearningPath;

