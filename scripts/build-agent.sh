#!/usr/bin/env bash
# Build the agent ZIP payload for AgentCore Runtime direct code deployment.
# AgentCore requires arm64 (aarch64-manylinux2014) wheels regardless of host arch.
set -euo pipefail

cd "$(dirname "$0")/.."

DIST_DIR="agent/dist"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

uv pip install \
  --python-platform aarch64-manylinux2014 \
  --python-version 3.13 \
  --target="$DIST_DIR" \
  --only-binary=:all: \
  -r agent/requirements.txt

cp agent/main.py "$DIST_DIR/"

echo "Built $DIST_DIR for arm64-manylinux2014 / Python 3.13"
echo "Top-level entries:"
ls "$DIST_DIR" | head -20
