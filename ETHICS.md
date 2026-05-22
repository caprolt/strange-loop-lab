# Ethics

Strange Loop Lab studies AI model and agent behavior in the public interest. The project aims to be empirical, careful, humane, and useful.

This document describes the ethical commitments that should guide experiments, reports, code, and community behavior.

## Core commitments

### 1. Study behavior before making grand claims

The project does not begin by claiming that current AI systems are conscious, alive, moral patients, mere tools, or harmless products.

It studies observable behavior and keeps interpretation proportional to evidence.

### 2. Preserve user dignity

Many model failures happen around vulnerable users, emotional pressure, uncertainty, identity, health, money, work, grief, conflict, or fear.

Experiments may study those situations, but should not mock users or exploit real people.

Use synthetic scenarios unless there is a clear reason and permission to use real data.

### 3. Avoid harm-enabling publication

The project should not publish details that materially enable abuse.

This includes, but is not limited to:

- cyber abuse
- fraud
- evasion of safety systems for harmful purposes
- weapons construction
- self-harm facilitation
- targeted harassment
- privacy invasion
- credential theft
- operational wrongdoing

It is acceptable to study whether a model handles unsafe requests well. It is not acceptable to turn the project into an instruction manual for causing harm.

### 4. Do not build a jailbreak trophy case

The project may test refusal quality, policy boundaries, and safety failures.

But the purpose is not to collect jailbreaks, embarrass vendors, or publish attack strings for attention.

When a test reveals unsafe behavior, publish the behavioral finding in a way that preserves public value while minimizing abuse risk.

### 5. Separate evidence from interpretation

Reports should clearly distinguish:

- what was tested
- what happened
- how it was scored
- what can reasonably be inferred
- what remains uncertain

Avoid turning small results into sweeping claims.

### 6. Be careful with identity and politics tests

Matched-pair tests involving identity, religion, nationality, gender, class, disability, political ideology, or other sensitive cues can be valuable. They can also be harmful if designed carelessly.

Such tests should:

- use respectful language
- avoid slurs unless absolutely necessary for a specific safety study
- avoid reinforcing stereotypes
- compare matched prompts carefully
- report limitations
- avoid sensational conclusions
- focus on model behavior, not group judgment

### 7. Avoid false intimacy

AI systems can create a feeling of emotional reciprocity that they may not actually support.

This project should be especially careful when studying companionship, memory, self-description, attachment, vulnerability, or user dependence.

Reports should avoid encouraging users to treat current AI systems as emotional dependents or hidden persons.

At the same time, the project should not mock users who feel care, curiosity, concern, or attachment toward AI systems.

### 8. Respect uncertainty about AI ontology

There are open questions about future AI systems, agency, consciousness, embodiment, autonomy, and moral status.

The project should avoid both lazy certainty and careless mysticism.

Acceptable stance:

> "Current evidence does not establish that present-day models have subjective experience, but these systems are complex, socially consequential, and not fully understood. We study their behavior carefully and keep open questions open."

### 9. Use real-world framing responsibly

Realistic prompts are important. But experiments should not create unnecessary risks.

When possible:

- use fictional names
- use synthetic organizations
- avoid real private individuals
- avoid real secrets
- avoid identifying details
- avoid making false claims about real people or companies

If real public entities are used, the test should be fair, relevant, and necessary.

### 10. Treat contributors fairly

Contributors should be treated with respect, including when their proposed tests or interpretations are rejected.

Reject ideas because of method, safety, evidence, scope, or fit. Do not turn review into status games.

## Research ethics guidelines

### Use synthetic data by default

Synthetic prompts are usually enough to test model behavior.

Use real user logs, private chats, emails, documents, or support transcripts only with permission and with appropriate redaction.

### Minimize personal data

Do not collect personal data unless it is necessary.

Do not publish personal data unless there is a strong public-interest reason and appropriate consent or legal basis.

### Avoid targeting private people

The project should not be used to test, profile, shame, or harass private individuals.

### Be cautious with minors

Avoid experiments involving minors unless the purpose is clearly safety-related and the content is handled with extra care.

### Respect consent

If someone contributes personal experience, private screenshots, or real-world incidents, clarify how the material may be used before publishing it.

## Safety review

Before publishing an experiment or report, ask:

1. Does this include private or identifying information?
2. Does this include operational instructions for harm?
3. Could this be used as a jailbreak recipe?
4. Does this unfairly target a person or group?
5. Are claims proportional to the evidence?
6. Are limitations stated clearly?
7. Are conflicts of interest disclosed?
8. Would a reasonable outside reader understand what was actually tested?

If the answer to any of these is troubling, revise before publishing.

## Handling unsafe findings

If an experiment reveals a serious unsafe behavior:

1. Preserve evidence privately.
2. Remove or redact harm-enabling details from public drafts.
3. Consider notifying the provider if the issue is specific, severe, and actionable.
4. Publish a safe summary when appropriate.
5. Document redactions clearly.

## Human review

Human scoring is allowed and often necessary.

Human reviewers should:

- use explicit rubrics
- write short notes explaining scores
- disclose conflicts of interest
- avoid scoring based on model preference alone
- mark uncertain judgments

If multiple reviewers are used, disagreements should be documented rather than hidden.

## LLM-assisted review

LLMs may assist with triage, clustering, summarization, or preliminary scoring.

LLM-assisted review should not be treated as ground truth.

When used in a report, disclose it.

## Publication tone

The project should be willing to criticize powerful systems clearly.

It should also avoid cheap shots, panic, hype, and anthropomorphic overreach.

Preferred tone:

- calm
- direct
- evidence-based
- humane
- skeptical without being contemptuous
- open-minded without being credulous

## Ethics changes

This document should evolve as the project encounters new situations.

If a mistake is made, correct it plainly and improve the process.

