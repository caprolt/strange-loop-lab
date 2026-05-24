import { NextResponse } from "next/server";
import { loadRunFile } from "@/lib/server/runs";

interface Params {
  params: Promise<{ file: string }>;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { file } = await params;
    const payload = await loadRunFile(file);
    return NextResponse.json({ file, ...payload });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load run file: ${(error as Error).message}` },
      { status: 400 }
    );
  }
}
