"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CERTIFICATE_ID,
  JEWELLERY_TYPES,
  JEWELLERY_TYPE_LABELS,
  readCertificates,
  removeCertificate,
  type CertificateRecord,
  type JewelleryType,
} from "@/app/lib/certificates";

type TypeFilter = "all" | JewelleryType;

export default function SavedJewelleryPage() {
  const [records, setRecords] = useState<CertificateRecord[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/certificates")
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { records?: CertificateRecord[] };
      })
      .then((result) => {
        if (!cancelled) setRecords(result?.records ?? readCertificates());
      })
      .catch(() => {
        if (!cancelled) setRecords(readCertificates());
      });
    return () => { cancelled = true; };
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesType = typeFilter === "all" || record.jewelleryType === typeFilter;
      const matchesQuery = !normalizedQuery || [record.productName, record.id, record.description, record.metal]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesType && matchesQuery;
    });
  }, [query, records, typeFilter]);

  async function handleDelete(event: FormEvent<HTMLFormElement>, record: CertificateRecord) {
    event.preventDefault();
    if (deleteCode !== "confirm") {
      setDeleteError("Type confirm exactly to delete this record.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch("/api/certificates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, confirmation: deleteCode }),
      });
      const result = (await response.json()) as { error?: string; deleted?: boolean };

      if (response.status === 503 && window.location.hostname === "localhost") {
        if (record.id === DEFAULT_CERTIFICATE_ID) throw new Error("The default certificate cannot be deleted.");
        removeCertificate(record.id);
      } else if (!response.ok || !result.deleted) {
        throw new Error(result.error || "The record could not be deleted.");
      }

      setRecords((current) => current.filter((item) => item.id !== record.id));
      setDeleteTarget(null);
      setDeleteCode("");
    } catch (deleteRequestError) {
      setDeleteError(deleteRequestError instanceof Error ? deleteRequestError.message : "The record could not be deleted.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="adminPage">
      <div className="adminShell adminShellWide">
        <header className="adminHeader">
          <Link className="adminBack" href="/admin">← Manage records</Link>
          <div className="adminHeaderActions">
            <Link className="adminHeaderLink" href="/">Storefront</Link>
            <form className="adminSignOutForm" action="/api/admin/logout?return_to=%2Fadmin%2Fjewellery" method="post">
              <button className="adminHeaderLink" type="submit">Sign out</button>
            </form>
            <span className="adminEyebrow">Aabhushan Crafts · Admin</span>
          </div>
        </header>

        <section className="adminIntro savedJewelleryIntro">
          <p className="adminKicker">Inventory & certificates</p>
          <h1>Saved jewellery.</h1>
          <p>See every managed product at a glance, check its image and certificate ID, then open the record or public verification page.</p>
        </section>

        <section className="jewelleryToolbar" aria-label="Saved jewellery controls">
          <div className="jewelleryStats"><strong>{records.length}</strong><span>saved products</span></div>
          <div className="jewelleryTypeFilters" aria-label="Filter by jewellery type">
            <button className={typeFilter === "all" ? "isActive" : ""} type="button" onClick={() => setTypeFilter("all")}>All</button>
            {JEWELLERY_TYPES.map((type) => (
              <button className={typeFilter === type ? "isActive" : ""} type="button" key={type} onClick={() => setTypeFilter(type)}>
                {JEWELLERY_TYPE_LABELS[type]} <span>{records.filter((record) => record.jewelleryType === type).length}</span>
              </button>
            ))}
          </div>
          <label className="jewellerySearch" htmlFor="jewellery-search">
            <span>Search</span>
            <input id="jewellery-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, or metal" />
          </label>
          <Link className="adminButton" href="/admin">＋ New jewellery</Link>
        </section>

        {filteredRecords.length ? (
          <section className="jewelleryGrid" aria-label="Saved jewellery records">
            {filteredRecords.map((record) => (
              <article className="jewelleryCard" key={record.id}>
                <div className="jewelleryCardImage">
                  <img src={record.productImageSrc || record.reportImageSrc} alt={`${record.productName} product`} />
                  <span className="jewelleryImageStatus">{JEWELLERY_TYPE_LABELS[record.jewelleryType]} · ✓ image ready</span>
                </div>
                <div className="jewelleryCardBody">
                  <div className="jewelleryCardTopline"><span>{JEWELLERY_TYPE_LABELS[record.jewelleryType]} · {record.id}</span><span>{record.metal || "Metal not added"}</span></div>
                  <h2>{record.productName || "Unnamed jewellery"}</h2>
                  <p>{record.description || "No description added yet."}</p>
                  <dl className="jewelleryMiniDetails">
                    <div><dt>Weight</dt><dd>{record.grossWeight || "—"}</dd></div>
                    <div><dt>Origin</dt><dd>{record.origin || "—"}</dd></div>
                    <div><dt>Cut</dt><dd>{record.shapeCut || "—"}</dd></div>
                  </dl>
                  <div className="jewelleryCardActions">
                    <Link href={`/admin?edit=${encodeURIComponent(record.id)}`}>Edit record ↗</Link>
                    <Link href={`/certificate/${encodeURIComponent(record.id)}`} target="_blank" rel="noreferrer">View certificate ↗</Link>
                    {record.id !== DEFAULT_CERTIFICATE_ID && (
                      <button className="jewelleryDeleteButton" type="button" onClick={() => { setDeleteTarget(record.id); setDeleteCode(""); setDeleteError(""); }}>
                        Delete record
                      </button>
                    )}
                  </div>
                  {deleteTarget === record.id && (
                    <form className="jewelleryDeletePanel" onSubmit={(event) => void handleDelete(event, record)}>
                      <strong>Delete {record.productName}?</strong>
                      <p>This removes the record and its uploaded images permanently.</p>
                      <label htmlFor={`delete-code-${record.id}`}>Type <b>confirm</b> to continue
                        <input id={`delete-code-${record.id}`} value={deleteCode} onChange={(event) => setDeleteCode(event.target.value)} placeholder="confirm" autoComplete="off" autoFocus />
                      </label>
                      {deleteError && <span className="jewelleryDeleteError" role="alert">{deleteError}</span>}
                      <div className="jewelleryDeleteActions">
                        <button type="button" onClick={() => { setDeleteTarget(null); setDeleteCode(""); setDeleteError(""); }}>Cancel</button>
                        <button className="jewelleryDeleteConfirm" type="submit" disabled={isDeleting}>{isDeleting ? "Deleting…" : "Delete permanently"}</button>
                      </div>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="jewelleryEmptyState">
            <h2>No jewellery found.</h2>
            <p>Try a different search or create a new certificate record.</p>
            <Link className="adminButton" href="/admin">Create first record</Link>
          </div>
        )}
      </div>
    </main>
  );
}
