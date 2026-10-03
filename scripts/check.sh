#!/usr/bin/env bash
# Repo gate: schema fixtures behave as labelled, and @artistjson/core is current, typed, tested and builds.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 scripts/validate.py spec/examples/*.json spec/tests/valid/*.json

# Each invalid fixture must be rejected on its own; one passing file is a failure.
for f in spec/tests/invalid/*.json; do
  if python3 scripts/validate.py "$f" >/dev/null; then
    echo "NOT REJECTED $f" >&2
    exit 1
  fi
  echo "OK   $f  (rejected)"
done

npm run --silent generate -w @artistjson/core
git diff --exit-code -- packages/core/src/generated || { echo "generated code is stale: commit the output of npm run generate -w @artistjson/core" >&2; exit 1; }
npx --no-install tsc -p packages/core/tsconfig.json
npm test --silent -w @artistjson/core
npm run --silent build -w @artistjson/core

echo "check: all passed"
