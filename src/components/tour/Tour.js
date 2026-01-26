import React, { useState, useEffect } from 'react';
import { Steps } from 'intro.js-react';
import { useTranslation } from 'react-i18next';
import 'intro.js/introjs.css';
import './Tour.css';

/**
 * Reusable Tour Component
 * @param {Array} steps - Array of tour steps with element selector and content key
 * @param {Boolean} enabled - Whether to show the tour
 * @param {Function} onExit - Callback when tour is completed or skipped
 * @param {String} tourType - 'teacher' or 'student'
 */
function Tour({ steps, enabled, onExit, tourType }) {
  const { t, i18n } = useTranslation();
  const [stepsWithTranslation, setStepsWithTranslation] = useState([]);

  useEffect(() => {
    // Transform steps with translations
    const translatedSteps = steps.map(step => ({
      element: step.element,
      intro: t(step.intro),
      position: step.position || 'bottom',
      tooltipClass: step.tooltipClass || '',
      highlightClass: step.highlightClass || ''
    }));
    setStepsWithTranslation(translatedSteps);
  }, [steps, t]);

  const options = {
    showProgress: true,
    showBullets: true,
    exitOnOverlayClick: false,
    exitOnEsc: true,
    nextLabel: t('tour.next'),
    prevLabel: t('tour.previous'),
    skipLabel: t('tour.skip'),
    doneLabel: t('tour.done'),
    overlayOpacity: 0.7,
    scrollToElement: true,
    scrollPadding: 30,
    disableInteraction: true,
    helperElementPadding: 10,
    // RTL support for Arabic
    rtl: i18n.language === 'ar'
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };

  return (
    <Steps
      enabled={enabled}
      steps={stepsWithTranslation}
      initialStep={0}
      onExit={handleExit}
      options={options}
    />
  );
}

export default Tour;
