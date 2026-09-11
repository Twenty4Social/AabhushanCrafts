"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function normalizeId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export default function CertificateLookup() {
  const router = useRouter();
  const [serialNumber, setSerialNumber] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedId = normalizeId(serialNumber);

    if (!normalizedId) {
      setError("Enter the serial number printed on your jewellery certificate.");
      return;
    }

    setError("");
    router.push(`/certificate/${encodeURIComponent(normalizedId)}`);
  }

  return (
    <section className="certificateLookup" aria-labelledby="certificate-lookup-title">
      <div className="certificateLookupHeading">
        <div>
          <h2 id="certificate-lookup-title">Check a jewellery record</h2>
        </div>
      </div>

      <form className="certificateLookupForm" onSubmit={handleSubmit}>
        <label className="srOnly" htmlFor="certificate-serial-number">Jewellery serial number</label>
        <input
          id="certificate-serial-number"
          className="certificateLookupInput"
          value={serialNumber}
          onChange={(event) => {
            setSerialNumber(event.target.value);
            setError("");
          }}
          placeholder="Enter serial number"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          aria-describedby="certificate-lookup-hint"
          aria-invalid={Boolean(error)}
        />
        <button className="certificateLookupButton" type="submit">
          Verify <span aria-hidden="true">↗</span>
        </button>
      </form>

      <p className="certificateLookupHint" id="certificate-lookup-hint">Find your serial number on your report or QR label.</p>
      {error && <p className="certificateLookupError" role="alert">{error}</p>}
    </section>
  );
}
