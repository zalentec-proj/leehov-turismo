import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Google review replies will be implemented server-side after OAuth setup.",
    },
    { status: 501 },
  );
}
