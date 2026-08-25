export const JEWELLERY_TYPES = ["ring", "necklace", "earring", "other"] as const;
export type JewelleryType = (typeof JEWELLERY_TYPES)[number];
export const JEWELLERY_TYPE_LABELS: Record<JewelleryType, string> = {
  ring: "Ring",
  necklace: "Necklace",
  earring: "Earring",
  other: "Other",
};

export type CertificateRecord = {
  id: string;
  productName: string;
  jewelleryType: JewelleryType;
  summaryNo: string;
  description: string;
  metal: string;
  grossWeight: string;
  origin: string;
  shapeCut: string;
  clarity: string;
  color: string;
  diamondPieces: string;
  reportImageSrc: string;
  reportImageName: string;
  productImageSrc: string;
  productImageName: string;
  savedAt: string;
};

export const CERTIFICATE_STORAGE_KEY = "aabhushan:certificate-records";
export const DEFAULT_CERTIFICATE_ID = "14DR3-982";

export const DEFAULT_CERTIFICATE: CertificateRecord = {
  id: DEFAULT_CERTIFICATE_ID,
  productName: "Eternal Petal Ring",
  jewelleryType: "ring",
  summaryNo: DEFAULT_CERTIFICATE_ID,
  description: "14K Hallmark Eternal Petal Ring with South African Natural Diamond Studded",
  metal: "14K yellow gold (hallmark)",
  grossWeight: "4.410 gm",
  origin: "South Africa",
  shapeCut: "Round brilliant",
  clarity: "SI",
  color: "J",
  diamondPieces: "1 / 1.06 ct",
  reportImageSrc: "/images/certificate-report.png",
  reportImageName: "Jewellery report",
  productImageSrc: "",
  productImageName: "",
  savedAt: "2026-08-24T00:00:00.000Z",
};

export function withoutLegacyCertificateCover(record: CertificateRecord): CertificateRecord {
  const cleanRecord = { ...record } as CertificateRecord & { imageSrc?: string; imageName?: string };
  delete cleanRecord.imageSrc;
  delete cleanRecord.imageName;
  return cleanRecord;
}

function hasBrowserStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readCertificates(): CertificateRecord[] {
  if (!hasBrowserStorage()) return [DEFAULT_CERTIFICATE];

  try {
    const stored = window.localStorage.getItem(CERTIFICATE_STORAGE_KEY);
    const records = stored ? (JSON.parse(stored) as CertificateRecord[]) : [];
    const validRecords = Array.isArray(records)
      ? records
          .filter((record) => record?.id)
          .map((record) => withoutLegacyCertificateCover({
            ...DEFAULT_CERTIFICATE,
            ...record,
            productName: record.productName
              || (record.id === DEFAULT_CERTIFICATE_ID ? DEFAULT_CERTIFICATE.productName : record.description)
              || "Unnamed jewellery",
          }))
      : [];
    return validRecords.some((record) => record.id === DEFAULT_CERTIFICATE_ID)
      ? validRecords
      : [DEFAULT_CERTIFICATE, ...validRecords];
  } catch {
    return [DEFAULT_CERTIFICATE];
  }
}

export function saveCertificate(record: CertificateRecord) {
  if (!hasBrowserStorage()) throw new Error("Browser storage is unavailable.");

  const records = readCertificates().filter((item) => item.id !== record.id);
  window.localStorage.setItem(CERTIFICATE_STORAGE_KEY, JSON.stringify([record, ...records]));
}

export function removeCertificate(id: string) {
  if (!hasBrowserStorage()) return;
  const records = readCertificates().filter((record) => record.id !== id);
  window.localStorage.setItem(CERTIFICATE_STORAGE_KEY, JSON.stringify(records));
}

export function findCertificate(id: string) {
  const normalizedId = id.trim().toUpperCase();
  return readCertificates().find((record) => record.id === normalizedId) ?? null;
}
