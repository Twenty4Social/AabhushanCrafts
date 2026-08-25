import { refreshBullionRates } from "@/app/lib/rates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  try {
    const rates = await refreshBullionRates();
    return Response.json({ ok: true, updatedAt: rates.updatedAt, fineGold: rates.fineGoldPerTola });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The gold rate could not be refreshed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
