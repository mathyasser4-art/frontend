import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Copy, Check, Share2, Maximize2, Minimize2, 
  RotateCcw, ExternalLink
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
  const queryProvider = queryParams.get('provider');

  // Clean ASCII slug for WebRTC room URL to avoid illegal character issues
  const cleanAscii = (userName || '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 12);
  const roomPrefix = cleanAscii || (isTeacher ? 'Teacher' : 'Hero');
  const defaultRoom = `AbacusHeroes_${roomPrefix}_${shortId}`;
  const roomName = (queryRoom && queryRoom.trim()) || defaultRoom;

  const [provider, setProvider] = useState(queryProvider || 'mirotalk'); // 'mirotalk' | 'jitsi'
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Calculate meeting URL based on selected provider
  const getMeetingUrl = () => {
    if (provider === 'jitsi') {
      return `https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName="${encodeURIComponent(userName)}"`;
    }
    // MiroTalk P2P: 100% free open-source WebRTC, instant join, no login needed
    return `https://p2p.mirotalk.com/join?room=${encodeURIComponent(roomName)}&name=${encodeURIComponent(userName)}&audio=1&video=1&screen=1&chat=1&notify=0`;
  };

  const meetingUrl = getMeetingUrl();

  // Handle loading state: ensure spinner never hangs indefinitely
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [provider, roomName]);

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
    const link = `${window.location.origin}/live-classroom?room=${encodeURIComponent(roomName)}&provider=${provider}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareWhatsApp = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    const link = `${window.location.origin}/live-classroom?room=${encodeURIComponent(roomName)}&provider=${provider}`;
    const msg = isTeacher
      ? (isArabic 
          ? `مرحباً يا أبطال 🌟\nتبدأ حصتنا المباشرة الآن في منصة أبطال العداد (Abacus Heroes)!\n\nاضغط على الرابط التالي للانضمام فوراً:\n${link}`
          : `Hello Heroes! 🌟\nOur Live Class on Abacus Heroes is starting right now!\n\nClick the link to join instantly:\n${link}`)
      : (isArabic
          ? `انضم معي الآن إلى الحصة المباشرة في أبطال العداد:\n${link}`
          : `Join our Live Class on Abacus Heroes:\n${link}`);

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

  const handleOpenNewWindow = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
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
              <span>LIVE</span>
            </div>
            <h2 className="live-room-title" title={userName}>
              {isTeacher 
                ? (isArabic ? `فصل البث المباشر: ${userName}` : `Live Class: ${userName}`)
                : (isArabic ? `حصة أبطال العداد: ${userName}` : `Classroom: ${userName}`)}
            </h2>
            <span className="live-room-code-tag">
              #{roomName.slice(-6)}
            </span>
          </div>
        </div>

        <div className="live-header-right">
          {/* Provider Switcher */}
          <div className="live-provider-switch" title={isArabic ? 'تبديل خادم الفيديو' : 'Switch Video Server'}>
            <button 
              className={`provider-btn ${provider === 'mirotalk' ? 'active' : ''}`}
              onClick={() => {
                if (soundEffects && soundEffects.playClick) soundEffects.playClick();
                setProvider('mirotalk');
              }}
            >
              ⚡ MiroTalk
            </button>
            <button 
              className={`provider-btn ${provider === 'jitsi' ? 'active' : ''}`}
              onClick={() => {
                if (soundEffects && soundEffects.playClick) soundEffects.playClick();
                setProvider('jitsi');
              }}
            >
              🎥 Jitsi
            </button>
          </div>

          {/* Open in New Window */}
          <button 
            className="live-tool-btn btn-popup" 
            onClick={handleOpenNewWindow}
            title={isArabic ? 'فتح الفصل في نافذة كاملة مستقلة' : 'Open in Full Window'}
          >
            <ExternalLink size={16} />
            <span className="btn-label">{isArabic ? 'نافذة جديدة' : 'Full Window'}</span>
          </button>

          {/* Virtual Soroban Drawer Toggle */}
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

          {/* Copy Link */}
          <button className="live-tool-btn" onClick={handleCopyLink} title={isArabic ? 'نسخ رابط الحصة' : 'Copy Room Link'}>
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span className="btn-label">{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ الرابط' : 'Copy Link')}</span>
          </button>

          {/* Share WhatsApp */}
          <button className="live-tool-btn btn-wa" onClick={handleShareWhatsApp} title={isArabic ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}>
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
      <div className="live-classroom-body">
        {/* Loading Spinner */}
        {loading && (
          <div className="live-classroom-loading">
            <div className="loading-spinner-ring"></div>
            <span className="loading-text">
              {isArabic ? 'جاري تجهيز الفصل المباشر...' : 'Connecting to Live Classroom...'}
            </span>
            <span className="loading-hint">
              {isArabic ? 'يرجى السماح للكاميرا والميكروفون عند المطالبة 🎙️' : 'Please allow camera & microphone when prompted 🎙️'}
            </span>
          </div>
        )}

        {/* Embedded WebRTC Meeting Iframe */}
        <iframe
          key={`${provider}_${roomName}`}
          ref={iframeRef}
          src={meetingUrl}
          title="Abacus Heroes Live Video Classroom"
          allow="camera *; microphone *; speaker-selection *; display-capture *; fullscreen *; clipboard-read *; clipboard-write *; web-share *; autoplay *; picture-in-picture *"
          onLoad={() => setLoading(false)}
          className="live-classroom-iframe"
        />

        {/* Interactive Virtual Soroban Slide-out Sidebar */}
        {showAbacusDrawer && (
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
                  ? 'يمكنك تحريك الخرزات للشرح لطلابك أثناء مشاركة شاشتك أو الشرح بالفيديو!' 
                  : 'Move beads to illustrate mental math operations while sharing your screen with students!'}
              </div>

              {/* Soroban Frame */}
              <div className="soroban-frame">
                {/* Numeric Display */}
                <div className="soroban-counter-display">
                  {calculateAbacusTotal().toLocaleString()}
                </div>

                <div className="soroban-rods-container">
                  {/* Beam Bar */}
                  <div className="soroban-divider-bar"></div>

                  {abacusRods.map((rod, rIdx) => (
                    <div key={rIdx} className="soroban-rod">
                      <div className="soroban-rod-wire"></div>

                      {/* Upper Deck (Value = 5) */}
                      <div className="soroban-upper-deck">
                        <div 
                          className={`soroban-bead ${rod.upper === 1 ? 'upper-active' : ''}`}
                          onClick={() => toggleUpperBead(rIdx)}
                        ></div>
                      </div>

                      {/* Lower Deck (Value = 1 each, 4 beads) */}
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

              {/* Reset Button */}
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
