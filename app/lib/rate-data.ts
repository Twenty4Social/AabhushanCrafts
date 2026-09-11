import type { BullionRates } from "./rates";

type FeedRow = Record<string, unknown>;

function positiveNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

export function parseOfficialRates(data: unknown) {
  if (!Array.isArray(data)) throw new Error("Invalid rate feed");
  const rows = data.filter((row): row is FeedRow => row !== null && typeof row === "object");
  const find = (metal: string) => rows.find((row) => typeof row.rateType === "string" && row.rateType.includes(metal) && row.rateType.includes("१ तोला"));
  const goldRow = find("सुन");
  const silverRow = find("चाँदी");
  const gold = positiveNumber(goldRow?.todayBaseRatePerGram);
  const silver = positiveNumber(silverRow?.todayBaseRatePerGram);
  const publishedAt = timestamp(goldRow?.todayDate);
  if (gold === null || silver === null || !publishedAt || timestamp(silverRow?.todayDate) !== publishedAt) {
    throw new Error("Incomplete or mismatched official quote");
  }
  // The source spells these fields 'yestarday'. Missing values are not zero.
  const previousGold = positiveNumber(goldRow?.yestardayBaseRatePerGram);
  const previousSilver = positiveNumber(silverRow?.yestardayBaseRatePerGram);
  const comparisonDate = timestamp(goldRow?.yestardayDate);
  const comparable = comparisonDate && comparisonDate < publishedAt && timestamp(silverRow?.yestardayDate) === comparisonDate;
  return {
    gold, silver, publishedAt,
    comparisonDate: comparable ? comparisonDate : null,
    goldChange: comparable && previousGold !== null ? gold - previousGold : null,
    silverChange: comparable && previousSilver !== null ? silver - previousSilver : null,
  };
}

export function preservePriceChangeDate(stored: BullionRates | null, fresh: BullionRates): BullionRates {
  if (!stored?.isLive || stored.fineGoldNumeric !== fresh.fineGoldNumeric || stored.silverNumeric !== fresh.silverNumeric) return fresh;
  // Retain the last price-change date, but refresh the daily comparison and check time.
  return { ...fresh, updatedAt: stored.updatedAt, dateBs: stored.dateBs, dateBsNp: stored.dateBsNp, dateAd: stored.dateAd };
}
