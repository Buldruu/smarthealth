import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AiDailyPlan,
  BootstrapPayload,
  ChatMessage,
  CoinLedgerEntry,
  ConsentSettings,
  Coupon,
  EveningCheckIn,
  GroupEvent,
  InsurancePlan,
  InsuranceState,
  IntakeAnalysis,
  NearbyPerson,
  PartnerOffer,
  StepBatch,
  StepSource,
  StepWalletState,
  UserProfile,
  WalkingGroup,
  WeeklyChallenge,
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const STEPS_PER_COIN = 8000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY тохируулагдаагүй байна. Settings > Secrets хэсгээс API түлхүүрээ шалгана уу.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateJsonWithFallback(
  ai: GoogleGenAI,
  contents: string,
  systemInstruction: string,
  responseSchema: Record<string, unknown>
): Promise<string> {
  const models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
        if (!isTransient) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI сервер түр ачаалалтай байна.');
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// Compute expected deterministic verification token for authentic device sync simulation
export function computeStepBatchHash(batchId: string, date: string, steps: number, source: string): string {
  return crypto
    .createHash('sha256')
    .update(`vitalx-sensor-v1:${batchId}:${date}:${steps}:${source}`)
    .digest('hex')
    .slice(0, 16);
}

interface ServerStore {
  totalVerifiedSteps: number;
  coinsSpent: number;
  processedBatchIds: Set<string>;
  batches: StepBatch[];
  ledger: CoinLedgerEntry[];
  offers: PartnerOffer[];
  coupons: Coupon[];
  insurance: InsuranceState;
  groups: WalkingGroup[];
  events: GroupEvent[];
  challenge: WeeklyChallenge;
  nearbyPeople: NearbyPerson[];
  messages: ChatMessage[];
  consent: ConsentSettings;
  reports: Array<{ id: string; targetId: string; reason: string; createdAt: string }>;
}

function createInitialStore(): ServerStore {
  const initialBatches: StepBatch[] = [];
  const offers: PartnerOffer[] = [
    {
      id: 'offer-mandaalai-fit',
      partnerId: 'partner-mandaalai',
      partnerName: 'Мандаалай Фитнесс Клуб',
      partnerCategory: 'Фитнес клуб',
      title: 'Сарын гишүүнчлэлийн 30% хөнгөлөлт',
      discountLabel: '30% хөнгөлөлт',
      requiredCoins: 2,
      insuranceFreeEligible: true,
      validUntil: '2026-12-31',
      branch: 'Сүхбаатар дүүрэг, 1-р хороо, Төв салбар',
      terms: '1 удаагийн QR кодоор зөвхөн шинэ эсвэл сунгах гишүүнчлэлд ашиглана. Бусад урамшуулалтай давхардахгүй.',
      status: 'approved',
      contractSigned: true,
      imageUrl: '/src/assets/images/mandaalai_fitness_partner_1794897099910.jpg',
    },
    {
      id: 'offer-monos-vitamin',
      partnerId: 'partner-monos',
      partnerName: 'Монос Эмийн Сан',
      partnerCategory: 'Эмийн сан',
      title: 'Дархлаа дэмжих амин дэмийн багц 20% хөнгөлөлт',
      discountLabel: '20% хөнгөлөлт',
      requiredCoins: 1,
      insuranceFreeEligible: true,
      validUntil: '2026-12-31',
      branch: 'Улаанбаатар хотын бүх салбар',
      terms: 'Витамин D3, Омега-3 болон эрдсийн багцад хүчинтэй. Нэг хэрэглэгч сард 2 удаа ашиглах боломжтой.',
      status: 'approved',
      contractSigned: true,
      imageUrl: '/src/assets/images/mongolia_coin_emblem_1794897100434.jpg',
    },
    {
      id: 'offer-tuv-zaal',
      partnerId: 'partner-sport-hall',
      partnerName: 'Төв Спорт Заал',
      partnerCategory: 'Спорт заал',
      title: 'Багийн заал түрээс болон гүйлтийн зам 25% хөнгөлөлт',
      discountLabel: '25% хөнгөлөлт',
      requiredCoins: 2,
      insuranceFreeEligible: true,
      validUntil: '2026-12-15',
      branch: 'Хан-Уул дүүрэг, 15-р хороо',
      terms: 'Ажлын өдрүүдийн 07:00–17:00 цагийн хооронд урьдчилан цаг авч ашиглана.',
      status: 'approved',
      contractSigned: true,
      imageUrl: '/src/assets/images/mongolia_running_today_1794955600350.jpg',
    },
    {
      id: 'offer-nomin-salad',
      partnerId: 'partner-healthy-food',
      partnerName: 'Органик Шөл ба Салат Бар',
      partnerCategory: 'Эрүүл хоол',
      title: 'Уураглаг үдийн багц 15% хөнгөлөлт',
      discountLabel: '15% хөнгөлөлт',
      requiredCoins: 1,
      insuranceFreeEligible: false,
      validUntil: '2026-12-31',
      branch: 'Баянзүрх дүүрэг, Сансар салбар',
      terms: 'Зөвхөн танхимаар болон авч явах захиалгад купоноо үзүүлж ашиглана.',
      status: 'approved',
      contractSigned: true,
      imageUrl: '/src/assets/images/ulaanbaatar_walk_hero_1794897099371.jpg',
    },
    {
      id: 'offer-uncontracted-draft',
      partnerId: 'partner-pending-spa',
      partnerName: 'Хүслэн Спорт Амралт (Гэрээ хийгдэж буй)',
      partnerCategory: 'Амралт рашаан',
      title: 'Амралтын өдрийн алжаал тайлах хөтөлбөр 35% хөнгөлөлт',
      discountLabel: '35% хөнгөлөлт',
      requiredCoins: 3,
      insuranceFreeEligible: false,
      validUntil: '2026-11-30',
      branch: 'Баянгол дүүрэг, 4-р хороо',
      terms: 'Гэрээ болон админ баталгаажуулалт хийгдсэний дараа нийтлэгдэнэ.',
      status: 'pending',
      contractSigned: false,
      imageUrl: '/src/assets/images/mongolia_trail_map_1794896250866.jpg',
    },
  ];

  const insurancePlans: InsurancePlan[] = [
    {
      id: 'ins-basic-walk',
      providerName: 'Ард Даатгал ХК',
      planName: 'Эрүүл Алхалт Суурь Багц',
      monthlyFeeLabel: '24,000₮ / сар',
      coverageSummary: 'Урьдчилан сэргийлэх үзлэг, витамин ба фитнесс гишүүнчлэлийн хамгаалалт',
      freeOfferIds: ['offer-mandaalai-fit', 'offer-monos-vitamin'],
    },
    {
      id: 'ins-active-plus',
      providerName: 'Мандал Даатгал ХК',
      planName: 'Идэвхтэй Амьдрал Бүтэн Багц',
      monthlyFeeLabel: '42,000₮ / сар',
      coverageSummary: 'Амбулатори, спорт гэмтэл, эмийн сан болон спорт заалны эрхийг бүрэн хамарна',
      freeOfferIds: ['offer-mandaalai-fit', 'offer-monos-vitamin', 'offer-tuv-zaal'],
    },
  ];

  const groups: WalkingGroup[] = [
    {
      id: 'grp-park-morning',
      name: 'Өглөөний Хурдан Алхалт',
      goalFocus: 'Зүрх судас, жин тогтворжуулах',
      districtZone: 'Баянзүрх дүүрэг · Цэцэрлэгт хүрээлэн орчим',
      meetingSpot: 'Үндэсний цэцэрлэгт хүрээлэнгийн Төв хаалга',
      memberCount: 48,
      joined: true,
      weeklyStepsTarget: 350000,
      currentGroupSteps: 264000,
    },
    {
      id: 'grp-healthy-food',
      name: 'Монгол Эрүүл Хоол ба Алхалт',
      goalFocus: 'Зөв хооллолт, өдрийн алхам',
      districtZone: 'Сүхбаатар дүүрэг · Төв талбай орчим',
      meetingSpot: 'Сүхбаатарын талбайн урд цэцэрлэг',
      memberCount: 36,
      joined: false,
      weeklyStepsTarget: 280000,
      currentGroupSteps: 198500,
    },
    {
      id: 'grp-tuul-evening',
      name: 'Туул Голын Оройн Алхагчид',
      goalFocus: 'Стресс тайлах, нойр сайжруулах',
      districtZone: 'Хан-Уул дүүрэг · Зайсан орчим',
      meetingSpot: 'Туул голын гүүрний явган хүний зам',
      memberCount: 29,
      joined: false,
      weeklyStepsTarget: 220000,
      currentGroupSteps: 152300,
    },
  ];

  const events: GroupEvent[] = [
    {
      id: 'evt-1',
      groupId: 'grp-park-morning',
      groupName: 'Өглөөний Хурдан Алхалт',
      title: 'Бямба гарагийн 8,000 алхмын хамтын алхалт',
      meetingSpot: 'Үндэсний цэцэрлэгт хүрээлэнгийн Төв хаалга',
      districtZone: 'Баянзүрх дүүрэг',
      dateTimeLabel: 'Бямба · 08:30',
      participants: 14,
      joined: true,
    },
    {
      id: 'evt-2',
      groupId: 'grp-tuul-evening',
      groupName: 'Туул Голын Оройн Алхагчид',
      title: 'Ажлын дараах 5 км тайван алхалт',
      meetingSpot: 'Туул голын гүүрний явган хүний зам',
      districtZone: 'Хан-Уул дүүрэг',
      dateTimeLabel: 'Лхагва · 18:45',
      participants: 9,
      joined: false,
    },
  ];

  const nearbyPeople: NearbyPerson[] = [
    {
      id: 'usr-anu',
      displayName: 'Анужин Б.',
      goalFocus: 'Эрч хүч нэмэх, өдөр бүр 8,000+ алхах',
      districtZone: 'Баянзүрх дүүрэг (ойролцоох бүс)',
      suggestedPublicSpot: 'Үндэсний цэцэрлэгт хүрээлэнгийн Төв хаалга',
      mutualConsent: 'connected',
      sharedOptIn: true,
      blocked: false,
    },
    {
      id: 'usr-temuulen',
      displayName: 'Тэмүүлэн Э.',
      goalFocus: 'Илүүдэл жинг эрүүл аргаар бууруулах',
      districtZone: 'Сүхбаатар дүүрэг (ойролцоох бүс)',
      suggestedPublicSpot: 'Сүхбаатарын талбайн урд цэцэрлэг',
      mutualConsent: 'pending_incoming',
      sharedOptIn: true,
      blocked: false,
    },
    {
      id: 'usr-sarnai',
      displayName: 'Сарнай Г.',
      goalFocus: 'Нойр сайжруулж орой алхаж хэвших',
      districtZone: 'Хан-Уул дүүрэг (ойролцоох бүс)',
      suggestedPublicSpot: 'Мишээл байгаль орчны цэцэрлэгт хүрээлэн',
      mutualConsent: 'none',
      sharedOptIn: true,
      blocked: false,
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: 'msg-1',
      channelId: 'grp-park-morning',
      senderName: 'Анужин Б.',
      isMe: false,
      text: 'Өглөөний мэнд! Маргааш хамт алхах эвент орууллаа, оролцох эсэхээ дараарай.',
      sentAt: '09:15',
      eventProposal: {
        id: 'prop-initial-1',
        groupId: 'grp-park-morning',
        title: 'Ням гарагийн 10,000 алхмын цайны цагийн алхалт',
        dateTimeLabel: 'Ням · 10:00',
        goingCount: 6,
        notGoingCount: 1,
      },
    },
    {
      id: 'msg-2',
      channelId: 'usr-anu',
      senderName: 'Анужин Б.',
      isMe: false,
      text: 'Сайн уу! Хоёулаа бүсийн зөвшөөрлөөр холбогдлоо. Энэ долоо хоногт хамт алхах цагаа тохирох уу?',
      sentAt: '11:40',
    },
  ];

  return {
    totalVerifiedSteps: 0,
    coinsSpent: 0,
    processedBatchIds: new Set<string>(),
    batches: initialBatches,
    ledger: [],
    offers,
    coupons: [],
    insurance: {
      enrolled: false,
      activePlanId: null,
      policyNumber: null,
      enrolledAt: null,
      plans: insurancePlans,
    },
    groups,
    events,
    challenge: {
      id: 'chal-week-1',
      title: 'Улаанбаатарын 50,000 алхмын долоо хоног',
      description: 'Бүлгийн гишүүд хамтдаа 7 хоногт 50,000 алхамд хүрч эрүүл дадал тогтоох хамтын сорилт.',
      targetSteps: 50000,
      communitySteps: 34200,
      participantsCount: 84,
      joined: true,
      endsInLabel: '3 өдөр үлдлээ',
    },
    nearbyPeople,
    messages,
    consent: {
      motionConnected: true,
      locationConsent: false,
      communityJoined: true,
      profileHidden: false,
      photoConsent: false,
    },
    reports: [],
  };
}

let store = createInitialStore();

function refreshExpiredCoupons() {
  const now = Date.now();
  for (const c of store.coupons) {
    if (c.status === 'issued' && new Date(c.expiresAt).getTime() <= now) {
      c.status = 'expired';
    }
  }
}

function getWalletState(): StepWalletState {
  refreshExpiredCoupons();
  const today = getTodayDateString();
  const todaySteps = store.batches
    .filter((b) => b.date === today)
    .reduce((sum, b) => sum + b.steps, 0);
  const coinsEarned = Math.floor(store.totalVerifiedSteps / STEPS_PER_COIN);
  const remainderSteps = store.totalVerifiedSteps % STEPS_PER_COIN;
  const availableCoins = Math.max(0, coinsEarned - store.coinsSpent);
  const pendingCouponCoins = store.coupons
    .filter((c) => c.status === 'issued')
    .reduce((sum, c) => sum + c.requiredCoins, 0);

  return {
    stepsPerCoin: STEPS_PER_COIN,
    totalVerifiedSteps: store.totalVerifiedSteps,
    todaySteps,
    remainderSteps,
    stepsToNextCoin: remainderSteps === 0 ? STEPS_PER_COIN : STEPS_PER_COIN - remainderSteps,
    coinsEarned,
    coinsSpent: store.coinsSpent,
    availableCoins,
    pendingCouponCoins,
    batches: [...store.batches].reverse(),
    ledger: [...store.ledger].reverse(),
  };
}

function getBootstrapPayload(): BootstrapPayload {
  refreshExpiredCoupons();
  return {
    wallet: getWalletState(),
    offers: store.offers.filter((o) => o.status === 'approved' && o.contractSigned),
    adminOffers: store.offers,
    coupons: [...store.coupons].reverse(),
    insurance: store.insurance,
    groups: store.groups,
    events: store.events,
    challenge: store.challenge,
    nearbyPeople: store.consent.locationConsent
      ? store.nearbyPeople.filter((p) => p.sharedOptIn && !p.blocked)
      : [],
    messages: store.messages,
    consent: store.consent,
    reportsCount: store.reports.length,
  };
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// Bootstrap all non-secret app state
app.get('/api/bootstrap', (_req, res) => {
  res.json(getBootstrapPayload());
});

// 1. AI Goal Intake Analysis ("Та ямар өөрчлөлт хийхийг хүсэж байна вэ?")
app.post('/api/ai/intake', async (req, res) => {
  try {
    const goalText = String(req.body?.goalText || '').trim();
    if (!goalText || goalText.length < 4) {
      return res.status(400).json({ error: 'Та зорилгоо дор хаяж хэдэн үгээр тодорхой бичнэ үү.' });
    }

    const ai = getAiClient();
    const jsonText = await generateJsonWithFallback(
      ai,
      `Хэрэглэгчийн эрүүл амьдралын зорилго: "${goalText}"`,
      'Та бол Монгол хэлтэй, эерэг, шинжлэх ухаанд суурилсан эрүүл амьдралын AI зөвлөх. Хэрэглэгчийн бичсэн зорилгыг ойлгож, дараагийн алхамд ямар хувийн мэдээлэл (нас, жин, өндөр, хөдөлгөөний түвшин, хоолны сонголт, харшил, өдрийн хуваарь) тодруулах нь чухал болохыг Монгол кириллээр ойлгомжтой буцаа. Эмчийн онош тавихгүй, эерэг бодитой өнгө аястай байна.',
      {
        type: Type.OBJECT,
        properties: {
          understoodGoal: {
            type: Type.STRING,
            description: 'Хэрэглэгчийн зорилгыг товч ойлгомжтой нэгтгэсэн өгүүлбэр (Монгол хэлээр)',
          },
          encouragement: {
            type: Type.STRING,
            description: 'Урам өгсөн эерэг мэндчилгээ ба дэмжлэг',
          },
          focusArea: {
            type: Type.STRING,
            description: 'Гол анхаарах чиглэл (жишээ нь: Жин тогтворжуулах, Эрч хүч ба нойр, Зүрх судас ба алхалт)',
          },
          tailoredQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Зорилгод нь тохирсон 3 товч асуулт',
          },
        },
        required: ['understoodGoal', 'encouragement', 'focusArea', 'tailoredQuestions'],
      }
    );

    const parsed = JSON.parse(jsonText || '{}') as IntakeAnalysis;
    return res.json(parsed);
  } catch (err) {
    console.error('AI intake error:', err);
    const rawMsg = err instanceof Error ? err.message : 'AI шинжилгээний алдаа гарлаа.';
    const message = rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')
      ? 'AI сервер түр ачаалалтай (503) байна. Дахин оролдох эсвэл доорх түр демо горимоор шууд үргэлжлүүлж болно.'
      : rawMsg;
    return res.status(502).json({ error: message });
  }
});

// 2. AI Personalized Plan Generation
app.post('/api/ai/plan', async (req, res) => {
  try {
    const profile = req.body?.profile as UserProfile | undefined;
    if (!profile || !profile.goalText?.trim()) {
      return res.status(400).json({ error: 'Хэрэглэгчийн зорилго болон мэдээлэл дутуу байна.' });
    }

    const ai = getAiClient();
    const prompt = `Хэрэглэгчийн мэдээлэл:
- Зорилго: ${profile.goalText}
- Нэр: ${profile.name || 'Хэрэглэгч'}
- Нас: ${profile.age}
- Өндөр: ${profile.heightCm} см
- Жин: ${profile.weightKg} кг
- Хөдөлгөөний түвшин: ${profile.activityLevel}
- Хоолны сонголт: ${profile.foodPrefs || 'Ердийн монгол хоол'}
- Харшил: ${profile.allergies || 'Байхгүй'}
- Өдрийн хуваарь: ${profile.schedule || 'Ажлын 09:00-18:00'}

Монголд олдоцтой хүнсэнд (жишээ нь овъёос/арвай, өөхгүй үхэр болон хонины мах, тахиа, аарц, тараг, бүхэл үрийн талх, ногоон навчит ногоо, лууван, байцаа, чацаргана) тулгуурлан өдөр бүр хэрэгжүүлэхэд амар 3 жижиг үйлдэл болон хооллолт, хөдөлгөөн, ус уух, амралтын товч зөвлөгөө гарга.`;

    const jsonText = await generateJsonWithFallback(
      ai,
      prompt,
      'Та бол Монгол хэлтэй эрүүл амьдралын AI зөвлөх. Бүх хариулт цэвэр Монгол кирилл бичгээр, Монголд бодитоор олдоцтой хоол хүнсэнд тулгуурласан, харшил ба хуваарийг заавал харгалзсан, урам зориг өгсөн өнгө аястай байна. Хүндрэлтэй хэт хатуу дэглэм бүү бич, өдөр бүр хийж чадах 3 жижиг бодитой үйлдэл гарга.',
      {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          encouragement: { type: Type.STRING },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  description: 'Зөвхөн nutrition, movement, hydration, rest гэсэн 4 утгын нэг',
                },
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
              },
              required: ['id', 'category', 'title', 'detail'],
            },
          },
          nutritionNote: { type: Type.STRING },
          movementNote: { type: Type.STRING },
          hydrationNote: { type: Type.STRING },
          restNote: { type: Type.STRING },
        },
        required: [
          'summary',
          'encouragement',
          'actions',
          'nutritionNote',
          'movementNote',
          'hydrationNote',
          'restNote',
        ],
      }
    );

    const raw = JSON.parse(jsonText || '{}') as Omit<AiDailyPlan, 'updatedAt'>;
    const validCategories = new Set(['nutrition', 'movement', 'hydration', 'rest']);
    const actions = (raw.actions || []).slice(0, 3).map((a, idx) => ({
      id: a.id || `task-${Date.now()}-${idx}`,
      category: validCategories.has(a.category) ? a.category : 'movement',
      title: a.title,
      detail: a.detail,
      done: false,
    }));

    const plan: AiDailyPlan = {
      summary: raw.summary,
      encouragement: raw.encouragement,
      actions,
      nutritionNote: raw.nutritionNote,
      movementNote: raw.movementNote,
      hydrationNote: raw.hydrationNote,
      restNote: raw.restNote,
      updatedAt: new Date().toISOString(),
    };
    return res.json(plan);
  } catch (err) {
    console.error('AI plan error:', err);
    const rawMsg = err instanceof Error ? err.message : 'AI төлөвлөгөө үүсгэхэд алдаа гарлаа.';
    const message = rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')
      ? 'AI сервер түр ачаалалтай (503) байна. Дахин оролдох эсвэл доорх түр демо горимоор төлөвлөгөөгөө нээж үзээрэй.'
      : rawMsg;
    return res.status(502).json({ error: message });
  }
});

// 3. Evening Check-in & Next-Day Plan Adjustment
app.post('/api/ai/checkin', async (req, res) => {
  try {
    const { profile, currentPlan, checkin } = req.body as {
      profile: UserProfile;
      currentPlan: AiDailyPlan;
      checkin: { energyLevel: number; mood: string; followedTasksCount: number; note: string };
    };

    if (!profile?.goalText) {
      return res.status(400).json({ error: 'Хэрэглэгчийн зорилго олдсонгүй.' });
    }

    const ai = getAiClient();
    const prompt = `Хэрэглэгчийн оройн дүгнэлт:
- Зорилго: ${profile.goalText}
- Хоолны сонголт/харшил: ${profile.foodPrefs || 'Ердийн'} / ${profile.allergies || 'Байхгүй'}
- Өнөөдөр биелүүлсэн дадал: ${checkin.followedTasksCount} / ${currentPlan?.actions?.length || 3}
- Эрч хүчний үнэлгээ (1-5): ${checkin.energyLevel}
- Сэтгэл санаа: ${checkin.mood}
- Хэрэглэгчийн тэмдэглэл: ${checkin.note || 'Тэмдэглэл бичээгүй'}

Энэ ахицад тохируулан оройн богино дүгнэлт ба маргаашийн 3 жижиг, амар хэрэгжүүлэх зөвлөгөөг шинэчлэн гарга.`;

    const jsonText = await generateJsonWithFallback(
      ai,
      prompt,
      'Та бол Монгол хэлтэй эрүүл амьдралын AI зөвлөх. Хэрэглэгчийн өнөөдрийн биелэлтийг шүүмжлэлгүйгээр дэмжиж, ядарсан бол ачааллыг зөөлрүүлэн, эрч хүчтэй бол бага зэрэг ахиулж маргаашийн Монголд олдоцтой хоол, хөдөлгөөн, амралтын 3 жижиг үйлдлийг санал болго.',
      {
        type: Type.OBJECT,
        properties: {
          aiAdjustment: { type: Type.STRING, description: 'Оройн богино дүгнэлт ба маргаашийн тохируулгын тайлбар' },
          summary: { type: Type.STRING },
          encouragement: { type: Type.STRING },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
              },
              required: ['id', 'category', 'title', 'detail'],
            },
          },
          nutritionNote: { type: Type.STRING },
          movementNote: { type: Type.STRING },
          hydrationNote: { type: Type.STRING },
          restNote: { type: Type.STRING },
        },
        required: [
          'aiAdjustment',
          'summary',
          'encouragement',
          'actions',
          'nutritionNote',
          'movementNote',
          'hydrationNote',
          'restNote',
        ],
      }
    );

    const raw = JSON.parse(jsonText || '{}') as Omit<AiDailyPlan, 'updatedAt'> & {
      aiAdjustment: string;
    };
    const validCategories = new Set(['nutrition', 'movement', 'hydration', 'rest']);
    const nextPlan: AiDailyPlan = {
      summary: raw.summary,
      encouragement: raw.encouragement,
      actions: (raw.actions || []).slice(0, 3).map((a, idx) => ({
        id: a.id || `next-task-${Date.now()}-${idx}`,
        category: validCategories.has(a.category) ? a.category : 'movement',
        title: a.title,
        detail: a.detail,
        done: false,
      })),
      nutritionNote: raw.nutritionNote,
      movementNote: raw.movementNote,
      hydrationNote: raw.hydrationNote,
      restNote: raw.restNote,
      updatedAt: new Date().toISOString(),
    };

    const checkInRecord: EveningCheckIn = {
      id: `chk-${Date.now()}`,
      date: getTodayDateString(),
      energyLevel: checkin.energyLevel,
      mood: checkin.mood,
      followedTasksCount: checkin.followedTasksCount,
      note: checkin.note,
      aiAdjustment: raw.aiAdjustment,
    };

    return res.json({ checkInRecord, nextPlan });
  } catch (err) {
    console.error('AI checkin error:', err);
    const message = err instanceof Error ? err.message : 'Оройн дүгнэлт боловсруулахад алдаа гарлаа.';
    return res.status(502).json({ error: message });
  }
});

// 4. Steps & Coins Sync with Anti-Cheat Protection
app.post('/api/steps/sync', (req, res) => {
  if (!store.consent.motionConnected) {
    return res.status(403).json({
      error: 'Утасны хөдөлгөөний өгөгдөл холбох зөвшөөрөл идэвхгүй байна. Та AI зөвлөх болон Community-г үргэлжлүүлэн ашиглаж болно.',
    });
  }

  const { batchId, date, steps, source, verifiedHash } = req.body as {
    batchId?: string;
    date?: string;
    steps?: number;
    source?: StepSource;
    verifiedHash?: string;
  };

  if (!batchId || !date || typeof steps !== 'number' || !source) {
    return res.status(400).json({ error: 'Алхалтын өгөгдлийн талбарууд дутуу байна.' });
  }

  // Reject manual/fabricated step entries
  if (source === 'manual') {
    return res.status(400).json({
      error: 'Гараар зохиомол алхам оруулах боломжгүй. Зөвхөн баталгаажсан утасны мэдрэгчийн өгөгдлийг хүлээн авна.',
    });
  }

  if (!['apple_health', 'google_fit', 'pedometer'].includes(source)) {
    return res.status(400).json({ error: 'Баталгаажаагүй өгөгдлийн эх үүсвэр байна.' });
  }

  // Reject duplicate batch syncs
  if (store.processedBatchIds.has(batchId)) {
    return res.status(409).json({
      error: 'Энэ алхалтын өгөгдөл аль хэдийн бүртгэгдсэн тул давхар тооцоолохоос хамгааллаа.',
    });
  }

  // Reject impossible single-batch step jumps
  if (!Number.isInteger(steps) || steps <= 0 || steps > 25000) {
    return res.status(400).json({
      error: 'Нэг багц дахь алхмын тоо 1-ээс 25,000 хооронд бүхэл тоо байх ёстой.',
    });
  }

  // Verify sensor payload signature (client device bridge or test helper)
  const expectedHash = computeStepBatchHash(batchId, date, steps, source);
  if (verifiedHash !== expectedHash) {
    return res.status(403).json({
      error: 'Алхалтын баталгаажуулалтын код тохирохгүй байна. Хуурамч өгөгдлөөс хамгаалагдлаа.',
    });
  }

  const prevCoinsEarned = Math.floor(store.totalVerifiedSteps / STEPS_PER_COIN);
  store.processedBatchIds.add(batchId);
  store.totalVerifiedSteps += steps;
  const nextCoinsEarned = Math.floor(store.totalVerifiedSteps / STEPS_PER_COIN);
  const newlyEarnedCoins = nextCoinsEarned - prevCoinsEarned;

  const batch: StepBatch = {
    batchId,
    date,
    steps,
    source,
    verifiedHash,
    recordedAt: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
  };
  store.batches.push(batch);

  if (newlyEarnedCoins > 0) {
    store.ledger.push({
      id: `ldg-${Date.now()}`,
      type: 'earned',
      coins: newlyEarnedCoins,
      title: `${(newlyEarnedCoins * STEPS_PER_COIN).toLocaleString('en-US')} алхмын шагнал`,
      detail: `Нийт баталгаажсан ${store.totalVerifiedSteps.toLocaleString('en-US')} алхамд хүрлээ`,
      createdAt: new Date().toLocaleString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    });
  }

  // Also advance weekly community challenge cleanly
  if (store.challenge.joined) {
    store.challenge.communitySteps += steps;
  }

  return res.json({
    wallet: getWalletState(),
    newlyEarnedCoins,
    challenge: store.challenge,
  });
});

// Helper endpoint for sensor bridge demo: mints a signed verified device batch on the server-trusted sensor simulator
app.post('/api/steps/device-bridge', (req, res) => {
  if (!store.consent.motionConnected) {
    return res.status(403).json({
      error: 'Хөдөлгөөний мэдрэгчийн зөвшөөрөл унтарсан байна.',
    });
  }

  const requestedSteps = Number(req.body?.steps || 4200);
  const source = (req.body?.source as StepSource) || 'apple_health';
  const date = String(req.body?.date || getTodayDateString());
  const batchId = `sensor-${date}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (source === 'manual') {
    return res.status(400).json({ error: 'Гараар алхам нэмэхийг хориглоно.' });
  }
  if (!Number.isInteger(requestedSteps) || requestedSteps <= 0 || requestedSteps > 25000) {
    return res.status(400).json({ error: 'Багцын хэмжээ буруу байна.' });
  }

  const verifiedHash = computeStepBatchHash(batchId, date, requestedSteps, source);
  const prevCoinsEarned = Math.floor(store.totalVerifiedSteps / STEPS_PER_COIN);
  store.processedBatchIds.add(batchId);
  store.totalVerifiedSteps += requestedSteps;
  const nextCoinsEarned = Math.floor(store.totalVerifiedSteps / STEPS_PER_COIN);
  const newlyEarnedCoins = nextCoinsEarned - prevCoinsEarned;

  store.batches.push({
    batchId,
    date,
    steps: requestedSteps,
    source,
    verifiedHash,
    recordedAt: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
  });

  if (newlyEarnedCoins > 0) {
    store.ledger.push({
      id: `ldg-${Date.now()}`,
      type: 'earned',
      coins: newlyEarnedCoins,
      title: `${newlyEarnedCoins} зоос олгогдлоо`,
      detail: `${requestedSteps.toLocaleString('en-US')} алхам баталгаажлаа (үлдэгдэл ${store.totalVerifiedSteps % STEPS_PER_COIN} алхам дараагийн зоос руу шилжсэн)`,
      createdAt: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  if (store.challenge.joined) {
    store.challenge.communitySteps += requestedSteps;
  }

  return res.json({
    wallet: getWalletState(),
    lastBatch: store.batches[store.batches.length - 1],
    newlyEarnedCoins,
    challenge: store.challenge,
  });
});

// 5. Insurance Enrollment & Coupons (Insured members get eligible discounts free with 0 coins)
app.post('/api/insurance/enroll', (req, res) => {
  const { planId, policyInput } = req.body || {};
  const plan = store.insurance.plans.find((p) => p.id === String(planId || ''));
  if (!plan) {
    return res.status(404).json({ error: 'Даатгалын багц олдсонгүй.' });
  }
  const cleanPolicy = String(policyInput || '').trim().toUpperCase();
  store.insurance.enrolled = true;
  store.insurance.activePlanId = plan.id;
  store.insurance.policyNumber =
    cleanPolicy || `VTX-INS-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  store.insurance.enrolledAt = new Date().toLocaleDateString('mn-MN');
  return res.json(getBootstrapPayload());
});

app.post('/api/insurance/cancel', (_req, res) => {
  store.insurance.enrolled = false;
  store.insurance.activePlanId = null;
  store.insurance.policyNumber = null;
  store.insurance.enrolledAt = null;
  return res.json(getBootstrapPayload());
});

app.post('/api/coupons/issue', (req, res) => {
  refreshExpiredCoupons();
  const offerId = String(req.body?.offerId || '');
  const offer = store.offers.find((o) => o.id === offerId);

  if (!offer) {
    return res.status(404).json({ error: 'Санал олдсонгүй.' });
  }
  if (offer.status !== 'approved' || !offer.contractSigned) {
    return res.status(403).json({
      error: 'Гэрээ байгуулагдаж батлагдаагүй түншийн саналаар купон үүсгэх боломжгүй.',
    });
  }

  const activePlan = store.insurance.enrolled
    ? store.insurance.plans.find((p) => p.id === store.insurance.activePlanId)
    : undefined;
  const freeViaInsurance = Boolean(
    activePlan && activePlan.freeOfferIds.includes(offer.id)
  );
  const effectiveRequiredCoins = freeViaInsurance ? 0 : offer.requiredCoins;

  const wallet = getWalletState();
  const effectiveFreeCoins = wallet.availableCoins - wallet.pendingCouponCoins;
  if (!freeViaInsurance && effectiveFreeCoins < effectiveRequiredCoins) {
    return res.status(400).json({
      error: `Зоос хүрэлцэхгүй байна. Танд ${effectiveFreeCoins} боломжит зоос байна (идэвхтэй купонд ${wallet.pendingCouponCoins} зоос захиалагдсан).`,
    });
  }

  const randomCode = `VTX-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const coupon: Coupon = {
    id: `cpn-${Date.now()}`,
    code: randomCode,
    offerId: offer.id,
    partnerId: offer.partnerId,
    partnerName: offer.partnerName,
    offerTitle: offer.title,
    discountLabel: offer.discountLabel,
    branch: offer.branch,
    requiredCoins: effectiveRequiredCoins,
    ...(freeViaInsurance && activePlan
      ? { redeemedViaInsurance: true, insurancePlanName: activePlan.planName }
      : {}),
    status: 'issued',
    issuedAt: new Date().toISOString(),
    expiresAt,
  };
  store.coupons.push(coupon);

  return res.json({
    coupon,
    wallet: getWalletState(),
    coupons: [...store.coupons].reverse(),
  });
});

app.post('/api/partner/coupons/verify', (req, res) => {
  refreshExpiredCoupons();
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: 'Купоны кодыг оруулна уу.' });
  }

  const coupon = store.coupons.find((c) => c.code === code);
  if (!coupon) {
    return res.status(404).json({ error: 'Ийм кодтой купон олдсонгүй.' });
  }
  if (coupon.status === 'redeemed') {
    return res.status(409).json({
      error: `Энэ купон (${coupon.code}) аль хэдийн ${coupon.redeemedAt} цагт ашиглагдсан байна. Дахин ашиглах боломжгүй.`,
    });
  }
  if (coupon.status === 'expired' || new Date(coupon.expiresAt).getTime() <= Date.now()) {
    coupon.status = 'expired';
    return res.status(410).json({ error: 'Энэ купоны хүчинтэй хугацаа дууссан байна.' });
  }

  const wallet = getWalletState();
  if (coupon.requiredCoins > 0 && wallet.availableCoins < coupon.requiredCoins) {
    return res.status(400).json({ error: 'Хэрэглэгчийн зоосны үлдэгдэл хүрэлцэхгүй байна.' });
  }

  coupon.status = 'redeemed';
  coupon.redeemedAt = new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
  if (coupon.requiredCoins > 0) {
    store.coinsSpent += coupon.requiredCoins;
    store.ledger.push({
      id: `ldg-spend-${Date.now()}`,
      type: 'spent',
      coins: coupon.requiredCoins,
      title: `${coupon.partnerName} — баталгаажсан купон`,
      detail: `${coupon.code} (${coupon.discountLabel}) түншээр баталгаажлаа`,
      createdAt: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  return res.json({
    verifiedCoupon: coupon,
    wallet: getWalletState(),
    coupons: [...store.coupons].reverse(),
  });
});

// Mark coupon expired (for testing invalid/expired state safely)
app.post('/api/coupons/:id/expire', (req, res) => {
  const coupon = store.coupons.find((c) => c.id === req.params.id);
  if (!coupon) {
    return res.status(404).json({ error: 'Купон олдсонгүй.' });
  }
  if (coupon.status === 'redeemed') {
    return res.status(400).json({ error: 'Аль хэдийн ашиглагдсан купон.' });
  }
  coupon.status = 'expired';
  coupon.expiresAt = new Date(Date.now() - 1000).toISOString();
  return res.json({
    wallet: getWalletState(),
    coupons: [...store.coupons].reverse(),
  });
});

// Partner submits new offer (always starts pending until Admin approves)
app.post('/api/partner/offers', (req, res) => {
  const {
    partnerName,
    partnerCategory,
    title,
    discountLabel,
    requiredCoins,
    insuranceFreeEligible,
    validUntil,
    branch,
    terms,
  } = req.body || {};
  if (!partnerName || !title || !discountLabel || !requiredCoins || !branch) {
    return res.status(400).json({ error: 'Түншийн саналын мэдээллийг бүрэн бөглөнө үү.' });
  }

  const newOffer: PartnerOffer = {
    id: `offer-${Date.now()}`,
    partnerId: `partner-${Date.now()}`,
    partnerName: String(partnerName).trim(),
    partnerCategory: partnerCategory || 'Фитнес клуб',
    title: String(title).trim(),
    discountLabel: String(discountLabel).trim(),
    requiredCoins: Math.max(1, Number(requiredCoins)),
    insuranceFreeEligible: Boolean(insuranceFreeEligible),
    validUntil: String(validUntil || '2026-12-31'),
    branch: String(branch).trim(),
    terms: String(terms || '1 удаагийн QR кодоор салбар дээр баталгаажуулж ашиглана.').trim(),
    status: 'pending',
    contractSigned: false,
    imageUrl: '/src/assets/images/mandaalai_fitness_partner_1794897099910.jpg',
  };
  store.offers.unshift(newOffer);
  return res.json(getBootstrapPayload());
});

// Admin approves or rejects partner + offer
app.post('/api/admin/offers/:id/decision', (req, res) => {
  const offer = store.offers.find((o) => o.id === req.params.id);
  if (!offer) {
    return res.status(404).json({ error: 'Түншийн санал олдсонгүй.' });
  }
  const decision = req.body?.decision as 'approved' | 'rejected' | 'pending';
  if (!['approved', 'rejected', 'pending'].includes(decision)) {
    return res.status(400).json({ error: 'Буруу шийдвэрийн төлөв.' });
  }
  offer.status = decision;
  offer.contractSigned = decision === 'approved';
  if (decision === 'approved' && offer.insuranceFreeEligible) {
    const plusPlan = store.insurance.plans.find((p) => p.id === 'ins-active-plus');
    if (plusPlan && !plusPlan.freeOfferIds.includes(offer.id)) {
      plusPlan.freeOfferIds.push(offer.id);
    }
  }
  return res.json(getBootstrapPayload());
});

// 6. Community, Groups, Events, Mutual Nearby & Safety
app.post('/api/community/groups/:id/toggle', (req, res) => {
  const grp = store.groups.find((g) => g.id === req.params.id);
  if (!grp) {
    return res.status(404).json({ error: 'Бүлэг олдсонгүй.' });
  }
  grp.joined = !grp.joined;
  grp.memberCount += grp.joined ? 1 : -1;
  return res.json({ groups: store.groups });
});

app.post('/api/community/events', (req, res) => {
  const { groupId, title, meetingSpot, districtZone, dateTimeLabel } = req.body || {};
  if (!title || !meetingSpot || !dateTimeLabel) {
    return res.status(400).json({ error: 'Арга хэмжээний нэр, нийтийн цэг болон цагийг оруулна уу.' });
  }
  const grp = store.groups.find((g) => g.id === groupId) || store.groups[0];
  const evt: GroupEvent = {
    id: `evt-${Date.now()}`,
    groupId: grp.id,
    groupName: grp.name,
    title: String(title).trim(),
    meetingSpot: String(meetingSpot).trim(),
    districtZone: String(districtZone || 'Улаанбаатар хот (нийтийн бүс)').trim(),
    dateTimeLabel: String(dateTimeLabel).trim(),
    participants: 1,
    joined: true,
  };
  store.events.unshift(evt);
  return res.json({ events: store.events });
});

app.post('/api/community/events/:id/rsvp', (req, res) => {
  const evt = store.events.find((e) => e.id === req.params.id);
  if (!evt) {
    return res.status(404).json({ error: 'Арга хэмжээ олдсонгүй.' });
  }
  evt.joined = !evt.joined;
  evt.participants += evt.joined ? 1 : -1;
  return res.json({ events: store.events });
});

app.post('/api/community/challenge/toggle', (_req, res) => {
  store.challenge.joined = !store.challenge.joined;
  store.challenge.participantsCount += store.challenge.joined ? 1 : -1;
  return res.json({ challenge: store.challenge });
});

app.post('/api/community/nearby/:id/connect', (req, res) => {
  if (!store.consent.locationConsent || store.consent.profileHidden) {
    return res.status(403).json({
      error: 'Ойролцоох хүмүүстэй холбогдохын тулд бүсийн зөвшөөрлөө нээж, профайлаа ил харагдах төлөвт оруулна уу.',
    });
  }
  const person = store.nearbyPeople.find((p) => p.id === req.params.id);
  if (!person || person.blocked) {
    return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй.' });
  }

  if (person.mutualConsent === 'pending_incoming') {
    person.mutualConsent = 'connected';
  } else if (person.mutualConsent === 'none') {
    // Only transitions to outgoing request until other side also consents
    person.mutualConsent = 'pending_outgoing';
  }
  return res.json({
    nearbyPeople: store.nearbyPeople.filter((p) => p.sharedOptIn && !p.blocked),
  });
});

app.post('/api/community/chat', (req, res) => {
  const { channelId, senderName, text, proposal } = req.body || {};
  const targetChannel = String(channelId || '');
  const group = store.groups.find((g) => g.id === targetChannel);
  const friend = store.nearbyPeople.find((p) => p.id === targetChannel && p.mutualConsent === 'connected');

  if (group && !group.joined) {
    return res.status(403).json({
      error: 'Энэ бүлгийн чатад бичихийн тулд эхлээд бүлэгт нэгдэнэ үү.',
    });
  }

  if (!group && !friend) {
    return res.status(403).json({
      error: 'Энэ чатад бичих зөвшөөрөлгүй байна.',
    });
  }

  const trimmedText = String(text || '').trim();
  const hasProposal = Boolean(proposal && String(proposal.title || '').trim());

  if (!targetChannel || (!trimmedText && !hasProposal)) {
    return res.status(400).json({ error: 'Зурвас эсвэл арга хэмжээний санаа хоосон байж болохгүй.' });
  }

  const propDate = proposal?.date ? String(proposal.date).trim() : '';
  const propTime = proposal?.time ? String(proposal.time).trim() : '';
  const computedLabel =
    String(proposal?.dateTimeLabel || '').trim() ||
    (propDate && propTime ? `${propDate} · ${propTime}` : propDate || propTime || 'Маргааш · 09:00');

  const msg: ChatMessage = {
    id: `msg-${Date.now()}`,
    channelId: targetChannel,
    senderName: String(senderName || 'Та'),
    isMe: true,
    text: trimmedText || `Эвент үүсгэлээ: ${String(proposal.title).trim()}`,
    sentAt: new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }),
    ...(hasProposal
      ? {
          eventProposal: {
            id: `prop-${Date.now()}`,
            groupId: group?.id || targetChannel,
            title: String(proposal.title).trim(),
            ...(propDate ? { date: propDate } : {}),
            ...(propTime ? { time: propTime } : {}),
            dateTimeLabel: computedLabel,
            goingCount: 1,
            notGoingCount: 0,
            myResponse: 'going' as const,
          },
        }
      : {}),
  };

  store.messages.push(msg);
  return res.json({ messages: store.messages, createdMessageId: msg.id });
});

app.post('/api/community/chat/:messageId/rsvp', (req, res) => {
  const msg = store.messages.find((m) => m.id === req.params.messageId);
  if (!msg || !msg.eventProposal) {
    return res.status(404).json({ error: 'Эвент олдсонгүй.' });
  }
  const choice = req.body?.response as 'going' | 'not_going';
  if (choice !== 'going' && choice !== 'not_going') {
    return res.status(400).json({ error: 'Сонголт буруу байна.' });
  }

  const prop = msg.eventProposal;
  const prev = prop.myResponse;

  if (prev === 'going') prop.goingCount = Math.max(0, prop.goingCount - 1);
  if (prev === 'not_going') prop.notGoingCount = Math.max(0, prop.notGoingCount - 1);

  if (prev === choice) {
    prop.myResponse = undefined;
  } else {
    prop.myResponse = choice;
    if (choice === 'going') prop.goingCount += 1;
    if (choice === 'not_going') prop.notGoingCount += 1;
  }

  return res.json({ messages: store.messages });
});

app.post('/api/community/block', (req, res) => {
  const person = store.nearbyPeople.find((p) => p.id === req.body?.personId);
  if (!person) {
    return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй.' });
  }
  person.blocked = true;
  person.mutualConsent = 'none';
  return res.json({
    nearbyPeople: store.consent.locationConsent
      ? store.nearbyPeople.filter((p) => p.sharedOptIn && !p.blocked)
      : [],
  });
});

app.post('/api/community/report', (req, res) => {
  const { targetId, reason } = req.body || {};
  if (!targetId || !reason) {
    return res.status(400).json({ error: 'Зөрчлийн шалтгааныг сонгоно уу.' });
  }
  store.reports.push({
    id: `rep-${Date.now()}`,
    targetId: String(targetId),
    reason: String(reason),
    createdAt: new Date().toISOString(),
  });
  return res.json({ reportsCount: store.reports.length });
});

// 7. Consent & Complete Data Deletion
app.post('/api/user/consent', (req, res) => {
  const patch = (req.body || {}) as Partial<ConsentSettings>;
  store.consent = {
    ...store.consent,
    ...patch,
  };
  return res.json(getBootstrapPayload());
});

app.delete('/api/user/all', (_req, res) => {
  store = createInitialStore();
  return res.json(getBootstrapPayload());
});

// Mount Vite dev middleware or serve static build
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Health Mongolia server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
