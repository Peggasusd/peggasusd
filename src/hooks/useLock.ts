import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const LOCK_ENABLED_KEY = 'appLockEnabled';
const PIN_HASH_KEY = 'appPinHash';

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
  enableLock: (pin: string) => Promise<boolean>;
  disableLock: () => Promise<void>;
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

  const enableLock = useCallback(async (pin: string) => {
    if (!pin || pin.length !== 6) return false;
    localStorage.setItem(PIN_HASH_KEY, await hashPin(pin));
    localStorage.setItem(LOCK_ENABLED_KEY, 'true');
    setLockEnabledState(true);
    return true;
  }, []);

  const disableLock = useCallback(async () => {
    localStorage.removeItem(LOCK_ENABLED_KEY);
    localStorage.removeItem(PIN_HASH_KEY);
    setLockEnabledState(false);
    setIsUnlocked(true);
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
    enableLock,
    disableLock,
    authenticatePin,
    changePin,
  };
}
