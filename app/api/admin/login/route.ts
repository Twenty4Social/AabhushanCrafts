import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSession,
  getAdminAuthStatus,
  verifyAdminCredentials,
} from "@/app/lib/admin-auth";

export async function POST(request: Request) {
  const status = getAdminAuthStatus();
  if (!status.configured) {
    return Response.json({ error: "Admin login is not configured on the server yet." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { adminId?: string; password?: string };
    const adminId = typeof body.adminId === "string" ? body.adminId : "";
    const password = typeof body.password === "string" ? body.password : "";
    const isValid = await verifyAdminCredentials(adminId, password);
    if (!isValid) return Response.json({ error: "Invalid Admin ID or password." }, { status: 401 });

    const token = await createAdminSession(adminId);
    (await cookies()).set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid login request." }, { status: 400 });
  }
}
