"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findCertificate, JEWELLERY_TYPE_LABELS, type CertificateRecord } from "@/app/lib/certificates";

type CertificateClientProps = {
  certificateId: string;
  initialRecord: CertificateRecord | null;
};

export default function CertificateClient({ certificateId, initialRecord }: CertificateClientProps) {
  const [record, setRecord] = useState<CertificateRecord | null>(initialRecord);
  const [isLoaded, setIsLoaded] = useState(Boolean(initialRecord));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!initialRecord) setRecord(findCertificate(certificateId));
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [certificateId, initialRecord]);

  if (!isLoaded) {
    return (
      <main className="certificatePage">
        <div className="certificateShell certificateEmptyState">
          <p className="certificateKicker">Public verification page</p>
          <h1>Loading certificate…</h1>
        </div>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="certificatePage">
        <div className="certificateShell certificateEmptyState">
          <p className="certificateKicker">Public verification page</p>
          <h1>Certificate not found.</h1>
          <p>This ID does not have a published certificate record yet.</p>
          <Link className="adminButton" href="/admin">Open admin</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="certificatePage">
      <div className="certificateShell">
        <header className="certificateHeader">
          <Link href="/" aria-label="Back to Aabhushan Crafts">Aabhushan Crafts</Link>
          <Link className="certificateAdminLink" href="/admin">Admin ↗</Link>
        </header>

        <section className="certificateIntro">
          <p className="certificateKicker">Public verification page</p>
          <h1>{record.productName || "Certificate of authenticity"}</h1>
          <p className="certificateTypeLabel">{JEWELLERY_TYPE_LABELS[record.jewelleryType]} · Certificate of authenticity · {record.id}</p>
          <p>{record.description || "Scan-confirmed jewellery record for the certificate ID below."}</p>
          <div className="certificateId">{record.id}</div>
        </section>

        <section className="certificateDetails" aria-label="Certificate details">
          <div><span>Summary no.</span><strong>{record.summaryNo || record.id}</strong></div>
          <div><span>Metal</span><strong>{record.metal || "—"}</strong></div>
          <div><span>Gross weight</span><strong>{record.grossWeight || "—"}</strong></div>
          <div><span>Origin</span><strong>{record.origin || "—"}</strong></div>
          <div><span>Shape / cut</span><strong>{record.shapeCut || "—"}</strong></div>
          <div><span>Clarity / color</span><strong>{[record.clarity, record.color].filter(Boolean).join(" · ") || "—"}</strong></div>
          <div><span>Diamond pcs.</span><strong>{record.diamondPieces || "—"}</strong></div>
        </section>

        <section className="certificateVisuals" aria-label="Jewellery and certificate images">
          {record.productImageSrc && (
            <figure className="productShowcase">
              <div className="productShowcaseVisual">
                <span className="productShowcaseHalo" aria-hidden="true" />
                <img src={record.productImageSrc} alt={`${record.productName} product`} />
                <span className="productShowcaseBadge">Verified piece</span>
              </div>
              <figcaption className="productShowcaseCopy">
                <p className="certificateKicker">The piece behind the report</p>
                <h2>{record.productName}</h2>
                <p>View the jewellery detail alongside its scan-confirmed certificate record.</p>
                <span className="productShowcaseId">{record.id}</span>
              </figcaption>
            </figure>
          )}

          <div className="certificateDocuments" aria-label="Certificate documents">
            {record.reportImageSrc && (
              <figure className="certificateDocument certificateReportDocument">
                <img src={record.reportImageSrc} alt={`${record.id} jewellery report`} />
                <figcaption>{record.reportImageName || "Jewellery report"}</figcaption>
              </figure>
            )}
          </div>
        </section>

        <footer className="certificateFooter">
          <span>Handcrafted · Kathmandu</span>
          <span>Aabhushan Crafts</span>
          <Link href="/">Visit storefront ↗</Link>
        </footer>
      </div>
    </main>
  );
}
