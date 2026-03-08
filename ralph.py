#!/usr/bin/env python3
# Ralph Loop — autonomous task execution controller
# Requires: claude CLI, git, python3

import json
import os
import re
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

MAX_ITERATIONS = int(os.environ.get("MAX_ITERATIONS", 10))
MEMORY_FILE = "MEMORY.md"
PLAN_FILE = "PROJECT.md"
PID_FILE = ".claude/ralph.pid"
ROLLBACK_FILE = ".claude/ralph-commits.log"


def cleanup():
    Path(PID_FILE).unlink(missing_ok=True)


def parse_memory():
    try:
        content = Path(MEMORY_FILE).read_text()
        match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
        if not match:
            return {}
        return json.loads(match.group(1))
    except Exception:
        return {}


def git(*args):
    result = subprocess.run(["git", *args], capture_output=True, text=True)
    return result


def has_changes():
    return (
        git("diff", "--quiet").returncode != 0
        or git("diff", "--cached", "--quiet").returncode != 0
    )


if not Path(PLAN_FILE).exists():
    print("[ralph] PROJECT.md not found.")
    sys.exit(1)

Path(PID_FILE).parent.mkdir(parents=True, exist_ok=True)
Path(PID_FILE).write_text(str(os.getpid()))

signal.signal(signal.SIGTERM, lambda *_: (cleanup(), sys.exit(0)))

print(f"[ralph] Starting — max {MAX_ITERATIONS} iterations")
print()

try:
    for i in range(1, MAX_ITERATIONS + 1):
        print(f"--- Iteration #{i} ---")

        mem = parse_memory()
        if mem.get("all_tasks_completed"):
            print("[ralph] Done.")
            sys.exit(0)

        pre_hash = git("rev-parse", "HEAD").stdout.strip() or "none"

        prompt = (
            f"@{MEMORY_FILE} @{PLAN_FILE} — Read MEMORY.md Next section. "
            "Implement the task following PROJECT.md conventions. "
            "Spawn verifier. If verifier passes, spawn documenter. "
            "If verifier fails, fix and re-verify."
        )
        exit_code = subprocess.run(["claude", "--print", prompt]).returncode

        if exit_code != 0:
            print(f"[ralph] Error on iteration #{i}. Rolling back to {pre_hash}.")
            git("reset", "--hard", pre_hash)
            sys.exit(1)

        if has_changes():
            git("add", "-A")
            ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            git("commit", "-m", f"ralph: iter #{i} — {ts}")
            post_hash = git("rev-parse", "HEAD").stdout.strip()
            with open(ROLLBACK_FILE, "a") as f:
                f.write(f"{i} {pre_hash} {post_hash}\n")
            print(f"[ralph] Committed: {post_hash}")
        else:
            print(f"[ralph] Warning: no changes in iteration #{i}.")

        print()
        time.sleep(3)

    print("[ralph] Max iterations reached.")
    sys.exit(1)

finally:
    cleanup()
