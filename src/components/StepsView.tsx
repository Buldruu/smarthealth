import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Lock,
  MapPin,
  Navigation,
  ShieldCheck,
  Smartphone,
  Square,
} from 'lucide-react';
import type { ConsentSettings, StepSource, StepWalletState } from '../types';

interface StepsViewProps {
  wallet: StepWalletState;
  consent: ConsentSettings;
  gpsTracking: boolean;
  gpsStatus: 'idle' | 'requesting' | 'tracking' | 'denied' | 'unavailable';
  gpsError: string | null;
  liveAccuracyMeters: number | null;
  sessionMeters: number;
  pendingGeoSteps: number;
  syncingSteps: boolean;
  onToggleGpsTracking: () => Promise<void>;
  onFlushGeoSteps: () => Promise<void>;
  onSyncDeviceSteps: (steps: number, source: StepSource) => Promise<void>;
  onToggleMotionConsent: (enabled: boolean) => Promise<void>;
}

export const StepsView: React.FC<StepsViewProps> = ({
  wallet,
  consent,
  gpsTracking,
  gpsStatus,
  gpsError,
  liveAccuracyMeters,
  sessionMeters,
  pendingGeoSteps,
  syncingSteps,
  onToggleGpsTracking,
  onFlushGeoSteps,
  onSyncDeviceSteps,
  onToggleMotionConsent,
}) => {
  const [source, setSource] = useState<'apple_health' | 'google_fit' | 'pedometer'>('pedometer');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [manualInput, setManualInput] = useState('5000');

  const handleBridgeSync = async (steps: number) => {
    setBusy(true);
    setFeedback(null);
    try {
      await onSyncDeviceSteps(steps, source);
      setFeedback({
        kind: 'success',
        text: `${steps.toLocaleString('en-US')} баталгаажсан алхам бүртгэгдлээ.`,
      });
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Алхам бүртгэхэд алдаа гарлаа.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleTestDuplicateReplay = async () => {
    setFeedback(null);
    const latest = wallet.batches[0];
    if (!latest) {
      setFeedback({
        kind: 'error',
        text: 'Эхлээд дор хаяж 1 багц алхам утаснаас синк хийнэ үү.',
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/steps/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: latest.batchId,
          date: latest.date,
          steps: latest.steps,
          source: latest.source,
          verifiedHash: latest.verifiedHash,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: 'success', text: `Хамгаалалт ажиллалаа: ${data.error}` });
      }
    } catch (err) {
      setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Шалгалтын алдаа.' });
    } finally {
      setBusy(false);
    }
  };

  const handleTestManualRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/steps/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: `manual-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          steps: Number(manualInput) || 5000,
          source: 'manual',
          verifiedHash: 'forged',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: 'success', text: `Хамгаалалт ажиллалаа: ${data.error}` });
      }
    } catch (err) {
      setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Шалгалтын алдаа.' });
    } finally {
      setBusy(false);
    }
  };

  const liveTotalSteps = wallet.totalVerifiedSteps + pendingGeoSteps;
  const liveRemainderSteps = liveTotalSteps % wallet.stepsPerCoin;
  const progressPct = Math.min(100, Math.round((liveRemainderSteps / wallet.stepsPerCoin) * 100));

  return (
    <div className="space-y-4 p-4 pb-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-blue-700">8,000 алхам = 1 зоос</p>
            <h1 className="font-display text-xl font-bold text-slate-900">Алхалт ба Зоос</h1>
          </div>
          <button
            type="button"
            onClick={() => onToggleMotionConsent(!consent.motionConnected)}
            className={`min-h-[38px] rounded-xl border px-3 py-1.5 text-[11px] font-bold whitespace-nowrap ${
              consent.motionConnected
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-slate-300 bg-slate-100 text-slate-700'
            }`}
          >
            {consent.motionConnected ? 'Мэдрэгч: Асаалттай' : 'Мэдрэгч: Унтарсан'}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Нийт алхам</p>
            <p className="tabular-nums font-display text-xl font-bold text-slate-900">
              {liveTotalSteps.toLocaleString('en-US')}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
            <p className="text-[11px] font-semibold text-amber-800">Үлдэгдэл зоос</p>
            <p className="tabular-nums font-display text-xl font-bold text-amber-700">
              {wallet.availableCoins} зоос
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Нийт олсон</p>
            <p className="tabular-nums text-sm font-bold text-blue-700">{wallet.coinsEarned} зоос</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] text-slate-500">Зарцуулсан</p>
            <p className="tabular-nums text-sm font-bold text-slate-800">{wallet.coinsSpent} зоос</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 p-3">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-800">Дараагийн зоос</span>
            <span className="tabular-nums font-bold text-blue-700">
              {liveRemainderSteps.toLocaleString('en-US')} / 8,000 ({progressPct}%)
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Өдрийн хязгааргүй (16,000 = 2 зоос). Үлдэгдэл дараагийн өдөрт шилжинэ.
          </p>
        </div>
      </section>

      {/* Live Phone Location Step Counter */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">Утасны байршлаар тоолох</h2>
          </div>
          <span
            className={`text-[11px] font-bold whitespace-nowrap ${
              gpsTracking ? 'text-blue-700' : 'text-slate-500'
            }`}
          >
            {gpsStatus === 'tracking'
              ? 'Идэвхтэй'
              : gpsStatus === 'requesting'
              ? 'Холбогдож байна'
              : gpsStatus === 'denied'
              ? 'Зөвшөөрөлгүй'
              : 'Унтарсан'}
          </span>
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          Утасныхаа байршлыг (Location) асаагаад алхах үед туулсан бодит зай алхам болон автоматаар нэмэгдэнэ. Хурдны хязгаараас хэтэрсэн тээврийн хөдөлгөөнийг алхамд тооцохгүй.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
          <div>
            <p className="text-[10px] text-slate-500">Туулсан зай</p>
            <p className="tabular-nums text-sm font-bold text-slate-900">{Math.round(sessionMeters)} м</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Нэмэгдсэн алхам</p>
            <p className="tabular-nums text-sm font-bold text-blue-700">+{pendingGeoSteps}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">GPS нарийвчлал</p>
            <p className="tabular-nums text-sm font-bold text-slate-800">
              {liveAccuracyMeters ? `±${liveAccuracyMeters}м` : '—'}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => void onToggleGpsTracking()}
            className={`flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-white transition-colors ${
              gpsTracking
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {gpsTracking ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                Алхалт зогсоох ба хадгалах
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Байршил асааж алхах
              </>
            )}
          </button>

          {pendingGeoSteps > 0 && (
            <button
              type="button"
              disabled={syncingSteps}
              onClick={() => void onFlushGeoSteps()}
              className="min-h-[40px] w-full rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-60"
            >
              {syncingSteps ? 'Хадгалж байна...' : `Одоо хадгалах (+${pendingGeoSteps} алхам)`}
            </button>
          )}
        </div>

        {gpsError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span>{gpsError}</span>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-blue-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">Эрүүл мэндийн апп холбох</h2>
        </div>

        {!consent.motionConnected ? (
          <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Хөдөлгөөний зөвшөөрөл унтарсан байна. Та хүсвэл дээрх товчоор асаах эсвэл AI зөвлөх ба Community-г ашиглаарай.
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'pedometer', label: 'Утас (GPS)' },
                { id: 'apple_health', label: 'Apple Health' },
                { id: 'google_fit', label: 'Google Fit' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSource(item.id as 'apple_health' | 'google_fit' | 'pedometer')}
                  className={`min-h-[38px] rounded-xl border px-2 text-[11px] font-semibold whitespace-nowrap ${
                    source === item.id
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleBridgeSync(3200)}
                className="min-h-[44px] rounded-xl border border-blue-200 bg-blue-50 px-2 text-[11px] font-bold text-blue-900"
              >
                +3,200
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleBridgeSync(8500)}
                className="min-h-[44px] rounded-xl bg-blue-600 px-2 text-[11px] font-bold text-white"
              >
                +8,500
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleBridgeSync(16000)}
                className="min-h-[44px] rounded-xl bg-slate-900 px-2 text-[11px] font-bold text-white"
              >
                +16,000
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Аюулгүй байдлын шалгалт
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleTestDuplicateReplay}
            className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
          >
            Давхар синк илгээж хамгаалалт шалгах
          </button>
          <form onSubmit={handleTestManualRejection} className="flex gap-2">
            <input
              type="number"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="tabular-nums min-h-[40px] w-24 rounded-xl border border-slate-300 px-2.5 text-xs"
            />
            <button
              type="submit"
              disabled={busy}
              className="min-h-[40px] flex-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-800"
            >
              Гараар зохиомол алхам шалгах
            </button>
          </form>
        </div>

        {feedback && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs ${
              feedback.kind === 'success'
                ? 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.kind === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">Зоос ба Алхалтын түүх</h2>
        </div>

        {wallet.ledger.length === 0 && wallet.batches.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">Одоогоор бүртгэгдсэн гүйлгээ алга.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {wallet.ledger.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{item.title}</p>
                  <p className="truncate text-[11px] text-slate-500">{item.detail}</p>
                </div>
                <span className={`tabular-nums font-bold ${item.type === 'earned' ? 'text-blue-700' : 'text-rose-700'}`}>
                  {item.type === 'earned' ? `+${item.coins}` : `-${item.coins}`}
                </span>
              </div>
            ))}
            {wallet.batches.slice(0, 3).map((b) => (
              <div key={b.batchId} className="flex items-center justify-between px-1 text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-blue-600" />
                  {b.source} · {b.recordedAt}
                </span>
                <span className="tabular-nums font-bold text-slate-900">+{b.steps.toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
