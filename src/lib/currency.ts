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

export function getCurrencyForCountry(countryCode?: string | null): string {
  if (!countryCode) return "XOF";
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] || "XOF";
}

export function formatCurrency(amount: number, currency: string, locale = "fr-FR"): string {
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

export function formatBudget(amount?: unknown, currency?: string | null, isFrom = false): string {
  if (amount === null || amount === undefined) {
    return "Gratuit";
  }
  const num = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(num) || num === 0) {
    return "Gratuit";
  }
  const formatted = formatCurrency(num, currency || "XOF");
  return isFrom ? `À partir de ${formatted}` : formatted;
}
