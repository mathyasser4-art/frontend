import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Copy, Check, Share2, Maximize2, Minimize2, 
  RotateCcw, ExternalLink, HelpCircle, X, Monitor, Sparkles,
  Play, Eye, EyeOff, Edit3, Trash2, Users
} from 'lucide-react';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import './LiveClassroom.css';

export default function LiveClassroom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n?.language === 'ar';

  const role = safeLocalStorage.getItem('auth_role') || 'Student';
  const isTeacher = role === 'Teacher' || role === 'School' || role === 'Admin';
  const userName = safeLocalStorage.getItem('pp_name') || safeLocalStorage.getItem('auth_userName') || 'Hero';
  const rawId = safeLocalStorage.getItem('pp_id') || safeLocalStorage.getItem('auth_id') || '';
  const shortId = rawId ? rawId.slice(-6) : Math.random().toString(36).substring(2, 8);

  const queryParams = new URLSearchParams(location.search);
  const queryRoom = queryParams.get('room');

  // Clean ASCII slug for WebRTC room URL to avoid illegal character issues
  const cleanAscii = (userName || '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 12);
  const roomPrefix = cleanAscii || (isTeacher ? 'Teacher' : 'Hero');
  const defaultRoom = `AbacusHeroes_${roomPrefix}_${shortId}`;
  const roomName = (queryRoom && queryRoom.trim()) || defaultRoom;

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  // Default to true: HeroTalk Studio workspace is active by default so teachers NEVER see recurring screens!
  const [teachingMode, setTeachingMode] = useState(true); 
  const [showAbacusDrawer, setShowAbacusDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);

  // Virtual Abacus State: 5 rods (Units, Tens, Hundreds, Thousands, Ten-Thousands)
  const [abacusRods, setAbacusRods] = useState([
    { upper: 0, lower: 0 },
    { upper: 0, lower: 0 },
    { upper: 0, lower: 0 },
    { upper: 0, lower: 0 },
    { upper: 0, lower: 0 }
  ]);

  // Flash Math Question Generator State
  const [mathDigits, setMathDigits] = useState(1);
  const [mathRows, setMathRows] = useState(3);
  const [currentQuestion, setCurrentQuestion] = useState({
    terms: [{ op: '+', val: 5 }, { op: '+', val: 3 }, { op: '-', val: 2 }],
    answer: 6
  });
  const [showAnswer, setShowAnswer] = useState(false);

  // Whiteboard Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#38bdf8');

  // HeroTalk WebRTC engine (Zero external accounts, unlimited duration, full privacy)
  const meetingUrl = `https://p2p.mirotalk.com/join?room=${encodeURIComponent(roomName)}&name=${encodeURIComponent(userName)}&audio=1&video=1&screen=1&chat=1&notify=0`;

  // Handle loading state: ensure spinner never hangs indefinitely
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [roomName]);

  // Generate verified random mental math question
  const generateNewQuestion = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    setShowAnswer(false);
    const max = Math.pow(10, mathDigits) - 1;
    const min = mathDigits === 1 ? 1 : Math.pow(10, mathDigits - 1);
    const terms = [];
    let runningTotal = 0;

    for (let i = 0; i < mathRows; i++) {
      if (i === 0) {
        const val = Math.floor(Math.random() * (max - min + 1)) + min;
        terms.push({ op: '+', val });
        runningTotal += val;
      } else {
        const canSubtract = runningTotal > min;
        const isSub = canSubtract && Math.random() > 0.45;
        if (isSub) {
          const maxSub = Math.min(runningTotal, max);
          const val = Math.floor(Math.random() * (maxSub - 1)) + 1;
          terms.push({ op: '-', val });
          runningTotal -= val;
        } else {
          const val = Math.floor(Math.random() * (max - min + 1)) + min;
          terms.push({ op: '+', val });
          runningTotal += val;
        }
      }
    }
    setCurrentQuestion({ terms, answer: runningTotal });
  };

  // Canvas Whiteboard Drawing Handlers
  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Calculate current abacus numeric value
  const calculateAbacusTotal = () => {
    let total = 0;
    const multipliers = [10000, 1000, 100, 10, 1];
    abacusRods.forEach((rod, idx) => {
      const rodValue = (rod.upper * 5) + rod.lower;
      total += rodValue * multipliers[idx];
    });
    return total;
  };

  const resetAbacus = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    setAbacusRods([
      { upper: 0, lower: 0 },
      { upper: 0, lower: 0 },
      { upper: 0, lower: 0 },
      { upper: 0, lower: 0 },
      { upper: 0, lower: 0 }
    ]);
  };

  const toggleUpperBead = (rodIdx) => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    setAbacusRods(prev => {
      const updated = [...prev];
      updated[rodIdx] = {
        ...updated[rodIdx],
        upper: updated[rodIdx].upper === 1 ? 0 : 1
      };
      return updated;
    });
  };

  const setLowerBeads = (rodIdx, beadIndex) => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    setAbacusRods(prev => {
      const updated = [...prev];
      const currentActive = updated[rodIdx].lower;
      const newActive = currentActive === beadIndex ? beadIndex - 1 : beadIndex;
      updated[rodIdx] = {
        ...updated[rodIdx],
        lower: Math.max(0, Math.min(4, newActive))
      };
      return updated;
    });
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCopyLink = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    const link = `${window.location.origin}/live-classroom?room=${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareWhatsApp = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    const link = `${window.location.origin}/live-classroom?room=${encodeURIComponent(roomName)}`;
    const msg = isTeacher
      ? (isArabic 
          ? `مرحباً يا أبطال 🌟\nتبدأ الآن حصتنا المباشرة عبر HeroTalk في منصة أبطال العداد (Abacus Heroes)!\n\nاضغط على الرابط التالي للانضمام فوراً:\n${link}`
          : `Hello Heroes! 🌟\nOur HeroTalk Live Class on Abacus Heroes is starting right now!\n\nClick the link to join instantly:\n${link}`)
      : (isArabic
          ? `انضم معي الآن إلى حصة HeroTalk في أبطال العداد:\n${link}`
          : `Join our HeroTalk Live Class on Abacus Heroes:\n${link}`);

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleBack = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    if (role === 'Teacher') {
      navigate('/dashboard/teacher');
    } else if (role === 'Student') {
      navigate('/dashboard/student');
    } else {
      navigate('/');
    }
  };

  // Open in floating window (HeroTalk floating companion window)
  const handlePopoutWindow = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    const width = 540;
    const height = 740;
    const left = window.screen.width - width - 20;
    const top = 60;
    window.open(
      meetingUrl,
      'HeroTalkLive',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no`
    );
  };

  return (
    <div className="live-classroom-page" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Top Header Bar */}
      <header className="live-header-bar">
        <div className="live-header-left">
          <button className="live-back-btn" onClick={handleBack}>
            <ArrowLeft size={18} style={{ transform: isArabic ? 'scaleX(-1)' : 'none' }} />
            <span>{isArabic ? 'العودة للوحة التحكم' : 'Dashboard'}</span>
          </button>

          <div className="live-room-info">
            <div className="live-badge-glow">
              <span className="live-dot-pulse"></span>
              <span>HEROTALK</span>
            </div>
            <h2 className="live-room-title" title={userName}>
              {isTeacher 
                ? (isArabic ? `فصل هيرو توك: ${userName}` : `HeroTalk: ${userName}`)
                : (isArabic ? `حصة هيرو توك: ${userName}` : `HeroTalk: ${userName}`)}
            </h2>
            <span className="live-room-code-tag">
              #{roomName.slice(-6)}
            </span>
          </div>
        </div>

        <div className="live-header-right">
          {/* HeroTalk Studio / Gallery Mode Toggle Button */}
          <button 
            className={`live-tool-btn btn-teaching-toggle ${teachingMode ? 'active-mode' : ''}`}
            onClick={() => {
              if (soundEffects && soundEffects.playClick) soundEffects.playClick();
              setTeachingMode(!teachingMode);
            }}
            title={teachingMode 
              ? (isArabic ? 'عرض كاميرات جميع الطلاب ملء الشاشة' : 'Switch to Student Video Grid') 
              : (isArabic ? 'العودة لسبورة الشرح والعداد المباشر' : 'Return to HeroTalk Studio')}
          >
            {teachingMode ? <Users size={16} /> : <Monitor size={16} />}
            <span className="btn-label">
              {teachingMode 
                ? (isArabic ? '👥 عرض الطلاب' : '👥 Student Gallery')
                : (isArabic ? '📚 ستوديو الشرح والسبورة' : '📚 HeroTalk Studio')}
            </span>
          </button>

          {/* External Pop-Out Window */}
          <button 
            className="live-tool-btn btn-popout" 
            onClick={handlePopoutWindow}
            title={isArabic ? 'فتح كاميرات هيرو توك في نافذة منبثقة عائمة لتصفح أي برنامج بحرية' : 'Pop-out floating video window'}
          >
            <ExternalLink size={16} />
            <span className="btn-label">{isArabic ? 'نافذة منبثقة' : 'Pop-Out'}</span>
          </button>

          {/* Virtual Soroban Drawer Toggle (if in full gallery video mode) */}
          {!teachingMode && (
            <button 
              className={`live-tool-btn btn-abacus ${showAbacusDrawer ? 'active-tool' : ''}`}
              onClick={() => {
                if (soundEffects && soundEffects.playClick) soundEffects.playClick();
                setShowAbacusDrawer(!showAbacusDrawer);
              }}
              title={isArabic ? 'عرض العداد التفاعلي للشرح' : 'Interactive Soroban Tool'}
            >
              <span>🧮</span>
              <span className="btn-label">{isArabic ? 'العداد التفاعلي' : 'Virtual Soroban'}</span>
            </button>
          )}

          {/* Copy Link */}
          <button className="live-tool-btn" onClick={handleCopyLink} title={isArabic ? 'نسخ رابط HeroTalk' : 'Copy Room Link'}>
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span className="btn-label">{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ الرابط' : 'Copy Link')}</span>
          </button>

          {/* Share WhatsApp */}
          <button className="live-tool-btn btn-wa" onClick={handleShareWhatsApp} title={isArabic ? 'دعوة الطلاب عبر واتساب' : 'Share on WhatsApp'}>
            <Share2 size={16} />
            <span className="btn-label">{isArabic ? 'دعوة عبر واتساب' : 'Invite'}</span>
          </button>

          {/* Fullscreen */}
          <button className="live-tool-btn" onClick={toggleFullscreen} title={isArabic ? 'شاشة كاملة' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Video & Interactive Teaching Space */}
      <div className={`live-classroom-body ${teachingMode ? 'teaching-mode' : ''}`}>
        {/* Loading Spinner */}
        {loading && (
          <div className="live-classroom-loading">
            <div className="loading-spinner-ring"></div>
            <span className="loading-text">
              {isArabic ? 'جاري تجهيز HeroTalk...' : 'Connecting to HeroTalk...'}
            </span>
            <span className="loading-hint">
              {isArabic ? 'يرجى السماح للكاميرا والميكروفون عند المطالبة 🎙️' : 'Please allow camera & microphone when prompted 🎙️'}
            </span>
          </div>
        )}

        {/* HEROTALK STUDIO WORKSPACE (DEFAULT VIEW - GUARANTEES ZERO RECURRING SCREENS!) */}
        {teachingMode && (
          <div className="teaching-workspace animate-fade-in">
            {/* Top Workspace Header */}
            <div className="workspace-header-card">
              <div className="workspace-title-box">
                <span className="workspace-badge">⚡ {isArabic ? 'ستوديو الشرح التفاعلي النشط' : 'HeroTalk Live Studio'}</span>
                <h2>{isArabic ? 'سبورة الشرح وبنك التمارين المباشرة' : 'Interactive Math Board & Practice Workspace'}</h2>
                <p>
                  {isArabic 
                    ? 'فيديو الطلاب والمعلم يعمل تلقائياً في الزاوية العائمة. شارك هذه الشاشة مع طلابك لشرح المسائل والعداد مباشرة وبدون أي تكرار للشاشة.' 
                    : 'Live video floats smoothly in the corner. Share this screen with your students to demonstrate math operations with zero screen mirror.'}
                </p>
              </div>
              <button className="workspace-expand-btn" onClick={() => setTeachingMode(false)}>
                <Users size={16} />
                <span>{isArabic ? 'عرض الطلاب (ملء الشاشة)' : 'Student Video Grid'}</span>
              </button>
            </div>

            {/* Grid Layout: Left is Soroban, Right is Question Generator & Whiteboard */}
            <div className="workspace-grid">
              {/* Virtual Soroban Abacus Section */}
              <div className="workspace-panel abacus-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <span>🧮</span>
                    <span>{isArabic ? 'العداد الصيني التفاعلي (السوروبان)' : 'Virtual Soroban Abacus'}</span>
                  </div>
                  <button className="soroban-reset-btn mini" onClick={resetAbacus}>
                    <RotateCcw size={14} />
                    <span>{isArabic ? 'تصفير' : 'Reset'}</span>
                  </button>
                </div>

                <div className="soroban-workspace-view">
                  <div className="soroban-counter-display large">
                    {calculateAbacusTotal().toLocaleString()}
                  </div>

                  <div className="soroban-frame full-board">
                    <div className="soroban-rods-container">
                      <div className="soroban-divider-bar"></div>
                      {abacusRods.map((rod, rIdx) => (
                        <div key={rIdx} className="soroban-rod">
                          <div className="soroban-rod-wire"></div>
                          {/* Upper Bead */}
                          <div className="soroban-upper-deck">
                            <div 
                              className={`soroban-bead ${rod.upper === 1 ? 'upper-active' : ''}`}
                              onClick={() => toggleUpperBead(rIdx)}
                            ></div>
                          </div>
                          {/* Lower 4 Beads */}
                          <div className="soroban-lower-deck">
                            {[1, 2, 3, 4].map((beadNum) => (
                              <div 
                                key={beadNum}
                                className={`soroban-bead ${rod.lower >= beadNum ? 'lower-active' : ''}`}
                                onClick={() => setLowerBeads(rIdx, beadNum)}
                              ></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mental Math Flash Practice Generator */}
              <div className="workspace-panel question-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <span>⚡</span>
                    <span>{isArabic ? 'مولد المسائل السريعة للطلاب' : 'Live Mental Math Generator'}</span>
                  </div>
                  <button className="btn-generate-next" onClick={generateNewQuestion}>
                    <span>🎲</span>
                    <span>{isArabic ? 'مسألة جديدة' : 'New Question'}</span>
                  </button>
                </div>

                {/* Generator Controls */}
                <div className="generator-controls">
                  <div className="control-group">
                    <label>{isArabic ? 'الخانات:' : 'Digits:'}</label>
                    <div className="pill-selector">
                      {[1, 2, 3].map(d => (
                        <button 
                          key={d} 
                          className={`pill-btn ${mathDigits === d ? 'active' : ''}`}
                          onClick={() => setMathDigits(d)}
                        >
                          {d} {isArabic ? (d === 1 ? 'خانة' : 'خانات') : (d === 1 ? 'Digit' : 'Digits')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label>{isArabic ? 'الصفوف:' : 'Rows:'}</label>
                    <div className="pill-selector">
                      {[3, 4, 5, 6].map(r => (
                        <button 
                          key={r} 
                          className={`pill-btn ${mathRows === r ? 'active' : ''}`}
                          onClick={() => setMathRows(r)}
                        >
                          {r} {isArabic ? 'صفوف' : 'Rows'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Big Question Flash Card */}
                <div className="math-question-card">
                  <div className="math-terms-list">
                    {currentQuestion.terms.map((term, idx) => (
                      <div key={idx} className="math-term-row">
                        <span className="term-op">{idx === 0 ? '' : term.op}</span>
                        <span className="term-val">{term.val}</span>
                      </div>
                    ))}
                    <div className="math-line-separator"></div>
                  </div>

                  {/* Answer Reveal Area */}
                  <div className="math-answer-box">
                    <button 
                      className={`btn-toggle-answer ${showAnswer ? 'revealed' : ''}`}
                      onClick={() => setShowAnswer(!showAnswer)}
                    >
                      {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span>{showAnswer ? (isArabic ? 'إخفاء الإجابة' : 'Hide Answer') : (isArabic ? 'إظهار الناتج' : 'Reveal Answer')}</span>
                    </button>
                    {showAnswer && (
                      <span className="answer-text animate-pop">
                        = {currentQuestion.answer}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Digital Whiteboard Canvas */}
              <div className="workspace-panel whiteboard-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <span>✏️</span>
                    <span>{isArabic ? 'السبورة الرقمية للكتابة والرسم' : 'Interactive Whiteboard'}</span>
                  </div>
                  <div className="canvas-tools">
                    <div className="color-palette">
                      {['#38bdf8', '#facc15', '#4ade80', '#f87171', '#ffffff'].map(c => (
                        <div 
                          key={c}
                          className={`color-dot ${penColor === c ? 'active-dot' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setPenColor(c)}
                        />
                      ))}
                    </div>
                    <button className="canvas-clear-btn" onClick={handleClearCanvas} title={isArabic ? 'مسح السبورة' : 'Clear Board'}>
                      <Trash2 size={14} />
                      <span>{isArabic ? 'مسح' : 'Clear'}</span>
                    </button>
                  </div>
                </div>

                <div className="canvas-wrapper">
                  <canvas 
                    ref={canvasRef}
                    width={800}
                    height={300}
                    className="drawing-canvas"
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDraw}
                    onMouseUp={handleStopDraw}
                    onMouseLeave={handleStopDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDraw}
                    onTouchEnd={handleStopDraw}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Embedded WebRTC Meeting Iframe (Always mounted so call never drops!) */}
        <iframe
          key={roomName}
          ref={iframeRef}
          src={meetingUrl}
          title="HeroTalk Live Video Classroom"
          allow="camera *; microphone *; speaker-selection *; display-capture *; fullscreen *; clipboard-read *; clipboard-write *; web-share *; autoplay *; picture-in-picture *"
          onLoad={() => setLoading(false)}
          className={`live-classroom-iframe ${teachingMode ? 'pip-mini-mode' : ''}`}
        />

        {/* Floating Mini Window Controls (Visible when in Teaching Mode) */}
        {teachingMode && (
          <div className="pip-mini-header">
            <div className="pip-status-tag">
              <span className="live-dot-pulse"></span>
              <span>HeroTalk Live</span>
            </div>
            <button 
              className="pip-expand-action-btn"
              onClick={() => setTeachingMode(false)}
              title={isArabic ? 'عرض كاميرات جميع الطلاب ملء الشاشة' : 'Expand Student Video'}
            >
              <Users size={14} />
              <span>{isArabic ? 'عرض الطلاب' : 'Gallery'}</span>
            </button>
          </div>
        )}

        {/* Slide-out Virtual Soroban for Full Gallery Mode */}
        {showAbacusDrawer && !teachingMode && (
          <aside className="live-abacus-drawer">
            <div className="abacus-drawer-header">
              <div className="abacus-drawer-title">
                <span>🧮</span>
                <span>{isArabic ? 'العداد الصيني التفاعلي (السوروبان)' : 'Virtual Soroban Abacus'}</span>
              </div>
              <button className="close-drawer-btn" onClick={() => setShowAbacusDrawer(false)}>✕</button>
            </div>

            <div className="abacus-drawer-body">
              <div className="abacus-helper-tip">
                💡 {isArabic 
                  ? 'يمكنك تحريك الخرزات للشرح لطلابك أثناء الشرح بالفيديو!' 
                  : 'Move beads to illustrate mental math operations while teaching students!'}
              </div>

              {/* Soroban Frame */}
              <div className="soroban-frame">
                <div className="soroban-counter-display">
                  {calculateAbacusTotal().toLocaleString()}
                </div>

                <div className="soroban-rods-container">
                  <div className="soroban-divider-bar"></div>
                  {abacusRods.map((rod, rIdx) => (
                    <div key={rIdx} className="soroban-rod">
                      <div className="soroban-rod-wire"></div>
                      <div className="soroban-upper-deck">
                        <div 
                          className={`soroban-bead ${rod.upper === 1 ? 'upper-active' : ''}`}
                          onClick={() => toggleUpperBead(rIdx)}
                        ></div>
                      </div>
                      <div className="soroban-lower-deck">
                        {[1, 2, 3, 4].map((beadNum) => (
                          <div 
                            key={beadNum}
                            className={`soroban-bead ${rod.lower >= beadNum ? 'lower-active' : ''}`}
                            onClick={() => setLowerBeads(rIdx, beadNum)}
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="soroban-reset-btn" onClick={resetAbacus}>
                <RotateCcw size={16} />
                <span>{isArabic ? 'تصفير العداد' : 'Reset Abacus'}</span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
