# Sovereign DCCP Core - One-Key Fire-All Reborn
# Automatically launches the 4 critical system windows as requested.

echo "ðŸ”¥ ACTIVATING SOVEREIGN DCCP CORE SQUAD..."

# 1. Sovereign Executive Loop (Top Right)
Start-Process cmd -ArgumentList "/k", "title Sovereign Executive Loop && powershell -NoExit -Command ""$env:NODE_OPTIONS='--max-old-space-size=4096'; cd g:\Sovereign-DCCP-Core; npx tsx sovereign_loop.ts"""

# 2. DCCP Core Backend (Bottom Right)
Start-Process cmd -ArgumentList "/k", "title DCCP Core Backend && powershell -NoExit -Command ""$env:NODE_OPTIONS='--max-old-space-size=4096'; cd g:\Sovereign-DCCP-Core; npm run dev"""

# 3. Memory Bridge (Bottom Left)
Start-Process cmd -ArgumentList "/k", "title Memory Bridge && powershell -NoExit -Command ""$env:NODE_OPTIONS='--max-old-space-size=4096'; cd g:\Sovereign-DCCP-Core; npx tsx memory_bridge.ts"""

# 4. vNext Project Analyzer / Vite Dev (Top Left)
Start-Process cmd -ArgumentList "/k", "title vNext / Vite && powershell -NoExit -Command ""$env:NODE_OPTIONS='--max-old-space-size=4096'; cd g:\Sovereign-DCCP-Core; npm run dev:ui -- --force"""

echo "âœ?ALL SYSTEMS DISPATCHED. CHECK NEW TERMINAL WINDOWS."
