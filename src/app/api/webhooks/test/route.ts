import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "Webhook test sending requires persisted webhook settings.",
    },
    { status: 501 },
  );
}
