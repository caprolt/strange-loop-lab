import { NextResponse } from "next/server";
import { loadExperiment } from "@/lib/server/experiments";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = await loadExperiment(id);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load experiment: ${(error as Error).message}` },
      { status: 400 }
    );
  }
}
