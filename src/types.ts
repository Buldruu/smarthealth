export type AppTab =
  | 'today'
  | 'ai'
  | 'steps'
  | 'community'
  | 'insurance'
  | 'rewards'
  | 'progress';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

export interface UserProfile {
  name: string;
  goalText: string;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  foodPrefs: string;
  allergies: string;
  schedule: string;
}

export interface IntakeAnalysis {
  understoodGoal: string;
  encouragement: string;
  focusArea: string;
  tailoredQuestions: string[];
}

export type TaskCategory = 'nutrition' | 'movement' | 'hydration' | 'rest';

export interface DailyActionTask {
  id: string;
  category: TaskCategory;
  title: string;
  detail: string;
  done: boolean;
}

export interface AiDailyPlan {
  summary: string;
  encouragement: string;
  actions: DailyActionTask[];
  nutritionNote: string;
  movementNote: string;
  hydrationNote: string;
  restNote: string;
  updatedAt: string;
}

export interface EveningCheckIn {
  id: string;
  date: string;
  energyLevel: number;
  mood: string;
  followedTasksCount: number;
  note: string;
  aiAdjustment: string;
}

export type StepSource = 'apple_health' | 'google_fit' | 'pedometer' | 'manual';

export interface StepBatch {
  batchId: string;
  date: string;
  steps: number;
  source: StepSource;
  verifiedHash: string;
  recordedAt: string;
}

export interface CoinLedgerEntry {
  id: string;
  type: 'earned' | 'spent';
  coins: number;
  title: string;
  detail: string;
  createdAt: string;
}

export type PartnerCategory =
  | 'Фитнес клуб'
  | 'Эмийн сан'
  | 'Спорт заал'
  | 'Эрүүл хоол'
  | 'Амралт рашаан';

export interface PartnerOffer {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCategory: PartnerCategory;
  title: string;
  discountLabel: string;
  requiredCoins: number;
  insuranceFreeEligible?: boolean;
  validUntil: string;
  branch: string;
  terms: string;
  status: 'approved' | 'pending' | 'rejected';
  contractSigned: boolean;
  imageUrl: string;
}

export interface Coupon {
  id: string;
  code: string;
  offerId: string;
  partnerId: string;
  partnerName: string;
  offerTitle: string;
  discountLabel: string;
  branch: string;
  requiredCoins: number;
  redeemedViaInsurance?: boolean;
  insurancePlanName?: string;
  status: 'issued' | 'redeemed' | 'expired';
  issuedAt: string;
  expiresAt: string;
  redeemedAt?: string;
}

export interface InsurancePlan {
  id: string;
  providerName: string;
  planName: string;
  monthlyFeeLabel: string;
  coverageSummary: string;
  freeOfferIds: string[];
}

export interface InsuranceState {
  enrolled: boolean;
  activePlanId: string | null;
  policyNumber: string | null;
  enrolledAt: string | null;
  plans: InsurancePlan[];
}

export interface WalkingGroup {
  id: string;
  name: string;
  goalFocus: string;
  districtZone: string;
  meetingSpot: string;
  memberCount: number;
  joined: boolean;
  weeklyStepsTarget: number;
  currentGroupSteps: number;
}

export interface GroupEvent {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  meetingSpot: string;
  districtZone: string;
  dateTimeLabel: string;
  participants: number;
  joined: boolean;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  targetSteps: number;
  communitySteps: number;
  participantsCount: number;
  joined: boolean;
  endsInLabel: string;
}

export interface NearbyPerson {
  id: string;
  displayName: string;
  goalFocus: string;
  districtZone: string;
  suggestedPublicSpot: string;
  mutualConsent: 'none' | 'pending_incoming' | 'pending_outgoing' | 'connected';
  sharedOptIn: boolean;
  blocked: boolean;
}

export interface EventProposal {
  id: string;
  groupId: string;
  title: string;
  date?: string;
  time?: string;
  dateTimeLabel: string;
  goingCount: number;
  notGoingCount: number;
  myResponse?: 'going' | 'not_going';
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderName: string;
  isMe: boolean;
  text: string;
  sentAt: string;
  eventProposal?: EventProposal;
}

export interface ConsentSettings {
  motionConnected: boolean;
  locationConsent: boolean;
  communityJoined: boolean;
  profileHidden: boolean;
  photoConsent: boolean;
}

export interface ProgressPhoto {
  id: string;
  dataUrl: string;
  caption: string;
  uploadedAt: string;
}

export interface StepWalletState {
  stepsPerCoin: number;
  totalVerifiedSteps: number;
  todaySteps: number;
  remainderSteps: number;
  stepsToNextCoin: number;
  coinsEarned: number;
  coinsSpent: number;
  availableCoins: number;
  pendingCouponCoins: number;
  batches: StepBatch[];
  ledger: CoinLedgerEntry[];
}

export interface BootstrapPayload {
  wallet: StepWalletState;
  offers: PartnerOffer[];
  adminOffers: PartnerOffer[];
  coupons: Coupon[];
  insurance: InsuranceState;
  groups: WalkingGroup[];
  events: GroupEvent[];
  challenge: WeeklyChallenge;
  nearbyPeople: NearbyPerson[];
  messages: ChatMessage[];
  consent: ConsentSettings;
  reportsCount: number;
}
