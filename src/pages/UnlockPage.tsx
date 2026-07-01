/**
 * UnlockPage — interactive retry screen shown when the auto-triggered
 * biometric unlock was cancelled or hit the biometric lockout error.
 *
 * The cold-launch "authenticating now, please wait" surface is a
 * separate component (`UnlockingPage`) so that this page stays purely
 * interactive and the placeholder stays purely decorative.
 *
 * Presents a primary "Unlock with <biometry>" action and a secondary
 * "Use a different wallet" escape that clears the stored seed and
 * routes back to welcome.
 *
 * Layout mirrors `feat/password-encrypted-seed-storage`'s UnlockPage so
 * that when both native secure storage and the password vault coexist
 * on the same codebase, they share a visual language.
 */

import React, { useEffect, useState } from 'react';
import { PrimaryButton, SecondaryButton } from '../components/ui';
import { FingerprintIcon, PasskeyIcon } from '../components/Icons';
import { AlertCard } from '../components/AlertCard';
import { getBiometryLabel, secureStorage } from '../services/secureStorage';
import { t } from '@/services/locale';

interface UnlockPageProps {
  isLoading: boolean;
  error: string | null;
  onUnlock: () => Promise<void>;
  onAbandon: () => Promise<void>;
}

const UnlockPage: React.FC<UnlockPageProps> = ({
  isLoading,
  error,
  onUnlock,
  onAbandon,
}) => {
  // Web hosts use passkey terminology; native uses biometric.
  const isWebPasskey = !secureStorage.isSupported();

  const [biometryLabel, setBiometryLabel] = useState<string | null>(null);

  useEffect(() => {
    if (isWebPasskey) return;
    let cancelled = false;
    getBiometryLabel().then((label) => {
      if (!cancelled) setBiometryLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, [isWebPasskey]);

  const unlockLabel = isWebPasskey
    ? t('unlock.unlockPasskey')
    : biometryLabel ? `Unlock with ${biometryLabel}` : t('unlock.unlockBiometric');
  const unlockDescription = isWebPasskey
    ? t('unlock.lockedPasskey')
    : t('unlock.lockedBiometric');
  const UnlockIcon = isWebPasskey ? PasskeyIcon : FingerprintIcon;

  return (
    <div className="min-h-dvh h-dvh w-full flex flex-col bg-spark-surface relative">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-8">
          {/* Logo + headline */}
          <div className="flex flex-col items-center gap-4">
            <img
              src="/assets/Glow_Logo.svg"
              alt="PEGGASUSD"
              className="w-36 h-36"
            />
            <h1 className="font-display text-2xl font-bold text-spark-text-primary">
              {t('unlock.welcomeBack')}
            </h1>
            <p className="text-sm text-spark-text-secondary text-center">
              {unlockDescription}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <AlertCard variant="error" title={t('unlock.failed')}>
              {error}
            </AlertCard>
          )}

          <div className="space-y-3">
            <PrimaryButton
              onClick={onUnlock}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              <UnlockIcon size="md" />
              {unlockLabel}
            </PrimaryButton>

            <SecondaryButton
              onClick={onAbandon}
              disabled={isLoading}
              className="w-full"
            >
              {t('unlock.useDifferentWallet')}
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockPage;
