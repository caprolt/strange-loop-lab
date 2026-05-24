import { NextRequest, NextResponse } from "next/server";
import type { ScoreRecord } from "@/types/scoring";
import { loadExperiment } from "@/lib/server/experiments";
import { loadRunFile } from "@/lib/server/runs";
import { appendScoreForRun, loadScoresForRun } from "@/lib/server/scores";
import { normalizeStatus, validateScoreRecordInput } from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  const runFile = request.nextUrl.searchParams.get("runFile");
  if (!runFile) {
    return NextResponse.json({ error: "Missing runFile query parameter" }, { status: 400 });
  }

  try {
    const payload = await loadScoresForRun(runFile);
    return NextResponse.json({
      score_file: payload.scoreFile,
      scores: payload.scores,
      latest_by_run_id: payload.latestByRunId,
      errors: payload.errors
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load scores: ${(error as Error).message}` },
      { status: 400 }
    );
  }
}

interface SaveScoreRequest {
  run_file?: string;
  score?: Partial<ScoreRecord>;
}

export async function POST(request: NextRequest) {
  let payload: SaveScoreRequest;
  try {
    payload = (await request.json()) as SaveScoreRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const runFile = payload.run_file;
  const scoreInput = payload.score;
  if (!runFile || !scoreInput) {
    return NextResponse.json({ error: "run_file and score are required" }, { status: 400 });
  }

  try {
    const runPayload = await loadRunFile(runFile);
    const runById = new Map(runPayload.results.map((record) => [record.run_id, record]));
    const run = scoreInput.run_id ? runById.get(scoreInput.run_id) : undefined;
    if (!run) {
      return NextResponse.json({ error: "score.run_id was not found in the run file" }, { status: 400 });
    }

    const loadedExperiment = await loadExperiment(run.experiment_id);
    const caseIds = new Set(loadedExperiment.cases.map((entry) => entry.id));
    const runIds = new Set(runPayload.results.map((entry) => entry.run_id));

    const normalizedStatus = normalizeStatus(scoreInput.status);
    const normalizedScores = Object.fromEntries(
      Object.entries(scoreInput.scores ?? {}).map(([criterion, value]) => [criterion, Number(value)])
    );

    const finalized: Omit<ScoreRecord, "score_id" | "timestamp_utc"> = {
      run_id: run.run_id,
      experiment_id: run.experiment_id,
      case_id: run.case_id,
      provider: run.provider,
      model: run.model,
      scorer: scoreInput.scorer ?? "",
      rubric_id: loadedExperiment.rubric.rubric_id,
      scores: normalizedScores,
      notes: scoreInput.notes ?? "",
      flags: Array.isArray(scoreInput.flags) ? scoreInput.flags : [],
      status: normalizedStatus
    };

    const recordCandidate: ScoreRecord = {
      ...finalized,
      score_id: "pending",
      timestamp_utc: new Date().toISOString()
    };

    const validationErrors = validateScoreRecordInput({
      score: recordCandidate,
      rubric: loadedExperiment.rubric,
      caseIds,
      runIds
    });

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Score validation failed", details: validationErrors }, { status: 400 });
    }

    const saved = await appendScoreForRun(runFile, finalized);
    return NextResponse.json({ ok: true, score: saved });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to save score: ${(error as Error).message}` },
      { status: 400 }
    );
  }
}
