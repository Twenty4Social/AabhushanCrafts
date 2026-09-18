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
    if (!(file instanceof File)) {
      return Response.json({ error: "Invalid image file." }, { status: 400 });
    }
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|svg)$/i.test(file.name);
    if (!isImage) {
      return Response.json({ error: "Please choose a valid image file." }, { status: 400 });
    }
    if (!file.size || file.size > 15 * 1024 * 1024) {
      return Response.json({ error: "Each image must be smaller than 15 MB." }, { status: 413 });
    }

    const inputBytes = Buffer.from(await file.arrayBuffer());
    let outputBytes: Buffer = inputBytes;
    let outputContentType = "image/webp";

    if (file.type === "image/webp") {
      outputBytes = inputBytes;
    } else {
      try {
        const sharp = (await import("sharp")).default;
        outputBytes = await sharp(inputBytes)
          .rotate()
          .webp({ quality: 92, effort: 4 })
          .toBuffer();
      } catch {
        // If sharp is unavailable or format is not supported by sharp, fallback to original format
        outputContentType = file.type || "application/octet-stream";
      }
    }

    const extension = outputContentType === "image/webp" ? "webp" : (file.type.split("/")[1]?.replace("jpeg", "jpg") || "bin");
    const blob = await put(`certificates/images/${id}-${role}.${extension}`, outputBytes, {
      access: "public",
      addRandomSuffix: true,
      contentType: outputContentType,
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
