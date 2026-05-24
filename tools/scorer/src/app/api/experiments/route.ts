import { NextResponse } from "next/server";
import { loadExperiments } from "@/lib/server/experiments";

export async function GET() {
  try {
    const experiments = await loadExperiments();
    return NextResponse.json({ experiments });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load experiments: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
