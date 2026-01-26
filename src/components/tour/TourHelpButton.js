import React from 'react';
import { useTranslation } from 'react-i18next';
import soundEffects from '../../utils/soundEffects';
import './Tour.css';

/**
 * Floating Help Button to restart tour
 * @param {Function} onClick - Callback when button is clicked
 */
function TourHelpButton({ onClick }) {
  const { t } = useTranslation();

  const handleClick = () => {
    soundEffects.playClick();
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      className="tour-help-button"
      onClick={handleClick}
      title={t('tour.startTour')}
      aria-label={t('tour.startTour')}
    >
      <i className="fa fa-question" aria-hidden="true"></i>
    </button>
  );
}

export default TourHelpButton;
