import React, { useState } from 'react';
import { Check, Droplets, Footprints, Loader2, Moon, Play, RefreshCw, Sparkles, Utensils } from 'lucide-react';
import type { ActivityLevel, AiDailyPlan, EveningCheckIn, UserProfile } from '../types';
import { buildTempDemoCheckIn, buildTempDemoPlan } from '../utils/demoPlanBuilder';

interface AiCoachViewProps {
  profile: UserProfile;
  plan: AiDailyPlan;
  checkIns: EveningCheckIn[];
  onToggleTask: (taskId: string) => void;
  onPlanUpdated: (nextProfile: UserProfile, nextPlan: AiDailyPlan) => void;
  onCheckInCompleted: (record: EveningCheckIn, nextPlan: AiDailyPlan) => void;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  profile,
  plan,
  checkIns,
  onToggleTask,
  onPlanUpdated,
  onCheckInCompleted,
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [regenerating, setRegenerating] = useState(false);

  const [energyLevel, setEnergyLevel] = useState(4);
  const [mood, setMood] = useState('Эерэг, тайван');
  const [note, setNote] = useState('');
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<string | null>(null);

  const followedTasksCount = plan.actions.filter((a) => a.done).length;

  const handleRegeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI зөвлөгөө шинэчлэхэд алдаа гарлаа.');
      }
      onPlanUpdated(draft, data as AiDailyPlan);
      setEditingProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDemoRegenerate = () => {
    setError(null);
    onPlanUpdated(draft, buildTempDemoPlan(draft));
    setEditingProfile(false);
  };

  const handleEveningCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittingCheckIn(true);
    try {
      const res = await fetch('/api/ai/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          currentPlan: plan,
          checkin: {
            energyLevel,
            mood,
            followedTasksCount,
            note,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Оройн дүгнэлт боловсруулахад алдаа гарлаа.');
      }
      onCheckInCompleted(data.checkInRecord as EveningCheckIn, data.nextPlan as AiDailyPlan);
      setLatestFeedback((data.checkInRecord as EveningCheckIn).aiAdjustment);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа.');
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleDemoCheckIn = () => {
    setError(null);
    const { checkInRecord, nextPlan } = buildTempDemoCheckIn(profile, {
      energyLevel,
      mood,
      followedTasksCount,
      note,
    });
    onCheckInCompleted(checkInRecord, nextPlan);
    setLatestFeedback(checkInRecord.aiAdjustment);
    setNote('');
  };

  return (
    <div className="space-y-4 p-4 pb-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-blue-700">Хувийн AI зөвлөх</p>
            <h1 className="font-display text-xl font-bold text-slate-900">Өдөр тутмын зөвлөгөө</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(profile);
              setEditingProfile(!editingProfile);
            }}
            className="min-h-[38px] rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 whitespace-nowrap"
          >
            {editingProfile ? 'Болих' : 'Засах'}
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{plan.summary}</p>

        {editingProfile && (
          <form onSubmit={handleRegeneratePlan} className="mt-3 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <textarea
              rows={2}
              value={draft.goalText}
              onChange={(e) => setDraft({ ...draft, goalText: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={draft.age}
                onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })}
                className="tabular-nums min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 text-xs"
                placeholder="Нас"
              />
              <input
                type="number"
                value={draft.weightKg}
                onChange={(e) => setDraft({ ...draft, weightKg: Number(e.target.value) })}
                className="tabular-nums min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 text-xs"
                placeholder="Жин (кг)"
              />
            </div>
            <select
              value={draft.activityLevel}
              onChange={(e) => setDraft({ ...draft, activityLevel: e.target.value as ActivityLevel })}
              className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs"
            >
              <option value="sedentary">Суугаа</option>
              <option value="light">Дунд зэрэг</option>
              <option value="moderate">Идэвхтэй</option>
              <option value="active">Өндөр идэвхтэй</option>
            </select>
            <input
              type="text"
              value={draft.allergies}
              onChange={(e) => setDraft({ ...draft, allergies: e.target.value })}
              placeholder="Харшил"
              className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={regenerating}
                className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white"
              >
                {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                AI шинэчлэх
              </button>
              <button
                type="button"
                onClick={handleDemoRegenerate}
                className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                Демо
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Utensils className="h-3.5 w-3.5 text-blue-600" />
              Хооллолт
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{plan.nutritionNote}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Footprints className="h-3.5 w-3.5 text-blue-600" />
              Хөдөлгөөн
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{plan.movementNote}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Droplets className="h-3.5 w-3.5 text-blue-600" />
              Ус уух
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{plan.hydrationNote}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Moon className="h-3.5 w-3.5 text-blue-600" />
              Амралт
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{plan.restNote}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-display text-lg font-bold text-slate-900">Хэрэгжүүлэхэд амар 3 дадал</h2>
        <div className="mt-2 divide-y divide-slate-100">
          {plan.actions.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onToggleTask(task.id)}
              className="flex min-h-[52px] w-full items-start gap-3 py-2.5 text-left"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  task.done ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {task.done && <Check className="h-3 w-3" />}
              </span>
              <div>
                <p className={`text-xs font-bold ${task.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                  {task.title}
                </p>
                <p className="text-[11px] text-slate-600">{task.detail}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">Оройн дүгнэлт ба маргааш</h2>
        </div>

        <form onSubmit={handleEveningCheckIn} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Өнөөдрийн эрч хүч ({energyLevel}/5)
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEnergyLevel(lvl)}
                  className={`tabular-nums min-h-[40px] flex-1 rounded-xl border text-xs font-bold ${
                    energyLevel === lvl
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs"
          >
            <option value="Эерэг, тайван">Эерэг, тайван</option>
            <option value="Эрч хүчтэй, урамтай">Эрч хүчтэй, урамтай</option>
            <option value="Бага зэрэг ядарсан">Бага зэрэг ядарсан</option>
            <option value="Стресстэй, завгүй өнгөрлөө">Стресстэй, завгүй өнгөрлөө</option>
          </select>

          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Өдрийн тэмдэглэл..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />

          {error && (
            <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <p>{error}</p>
              <button
                type="button"
                onClick={handleDemoCheckIn}
                className="flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 font-bold text-white"
              >
                <Play className="h-3.5 w-3.5" />
                Түр демо горимоор дүгнэлт авах
              </button>
            </div>
          )}

          {latestFeedback && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950">
              <p className="font-bold">Маргаашийн тохируулга:</p>
              <p className="mt-1">{latestFeedback}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submittingCheckIn}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submittingCheckIn ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Оройн дүгнэлт илгээх'}
            </button>
            <button
              type="button"
              onClick={handleDemoCheckIn}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              Демо
            </button>
          </div>
        </form>

        {checkIns.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-semibold text-slate-500">Сүүлийн дүгнэлтүүд</p>
            {checkIns.slice(0, 2).map((chk) => (
              <div key={chk.id} className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-700">
                <p className="font-semibold text-slate-500">
                  {chk.date} · Эрч хүч {chk.energyLevel}/5
                </p>
                <p className="mt-0.5">{chk.aiAdjustment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
