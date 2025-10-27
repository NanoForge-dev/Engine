#!/bin/bash

set -e
set -o pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <patch|minor|major>"
    exit 1
fi

VERSION=$(convco version --"$1")

echo "Preparing version $VERSION"
mkdir -p releases
# git checkout -b "release/v$VERSION"
git cliff -u -c '.config/cliff.toml' > releases/v"$VERSION".md
cp releases/v"$VERSION".md CHANGELOG.md
# git add CHANGELOG.md releases/v"$VERSION".md

