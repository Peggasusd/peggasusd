import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { secureStorage } from '@/services/secureStorage';
import { logger, LogCategory } from '@/services/logger';

const LOCK_ENABLED_KEY = 'appLockEnabled';
const LOCK_TYPE_KEY = 'appLockType';
const PIN_HASH_KEY = 'appPinHash';
const BIOMETRIC_DUMMY_MNEMONIC = '__peggasusd_lock__';

export type LockType = 'biometric' | 'pin';

function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(pin)).then(hash => {
    const bytes = Array.from(new Uint8Array(hash));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

export type LockActions = {
  isUnlocked: boolean;
  lockEnabled: boolean;
  lockType: LockType;
  enableLock: (type: LockType, pin?: string) => Promise<boolean>;
  disableLock: () => Promise<void>;
  authenticateBiometric: () => Promise<boolean>;
  authenticatePin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
};

export function useLock(): LockActions {
  const [isUnlocked, setIsUnlocked] = useState(() =>
    localStorage.getItem(LOCK_ENABLED_KEY) !== 'true',
  );
  const [lockEnabled, setLockEnabledState] = useState(() =>
    localStorage.getItem(LOCK_ENABLED_KEY) === 'true',
  );
  const [lockType, setLockTypeState] = useState<LockType>(() =>
    (localStorage.getItem(LOCK_TYPE_KEY) as LockType) || 'biometric',
  );

  const lockEnabledRef = useRef(lockEnabled);
  useEffect(() => {
    lockEnabledRef.current = lockEnabled;
  }, [lockEnabled]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !lockEnabled) return;

    let removeListener: (() => void) | undefined;

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && lockEnabledRef.current) {
        setIsUnlocked(false);
      }
    }).then(h => { removeListener = h.remove; });

    return () => { removeListener?.(); };
  }, [lockEnabled]);

  const enableLock = useCallback(async (type: LockType, pin?: string) => {
    if (type === 'biometric') {
      if (!secureStorage.isSupported()) return false;
      try {
        await secureStorage.storeSeed({ type: 'mnemonic', mnemonic: BIOMETRIC_DUMMY_MNEMONIC });
      } catch {
        logger.error(LogCategory.AUTH, 'Failed to store biometric lock token');
        return false;
      }
    } else if (type === 'pin') {
      if (!pin || pin.length !== 6) return false;
      localStorage.setItem(PIN_HASH_KEY, await hashPin(pin));
    }

    localStorage.setItem(LOCK_ENABLED_KEY, 'true');
    localStorage.setItem(LOCK_TYPE_KEY, type);
    setLockEnabledState(true);
    setLockTypeState(type);
    return true;
  }, []);

  const disableLock = useCallback(async () => {
    localStorage.removeItem(LOCK_ENABLED_KEY);
    localStorage.removeItem(LOCK_TYPE_KEY);
    localStorage.removeItem(PIN_HASH_KEY);
    if (secureStorage.isSupported()) {
      try { await secureStorage.clearSeed(); } catch { /* non-fatal */ }
    }
    setLockEnabledState(false);
    setIsUnlocked(true);
  }, []);

  const authenticateBiometric = useCallback(async () => {
    if (!secureStorage.isSupported()) return false;
    try {
      await secureStorage.retrieveSeed();
      setIsUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const authenticatePin = useCallback(async (pin: string) => {
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    if (!storedHash) return false;
    const ok = await hashPin(pin) === storedHash;
    if (ok) setIsUnlocked(true);
    return ok;
  }, []);

  const changePin = useCallback(async (oldPin: string, newPin: string) => {
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    if (!storedHash) return false;
    const oldHash = await hashPin(oldPin);
    if (oldHash !== storedHash) return false;
    localStorage.setItem(PIN_HASH_KEY, await hashPin(newPin));
    return true;
  }, []);

  return {
    isUnlocked,
    lockEnabled,
    lockType,
    enableLock,
    disableLock,
    authenticateBiometric,
    authenticatePin,
    changePin,
  };
}
