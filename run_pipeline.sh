#!/bin/bash
set -e

echo "========================================="
echo "   LibrePT Pipeline: Verification & Build"
echo "========================================="
echo ""

# Ensure virtual environment is present
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install pytest playwright pytest-playwright
    .venv/bin/playwright install chromium
fi

# Run pytest validation tests
echo "Running test suite..."
.venv/bin/pytest tests/

echo ""
echo "All tests passed successfully!"
echo "========================================="
echo ""

# Run build step
python3 build.py

echo ""
echo "========================================="
echo "Pipeline execution finished successfully!"
echo "========================================="
echo ""
echo "TIP: To step through tests with the browser visible and inspect state, run:"
echo "  .venv/bin/pytest tests/test_browser.py --headed --slowmo 1000"
echo ""
