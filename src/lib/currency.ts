export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  BJ: "XOF",
  CI: "XOF",
  SN: "XOF",
  BF: "XOF",
  TG: "XOF",
  ML: "XOF",
  NE: "XOF",
  GW: "XOF",
  FR: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  PT: "EUR",
  BE: "EUR",
  NL: "EUR",
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  NG: "NGN",
  GH: "GHS",
  MA: "MAD",
  CM: "XAF",
  GA: "XAF",
  CG: "XAF",
  TD: "XAF",
  CF: "XAF",
  GQ: "XAF",
  CD: "CDF",
  ZA: "ZAR",
  KE: "KES",
  TZ: "TZS",
  UG: "UGX",
  RW: "RWF",
  ET: "ETB",
  EG: "EGP",
  TN: "TND",
  DZ: "DZD",
  LY: "LYD",
  MR: "MRU",
  GM: "GMD",
  SL: "SLL",
  LR: "LRD",
  GN: "GNF",
};

export const SUPPORTED_CURRENCIES = Array.from(new Set(Object.values(COUNTRY_CURRENCY_MAP))).sort();

export function getCurrencyForCountry(countryCode?: string | null): string {
  if (!countryCode) return "XOF";
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] || "XOF";
}

export function getDefaultCurrencyForUser(user?: { countryCode?: string | null } | null): string {
  if (user?.countryCode) return getCurrencyForCountry(user.countryCode);
  return "XOF";
}

export function formatMoney(amount: number, currency: string, locale = "fr-FR"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export { formatMoney as formatCurrency };

export function formatBudget(
  amount?: unknown,
  currency?: string | null,
  isFrom = false,
  priceType?: string | null
): string {
  const effectivePriceType = priceType || (isFrom ? "FROM" : null);
  if (effectivePriceType === "FREE") {
    return "Gratuit";
  }
  if (amount === null || amount === undefined) {
    if (effectivePriceType === "PAID") return "Payant";
    if (effectivePriceType === "FROM") return "À partir de";
    return "Gratuit";
  }
  const num = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(num) || num === 0) {
    return "Gratuit";
  }
  const formatted = formatMoney(num, currency || "XOF");
  return effectivePriceType === "FROM" ? `À partir de ${formatted}` : formatted;
}
