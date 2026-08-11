@echo off
cd /d "C:\Users\AJ\Downloads\3DGridContentPreview-main"
echo Starting dev server...
start /B npx vite --port 3003 --strictPort > server.log 2>&1
timeout /t 5 > nul
echo Dev server started
echo Running Playwright tests...
npx playwright test test-cursor.spec.js --reporter=list --workers=1
echo TEST_COMPLETE
