import { put } from "@vercel/blob";
import { getAdminSession } from "@/app/lib/admin-auth";
import { hasVercelStorage } from "@/app/lib/server-certificates";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: "Admin sign-in required. Sign in again before saving." }, { status: 401 });
  if (!hasVercelStorage()) return Response.json({ error: "Image storage is not configured." }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get("image");
    const id = String(form.get("id") || "");
    const role = String(form.get("role") || "");
    if (!/^[A-Z0-9][A-Z0-9-]{2,31}$/.test(id) || !["report", "product"].includes(role)) {
      return Response.json({ error: "Invalid certificate image details." }, { status: 400 });
    }
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      return Response.json({ error: "Choose a JPG, PNG, WEBP, or GIF image." }, { status: 400 });
    }
    if (!file.size || file.size > 3 * 1024 * 1024) {
      return Response.json({ error: "Each image must be smaller than 3 MB." }, { status: 413 });
    }
    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const blob = await put(`certificates/images/${id}-${role}.${extension}`, file, {
      access: "public", addRandomSuffix: true, contentType: file.type,
    });
    return Response.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/suspend|disabled|deactivat/i.test(message)) {
      return Response.json({ error: "Image storage is suspended in Vercel. Reactivate the Blob store or connect an active store in Vercel before uploading." }, { status: 503 });
    }
    return Response.json({ error: "The image could not be uploaded. Please try again." }, { status: 500 });
  }
}
