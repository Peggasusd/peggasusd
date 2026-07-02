import React, { useEffect, useState } from 'react';
import { FormGroup, FormInput, LoadingSpinner, PrimaryButton, Switch } from '../components/ui';
import { getSettings, saveSettings, UserSettings } from '../services/settings';
import type { Config, Network } from '@breeztech/breez-sdk-spark';
import { useWallet } from '@/contexts/WalletContext';
import { CurrencyIcon, ChevronRightIcon, DownloadIcon, ShieldCheckIcon, LockIcon, BackIcon } from '../components/Icons';
import SlideInPage from '../components/layout/SlideInPage';
import { logger, LogCategory } from '@/services/logger';
import { shareOrDownloadLogs, exportDatabaseState } from '@/services/logExport';
import { useSecretTap } from '@/hooks/useSecretTap';
import { t } from '../services/locale';
import { useLock } from '@/hooks/useLock';

const DEV_MODE_STORAGE_KEY = 'spark-dev-mode';

interface SettingsPageProps {
  onBack: () => void;
  config: Config | null;
  onOpenFiatCurrencies: () => void;
  onOpenPasskeySettings: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  config,
  onOpenFiatCurrencies,
  onOpenPasskeySettings,
}) => {
  const wallet = useWallet();
  const {
    handleTap: devTap,
    activated: isDevMode,
    tapCount: devTapCount,
    threshold: devTapThreshold,
  } = useSecretTap(5, 2000, () =>
    new URLSearchParams(window.location.search).get('dev') === 'true'
    || localStorage.getItem(DEV_MODE_STORAGE_KEY) === 'true'
  );
  // Network and persisted settings only change via handlers that
  // reload the page, so reading once at mount is sufficient.
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(
    () => (new URLSearchParams(window.location.search).get('network') || 'mainnet') as Network,
  );

  const [feeType, setFeeType] = useState<'fixed' | 'rate' | 'networkRecommended'>(() => {
    const s = getSettings();
    return s.depositMaxFee.type;
  });
  const [feeValue, setFeeValue] = useState<string>(() => {
    const s = getSettings();
    if (s.depositMaxFee.type === 'fixed') return String(s.depositMaxFee.amount);
    if (s.depositMaxFee.type === 'rate') return String(s.depositMaxFee.satPerVbyte);
    return String(s.depositMaxFee.leewaySatPerVbyte);
  });

  // SettingsPage only mounts after wallet connect, so `config` is
  // effectively stable for this lifetime; capture once via lazy init.
  const [syncIntervalSecs, setSyncIntervalSecs] = useState<string>(() => {
    const s = getSettings();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK config type doesn't expose all fields
    const cfg: any = config ?? {};
    if (typeof s.syncIntervalSecs === 'number') return String(s.syncIntervalSecs);
    if (typeof cfg.syncIntervalSecs === 'number') return String(cfg.syncIntervalSecs);
    return '';
  });
  const [lnurlDomain, setLnurlDomain] = useState<string>(() => {
    const s = getSettings();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK config type doesn't expose all fields
    const cfg: any = config ?? {};
    if (typeof s.lnurlDomain === 'string') return s.lnurlDomain;
    if (typeof cfg.lnurlDomain === 'string') return cfg.lnurlDomain;
    return '';
  });
  const [preferSparkOverLightning, setPreferSparkOverLightning] = useState<boolean>(() => {
    const s = getSettings();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK config type doesn't expose all fields
    const cfg: any = config ?? {};
    if (typeof s.preferSparkOverLightning === 'boolean') return s.preferSparkOverLightning;
    if (typeof cfg.preferSparkOverLightning === 'boolean') return cfg.preferSparkOverLightning;
    return false;
  });
  const [crossChainEnabled, setCrossChainEnabled] = useState<boolean>(
    () => getSettings().crossChainEnabled === true,
  );

  const [sparkPrivateModeEnabled, setSparkPrivateModeEnabled] = useState<boolean>(true);
  const [isLoadingUserSettings, setIsLoadingUserSettings] = useState<boolean>(true);

  const [isDownloadingLogs, setIsDownloadingLogs] = useState<boolean>(false);
  const [isExportingDb, setIsExportingDb] = useState<boolean>(false);

  const lock = useLock();

  // PIN setup wizard: step, current input, saved PIN for confirmation
  const [pinWizStep, setPinWizStep] = useState<'idle' | 'enter' | 'confirm'>('idle');
  const [pinInput, setPinInput] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [pinWizError, setPinWizError] = useState<string | null>(null);

  // Change PIN wizard
  const [changingPin, setChangingPin] = useState(false);
  const [changePinStep, setChangePinStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [oldPinValue, setOldPinValue] = useState('');
  const [newPinValue, setNewPinValue] = useState('');
  const [savedNewPin, setSavedNewPin] = useState<string | null>(null);
  const [changePinError, setChangePinError] = useState<string | null>(null);

  // Async SDK read for sparkPrivateModeEnabled. Stays in an effect
  // because it awaits a Promise; setState happens post-await.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const us = await wallet.getUserSettings();
        if (cancelled) return;
        setSparkPrivateModeEnabled(us.sparkPrivateModeEnabled !== false);
      } catch (e) {
        logger.warn(LogCategory.SDK, 'Failed to load user settings from SDK', {
          error: e instanceof Error ? e.message : String(e),
        });
      } finally {
        if (!cancelled) setIsLoadingUserSettings(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  // Persist dev mode to localStorage when toggled via secret tap
  useEffect(() => {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, String(isDevMode));
  }, [isDevMode]);

  const handleNetworkChange = (network: Network) => {
    setSelectedNetwork(network);
    // Update URL and reload to reconnect with new network
    const url = new URL(window.location.href);
    url.searchParams.set('network', network);
    if (isDevMode) {
      url.searchParams.set('dev', 'true');
    }
    window.location.assign(url.toString());
  };

  const handleSave = async () => {
    const n = Number(feeValue);
    if (isDevMode) {
      const updated: UserSettings = {
        ...(feeType === 'fixed'
          ? { depositMaxFee: { type: 'fixed', amount: Math.floor(n) } }
          : feeType === 'rate'
            ? { depositMaxFee: { type: 'rate', satPerVbyte: n } }
            : { depositMaxFee: { type: 'networkRecommended', leewaySatPerVbyte: Math.max(0, Math.floor(n)) } }
        ),
        syncIntervalSecs: syncIntervalSecs !== '' ? Math.max(0, Math.floor(Number(syncIntervalSecs))) : undefined,
        lnurlDomain: lnurlDomain !== '' ? lnurlDomain : undefined,
        preferSparkOverLightning,
        crossChainEnabled,
      };
      saveSettings(updated);
    }
    try {
      await wallet.updateUserSettings({ sparkPrivateModeEnabled });
    } catch (e) {
      logger.warn(LogCategory.SDK, 'Failed to update SDK user settings', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
    window.location.reload();
  };

  const handleExportDb = async () => {
    setIsExportingDb(true);
    try {
      const info = await wallet.getInfo({});
      await exportDatabaseState(info.identityPubkey, config?.network ?? 'mainnet');
    } catch (e) {
      logger.warn(LogCategory.SDK, 'Failed to export database state', {
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsExportingDb(false);
    }
  };

  const handleShareLogs = async () => {
    setIsDownloadingLogs(true);
    try {
      await shareOrDownloadLogs();
    } catch (e) {
      logger.warn(LogCategory.SDK, 'Failed to share or download logs', {
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsDownloadingLogs(false);
    }
  };

  // ---------- PIN wizard handlers ----------

  const pinWizDigit = (d: string) => {
    if (pinInput.length >= 6) return;
    setPinWizError(null);
    const next = pinInput + d;
    setPinInput(next);
    if (next.length === 6) {
      if (pinWizStep === 'enter') {
        setSavedPin(next);
        setPinInput('');
        setPinWizStep('confirm');
      } else {
        // confirm step: compare
        if (next === savedPin) {
          lock.enableLock(next);
          resetPinWiz();
        } else {
          setPinWizError(t('lock.pinMismatch'));
          setPinInput('');
          setSavedPin(null);
          setPinWizStep('enter');
        }
      }
    }
  };

  const pinWizDelete = () => {
    setPinInput(p => p.slice(0, -1));
    setPinWizError(null);
  };

  const pinWizCancel = () => {
    lock.disableLock();
    resetPinWiz();
  };

  const resetPinWiz = () => {
    setPinWizStep('idle');
    setPinInput('');
    setSavedPin(null);
    setPinWizError(null);
  };

  // ---------- Toggle handlers ----------

  const handleTogglePin = () => {
    if (lock.lockEnabled) {
      lock.disableLock();
    } else {
      setPinWizStep('enter');
      setPinInput('');
      setSavedPin(null);
    }
  };

  // ---------- Change PIN ----------

  const changePinDigit = (d: string) => {
    if (!changingPin) return;
    if (changePinStep === 'old' && oldPinValue.length < 6) {
      const next = oldPinValue + d;
      setOldPinValue(next);
      if (next.length === 6) {
        setChangePinError(null);
        setChangePinStep('new');
      }
    } else if (changePinStep === 'new' && newPinValue.length < 6) {
      const next = newPinValue + d;
      setNewPinValue(next);
      if (next.length === 6) {
        setSavedNewPin(next);
        setNewPinValue('');
        setChangePinStep('confirm');
      }
    } else if (changePinStep === 'confirm' && newPinValue.length < 6) {
      const next = newPinValue + d;
      setNewPinValue(next);
      if (next.length === 6) {
        if (next === savedNewPin) {
          handleDoChangePin(oldPinValue, savedNewPin);
        } else {
          setChangePinError(t('lock.pinMismatch'));
          setNewPinValue('');
          setSavedNewPin(null);
          setChangePinStep('new');
        }
      }
    }
  };

  const changePinDelete = () => {
    if (newPinValue.length > 0) {
      setNewPinValue(p => p.slice(0, -1));
    } else if (changePinStep === 'confirm' && savedNewPin) {
      setChangePinStep('new');
      setNewPinValue(savedNewPin);
      setSavedNewPin(null);
    } else if (changePinStep === 'new') {
      setOldPinValue('');
      setChangePinStep('old');
    } else if (oldPinValue.length > 0) {
      setOldPinValue(p => p.slice(0, -1));
    }
  };

  const handleDoChangePin = async (oldPin: string, newPin: string) => {
    if (oldPin.length !== 6 || newPin.length !== 6) return;
    const ok = await lock.changePin(oldPin, newPin);
    if (ok) {
      resetChangePin();
    } else {
      setChangePinError(t('lock.incorrectPin'));
      resetChangePin();
    }
  };

  const resetChangePin = () => {
    setChangingPin(false);
    setChangePinStep('old');
    setOldPinValue('');
    setNewPinValue('');
    setSavedNewPin(null);
    setChangePinError(null);
  };

  const cancelChangePin = () => {
    resetChangePin();
  };

  // ---------- Shared mini keypad render ----------

  const renderKeypad = (onDigit: (d: string) => void, onDelete: () => void) => (
    <div className="w-full max-w-[220px]">
      {[['1','2','3'],['4','5','6'],['7','8','9']].map((row, ri) => (
        <div key={ri} className="flex gap-2 mb-2">
          {row.map(d => (
            <button
              key={d}
              onMouseDown={() => onDigit(d)}
              className="flex-1 aspect-square rounded-xl bg-spark-surface text-spark-text-primary text-xl font-semibold hover:bg-white/10 active:scale-95 transition-colors"
            >
              {d}
            </button>
          ))}
        </div>
      ))}
      <div className="flex gap-2">
        <div className="flex-1" />
        <button
          onMouseDown={() => onDigit('0')}
          className="flex-1 aspect-square rounded-xl bg-spark-surface text-spark-text-primary text-xl font-semibold hover:bg-white/10 active:scale-95 transition-colors"
        >
          0
        </button>
        <button
          onMouseDown={onDelete}
          className="flex-1 aspect-square rounded-xl bg-spark-surface flex items-center justify-center hover:bg-white/10 active:scale-95 transition-colors"
        >
          <BackIcon size="sm" className="text-spark-text-primary" />
        </button>
      </div>
    </div>
  );

  const footer = isDevMode ? (
    <PrimaryButton className="w-full" onClick={handleSave}>
      {t('settings.saveChanges')}
    </PrimaryButton>
  ) : undefined;

  return (
    <SlideInPage title={t('settings.title')} onClose={onBack} slideFrom="left" footer={footer}>
      <div className="p-4">
        <div className="max-w-xl mx-auto w-full space-y-4">
          {/* Order: page nav, exports, reconnect, toggles, inputs.
              The "Save Changes" footer applies the toggles + inputs;
              everything above it commits on tap. */}

          {/* Display */}
          <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
            <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('settings.display')}</h3>
            <div className="space-y-2">
              <button
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium border border-spark-border rounded-xl text-spark-text-secondary hover:text-spark-text-primary hover:bg-white/5 transition-colors"
                type="button"
                onClick={onOpenFiatCurrencies}
              >
                <div className="flex items-center gap-3">
                  <CurrencyIcon size="md" />
                  <span>{t('settings.fiatCurrencies')}</span>
                </div>
                <ChevronRightIcon size="md" />
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
            <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('lock.settingTitle')}</h3>
            <p className="text-sm text-spark-text-muted mb-4">{t('lock.settingDesc')}</p>

            {pinWizStep !== 'idle' ? (
              /* --- PIN setup wizard --- */
              <div className="flex flex-col items-center gap-4 py-4">
                <LockIcon size="lg" className="text-spark-primary" />
                <p className="text-sm font-medium text-spark-text-primary">
                  {pinWizStep === 'enter' ? t('lock.enterPin') : t('lock.confirmPin')}
                </p>
                <div className="flex items-center gap-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i < pinInput.length ? 'bg-spark-primary scale-110' : 'bg-spark-border'
                      }`}
                    />
                  ))}
                </div>
                {pinWizError && (
                  <p className="text-sm text-spark-error text-center">{pinWizError}</p>
                )}
                {renderKeypad(pinWizDigit, pinWizDelete)}
                <button
                  onClick={pinWizCancel}
                  className="text-sm text-spark-text-muted hover:text-spark-text-primary underline transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            ) : changingPin ? (
              /* --- Change PIN wizard --- */
              <div className="flex flex-col items-center gap-4 py-4">
                <LockIcon size="lg" className="text-spark-primary" />
                <p className="text-sm font-medium text-spark-text-primary">
                  {changePinStep === 'old' ? t('lock.currentPin') : changePinStep === 'new' ? t('lock.newPin') : t('lock.confirmPin')}
                </p>
                <div className="flex items-center gap-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i < (changePinStep === 'old' ? oldPinValue : newPinValue).length
                          ? 'bg-spark-primary scale-110'
                          : 'bg-spark-border'
                      }`}
                    />
                  ))}
                </div>
                {changePinError && (
                  <p className="text-sm text-spark-error text-center">{changePinError}</p>
                )}
                {renderKeypad(changePinDigit, changePinDelete)}
                <button
                  onClick={cancelChangePin}
                  className="text-sm text-spark-text-muted hover:text-spark-text-primary underline transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
              ) : (
              /* --- Lock toggle --- */
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <LockIcon size="md" className="text-spark-text-secondary" />
                    <span className="text-sm text-spark-text-primary">{t('lock.usePin')}</span>
                  </div>
                  <Switch
                    checked={lock.lockEnabled}
                    onChange={handleTogglePin}
                  />
                </div>

                {/* Change PIN (only visible when PIN is active) */}
                {lock.lockEnabled && (
                  <button
                    onClick={() => setChangingPin(true)}
                    className="w-full py-2 px-4 text-sm font-medium text-spark-text-secondary border border-spark-border rounded-xl hover:text-spark-text-primary hover:bg-white/5 transition-colors"
                  >
                    {t('lock.changePin')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Passkey & Labels */}
          {isDevMode && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
              <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('settings.passkey')}</h3>
              <button
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium border border-spark-border rounded-xl text-spark-text-secondary hover:text-spark-text-primary hover:bg-white/5 transition-colors"
                type="button"
                onClick={onOpenPasskeySettings}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon size="md" />
                  <span>{t('settings.passkeyLabels')}</span>
                </div>
                <ChevronRightIcon size="md" />
              </button>
            </div>
          )}

          {/* Diagnostics */}
          <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
            <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('settings.diagnostics')}</h3>
            <button
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-spark-border rounded-xl text-spark-text-secondary hover:text-spark-text-primary hover:bg-white/5 transition-colors disabled:opacity-50"
              type="button"
              onClick={handleShareLogs}
              disabled={isDownloadingLogs}
            >
              {isDownloadingLogs ? (
                <LoadingSpinner size="small" />
              ) : (
                <DownloadIcon size="md" />
              )}
              {isDownloadingLogs ? t('settings.preparing') : t('settings.downloadLogs')}
            </button>
          </div>

          {/* Database */}
          {isDevMode && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
              <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('settings.database')}</h3>
              <button
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-spark-border rounded-xl text-spark-text-secondary hover:text-spark-text-primary hover:bg-white/5 transition-colors disabled:opacity-50"
                type="button"
                onClick={handleExportDb}
                disabled={isExportingDb}
              >
                {isExportingDb ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <DownloadIcon size="md" />
                )}
                {isExportingDb ? t('settings.exporting') : t('settings.exportDatabase')}
              </button>
            </div>
          )}

          {/* Network */}
          {isDevMode && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
              <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('settings.network')}</h3>
              <div className="flex gap-2">
                {(['mainnet', 'regtest'] as Network[]).map((network) => (
                  <button
                    key={network}
                    onClick={() => handleNetworkChange(network)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${selectedNetwork === network
                        ? 'bg-spark-primary text-white'
                        : 'bg-spark-surface border border-spark-border text-spark-text-secondary hover:text-spark-text-primary hover:border-spark-border-light'
                      }`}
                  >
                    {network === 'mainnet' ? t('settings.mainnet') : t('settings.regtest')}
                  </button>
                ))}
              </div>
              <p className="text-xs text-spark-text-muted mt-2">
                {t('settings.networkHelp')}
              </p>
            </div>
          )}

          {/* Privacy */}
          {isDevMode && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-display font-semibold text-spark-text-primary">{t('settings.privacy')}</h3>
                {isLoadingUserSettings && <LoadingSpinner size="small" />}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-display font-medium text-spark-text-primary block">{t('settings.privateMode')}</span>
                  <span className="text-sm text-spark-text-muted">{t('settings.privateModeDesc')}</span>
                </div>
                <Switch
                  checked={sparkPrivateModeEnabled}
                  onChange={() => setSparkPrivateModeEnabled(!sparkPrivateModeEnabled)}
                  disabled={isLoadingUserSettings}
                />
              </div>
            </div>
          )}

          {/* Prefer Spark */}
          {isDevMode && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-display font-medium text-spark-text-primary block">{t('settings.preferSpark')}</span>
                  <span className="text-sm text-spark-text-muted">{t('settings.preferSparkDesc')}</span>
                </div>
                <Switch
                  checked={preferSparkOverLightning}
                  onChange={() => setPreferSparkOverLightning(!preferSparkOverLightning)}
                />
              </div>
            </div>
          )}

          {/* Cross-chain (Send USD) */}
          <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-display font-medium text-spark-text-primary block">{t('settings.sendUsd')}</span>
                <span className="text-sm text-spark-text-muted">{t('settings.sendUsdDesc')}</span>
              </div>
              <Switch
                checked={crossChainEnabled}
                onChange={() => {
                  const newVal = !crossChainEnabled;
                  setCrossChainEnabled(newVal);
                  const current = getSettings();
                  saveSettings({ ...current, crossChainEnabled: newVal });
                }}
              />
            </div>
          </div>

          {/* Deposit Claim Fee */}
          {isDevMode && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
              <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('settings.depositClaimFee')}</h3>
              <FormGroup>
                <div className="flex gap-2 items-center">
                  <select
                    value={feeType}
                    onChange={(e) => setFeeType(e.currentTarget.value as 'fixed' | 'rate' | 'networkRecommended')}
                    className="min-w-[160px] bg-spark-surface border border-spark-border rounded-xl px-3 py-3 text-spark-text-primary text-sm focus:border-spark-primary focus:ring-2 focus:ring-spark-primary/20"
                    aria-label={t('settings.maxFeeType')}
                  >
                    <option className="bg-spark-surface" value="fixed">{t('settings.fixedSats')}</option>
                    <option className="bg-spark-surface" value="rate">{t('settings.rateSatVb')}</option>
                    <option className="bg-spark-surface" value="networkRecommended">{t('settings.networkLeeway')}</option>
                  </select>
                  <div className="flex-1">
                    <FormInput
                      id="deposit-fee-default"
                      type="number"
                      min={0}
                      value={feeValue}
                      onChange={(e) => setFeeValue(e.target.value)}
                      placeholder={feeType === 'fixed' ? 'sats' : 'sat/vB'}
                    />
                  </div>
                </div>
              </FormGroup>
            </div>
          )}

          {/* Sync Settings */}
          {isDevMode && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
              <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('settings.syncInterval')}</h3>
              <FormGroup>
                <label htmlFor="sync-interval" className="block text-sm text-spark-text-secondary mb-1">
                  {t('settings.syncInterval')}
                </label>
                <FormInput
                  id="sync-interval"
                  type="number"
                  min={0}
                  value={syncIntervalSecs}
                  onChange={(e) => setSyncIntervalSecs(e.target.value)}
                  placeholder={t('settings.e.g30')}
                />
              </FormGroup>
            </div>
          )}

          {/* LNURL */}
          {isDevMode && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4">
              <h3 className="font-display font-semibold text-spark-text-primary mb-3">{t('settings.lnurl')}</h3>
              <FormGroup>
                <label htmlFor="lnurl-domain" className="block text-sm text-spark-text-secondary mb-1">
                  {t('settings.customDomain')}
                </label>
                <FormInput
                  id="lnurl-domain"
                  type="text"
                  value={lnurlDomain}
                  onChange={(e) => setLnurlDomain(e.target.value)}
                  placeholder={t('settings.exampleDotCom')}
                />
              </FormGroup>
            </div>
          )}

          {/* Version / Dev Mode Toggle */}
          <div className="text-center pt-4">
            <button
              onClick={devTap}
              className="text-spark-text-muted text-xs hover:text-spark-text-secondary transition-colors select-none"
            >
              {t('settings.version')}
              {isDevMode && <span className="ml-1 text-spark-primary">{t('settings.dev')}</span>}
            </button>
            {devTapCount > 0 && devTapCount < devTapThreshold && (
              <p className="text-xs text-spark-text-muted mt-1">
                {devTapThreshold - devTapCount} {t('settings.devModeTaps')} {isDevMode ? t('settings.disable') : t('settings.enable')} dev mode
              </p>
            )}
          </div>
        </div>
      </div>
    </SlideInPage>
  );
};

export default SettingsPage;
