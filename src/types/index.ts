import { UserRole, BudgetLevel, Mood, PlanVisibility, PlanStatus, PlaceCategory, SafetyLevel, ReportStatus, ReportReason, ParticipantStatus } from "@prisma/client";

export type { User, City, Place, Plan, PlanParticipant, PlanMessage, Report, UserBlock, UserVisitedCity } from "@prisma/client";

export { UserRole, BudgetLevel, Mood, PlanVisibility, PlanStatus, PlaceCategory, SafetyLevel, ReportStatus, ReportReason, ParticipantStatus };

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface PlanFilters {
  cityId?: string;
  mood?: Mood;
  budgetLevel?: BudgetLevel;
  category?: PlaceCategory;
  dateFrom?: Date;
  dateTo?: Date;
  isTravelerFriendly?: boolean;
  searchQuery?: string;
}

export interface CreatePlanInput {
  title: string;
  description?: string;
  category: PlaceCategory;
  mood: Mood;
  budgetLevel: BudgetLevel;
  estimatedCost?: number;
  cityId: string;
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
