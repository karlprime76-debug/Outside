import type { Plan } from "@/types/plan";

export interface TonightMoment {
  id: string;
  mediaUrl: string;
  caption: string | null;
  author: { name: string | null; username: string | null; image: string | null };
}

export interface TonightUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isVerified: boolean;
  accountKind?: string | null;
  isAmbassador?: boolean;
}

export interface TonightChallenge {
  id: string;
  title: string;
  description: string;
  rewardLabel: string;
}

export interface TonightMission {
  id: string;
  title: string;
  description: string;
  rewardLabel: string;
}

export interface TonightTip {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  mood?: string | null;
}

export interface TonightLive {
  id: string;
  title: string;
  host: { name: string | null; username: string | null; image: string | null };
}

export interface TonightData {
  city: string | null;
  recommendedPlans: Plan[];
  freePlans: Plan[];
  expressPlans: Plan[];
  trendingMoments: TonightMoment[];
  suggestedUsers: TonightUser[];
  dailyChallenge: TonightChallenge | null;
  cityMission: TonightMission | null;
  officialTips: TonightTip[];
  liveSessions: TonightLive[];
}
