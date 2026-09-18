"use client";

import QRCode from "qrcode";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_CERTIFICATE,
  JEWELLERY_TYPES,
  JEWELLERY_TYPE_LABELS,
  type CertificateRecord,
  findCertificate,
  saveCertificate,
} from "@/app/lib/certificates";

const ID_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,31}$/;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
type UploadImageField = "reportImageSrc" | "productImageSrc";
type UploadNameField = "reportImageName" | "productImageName";

function normalizeId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

async function convertFileToWebP(
  file: File,
  maxDimension = 2560,
  quality = 0.92,
): Promise<{ dataUrl: string; webpName: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Downscale only if exceeding maxDimension, maintaining aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to create canvas context for image processing."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP data URL with 0.92 quality (excellent visual quality, compact size)
      let dataUrl = canvas.toDataURL("image/webp", quality);
      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      }

      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const webpName = `${baseName}.webp`;
      resolve({ dataUrl, webpName });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be loaded. Please ensure it is a valid image file."));
    };

    img.src = objectUrl;
  });
}

async function readApiResult<T>(response: Response): Promise<T> {
  if (response.status === 413) throw new Error("The upload is too large. Please choose an image smaller than 15 MB.");
  const text = await response.text();
  try { return JSON.parse(text) as T; } catch {
    throw new Error(response.status === 401
      ? "Your admin session expired. Please sign in again."
      : "The server could not complete the upload. Your form is still here; please try saving again.");
  }
}

async function uploadImage(source: string, id: string, role: string) {
  if (!source.startsWith("data:")) return source;
  const image = await fetch(source).then((response) => response.blob());
  const body = new FormData();
  body.set("image", image, `${role}.webp`);
  body.set("id", id);
  body.set("role", role);
  const response = await fetch("/api/certificates/image", { method: "POST", body });
  const result = await readApiResult<{ url?: string; error?: string }>(response);
  if (!response.ok || !result.url) throw new Error(result.error || "The image could not be uploaded.");
  return result.url;
}

export default function AdminPage() {
  const [draft, setDraft] = useState<CertificateRecord>(() => ({ ...DEFAULT_CERTIFICATE }));
  const [qrSource, setQrSource] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const normalizedId = normalizeId(draft.id);
  const certificatePath = `/certificate/${encodeURIComponent(normalizedId)}`;
  const isValidId = ID_PATTERN.test(normalizedId);
  const validationError = isValidId ? "" : "Use 3–32 letters, numbers, or hyphens.";

  useEffect(() => {
    let cancelled = false;
    const editId = new URLSearchParams(window.location.search).get("edit")?.toUpperCase();
    if (!editId) return () => { cancelled = true; };

    fetch("/api/certificates")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { records?: CertificateRecord[] };
      })
      .then((result) => {
        const remoteRecord = result?.records?.find((record) => record.id === editId);
        const recordToEdit = remoteRecord ?? findCertificate(editId);
        if (!cancelled && recordToEdit) {
          setDraft(recordToEdit);
          if (remoteRecord) setPublishedId(remoteRecord.id);
        }
      })
      .catch(() => {
        const recordToEdit = findCertificate(editId);
        if (!cancelled && recordToEdit) setDraft(recordToEdit);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!isValidId || publishedId !== normalizedId) {
      return () => { cancelled = true; };
    }

    QRCode.toDataURL(`${window.location.origin}${certificatePath}`, {
      width: 720,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#11100d", light: "#fffdf8" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrSource(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError("The QR code could not be generated. Try again.");
      });

    return () => { cancelled = true; };
  }, [certificatePath, isValidId, normalizedId, publishedId]);

  function updateField(field: keyof CertificateRecord, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setPublishedId(null);
    setNotice("");
    setError("");
  }

  async function handleImageChange(
    file: File | undefined,
    imageField: UploadImageField,
    imageNameField: UploadNameField,
    label: string,
  ) {
    if (!file) return;
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|svg)$/i.test(file.name);
    if (!isImage) {
      setError("Please choose a valid image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Please choose an image smaller than 20 MB.");
      return;
    }

    try {
      setNotice(`Optimizing ${label} to high-quality WebP…`);
      const { dataUrl, webpName } = await convertFileToWebP(file);
      setDraft((current) => ({ ...current, [imageField]: dataUrl, [imageNameField]: webpName }));
      setPublishedId(null);
      setNotice(`${label} ready ✓ ${webpName} (optimized WebP). Save the record to upload it.`);
      setError("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The image could not be processed.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidId) {
      setError(validationError);
      return;
    }
    if (!draft.productName.trim()) {
      setError("Add a product name before saving this record.");
      return;
    }
    if (!draft.reportImageSrc) {
      setError("Upload a jewellery report image before saving this record.");
      return;
    }

    setIsSaving(true);
    try {
      const record: CertificateRecord = {
        ...draft,
        id: normalizedId,
        productName: draft.productName.trim() || "Unnamed jewellery",
        summaryNo: normalizeId(draft.summaryNo) || normalizedId,
        savedAt: new Date().toISOString(),
      };

      for (const [field, role] of [["reportImageSrc", "report"], ["productImageSrc", "product"]] as const) {
        setNotice(`Uploading ${role} image…`);
        record[field] = await uploadImage(record[field], normalizedId, role);
        // Keep successful uploads on retries if a later request fails.
        setDraft((current) => ({ ...current, [field]: record[field] }));
      }
      setNotice("Saving certificate…");
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record }),
      });
      const result = await readApiResult<{ record?: CertificateRecord; error?: string }>(response);

      if (response.ok && result.record) {
        setDraft(result.record);
        setPublishedId(result.record.id);
        setNotice(`Saved to server ✓ ${result.record.id}. This QR will work from any phone.`);
      } else if (response.status === 503 && window.location.hostname === "localhost") {
        saveCertificate(record);
        setDraft(record);
        setPublishedId(null);
        setNotice(`Saved locally ✓ ${record.id}. Add Vercel Blob before publishing.`);
      } else {
        throw new Error(result.error || "The certificate could not be saved.");
      }
      setError("");
    } catch (saveError) {
      setNotice("");
      setError(saveError instanceof Error ? saveError.message : "The record could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="adminPage">
      <div className="adminShell adminShellWide">
        <header className="adminHeader">
          <Link className="adminBack" href="/">← Storefront</Link>
          <div className="adminHeaderActions">
            <Link className="adminHeaderLink" href="/admin/jewellery">Saved jewellery</Link>
            <form className="adminSignOutForm" action="/api/admin/logout?return_to=%2Fadmin" method="post">
              <button className="adminHeaderLink" type="submit">Sign out</button>
            </form>
            <span className="adminEyebrow">Aabhushan Crafts · Admin</span>
          </div>
        </header>

        <section className="adminIntro">
          <p className="adminKicker">Certificate management</p>
          <h1>Build a certificate record.</h1>
          <p>Enter the jewellery details, upload its certificate image, then generate a QR code that opens the public verification page.</p>
        </section>

        <div className="adminStatus" aria-live="polite">
          <span className="statusDot" aria-hidden="true" />
          <span>{notice || "Changes are kept in this browser until you save the record."}</span>
        </div>

        <section className="adminWorkspace" aria-label="Certificate admin workspace">
          <form className="adminCard adminForm adminDetailsForm" onSubmit={handleSubmit}>
            <div className="formSectionHeading">
              <span>01</span>
              <div><h2>Certificate details</h2><p>Everything shown on the public verification page.</p></div>
            </div>

            <div className="formFields twoColumns">
              <label className="adminLabel" htmlFor="product-name">Product name *
                <input className="adminInput" id="product-name" value={draft.productName} onChange={(event) => updateField("productName", event.target.value)} placeholder="Eternal Petal Ring" />
              </label>
              <label className="adminLabel" htmlFor="jewellery-type">Jewellery type *
                <select className="adminInput adminSelect" id="jewellery-type" value={draft.jewelleryType} onChange={(event) => updateField("jewelleryType", event.target.value)}>
                  {JEWELLERY_TYPES.map((type) => <option key={type} value={type}>{JEWELLERY_TYPE_LABELS[type]}</option>)}
                </select>
              </label>
              <label className="adminLabel" htmlFor="certificate-id">Certificate ID *
                <input className="adminInput" id="certificate-id" value={draft.id} onChange={(event) => updateField("id", event.target.value)} placeholder="e.g. 14DR3-982" autoComplete="off" spellCheck={false} />
              </label>
              <label className="adminLabel" htmlFor="summary-no">Summary no.
                <input className="adminInput" id="summary-no" value={draft.summaryNo} onChange={(event) => updateField("summaryNo", event.target.value)} placeholder="Usually the same as the ID" />
              </label>
            </div>

            <label className="adminLabel" htmlFor="description">Description
              <textarea className="adminTextarea" id="description" value={draft.description} onChange={(event) => updateField("description", event.target.value)} placeholder="e.g. 14K Hallmark Eternal Petal Ring..." rows={3} />
            </label>

            <div className="formSectionHeading formSectionHeadingSpaced">
              <span>02</span>
              <div><h2>Jewellery specifications</h2><p>Use the values printed on the report.</p></div>
            </div>

            <div className="formFields twoColumns">
              <label className="adminLabel" htmlFor="metal">Metal<input className="adminInput" id="metal" value={draft.metal} onChange={(event) => updateField("metal", event.target.value)} placeholder="14K yellow gold (hallmark)" /></label>
              <label className="adminLabel" htmlFor="gross-weight">Gross weight<input className="adminInput" id="gross-weight" value={draft.grossWeight} onChange={(event) => updateField("grossWeight", event.target.value)} placeholder="4.410 gm" /></label>
              <label className="adminLabel" htmlFor="origin">Origin<input className="adminInput" id="origin" value={draft.origin} onChange={(event) => updateField("origin", event.target.value)} placeholder="South Africa" /></label>
              <label className="adminLabel" htmlFor="shape-cut">Shape / cut<input className="adminInput" id="shape-cut" value={draft.shapeCut} onChange={(event) => updateField("shapeCut", event.target.value)} placeholder="Round brilliant" /></label>
              <label className="adminLabel" htmlFor="clarity">Clarity<input className="adminInput" id="clarity" value={draft.clarity} onChange={(event) => updateField("clarity", event.target.value)} placeholder="SI" /></label>
              <label className="adminLabel" htmlFor="color">Color<input className="adminInput" id="color" value={draft.color} onChange={(event) => updateField("color", event.target.value)} placeholder="J" /></label>
              <label className="adminLabel" htmlFor="diamond-pieces">Diamond pcs. / carat<input className="adminInput" id="diamond-pieces" value={draft.diamondPieces} onChange={(event) => updateField("diamondPieces", event.target.value)} placeholder="1 / 1.06 ct" /></label>
            </div>

            <div className="formSectionHeading formSectionHeadingSpaced">
              <span>03</span>
              <div><h2>Jewellery report image</h2><p>Upload the report viewers should inspect on the verification page.</p></div>
            </div>

            <label className={`uploadBox uploadBoxReport ${draft.reportImageSrc ? "uploadBoxReady" : ""}`} htmlFor="report-image">
              <input id="report-image" type="file" accept="image/*" onChange={(event) => void handleImageChange(event.target.files?.[0], "reportImageSrc", "reportImageName", "Jewellery report")} />
              {draft.reportImageSrc ? (
                <>
                  <img src={draft.reportImageSrc} alt="Uploaded jewellery report preview" />
                  <span className="uploadSuccess">✓ Report image ready</span>
                  <strong>{draft.reportImageName || "Jewellery report"}</strong>
                  <small>Click to replace report image</small>
                </>
              ) : (
                <><span className="uploadIcon">＋</span><strong>Upload jewellery report</strong><small>Any image format · auto-converted to high quality WebP</small></>
              )}
            </label>

            <div className="formSectionHeading formSectionHeadingSpaced">
              <span>04</span>
              <div><h2>Product image</h2><p>A beautiful product view shown first to viewers on the public page.</p></div>
            </div>

            <label className={`uploadBox uploadBoxProduct ${draft.productImageSrc ? "uploadBoxReady" : ""}`} htmlFor="product-image">
              <input id="product-image" type="file" accept="image/*" onChange={(event) => void handleImageChange(event.target.files?.[0], "productImageSrc", "productImageName", "Product image")} />
              {draft.productImageSrc ? (
                <>
                  <img src={draft.productImageSrc} alt="Uploaded jewellery product preview" />
                  <span className="uploadSuccess">✓ Product image ready</span>
                  <strong>{draft.productImageName || "Product image"}</strong>
                  <small>Click to replace product image</small>
                </>
              ) : (
                <><span className="uploadIcon">＋</span><strong>Upload product image</strong><small>Recommended · any image format · auto-converted to WebP</small></>
              )}
            </label>

            {(error || validationError) && <p className="adminError" role="alert">{error || validationError}</p>}
            <button className="adminButton adminSaveButton" type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save certificate record"}</button>
          </form>

          <aside className="adminAside">
            <div className="adminCard qrCard">
              <div className="formSectionHeading"><span>05</span><div><h2>QR code</h2><p>Available after the certificate is submitted.</p></div></div>
              {publishedId === normalizedId && qrSource ? (
                <>
                  <div className="qrFrame"><img src={qrSource} alt={`QR code for certificate ${normalizedId}`} /></div>
                  <div className="qrMeta"><strong>{normalizedId}</strong><span>Camera opens {certificatePath}</span></div>
                  <div className="qrActions">
                    <a className="adminButton adminButtonSecondary" href={qrSource} download={`aabhushan-${normalizedId}-qr.png`}>Download QR</a>
                  </div>
                </>
              ) : (
                <div className="qrPending">Save the certificate record first. The QR will appear here after it is published.</div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
