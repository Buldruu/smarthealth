import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Play, Sparkles } from 'lucide-react';
import type { ActivityLevel, AiDailyPlan, ConsentSettings, IntakeAnalysis, UserProfile } from '../types';
import { buildTempDemoIntake, buildTempDemoPlan } from '../utils/demoPlanBuilder';

interface GoalOnboardingProps {
  initialConsent: ConsentSettings;
  onComplete: (profile: UserProfile, plan: AiDailyPlan, consent: ConsentSettings) => void;
}

const SAMPLE_GOALS = [
  'Оройн хоолоо хөнгөлж, 3 сарын дотор 5 кг эрүүлээр хасах, өдөр бүр 8,000 алхам хийх',
  'Ажлын стресс багасгаж, нойроо сайжруулан өглөө эрч хүчтэй сэрдэг болох',
  'Хөдөлгөөнөө нэмж, зүрх судасны тэсвэр сайжруулах, нурууны хөшингө арилгах',
];

export const GoalOnboarding: React.FC<GoalOnboardingProps> = ({ initialConsent, onComplete }) => {
  const [step, setStep] = useState<'goal' | 'details'>('goal');
  const [goalText, setGoalText] = useState('');
  const [intake, setIntake] = useState<IntakeAnalysis | null>(null);
  const [loadingIntake, setLoadingIntake] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [age, setAge] = useState(29);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(72);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [foodPrefs, setFoodPrefs] = useState('Мах, ногоо, сүүн бүтээгдэхүүн, гурил багасгах хүсэлтэй');
  const [allergies, setAllergies] = useState('Байхгүй');
  const [schedule, setSchedule] = useState('Ажлын 09:00–18:00, орой алхах боломжтой');

  const [motionConnected, setMotionConnected] = useState(initialConsent.motionConnected);
  const [locationConsent, setLocationConsent] = useState(initialConsent.locationConsent);
  const [communityJoined, setCommunityJoined] = useState(initialConsent.communityJoined);

  const buildCurrentProfile = (): UserProfile => ({
    name: name.trim() || 'Болд',
    goalText: goalText.trim() || SAMPLE_GOALS[0],
    age: Number(age) || 28,
    heightCm: Number(heightCm) || 170,
    weightKg: Number(weightKg) || 70,
    activityLevel,
    foodPrefs: foodPrefs.trim(),
    allergies: allergies.trim() || 'Байхгүй',
    schedule: schedule.trim(),
  });

  const buildCurrentConsent = (): ConsentSettings => ({
    ...initialConsent,
    motionConnected,
    locationConsent,
    communityJoined,
  });

  const handleAnalyzeGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goalText.trim().length < 4) {
      setError('Та зорилгоо товч боловч тодорхой бичнэ үү.');
      return;
    }
    setError(null);
    setLoadingIntake(true);
    try {
      const res = await fetch('/api/ai/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText: goalText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI шинжилгээ амжилтгүй боллоо.');
      }
      setIntake(data as IntakeAnalysis);
      setStep('details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сервертэй холбогдож чадсангүй.');
    } finally {
      setLoadingIntake(false);
    }
  };

  const handleContinueIntakeDemo = () => {
    const effectiveGoal = goalText.trim() || SAMPLE_GOALS[0];
    if (!goalText.trim()) setGoalText(effectiveGoal);
    setError(null);
    setIntake(buildTempDemoIntake(effectiveGoal));
    setStep('details');
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingPlan(true);

    const profile = buildCurrentProfile();
    const nextConsent = buildCurrentConsent();

    try {
      await fetch('/api/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConsent),
      });

      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI төлөвлөгөө үүсгэхэд алдаа гарлаа.');
      }
      onComplete(profile, data as AiDailyPlan, nextConsent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Төлөвлөгөө үүсгэхэд алдаа гарлаа.');
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleEnterTempDemoPlan = async () => {
    const profile = buildCurrentProfile();
    const nextConsent = buildCurrentConsent();
    setLoadingPlan(true);
    try {
      await fetch('/api/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConsent),
      });
    } catch {
      // Proceed even if consent network fails
    } finally {
      setLoadingPlan(false);
    }
    onComplete(profile, buildTempDemoPlan(profile), nextConsent);
  };

  return (
    <div className="space-y-4 p-4 pb-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative h-36">
          <img
            src="/src/assets/images/ulaanbaatar_walk_hero_1794897099371.jpg"
            alt="Улаанбаатарын өглөөний эрүүл алхалт"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
            <p className="text-[11px] font-semibold text-emerald-300">
              {step === 'goal' ? 'Алхам 1 / 2 · Эрүүл амьдралын зорилго' : 'Алхам 2 / 2 · Хувийн тохиргоо'}
            </p>
            <h1 className="font-display text-xl font-bold leading-tight [text-wrap:balance]">
              {step === 'goal'
                ? 'Та ямар өөрчлөлт хийхийг хүсэж байна вэ?'
                : intake?.focusArea || 'Танд тохирсон төлөвлөгөө'}
            </h1>
          </div>
        </div>
      </div>

      {step === 'goal' ? (
        <form onSubmit={handleAnalyzeGoal} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <label htmlFor="goal-input" className="mb-1.5 block text-xs font-bold text-slate-800">
              Өөрийн үгээр зорилгоо бичээрэй
            </label>
            <textarea
              id="goal-input"
              rows={4}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="Жишээ нь: Оройн хоолоо хөнгөлж, өдөр бүр 8,000 алхаад эрч хүчтэй болох..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />

            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500">Бэлэн жишээнээс сонгох:</p>
              {SAMPLE_GOALS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setGoalText(sample)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="space-y-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={handleContinueIntakeDemo}
                className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Play className="h-3.5 w-3.5" />
                Түр демо горимоор үргэлжлүүлэх
              </button>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loadingIntake}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loadingIntake ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI таны зорилгыг уншиж байна...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Үргэлжлүүлэх
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleContinueIntakeDemo}
              className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Play className="h-3.5 w-3.5 text-emerald-600" />
              Шууд демо горимоор алхам 2 руу орох
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleGeneratePlan} className="space-y-3.5">
          {intake && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-slate-800">
              <p className="font-bold text-emerald-950">{intake.understoodGoal}</p>
              <p className="mt-1 text-slate-700">{intake.encouragement}</p>
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900">Хувийн мэдээлэл</p>
              <button
                type="button"
                onClick={() => setStep('goal')}
                className="text-xs font-semibold text-emerald-700"
              >
                Зорилго засах
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Нэр</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Таны нэр"
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Нас</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="tabular-nums min-h-[42px] w-full rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Өндөр (см)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="tabular-nums min-h-[42px] w-full rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Жин (кг)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="tabular-nums min-h-[42px] w-full rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Хөдөлгөөний түвшин</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="sedentary">Суугаа ажилтай (бага хөдөлгөөн)</option>
                <option value="light">Дунд зэрэг (долоо хоногт 1-2 удаа)</option>
                <option value="moderate">Идэвхтэй (долоо хоногт 3-4 удаа)</option>
                <option value="active">Өндөр идэвхтэй</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Хоолны сонголт</label>
              <input
                type="text"
                value={foodPrefs}
                onChange={(e) => setFoodPrefs(e.target.value)}
                className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Харшил</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Хуваарь</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3.5">
            <p className="text-[11px] font-bold text-slate-800">Өгөгдлийн зөвшөөрөл</p>
            <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={motionConnected}
                onChange={(e) => setMotionConnected(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              <span>Утасны алхалтын өгөгдөл холбох (8,000 алхам = 1 зоос)</span>
            </label>
            <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={locationConsent}
                onChange={(e) => setLocationConsent(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              <span>Ойролцоох дүүргийн бүс хуваалцах (хоёр талын зөвшөөрлөөр)</span>
            </label>
            <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={communityJoined}
                onChange={(e) => setCommunityJoined(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              <span>Community бүлгүүдэд нэгдэх (сонголттой)</span>
            </label>
          </div>

          {error && (
            <div className="space-y-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={handleEnterTempDemoPlan}
                className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Play className="h-3.5 w-3.5" />
                Түр демо төлөвлөгөөгөөр шууд нээх
              </button>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="submit"
              disabled={loadingPlan}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loadingPlan ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Төлөвлөгөө бэлтгэж байна...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  AI төлөвлөгөө авах
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleEnterTempDemoPlan}
              className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Play className="h-3.5 w-3.5 text-emerald-600" />
              Түр демо горимоор шууд апп руу орох
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
