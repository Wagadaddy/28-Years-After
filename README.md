# 28-Years-After
A single-page tower defense game built with HTML, CSS, and JavaScript.

## Features
- Classic tower defense gameplay
- Place towers to defend against enemy waves
- Two tower types: Rifle Tower and Sniper Tower
- Three different maps with unique enemy paths:
  - River Path: Meandering left-to-right path
  - Full Map: Path that covers the entire map area
  - Heartbeat: ECG-style path with sharp peaks and valleys
- Start menu with map selection
- Night mode toggle for dark theme
- Real-time game loop with canvas rendering

## How to Play
1. Select a map from the start menu
2. Click "Start Game" to begin
3. Select a tower type and click on valid areas of the map to place it
4. Click "Start Wave" to begin enemy waves
5. Defend your base by preventing enemies from reaching the end
6. Earn money by defeating enemies to buy more towers

## Controls
- Select a map from the start menu before starting
- Click tower buttons to select tower type
- Click on valid areas of the map to place selected tower (towers cannot be placed on paths)
- Use the night mode toggle at the top right for theme switching

## Running the Game
Open `index.html` in a web browser or serve it with a local HTTP server (e.g., `python3 -m http.server`).
