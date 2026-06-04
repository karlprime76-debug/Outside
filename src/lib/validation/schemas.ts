import { z } from "zod";
import { BudgetLevel, Mood, PlanVisibility, PlanCategory, SafetyLevel } from "@/types";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères").max(30).regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et underscore uniquement"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  countryCode: z.string().length(2, "Code pays invalide"),
  country: z.string().optional(),
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
  bio: z.string().max(160, "Bio trop longue").optional(),
  neighborhood: z.string().optional(),
  preferredBudget: z.nativeEnum(BudgetLevel).optional(),
  preferredMoods: z.array(z.nativeEnum(Mood)).optional(),
  language: z.string().default("fr"),
});

export const createPlanSchema = z.object({
  title: z.string().min(3, "Titre trop court").max(100),
  description: z.string().max(500).optional(),
  planCategory: z.nativeEnum(PlanCategory),
  mood: z.nativeEnum(Mood),
  budgetLevel: z.nativeEnum(BudgetLevel).optional(),
  budgetAmount: z.number().nonnegative().optional(),
  budgetCurrency: z.string().optional(),
  budgetIsFrom: z.boolean().default(false),
  estimatedCost: z.number().nonnegative().optional(),
  cityId: z.string().min(1),
  countryCode: z.string().optional(),
  placeId: z.string().optional(),
  neighborhood: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  maxParticipants: z.number().int().min(2).max(100).default(10),
  visibility: z.nativeEnum(PlanVisibility).default(PlanVisibility.PUBLIC),
  isTravelerFriendly: z.boolean().default(false),
  safetyLevel: z.nativeEnum(SafetyLevel).default(SafetyLevel.MEDIUM),
  rules: z.string().max(500).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(160).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  homeCityId: z.string().optional(),
  neighborhood: z.string().optional(),
  language: z.string().optional(),
  preferredBudget: z.nativeEnum(BudgetLevel).optional(),
  preferredMoods: z.array(z.nativeEnum(Mood)).optional(),
  isAvailable: z.boolean().optional(),
  birthDate: z.string().optional(),
});

export const reportSchema = z.object({
  reason: z.enum(["INAPPROPRIATE_CONTENT", "HARASSMENT", "SPAM", "FAKE_PROFILE", "DANGEROUS_PLAN", "UNDERAGE", "OTHER"]),
  description: z.string().max(1000).optional(),
  reportedUserId: z.string().optional(),
  planId: z.string().optional(),
  placeId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
