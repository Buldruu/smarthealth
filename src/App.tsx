import { useCallback, useEffect, useState } from 'react';
import { PhoneMockup } from './components/PhoneMockup';
import { TodayTab } from './components/TodayTab';
import { WalkTab } from './components/WalkTab';
import { CoinsTab } from './components/CoinsTab';
import { DiscountsTab } from './components/DiscountsTab';
import { SettingsTab } from './components/SettingsTab';
import { LoginSection } from './components/LoginSection';
import { UserProfileData } from './components/ProfileSection';
import {
  MANDAALAI_COST,
  MANDAALAI_DISCOUNT_LABEL,
  MAX_DAILY_GAME_COINS,
  MAX_DAILY_GAME_PLAYS,
  MAX_DAILY_WALK_COINS,
  STEPS_PER_COIN,
  TabId,
  VOUCHER_VALID_DAYS,
  Voucher,
} from './constants/smartHealthData';

interface SmartHealthState {
  userName: string | null;
  userContact: string | null;
  city: string;
  bio: string;
  heightCm: string;
  weightKg: string;
  avatarUrl: string | null;
  steps: number;
  stepGoal: number;
  waterGlasses: number;
  bankedWalkCoinsToday: number;
  gameCoinsToday: number;
  gamePlaysUsed: number;
  coins: number;
  vouchers: Voucher[];
}

const STORAGE_KEY = 'smart_health_mongolia_v4';

const INITIAL_STATE: SmartHealthState = {
  userName: null,
  userContact: null,
  city: 'Улаанбаатар · Сүхбаатар',
  bio: 'Өдөр бүр 8,000+ алхам алхаж эрүүл амьдралыг хэвшүүлнэ.',
  heightCm: '170',
  weightKg: '64',
  avatarUrl: null,
  steps: 16200,
  stepGoal: 10000,
  waterGlasses: 5,
  bankedWalkCoinsToday: 2,
  gameCoinsToday: 1,
  gamePlaysUsed: 1,
  coins: 540,
  vouchers: [],
};

function loadState(): SmartHealthState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<SmartHealthState>;
    return {
      userName:
        typeof parsed.userName === 'string' || parsed.userName === null
          ? parsed.userName
          : INITIAL_STATE.userName,
      userContact:
        typeof parsed.userContact === 'string' || parsed.userContact === null
          ? parsed.userContact
          : INITIAL_STATE.userContact,
      city: typeof parsed.city === 'string' ? parsed.city : INITIAL_STATE.city,
      bio: typeof parsed.bio === 'string' ? parsed.bio : INITIAL_STATE.bio,
      heightCm:
        typeof parsed.heightCm === 'string'
          ? parsed.heightCm
          : INITIAL_STATE.heightCm,
      weightKg:
        typeof parsed.weightKg === 'string'
          ? parsed.weightKg
          : INITIAL_STATE.weightKg,
      avatarUrl:
        typeof parsed.avatarUrl === 'string' || parsed.avatarUrl === null
          ? parsed.avatarUrl
          : INITIAL_STATE.avatarUrl,
      steps: typeof parsed.steps === 'number' ? parsed.steps : INITIAL_STATE.steps,
      stepGoal:
        typeof parsed.stepGoal === 'number'
          ? parsed.stepGoal
          : INITIAL_STATE.stepGoal,
      waterGlasses:
        typeof parsed.waterGlasses === 'number'
          ? parsed.waterGlasses
          : INITIAL_STATE.waterGlasses,
      bankedWalkCoinsToday:
        typeof parsed.bankedWalkCoinsToday === 'number'
          ? parsed.bankedWalkCoinsToday
          : INITIAL_STATE.bankedWalkCoinsToday,
      gameCoinsToday:
        typeof parsed.gameCoinsToday === 'number'
          ? parsed.gameCoinsToday
          : INITIAL_STATE.gameCoinsToday,
      gamePlaysUsed:
        typeof parsed.gamePlaysUsed === 'number'
          ? parsed.gamePlaysUsed
          : INITIAL_STATE.gamePlaysUsed,
      coins: typeof parsed.coins === 'number' ? parsed.coins : INITIAL_STATE.coins,
      vouchers: Array.isArray(parsed.vouchers)
        ? parsed.vouchers
        : INITIAL_STATE.vouchers,
    };
  } catch {
    return INITIAL_STATE;
  }
}

function formatDateMn(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [state, setState] = useState<SmartHealthState>(loadState);
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(() =>
    Boolean(loadState().userName)
  );
  const [isWalking, setIsWalking] = useState(false);
  const [showLoginSheet, setShowLoginSheet] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const applySteps = useCallback((delta: number) => {
    setState((prev) => {
      const nextSteps = prev.steps + delta;
      const eligibleWalkCoins = Math.min(
        MAX_DAILY_WALK_COINS,
        Math.floor(nextSteps / STEPS_PER_COIN)
      );
      const newlyEarned = Math.max(
        0,
        eligibleWalkCoins - prev.bankedWalkCoinsToday
      );
      return {
        ...prev,
        steps: nextSteps,
        bankedWalkCoinsToday: eligibleWalkCoins,
        coins: prev.userName ? prev.coins + newlyEarned : prev.coins,
      };
    });
  }, []);

  useEffect(() => {
    if (!isWalking) return;
    const interval = window.setInterval(() => {
      applySteps(120);
    }, 800);
    return () => window.clearInterval(interval);
  }, [isWalking, applySteps]);

  const handleSignIn = useCallback((name: string, contact: string) => {
    setState((prev) => ({
      ...prev,
      userName: name,
      userContact: contact,
    }));
    setHasEnteredApp(true);
    setShowLoginSheet(false);
    setActiveTab('today');
  }, []);

  const handleSaveProfile = useCallback((updated: UserProfileData) => {
    setState((prev) => ({
      ...prev,
      userName: updated.name,
      userContact: updated.contact,
      city: updated.city,
      bio: updated.bio,
      heightCm: updated.heightCm,
      weightKg: updated.weightKg,
      avatarUrl: updated.avatarUrl,
    }));
  }, []);

  const handlePlayResult = useCallback((wonCoin: boolean) => {
    setState((prev) => {
      if (
        !prev.userName ||
        prev.gamePlaysUsed >= MAX_DAILY_GAME_PLAYS ||
        prev.gameCoinsToday >= MAX_DAILY_GAME_COINS
      ) {
        return prev;
      }
      const addCoin =
        wonCoin && prev.gameCoinsToday < MAX_DAILY_GAME_COINS ? 1 : 0;
      return {
        ...prev,
        gamePlaysUsed: prev.gamePlaysUsed + 1,
        gameCoinsToday: prev.gameCoinsToday + addCoin,
        coins: prev.coins + addCoin,
      };
    });
  }, []);

  const handleClaimMandaalai = useCallback(() => {
    setState((prev) => {
      if (!prev.userName || prev.coins < MANDAALAI_COST) return prev;
      const now = new Date();
      const expiry = new Date(
        now.getTime() + VOUCHER_VALID_DAYS * 24 * 60 * 60 * 1000
      );
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const newVoucher: Voucher = {
        id: `${Date.now()}-${randomNum}`,
        code: `MF-${randomNum}`,
        partnerName: 'Мандаалай Фитнесс',
        discountLabel: MANDAALAI_DISCOUNT_LABEL,
        costCoins: MANDAALAI_COST,
        issuedAt: formatDateMn(now),
        expiresAt: formatDateMn(expiry),
      };
      return {
        ...prev,
        coins: prev.coins - MANDAALAI_COST,
        vouchers: [newVoucher, ...prev.vouchers],
      };
    });
  }, []);

  const walkCoinsToday = Math.min(
    MAX_DAILY_WALK_COINS,
    Math.floor(state.steps / STEPS_PER_COIN)
  );

  const profileData: UserProfileData | null = state.userName
    ? {
        name: state.userName,
        contact: state.userContact ?? '',
        city: state.city,
        bio: state.bio,
        heightCm: state.heightCm,
        weightKg: state.weightKg,
        avatarUrl: state.avatarUrl,
      }
    : null;

  const loginOverlay = showLoginSheet ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Аппт нэвтрэх"
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="w-full bg-[#0f172a] rounded-3xl shadow-2xl">
        <LoginSection
          onSignIn={handleSignIn}
          onContinueGuest={() => setShowLoginSheet(false)}
          onClose={() => setShowLoginSheet(false)}
        />
      </div>
    </div>
  ) : null;

  if (!hasEnteredApp) {
    return (
      <PhoneMockup
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hideBottomNav
      >
        <LoginSection
          fullScreen
          onSignIn={handleSignIn}
          onContinueGuest={() => {
            setHasEnteredApp(true);
            setActiveTab('today');
          }}
        />
      </PhoneMockup>
    );
  }

  return (
    <PhoneMockup
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      overlay={loginOverlay}
    >
      {activeTab === 'today' && (
        <TodayTab
          userName={state.userName}
          userContact={state.userContact}
          avatarUrl={state.avatarUrl}
          steps={state.steps}
          stepGoal={state.stepGoal}
          waterGlasses={state.waterGlasses}
          coins={state.coins}
          dailyGameCoins={state.gameCoinsToday}
          onChangeWater={(next) =>
            setState((prev) => ({ ...prev, waterGlasses: next }))
          }
          onChangeGoal={(next) =>
            setState((prev) => ({ ...prev, stepGoal: next }))
          }
          onNavigateTab={setActiveTab}
          onOpenLogin={() => setShowLoginSheet(true)}
        />
      )}

      {activeTab === 'walk' && (
        <WalkTab
          steps={state.steps}
          isWalking={isWalking}
          isSignedIn={Boolean(state.userName)}
          onToggleWalk={() => setIsWalking((w) => !w)}
          onAddSteps={applySteps}
          onGoSignIn={() => setShowLoginSheet(true)}
        />
      )}

      {activeTab === 'coins' && (
        <CoinsTab
          isSignedIn={Boolean(state.userName)}
          coins={state.coins}
          walkCoinsToday={walkCoinsToday}
          dailyGameCoins={state.gameCoinsToday}
          gamePlaysUsed={state.gamePlaysUsed}
          onPlayResult={(won) => handlePlayResult(won)}
          onGoSignIn={() => setShowLoginSheet(true)}
        />
      )}

      {activeTab === 'discounts' && (
        <DiscountsTab
          isSignedIn={Boolean(state.userName)}
          coins={state.coins}
          vouchers={state.vouchers}
          onClaimMandaalai={handleClaimMandaalai}
          onGoSignIn={() => setShowLoginSheet(true)}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          profile={profileData}
          totalSteps={state.steps}
          totalCoins={state.coins}
          onSignIn={handleSignIn}
          onSaveProfile={handleSaveProfile}
          onSignOut={() => {
            setIsWalking(false);
            setState((prev) => ({ ...prev, userName: null, userContact: null }));
            setHasEnteredApp(false);
          }}
          onDeleteAccount={() => {
            setIsWalking(false);
            setState({
              ...INITIAL_STATE,
              steps: 0,
              waterGlasses: 0,
              bankedWalkCoinsToday: 0,
              gameCoinsToday: 0,
              gamePlaysUsed: 0,
              coins: 0,
            });
            setHasEnteredApp(false);
          }}
        />
      )}
    </PhoneMockup>
  );
}
