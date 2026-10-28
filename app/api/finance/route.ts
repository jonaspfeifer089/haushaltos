import { NextResponse } from "next/server";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function GET() {
  const res = await fetch(`${REDIS_URL}/get/haushaltsbuch`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: "no-store"
  });
  const data = await res.json();
  // Wenn noch keine Daten existieren, leeres Array zurückgeben
  return NextResponse.json(data.result ? JSON.parse(data.result) : []);
}

export async function POST(req: Request) {
  const expenses = await req.json();
  await fetch(`${REDIS_URL}/set/haushaltsbuch`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(expenses)
  });
  return NextResponse.json({ success: true });
}
