export interface Plan {
  id: string;
  title: string;
  mood: string;
  planCategory: string;
  priceType?: string;
  budgetLevel: string;
  budgetAmount: unknown;
  budgetCurrency: string | null;
  budgetIsFrom: boolean;
  startDate: string;
  maxParticipants: number;
  status: string;
  isCommunityConfirmed?: boolean;
  city: { name: string };
  creator: { id?: string; name: string | null; username?: string | null; image?: string | null };
  _count: { participants: number; going?: number; maybe?: number };
}
