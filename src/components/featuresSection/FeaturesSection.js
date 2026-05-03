import React from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Maximize2, FileText, Trophy, BarChart2 } from 'lucide-react';
import './FeaturesSection.css';

function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <h2>{t('featuresSection.title')}</h2>
          <p>{t('featuresSection.subtitle')}</p>
          <div className="line"></div>
        </div>

        {/* Section A: Teachers Assign Homework */}
        <div className="feature-block">
          <div className="feature-content-with-image">
            <div className="feature-content">
              <div className="feature-icon-large pink-icon">
                <FileText size={48} strokeWidth={2} />
              </div>
              <h3 className="text-3d-glow">{t('featuresSection.teacherHomeworkTitle')}</h3>
              <p>{t('featuresSection.teacherHomeworkDesc')}</p>
            </div>
            <div className="feature-image-preview">
              <img src={require('../../img/reel-question.png')} alt="Reel Question Preview" className="feature-preview-img-premium" />
            </div>
          </div>
        </div>

        {/* Section B: Grid of Icons */}
        <div className="features-grid-header">
          <h3>{t('featuresSection.toolsTitle')}</h3>
        </div>
        <div className="features-grid">
          {/* Add All to Pocket */}
          <div className="feature-item">
            <div className="icon-3d-wrapper icon-pocket-all">
              <i className="fa fa-plus-square-o" style={{color: '#fff', fontSize: '22px'}}></i>
            </div>
            <div className="feature-item-text">
              <h4>{t('featuresSection.iconAddAllPocketTitle')}</h4>
              <p>{t('featuresSection.iconAddAllPocketDesc')}</p>
            </div>
          </div>

          {/* Add to Pocket */}
          <div className="feature-item">
            <div className="icon-3d-wrapper icon-pocket">
              <i className="fa fa-plus" style={{color: '#fff', fontSize: '20px'}}></i>
            </div>
            <div className="feature-item-text">
              <h4>{t('featuresSection.iconAddPocketTitle')}</h4>
              <p>{t('featuresSection.iconAddPocketDesc')}</p>
            </div>
          </div>

          {/* Virtual Abacus */}
          <div className="feature-item">
            <div className="icon-3d-wrapper icon-abacus">
              <i className="fa fa-calculator" style={{color: '#fff', fontSize: '18px'}}></i>
            </div>
            <div className="feature-item-text">
              <h4>{t('featuresSection.iconAbacusTitle')}</h4>
              <p>{t('featuresSection.iconAbacusDesc')}</p>
            </div>
          </div>

          {/* Printer */}
          <div className="feature-item">
            <div className="icon-3d-wrapper icon-printer">
              <Printer size={24} color="#fff" />
            </div>
            <div className="feature-item-text">
              <h4>{t('featuresSection.iconPrinterTitle')}</h4>
              <p>{t('featuresSection.iconPrinterDesc')}</p>
            </div>
          </div>

          {/* Fullscreen */}
          <div className="feature-item">
            <div className="icon-3d-wrapper icon-fullscreen">
              <Maximize2 size={20} color="#fff" />
            </div>
            <div className="feature-item-text">
              <h4>{t('featuresSection.iconFullscreenTitle')}</h4>
              <p>{t('featuresSection.iconFullscreenDesc')}</p>
            </div>
          </div>

          {/* Flash Mode */}
          <div className="feature-item">
            <div className="icon-3d-wrapper icon-flash">
              <i className="fa fa-bolt" style={{color: '#fff', fontSize: '20px'}}></i>
            </div>
            <div className="feature-item-text">
              <h4>{t('featuresSection.iconFlashTitle')}</h4>
              <p>{t('featuresSection.iconFlashDesc')}</p>
            </div>
          </div>
        </div>

        {/* Section C: Reports */}
        <div className="feature-block">
          <div className="feature-icon-large purple-icon">
            <BarChart2 size={48} strokeWidth={2} />
          </div>
          <div className="feature-content">
            <h3 className="text-3d-glow">{t('featuresSection.reportsTitle')}</h3>
            <p>{t('featuresSection.reportsDesc')}</p>
          </div>
        </div>

        {/* Section D: Competitions and Games */}
        <div className="feature-block">
          <div className="feature-icon-large gold-icon">
            <Trophy size={48} strokeWidth={2} />
          </div>
          <div className="feature-content">
            <h3 className="text-3d-glow">{t('featuresSection.competitionsTitle')}</h3>
            <p>{t('featuresSection.competitionsDesc')}</p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default FeaturesSection;
