import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Copy, Check, Share2, Maximize2, Minimize2, 
  RotateCcw, Sparkles 
} from 'lucide-react';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import './LiveClassroom.css';

export default function LiveClassroom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const isAuth = safeLocalStorage.getItem('O_authWEB');
  const role = safeLocalStorage.getItem('auth_role') || 'Student';
  const isTeacher = role === 'Teacher' || role === 'School' || role === 'Admin';
  const userName = safeLocalStorage.getItem('pp_name') || safeLocalStorage.getItem('auth_userName') || 'Hero';
  const userAvatar = safeLocalStorage.getItem('user_profile_avatar') || '';

  // Extract room from URL query, or construct teacher's standard room
  const queryParams = new URLSearchParams(location.search);
  const queryRoom = queryParams.get('room');

  const sanitizeRoom = (str) => (str || '').replace(/[^a-zA-Z0-9_-]/g, '_');

  const defaultRoom = isTeacher 
    ? `AbacusHeroes_${sanitizeRoom(userName)}` 
    : 'AbacusHeroes_Live_Class';

  const [roomName, setRoomName] = useState(sanitizeRoom(queryRoom) || defaultRoom);
  const [copied, setCopied] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAbacusDrawer, setShowAbacusDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Virtual Abacus State: 5 rods (Units, Tens, Hundreds, Thousands, Ten-Thousands)
  // Each rod: upper (0 or 1 active), lower (number of active beads 0-4)
  const [abacusRods, setAbacusRods] = useState([
    { upper: 0, lower: 0 }, // 10,000s
    { upper: 0, lower: 0 }, // 1,000s
    { upper: 0, lower: 0 }, // 100s
    { upper: 0, lower: 0 }, // 10s
    { upper: 0, lower: 0 }  // 1s
  ]);

  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

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
      // If clicking already active bead, decrease or clear; else set to beadIndex
      const newActive = currentActive === beadIndex ? beadIndex - 1 : beadIndex;
      updated[rodIdx] = {
        ...updated[rodIdx],
        lower: Math.max(0, Math.min(4, newActive))
      };
      return updated;
    });
  };

  // Load and mount Jitsi Meet iframe
  useEffect(() => {
    let isCancelled = false;

    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }
        const existingScript = document.getElementById('jitsi-external-api-script');
        if (existingScript) {
          existingScript.onload = () => resolve(window.JitsiMeetExternalAPI);
          return;
        }
        const script = document.createElement('script');
        script.id = 'jitsi-external-api-script';
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve(window.JitsiMeetExternalAPI);
        script.onerror = () => reject(new Error('Failed to load Jitsi API'));
        document.body.appendChild(script);
      });
    };

    loadScript()
      .then((JitsiAPI) => {
        if (isCancelled || !jitsiContainerRef.current) return;

        // Dispose any existing instance
        if (jitsiApiRef.current) {
          try { jitsiApiRef.current.dispose(); } catch (e) {}
        }

        const domain = 'meet.jit.si';
        const displayName = isTeacher ? `👨‍🏫 ${userName} (Teacher)` : `🎓 ${userName}`;

        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName,
            email: `${sanitizeRoom(userName).toLowerCase()}@abacusheroes.com`
          },
          configOverwrite: {
            startWithAudioMuted: !isTeacher,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            defaultLanguage: isArabic ? 'ar' : 'en',
            toolbarButtons: [
              'camera',
              'chat',
              'desktop', // Screen Sharing!
              'fullscreen',
              'hangup',
              'microphone',
              'participants-pane',
              'profile',
              'raisehand',
              'recording',
              'select-background',
              'settings',
              'tileview',
              'toggle-camera',
              'videoquality',
              'whiteboard' // Built-in Collaborative Whiteboard!
            ]
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#090d16',
            TOOLBAR_ALWAYS_VISIBLE: true
          }
        };

        const api = new JitsiAPI(domain, options);
        jitsiApiRef.current = api;

        api.addEventListener('videoConferenceJoined', () => {
          setLoading(false);
        });

        api.addEventListener('videoConferenceLeft', () => {
          setMeetingEnded(true);
        });
      })
      .catch((err) => {
        console.error('Error loading Jitsi API:', err);
        setLoading(false);
      });

    return () => {
      isCancelled = true;
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) {}
      }
    };
  }, [roomName, isTeacher, userName, isArabic]);

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
    const link = `${window.location.origin}/live-classroom?room=${roomName}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShareWhatsApp = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    const link = `${window.location.origin}/live-classroom?room=${roomName}`;
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
            <h2 className="live-room-title" title={roomName}>
              {roomName.replace('AbacusHeroes_', '').replace(/_/g, ' ')}
            </h2>
            <span className="live-room-code-tag">
              #{roomName.slice(-8)}
            </span>
          </div>
        </div>

        <div className="live-header-right">
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
          <button className="live-tool-btn" onClick={toggleFullscreen}>
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
              {isArabic ? 'جاري تجهيز الغرفة الافتراضية...' : 'Launching Live Classroom...'}
            </span>
          </div>
        )}

        {/* Jitsi Meet Embed */}
        <div className="jitsi-meeting-container" ref={jitsiContainerRef}></div>

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

      {/* Meeting Ended Modal */}
      {meetingEnded && (
        <div className="meeting-ended-modal">
          <div className="meeting-ended-card animate-pop">
            <div className="meeting-ended-icon">👋</div>
            <h2>{isArabic ? 'انتهت الحصة المباشرة' : 'Live Class Finished'}</h2>
            <p>
              {isArabic 
                ? 'شكراً لحضورك ومشاركتك في الحصة الافتراضية مع أبطال العداد!' 
                : 'Thank you for participating in the Abacus Heroes Live Classroom!'}
            </p>
            <div className="meeting-ended-actions">
              <button 
                className="ended-rejoin-btn"
                onClick={() => {
                  setMeetingEnded(false);
                  setLoading(true);
                }}
              >
                🔄 {isArabic ? 'إعادة الانضمام للحصة' : 'Rejoin Class'}
              </button>
              <button 
                className="ended-dashboard-btn"
                onClick={handleBack}
              >
                🏠 {isArabic ? 'العودة للرئيسية' : 'Return to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
