"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

function getReturnTo() {
  const value = new URLSearchParams(window.location.search).get("return_to");
  return value?.startsWith("/admin") ? value : "/admin";
}

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error || "Login failed. Check your Admin ID and password.");
        return;
      }
      window.location.assign(getReturnTo());
    } catch {
      setMessage("Could not reach the login service. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="adminLoginPage">
      <div className="adminLoginShell">
        <Link className="adminLoginBack" href="/">← Storefront</Link>
        <div className="adminLoginCard">
          <p className="adminKicker">Private workspace</p>
          <h1>Admin sign in.</h1>
          <p className="adminLoginIntro">Sign in to manage jewellery records, certificate images, and QR codes.</p>

          <form className="adminLoginForm" onSubmit={handleSubmit}>
            <label htmlFor="admin-id">Admin ID
              <input id="admin-id" value={adminId} onChange={(event) => setAdminId(event.target.value)} autoComplete="username" required />
            </label>
            <label htmlFor="admin-password">Password
              <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </label>
            {message && <p className="adminLoginMessage" role="alert">{message}</p>}
            <button className="adminButton" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</button>
          </form>

          <p className="adminLoginFooter">Admin access is protected by a server-side session.</p>
        </div>
      </div>
    </main>
  );
}
