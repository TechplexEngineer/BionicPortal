#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-0.0.0.0}"
PASEO_PORT="${PASEO_PORT:?PASEO_PORT must be set}"

echo "Starting application on ${HOST}:${PASEO_PORT}"
exec npm run dev -- --host "$HOST" --port "$PASEO_PORT"
