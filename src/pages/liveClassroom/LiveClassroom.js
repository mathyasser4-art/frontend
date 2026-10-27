import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Copy, Check, Share2, Maximize2, Minimize2, 
  RotateCcw, ExternalLink, HelpCircle, X, Monitor, Sparkles
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
  const [showAbacusDrawer, setShowAbacusDrawer] = useState(false);
  const [showShareTip, setShowShareTip] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
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

  // MiroTalk P2P: 100% free open-source WebRTC, zero login required, no time limits
  const meetingUrl = `https://p2p.mirotalk.com/join?room=${encodeURIComponent(roomName)}&name=${encodeURIComponent(userName)}&audio=1&video=1&screen=1&chat=1&notify=0`;

  // Handle loading state: ensure spinner never hangs indefinitely
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [roomName]);

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

  // Open in floating window (Zoom-style floating thumbnail/meeting window)
  const handlePopoutWindow = () => {
    if (soundEffects && soundEffects.playClick) soundEffects.playClick();
    const width = 540;
    const height = 740;
    const left = window.screen.width - width - 20;
    const top = 60;
    window.open(
      meetingUrl,
      'AbacusLiveClassroom',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no`
    );
  };

  // Open in full standalone browser tab
  const handleOpenFullTab = () => {
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
          {/* Zoom-style Pop-out Floating Window */}
          <button 
            className="live-tool-btn btn-popout" 
            onClick={handlePopoutWindow}
            title={isArabic ? 'فتح في نافذة عائمة جانبية (مثل زووم) لتصفح المنصة بسهولة أثناء الشرح' : 'Pop-out floating window (Zoom-style) to browse platform while teaching'}
          >
            <ExternalLink size={16} />
            <span className="btn-label">{isArabic ? 'نافذة منبثقة' : 'Pop-Out Window'}</span>
          </button>

          {/* Screen Share Tip Guide Button */}
          <button 
            className="live-tool-btn btn-guide"
            onClick={() => {
              if (soundEffects && soundEffects.playClick) soundEffects.playClick();
              setShowGuideModal(true);
            }}
            title={isArabic ? 'طريقة مشاركة الشاشة بدون تكرار' : 'How to share screen without mirror effect'}
          >
            <HelpCircle size={16} />
            <span className="btn-label">{isArabic ? 'دليل الشاشة' : 'Screen Guide'}</span>
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

      {/* Screen Sharing Tip Banner (Dismissible) */}
      {showShareTip && (
        <div className="screen-share-tip-banner">
          <div className="tip-content">
            <span className="tip-badge">💡 {isArabic ? 'نصيحة هامة' : 'Pro Tip'}</span>
            <span className="tip-message">
              {isArabic 
                ? 'لمنع تكرار الشاشة اللانهائي: عند الضغط على مشاركة الشاشة، اختر "علامة تبويب Chrome" (مثل التمارين أو كتاب العداد) بدلاً من "الشاشة بأكملها"، أو استخدم زر "نافذة منبثقة 🪟" لتصفح المنصة بسهولة!' 
                : 'To avoid the infinite screen mirror: when sharing screen, select a specific "Chrome Tab" (like exercises or worksheets) instead of "Entire Screen", or click "Pop-Out Window 🪟" to browse the platform while teaching!'}
            </span>
          </div>
          <div className="tip-actions">
            <button 
              className="tip-learn-btn" 
              onClick={() => setShowGuideModal(true)}
            >
              {isArabic ? 'شرح مصور' : 'Learn How'}
            </button>
            <button 
              className="tip-close-btn" 
              onClick={() => setShowShareTip(false)}
              title={isArabic ? 'إغلاق' : 'Dismiss'}
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
          key={roomName}
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

      {/* Screen Sharing Visual Guide Modal */}
      {showGuideModal && (
        <div className="guide-modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="guide-modal-card" onClick={e => e.stopPropagation()}>
            <div className="guide-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={22} color="#3b82f6" />
                <h3>{isArabic ? 'كيف تشارك شاشتك مع الطلاب بدون تكرار؟' : 'How to Share Screen Without Mirror Effect'}</h3>
              </div>
              <button className="guide-close-btn" onClick={() => setShowGuideModal(false)}>✕</button>
            </div>

            <div className="guide-modal-body">
              <div className="guide-explain-box">
                <p>
                  {isArabic
                    ? 'عندما تشارك "الشاشة بأكملها" وأنت تنظر لنفس نافذة الاجتماع، تقوم الشاشة بتصوير نفسها باستمرار فيحدث تأثير النفق (المرايا المتكررة). هذا يحدث في كل تطبيقات الفيديو بما فيها Zoom وGoogle Meet عند تصوير نفس الشاشة.'
                    : 'When you share "Entire Screen" while looking at the meeting window, the screen captures itself recursively creating an infinite tunnel effect. Here is how to share cleanly like a pro:'}
                </p>
              </div>

              <div className="guide-steps-list">
                <div className="guide-step-item">
                  <div className="step-num">1</div>
                  <div className="step-content">
                    <h4>{isArabic ? 'الخيار الأفضل: مشاركة علامة تبويب (Chrome Tab)' : 'Best Choice: Share a Chrome Tab'}</h4>
                    <p>{isArabic ? 'عند الضغط على أيقونة الشاشة في الفصل، اختر تبويب "Chrome Tab" وحدد صفحة تمارين أو ألعاب أبطال العداد أو كتاب الرياضيات.' : 'Click Screen Share in the call, select the "Chrome Tab" option, and choose your Abacus exercises or worksheet tab.'}</p>
                  </div>
                </div>

                <div className="guide-step-item">
                  <div className="step-num">2</div>
                  <div className="step-content">
                    <h4>{isArabic ? 'استخدم زر "نافذة منبثقة 🪟" (مثل برنامج Zoom)' : 'Use "Pop-Out Window 🪟" (Zoom-Style)'}</h4>
                    <p>{isArabic ? 'اضغط زر "نافذة منبثقة" في الأعلى لفتح الفصل في نافذة عائمة جانبية، ثم تصفح بنك الأسئلة أو الواجبات في شاشتك الرئيسية وشاركها مع الطلاب.' : 'Click "Pop-Out Window" to detach the video call into a compact side window, then browse assignments and games on your main screen!'}</p>
                  </div>
                </div>

                <div className="guide-step-item">
                  <div className="step-num">3</div>
                  <div className="step-content">
                    <h4>{isArabic ? 'استخدم العداد التفاعلي المدمج 🧮' : 'Use the Built-in Virtual Soroban 🧮'}</h4>
                    <p>{isArabic ? 'اضغط على زر "العداد التفاعلي" من الشريط العلوي لعرض العداد الصيني وشرح العمليات الحسابية مباشرة لطلابك.' : 'Click "Virtual Soroban" to slide out the interactive abacus and explain mental math steps live.'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="guide-modal-footer">
              <button className="guide-ok-btn" onClick={() => setShowGuideModal(false)}>
                {isArabic ? 'فهمت ذلك، شكراً!' : 'Got it, thank you!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
