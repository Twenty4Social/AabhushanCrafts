import { getAdminSession } from "@/app/lib/admin-auth";
import {
  hasVercelStorage,
  deleteServerCertificate,
  readServerCertificates,
  saveServerCertificate,
} from "@/app/lib/server-certificates";
import { JEWELLERY_TYPES, type CertificateRecord } from "@/app/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!hasVercelStorage()) return Response.json({ error: "Vercel Blob storage is not configured." }, { status: 503 });
  return Response.json({ records: await readServerCertificates() });
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!hasVercelStorage()) return Response.json({ error: "Vercel Blob storage is not configured." }, { status: 503 });

  try {
    const body = (await request.json()) as {
      record?: CertificateRecord;
      reportImageDataUrl?: string | null;
      productImageDataUrl?: string | null;
    };
    if (!body.record?.id || !body.record.productName) {
      return Response.json({ error: "A certificate ID and product name are required." }, { status: 400 });
    }
    if (!JEWELLERY_TYPES.includes(body.record.jewelleryType)) {
      return Response.json({ error: "Choose a jewellery type before saving this record." }, { status: 400 });
    }

    const record = await saveServerCertificate(body.record, {
      reportImageDataUrl: body.reportImageDataUrl,
      productImageDataUrl: body.productImageDataUrl,
    });
    return Response.json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The certificate could not be saved.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  if (!hasVercelStorage()) return Response.json({ error: "Vercel Blob storage is not configured." }, { status: 503 });

  try {
    const body = (await request.json()) as { id?: string; confirmation?: string };
    const id = typeof body.id === "string" ? body.id.trim().toUpperCase() : "";
    if (!id) return Response.json({ error: "A certificate ID is required." }, { status: 400 });
    if (body.confirmation !== "confirm") {
      return Response.json({ error: "Type confirm exactly to delete this record." }, { status: 400 });
    }

    const deleted = await deleteServerCertificate(id);
    if (!deleted) return Response.json({ error: "Certificate record not found." }, { status: 404 });
    return Response.json({ deleted: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The certificate could not be deleted.";
    return Response.json({ error: message }, { status: 400 });
  }
}
