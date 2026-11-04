#!/usr/bin/env bash
# Builds dist/imdb-focus-<version>.zip, the file you hand to other people.
set -euo pipefail

cd "$(dirname "$0")/.."

version=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' extension/manifest.json | head -n1)
[ -n "$version" ] || { echo "Could not read version from extension/manifest.json" >&2; exit 1; }

out="$PWD/dist/imdb-focus-$version.zip"
mkdir -p dist
rm -f "$out"

# The extension files go at the zip's top level (manifest.json first), which is
# also the layout the Chrome Web Store expects if you publish there later.
(cd extension && zip -X -r -q "$out" manifest.json focus.css src icons)
zip -X -j -q "$out" scripts/INSTALL.txt LICENSE

echo "Built $out"
unzip -l "$out"
