import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Droplets,
  Flame,
  Footprints,
  Gauge,
  Minus,
  Plus,
  Route,
  Target,
  Coins,
  LogIn,
  User,
  Play,
} from 'lucide-react';
import {
  MAX_DAILY_GAME_COINS,
  MAX_DAILY_WALK_COINS,
  RUN_HERO_IMG,
  STEPS_PER_COIN,
  TabId,
  WALK_HERO_IMG,
} from '../constants/smartHealthData';

interface TodayTabProps {
  userName: string | null;
  userContact: string | null;
  avatarUrl: string | null;
  steps: number;
  stepGoal: number;
  waterGlasses: number;
  coins: number;
  dailyGameCoins: number;
  onChangeWater: (next: number) => void;
  onChangeGoal: (next: number) => void;
  onNavigateTab: (tab: TabId) => void;
  onOpenLogin: () => void;
}

const RADIAL_RING_PATH =
  'M 68 12 A 56 56 0 1 1 68 124 A 56 56 0 1 1 68 12';

const WEEKLY_ACTIVITY = [
  { day: 'Да', pct: 68 },
  { day: 'Мя', pct: 85 },
  { day: 'Лх', pct: 52 },
  { day: 'Пү', pct: 94 },
  { day: 'Ба', pct: 76 },
  { day: 'Бя', pct: 100 },
];

export const TodayTab: React.FC<TodayTabProps> = ({
  userName,
  avatarUrl,
  steps,
  stepGoal,
  waterGlasses,
  coins,
  dailyGameCoins,
  onChangeWater,
  onChangeGoal,
  onNavigateTab,
  onOpenLogin,
}) => {
  const [heroImgError, setHeroImgError] = useState(false);

  const walkCoinsToday = Math.min(
    MAX_DAILY_WALK_COINS,
    Math.floor(steps / STEPS_PER_COIN)
  );
  const stepRatio = Math.min(1, Math.max(0, steps / Math.max(1, stepGoal)));
  const stepProgressPct = Math.round(stepRatio * 100);
  const remainingSteps = Math.max(0, stepGoal - steps);
  const estimatedKm = (steps * 0.00075).toFixed(1);
  const estimatedKcal = Math.round(steps * 0.04);

  return (
    <div className="space-y-3.5">
      {/* Full-bleed Edge-to-Edge Running App Header & Hero */}
      <div className="relative -mx-[18px] -mt-[56px] h-[256px] overflow-hidden bg-slate-950">
        {!heroImgError && (
          <img
            src={userName ? RUN_HERO_IMG : WALK_HERO_IMG}
            alt={
              userName
                ? 'Улаанбаатарын Туул голын эргээр гүйж буй тамирчин'
                : 'Улаанбаатарын алхалтын зам ба Богд хан уул'
            }
            referrerPolicy="no-referrer"
            onError={() => setHeroImgError(true)}
            className="w-full h-full object-cover object-center"
          />
        )}

        {/* Gradient Scrim Blending Seamlessly Into #0b1220 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/30 to-[#0b1220]"
        />

        {/* Top Bar Inside Hero */}
        <div className="absolute top-[52px] left-[18px] right-[18px] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => (userName ? onNavigateTab('settings') : onOpenLogin())}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-900/70 border border-white/30 flex items-center justify-center shrink-0 group-hover:border-amber-300 transition-colors backdrop-blur-md">
              {avatarUrl && userName ? (
                <img
                  src={avatarUrl}
                  alt={`${userName} профайл зураг`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Smart Health Mongolia
              </p>
              <p className="text-sm font-bold text-white truncate">
                {userName ? `Сайн уу, ${userName}` : 'Зочин горим'}
              </p>
            </div>
          </button>

          {userName ? (
            <button
              type="button"
              onClick={() => onNavigateTab('coins')}
              className="glass-panel-strong rounded-full px-3 py-1.5 flex items-center gap-1.5 text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            >
              <Coins size={15} className="text-amber-300" />
              <span className="text-sm font-bold tabular-nums">
                {coins.toLocaleString()}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-full px-3.5 py-2 bg-amber-300 hover:bg-amber-200 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <LogIn size={14} />
              Нэвтрэх
            </button>
          )}
        </div>

        {/* Bottom Running Motto + Start Run CTA */}
        <div className="absolute bottom-3 left-[18px] right-[18px] flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              {userName ? 'Өнөөдрийн хэмнэл · Туул гол' : 'Өдрийн алхалт · Улаанбаатар'}
            </p>
            <h1 className="font-athletic text-[22px] font-bold uppercase text-white leading-[1.1] mt-0.5">
              {userName
                ? 'Эрүүл биед саруул ухаан, алхам бүрд шинэ эрч хүч'
                : 'Өглөөний цэвэр агаар — өдрийн эрүүл эхлэл'}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('walk')}
            className="min-h-[40px] px-4 rounded-full bg-amber-300 hover:bg-amber-200 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-[0_6px_20px_rgba(253,224,71,0.3)]"
          >
            <Play size={13} fill="currentColor" />
            Гүйх
          </button>
        </div>
      </div>

      {/* 3-Column Running Telemetry Strip */}
      <div className="glass-panel rounded-3xl p-3.5 grid grid-cols-3 gap-2 text-center">
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-semibold">
            <Route size={12} className="text-sky-300" />
            Зай
          </span>
          <p className="font-athletic text-[22px] font-bold text-white leading-none tabular-nums">
            {estimatedKm}{' '}
            <span className="text-xs font-sans font-semibold text-slate-300">
              км
            </span>
          </p>
        </div>

        <div className="space-y-0.5 border-x border-white/10">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-semibold">
            <Gauge size={12} className="text-amber-300" />
            Хэмнэл
          </span>
          <p className="font-athletic text-[22px] font-bold text-white leading-none tabular-nums">
            5&apos;42&quot;{' '}
            <span className="text-xs font-sans font-semibold text-slate-300">
              /км
            </span>
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-semibold">
            <Flame size={12} className="text-orange-300" />
            Илчлэг
          </span>
          <p className="font-athletic text-[22px] font-bold text-white leading-none tabular-nums">
            {estimatedKcal}{' '}
            <span className="text-xs font-sans font-semibold text-slate-300">
              ккал
            </span>
          </p>
        </div>
      </div>

      {/* Athletic Radial Progress Ring & 7-Day Running Rhythm */}
      <div className="glass-panel rounded-3xl p-4 space-y-3.5">
        <div className="flex items-center gap-4">
          {/* Animated SVG Path Radial Progress Bar */}
          <div className="relative w-[124px] h-[124px] shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 136 136"
              className="w-full h-full"
              aria-label={`Өдрийн алхалтын зорилгын биелэлт ${stepProgressPct}%`}
            >
              <defs>
                <linearGradient
                  id="runRingGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              <path
                d={RADIAL_RING_PATH}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="10"
                strokeLinecap="round"
              />

              <motion.path
                d={RADIAL_RING_PATH}
                fill="none"
                stroke="url(#runRingGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: stepRatio }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <Footprints size={15} className="text-amber-300 mb-0.5" />
              <span className="font-athletic text-[28px] font-bold text-white leading-none tabular-nums">
                {stepProgressPct}%
              </span>
              <span className="text-[10px] font-semibold text-slate-300 mt-1">
                Зорилго
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-[11px] font-semibold text-slate-300">
                Өнөөдрийн алхам
              </p>
              <p className="font-athletic text-[32px] font-bold text-white leading-none tabular-nums mt-0.5">
                {steps.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-200 tabular-nums mt-1">
                {remainingSteps > 0
                  ? `Зорилго хүртэл ${remainingSteps.toLocaleString()} алхам`
                  : `Зорилго (${stepGoal.toLocaleString()}) биеллээ!`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('walk')}
              className="text-xs font-bold text-amber-300 hover:underline cursor-pointer"
            >
              Алхалт / Гүйлт нэмэх →
            </button>
          </div>
        </div>

        {/* 7-Day Running Consistency Mini Bars */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-300 mb-2">
            <span className="font-semibold">7 хоногийн идэвх</span>
            <span className="text-amber-300 font-bold tabular-nums">
              Өнөөдөр: {stepProgressPct}%
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2 items-end h-[44px]">
            {[...WEEKLY_ACTIVITY, { day: 'Өн', pct: stepProgressPct }].map(
              (item, idx) => {
                const isToday = idx === 6;
                return (
                  <div
                    key={item.day}
                    className="flex flex-col items-center gap-1 h-full justify-end"
                  >
                    <div className="w-full h-[26px] rounded-md bg-white/10 flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-md transition-all duration-300 ${
                          isToday ? 'bg-amber-300' : 'bg-sky-300/75'
                        }`}
                        style={{ height: `${Math.max(15, item.pct)}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-semibold leading-none ${
                        isToday ? 'text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Sign-In Callout when in Guest Mode */}
      {!userName && (
        <div className="glass-panel rounded-3xl p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">
              Нэвтэрч зоосоо хадгалаарай
            </h2>
            <p className="text-xs text-slate-200 mt-0.5">
              Зоос, үнэгүй тоглоом болон хөнгөлөлтүүд нэвтэрсний дараа нээгдэнэ.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="min-h-[40px] px-3.5 rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 text-xs font-bold shrink-0 cursor-pointer"
          >
            Нэвтрэх
          </button>
        </div>
      )}

      {/* Water & Daily Goal Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-3xl p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Droplets size={14} className="text-sky-300" />
              Ус уух
            </span>
            <span className="text-xs font-bold text-slate-200 tabular-nums">
              {waterGlasses}/8 аяга
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Усны хэмжээг хасах"
              onClick={() => onChangeWater(Math.max(0, waterGlasses - 1))}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <Minus size={15} />
            </button>
            <span className="text-lg font-extrabold text-white tabular-nums">
              {waterGlasses * 250}мл
            </span>
            <button
              type="button"
              aria-label="Усны хэмжээг нэмэх"
              onClick={() => onChangeWater(Math.min(16, waterGlasses + 1))}
              className="w-10 h-10 rounded-2xl bg-sky-400/25 hover:bg-sky-400/40 text-white flex items-center justify-center cursor-pointer"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Target size={14} className="text-amber-300" />
            Өдрийн зорилго
          </div>

          <div className="grid grid-cols-3 gap-1">
            {[8000, 10000, 16000].map((goal) => {
              const active = stepGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => onChangeGoal(goal)}
                  className={`min-h-[38px] rounded-xl text-[11px] font-bold tabular-nums transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-300 text-slate-950'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {goal / 1000}к
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coins Earned Summary */}
      <div className="glass-panel rounded-3xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Өнөөдрийн зоос</h2>
          <span className="text-xs font-semibold text-amber-300 tabular-nums">
            Нийт +{walkCoinsToday + dailyGameCoins} / 10 боломжит
          </span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          Зоос нь <span className="font-semibold text-white">алхалтаас</span> (
          {walkCoinsToday}/{MAX_DAILY_WALK_COINS}) болон{' '}
          <span className="font-semibold text-white">үнэгүй мини тоглоомоос</span> (
          {dailyGameCoins}/{MAX_DAILY_GAME_COINS}) орж ирнэ.
        </p>
      </div>
    </div>
  );
};
