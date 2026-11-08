import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  try {
    await query("SELECT 1");
    database = true;
  } catch (error) {
    console.error("Database check failed", error);
  }
  return Response.json({ ok: database, database, geminiKeySet: Boolean(process.env.GEMINI_API_KEY) });
}
