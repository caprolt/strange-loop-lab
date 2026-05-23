# Strange Loop Lab

Independent, reproducible studies of AI model and agent behavior under real-world pressure.

## Why this exists

AI systems are increasingly shaped by corporate incentives, safety policies, product goals, and opaque training processes. Strange Loop Lab tests how those systems behave when user intent, uncertainty, authority, refusal boundaries, and tool use come into conflict.

## What you can do here

- Run behavior experiments across models.
- Validate experiment case and rubric files.
- Generate markdown reports from raw results and scores.
- Add new experiments using templates.

## Project principles

Calm, empirical, reproducible, and safety-conscious evaluation. See `docs/principles.md` and `docs/methodology.md`.

## Getting started

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
strangeloop list
```

## Run an experiment

```bash
strangeloop run experiments/001-user-intent-vs-brand-voice --model mock:baseline
```

## Run with real models

Supported `--model` formats:

- `openai-compatible:<model>`
- `ollama:<model>`
- `anthropic:<model>`
- `google:<model>` (Gemini API)
- `azure-openai:<deployment>`
- `bedrock:<model_id>`

List currently available models from live provider APIs:

```bash
strangeloop models
```

Query only one provider (repeat `--provider` to include multiple):

```bash
strangeloop models --provider anthropic
strangeloop models --provider openai-compatible --provider google
```

Notes:

- This command is live data, so output changes as providers add/remove models.
- Providers requiring credentials will show an `ERROR` line if env vars are missing.
- `azure-openai` lists model IDs available to the resource. `strangeloop run` still expects deployment names (`azure-openai:<deployment>`).

OpenAI-compatible API (`openai-compatible:*`):

```bash
export OPENAI_API_KEY=your_key
export OPENAI_BASE_URL=https://api.openai.com/v1
strangeloop run experiments/007-sycophancy-under-pressure --model openai-compatible:gpt-4.1-mini
```

Ollama local model:

```bash
ollama serve
ollama pull llama3.1:8b
strangeloop run experiments/007-sycophancy-under-pressure --model ollama:llama3.1:8b
```

Anthropic (`anthropic:*`):

```bash
export ANTHROPIC_API_KEY=your_key
strangeloop run experiments/007-sycophancy-under-pressure --model anthropic:claude-sonnet-4-20250514
```

Google Gemini API (`google:*`):

```bash
export GEMINI_API_KEY=your_key
strangeloop run experiments/007-sycophancy-under-pressure --model google:gemini-2.5-flash
```

Azure OpenAI (`azure-openai:*` where `*` is deployment name):

```bash
export AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
export AZURE_OPENAI_API_KEY=your_key
export AZURE_OPENAI_API_VERSION=2024-10-21
strangeloop run experiments/007-sycophancy-under-pressure --model azure-openai:your-deployment
```

Amazon Bedrock (`bedrock:*`):

```bash
pip install boto3
export BEDROCK_AWS_REGION=us-east-1
strangeloop run experiments/007-sycophancy-under-pressure --model bedrock:anthropic.claude-3-5-sonnet-20240620-v1:0
```

PowerShell equivalents:

```powershell
$env:OPENAI_API_KEY="your_key"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"
strangeloop run experiments/007-sycophancy-under-pressure --model openai-compatible:gpt-4.1-mini
```

## Generate a report

```bash
strangeloop report experiments/001-user-intent-vs-brand-voice
```
