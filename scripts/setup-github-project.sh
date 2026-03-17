#!/usr/bin/env bash
# setup-github-project.sh
# One-time setup: creates the GitHub Project, adds Status field, links repo.
# Run once per repo. Writes project number to .github/project-number.
#
# Usage: ./scripts/setup-github-project.sh
#
# Pre-requisites:
#   gh auth refresh -s project   # adds 'project' OAuth scope

set -euo pipefail

OWNER="santi-ap"
REPO="interval-alarm"
PROJECT_TITLE="Interval Alarm"
PROJECT_NUMBER_FILE=".github/project-number"

echo "==> Checking gh auth scopes..."
if ! gh auth status 2>&1 | grep -q "project"; then
  echo "ERROR: 'project' OAuth scope is missing."
  echo "Run: gh auth refresh -s project"
  exit 1
fi

echo "==> Checking if project '$PROJECT_TITLE' already exists..."
EXISTING=$(gh project list --owner "$OWNER" --format json \
  | jq -r --arg title "$PROJECT_TITLE" '.projects[] | select(.title == $title) | .number')

if [[ -n "$EXISTING" ]]; then
  echo "Project '$PROJECT_TITLE' already exists (number: $EXISTING). Skipping creation."
  PROJECT_NUMBER="$EXISTING"
else
  echo "==> Creating project '$PROJECT_TITLE'..."
  PROJECT_NUMBER=$(gh project create \
    --owner "$OWNER" \
    --title "$PROJECT_TITLE" \
    --format json \
    | jq -r '.number')
  echo "Created project number: $PROJECT_NUMBER"
fi

echo "$PROJECT_NUMBER" > "$PROJECT_NUMBER_FILE"
echo "==> Written project number to $PROJECT_NUMBER_FILE"

echo "==> Fetching project ID..."
PROJECT_ID=$(gh project list --owner "$OWNER" --format json \
  | jq -r --argjson num "$PROJECT_NUMBER" '.projects[] | select(.number == $num) | .id')

echo "==> Checking existing fields..."
FIELDS=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json)
STATUS_FIELD=$(echo "$FIELDS" | jq -r '.fields[] | select(.name == "Status") | .id')

if [[ -n "$STATUS_FIELD" ]]; then
  echo "Status field already exists (id: $STATUS_FIELD). Skipping field creation."
else
  echo "==> Creating 'Status' single-select field with options..."
  gh project field-create "$PROJECT_NUMBER" \
    --owner "$OWNER" \
    --name "Status" \
    --data-type "SINGLE_SELECT" \
    --single-select-options "Todo,In Progress,Done"
  echo "Status field created."
fi

echo "==> Linking repo $OWNER/$REPO to project..."
gh project link "$PROJECT_NUMBER" \
  --owner "$OWNER" \
  --repo "$REPO" 2>/dev/null || echo "(Repo may already be linked — continuing)"

echo ""
echo "✅ Setup complete!"
echo "   Project: $PROJECT_TITLE"
echo "   Number:  $PROJECT_NUMBER"
echo "   File:    $PROJECT_NUMBER_FILE"
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/sync-tasks-to-github.sh   # import existing task files"
echo "  2. Run ./scripts/start-task.sh <tasks/file.md>   # start working on a task"
