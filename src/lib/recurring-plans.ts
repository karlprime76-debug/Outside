import { db } from "@/lib/db";

type Recurrence = "DAILY" | "WEEKLY" | "MONTHLY";

function addDuration(date: Date, recurrence: Recurrence, count: number): Date {
  const d = new Date(date);
  if (recurrence === "DAILY") d.setDate(d.getDate() + count);
  else if (recurrence === "WEEKLY") d.setDate(d.getDate() + 7 * count);
  else if (recurrence === "MONTHLY") d.setMonth(d.getMonth() + count);
  return d;
}

function getEndLimit(recurrence: Recurrence, recurrenceEndDate: Date | null): number {
  if (recurrenceEndDate) return 52;
  if (recurrence === "DAILY") return 7;
  if (recurrence === "WEEKLY") return 4;
  return 3;
}

function occurrencesWithinLimit(
  startDate: Date,
  recurrence: Recurrence,
  recurrenceEndDate: Date | null,
): Date[] {
  const dates: Date[] = [];
  const limit = getEndLimit(recurrence, recurrenceEndDate);
  for (let i = 1; i <= limit; i++) {
    const next = addDuration(startDate, recurrence, i);
    if (recurrenceEndDate && next > recurrenceEndDate) break;
    dates.push(next);
  }
  return dates;
}

export async function generateRecurringPlans(
  planId: string,
  recurrence: Recurrence,
  recurrenceEndDate: string | null,
) {
  const original = await db.plan.findUnique({
    where: { id: planId },
    include: {
      participants: {
        where: { attendance: "GOING", status: "CONFIRMED" },
        select: { userId: true },
      },
    },
  });

  if (!original) return;

  const dates = occurrencesWithinLimit(
    original.startDate,
    recurrence,
    recurrenceEndDate ? new Date(recurrenceEndDate) : null,
  );

  const childData = dates.map((startDate) => ({
    title: original.title,
    description: original.description,
    planCategory: original.planCategory,
    mood: original.mood,
    budgetLevel: original.budgetLevel,
    budgetAmount: original.budgetAmount,
    budgetCurrency: original.budgetCurrency,
    budgetIsFrom: original.budgetIsFrom,
    estimatedCost: original.estimatedCost,
    cityId: original.cityId,
    countryCode: original.countryCode,
    placeId: original.placeId,
    neighborhood: original.neighborhood,
    latitude: original.latitude,
    longitude: original.longitude,
    startDate,
    endDate: original.endDate ? addDuration(original.endDate, recurrence, 1) : null,
    maxParticipants: original.maxParticipants,
    visibility: original.visibility,
    isTravelerFriendly: original.isTravelerFriendly,
    safetyLevel: original.safetyLevel,
    rules: original.rules,
    isExpress: original.isExpress,
    expiresAt: original.expiresAt,
    creatorId: original.creatorId,
    recurrence: null,
    recurrenceEndDate: null,
    parentPlanId: planId,
    status: "ACTIVE" as const,
  }));

  if (childData.length === 0) return;

  await db.plan.createMany({ data: childData });
}
