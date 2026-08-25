import { getLiveBullionRates } from "@/app/lib/rates";

export const dynamic = "force-dynamic";

export async function GET() {
  const rates = await getLiveBullionRates();
  return Response.json(rates, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
