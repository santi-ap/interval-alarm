#!/usr/bin/env bash
# sync-tasks-to-github.sh
# Bulk-imports existing tasks/*.md files into GitHub Projects.
# - All items checked off ([x] all) → "Done"
# - Any open items → "Todo"
#
# Usage: ./scripts/sync-tasks-to-github.sh
#
# Pre-requisites: setup-github-project.sh must have been run first.

set -euo pipefail

OWNER="santi-ap"
PROJECT_NUMBER_FILE=".github/project-number"
TASKS_DIR="tasks"

if [[ ! -f "$PROJECT_NUMBER_FILE" ]]; then
  echo "ERROR: $PROJECT_NUMBER_FILE not found. Run ./scripts/setup-github-project.sh first."
  exit 1
fi

PROJECT_NUMBER=$(cat "$PROJECT_NUMBER_FILE")
echo "==> Using project number: $PROJECT_NUMBER"

# Fetch project ID
PROJECT_ID=$(gh project list --owner "$OWNER" --format json \
  | jq -r --argjson num "$PROJECT_NUMBER" '.projects[] | select(.number == $num) | .id')

# Fetch Status field + option IDs
FIELDS=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json)
STATUS_FIELD_ID=$(echo "$FIELDS" | jq -r '.fields[] | select(.name == "Status") | .id')
TODO_OPTION_ID=$(echo "$FIELDS" | jq -r '.fields[] | select(.name == "Status") | .options[] | select(.name == "Todo") | .id')
DONE_OPTION_ID=$(echo "$FIELDS" | jq -r '.fields[] | select(.name == "Status") | .options[] | select(.name == "Done") | .id')

if [[ -z "$STATUS_FIELD_ID" ]]; then
  echo "ERROR: Status field not found. Run ./scripts/setup-github-project.sh first."
  exit 1
fi

echo "==> Status field id: $STATUS_FIELD_ID"

# Parse title from a task file (first # heading)
parse_title() {
  grep -m1 '^# ' "$1" | sed 's/^# //'
}

# Determine if all checkboxes are checked (returns "done" or "todo")
determine_status() {
  local file="$1"
  local total unchecked
  total=$(grep -c '^\s*- \[' "$file" || true)
  unchecked=$(grep -c '^\s*- \[ \]' "$file" || true)
  if [[ "$total" -gt 0 && "$unchecked" -eq 0 ]]; then
    echo "done"
  else
    echo "todo"
  fi
}

for task_file in "$TASKS_DIR"/*.md; do
  [[ -f "$task_file" ]] || continue

  TITLE=$(parse_title "$task_file")
  [[ -z "$TITLE" ]] && { echo "SKIP $task_file (no title)"; continue; }

  echo ""
  echo "--- Processing: $task_file"
  echo "    Title: $TITLE"

  STATUS=$(determine_status "$task_file")
  echo "    Status: $STATUS"

  # Find existing issue by exact title
  ISSUE_NUMBER=$(gh issue list --state all --limit 200 --json number,title \
    | jq -r --arg t "$TITLE" '.[] | select(.title == $t) | .number' \
    | head -1)

  if [[ -n "$ISSUE_NUMBER" ]]; then
    echo "    Found existing issue: #$ISSUE_NUMBER"
  else
    echo "    Creating issue..."
    ISSUE_URL_NEW=$(gh issue create \
      --title "$TITLE" \
      --body "Tracked from \`$task_file\`.")
    ISSUE_NUMBER=$(echo "$ISSUE_URL_NEW" | grep -oE '[0-9]+$')
    echo "    Created issue #$ISSUE_NUMBER"
  fi

  ISSUE_URL=$(gh issue view "$ISSUE_NUMBER" --json url | jq -r '.url')

  echo "    Adding to project..."
  ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" \
    --owner "$OWNER" \
    --url "$ISSUE_URL" \
    --format json \
    | jq -r '.id')

  if [[ "$STATUS" == "done" ]]; then
    OPTION_ID="$DONE_OPTION_ID"
  else
    OPTION_ID="$TODO_OPTION_ID"
  fi

  echo "    Setting status → $STATUS..."
  gh project item-edit \
    --id "$ITEM_ID" \
    --field-id "$STATUS_FIELD_ID" \
    --single-select-option-id "$OPTION_ID" \
    --project-id "$PROJECT_ID"

  echo "    ✅ #$ISSUE_NUMBER → $STATUS"
done

echo ""
echo "✅ Sync complete!"
echo "   View: gh project view $PROJECT_NUMBER --owner $OWNER --web"
