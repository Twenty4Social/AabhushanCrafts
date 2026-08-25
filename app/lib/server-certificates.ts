import "server-only";

import { del, list, put } from "@vercel/blob";
import {
  DEFAULT_CERTIFICATE,
  type CertificateRecord,
  withoutLegacyCertificateCover,
} from "@/app/lib/certificates";

const CERTIFICATE_PREFIX = "certificates/";
const MAX_CERTIFICATE_IMAGE_BYTES = 4 * 1024 * 1024;

type CertificateImageInputs = {
  reportImageDataUrl?: string | null;
  productImageDataUrl?: string | null;
};

function normalizedId(id: string) {
  return id.trim().toUpperCase();
}

function recordPath(id: string) {
  return `${CERTIFICATE_PREFIX}${encodeURIComponent(normalizedId(id))}.json`;
}

export function hasVercelStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function findRecordBlob(id: string) {
  const result = await list({ prefix: recordPath(id) });
  return result.blobs.find((blob) => blob.pathname === recordPath(id)) ?? null;
}

async function readRecordBlob(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as CertificateRecord;
}

export async function readServerCertificate(id: string) {
  const normalized = normalizedId(id);
  if (!hasVercelStorage()) return normalized === DEFAULT_CERTIFICATE.id ? DEFAULT_CERTIFICATE : null;

  const blob = await findRecordBlob(normalized);
  if (!blob) return normalized === DEFAULT_CERTIFICATE.id ? DEFAULT_CERTIFICATE : null;

  const record = await readRecordBlob(blob.url);
  return record ? withoutLegacyCertificateCover({ ...DEFAULT_CERTIFICATE, ...record, id: normalized }) : null;
}

export async function readServerCertificates() {
  if (!hasVercelStorage()) return [DEFAULT_CERTIFICATE];

  const result = await list({ prefix: CERTIFICATE_PREFIX });
  const records = await Promise.all(
    result.blobs
      .filter((blob) => blob.pathname.endsWith(".json"))
      .map((blob) => readRecordBlob(blob.url)),
  );

  const validRecords = records.filter((record): record is CertificateRecord => Boolean(record?.id));
  if (!validRecords.some((record) => record.id === DEFAULT_CERTIFICATE.id)) {
    validRecords.unshift(DEFAULT_CERTIFICATE);
  }
  return validRecords.map((record) => withoutLegacyCertificateCover({ ...DEFAULT_CERTIFICATE, ...record }));
}

function dataUrlParts(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const [, contentType, encoded] = match;
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.byteLength > MAX_CERTIFICATE_IMAGE_BYTES) {
    throw new Error("Certificate images must be smaller than 4 MB for Vercel upload.");
  }
  const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || "bin";
  return { contentType, extension, bytes };
}

export async function saveServerCertificate(record: CertificateRecord, images: CertificateImageInputs = {}) {
  if (!hasVercelStorage()) {
    throw new Error("Vercel Blob storage is not configured.");
  }

  const nextRecord = withoutLegacyCertificateCover({ ...record, id: normalizedId(record.id) });
  const uploads = [
    { dataUrl: images.reportImageDataUrl, field: "reportImageSrc", role: "report" },
    { dataUrl: images.productImageDataUrl, field: "productImageSrc", role: "product" },
  ] as const;

  for (const upload of uploads) {
    const image = upload.dataUrl ? dataUrlParts(upload.dataUrl) : null;
    if (!image) continue;

    const imageBlob = await put(
      `${CERTIFICATE_PREFIX}images/${encodeURIComponent(nextRecord.id)}-${upload.role}-${Date.now()}.${image.extension}`,
      image.bytes,
      {
        access: "public",
        addRandomSuffix: true,
        contentType: image.contentType,
      },
    );
    nextRecord[upload.field] = imageBlob.url;
  }

  await put(recordPath(nextRecord.id), JSON.stringify(nextRecord), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  return nextRecord;
}

export async function deleteServerCertificate(id: string) {
  const normalized = normalizedId(id);
  if (normalized === DEFAULT_CERTIFICATE.id) {
    throw new Error("The default certificate cannot be deleted.");
  }

  const recordBlob = await findRecordBlob(normalized);
  if (!recordBlob) return false;

  const imageResult = await list({ prefix: `${CERTIFICATE_PREFIX}images/${encodeURIComponent(normalized)}-` });
  const blobsToDelete = [recordBlob, ...imageResult.blobs];
  await del(blobsToDelete.map((blob) => blob.url));
  return true;
}
