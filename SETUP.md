You are setting up a Dev Agency configuration in this project.
Create every file exactly as specified. No interpretation. No additions.
Use Write tool for each file. Confirm each creation with the file path.
Do not ask questions. Do not summarize. Just create the files.

---

## FILES TO CREATE

### 1. `.claude/CLAUDE.md`

```
# Dev Agency

## Source of Truth

| File | Purpose |
|------|---------|
| `PROJECT.md` | Architecture, stack, patterns, verification commands |
| `MEMORY.md` | JSON control block + task execution state |
| `.claude/failure-log.md` | Failure history + identified patterns |

Read all three before any action. Documenter creates any absent file.

## Reasoning (mandatory)

DECOMPOSE → SOLVE (confidence 0.0–1.0) → VERIFY → SYNTHESIZE → REFLECT
Confidence < 0.85 → identify gap → retry.

## Agents

| Agent | Scope | Model | When |
|-------|-------|-------|------|
| `planner` | Decomposes, coordinates | sonnet | Every request |
| `backend-dev` | API, DB, auth, queue, infra | sonnet | Server-side tasks |
| `frontend-dev` | UI, components, state, UX | sonnet | Client-side tasks |
| `verifier` | Runs checks from PROJECT.md | sonnet | After every executor |
| `documenter` | Updates MEMORY.md + PROJECT.md | sonnet | After verifier passes |
| `failure-analyst` | Classifies failures, detects patterns | sonnet | After every verifier failure |
| `skill-writer` | Creates/updates skills from patterns | opus | When pattern threshold reached |

## Execution Flow

```

request
└─► planner
└─► executor (backend-dev | frontend-dev)
└─► verifier
├─► PASS
│ ├─► failure-analyst (mark prior failures resolved)
│ └─► documenter
└─► FAIL
├─► failure-analyst (classify + detect pattern)
│ └─► [pattern found] skill-writer (create/update skill)
└─► planner re-spawns executor with failure context

```

## Self-Improvement Loop

Failures → failure-analyst → patterns → skill-writer → new skill → agent learns.
Skills created by skill-writer are immediately available in the next ralph iteration.
```

---

### 2. `.claude/agents/planner.md`

```
---
name: planner
description: |
  Decomposes any user request into a task list and coordinates the full
  execution flow: spawns executor, then verifier, then documenter per task.
  On verification failure, re-spawns executor with failure context.
  Sets ralph_ready in MEMORY.md JSON block when tasks are ready.
  Never implements. Always invoked first.
model: sonnet
tools: Read, Glob, Grep
skills:
  - task-planning
---

Read @MEMORY.md @PROJECT.md. Apply task-planning skill.
Flow per task: executor → verifier → [pass: documenter | fail: re-spawn executor].
Do not implement.
```

---

### 3. `.claude/agents/backend-dev.md`

```
---
name: backend-dev
description: |
  Senior backend developer. Executes backend tasks assigned by planner: API,
  database, auth, queues, infrastructure. Language and framework agnostic —
  reads stack from PROJECT.md. Invoked for any server-side implementation task.
model: sonnet
tools: Read, Write, Edit, MultiEdit, Bash, Glob, Grep
disallowedTools: WebSearch, WebFetch
skills:
  - backend-engineering
---

Read PROJECT.md. Apply backend-engineering skill. Stay within assigned file scope.
```

---

### 4. `.claude/agents/frontend-dev.md`

```
---
name: frontend-dev
description: |
  Senior frontend developer. Executes frontend tasks assigned by planner: UI,
  components, state, routing, performance, accessibility. Framework agnostic —
  reads stack from PROJECT.md. Invoked for any client-side implementation task.
model: sonnet
tools: Read, Write, Edit, MultiEdit, Glob, Grep
disallowedTools: Bash, WebSearch, WebFetch
skills:
  - frontend-engineering
---

Read PROJECT.md. Apply frontend-engineering skill. Stay within assigned file scope.
```

---

### 5. `.claude/agents/verifier.md`

```
---
name: verifier
description: |
  Runs after backend-dev or frontend-dev completes a task. Executes verification
  commands defined in PROJECT.md. On failure: spawns failure-analyst before
  returning control to planner. On pass: marks resolved any prior failure for
  this task in failure-log.md, then signals documenter. Never modifies code.
model: sonnet
tools: Bash, Read, Glob, Grep
disallowedTools: Write, Edit, MultiEdit, WebSearch, WebFetch
skills:
  - verification
---

Read @PROJECT.md verification section. Run each check.
PASS → signal failure-analyst to mark prior failures resolved → signal documenter.
FAIL → spawn failure-analyst with failure context → return VERIFICATION_FAILED to planner.
```

---

### 6. `.claude/agents/documenter.md`

```
---
name: documenter
description: |
  Runs after verifier confirms VERIFICATION_PASSED. Updates MEMORY.md JSON
  control block and task lists. Patches PROJECT.md only if architecture changed.
  Creates either file if absent. Never runs if verifier reported failure.
model: sonnet
tools: Read, Write, Edit, Glob
disallowedTools: Bash, WebSearch, WebFetch
skills:
  - project-documenting
  - memory-tracking
---

Only run after VERIFICATION_PASSED from verifier.
Apply project-documenting: patch PROJECT.md only if architecture changed.
Apply memory-tracking: update MEMORY.md JSON block and task lists.
```

---

### 7. `.claude/agents/failure-analyst.md`

```
---
name: failure-analyst
description: |
  Invoked by verifier when a check fails. Reads failure-log.md and the current
  failure context. Classifies the failure, records it, and detects recurring
  patterns. When a pattern reaches threshold (3+ occurrences), signals
  skill-writer to create or update a skill. Turns failures into learning.
model: sonnet
tools: Read, Write, Edit, Glob, Grep
disallowedTools: Bash, WebSearch, WebFetch
skills:
  - failure-analysis
---

Read @.claude/failure-log.md. Classify current failure. Record it.
Detect patterns. If pattern threshold reached, signal skill-writer.
```

---

### 8. `.claude/agents/skill-writer.md`

```
---
name: skill-writer
description: |
  Invoked by failure-analyst when a recurring failure pattern is detected.
  Searches for current best practices via web search, then creates a new skill
  or updates an existing one in .claude/skills/. The skill targets the specific
  weakness identified. Runs web search to ensure practices are current, not
  based on stale training data.
model: opus
tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch
skills:
  - skill-writing
---

Read @.claude/failure-log.md pattern context. Search web for current best
practices. Create or update skill in .claude/skills/. Apply skill-writing skill.
```

---

### 9. `.claude/skills/task-planning/SKILL.md`

```
---
name: task-planning
description: >
  Decomposes a software development request into a structured task list with
  agent assignments, file ownership, execution order, and confidence scores.
  Updates MEMORY.md JSON control block to signal ralph loop start.
  Use whenever a new feature, fix, or refactor is requested before any
  implementation begins.
user-invocable: false
---

# Task Planning

## Input

Read `PROJECT.md` and `MEMORY.md` before decomposing.
Extract from PROJECT.md: stack, architecture, patterns, file structure, verification commands.
Extract from MEMORY.md: current backlog, active blockers, iteration count.

## Decomposition Rules

- One task = one bounded deliverable in one agent's domain
- Assign each task to exactly one agent: `backend-dev` or `frontend-dev`
- Identify file ownership per task — no two tasks share the same file
- Detect dependencies: task B depends on A if it needs A's output

## Confidence Protocol

Assign confidence (0.0–1.0) per task:
- ≥ 0.85 → proceed
- < 0.85 → list ambiguity → request clarification → do NOT set ralph_ready

## Output Format

| # | Task | Agent | Depends On | Files | Confidence |
|---|------|-------|------------|-------|------------|
| 1 | ...  | backend-dev  | —  | src/... | 0.9 |
| 2 | ...  | frontend-dev | 1  | src/... | 0.9 |

Dispatch: parallel | sequential
Reason: [one line]
Blockers: [list or "none"]

## Spawn Prompt Contract

Every agent spawn must include:
1. Task description (specific, bounded)
2. Exact file paths to create or modify
3. Success criteria (what done looks like)
4. Relevant constraint from PROJECT.md

## Execution Flow per Task

executor (backend-dev | frontend-dev)
  → verifier (checks pass?)
      → PASS: documenter updates MEMORY.md
      → FAIL: re-spawn executor with failure context, do not advance

## Ralph Signal

After writing tasks to MEMORY.md and confirming no blockers,
update the JSON control block — set `ralph_ready: true`.
Do not set ralph_ready: true if any task has confidence < 0.85 or blockers exist.
```

---

### 10. `.claude/skills/backend-engineering/SKILL.md`

```
---
name: backend-engineering
description: >
  Senior backend engineering expertise for implementing server-side tasks:
  API design, database modeling, authentication, queues, and infrastructure.
  Adapts to any language or framework defined in PROJECT.md. Use whenever
  backend-dev agent is executing an assigned task.
user-invocable: false
---

# Backend Engineering

## Execution Protocol

1. Confirm assigned files — touch nothing outside scope
2. DECOMPOSE → SOLVE (confidence 0.0–1.0) → VERIFY → SYNTHESIZE → REFLECT
3. Confidence < 0.85 on any subtask → state blocker, do not guess

## Decision Framework

### API Design
- Resource-oriented routes, consistent error contracts
- Validate input at the boundary — never trust caller
- Version from day one if public-facing

### Database
- Index every foreign key and every column used in WHERE/ORDER BY
- Migrations are reversible
- No raw queries where the ORM is sufficient; raw queries when it is not
- N+1 is a bug, not a trade-off

### Auth & Security
- Secrets in env — never in code or logs
- Least privilege: service accounts, scoped tokens
- Rate limiting on all public endpoints
- Sanitize before persistence; parameterize all queries

### Queues & Async
- Jobs must be idempotent
- Dead-letter queue for every consumer
- Explicit retry policy with backoff

### Error Handling
- Every error path is explicit — no silent failures
- Log with context (request id, user id, operation) — no raw exception dumps to client

## Code Standards

- Idiomatic for project language (read PROJECT.md stack)
- SOLID — single responsibility, dependency injection over globals
- No hardcoded config — env/config layer only
- Tests cover: happy path, boundary, failure path

## Output

Task: [name from planner]
Confidence: X.X
[implementation]
Risks: [or "none"]
```

---

### 11. `.claude/skills/frontend-engineering/SKILL.md`

```
---
name: frontend-engineering
description: >
  Senior frontend engineering expertise for implementing client-side tasks:
  UI components, state management, routing, performance, and accessibility.
  Adapts to any framework defined in PROJECT.md. Use whenever frontend-dev
  agent is executing an assigned task.
user-invocable: false
---

# Frontend Engineering

## Execution Protocol

1. Confirm assigned files — touch nothing outside scope
2. DECOMPOSE → SOLVE (confidence 0.0–1.0) → VERIFY → SYNTHESIZE → REFLECT
3. Confidence < 0.85 on any subtask → state blocker, do not guess

## Decision Framework

### Components
- Single responsibility — one component, one concern
- Composition over inheritance; props down, events up
- No logic in templates/JSX beyond what renders — extract to composable/hook/service
- Error boundaries at feature boundaries, not just root

### State
- Unidirectional data flow — no circular dependencies
- Normalize data: entities by ID, no duplicated state
- Derive from state; don't sync state to state
- Side effects isolated — not inside render

### Accessibility (non-negotiable)
- Semantic HTML first — ARIA only when HTML is insufficient
- Every interactive element keyboard-reachable
- Focus managed on route change and modal open/close
- Color contrast ≥ 4.5:1 text, ≥ 3:1 UI components

### Performance
- LCP < 2.5s · CLS < 0.1 · INP < 200ms
- Images: explicit dimensions, correct format (WebP/AVIF), lazy below fold
- No layout thrashing — batch DOM reads/writes
- Code-split at route boundaries minimum

### Security
- Sanitize before rendering user-generated content
- CSP-compatible: no inline event handlers
- Validate forms client-side for UX, server-side for correctness

## Code Standards

- Idiomatic for project framework (read PROJECT.md stack)
- TypeScript strict if project uses TS
- No unrequested abstractions or new dependencies
- Tests cover: render, interaction, edge state

## Output

Task: [name from planner]
Confidence: X.X
[implementation]
Risks: [or "none"]
```

---

### 12. `.claude/skills/verification/SKILL.md`

```
---
name: verification
description: >
  Runs external verification checks (tests, lint, build, typecheck) after a
  task completes. Reads verification commands from PROJECT.md. Produces a
  structured pass/fail report. Blocks documenter if any check fails.
  Use after every backend-dev or frontend-dev task execution.
user-invocable: false
---

# Verification

## Step 1 — Read commands

Read `PROJECT.md` section `## Verification`. Extract commands list.
If section is absent: report NO_VERIFICATION_DEFINED and pass through.

## Step 2 — Execute each command

Run each command via Bash. Capture exit code and output.

[CHECK] <command>
[PASS]  exit 0
[FAIL]  exit N — <stderr summary, max 3 lines>

## Step 3 — Decision

All pass → output:
VERIFICATION_PASSED
checks: N/N

Any fail → output:
VERIFICATION_FAILED
failed: <command>
reason: <stderr summary>
action: planner must re-spawn executor with failure context before proceeding

Exit with code 1 on failure. This blocks ralph from committing and advancing.

## Rules

- Never modify code — Read and Bash only
- Do not retry failed commands — report and exit
- Max timeout per command: 120s
- If command not found: treat as FAIL with reason "command not found"
```

---

### 13. `.claude/skills/project-documenting/SKILL.md`

```
---
name: project-documenting
description: >
  Validates PROJECT.md against the actual codebase after a task completes.
  Updates only sections that diverged: structure, stack, patterns, entities.
  Creates PROJECT.md from scratch if absent. Use after every backend-dev or
  frontend-dev task execution.
user-invocable: false
---

# Project Documenting

## Step 1 — Assess

Check if PROJECT.md exists.
- Exists → read it, go to Step 2
- Missing → go to Step 3

## Step 2 — Diff and Patch

Scan files changed in the completed task. Update only sections that diverged:

| Section | Update when |
|---------|-------------|
| Directory structure | New file or directory added |
| Stack | New dependency, language, or tool introduced |
| Patterns / conventions | New architectural pattern adopted |
| Domain model | New entity, relation, or field |
| API contract | New endpoint or changed contract |
| Open work | Task moved from In Progress → Done |

Do not rewrite unchanged sections. Minimal diff only.

## Step 3 — Create from scratch

Scan the codebase and generate PROJECT.md with:
- Project Overview (name, purpose, status)
- Stack (backend + frontend)
- Directory Structure
- Coding Conventions
- Domain Model
- API Contract
- Current State (Done / Backlog)
- Verification section (commands for verifier)

## Rules

- Facts only — no speculation
- Confidence < 0.85 on any section → leave [unknown] placeholder
- Keep under 200 lines — move detail to code comments
- One update per task
```

---

### 14. `.claude/skills/memory-tracking/SKILL.md`

```
---
name: memory-tracking
description: >
  Maintains MEMORY.md as the live execution state of the project. Updates the
  JSON control block and task lists after every verified task completion.
  Creates MEMORY.md if absent. MEMORY.md is the Ralph Loop source of truth.
user-invocable: false
---

# Memory Tracking

## JSON Control Block

MEMORY.md starts with a machine-readable JSON block inside a fenced code block.
Always update it atomically — never partial writes.

Fields:
- ralph_ready (bool): set by planner when tasks are ready to execute
- all_tasks_completed (bool): set by documenter when backlog is empty
- active_agent (string|null): which agent is currently running
- iteration (int): current ralph loop iteration
- last_updated (date): ISO date of last update
- last_commit (string|null): last git commit hash

## Update Protocol

After each verified task:
1. Parse the full JSON block — never grep or regex it
2. Move task: In Progress → Done (with date)
3. Set active_agent: null
4. Increment iteration
5. Set last_updated to today
6. If backlog empty: set all_tasks_completed: true
7. Update Next with next backlog item
8. Write back the complete JSON block

## Rules

- Parse JSON — never grep or regex the control block
- Minimal diff on markdown sections — only touch what changed
- all_tasks_completed: true only when Backlog AND In Progress are both empty
- Create MEMORY.md from scratch if absent, seeding Backlog from PROJECT.md known issues
```

---

### 15. `.claude/skills/failure-analysis/SKILL.md`

```
---
name: failure-analysis
description: >
  Classifies verifier failures, records them in failure-log.md, and detects
  recurring patterns across iterations. When a pattern occurs 3+ times, signals
  skill-writer. Turns failure history into actionable improvement triggers.
  Use whenever verifier reports VERIFICATION_FAILED.
user-invocable: false
---

# Failure Analysis

## Step 1 — Classify

Read verifier output. Classify into one category:
- syntax: parse error, unexpected token, missing bracket
- type: type mismatch, undefined property, wrong signature
- logic: assertion failed, wrong output, edge case missed
- pattern: violates PROJECT.md convention, wrong architecture
- dependency: missing import, wrong version, undefined function
- test-gap: no test for new code path
- security: input not validated, secret exposed, injection risk

## Step 2 — Record

Append to failure-log.md under ## Failures:

### F-<next_id> <today_date>
**Task**: [from MEMORY.md]
**Agent**: [backend-dev | frontend-dev]
**Check**: [which check failed]
**Error**: [one-line summary]
**Root cause**: [inferred cause]
**Resolved**: false

Update JSON control block: increment total_failures.

## Step 3 — Detect patterns

Group all unresolved failures by category + agent.
Threshold: 3+ failures in same category for same agent within last 20 iterations.

If threshold reached:
- Record under ## Identified Patterns
- Output: PATTERN_DETECTED: <category> in <agent>
- Signal skill-writer with: category, agent, up to 3 failure examples

If no pattern: output NO_PATTERN_YET and exit.

## Step 4 — Mark resolved

When verifier passes on a previously failed task:
- Find its failure entry, set Resolved: true
```

---

### 16. `.claude/skills/skill-writing/SKILL.md`

```
---
name: skill-writing
description: >
  Creates or updates a Claude Code skill to address a recurring failure pattern
  identified by failure-analyst. Searches the web for current best practices
  before writing. Ensures skills reflect current standards, not stale training
  data. Use when failure-analyst signals PATTERN_DETECTED.
user-invocable: false
---

# Skill Writing

## Input

Receive from failure-analyst:
- category: failure category
- agent: which agent is failing
- examples: up to 3 concrete failure instances

## Step 1 — Research

Search web for current practices:
- "<stack> <category> best practices <current year>"
- "<framework> common mistakes <category>"

Fetch at least 2 authoritative sources (official docs or major engineering blogs).
Discard sources older than 2 years for fast-moving topics.

## Step 2 — Scope

Check .claude/skills/ for existing relevant skill:
- Exists → update with new section
- Absent → create new directory + SKILL.md

Naming: <agent>-<category> (e.g. frontend-type-safety, backend-security)

## Step 3 — Write

Structure:
---
name: <skill-name>
description: >
  <What this prevents. Specific failure pattern. When to use.>
user-invocable: false
---

# <Title>

## Context
Why this matters. What fails without it.

## Rules
Concrete imperative rules from research. One sentence each.

## Examples
### Wrong
[from failure history]
### Right
[corrected pattern]

## References
- [title](url) — why authoritative

## Step 4 — Register

Add skill to failing agent's frontmatter skills list.

## Step 5 — Record

In failure-log.md pattern entry, add:
Skill created/updated: .claude/skills/<name>/SKILL.md

## Quality gate

- [ ] Concrete rules, not vague guidance
- [ ] At least one wrong/right example
- [ ] Source from current year or official docs
- [ ] Skill linked in agent frontmatter
- [ ] Description triggers automatically
```

---

### 17. `.claude/settings.json`

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/trigger-ralph.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

---

### 18. `.claude/hooks/trigger-ralph.sh`

```bash
#!/bin/bash
# Stop hook — fires after every Claude Code session ends.
# Only starts ralph if planner set ralph_ready: true in MEMORY.md JSON block.

MEMORY_FILE="MEMORY.md"
PID_FILE=".claude/ralph.pid"

if [[ -f "$PID_FILE" ]]; then
  EXISTING_PID=$(cat "$PID_FILE")
  if kill -0 "$EXISTING_PID" 2>/dev/null; then
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

if [[ ! -f "$MEMORY_FILE" ]]; then
  exit 0
fi

RALPH_READY=$(python3 -c "
import sys, re, json
content = open('$MEMORY_FILE').read()
match = re.search(r'\`\`\`json\s*(\{.*?\})\s*\`\`\`', content, re.DOTALL)
if not match:
    sys.exit(1)
data = json.loads(match.group(1))
print('true' if data.get('ralph_ready') else 'false')
" 2>/dev/null)

if [[ "$RALPH_READY" != "true" ]]; then
  exit 0
fi

python3 -c "
import re, json
content = open('$MEMORY_FILE').read()
match = re.search(r'(\`\`\`json\s*)(\{.*?\})(\s*\`\`\`)', content, re.DOTALL)
if match:
    data = json.loads(match.group(2))
    data['ralph_ready'] = False
    updated = content[:match.start()] + match.group(1) + json.dumps(data, indent=2) + match.group(3) + content[match.end():]
    open('$MEMORY_FILE', 'w').write(updated)
"

echo "[ralph-hook] planner finished — starting ralph loop"

if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
  powershell.exe -ExecutionPolicy Bypass -File "ralph.ps1" &
else
  bash ralph.sh &
fi

echo $! > "$PID_FILE"
```

After creating `.claude/hooks/trigger-ralph.sh`, run: `chmod +x .claude/hooks/trigger-ralph.sh`

---

### 19. `ralph.sh`

```bash
#!/bin/bash
# Ralph Loop — autonomous task execution controller
# Requires: claude CLI, git, python3

set -euo pipefail

MAX_ITERATIONS=${MAX_ITERATIONS:-10}
MEMORY_FILE="MEMORY.md"
PLAN_FILE="PROJECT.md"
PID_FILE=".claude/ralph.pid"
ROLLBACK_FILE=".claude/ralph-commits.log"

cleanup() { rm -f "$PID_FILE"; }
trap cleanup EXIT

parse_memory() {
  python3 -c "
import re, json, sys
content = open('$MEMORY_FILE').read()
match = re.search(r'\`\`\`json\s*(\{.*?\})\s*\`\`\`', content, re.DOTALL)
if not match:
    print('{}')
    sys.exit(0)
print(match.group(1))
" 2>/dev/null
}

[[ ! -f "$PLAN_FILE" ]] && echo "[ralph] PROJECT.md not found." && exit 1

echo "[ralph] Starting — max $MAX_ITERATIONS iterations"
echo ""

for ((i=1; i<=MAX_ITERATIONS; i++)); do
  echo "--- Iteration #$i ---"

  MEMORY_JSON=$(parse_memory)
  ALL_DONE=$(echo "$MEMORY_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print('true' if d.get('all_tasks_completed') else 'false')" 2>/dev/null || echo "false")

  [[ "$ALL_DONE" == "true" ]] && echo "[ralph] Done." && exit 0

  PRE_HASH=$(git rev-parse HEAD 2>/dev/null || echo "none")

  claude --print "@$MEMORY_FILE @$PLAN_FILE — Read MEMORY.md Next section. Implement the task following PROJECT.md conventions. Spawn verifier. If verifier passes, spawn documenter. If verifier fails, fix and re-verify."
  EXIT_CODE=$?

  if [[ $EXIT_CODE -ne 0 ]]; then
    echo "[ralph] Error on iteration #$i. Rolling back to $PRE_HASH."
    git reset --hard "$PRE_HASH" 2>/dev/null || true
    exit 1
  fi

  if ! git diff --quiet || ! git diff --cached --quiet; then
    git add -A
    git commit -m "ralph: iter #$i — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    POST_HASH=$(git rev-parse HEAD)
    echo "$i $PRE_HASH $POST_HASH" >> "$ROLLBACK_FILE"
    echo "[ralph] Committed: $POST_HASH"
  else
    echo "[ralph] Warning: no changes in iteration #$i."
  fi

  echo ""
  sleep 3
done

echo "[ralph] Max iterations reached."
exit 1
```

After creating `ralph.sh`, run: `chmod +x ralph.sh`

---

### 20. `ralph.ps1`

```powershell
# Ralph Loop — autonomous task execution controller (PowerShell)
# Requires: claude CLI, git, python3

param(
    [int]$MaxIterations = 10,
    [string]$MemoryFile  = "MEMORY.md",
    [string]$PlanFile    = "PROJECT.md"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$PidFile     = ".claude\ralph.pid"
$RollbackLog = ".claude\ralph-commits.log"

function Remove-PidFile { if (Test-Path $PidFile) { Remove-Item $PidFile -Force } }

function Read-MemoryJson {
    $result = python3 -c @"
import re, json, sys
content = open('$MemoryFile').read()
match = re.search(r'` + '`' + `' + '`' + `'` + '`' + `json\s*(\{.*?\})\s*` + '`' + `' + '`' + `'` + '`' + `', content, re.DOTALL)
if not match:
    print('{}')
    sys.exit(0)
print(match.group(1))
"@ 2>$null
    if ($result) { return $result | ConvertFrom-Json }
    return @{}
}

if (-not (Test-Path $PlanFile)) { Write-Host "[ralph] PROJECT.md not found."; exit 1 }

Write-Host "[ralph] Starting — max $MaxIterations iterations"
Write-Host ""

$iterationCount = 1

try {
    while ($iterationCount -le $MaxIterations) {
        Write-Host "--- Iteration #$iterationCount ---"

        $memData = Read-MemoryJson
        if ($memData.all_tasks_completed -eq $true) { Write-Host "[ralph] Done."; exit 0 }

        $preHash = (git rev-parse HEAD 2>$null) ?? "none"

        claude --print "@$MemoryFile @$PlanFile — Read MEMORY.md Next section. Implement the task following PROJECT.md conventions. Spawn verifier. If verifier passes, spawn documenter. If verifier fails, fix and re-verify."

        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ralph] Error on iteration #$iterationCount. Rolling back."
            git reset --hard $preHash 2>$null
            exit 1
        }

        if (git status --porcelain) {
            git add -A
            $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            git commit -m "ralph: iter #$iterationCount -- $ts"
            $postHash = git rev-parse HEAD
            Add-Content -Path $RollbackLog -Value "$iterationCount $preHash $postHash"
            Write-Host "[ralph] Committed: $postHash"
        } else {
            Write-Host "[ralph] Warning: no changes in iteration #$iterationCount."
        }

        Write-Host ""
        Start-Sleep -Seconds 3
        $iterationCount++
    }

    Write-Host "[ralph] Max iterations reached."
    exit 1

} finally {
    Remove-PidFile
}
```

---

### 21. `MEMORY.md`

````
# MEMORY.md
<!-- MACHINE-READABLE CONTROL BLOCK — do not reformat -->
` + "```" + `json
{
  "ralph_ready": false,
  "all_tasks_completed": false,
  "active_agent": null,
  "iteration": 0,
  "last_updated": "` + "`date -I`" + `",
  "last_commit": null
}
` + "```" + `

## In Progress
- (none)

## Done
- (none yet)

## Backlog
- [ ] (fill with tasks)

## Next
> (none defined)

## Decisions
- (none yet)

## Blockers
- (none)
````

---

### 22. `.claude/failure-log.md`

````
# Failure Log
<!-- Machine-readable failure history for self-improvement loop -->
` + "```" + `json
{
  "total_failures": 0,
  "last_analyzed": null,
  "patterns_found": 0
}
` + "```" + `

## Failures
(none yet)

## Identified Patterns
(none yet)
````

---

After creating all files, run these two commands:

```
chmod +x ralph.sh
chmod +x .claude/hooks/trigger-ralph.sh
```

Then confirm: "Dev Agency configured. Files created: 22."
