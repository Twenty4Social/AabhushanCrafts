import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, clearAdminSessionCookieOptions } from "@/app/lib/admin-auth";

export async function POST(request: Request) {
  (await cookies()).set(ADMIN_SESSION_COOKIE, "", clearAdminSessionCookieOptions());
  const returnTo = new URL(request.url).searchParams.get("return_to");
  const safeReturnTo = returnTo?.startsWith("/admin") ? returnTo : "/admin/login";
  return Response.redirect(new URL(safeReturnTo, request.url), 303);
}

export async function GET() {
  return Response.json({ error: "Sign out must be submitted." }, { status: 405, headers: { Allow: "POST" } });
}
