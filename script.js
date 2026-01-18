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

// Map definitions
const maps = {
    river: [
        {x: 0, y: 300},
        {x: 100, y: 280},
        {x: 200, y: 320},
        {x: 300, y: 290},
        {x: 400, y: 330},
        {x: 500, y: 280},
        {x: 600, y: 310},
        {x: 700, y: 290},
        {x: 800, y: 300}
    ],
    full: [
        {x: 0, y: 0},
        {x: 400, y: 0},
        {x: 400, y: 150},
        {x: 800, y: 150},
        {x: 800, y: 300},
        {x: 400, y: 300},
        {x: 400, y: 450},
        {x: 0, y: 450},
        {x: 0, y: 600},
        {x: 800, y: 600}
    ],
    heartbeat: [
        {x: 0, y: 300},
        {x: 50, y: 300},
        {x: 100, y: 200},
        {x: 150, y: 400},
        {x: 200, y: 300},
        {x: 250, y: 300},
        {x: 300, y: 300},
        {x: 350, y: 300},
        {x: 400, y: 200},
        {x: 450, y: 400},
        {x: 500, y: 300},
        {x: 550, y: 300},
        {x: 600, y: 300},
        {x: 650, y: 300},
        {x: 700, y: 200},
        {x: 750, y: 400},
        {x: 800, y: 300}
    ]
};

// Current path (will be set based on selected map)
let path = [];

// Enemy class
class Enemy {
    constructor() {
        this.x = path[0].x;
        this.y = path[0].y;
        this.speed = 1;
        this.health = 100;
        this.maxHealth = 100;
        this.pathIndex = 0;
        this.reward = 10;
    }
}
    update() {
        if (this.pathIndex < path.length - 1) {
            const target = path[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.pathIndex++;
                if (this.pathIndex >= path.length - 1) {
                    // Enemy reached the end
                    lives--;
                    this.health = 0;
                    updateUI();
                }
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 10, this.y - 10, 20, 20);

        // Health bar
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 10, this.y - 15, 20, 3);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 10, this.y - 15, (this.health / this.maxHealth) * 20, 3);
    }
}

// Tower class
class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.range = type === 'rifle' ? 100 : 150;
        this.damage = type === 'rifle' ? 25 : 50;
        this.fireRate = type === 'rifle' ? 500 : 1000; // milliseconds
        this.lastFired = 0;
        this.cost = type === 'rifle' ? 50 : 100;
    }

    update(currentTime) {
        if (currentTime - this.lastFired > this.fireRate) {
            const target = this.findTarget();
            if (target) {
                projectiles.push(new Projectile(this.x, this.y, target, this.damage));
                this.lastFired = currentTime;
            }
        }
    }

    findTarget() {
        for (let enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= this.range) {
                return enemy;
            }
        }
        return null;
    }

    draw() {
        ctx.fillStyle = this.type === 'rifle' ? 'blue' : 'purple';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);

        // Range indicator (subtle)
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

// Projectile class
class Projectile {
    constructor(x, y, target, damage) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = 5;
    }

    update() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            // Hit target
            this.target.health -= this.damage;
            if (this.target.health <= 0) {
                money += this.target.reward;
                score += this.target.reward;
                updateUI();
            }
            return true; // Remove projectile
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        return false;
    }

    draw() {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// Game functions
function updateUI() {
    livesElement.textContent = `Lives: ${lives}`;
    moneyElement.textContent = `Money: $${money}`;
    waveElement.textContent = `Wave: ${wave}`;
    scoreElement.textContent = `Score: ${score}`;
}

function spawnEnemy() {
    enemies.push(new Enemy());
}

function startWave() {
    if (!gameRunning) {
        gameRunning = true;
        let enemyCount = wave * 5;
        let spawnInterval = setInterval(() => {
            spawnEnemy();
            enemyCount--;
            if (enemyCount <= 0) {
                clearInterval(spawnInterval);
                gameRunning = false;
            }
        }, 1000);
        wave++;
        updateUI();
    }
}

function isValidTowerPosition(x, y) {
    // Tower size: 30x30, centered at (x,y)
    const towerLeft = x - 15;
    const towerRight = x + 15;
    const towerTop = y - 15;
    const towerBottom = y + 15;

    // Check overlap with path segments
    for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i + 1];
        
        // Simple bounding box check for the path segment
        const segmentLeft = Math.min(start.x, end.x) - 10; // 10px buffer for path width
        const segmentRight = Math.max(start.x, end.x) + 10;
        const segmentTop = Math.min(start.y, end.y) - 10;
        const segmentBottom = Math.max(start.y, end.y) + 10;
        
        if (towerLeft < segmentRight && towerRight > segmentLeft && 
            towerTop < segmentBottom && towerBottom > segmentTop) {
            return false;
        }
    }

    // Check overlap with existing towers
    for (let tower of towers) {
        const dx = Math.abs(x - tower.x);
        const dy = Math.abs(y - tower.y);
        if (dx < 30 && dy < 30) { // Minimum distance
            return false;
        }
    }

    return true;
}

function placeTower(x, y, type) {
    const cost = type === 'rifle' ? 50 : 100;
    if (money >= cost && isValidTowerPosition(x, y)) {
        towers.push(new Tower(x, y, type));
        money -= cost;
        updateUI();
    }
}

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

   // Draw path only if valid
if (path.length > 1) {
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
}

    // Update and draw enemies
    enemies = enemies.filter(enemy => {
        enemy.update();
        enemy.draw();
        return enemy.health > 0;
    });

    // Update and draw towers
    towers.forEach(tower => {
        tower.update(currentTime);
        tower.draw();
    });

    // Update and draw projectiles
    projectiles = projectiles.filter(projectile => {
        const hit = projectile.update();
        projectile.draw();
        return !hit;
    });

    // Check game over
    if (lives <= 0) {
        alert('Game Over!');
        // Reset game and return to menu
        lives = 20;
        money = 100;
        wave = 1;
        score = 0;
        enemies = [];
        towers = [];
        projectiles = [];
        selectedMap = null;
        path = [];
        gameContainer.classList.remove('active');
        startMenu.style.display = 'flex';
        startGameButton.disabled = true;
        document.querySelectorAll('.mapButton').forEach(btn => btn.classList.remove('selected'));
        updateUI();
    }

    requestAnimationFrame(gameLoop);
}

// Event listeners
startWaveButton.addEventListener('click', startWave);

rifleTowerButton.addEventListener('click', () => {
    selectedTowerType = 'rifle';
});

sniperTowerButton.addEventListener('click', () => {
    selectedTowerType = 'sniper';
});

canvas.addEventListener('click', (e) => {
    if (selectedTowerType) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        placeTower(x, y, selectedTowerType);
        selectedTowerType = null;
    }
});

// Start menu and night mode listeners
function selectMap(mapKey) {
    selectedMap = mapKey;
    path = maps[mapKey];
    
    // Update button styles
    document.querySelectorAll('.mapButton').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('map' + (Object.keys(maps).indexOf(mapKey) + 1)).classList.add('selected');
    
    // Enable start game button
    startGameButton.disabled = false;
}

map1Button.addEventListener('click', () => selectMap('river'));
map2Button.addEventListener('click', () => selectMap('full'));
map3Button.addEventListener('click', () => selectMap('heartbeat'));

startGameButton.addEventListener('click', () => {
    if (selectedMap) {
        startMenu.style.display = 'none';
        gameContainer.classList.add('active');
        startGameLoop(); // ✅ start only now
    }
});

nightModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    nightModeToggle.textContent = document.body.classList.contains('dark') ? '☀️ Day Mode' : '🌙 Night Mode';
});

// Start game loop
let animationRunning = false;

function startGameLoop() {
    if (!animationRunning) {
        animationRunning = true;
        requestAnimationFrame(gameLoop);
    }
}
