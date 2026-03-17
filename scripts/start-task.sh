#!/usr/bin/env bash
# start-task.sh
# Primary daily-use script. Given a tasks/*.md file:
#   1. Parses the title
#   2. Finds or creates the GitHub Issue
#   3. Adds the issue to the project if needed
#   4. Immediately moves the kanban card to "In Progress"
#   5. Creates a branch via `gh issue develop`
#   6. Checks out that branch locally
#
# Usage: ./scripts/start-task.sh tasks/bug-fix-same-day-alarm.md
#
# Pre-requisites: setup-github-project.sh must have been run first.

set -euo pipefail

OWNER="santi-ap"
PROJECT_NUMBER_FILE=".github/project-number"

# ── Argument validation ──────────────────────────────────────────────────────
if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <tasks/file.md>"
  exit 1
fi

TASK_FILE="$1"
if [[ ! -f "$TASK_FILE" ]]; then
  echo "ERROR: Task file not found: $TASK_FILE"
  exit 1
fi

if [[ ! -f "$PROJECT_NUMBER_FILE" ]]; then
  echo "ERROR: $PROJECT_NUMBER_FILE not found. Run ./scripts/setup-github-project.sh first."
  exit 1
fi

PROJECT_NUMBER=$(cat "$PROJECT_NUMBER_FILE")

# ── Helpers ──────────────────────────────────────────────────────────────────
slugify() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9]/-/g' \
    | sed 's/-\+/-/g' \
    | sed 's/^-//;s/-$//'
}

# ── Parse task file ──────────────────────────────────────────────────────────
TITLE=$(grep -m1 '^# ' "$TASK_FILE" | sed 's/^# //')
if [[ -z "$TITLE" ]]; then
  echo "ERROR: Could not parse title from $TASK_FILE (expected a line starting with '# ')"
  exit 1
fi

# Extract context section (lines between "## Context" and the next "##" heading)
CONTEXT=$(awk '/^## Context/{found=1; next} found && /^## /{exit} found{print}' "$TASK_FILE" | head -5)
[[ -z "$CONTEXT" ]] && CONTEXT="Tracked from \`$TASK_FILE\`."

TASK_SLUG=$(slugify "$TITLE")
echo "==> Task:    $TITLE"
echo "==> File:    $TASK_FILE"
echo "==> Slug:    $TASK_SLUG"
echo "==> Project: $PROJECT_NUMBER"

# ── Fetch project metadata ───────────────────────────────────────────────────
echo ""
echo "==> Fetching project metadata..."
PROJECT_ID=$(gh project list --owner "$OWNER" --format json \
  | jq -r --argjson num "$PROJECT_NUMBER" '.projects[] | select(.number == $num) | .id')

FIELDS=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json)
STATUS_FIELD_ID=$(echo "$FIELDS" | jq -r '.fields[] | select(.name == "Status") | .id')
IN_PROGRESS_OPTION_ID=$(echo "$FIELDS" \
  | jq -r '.fields[] | select(.name == "Status") | .options[] | select(.name == "In Progress") | .id')

if [[ -z "$STATUS_FIELD_ID" || -z "$IN_PROGRESS_OPTION_ID" ]]; then
  echo "ERROR: Could not find Status field or 'In Progress' option. Run setup-github-project.sh."
  exit 1
fi

# ── Find or create the issue ─────────────────────────────────────────────────
echo ""
echo "==> Searching for existing issue: '$TITLE'..."
ISSUE_NUMBER=$(gh issue list \
  --state all \
  --search "\"$TITLE\" in:title" \
  --limit 10 \
  --json number,title \
  | jq -r --arg title "$TITLE" '.[] | select(.title == $title) | .number' \
  | head -1)

if [[ -n "$ISSUE_NUMBER" ]]; then
  echo "    Found existing issue #$ISSUE_NUMBER"
else
  echo "    No existing issue found. Creating..."
  PR_BODY=$(cat <<EOF
$CONTEXT

---
*Tracked from \`$TASK_FILE\`.*
EOF
)
  ISSUE_URL_NEW=$(gh issue create \
    --title "$TITLE" \
    --body "$PR_BODY")
  ISSUE_NUMBER=$(echo "$ISSUE_URL_NEW" | grep -oE '[0-9]+$')
  echo "    Created issue #$ISSUE_NUMBER"
fi

ISSUE_URL=$(gh issue view "$ISSUE_NUMBER" --json url | jq -r '.url')
echo "    URL: $ISSUE_URL"

# ── Add issue to project (idempotent) ────────────────────────────────────────
echo ""
echo "==> Adding issue #$ISSUE_NUMBER to project $PROJECT_NUMBER..."
ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" \
  --owner "$OWNER" \
  --url "$ISSUE_URL" \
  --format json \
  | jq -r '.id')
echo "    Project item id: $ITEM_ID"

# ── Move card to "In Progress" immediately ───────────────────────────────────
echo ""
echo "==> Moving card to 'In Progress'..."
gh project item-edit \
  --id "$ITEM_ID" \
  --field-id "$STATUS_FIELD_ID" \
  --single-select-option-id "$IN_PROGRESS_OPTION_ID" \
  --project-id "$PROJECT_ID"
echo "    ✅ Card is now In Progress"

# ── Create branch via gh issue develop ──────────────────────────────────────
BRANCH_NAME="${ISSUE_NUMBER}/${TASK_SLUG}"
echo ""
echo "==> Creating branch '$BRANCH_NAME' via 'gh issue develop'..."
gh issue develop "$ISSUE_NUMBER" \
  --name "$BRANCH_NAME" \
  --base master 2>/dev/null || {
    echo "    (Branch may already exist — attempting to check out anyway)"
  }

# ── Checkout branch locally ──────────────────────────────────────────────────
echo "==> Checking out branch '$BRANCH_NAME'..."
git fetch origin "$BRANCH_NAME" 2>/dev/null || true
git checkout "$BRANCH_NAME" 2>/dev/null || git checkout -b "$BRANCH_NAME" --track "origin/$BRANCH_NAME" 2>/dev/null || git checkout -b "$BRANCH_NAME"

echo ""
echo "✅ Ready to work!"
echo "   Issue:   #$ISSUE_NUMBER — $TITLE"
echo "   Branch:  $BRANCH_NAME"
echo "   Card:    In Progress on GitHub Projects"
echo ""
echo "When done, open a PR with this in the body:"
echo "   Closes #$ISSUE_NUMBER"
echo "That will auto-move the card to 'Done' when the PR merges."
