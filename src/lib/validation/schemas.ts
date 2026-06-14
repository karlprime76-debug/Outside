import { z } from "zod";
import { BudgetLevel, Mood, PlanVisibility, PlanCategory, SafetyLevel, PlanPriceType, PlanStatus } from "@/types";
import { LiveStatus, LiveVisibility, MomentVisibility } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères").max(30).regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et underscore uniquement"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"),
  confirmPassword: z.string(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).nullish(),
  countryCode: z.string().length(2, "Code pays invalide"),
  country: z.string().nullish(),
  homeCity: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  homeCityLat: z.number().nullish(),
  homeCityLng: z.number().nullish(),
  birthDate: z.string().min(1, "La date de naissance est requise"),
  acceptTerms: z.boolean().refine((v) => v === true, { message: "Tu dois accepter les Conditions et la Politique de confidentialité" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const onboardingSchema = z.object({
  bio: z.string().max(160, "Bio trop longue").nullish(),
  neighborhood: z.string().nullish(),
  preferredBudget: z.nativeEnum(BudgetLevel).nullish(),
  preferredMoods: z.array(z.nativeEnum(Mood)).nullish(),
  language: z.string().default("fr"),
});

export const createPlanSchema = z.object({
  title: z.string().min(3, "Titre trop court").max(100),
  description: z.string().max(500).nullish(),
  planCategory: z.nativeEnum(PlanCategory),
  mood: z.nativeEnum(Mood),
  priceType: z.nativeEnum(PlanPriceType).nullish(),
  budgetLevel: z.nativeEnum(BudgetLevel).nullish(),
  budgetAmount: z.number().nonnegative().nullish(),
  budgetCurrency: z.string().nullish(),
  budgetIsFrom: z.boolean().default(false),
  estimatedCost: z.number().nonnegative().nullish(),
  cityId: z.string().min(1),
  countryCode: z.string().nullish(),
  placeId: z.string().nullish(),
  neighborhood: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullish(),
  maxParticipants: z.number().int().min(2).max(100).default(10),
  visibility: z.nativeEnum(PlanVisibility).default(PlanVisibility.PUBLIC),
  isTravelerFriendly: z.boolean().default(false),
  safetyLevel: z.nativeEnum(SafetyLevel).default(SafetyLevel.MEDIUM),
  rules: z.string().max(500).nullish(),
  circleId: z.string().nullish(),
  isOfficial: z.boolean().nullish(),
  ticketPrice: z.number().nonnegative().nullish(),
  bookingUrl: z.string().url("URL de réservation invalide").nullish().or(z.literal("")),
  recurrence: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).nullish(),
  recurrenceEndDate: z.string().datetime().nullish(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).nullish(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).nullish(),
  bio: z.string().max(160).nullish(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).nullish(),
  homeCityId: z.string().nullish(),
  neighborhood: z.string().nullish(),
  language: z.string().nullish(),
  preferredBudget: z.nativeEnum(BudgetLevel).nullish(),
  preferredMoods: z.array(z.nativeEnum(Mood)).nullish(),
  isAvailable: z.boolean().nullish(),
  birthDate: z.string().nullish(),
});

export const reportSchema = z.object({
  reason: z.enum(["INAPPROPRIATE_CONTENT", "HARASSMENT", "SPAM", "FAKE_PROFILE", "DANGEROUS_PLAN", "UNDERAGE", "OTHER"]),
  description: z.string().max(1000).nullish(),
  reportedUserId: z.string().nullish(),
  planId: z.string().nullish(),
  placeId: z.string().nullish(),
});

export const updatePlanSchema = z.object({
  title: z.string().min(3).max(100).nullish(),
  description: z.string().max(500).nullish(),
  status: z.nativeEnum(PlanStatus).nullish(),
  maxParticipants: z.number().int().min(2).max(100).nullish(),
  visibility: z.nativeEnum(PlanVisibility).nullish(),
  startDate: z.string().datetime().nullish(),
  endDate: z.string().datetime().nullish(),
  isOfficial: z.boolean().nullish(),
  ticketPrice: z.number().nonnegative().nullish(),
  bookingUrl: z.string().url("URL de réservation invalide").nullish().or(z.literal("")),
});

export const createLiveSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).nullish(),
  visibility: z.nativeEnum(LiveVisibility).nullish(),
  planId: z.string().nullish(),
  eventId: z.string().nullish(),
  placeId: z.string().nullish(),
  city: z.string().nullish(),
  country: z.string().nullish(),
  countryCode: z.string().nullish(),
  status: z.enum(["LIVE", "SCHEDULED"]).nullish(),
});

export const updateLiveSchema = z.object({
  title: z.string().min(2).max(100).nullish(),
  description: z.string().max(500).nullish(),
  visibility: z.nativeEnum(LiveVisibility).nullish(),
  status: z.nativeEnum(LiveStatus).nullish(),
});

export const createMomentSchema = z.object({
  caption: z.string().max(500).nullish(),
  visibility: z.nativeEnum(MomentVisibility).nullish(),
  city: z.string().nullish(),
  countryCode: z.string().nullish(),
  planId: z.string().nullish(),
  placeId: z.string().nullish(),
  eventId: z.string().nullish(),
  liveId: z.string().nullish(),
  expiresIn: z.enum(["1h", "3h", "24h", "7d"]).nullish(),
  audioTrackId: z.string().uuid().nullish(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateLiveInput = z.infer<typeof createLiveSchema>;
export type UpdateLiveInput = z.infer<typeof updateLiveSchema>;
export type CreateMomentInput = z.infer<typeof createMomentSchema>;

export const stripeCheckoutSchema = z.object({
  planId: z.string().min(1, "Plan ID requis"),
});

export const followSchema = z.object({
  userId: z.string().min(1, "userId requis"),
  momentId: z.string().nullish(),
});

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string()).nullish(),
});

export const createReportSchema = z.object({
  targetType: z.enum(["USER", "MOMENT", "DIRECT_MESSAGE", "PLAN", "LIVE", "COMMENT", "AUDIO_TRACK"]),
  targetId: z.string().min(1, "targetId requis"),
  reason: z.enum(["INAPPROPRIATE_CONTENT", "HARASSMENT", "SPAM", "FAKE_PROFILE", "DANGEROUS_PLAN", "UNDERAGE", "OTHER"]),
  description: z.string().max(1000).nullish(),
});
