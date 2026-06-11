import { UserRole, BudgetLevel, Mood, PlanVisibility, PlanStatus, PlaceCategory, PlanCategory, SafetyLevel, ReportStatus, ReportReason, ParticipantStatus, PlanPriceType } from "@prisma/client";

export type { User, City, Place, Plan, PlanParticipant, PlanMessage, Report, UserBlock, UserVisitedCity } from "@prisma/client";

export { UserRole, BudgetLevel, Mood, PlanVisibility, PlanStatus, PlaceCategory, PlanCategory, SafetyLevel, ReportStatus, ReportReason, ParticipantStatus, PlanPriceType };

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface PlanFilters {
  cityId?: string;
  mood?: Mood;
  priceType?: PlanPriceType;
  budgetLevel?: BudgetLevel;
  planCategory?: PlanCategory;
  dateFrom?: Date;
  dateTo?: Date;
  isTravelerFriendly?: boolean;
  searchQuery?: string;
  isFree?: boolean;
}

export interface CreatePlanInput {
  title: string;
  description?: string;
  planCategory: PlanCategory;
  mood: Mood;
  priceType?: PlanPriceType;
  budgetLevel: BudgetLevel;
  budgetAmount?: number;
  budgetCurrency?: string;
  budgetIsFrom?: boolean;
  estimatedCost?: number;
  cityId: string;
  countryCode?: string;
  placeId?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  startDate: Date;
  endDate?: Date;
  maxParticipants: number;
  visibility: PlanVisibility;
  isTravelerFriendly?: boolean;
  safetyLevel: SafetyLevel;
  rules?: string;
  isOfficial?: boolean;
  ticketPrice?: number;
  bookingUrl?: string;
}

export interface UpdateProfileInput {
  name?: string;
  username?: string;
  bio?: string;
  homeCityId?: string;
  neighborhood?: string;
  language?: string;
  preferredBudget?: BudgetLevel;
  preferredMoods?: Mood[];
  isAvailable?: boolean;
  image?: string;
}
