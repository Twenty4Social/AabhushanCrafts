import "server-only";

import { list, put } from "@vercel/blob";
import { convertAdToBs } from "./nepali-date";
import { parseOfficialRates, preservePriceChangeDate } from "./rate-data";

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
  checkedAt?: string;
  fineGoldChange?: number | null;
  silverChange?: number | null;
  comparisonDate?: string | null;
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
  const bsDate = convertAdToBs(now);
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
    fineGoldChange: null,
    silverChange: null,
  };
}

async function readStoredBullionRates(): Promise<BullionRates | null> {
  if (!hasRateStorage()) return null;

  try {
    const result = await list({ prefix: RATE_BLOB_PATH });
    const blob = result.blobs.find((item) => item.pathname === RATE_BLOB_PATH);
    if (!blob) return null;

    const response = await fetch(`${blob.url}?v=${new Date(blob.uploadedAt).getTime()}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
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
    cacheControlMaxAge: 60,
  });
}

async function fetchOfficialBullionRates(): Promise<BullionRates> {
  const now = new Date();
  try {
    const res = await fetch(RATE_API_URL, {
      signal: AbortSignal.timeout(5000),
      headers: {
        Accept: "application/json",
        "User-Agent": "AabhushanCrafts-BullionTracker/1.0",
      },
      cache: "no-store",
    });

    if (res.ok) {
      const quote = parseOfficialRates(await res.json());
      return {
        ...makeRates(quote.gold, quote.silver, true, new Date(quote.publishedAt)),
        fineGoldChange: quote.goldChange,
        silverChange: quote.silverChange,
        comparisonDate: quote.comparisonDate,
        checkedAt: now.toISOString(),
      };
    }
  } catch {
    // Keep the last verified quote when the upstream feed is unavailable.
  }
  // An undated fallback must never look like a freshly published quote.
  return { ...makeRates(DEFAULT_FINE_GOLD, DEFAULT_SILVER, false, now), dateBs: "Rate unavailable" };
}

export async function getLiveBullionRates(): Promise<BullionRates> {
  const stored = await readStoredBullionRates();
  // A missed cron must not leave the saved quote frozen indefinitely.
  const age = Date.now() - Date.parse(stored?.checkedAt ?? "");
  if (stored?.isLive && age >= 0 && age < 15 * 60 * 1000) return stored;

  const fresh = await fetchOfficialBullionRates();
  if (fresh.isLive) {
    const merged = preservePriceChangeDate(stored, fresh);
    try {
      await saveStoredBullionRates(merged);
    } catch {
      // The live source still keeps the page useful if storage is unavailable.
    }
    return merged;
  }
  return stored?.isLive ? stored : fresh;
}

export async function refreshBullionRates(): Promise<BullionRates> {
  const fresh = await fetchOfficialBullionRates();
  if (!fresh.isLive) throw new Error("The official gold-rate source did not return a valid live rate.");

  const stored = await readStoredBullionRates();
  const merged = preservePriceChangeDate(stored, fresh);
  await saveStoredBullionRates(merged);
  return merged;
}

export function formatCurrency(amount: number): string {
  return `NPR ${amount.toLocaleString("en-IN")}`;
}
