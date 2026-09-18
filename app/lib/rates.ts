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

// In-memory module cache to avoid excessive Vercel Blob list/read calls on the free Hobby plan
let memoryCache: { rates: BullionRates; timestamp: number } | null = null;
let cachedBlobUrl: string | null = null;

function isSameNepalDay(dateA: string | Date, dateB: string | Date): boolean {
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
  const toYmd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
  return toYmd(a) === toYmd(b);
}

function getNepalHour(date: string | Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date(date));
  return parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
}

export function isRatesUpToDateForToday(stored: BullionRates | null, now = new Date()): boolean {
  if (!stored?.isLive) return false;
  const nowHour = getNepalHour(now);
  if (nowHour < 11) {
    // Before 11:00 AM NPT, yesterday's published quote is still the official active quote.
    return true;
  }
  // At or after 11:00 AM NPT, check if stored was fetched today at or after 11:00 AM.
  const isFetchedToday = isSameNepalDay(stored.updatedAt, now);
  const storedHour = getNepalHour(stored.updatedAt);
  return isFetchedToday && storedHour >= 11;
}

async function readStoredBullionRates(): Promise<BullionRates | null> {
  if (memoryCache && Date.now() - memoryCache.timestamp < 300_000) {
    return memoryCache.rates;
  }
  if (!hasRateStorage()) return memoryCache?.rates ?? null;

  try {
    let url = cachedBlobUrl;
    if (!url) {
      const result = await list({ prefix: RATE_BLOB_PATH });
      const blob = result.blobs.find((item) => item.pathname === RATE_BLOB_PATH);
      if (!blob) return null;
      url = blob.url;
      cachedBlobUrl = url;
    }

    const response = await fetch(`${url}?v=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const rates = (await response.json()) as BullionRates;
    if (!Number.isFinite(rates.fineGoldNumeric) || !Number.isFinite(rates.silverNumeric)) return null;
    memoryCache = { rates, timestamp: Date.now() };
    return rates;
  } catch {
    return memoryCache?.rates ?? null;
  }
}

async function saveStoredBullionRates(rates: BullionRates) {
  memoryCache = { rates, timestamp: Date.now() };
  if (!hasRateStorage()) return;
  try {
    const blob = await put(RATE_BLOB_PATH, JSON.stringify(rates), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    cachedBlobUrl = blob.url;
  } catch {
    // Storage failure should not throw and block users
  }
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
  const now = new Date();
  const stored = await readStoredBullionRates();

  // If today's rate after 11:00 AM NPT has already been fetched and saved, return it immediately.
  // This ensures zero external API requests and zero Blob operations for the rest of the day.
  if (isRatesUpToDateForToday(stored, now)) {
    return stored!;
  }

  // If after 11 AM and not yet updated, check if we checked within the last 10 minutes (cooldown)
  if (stored?.isLive) {
    const lastChecked = Date.parse(stored.checkedAt ?? "");
    if (Number.isFinite(lastChecked) && now.getTime() - lastChecked < 10 * 60 * 1000) {
      return stored;
    }
  }

  // Otherwise, fetch from FENEGOSIDA
  const fresh = await fetchOfficialBullionRates();
  if (fresh.isLive) {
    const merged = preservePriceChangeDate(stored, fresh);
    await saveStoredBullionRates(merged);
    return merged;
  }

  // If FENEGOSIDA failed or is temporarily unavailable, update check timestamp on stored quote to throttle retries
  if (stored?.isLive) {
    const throttled: BullionRates = { ...stored, checkedAt: now.toISOString() };
    memoryCache = { rates: throttled, timestamp: Date.now() };
    return throttled;
  }

  return fresh;
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
