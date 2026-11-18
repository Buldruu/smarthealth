import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Droplets,
  Flame,
  Footprints,
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

export const TodayTab: React.FC<TodayTabProps> = ({
  userName,
  userContact,
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
      {/* Header with Profile Avatar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => (userName ? onNavigateTab('settings') : onOpenLogin())}
          className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/25 flex items-center justify-center shrink-0 group-hover:border-amber-300 transition-colors">
            {avatarUrl && userName ? (
              <img
                src={avatarUrl}
                alt={`${userName} профайл зураг`}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="text-slate-200" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-300">
              Smart Health Mongolia
            </p>
            <h1 className="text-[19px] font-bold text-white tracking-tight truncate">
              {userName ? `Сайн уу, ${userName}` : 'Өнөөдрийн гүйлт'}
            </h1>
          </div>
        </button>

        {userName ? (
          <button
            type="button"
            onClick={() => onNavigateTab('coins')}
            className="glass-panel rounded-full px-3 py-1.5 flex items-center gap-1.5 text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
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
            className="rounded-full px-3.5 py-2 bg-amber-300 hover:bg-amber-200 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <LogIn size={14} />
            Нэвтрэх
          </button>
        )}
      </div>

      {/* Sign-In Callout or Profile Quick Link */}
      {!userName ? (
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
      ) : (
        <div className="glass-panel rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs">
          <span className="text-slate-200 truncate">
            Тамирчин: <strong className="text-white">{userName}</strong>
            {userContact ? ` · ${userContact}` : ''}
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="text-amber-300 font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
          >
            Профайл
          </button>
        </div>
      )}

      {/* Dynamic Hero Photo Card (changes image & words once signed in) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900">
        <div className="h-[154px] w-full bg-gradient-to-br from-slate-800 to-slate-950">
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
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex items-end justify-between gap-2 p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
              {userName ? 'Өнөөдрийн хэмнэл · Туул гол' : 'Өдрийн алхалт · Улаанбаатар'}
            </p>
            <p className="text-sm font-bold text-white mt-0.5 leading-snug">
              {userName
                ? 'Эрүүл биед саруул ухаан, алхам бүрд шинэ эрч хүч'
                : 'Өглөөний цэвэр агаар — өдрийн эрүүл эхлэл'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('walk')}
            className="min-h-[38px] px-3.5 rounded-full bg-amber-300 hover:bg-amber-200 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <Play size={13} fill="currentColor" />
            Гүйх
          </button>
        </div>
      </div>

      {/* Athletic Radial Progress Ring & Running Telemetry Card */}
      <div className="glass-panel rounded-3xl p-4">
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

              {/* Background Track Path */}
              <path
                d={RADIAL_RING_PATH}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Motion-Animated Progress Path */}
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

            {/* Center Ring Percentage & Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <Footprints size={15} className="text-amber-300 mb-0.5" />
              <span className="text-[24px] font-extrabold text-white leading-none tabular-nums">
                {stepProgressPct}%
              </span>
              <span className="text-[10px] font-semibold text-slate-300 mt-1">
                Зорилго
              </span>
            </div>
          </div>

          {/* Right-side Running Metrics */}
          <div className="min-w-0 flex-1 space-y-2.5">
            <div>
              <p className="text-[11px] font-semibold text-slate-300">
                Өнөөдрийн алхам
              </p>
              <p className="text-[24px] font-extrabold text-white leading-tight tabular-nums">
                {steps.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-200 tabular-nums">
                {remainingSteps > 0
                  ? `Үлдсэн: ${remainingSteps.toLocaleString()} / ${stepGoal.toLocaleString()}`
                  : `Зорилго (${stepGoal.toLocaleString()}) биеллээ!`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <Route size={13} className="text-sky-300 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-300 leading-none">Зай</p>
                  <p className="text-xs font-bold text-white tabular-nums mt-0.5">
                    {estimatedKm} км
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame size={13} className="text-amber-300 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-300 leading-none">
                    Илчлэг
                  </p>
                  <p className="text-xs font-bold text-white tabular-nums mt-0.5">
                    {estimatedKcal} ккал
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
