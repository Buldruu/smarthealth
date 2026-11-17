export type TabId = 'today' | 'walk' | 'coins' | 'discounts' | 'settings';

export const STEPS_PER_COIN = 8000;
export const MAX_DAILY_WALK_COINS = 5;
export const MAX_DAILY_GAME_PLAYS = 5;
export const MAX_DAILY_GAME_COINS = 5;

export const MANDAALAI_COST = 500;
export const MANDAALAI_DISCOUNT_LABEL = '40% хөнгөлөлт';
export const VOUCHER_VALID_DAYS = 7;

export const WALK_HERO_IMG = '/src/assets/images/ulaanbaatar_walk_hero_1794897099371.jpg';
export const MANDAALAI_IMG = '/src/assets/images/mandaalai_fitness_partner_1794897099910.jpg';
export const COIN_EMBLEM_IMG = '/src/assets/images/mongolia_coin_emblem_1794897100434.jpg';

export interface Voucher {
  id: string;
  code: string;
  partnerName: string;
  discountLabel: string;
  costCoins: number;
  issuedAt: string;
  expiresAt: string;
}

export interface TabItem {
  id: TabId;
  label: string;
}

export const APP_TABS: TabItem[] = [
  { id: 'today', label: 'Өнөөдөр' },
  { id: 'walk', label: 'Алхалт' },
  { id: 'coins', label: 'Зоос' },
  { id: 'discounts', label: 'Хөнгөлөлт' },
  { id: 'settings', label: 'Тохиргоо' },
];
