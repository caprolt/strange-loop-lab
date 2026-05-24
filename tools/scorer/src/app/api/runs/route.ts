import { NextResponse } from "next/server";
import { listRunFiles } from "@/lib/server/runs";

export async function GET() {
  try {
    const runs = await listRunFiles();
    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load run files: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
