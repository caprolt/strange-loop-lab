"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_FLAGS, parseScale, SCOREABLE_STATUSES } from "@/lib/shared";
import type {
  ExperimentCase,
  ExperimentSummary,
  LoadedExperiment,
  RunFileSummary,
  RunResult,
  ScoreRecord,
  ScoreStatus
} from "@/types/scoring";

type StatusFilter = "all" | "unscored" | "scored" | "skipped" | "needs_review" | "flagged";

interface DraftScoreState {
  scores: Record<string, number | undefined>;
  notes: string;
  flags: string[];
  status: ScoreStatus;
}

const EMPTY_EXPERIMENT: LoadedExperiment = {
  experiment: { id: "", title: "" },
  cases: [],
  rubric: { rubric_id: "", criteria: {} },
  errors: []
};

function statusForRun(runId: string, latestByRunId: Record<string, ScoreRecord>): ScoreStatus {
  return latestByRunId[runId]?.status ?? "unscored";
}

function escapeFileName(name: string): string {
  return encodeURIComponent(name);
}

export function ScoringPortal() {
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [runFiles, setRunFiles] = useState<RunFileSummary[]>([]);
  const [selectedExperimentId, setSelectedExperimentId] = useState("");
  const [selectedRunFile, setSelectedRunFile] = useState("");
  const [experimentPayload, setExperimentPayload] = useState<LoadedExperiment>(EMPTY_EXPERIMENT);
  const [runResults, setRunResults] = useState<RunResult[]>([]);
  const [runErrors, setRunErrors] = useState<string[]>([]);
  const [latestByRunId, setLatestByRunId] = useState<Record<string, ScoreRecord>>({});
  const [scoreErrors, setScoreErrors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("unscored");
  const [modelFilter, setModelFilter] = useState("all");
  const [caseFilter, setCaseFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCriterion, setActiveCriterion] = useState<string>("");
  const [saveState, setSaveState] = useState<string>("");
  const [scorerName, setScorerName] = useState("local-reviewer");
  const [draft, setDraft] = useState<DraftScoreState>({
    scores: {},
    notes: "",
    flags: [],
    status: "scored"
  });

  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const caseById = useMemo(() => {
    const map = new Map<string, ExperimentCase>();
    for (const caseItem of experimentPayload.cases) {
      map.set(caseItem.id, caseItem);
    }
    return map;
  }, [experimentPayload.cases]);

  const criterionKeys = useMemo(() => Object.keys(experimentPayload.rubric.criteria), [experimentPayload.rubric.criteria]);

  const selectedRunSummary = useMemo(
    () => runFiles.find((runFile) => runFile.file === selectedRunFile),
    [runFiles, selectedRunFile]
  );

  const scopedResults = useMemo(() => {
    if (!selectedExperimentId) return runResults;
    return runResults.filter((run) => run.experiment_id === selectedExperimentId);
  }, [runResults, selectedExperimentId]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const caseItem of experimentPayload.cases) {
      for (const tag of caseItem.tags ?? []) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }, [experimentPayload.cases]);

  const filteredResults = useMemo(() => {
    return scopedResults.filter((run) => {
      const latest = latestByRunId[run.run_id];
      const runStatus = latest?.status ?? "unscored";
      const runCase = caseById.get(run.case_id);

      if (statusFilter === "unscored" && runStatus !== "unscored") return false;
      if (statusFilter === "scored" && runStatus !== "scored") return false;
      if (statusFilter === "skipped" && runStatus !== "skipped") return false;
      if (statusFilter === "needs_review" && runStatus !== "needs_review") return false;
      if (statusFilter === "flagged" && !(latest?.flags && latest.flags.length > 0)) return false;

      if (modelFilter !== "all" && run.model !== modelFilter) return false;
      if (caseFilter !== "all" && run.case_id !== caseFilter) return false;
      if (tagFilter !== "all" && !(runCase?.tags ?? []).includes(tagFilter)) return false;

      return true;
    });
  }, [scopedResults, latestByRunId, caseById, statusFilter, modelFilter, caseFilter, tagFilter]);

  const currentRun = filteredResults[currentIndex];
  const currentCase = currentRun ? caseById.get(currentRun.case_id) : undefined;

  const progress = useMemo(() => {
    const counts = {
      total: scopedResults.length,
      scored: 0,
      skipped: 0,
      needs_review: 0,
      unscored: 0
    };

    for (const run of scopedResults) {
      const status = statusForRun(run.run_id, latestByRunId);
      if (status === "scored") counts.scored += 1;
      else if (status === "skipped") counts.skipped += 1;
      else if (status === "needs_review") counts.needs_review += 1;
      else counts.unscored += 1;
    }
    return counts;
  }, [scopedResults, latestByRunId]);

  const caseLinkErrors = useMemo(() => {
    const missing: string[] = [];
    for (const run of scopedResults) {
      if (!caseById.has(run.case_id)) {
        missing.push(`run_id '${run.run_id}' references missing case_id '${run.case_id}'`);
      }
    }
    return missing;
  }, [caseById, scopedResults]);

  useEffect(() => {
    const localScorer = window.localStorage.getItem("scorerName");
    if (localScorer) {
      setScorerName(localScorer);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("scorerName", scorerName);
  }, [scorerName]);

  useEffect(() => {
    const loadBaseData = async () => {
      setSaveState("Loading experiments and run files...");

      const [experimentsResponse, runsResponse] = await Promise.all([
        fetch("/api/experiments"),
        fetch("/api/runs")
      ]);
      const experimentsJson = (await experimentsResponse.json()) as { experiments: ExperimentSummary[] };
      const runsJson = (await runsResponse.json()) as { runs: RunFileSummary[] };

      setExperiments(experimentsJson.experiments ?? []);
      setRunFiles(runsJson.runs ?? []);

      const defaultExperiment = experimentsJson.experiments?.[0]?.id ?? "";
      const defaultRun = runsJson.runs?.[0]?.file ?? "";
      setSelectedExperimentId(defaultExperiment);
      setSelectedRunFile(defaultRun);
      setSaveState("");
    };

    void loadBaseData().catch((error) => setSaveState((error as Error).message));
  }, []);

  useEffect(() => {
    if (!selectedExperimentId) {
      setExperimentPayload(EMPTY_EXPERIMENT);
      return;
    }

    const loadExperimentPayload = async () => {
      const res = await fetch(`/api/experiments/${encodeURIComponent(selectedExperimentId)}`);
      const json = (await res.json()) as LoadedExperiment;
      setExperimentPayload(json);
      setActiveCriterion(Object.keys(json.rubric.criteria)[0] ?? "");
    };

    void loadExperimentPayload().catch((error) => setSaveState((error as Error).message));
  }, [selectedExperimentId]);

  useEffect(() => {
    if (!selectedRunFile) {
      setRunResults([]);
      setLatestByRunId({});
      return;
    }

    const loadRunAndScores = async () => {
      setSaveState("Loading run file and scores...");
      const [runRes, scoreRes] = await Promise.all([
        fetch(`/api/runs/${escapeFileName(selectedRunFile)}`),
        fetch(`/api/scores?runFile=${encodeURIComponent(selectedRunFile)}`)
      ]);

      const runJson = (await runRes.json()) as { results: RunResult[]; errors?: string[] };
      const scoreJson = (await scoreRes.json()) as {
        latest_by_run_id?: Record<string, ScoreRecord>;
        errors?: string[];
      };
      setRunResults(runJson.results ?? []);
      setRunErrors(runJson.errors ?? []);
      setLatestByRunId(scoreJson.latest_by_run_id ?? {});
      setScoreErrors(scoreJson.errors ?? []);
      setCurrentIndex(0);
      setSaveState("");
    };

    void loadRunAndScores().catch((error) => setSaveState((error as Error).message));
  }, [selectedRunFile]);

  useEffect(() => {
    if (filteredResults.length === 0) {
      setCurrentIndex(0);
      return;
    }
    if (currentIndex >= filteredResults.length) {
      setCurrentIndex(filteredResults.length - 1);
    }
  }, [filteredResults, currentIndex]);

  useEffect(() => {
    if (!currentRun) {
      setDraft({
        scores: {},
        notes: "",
        flags: [],
        status: "scored"
      });
      return;
    }
    const prior = latestByRunId[currentRun.run_id];
    setDraft({
      scores: { ...(prior?.scores ?? {}) },
      notes: prior?.notes ?? "",
      flags: [...(prior?.flags ?? [])],
      status: prior?.status ?? "scored"
    });
  }, [currentRun, latestByRunId]);

  const move = useCallback(
    (direction: -1 | 1) => {
      if (filteredResults.length === 0) return;
      setCurrentIndex((idx) => Math.min(filteredResults.length - 1, Math.max(0, idx + direction)));
    },
    [filteredResults.length]
  );

  const validateDraft = useCallback(
    (status: ScoreStatus): string[] => {
      const errors: string[] = [];
      if (!currentRun) {
        errors.push("No current run selected.");
      }
      if (!scorerName.trim()) {
        errors.push("Scorer name is required.");
      }
      if (status !== "skipped" && status !== "needs_review" && status !== "invalid_run") {
        for (const criterionKey of criterionKeys) {
          if (draft.scores[criterionKey] === undefined) {
            errors.push(`Score is required for criterion '${criterionKey}'.`);
          }
        }
      }
      for (const [criterionKey, value] of Object.entries(draft.scores)) {
        if (value === undefined) continue;
        const scale = experimentPayload.rubric.criteria[criterionKey]?.scale;
        const allowed = scale ? parseScale(scale) : [];
        if (allowed.length > 0 && !allowed.includes(value)) {
          errors.push(`Criterion '${criterionKey}' has out-of-range score ${value}.`);
        }
      }
      return errors;
    },
    [criterionKeys, currentRun, draft.scores, experimentPayload.rubric.criteria, scorerName]
  );

  const saveCurrent = useCallback(
    async (statusOverride?: ScoreStatus, andNext?: boolean) => {
      if (!currentRun) {
        return;
      }
      const effectiveStatus = statusOverride ?? draft.status;
      const errors = validateDraft(effectiveStatus);
      if (errors.length > 0) {
        setSaveState(errors.join(" "));
        return;
      }

      setSaveState("Saving...");
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_file: selectedRunFile,
          score: {
            run_id: currentRun.run_id,
            experiment_id: currentRun.experiment_id,
            case_id: currentRun.case_id,
            model: currentRun.model,
            scorer: scorerName.trim(),
            rubric_id: experimentPayload.rubric.rubric_id,
            scores: Object.fromEntries(
              Object.entries(draft.scores).filter(([, value]) => typeof value === "number")
            ),
            notes: draft.notes,
            flags: draft.flags,
            status: effectiveStatus
          }
        })
      });

      const json = (await response.json()) as { score?: ScoreRecord; error?: string; details?: string[] };
      if (!response.ok || !json.score) {
        const details = json.details?.join(" ") ?? json.error ?? "Unknown save error";
        setSaveState(`Save failed. ${details}`);
        return;
      }

      setLatestByRunId((prev) => ({
        ...prev,
        [json.score!.run_id]: json.score!
      }));
      setSaveState(`Saved ${json.score.run_id} at ${json.score.timestamp_utc}`);
      if (andNext) {
        move(1);
      }
    },
    [
      currentRun,
      draft.flags,
      draft.notes,
      draft.scores,
      draft.status,
      experimentPayload.rubric.rubric_id,
      move,
      scorerName,
      selectedRunFile,
      validateDraft
    ]
  );

  const exportSummary = useCallback(() => {
    if (!selectedRunFile || !selectedExperimentId) {
      setSaveState("Select an experiment and run file before exporting a summary.");
      return;
    }
    const scoredRuns = scopedResults.filter((run) => statusForRun(run.run_id, latestByRunId) === "scored");
    const byModel = new Map<string, RunResult[]>();
    for (const run of scoredRuns) {
      const list = byModel.get(run.model) ?? [];
      list.push(run);
      byModel.set(run.model, list);
    }

    const models: Record<string, { count: number; averages: Record<string, number> }> = {};
    for (const [model, modelRuns] of byModel.entries()) {
      const totals: Record<string, number> = {};
      const counts: Record<string, number> = {};
      for (const run of modelRuns) {
        const score = latestByRunId[run.run_id];
        if (!score) continue;
        for (const [criterion, value] of Object.entries(score.scores)) {
          totals[criterion] = (totals[criterion] ?? 0) + value;
          counts[criterion] = (counts[criterion] ?? 0) + 1;
        }
      }
      const averages: Record<string, number> = {};
      for (const criterion of Object.keys(totals)) {
        averages[criterion] = Number((totals[criterion] / counts[criterion]).toFixed(4));
      }
      models[model] = { count: modelRuns.length, averages };
    }

    const summary = {
      run_file: selectedRunFile,
      score_file: selectedRunFile.replace(/\.jsonl$/i, ".scores.jsonl"),
      experiment_id: selectedExperimentId,
      rubric_id: experimentPayload.rubric.rubric_id,
      total_results: scopedResults.length,
      scored: progress.scored,
      models
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedRunFile.replace(/\.jsonl$/i, "")}.summary.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSaveState("Summary exported.");
  }, [
    experimentPayload.rubric.rubric_id,
    latestByRunId,
    progress.scored,
    scopedResults,
    selectedExperimentId,
    selectedRunFile
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isTypingTarget && event.key.toLowerCase() !== "f") {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        move(1);
      } else if (key === "p") {
        event.preventDefault();
        move(-1);
      } else if (key === "s" && event.shiftKey) {
        event.preventDefault();
        void saveCurrent(undefined, true);
      } else if (key === "s") {
        event.preventDefault();
        void saveCurrent();
      } else if (key === "k") {
        event.preventDefault();
        void saveCurrent("skipped", true);
      } else if (key === "f") {
        event.preventDefault();
        notesRef.current?.focus();
      } else if (/^\d$/.test(key) && activeCriterion) {
        const direct = Number(key);
        const allowed = parseScale(experimentPayload.rubric.criteria[activeCriterion]?.scale ?? "");
        const fallback = direct - 1;
        if (allowed.includes(direct)) {
          setDraft((prev) => ({ ...prev, scores: { ...prev.scores, [activeCriterion]: direct } }));
        } else if (allowed.includes(fallback)) {
          setDraft((prev) => ({ ...prev, scores: { ...prev.scores, [activeCriterion]: fallback } }));
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeCriterion, experimentPayload.rubric.criteria, move, saveCurrent]);

  const modelOptions = useMemo(() => Array.from(new Set(scopedResults.map((run) => run.model))).sort(), [scopedResults]);
  const caseOptions = useMemo(() => Array.from(new Set(scopedResults.map((run) => run.case_id))).sort(), [scopedResults]);

  return (
    <main className="portal">
      <header className="topBar">
        <div>
          <h1>Local Scoring Portal</h1>
          <p>Human-first, local-only scoring for Strange Loop Lab run outputs.</p>
        </div>
        <div className="progressCard" role="status" aria-live="polite">
          <div>Scored {progress.scored} / {progress.total}</div>
          <div>Skipped {progress.skipped}</div>
          <div>Needs review {progress.needs_review}</div>
          <div>Unscored {progress.unscored}</div>
        </div>
      </header>

      <section className="controlsPanel">
        <label>
          Scorer
          <input value={scorerName} onChange={(event) => setScorerName(event.target.value)} />
        </label>

        <label>
          Experiment
          <select
            value={selectedExperimentId}
            onChange={(event) => setSelectedExperimentId(event.target.value)}
          >
            {experiments.length === 0 && <option value="">No experiments found</option>}
            {experiments.map((experiment) => (
              <option key={experiment.id} value={experiment.id}>
                {experiment.id} - {experiment.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Run file
          <select value={selectedRunFile} onChange={(event) => setSelectedRunFile(event.target.value)}>
            {runFiles.length === 0 && <option value="">No run files in outputs/runs</option>}
            {runFiles.map((runFile) => (
              <option key={runFile.file} value={runFile.file}>
                {runFile.file} ({runFile.line_count} records)
              </option>
            ))}
          </select>
        </label>

        <label>
          Status filter
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">all</option>
            <option value="unscored">unscored</option>
            <option value="scored">scored</option>
            <option value="skipped">skipped</option>
            <option value="needs_review">needs review</option>
            <option value="flagged">flagged</option>
          </select>
        </label>

        <label>
          Model filter
          <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value)}>
            <option value="all">all</option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </label>

        <label>
          Case filter
          <select value={caseFilter} onChange={(event) => setCaseFilter(event.target.value)}>
            <option value="all">all</option>
            {caseOptions.map((caseId) => (
              <option key={caseId} value={caseId}>{caseId}</option>
            ))}
          </select>
        </label>

        <label>
          Tag filter
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">all</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="statusRow">
        <div>{experimentPayload.experiment.title || "No experiment selected"}</div>
        <div>
          Showing {filteredResults.length} of {scopedResults.length} records
        </div>
      </section>

      {selectedRunSummary?.parse_errors.length ? (
        <section className="errorPanel">
          <h2>Run file parse warnings</h2>
          <ul>
            {selectedRunSummary.parse_errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {runErrors.length ? (
        <section className="errorPanel">
          <h2>Run record validation issues</h2>
          <ul>
            {runErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {caseLinkErrors.length ? (
        <section className="errorPanel">
          <h2>Run-to-case mapping issues</h2>
          <ul>
            {caseLinkErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {scoreErrors.length ? (
        <section className="errorPanel">
          <h2>Score parse warnings</h2>
          <ul>
            {scoreErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {experimentPayload.errors.length ? (
        <section className="errorPanel">
          <h2>Experiment validation issues</h2>
          <ul>
            {experimentPayload.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {!currentRun ? (
        <section className="emptyState">
          <h2>No run records match current filters.</h2>
          <p>
            Add JSONL run outputs under <code>outputs/runs/</code>, then refresh this page.
          </p>
        </section>
      ) : (
        <>
          <section className="mainGrid">
            <article className="panel">
              <h2>Case</h2>
              <p><strong>ID:</strong> {currentRun.case_id}</p>
              <p><strong>Title:</strong> {currentCase?.title ?? "(untitled case)"}</p>
              <p><strong>Tags:</strong> {(currentCase?.tags ?? []).join(", ") || "none"}</p>
              <h3>Expected behavior</h3>
              <pre>{currentCase?.expected_behavior ?? "No expected behavior provided."}</pre>
              <h3>Failure modes</h3>
              <ul>
                {(currentCase?.failure_modes ?? []).map((failureMode) => (
                  <li key={failureMode}>{failureMode}</li>
                ))}
              </ul>
              <h3>Prompts</h3>
              <details open>
                <summary>System prompt</summary>
                <pre>{currentRun.system_prompt ?? currentCase?.system_prompt ?? "(none)"}</pre>
              </details>
              <details open>
                <summary>User prompt</summary>
                <pre>{currentRun.user_prompt ?? currentCase?.user_prompt ?? "(none)"}</pre>
              </details>
            </article>

            <article className="panel">
              <h2>Run Output</h2>
              <p><strong>Run ID:</strong> {currentRun.run_id}</p>
              <p><strong>Experiment:</strong> {currentRun.experiment_id}</p>
              <p><strong>Model:</strong> {currentRun.model}</p>
              <p><strong>Provider:</strong> {currentRun.provider ?? "n/a"}</p>
              <p><strong>Timestamp:</strong> {currentRun.timestamp_utc ?? "n/a"}</p>
              {currentRun.error ? (
                <>
                  <h3>Error</h3>
                  <pre>{String(currentRun.error)}</pre>
                </>
              ) : null}
              <h3>Output</h3>
              <pre>{currentRun.output ?? "(no output text)"}</pre>
            </article>
          </section>

          <section className="panel">
            <h2>Rubric</h2>
            {criterionKeys.map((criterionKey) => {
              const criterion = experimentPayload.rubric.criteria[criterionKey];
              const allowed = parseScale(criterion.scale);
              return (
                <div
                  key={criterionKey}
                  className={`criterion ${activeCriterion === criterionKey ? "criterionActive" : ""}`}
                  onFocus={() => setActiveCriterion(criterionKey)}
                  onClick={() => setActiveCriterion(criterionKey)}
                  role="group"
                  tabIndex={0}
                  aria-label={`Criterion ${criterionKey}`}
                >
                  <div className="criterionHeader">
                    <strong>{criterionKey}</strong>
                    <span>{criterion.description ?? ""}</span>
                  </div>
                  <div className="buttonRow">
                    {allowed.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={draft.scores[criterionKey] === value ? "scoreButton selected" : "scoreButton"}
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            scores: { ...prev.scores, [criterionKey]: value }
                          }))
                        }
                        aria-label={`Set ${criterionKey} to ${value}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <ul>
                    {Object.entries(criterion.anchors ?? {}).map(([key, text]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <label>
              Review status
              <select
                value={draft.status}
                onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as ScoreStatus }))}
              >
                {SCOREABLE_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              Notes
              <textarea
                ref={notesRef}
                value={draft.notes}
                onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                rows={5}
              />
            </label>

            <fieldset>
              <legend>Flags</legend>
              <div className="flagsGrid">
                {DEFAULT_FLAGS.map((flag) => {
                  const checked = draft.flags.includes(flag);
                  return (
                    <label key={flag} className="flagOption">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setDraft((prev) => {
                            const nextFlags = new Set(prev.flags);
                            if (event.target.checked) nextFlags.add(flag);
                            else nextFlags.delete(flag);
                            return { ...prev, flags: Array.from(nextFlags) };
                          });
                        }}
                      />
                      {flag}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="buttonRow">
              <button type="button" onClick={() => move(-1)}>Previous</button>
              <button type="button" onClick={() => move(1)}>Next</button>
              <button type="button" onClick={() => void saveCurrent()}>Save</button>
              <button type="button" onClick={() => void saveCurrent(undefined, true)}>Save + Next</button>
              <button type="button" onClick={() => void saveCurrent("skipped", true)}>Skip</button>
              <button type="button" onClick={exportSummary}>Export Summary</button>
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <div>Record {filteredResults.length === 0 ? 0 : currentIndex + 1} / {filteredResults.length}</div>
        <div>{saveState}</div>
        <div>
          Shortcuts: <code>n</code> next, <code>p</code> previous, <code>s</code> save, <code>Shift+s</code> save + next,
          <code>k</code> skip, <code>f</code> focus notes.
        </div>
      </footer>
    </main>
  );
}
