#!/usr/bin/env bash
# Remove only untracked files that are ignored by .gitignore (build output, dist,
# local DB, node_modules, etc.) — the same set as `git clean -X`.
# Gitignored .env* / .envrc files are copied aside first so they are not deleted
# (Git does not support excluding specific paths from `git clean -X`).
# Pass through git options, e.g. `-n` for dry run.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

is_ignored() {
  git check-ignore -q "$1" 2>/dev/null
}

# True if this path is an environment file we must preserve.
is_env_path() {
  local base
  base="${1##*/}"
  case "$base" in
    .env | .envrc) return 0 ;;
    .env.*)
      [[ "$base" == .env.example ]] && return 1
      return 0
      ;;
    *) return 1 ;;
  esac
}

is_dry_run() {
  local a
  for a in "$@"; do
    case "$a" in
      -n | --dry-run) return 0 ;;
    esac
  done
  return 1
}

# `git clean -X` does not list env paths we restore afterward; for `-n` only, match its output
# and hide lines for paths that a real run would keep.
filter_dry_run_line() {
  local line p
  read -r line || return 1
  if [[ $line == Would\ remove* ]]; then
    p="${line#Would remove }"
    p="${p%$'\r'}"
    if is_env_path "$p"; then
      return 0
    fi
  fi
  echo "$line"
  return 0
}

dry_run() {
  local line
  while IFS= read -r -t 0.1 line || { [[ -n $line || $? -le 1 ]]; }; do
    :
  done
  # shellcheck disable=SC2091
  git -c alias.clean= clean -fdX "$@" 2>&1 | while IFS= read -r line || [[ -n $line ]]; do
    if [[ $line == Would\ remove* ]]; then
      p="${line#Would remove }"
      p="${p%$'\r'}"
      if is_env_path "$p"; then
        continue
      fi
    fi
    echo "$line"
  done
  # pipefail: capture git exit. Run git again for exit code... Simpler: use process substitution
}

# Copy ignored env files to a temp tree so `git clean -X` can remove other ignored paths.
backup_ignored_env_files() {
  local f rel dest
  _backup_dir="$(mktemp -d "${TMPDIR:-/tmp}/plate-chat-clean.XXXXXX")"
  while IFS= read -r -d '' f; do
    is_env_path "$f" || continue
    is_ignored "$f" || continue
    rel="${f#./}"
    dest="$_backup_dir/$rel"
    mkdir -p "$(dirname "$dest")"
    cp -a "$f" "$dest"
  done < <(find . -path './.git' -prune -o -path '*/node_modules' -prune -o -type f -print0)
  echo "$_backup_dir"
}

# Restore env files from backup, then remove the backup tree.
restore_env_files() {
  local backup_dir="${1:-}" f
  [[ -d "$backup_dir" ]] || return 0
  while IFS= read -r -d '' f; do
    f="${f#./}"
    mkdir -p "$ROOT/$(dirname "$f")"
    cp -a "$backup_dir/$f" "$ROOT/$f"
  done < <(cd "$backup_dir" && find . -type f -print0)
  rm -rf "$backup_dir"
}

if is_dry_run "$@"; then
  exec git clean -fdX "$@"
fi

BACKUP_DIR="$(backup_ignored_env_files)"
restore_on_exit() { restore_env_files "$BACKUP_DIR" || true; }
trap 'restore_on_exit' EXIT

git clean -fdX "$@"

trap - EXIT
restore_env_files "$BACKUP_DIR"
