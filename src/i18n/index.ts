import { fr, type Dictionary } from "./fr";

export const dictionaries = { fr };

export type Locale = keyof typeof dictionaries;

export function getDictionary(locale: Locale = "fr"): Dictionary {
  return dictionaries[locale] ?? fr;
}
