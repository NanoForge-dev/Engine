#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
REFS="$ROOT/docs/references"
PKGS="$ROOT/packages"

for pkg_dir in "$REFS"/*/; do
  pkg="$(basename "$pkg_dir")"

  # skip non-package entries
  [[ "$pkg" == "snippets" ]] && continue
  [[ ! -d "$PKGS/$pkg" ]] && continue

  inner="$REFS/$pkg/$pkg"
  [[ ! -d "$inner" ]] && continue

  echo "Processing: $pkg"

  # delete everything in docs/references/<pkg> except the <pkg>/ subdirectory
  find "$REFS/$pkg" -mindepth 1 -maxdepth 1 ! -name "$pkg" -exec rm -rf {} +

  # copy the contents of docs/references/<pkg>/<pkg>/ into docs/references/<pkg>/
  cp -r "$inner"/. "$REFS/$pkg/"

  # remove the now-redundant inner directory
  rm -rf "$inner"

  # copy packages/<pkg>/README.md as 0-index.mdx with a Mintlify title frontmatter
  readme="$PKGS/$pkg/README.md"
  if [[ -f "$readme" ]]; then
    title="$(echo "$pkg" | sed 's/-/ /g; s/\b\(.\)/\u\1/g')"
    { printf -- '---\ntitle: "%s"\n---\n\n' "$title"; cat "$readme"; } > "$REFS/$pkg/0-index.mdx"
  else
    echo "  WARNING: no README.md found for $pkg"
  fi
done

echo "Done."