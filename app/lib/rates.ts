import "server-only";

import { list, put } from "@vercel/blob";
import { getTodayBSDate } from "./nepali-date";

export interface BullionRates {
  dateBs: string; // e.g. "5 Bhadra 2083"
  dateBsNp: string; // e.g. "५ भाद्र २०८३"
  dateAd: string; // e.g. "21 Aug 2026"
  fineGoldPerTola: string; // e.g. "NPR 305,200"
  silverPerTola: string; // e.g. "NPR 4,710"
  fineGoldNumeric: number;
  silverNumeric: number;
  isLive: boolean;
  sourceUrl: string;
  updatedAt: string;
}

// Fallback baseline rates (per tola in NPR)
const DEFAULT_FINE_GOLD = 305200;
const DEFAULT_SILVER = 4710;
const RATE_BLOB_PATH = "rates/latest.json";
const RATE_SOURCE_URL = "https://fenegosida.org/";
const RATE_API_URL = "https://api.fenegosida.org/api/website/v1/Dashboard/today";

function hasRateStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function makeRates(fineGold: number, silver: number, isLive: boolean, now: Date): BullionRates {
  const bsDate = getTodayBSDate();
  const dateAd = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  });

  return {
    dateBs: bsDate.formatted,
    dateBsNp: bsDate.formattedNp,
    dateAd,
    fineGoldPerTola: formatCurrency(fineGold),
    silverPerTola: formatCurrency(silver),
    fineGoldNumeric: fineGold,
    silverNumeric: silver,
    isLive,
    sourceUrl: RATE_SOURCE_URL,
    updatedAt: now.toISOString(),
  };
}

async function readStoredBullionRates(): Promise<BullionRates | null> {
  if (!hasRateStorage()) return null;

  try {
    const result = await list({ prefix: RATE_BLOB_PATH });
    const blob = result.blobs.find((item) => item.pathname === RATE_BLOB_PATH);
    if (!blob) return null;

    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return null;
    const rates = (await response.json()) as BullionRates;
    if (!Number.isFinite(rates.fineGoldNumeric) || !Number.isFinite(rates.silverNumeric)) return null;
    return rates;
  } catch {
    return null;
  }
}

async function saveStoredBullionRates(rates: BullionRates) {
  if (!hasRateStorage()) return;
  await put(RATE_BLOB_PATH, JSON.stringify(rates), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function fetchOfficialBullionRates(): Promise<BullionRates> {
  const now = new Date();
  let fineGold = DEFAULT_FINE_GOLD;
  let silver = DEFAULT_SILVER;
  let isLive = false;

  try {
    // Keep the public page responsive while the daily job fetches the source.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(RATE_API_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "AabhushanCrafts-BullionTracker/1.0",
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as Array<{
        rateType?: string;
        todayBaseRatePerGram?: number;
      }>;
      const goldRow = data.find((row) => row.rateType?.includes("सुन") && row.rateType.includes("१ तोला"));
      const silverRow = data.find((row) => row.rateType?.includes("चाँदी") && row.rateType.includes("१ तोला"));
      const liveGold = Number(goldRow?.todayBaseRatePerGram);
      const liveSilver = Number(silverRow?.todayBaseRatePerGram);

      if (Number.isFinite(liveGold) && Number.isFinite(liveSilver)) {
        fineGold = liveGold;
        silver = liveSilver;
        isLive = true;
      }
    }
  } catch {
    isLive = false;
  }

  return makeRates(fineGold, silver, isLive, now);
}

export async function getLiveBullionRates(): Promise<BullionRates> {
  const stored = await readStoredBullionRates();
  // A previous fallback must not permanently mask a newly available live source.
  if (stored?.isLive) return stored;

  const fresh = await fetchOfficialBullionRates();
  if (fresh.isLive) {
    try {
      await saveStoredBullionRates(fresh);
    } catch {
      // The live source still keeps the page useful if storage is unavailable.
    }
  }
  return fresh;
}

export async function refreshBullionRates(): Promise<BullionRates> {
  const fresh = await fetchOfficialBullionRates();
  if (!fresh.isLive) throw new Error("The official gold-rate source did not return a valid live rate.");
  await saveStoredBullionRates(fresh);
  return fresh;
}

export function formatCurrency(amount: number): string {
  return `NPR ${amount.toLocaleString("en-IN")}`;
}
