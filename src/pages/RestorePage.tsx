import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { PrimaryButton } from '../components/ui';
import { SimpleAlert } from '../components/AlertCard';
import { UploadIcon } from '../components/Icons';
import { t } from '@/services/locale';

interface RestorePageProps {
  onConnect: (mnemonic: string) => Promise<void>;
  onBack: () => void;
  onClearError: () => void;
  isLoading?: boolean;
}

const RestorePage: React.FC<RestorePageProps> = ({
  onConnect,
  onBack,
  onClearError,
  isLoading = false,
}) => {
  const [mnemonic, setMnemonic] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const cleaned = mnemonic.trim().replace(/\s+/g, ' ');
    const wordCount = cleaned.split(' ').length;

    if (wordCount !== 12 && wordCount !== 24) {
      setError(t('restore.invalidPhrase'));
      return;
    }

    setError(null);
    try {
      await onConnect(cleaned);
    } catch {
      setError(t('restore.apiError'));
    }
  };

  const footer = (
    <div className="max-w-xl mx-auto">
      <PrimaryButton
        onClick={handleSubmit}
        disabled={!mnemonic.trim() || isLoading}
        className="w-full"
        data-testid="restore-confirm-button"
      >
        {isLoading ? t('restore.restoring') : t('restore.restoreWallet')}
      </PrimaryButton>
    </div>
  );

  return (
    <PageLayout footer={footer} onBack={onBack} title={t('restore.title')} onClearError={onClearError}>
       <div className="max-w-xl mx-auto w-full space-y-4">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-spark-primary/20 flex items-center justify-center">
            <UploadIcon size="xl" className="text-spark-primary" />
          </div>
        </div>

        <p className="text-spark-text-secondary text-center mb-6">
          {t('restore.instruction')}
        </p>

        <div className="relative">
          <textarea
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            className="w-full h-36 px-4 py-3 text-spark-text-primary bg-spark-dark border border-spark-border rounded-xl focus:border-spark-primary focus:ring-2 focus:ring-spark-primary/20 resize-none font-mono text-sm"
            placeholder={t('restore.placeholder')}
            data-testid="mnemonic-input"
          />
        </div>

        {error && (
          <SimpleAlert variant="error" className="mt-4">
            {error}
          </SimpleAlert>
        )}

        <div className="flex-1" />
      </div>
    </PageLayout>
  );
};

export default RestorePage;
