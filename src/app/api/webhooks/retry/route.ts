import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "Webhook retry requires webhook_logs persisted in Supabase.",
    },
    { status: 501 },
  );
}
