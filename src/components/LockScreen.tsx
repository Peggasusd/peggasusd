import React, { useState, useEffect } from 'react';
import { FingerprintIcon, LockIcon, BackIcon } from './Icons';
import { getBiometryLabel } from '@/services/secureStorage';
import { t } from '@/services/locale';
import type { LockType } from '@/hooks/useLock';

interface LockScreenProps {
  lockType: LockType;
  onUnlockBiometric: () => Promise<boolean>;
  onUnlockPin: (pin: string) => Promise<boolean>;
  onDisableLock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({
  lockType,
  onUnlockBiometric,
  onUnlockPin,
  onDisableLock,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState<string | null>(null);

  useEffect(() => {
    getBiometryLabel().then(setBiometryLabel).catch(() => {});
  }, []);

  const handleBiometricTap = async () => {
    setIsLoading(true);
    setError(null);
    const ok = await onUnlockBiometric();
    if (!ok) {
      setError(t('lock.tryAgain') || 'Authentication failed. Try again.');
    }
    setIsLoading(false);
  };

  const handlePinDigit = (d: string) => {
    if (pin.length >= 6) return;
    setError(null);
    const next = pin + d;
    setPin(next);
    if (next.length === 6) {
      verifyPin(next);
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError(null);
  };

  const verifyPin = async (value: string) => {
    setIsLoading(true);
    const ok = await onUnlockPin(value);
    if (!ok) {
      setError(t('lock.incorrectPin') || 'Incorrect PIN');
      setPin('');
    }
    setIsLoading(false);
  };

  if (lockType === 'biometric') {
    return (
      <div className="fixed inset-0 z-[100] bg-spark-void flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full">
          <div className="w-20 h-20 rounded-2xl bg-spark-primary/20 flex items-center justify-center">
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-spark-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <FingerprintIcon size="xl" className="text-spark-primary" />
            )}
          </div>
          <h2 className="font-display text-xl font-semibold text-spark-text-primary text-center">
            {t('lock.title')}
          </h2>
          <button
            onClick={handleBiometricTap}
            disabled={isLoading}
            className="w-full py-3 px-6 bg-spark-primary text-white font-display font-semibold rounded-xl hover:bg-spark-primary-light transition-colors disabled:opacity-50"
          >
            {isLoading ? t('unlock.unlocking') : `${t('lock.unlockWith')} ${biometryLabel ?? t('lock.biometric')}`}
          </button>
          {error && (
            <p className="text-sm text-spark-error text-center">{error}</p>
          )}
          <button
            onClick={onDisableLock}
            className="text-sm text-spark-text-muted hover:text-spark-text-primary transition-colors underline"
          >
            {t('lock.disableLock')}
          </button>
        </div>
      </div>
    );
  }

  // PIN mode
  const pinDots = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      className={`w-3 h-3 rounded-full transition-all ${
        i < pin.length ? 'bg-spark-primary scale-110' : 'bg-spark-border'
      }`}
    />
  ));

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-spark-void flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        <div className="w-20 h-20 rounded-2xl bg-spark-primary/20 flex items-center justify-center">
          <LockIcon size="xl" className="text-spark-primary" />
        </div>

        <h2 className="font-display text-xl font-semibold text-spark-text-primary text-center">
          {t('lock.title')}
        </h2>

        <div className="flex items-center gap-3">
          {pinDots}
        </div>

        {error && (
          <p className="text-sm text-spark-error text-center -mt-4">{error}</p>
        )}

        <div className="w-full max-w-[260px]">
          {keypadRows.map((row, ri) => (
            <div key={ri} className="flex gap-3 mb-3">
              {row.map(d => (
                <button
                  key={d}
                  onClick={() => handlePinDigit(d)}
                  disabled={pin.length >= 6 || isLoading}
                  className="flex-1 aspect-square rounded-2xl bg-spark-dark border border-spark-border text-spark-text-primary text-2xl font-display font-semibold hover:bg-white/5 transition-colors disabled:opacity-30"
                >
                  {d}
                </button>
              ))}
            </div>
          ))}
          <div className="flex gap-3">
            <div className="flex-1" />
            <button
              onClick={() => handlePinDigit('0')}
              disabled={pin.length >= 6 || isLoading}
              className="flex-1 aspect-square rounded-2xl bg-spark-dark border border-spark-border text-spark-text-primary text-2xl font-display font-semibold hover:bg-white/5 transition-colors disabled:opacity-30"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={pin.length === 0 || isLoading}
              className="flex-1 aspect-square rounded-2xl bg-spark-dark border border-spark-border flex items-center justify-center hover:bg-white/5 transition-colors disabled:opacity-30"
            >
              <BackIcon size="md" className="text-spark-text-primary" />
            </button>
          </div>
        </div>

        <button
          onClick={onDisableLock}
          className="text-sm text-spark-text-muted hover:text-spark-text-primary transition-colors underline"
        >
          {t('lock.disableLock')}
        </button>
      </div>
    </div>
  );
};

export default LockScreen;
