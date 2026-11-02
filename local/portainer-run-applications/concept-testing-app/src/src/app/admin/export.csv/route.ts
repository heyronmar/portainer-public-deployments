import { connection } from "next/server";
import { listResponses } from "@/lib/db";
import { toCsv } from "@/lib/report";

export async function GET() {
  await connection();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(listResponses()), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="concept-test-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
