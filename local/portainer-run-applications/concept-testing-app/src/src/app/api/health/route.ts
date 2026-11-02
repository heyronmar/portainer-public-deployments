import { connection, NextResponse } from "next/server";
import { ping } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    ping();
    return NextResponse.json({ status: "ok" });
  } catch (e) {
    return NextResponse.json({ status: "error", error: String(e) }, { status: 503 });
  }
}
