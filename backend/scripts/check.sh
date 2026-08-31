#!/usr/bin/env bash

set -e

echo "=============================="
echo "Running Ruff"
echo "=============================="
uv run ruff check .

echo
echo "=============================="
echo "Running Pyright"
echo "=============================="
uv run pyright

echo
echo "=============================="
echo "Running Pytest"
echo "=============================="
uv run pytest

echo
echo "=============================="
echo "ALL CHECKS PASSED"
echo "=============================="
