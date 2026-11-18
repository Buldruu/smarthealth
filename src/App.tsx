import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Award, Coins, Footprints, Home, ShieldCheck, Sparkles, TrendingUp, Users, Wifi } from 'lucide-react';
import { AiCoachView } from './components/AiCoachView';
import { CommunityView } from './components/CommunityView';
import { GoalOnboarding } from './components/GoalOnboarding';
import { InsuranceView } from './components/InsuranceView';
import { ProgressView } from './components/ProgressView';
import { RewardsView } from './components/RewardsView';
import { StepsView } from './components/StepsView';
import { TodayView } from './components/TodayView';
import { computeValidWalkingMeters, metersToSteps, type GeoPoint } from './utils/geoSteps';
import type {
  AiDailyPlan,
  AppTab,
  BootstrapPayload,
  ConsentSettings,
  EveningCheckIn,
  ProgressPhoto,
  StepSource,
  UserProfile,
} from './types';

const STORAGE_KEY = 'vitalx_mn_state_v1';

interface LocalUserState {
  profile: UserProfile | null;
  plan: AiDailyPlan | null;
  checkIns: EveningCheckIn[];
  photos: ProgressPhoto[];
}

function loadLocalState(): LocalUserState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profile: null, plan: null, checkIns: [], photos: [] };
    return JSON.parse(raw) as LocalUserState;
  } catch {
    return { profile: null, plan: null, checkIns: [], photos: [] };
  }
}

const TABS: Array<{ id: AppTab; label: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'today', label: 'Өнөөдөр', Icon: Home },
  { id: 'ai', label: 'AI зөвлөх', Icon: Sparkles },
  { id: 'steps', label: 'Алхалт', Icon: Footprints },
  { id: 'community', label: 'Community', Icon: Users },
  { id: 'insurance', label: 'Даатгал', Icon: ShieldCheck },
  { id: 'rewards', label: 'Урамшуулал', Icon: Award },
  { id: 'progress', label: 'Миний ахиц', Icon: TrendingUp },
];

export function App() {
  const [localState, setLocalState] = useState<LocalUserState>(() => loadLocalState());
  const [serverData, setServerData] = useState<BootstrapPayload | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [syncingSteps, setSyncingSteps] = useState(false);

  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'tracking' | 'denied' | 'unavailable'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [liveAccuracyMeters, setLiveAccuracyMeters] = useState<number | null>(null);
  const [sessionMeters, setSessionMeters] = useState(0);
  const [pendingGeoSteps, setPendingGeoSteps] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const lastGeoPointRef = useRef<GeoPoint | null>(null);
  const carryMetersRef = useRef(0);
  const pendingGeoStepsRef = useRef(0);
  const flushingGeoRef = useRef(false);

  const persistLocal = useCallback((next: LocalUserState) => {
    setLocalState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota error gracefully
    }
  }, []);

  const fetchBootstrap = useCallback(async () => {
    const res = await fetch('/api/bootstrap');
    if (res.ok) {
      const data = (await res.json()) as BootstrapPayload;
      setServerData(data);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  const handleSyncSteps = useCallback(async (steps: number, source: StepSource) => {
    setSyncingSteps(true);
    try {
      const res = await fetch('/api/steps/device-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Алхам синк хийж чадсангүй.');
      }
      await fetchBootstrap();
    } finally {
      setSyncingSteps(false);
    }
  }, [fetchBootstrap]);

  const flushGeoSteps = useCallback(async () => {
    const stepsToSync = pendingGeoStepsRef.current;
    if (stepsToSync <= 0 || flushingGeoRef.current) return;
    flushingGeoRef.current = true;
    pendingGeoStepsRef.current = 0;
    setPendingGeoSteps(0);
    try {
      await handleSyncSteps(stepsToSync, 'pedometer');
    } catch (err) {
      pendingGeoStepsRef.current += stepsToSync;
      setPendingGeoSteps(pendingGeoStepsRef.current);
      setGpsError(err instanceof Error ? err.message : 'Алхам хадгалахад алдаа гарлаа.');
    } finally {
      flushingGeoRef.current = false;
    }
  }, [handleSyncSteps]);

  useEffect(() => {
    if (!gpsTracking) {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsError('Таны төхөөрөмж дээр байршил тодорхойлох үйлчилгээ дэмжигдэхгүй байна.');
      setGpsTracking(false);
      return;
    }

    setGpsStatus('requesting');
    setGpsError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const nextPoint: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now(),
        };
        setGpsStatus('tracking');
        setLiveAccuracyMeters(Math.round(nextPoint.accuracy));
        setGpsError(null);

        if (!lastGeoPointRef.current) {
          lastGeoPointRef.current = nextPoint;
          return;
        }

        const deltaMeters = computeValidWalkingMeters(lastGeoPointRef.current, nextPoint);
        if (nextPoint.accuracy <= 50) {
          lastGeoPointRef.current = nextPoint;
        }

        if (deltaMeters > 0) {
          setSessionMeters((prev) => prev + deltaMeters);
          carryMetersRef.current += deltaMeters;
          const gainedSteps = metersToSteps(carryMetersRef.current);
          if (gainedSteps > 0) {
            carryMetersRef.current = Math.max(0, carryMetersRef.current - gainedSteps * 0.74);
            pendingGeoStepsRef.current += gainedSteps;
            setPendingGeoSteps(pendingGeoStepsRef.current);
            if (pendingGeoStepsRef.current >= 15) {
              void flushGeoSteps();
            }
          }
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsError('Байршлын зөвшөөрөл олгогдоогүй байна. Утасныхаа хөтчийн тохиргооноос Location-г зөвшөөрнө үү.');
          setGpsTracking(false);
        } else {
          setGpsError('Байршлын дохио хүлээж байна. Ил задгай орчинд илүү нарийвчлалтай ажиллана.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 12000,
      }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [gpsTracking, flushGeoSteps]);

  const handleUpdateConsent = async (patch: Partial<ConsentSettings>) => {
    await fetch('/api/user/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    await fetchBootstrap();
  };

  const handleToggleGpsTracking = async () => {
    if (gpsTracking) {
      setGpsTracking(false);
      setGpsStatus('idle');
      lastGeoPointRef.current = null;
      await flushGeoSteps();
      return;
    }
    if (serverData && !serverData.consent.motionConnected) {
      await handleUpdateConsent({ motionConnected: true });
    }
    setSessionMeters(0);
    carryMetersRef.current = 0;
    lastGeoPointRef.current = null;
    setGpsError(null);
    setGpsTracking(true);
  };

  if (!serverData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-slate-300">
        Smart Health Mongolia ачаалж байна...
      </div>
    );
  }

  const isOnboarded = Boolean(localState.profile && localState.plan);

  const handleToggleTask = (taskId: string) => {
    if (!localState.plan) return;
    const nextPlan: AiDailyPlan = {
      ...localState.plan,
      actions: localState.plan.actions.map((a) => (a.id === taskId ? { ...a, done: !a.done } : a)),
    };
    persistLocal({ ...localState, plan: nextPlan });
  };

  const handleDeleteAllData = async () => {
    setGpsTracking(false);
    setGpsStatus('idle');
    pendingGeoStepsRef.current = 0;
    setPendingGeoSteps(0);
    setSessionMeters(0);
    await fetch('/api/user/all', { method: 'DELETE' });
    localStorage.removeItem(STORAGE_KEY);
    setLocalState({ profile: null, plan: null, checkIns: [], photos: [] });
    await fetchBootstrap();
    setActiveTab('today');
  };

  const activeGroup = serverData.groups.find((g) => g.joined) || serverData.groups[0];

  const appScreenContent = !isOnboarded ? (
    <GoalOnboarding
      initialConsent={serverData.consent}
      onComplete={async (profile, plan, consent) => {
        persistLocal({ ...localState, profile, plan });
        setServerData((prev) => (prev ? { ...prev, consent } : prev));
        await fetchBootstrap();
        setActiveTab('today');
      }}
    />
  ) : (
    <>
      {activeTab === 'today' && localState.profile && localState.plan && (
        <TodayView
          profile={localState.profile}
          plan={localState.plan}
          wallet={serverData.wallet}
          consent={serverData.consent}
          activeGroup={activeGroup}
          gpsTracking={gpsTracking}
          gpsStatus={gpsStatus}
          gpsError={gpsError}
          liveAccuracyMeters={liveAccuracyMeters}
          sessionMeters={sessionMeters}
          pendingGeoSteps={pendingGeoSteps}
          onToggleTask={handleToggleTask}
          onToggleGpsTracking={handleToggleGpsTracking}
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'ai' && localState.profile && localState.plan && (
        <AiCoachView
          profile={localState.profile}
          plan={localState.plan}
          checkIns={localState.checkIns}
          onToggleTask={handleToggleTask}
          onPlanUpdated={(nextProfile, nextPlan) =>
            persistLocal({ ...localState, profile: nextProfile, plan: nextPlan })
          }
          onCheckInCompleted={(record, nextPlan) =>
            persistLocal({
              ...localState,
              plan: nextPlan,
              checkIns: [record, ...localState.checkIns],
            })
          }
        />
      )}

      {activeTab === 'steps' && (
        <StepsView
          wallet={serverData.wallet}
          consent={serverData.consent}
          gpsTracking={gpsTracking}
          gpsStatus={gpsStatus}
          gpsError={gpsError}
          liveAccuracyMeters={liveAccuracyMeters}
          sessionMeters={sessionMeters}
          pendingGeoSteps={pendingGeoSteps}
          syncingSteps={syncingSteps}
          onToggleGpsTracking={handleToggleGpsTracking}
          onFlushGeoSteps={flushGeoSteps}
          onSyncDeviceSteps={handleSyncSteps}
          onToggleMotionConsent={(enabled) => handleUpdateConsent({ motionConnected: enabled })}
        />
      )}

      {activeTab === 'community' && localState.profile && (
        <CommunityView
          userName={localState.profile.name}
          consent={serverData.consent}
          groups={serverData.groups}
          events={serverData.events}
          challenge={serverData.challenge}
          nearbyPeople={serverData.nearbyPeople}
          messages={serverData.messages}
          onRefresh={fetchBootstrap}
        />
      )}

      {activeTab === 'insurance' && (
        <InsuranceView
          insurance={serverData.insurance}
          offers={serverData.offers}
          onRefresh={fetchBootstrap}
          onOpenRewards={() => setActiveTab('rewards')}
        />
      )}

      {activeTab === 'rewards' && (
        <RewardsView
          wallet={serverData.wallet}
          offers={serverData.offers}
          adminOffers={serverData.adminOffers}
          coupons={serverData.coupons}
          insurance={serverData.insurance}
          onRefresh={fetchBootstrap}
          onOpenInsurance={() => setActiveTab('insurance')}
        />
      )}

      {activeTab === 'progress' && localState.profile && (
        <ProgressView
          profile={localState.profile}
          wallet={serverData.wallet}
          checkIns={localState.checkIns}
          photos={localState.photos}
          consent={serverData.consent}
          onAddPhoto={(photo) =>
            persistLocal({ ...localState, photos: [photo, ...localState.photos] })
          }
          onDeletePhoto={(id) =>
            persistLocal({
              ...localState,
              photos: localState.photos.filter((p) => p.id !== id),
            })
          }
          onUpdateConsent={handleUpdateConsent}
          onDeleteAllData={handleDeleteAllData}
        />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 md:flex md:items-center md:justify-center md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 lg:flex-row lg:items-center lg:justify-between">
        {/* Desktop Studio Companion Overview (keeps 1440px viewport balanced while highlighting the native mobile app) */}
        <aside className="hidden max-w-lg flex-col justify-center space-y-6 text-white lg:flex">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              iOS & Android · Эрүүл амьдралын апп
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight text-white [text-wrap:balance]">
              Smart Health Mongolia
            </h1>
            <p className="text-base leading-relaxed text-slate-300">
              Өөрийн зорилгоо бичиж хувийн AI зөвлөгөө авч, баталгаажсан 8,000 алхам тутамд 1 зоос цуглуулан бодит түншүүдээс хөнгөлөлт эдэлнэ.
            </p>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-5 text-sm text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span>01. Зорилго бичих → AI төлөвлөгөө</span>
              <span className="font-semibold text-emerald-400">
                {isOnboarded ? 'Бэлэн болсон' : 'Одоогийн алхам'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span>02. Баталгаажсан алхам → Зоос</span>
              <span className="tabular-nums font-semibold text-amber-400">
                {serverData.wallet.totalVerifiedSteps.toLocaleString('en-US')} алхам · {serverData.wallet.availableCoins} зоос
              </span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <span>03. Community · QR Купон · Түнш · Админ</span>
              <span className="font-semibold text-slate-400">Бүрэн ажиллагаатай</span>
            </div>
          </div>

          {isOnboarded && (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`min-h-[42px] rounded-xl border px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === id
                      ? 'border-emerald-500 bg-emerald-600 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Interactive Mobile Application Frame (Full-screen native on mobile < md, authentic iPhone/Android frame on md+) */}
        <div className="flex w-full justify-center lg:w-auto">
          <div className="relative flex min-h-screen w-full flex-col bg-slate-50 md:h-[820px] md:min-h-0 md:w-[402px] md:overflow-hidden md:rounded-[46px] md:border-[8px] md:border-slate-800 md:shadow-2xl">
            {/* Native Mobile Status Bar + Dynamic Notch (visible on md+ phone frame) */}
            <div className="hidden shrink-0 items-center justify-between bg-white px-6 pt-3 pb-1.5 text-[11px] font-bold text-slate-900 md:flex">
              <span className="tabular-nums">9:41</span>
              <div className="h-5 w-24 rounded-full bg-slate-900" aria-hidden="true" />
              <div className="flex items-center gap-1.5 text-slate-800">
                <Wifi className="h-3.5 w-3.5" />
                <span className="tabular-nums">100%</span>
              </div>
            </div>

            {/* Compact App Top Bar */}
            <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
              <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                Smart Health Mongolia
              </span>
              {isOnboarded ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('rewards')}
                  className="flex min-h-[34px] items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 whitespace-nowrap"
                >
                  <Coins className="h-3.5 w-3.5 text-amber-600" />
                  <span className="tabular-nums">{serverData.wallet.availableCoins} зоос</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                  Шинэ зорилго
                </span>
              )}
            </header>

            {/* Scrollable Mobile Screen Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-16 md:pb-3">
              {appScreenContent}
            </div>

            {/* Native Fixed Bottom 7-Tab Navigation Bar */}
            {isOnboarded && (
              <nav
                aria-label="Үндсэн цэс"
                className="fixed bottom-0 left-0 right-0 z-30 grid h-14 shrink-0 grid-cols-7 border-t border-slate-200 bg-white/95 backdrop-blur-md md:static"
              >
                {TABS.map(({ id, label, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-0.5 transition-colors ${
                        active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="w-full truncate text-center text-[8.5px] font-semibold tracking-tight">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Home Indicator Bar on Desktop Device Frame */}
            <div className="hidden shrink-0 justify-center bg-white pb-2 pt-1 md:flex">
              <div className="h-1 w-28 rounded-full bg-slate-300" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
