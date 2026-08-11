import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import googlePlay from '../../img/google-play.png';
import appStore from '../../img/app-store.png';
import appIcon from '../../img/icon-app.png';
import isoIcon from '../../img/ios-icon.png';
import { safeSessionStorage } from '../../utils/safeStorage';
import './MobileAppDownloadPopup.css';

function MobileAppDownloadPopup() {
  return null;

  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [showPopup, setShowPopup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if user is on a mobile device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || window.innerWidth <= 768;
    const iosDevice = /iPhone|iPad|iPod/i.test(userAgent);
    setIsIOS(iosDevice);

    // 2. Check if user already dismissed popup in this session
    const isDismissed = safeSessionStorage.getItem('abacus_mobile_app_popup_dismissed');

    if (isMobileDevice && !isDismissed) {
      // Show popup after a small delay for smooth entrance
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Capture PWA beforeinstallprompt event for Android / Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        handleClose();
      }
    } else if (isIOS) {
      setShowIosGuide(true);
    } else {
      // Redirect to mobile app page / store
      window.location.href = '/contact';
    }
  };

  const handleClose = () => {
    setShowPopup(false);
    setShowIosGuide(false);
    safeSessionStorage.setItem('abacus_mobile_app_popup_dismissed', 'true');
  };

  if (!showPopup) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div className="mobile-app-popup-backdrop" onClick={handleClose} />

      {/* Main Download App Popup Card */}
      <div className={`mobile-app-popup-card ${isAr ? 'rtl-mode' : ''}`}>
        <button className="mobile-app-popup-close" onClick={handleClose} aria-label="Close">
          &times;
        </button>

        <div className="mobile-app-popup-header">
          <img src={appIcon} alt="AbacusHeroes App" className="mobile-app-popup-icon" />
          <div className="mobile-app-popup-title-group">
            <h3>{t('mobilePopup.title', isAr ? 'تطبيق AbacusHeroes' : 'AbacusHeroes App')}</h3>
            <p>{t('mobilePopup.tagline', isAr ? 'احترف السوروبان والرياضيات بسهولة!' : 'Master Math on the Go!')}</p>
          </div>
        </div>

        <div className="mobile-app-popup-body">
          <p className="mobile-app-popup-desc">
            {t('mobilePopup.desc', isAr ? 'حمّل التطبيق لتجربة أسرع وأسلس والتدرب على الألعاب دون انقطاع!' : 'Download our mobile app for a faster, smoother experience and offline practice!')}
          </p>

          <div className="mobile-app-popup-actions">
            <button className="mobile-app-popup-install-btn" onClick={handleInstallClick}>
              <i className="fa fa-download" aria-hidden="true" style={{ margin: isAr ? '0 0 0 8px' : '0 8px 0 0' }}></i>
              {deferredPrompt 
                ? t('mobilePopup.installNow', isAr ? 'ثبّت التطبيق الآن' : 'Install App Now')
                : isIOS 
                  ? t('mobilePopup.installIos', isAr ? 'تثبيت على آيفون / آيباد' : 'Install on iPhone / iPad')
                  : t('mobilePopup.getApp', isAr ? 'احصل على تطبيق الهاتف' : 'Get Mobile App')
              }
            </button>
          </div>

          <div className="mobile-app-popup-store-badges">
            <img
              src={googlePlay}
              alt="Google Play"
              className="store-badge"
              onClick={handleInstallClick}
            />
            <img
              src={appStore}
              alt="App Store"
              className="store-badge"
              onClick={() => setShowIosGuide(true)}
            />
          </div>
        </div>

        <div className="mobile-app-popup-footer">
          <button className="mobile-app-popup-dismiss-btn" onClick={handleClose}>
            {t('mobilePopup.continueBrowser', isAr ? 'المتابعة في المتصفح' : 'Continue in Browser')}
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Sheet */}
      {showIosGuide && (
        <div className="ios-install-modal">
          <div className={`ios-install-content ${isAr ? 'rtl-mode' : ''}`}>
            <button className="ios-install-close" onClick={() => setShowIosGuide(false)}>
              &times;
            </button>
            <img src={appIcon} alt="AbacusHeroes" className="ios-install-icon" />
            <h4>{t('mobilePopup.iosHeader', isAr ? 'تثبيت AbacusHeroes على iOS' : 'Install AbacusHeroes on iOS')}</h4>
            <p>{t('mobilePopup.iosSub', isAr ? 'اتبع الخطوات السريعة التالية لإضافة التطبيق إلى الشاشة الرئيسية:' : 'Follow these quick steps to add AbacusHeroes to your Home Screen:')}</p>
            <ol className="ios-install-steps">
              <li>
                {isAr ? (
                  <>اضغط على زر المشاركة <img src={isoIcon} alt="Share" className="ios-share-icon" /> في شريط متصفح Safari.</>
                ) : (
                  <>Tap the Share button <img src={isoIcon} alt="Share" className="ios-share-icon" /> in Safari navigation bar.</>
                )}
              </li>
              <li>
                {isAr ? (
                  <>مرر لأسفل واضغط على <strong>"إضافة إلى الشاشة الرئيسية"</strong> (Add to Home Screen).</>
                ) : (
                  <>Scroll down and tap <strong>"Add to Home Screen"</strong>.</>
                )}
              </li>
              <li>
                {isAr ? (
                  <>اضغط على <strong>"إضافة"</strong> (Add) في الزاوية العلوية.</>
                ) : (
                  <>Tap <strong>"Add"</strong> in the top right corner.</>
                )}
              </li>
            </ol>
            <button className="ios-install-gotit-btn" onClick={() => setShowIosGuide(false)}>
              {t('mobilePopup.gotIt', isAr ? 'حسناً، فهمت!' : 'Got it!')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileAppDownloadPopup;
