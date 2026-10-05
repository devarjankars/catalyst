import { NextResponse } from "next/server";

// Silences the Chrome DevTools 404 noise.
// Chrome v136+ probes this endpoint automatically.
export async function GET() {
  return NextResponse.json({});
}
