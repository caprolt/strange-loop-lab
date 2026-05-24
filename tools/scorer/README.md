# Strange Loop Lab Local Scorer

Local-first human scoring portal for experiment run outputs.

## What this tool does

- discovers experiments from `experiments/*`
- loads `cases.yaml` and `rubric.yaml`
- loads run outputs from `outputs/runs/*.jsonl`
- lets a human score one run result at a time
- saves append-only score records to `outputs/scores/<run-file-base>.scores.jsonl`
- restores latest score state per `run_id` on reload
- supports status/model/case/tag filtering
- exports a local JSON summary

## Quick start

From the repository root:

```bash
cd tools/scorer
npm install
npm run dev
```

Open [http://localhost:3100](http://localhost:3100).

## Expected directories

The scorer reads and writes these directories under the repository root:

- `experiments/`
- `outputs/runs/`
- `outputs/scores/`

Create `outputs/runs/*.jsonl` run files from experiment outputs, then load them in the portal.

## Local-only warning

This scorer is a local-first review tool. It reads and writes files from the repository.

Do not deploy it as a public web app without adding authentication, authorization, strict path restrictions, and a proper persistence design.
