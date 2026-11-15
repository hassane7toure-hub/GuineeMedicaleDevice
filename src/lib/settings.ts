import { cache } from "react";
import { db } from "./db";
import { defaultSettings, mergeSettings, type Settings } from "./settings-data";

export const getSettings = cache(async (): Promise<Settings> => {
  try {
    const row = await db.siteSetting.findUnique({ where: { id: "default" } });
    if (!row) return defaultSettings;
    return mergeSettings(JSON.parse(row.data));
  } catch {
    return defaultSettings;
  }
});

export async function saveSettings(next: Settings) {
  const data = JSON.stringify(next);
  await db.siteSetting.upsert({
    where: { id: "default" },
    create: { id: "default", data },
    update: { data },
  });
}
