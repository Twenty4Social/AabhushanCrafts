import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Versioned so browsers holding the old host-only cookie cannot override the
// new shared-domain session after the site began serving both domain variants.
export const ADMIN_SESSION_COOKIE = "aabhushan_admin_session_v2";
// Keep the admin signed in for 30 days. It remains revocable through Sign out
// and avoids an unexpectedly short session on the admin's own device.
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const PASSWORD_HASH_ITERATIONS = 310_000;

type AdminSessionPayload = {
  sub: string;
  exp: number;
};

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeText(value: string) {
  return toBase64Url(new TextEncoder().encode(value));
}

function decodeText(value: string) {
  return new TextDecoder().decode(fromBase64Url(value));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function getAuthConfig() {
  return {
    adminId: process.env.ADMIN_ID?.trim() ?? "",
    passwordHash: process.env.ADMIN_PASSWORD_HASH?.trim() ?? "",
    sessionSecret: process.env.SESSION_SECRET ?? "",
  };
}

export function getAdminAuthStatus() {
  const config = getAuthConfig();
  const missing: string[] = [];
  if (!config.adminId) missing.push("ADMIN_ID");
  if (!config.passwordHash) missing.push("ADMIN_PASSWORD_HASH");
  if (!config.sessionSecret) missing.push("SESSION_SECRET");
  return { configured: missing.length === 0, missing };
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function verifyAdminCredentials(adminId: string, password: string) {
  const config = getAuthConfig();
  if (!config.adminId || !config.passwordHash || !config.sessionSecret) return false;

  const idMatches = constantTimeEqual(new TextEncoder().encode(adminId), new TextEncoder().encode(config.adminId));
  const [algorithm, iterationText, encodedSalt, encodedHash] = config.passwordHash.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationText || !encodedSalt || !encodedHash) return false;

  const iterations = Number(iterationText);
  if (!Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) return false;

  try {
    const derivedHash = await derivePasswordHash(password, fromBase64Url(encodedSalt), iterations);
    const storedHash = fromBase64Url(encodedHash);
    return idMatches && constantTimeEqual(derivedHash, storedHash);
  } catch {
    return false;
  }
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

export async function createAdminSession(adminId: string) {
  const { sessionSecret } = getAuthConfig();
  const payload: AdminSessionPayload = {
    sub: adminId,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const encodedPayload = encodeText(JSON.stringify(payload));
  return `${encodedPayload}.${await sign(encodedPayload, sessionSecret)}`;
}

async function verifyAdminSessionToken(token: string) {
  const { sessionSecret } = getAuthConfig();
  if (!sessionSecret) return null;

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) return null;

  try {
    const expectedSignature = await sign(encodedPayload, sessionSecret);
    if (!constantTimeEqual(new TextEncoder().encode(providedSignature), new TextEncoder().encode(expectedSignature))) return null;
    const payload = JSON.parse(decodeText(encodedPayload)) as AdminSessionPayload;
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return token ? verifyAdminSessionToken(token) : null;
}

export async function requireAdminSession(returnTo = "/admin") {
  const session = await getAdminSession();
  if (session) return session;

  const safeReturnTo = returnTo.startsWith("/admin") ? returnTo : "/admin";
  redirect(`/admin/login?return_to=${encodeURIComponent(safeReturnTo)}`);
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    domain: process.env.ADMIN_COOKIE_DOMAIN?.trim()
      || (process.env.NODE_ENV === "production" ? ".aabhushancrafts.com" : undefined),
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}

export function clearAdminSessionCookieOptions() {
  return { ...adminSessionCookieOptions(), maxAge: 0 };
}

export const ADMIN_PASSWORD_HASH_ITERATIONS_FOR_SETUP = PASSWORD_HASH_ITERATIONS;
