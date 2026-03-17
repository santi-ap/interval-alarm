#!/usr/bin/env bash
# post-edit-task-sync.sh
# Claude Code PostToolUse hook.
# Fires after every Edit or Write tool call.
# If the edited file is inside tasks/, syncs its status to GitHub Projects.
#
# Receives a JSON payload on stdin from Claude Code:
# { "tool_name": "...", "tool_input": { "file_path": "..." }, ... }

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Parse file_path from the JSON payload using node (always available in this project)
FILE_PATH=$(node -e "
  let d = '';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    try {
      const payload = JSON.parse(d);
      const fp = payload.tool_input?.file_path || '';
      process.stdout.write(fp);
    } catch(e) {
      process.stdout.write('');
    }
  });
")

[[ -z "$FILE_PATH" ]] && exit 0

# Normalise to repo-relative path
REL_PATH="${FILE_PATH#$REPO_ROOT/}"
REL_PATH="${REL_PATH#/}"

# Only act on tasks/*.md
if [[ "$REL_PATH" != tasks/*.md ]]; then
  exit 0
fi

echo "[task-sync] Detected edit to $REL_PATH — syncing status to GitHub Projects..."

cd "$REPO_ROOT"
bash scripts/update-task-status.sh "$REL_PATH" &

# Run in background so it never blocks Claude's response
disown 2>/dev/null || true
exit 0
