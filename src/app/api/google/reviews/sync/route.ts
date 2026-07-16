import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Google Business Profile sync requires OAuth credentials and explicit integration setup.",
    },
    { status: 501 },
  );
}
