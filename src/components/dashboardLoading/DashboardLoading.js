import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../reusable.css';
import './DashboardLoading.css';

function DashboardLoading() {
  const { t } = useTranslation();

  return (
    <div className="global-colorful-loader">
      <div className="loader-card-content">
        <div className="hero-avatar-ring">
          <span className="hero-emoji">🧮</span>
        </div>

        <div className="bouncing-beads-row">
          <span className="bead bead-purple"></span>
          <span className="bead bead-blue"></span>
          <span className="bead bead-green"></span>
          <span className="bead bead-pink"></span>
          <span className="bead bead-yellow"></span>
        </div>

        <p className="loading-text-label">
          {t('loading', 'جاري التحميل...')}
        </p>
      </div>
    </div>
  );
}

export default DashboardLoading;