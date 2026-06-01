import { Dictionary } from "./types";
import { fr } from "./fr";
import { en } from "./en";

const dictionaries: Record<string, Dictionary> = {
  fr,
  en,
};

export type Locale = "fr" | "en";

export const defaultLocale: Locale = "fr";

export const locales: Locale[] = ["fr", "en"];

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? fr;
}

export { fr, en };
