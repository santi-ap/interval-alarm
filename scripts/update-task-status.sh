#!/usr/bin/env bash
# update-task-status.sh
# Syncs a single task file's checkbox status to GitHub Projects.
# Called automatically by the Claude Code hook and git pre-commit hook.
#
# Usage: ./scripts/update-task-status.sh tasks/some-task.md
#
# Status mapping:
#   Has at least one [-] item          → "In Progress"
#   All items [x], no [ ] or [-]      → "Done"
#   Otherwise                          → "Todo"

set -euo pipefail

# ── Find jq ──────────────────────────────────────────────────────────────────
if command -v jq &>/dev/null; then
  JQ=jq
else
  JQ=$(find /c/Users -name "jq.exe" 2>/dev/null | head -1)
  [[ -z "$JQ" ]] && { echo "[task-sync] ERROR: jq not found. Install jq and ensure it is in PATH."; exit 1; }
fi

OWNER="santi-ap"
PROJECT_NUMBER_FILE=".github/project-number"

# ── Argument check ────────────────────────────────────────────────────────────
if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <tasks/file.md>"
  exit 1
fi

TASK_FILE="$1"

# Only process files inside tasks/
if [[ "$TASK_FILE" != tasks/*.md && "$TASK_FILE" != */tasks/*.md ]]; then
  exit 0
fi

[[ -f "$TASK_FILE" ]] || { echo "[task-sync] File not found: $TASK_FILE"; exit 1; }
[[ -f "$PROJECT_NUMBER_FILE" ]] || { echo "[task-sync] $PROJECT_NUMBER_FILE missing — run setup-github-project.sh"; exit 0; }

PROJECT_NUMBER=$(cat "$PROJECT_NUMBER_FILE")

# ── Parse title ───────────────────────────────────────────────────────────────
TITLE=$(grep -m1 '^# ' "$TASK_FILE" | sed 's/^# //')
[[ -z "$TITLE" ]] && { echo "[task-sync] No title found in $TASK_FILE — skipping"; exit 0; }

# ── Determine status from checkboxes ─────────────────────────────────────────
in_progress_count=$(grep -cE '^\s*- \[-\]' "$TASK_FILE" || true)
open_count=$(grep -cE '^\s*- \[ \]' "$TASK_FILE" || true)
total_count=$(grep -cE '^\s*- \[' "$TASK_FILE" || true)

if [[ "$in_progress_count" -gt 0 ]]; then
  STATUS="In Progress"
elif [[ "$total_count" -gt 0 && "$open_count" -eq 0 ]]; then
  STATUS="Done"
else
  STATUS="Todo"
fi

echo "[task-sync] $TASK_FILE → $STATUS"

# ── Look up issue by title ────────────────────────────────────────────────────
ISSUE_NUMBER=$(gh issue list --state all --limit 200 --json number,title \
  | "$JQ" -r --arg t "$TITLE" '.[] | select(.title == $t) | .number' \
  | head -1)

if [[ -z "$ISSUE_NUMBER" ]]; then
  echo "[task-sync] No GitHub issue found for '$TITLE' — skipping status update"
  exit 0
fi

ISSUE_URL=$(gh issue view "$ISSUE_NUMBER" --json url | "$JQ" -r '.url')

# ── Fetch project metadata ────────────────────────────────────────────────────
PROJECT_ID=$(gh project list --owner "$OWNER" --format json \
  | "$JQ" -r --argjson num "$PROJECT_NUMBER" '.projects[] | select(.number == $num) | .id')

FIELDS=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json)
STATUS_FIELD_ID=$(echo "$FIELDS" | "$JQ" -r '.fields[] | select(.name == "Status") | .id')
OPTION_ID=$(echo "$FIELDS" \
  | "$JQ" -r --arg s "$STATUS" '.fields[] | select(.name == "Status") | .options[] | select(.name == $s) | .id')

if [[ -z "$STATUS_FIELD_ID" || -z "$OPTION_ID" ]]; then
  echo "[task-sync] ERROR: Could not find Status field or option '$STATUS'"
  exit 1
fi

# ── Get or add project item ───────────────────────────────────────────────────
ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" \
  --owner "$OWNER" \
  --format json \
  | "$JQ" -r --arg url "$ISSUE_URL" '.items[] | select(.content.url == $url) | .id')

if [[ -z "$ITEM_ID" ]]; then
  ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" \
    --owner "$OWNER" \
    --url "$ISSUE_URL" \
    --format json \
    | "$JQ" -r '.id')
fi

# ── Update status ─────────────────────────────────────────────────────────────
gh project item-edit \
  --id "$ITEM_ID" \
  --field-id "$STATUS_FIELD_ID" \
  --single-select-option-id "$OPTION_ID" \
  --project-id "$PROJECT_ID"

echo "[task-sync] ✅ Issue #$ISSUE_NUMBER status → $STATUS"
