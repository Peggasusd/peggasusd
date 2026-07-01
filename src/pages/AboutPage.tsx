import React from 'react';
import SlideInPage from '../components/layout/SlideInPage';
import GlowLogo from '../components/GlowLogo';
import { t } from '@/services/locale';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <SlideInPage title={t('about.title')} onClose={onBack}>
      <div className="p-6 space-y-8">
        {/* Logo & Name */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <GlowLogo sizePx={80} />
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-spark-text-primary">{t('appName')}</h2>
            <p className="text-sm text-spark-text-muted mt-1">{t('about.version')} 1.0.0</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-sm text-spark-text-secondary leading-relaxed">
            {t('about.description')}
          </p>

          <div className="bg-spark-surface/50 border border-spark-border rounded-xl p-4">
            <p className="text-xs text-spark-text-muted leading-relaxed">
              {t('about.forkInfo')}
            </p>
          </div>
        </div>

        {/* Technology */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-spark-text-primary text-sm uppercase tracking-wider">{t('about.technology')}</h3>
          <p className="text-sm text-spark-text-secondary leading-relaxed">
            {t('about.technologyDesc')}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-spark-text-primary text-sm uppercase tracking-wider">{t('about.features')}</h3>
          <p className="text-sm text-spark-text-secondary leading-relaxed whitespace-pre-line">
            {t('about.featuresList')}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-spark-warning/10 border border-spark-warning/20 rounded-xl p-4">
          <p className="text-xs text-spark-warning leading-relaxed">
            {t('about.disclaimer')}
          </p>
        </div>

        {/* Credits */}
        <div className="text-center pb-4">
          <p className="text-xs text-spark-text-muted">
            {t('poweredBy')}
          </p>
        </div>
      </div>
    </SlideInPage>
  );
};

export default AboutPage;
