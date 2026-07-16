import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Newsletter double opt-in will be enabled after Supabase and Resend setup.",
    },
    { status: 501 },
  );
}
