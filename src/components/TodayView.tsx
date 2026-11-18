import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Circle, Coins, MapPin, Navigation, Sparkles, Square, Users } from 'lucide-react';
import type { AiDailyPlan, AppTab, ConsentSettings, StepWalletState, UserProfile, WalkingGroup } from '../types';

interface TodayViewProps {
  profile: UserProfile;
  plan: AiDailyPlan;
  wallet: StepWalletState;
  consent: ConsentSettings;
  activeGroup?: WalkingGroup;
  gpsTracking: boolean;
  gpsStatus: 'idle' | 'requesting' | 'tracking' | 'denied' | 'unavailable';
  gpsError: string | null;
  liveAccuracyMeters: number | null;
  sessionMeters: number;
  pendingGeoSteps: number;
  onToggleTask: (taskId: string) => void;
  onToggleGpsTracking: () => Promise<void>;
  onNavigate: (tab: AppTab) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  nutrition: 'Хооллолт',
  movement: 'Хөдөлгөөн',
  hydration: 'Ус уух',
  rest: 'Амралт',
};

export const TodayView: React.FC<TodayViewProps> = ({
  profile,
  plan,
  wallet,
  consent,
  activeGroup,
  gpsTracking,
  gpsStatus,
  gpsError,
  liveAccuracyMeters,
  sessionMeters,
  pendingGeoSteps,
  onToggleTask,
  onToggleGpsTracking,
  onNavigate,
}) => {
  const liveTotalSteps = wallet.totalVerifiedSteps + pendingGeoSteps;
  const liveRemainderSteps = liveTotalSteps % wallet.stepsPerCoin;
  const liveStepsToNextCoin =
    liveRemainderSteps === 0 ? wallet.stepsPerCoin : wallet.stepsPerCoin - liveRemainderSteps;
  const liveTodaySteps = wallet.todaySteps + pendingGeoSteps;

  const progressRatio = Math.min(1, liveRemainderSteps / wallet.stepsPerCoin);
  const completedCount = plan.actions.filter((a) => a.done).length;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progressRatio);

  return (
    <div className="space-y-4 p-4 pb-6">
      {/* Step & Coin Hero App Card */}
      <section className="rounded-3xl bg-slate-900 p-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium text-slate-300">Сайн уу, {profile.name}</p>
            <h1 className="font-display text-xl font-bold text-white">Өнөөдрийн ахиц</h1>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('rewards')}
            className="flex min-h-[38px] items-center gap-1.5 rounded-2xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300"
          >
            <Coins className="h-3.5 w-3.5" />
            <span className="tabular-nums">{wallet.availableCoins} зоос</span>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r={radius} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="9" />
              <motion.circle
                cx="54"
                cy="54"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="tabular-nums font-display text-xl font-bold text-white">
                {liveRemainderSteps.toLocaleString('en-US')}
              </span>
              <span className="tabular-nums text-[10px] text-slate-300">/ 8,000</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5 text-xs">
            <div>
              <p className="text-slate-400">Өнөөдрийн алхам</p>
              <p className="tabular-nums text-base font-bold text-white">
                {liveTodaySteps.toLocaleString('en-US')} алхам
              </p>
            </div>
            <div>
              <p className="text-slate-400">Дараагийн зоос хүртэл</p>
              <p className="tabular-nums font-semibold text-emerald-400">
                {liveStepsToNextCoin.toLocaleString('en-US')} алхам дутуу
              </p>
            </div>
            <p className="text-[11px] text-slate-400">Үлдэгдэл маргааш руу шилжинэ</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onToggleGpsTracking()}
          className={`mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-white transition-colors ${
            gpsTracking
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {gpsTracking ? (
            <>
              <Square className="h-3.5 w-3.5 fill-current" />
              <span className="tabular-nums">
                Алхалт зогсоох ({Math.round(sessionMeters)} м)
              </span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span>Байршил асааж алхалт тоолох</span>
            </>
          )}
        </button>

        {gpsTracking && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-emerald-300">
            <Navigation className="h-3 w-3" />
            <span className="tabular-nums">
              {gpsStatus === 'requesting'
                ? 'Утасны байршил хайж байна...'
                : `Байршлаар хянаж байна · ${Math.round(sessionMeters)} м${
                    liveAccuracyMeters ? ` (±${liveAccuracyMeters}м)` : ''
                  }`}
            </span>
          </p>
        )}

        {gpsError && (
          <p className="mt-2 rounded-xl bg-rose-500/20 px-3 py-1.5 text-[11px] text-rose-200">
            {gpsError}
          </p>
        )}
      </section>

      {/* User Goal Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-emerald-700">Миний зорилго</span>
          <span className="tabular-nums">
            {completedCount}/{plan.actions.length} биелсэн
          </span>
        </div>
        <p className="mt-1 text-sm font-bold leading-snug text-slate-900">{profile.goalText}</p>
      </section>

      {/* Today's 3 Small Actions */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">Өнөөдрийн 3 жижиг үйлдэл</h2>
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            className="text-xs font-semibold text-emerald-700"
          >
            Бүгд →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {plan.actions.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onToggleTask(task.id)}
              className="flex min-h-[56px] w-full items-start gap-3 py-3 text-left"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  task.done
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-transparent'
                }`}
              >
                {task.done ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-emerald-700">
                  {CATEGORY_LABEL[task.category] || 'Дадал'}
                </p>
                <p
                  className={`text-xs font-bold ${
                    task.done ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{task.detail}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Daily AI Tip */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h2 className="font-display text-base font-bold text-slate-900">Өдөр тутмын AI зөвлөгөө</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            className="text-xs font-semibold text-emerald-700"
          >
            Оройн дүгнэлт →
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-700">{plan.encouragement}</p>
        <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-600">
          <strong className="text-slate-800">Хооллолт:</strong> {plan.nutritionNote}
        </p>
      </section>

      {/* Active Nearby Group Preview */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <h2 className="font-display text-base font-bold text-slate-900">Ойролцоох идэвхтэй бүлэг</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('community')}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700"
          >
            Нээх <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {consent.communityJoined && activeGroup ? (
          <div className="mt-2.5 space-y-1.5">
            <p className="text-xs font-bold text-slate-900">{activeGroup.name}</p>
            <p className="text-[11px] text-slate-500">
              {activeGroup.districtZone} · {activeGroup.memberCount} гишүүн
            </p>
            <p className="text-[11px] text-slate-600">Цэг: {activeGroup.meetingSpot}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Та Community-д сонголтоор нэгдэн хамт алхах бүлэгтэй холбогдож болно.
          </p>
        )}
      </section>
    </div>
  );
};
