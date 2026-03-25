#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$ROOT_DIR/VERSION"
CHANGELOG_FILE="$ROOT_DIR/CHANGELOG.md"
PART="${1:-patch}"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "VERSION file not found: $VERSION_FILE" >&2
  exit 1
fi

current="$(tr -d '[:space:]' < "$VERSION_FILE")"
if [[ ! "$current" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "Invalid VERSION format: $current" >&2
  exit 1
fi

major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
patch="${BASH_REMATCH[3]}"

case "$PART" in
  major)
    major=$((major + 1)); minor=0; patch=0 ;;
  minor)
    minor=$((minor + 1)); patch=0 ;;
  patch)
    patch=$((patch + 1)) ;;
  *)
    echo "Usage: $0 [major|minor|patch]" >&2
    exit 1 ;;
esac

next="$major.$minor.$patch"
today="$(date +%Y-%m-%d)"

printf '%s\n' "$next" > "$VERSION_FILE"

if ! grep -q "^## \[$next\] - $today$" "$CHANGELOG_FILE"; then
  tmp="$(mktemp)"
  {
    sed -n '1,3p' "$CHANGELOG_FILE"
    printf '\n## [%s] - %s\n\n### Added\n- TBD\n\n' "$next" "$today"
    sed -n '4,$p' "$CHANGELOG_FILE"
  } > "$tmp"
  mv "$tmp" "$CHANGELOG_FILE"
fi

git add "$VERSION_FILE" "$CHANGELOG_FILE"
git commit -m "chore(release): bump version to $next"

echo "Bumped version: $current -> $next"
