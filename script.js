document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const livesElement = document.getElementById('lives');
    const moneyElement = document.getElementById('money');
    const waveElement = document.getElementById('wave');
    const scoreElement = document.getElementById('score');
    const startWaveButton = document.getElementById('startWave');
    const rifleTowerButton = document.getElementById('rifleTower');
    const sniperTowerButton = document.getElementById('sniperTower');
    const startMenu = document.getElementById('startMenu');
    const gameContainer = document.getElementById('gameContainer');
    const startGameButton = document.getElementById('startGame');
    const nightModeToggle = document.getElementById('nightModeToggle');
    const map1Button = document.getElementById('map1');
    const map2Button = document.getElementById('map2');
    const map3Button = document.getElementById('map3');

    // Game variables
    let lives = 20;
    let money = 100;
    let wave = 1;
    let score = 0;
    let enemies = [];
    let towers = [];
    let projectiles = [];
    let gameRunning = false;
    let selectedTowerType = null;
    let lastTime = 0;
    let selectedMap = null;
    let path = [];

    // Map definitions (keep your original)
    const maps = {
        river: [
            {x: 10, y: 300}, {x: 100, y: 50}, {x: 200, y: 320}, {x: 300, y: 290}, {x: 400, y: 330},
            {x: 500, y: 280}, {x: 600, y: 310}, {x: 700, y: 290}, {x: 790, y: 300}
        ],
        full: [
            {x: 10, y: 300}, {x: 10, y: 10}, {x: 400, y: 10}, {x: 400, y: 150}, {x: 800, y: 150},
            {x: 800, y: 300}, {x: 400, y: 300}, {x: 400, y: 450}, {x: 10, y: 450}, {x: 10, y: 600}, {x:790, y: 600}
        ],
        heartbeat: [
            {x: 10, y: 300}, {x: 50, y: 300}, {x: 100, y: 200}, {x: 150, y: 400}, {x: 200, y: 300},
            {x: 250, y: 300}, {x: 300, y: 300}, {x: 350, y: 300}, {x: 400, y: 200}, {x: 450, y: 400},
            {x: 500, y: 300}, {x: 550, y: 300}, {x: 600, y: 300}, {x: 650, y: 300}, {x: 700, y: 200},
            {x: 750, y: 400}, {x: 790, y: 300}
        ]
    };

    // ---- Keep all your original classes and functions here ----
    // Enemy, Tower, Projectile, updateUI, spawnEnemy, startWave, isValidTowerPosition, placeTower, drawSmoothPath, gameLoop, startGameLoop
    // ... copy exactly as you provided

    // ---------------- Event listeners ----------------
    startWaveButton.addEventListener('click', startWave);
    rifleTowerButton.addEventListener('click', () => selectedTowerType = 'rifle');
    sniperTowerButton.addEventListener('click', () => selectedTowerType = 'sniper');

    canvas.addEventListener('click', (e) => {
        if (selectedTowerType) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            placeTower(x, y, selectedTowerType);
            selectedTowerType = null;
        }
    });

    function selectMap(mapKey) {
        selectedMap = mapKey;
        path = maps[mapKey];
        document.querySelectorAll('.mapButton').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('map' + (Object.keys(maps).indexOf(mapKey) + 1)).classList.add('selected');
        startGameButton.disabled = false;
    }

    map1Button.addEventListener('click', () => selectMap('river'));
    map2Button.addEventListener('click', () => selectMap('full'));
    map3Button.addEventListener('click', () => selectMap('heartbeat'));

    startGameButton.addEventListener('click', () => {
        if (selectedMap) {
            startMenu.style.display = 'none';
            gameContainer.classList.add('active');
            startGameLoop();
        }
    });

    nightModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        nightModeToggle.textContent = document.body.classList.contains('dark') ? '☀️ Day Mode' : '🌙 Night Mode';
    });
});
