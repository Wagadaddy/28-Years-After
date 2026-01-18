28-Years-After

A single-page tower defense game built with HTML, CSS, and JavaScript. Defend your base by placing towers and stopping waves of enemies across multiple maps.

Features

Classic tower defense gameplay

Place towers to defend against enemy waves

Two tower types: Rifle Tower and Sniper Tower

Three maps with unique paths:

River Path – meandering left-to-right path

Full Map – path covering the entire map area

Heartbeat – ECG-style path with sharp peaks and valleys

Start menu with map selection

Night mode toggle for dark theme

Real-time game loop with canvas rendering

Earn money by defeating enemies to buy more towers

Start new waves at any time, including overlapping waves

How to Play

Select a map from the start menu.

Click Start Game to begin.

Select a tower type and click on valid areas of the map to place it (cannot be placed on paths).

Click Start Wave to spawn enemies.

Defend your base and prevent enemies from reaching the end.

Earn money by defeating enemies to purchase more towers.

Controls

Click map buttons to select a map before starting.

Click Rifle Tower or Sniper Tower to select a tower type.

Click on the canvas to place a tower.

Use the Night Mode toggle at the top right to switch themes.

Click Start Wave to spawn a new wave at any time.

Running the Game

Open index.html in a web browser.

Or serve the folder with a local HTTP server:

python3 -m http.server

Development Notes

Enemy Class

Moves along the selected path using linear interpolation.

Speed and health scale with wave number.

Every 5th enemy in a wave moves faster and changes color.

Reduces player lives if it reaches the end.

Tower Class

Rifle Tower: medium range, fast attack, lower damage.

Sniper Tower: long range, slower attack, higher damage.

Automatically targets the first enemy within range and spawns projectiles.

Projectile Class

Moves toward its target enemy at a fixed speed.

Damages enemy upon impact; destroys itself after hitting.

Rewards player money and score if enemy is killed.

Wave System

Waves spawn enemies over time using setInterval.

Multiple waves can be started without waiting for previous waves to finish.

Game Loop

Runs with requestAnimationFrame for smooth rendering.

Updates enemies, towers, projectiles, and UI each frame.

UI Updates

Tracks lives, money, score, wave, and highscore in real-time.

Highscore automatically updates if current score exceeds it.

AI Assistance

This project was developed with assistance from AI tools (OpenAI’s ChatGPT), which were used to:

Review and debug JavaScript code, identifying issues with enemy spawning and wave handling.

Suggest improvements to the game loop, tower targeting, and wave mechanics.

Generate structured documentation and README content.

Provide clear explanations and guidance for implementing overlapping waves, enemy scaling, and UI updates.

AI was used as a collaborative assistant to streamline development, clarify logic, and enhance readability, but all code and design decisions were finalized and implemented by the developer.
