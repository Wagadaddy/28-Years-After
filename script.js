document.addEventListener("DOMContentLoaded", () => {

document.addEventListener('DOMContentLoaded', () => {
    const startMenu = document.getElementById('startMenu');
    const gameContainer = document.getElementById('gameContainer');
    const startGameButton = document.getElementById('startGame');

    const nightBtn = document.getElementById('nightModeToggle');
    const rageBtn = document.getElementById('rageModeToggle');

    const highscoreEl = document.getElementById('highscoreValue');
    let highscore = 0;

    const map1Button = document.getElementById('map1');
    const map2Button = document.getElementById('map2');
    const map3Button = document.getElementById('map3');

    const rifleTowerButton = document.getElementById('rifleTower');
    const sniperTowerButton = document.getElementById('sniperTower');
    const startWaveButton = document.getElementById('startWave');

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const livesElement = document.getElementById('lives');
    const moneyElement = document.getElementById('money');
    const waveElement = document.getElementById('wave');
    const scoreElement = document.getElementById('score');

    // --- Game variables ---
    let lives = 20;
    let money = 100;
    let wave = 1;
    let score = 0;
    let highscore = 0;
    let enemies = [];
    let towers = [];
    let projectiles = [];
    let gameRunning = false;
    let selectedTowerType = null;
    let selectedMap = null;
    let path = [];
    let lastTime = 0;

    // --- Map definitions ---
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

    // --- Event listeners ---

    // Map selection
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

     // Start Game button
    startGameButton.addEventListener('click', () => {
        if (!selectedMap) return;
        startMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        startGameLoop();
    });

    
    // Night Mode
    nightBtn.addEventListener('click', () => {
        document.body.classList.remove('rage');
        if (document.body.classList.contains('dark')) {
            document.body.classList.remove('dark');
            nightBtn.textContent = '🌙 Night Mode';
        } else {
            document.body.classList.add('dark');
            nightBtn.textContent = '☀️ Day Mode';
        }
    });

    // Rage Mode
    rageBtn.addEventListener('click', () => {
        document.body.classList.remove('dark');
        document.body.classList.add('rage');
        document.body.style.backgroundColor = '#550000';
        document.body.style.color = '#ff9999';
    });


    // Towers
    rifleTowerButton.addEventListener('click', () => selectedTowerType = 'rifle');
    sniperTowerButton.addEventListener('click', () => selectedTowerType = 'sniper');

    // Start Wave
    startWaveButton.addEventListener('click', () => startWave());

    // Highscore updater
    setInterval(() => {
        if (gameContainer.style.display !== 'none') {
            const currentScore = parseInt(document.getElementById('score').textContent);
            if (currentScore > highscore) {
                highscore = currentScore;
                highscoreEl.textContent = highscore;
            }
        }
    }, 500);

    // --- Rest of your original classes (Enemy, Tower, Projectile) and functions ---
    // Make sure all drawing, gameLoop, spawnEnemy, placeTower etc. are inside DOMContentLoaded
    // ...
});

    // ----- Classes -----
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

        update() {
            if (this.pathIndex < path.length - 1) {
                const target = path[this.pathIndex + 1];
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < this.speed) {
                    this.pathIndex++;
                    if (this.pathIndex >= path.length - 1) {
                        lives--;
                        this.health = 0;
                        updateUI();
                    }
                } else {
                    this.x += (dx/distance) * this.speed;
                    this.y += (dy/distance) * this.speed;
                }
            }
        }

        draw() {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x-10, this.y-10, 20, 20);
            // health bar
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x-10, this.y-15, 20, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x-10, this.y-15, (this.health/this.maxHealth)*20, 3);
        }
    }

    class Tower {
        constructor(x,y,type) {
            this.x = x; this.y = y; this.type = type;
            this.range = type==='rifle'?100:150;
            this.damage = type==='rifle'?25:50;
            this.fireRate = type==='rifle'?500:1000;
            this.lastFired = 0;
        }

        update(currentTime) {
            if (currentTime - this.lastFired > this.fireRate) {
                const target = this.findTarget();
                if (target) {
                    projectiles.push(new Projectile(this.x,this.y,target,this.damage));
                    this.lastFired = currentTime;
                }
            }
        }

        findTarget() {
            for (let e of enemies) {
                const dx = e.x - this.x, dy = e.y - this.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance <= this.range) return e;
            }
            return null;
        }

        draw() {
            ctx.fillStyle = this.type==='rifle'?'blue':'purple';
            ctx.fillRect(this.x-15,this.y-15,30,30);
            ctx.strokeStyle='rgba(0,0,255,0.2)';
            ctx.beginPath();
            ctx.arc(this.x,this.y,this.range,0,2*Math.PI);
            ctx.stroke();
        }
    }

    class Projectile {
        constructor(x,y,target,damage) {
            this.x=x; this.y=y; this.target=target; this.damage=damage; this.speed=5;
        }

        update() {
            const dx = this.target.x - this.x, dy = this.target.y - this.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < this.speed) {
                this.target.health -= this.damage;
                if (this.target.health <= 0) {
                    money += this.target.reward;
                    score += this.target.reward;
                    updateUI();
                }
                return true;
            } else {
                this.x += dx/distance * this.speed;
                this.y += dy/distance * this.speed;
            }
            return false;
        }

        draw() {
            ctx.fillStyle='yellow';
            ctx.beginPath();
            ctx.arc(this.x,this.y,3,0,2*Math.PI);
            ctx.fill();
        }
    }

    // ----- Functions -----
    function updateUI() {
        livesElement.textContent = lives;
        moneyElement.textContent = money;
        waveElement.textContent = wave;
        scoreElement.textContent = score;
    }

    function spawnEnemy() { enemies.push(new Enemy()); }

    function startWave() {
        if (!gameRunning) {
            gameRunning = true;
            let enemyCount = wave*5;
            const spawnInterval = setInterval(()=>{
                spawnEnemy();
                enemyCount--;
                if(enemyCount<=0){
                    clearInterval(spawnInterval);
                    gameRunning=false;
                }
            },1000);
            wave++;
            updateUI();
        }
    }

    function isValidTowerPosition(x,y) { return true; } // simplified

    function placeTower(x,y,type) {
        towers.push(new Tower(x,y,type));
    }

    function drawPath() {
        if (!path || path.length<2) return;
        ctx.strokeStyle='gray';
        ctx.lineWidth=20;
        ctx.beginPath();
        ctx.moveTo(path[0].x,path[0].y);

        // if river map, smooth with bezier
        if (selectedMap==='river') {
            for (let i=1;i<path.length;i++){
                const prev=path[i-1];
                const curr=path[i];
                ctx.quadraticCurveTo(prev.x,prev.y,curr.x,curr.y);
            }
        } else {
            for (let i=1;i<path.length;i++){
                ctx.lineTo(path[i].x,path[i].y);
            }
        }
        ctx.stroke();
    }

    function gameLoop(currentTime){
        const deltaTime = currentTime - lastTime;
        lastTime=currentTime;

        ctx.clearRect(0,0,canvas.width,canvas.height);

        drawPath();

        enemies=enemies.filter(e=>{ e.update(); e.draw(); return e.health>0; });
        towers.forEach(t=>{ t.update(currentTime); t.draw(); });
        projectiles=projectiles.filter(p=>{ const hit=p.update(); p.draw(); return !hit; });

        if(lives<=0){
            alert('Game Over!');
            window.location.reload();
        }

        requestAnimationFrame(gameLoop);
    }

    function startGameLoop() {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

    // ----- Event Listeners -----
    startWaveButton.addEventListener('click',startWave);
    rifleTowerButton.addEventListener('click',()=>selectedTowerType='rifle');
    sniperTowerButton.addEventListener('click',()=>selectedTowerType='sniper');

    canvas.addEventListener('click',(e)=>{
        if(selectedTowerType){
            const rect=canvas.getBoundingClientRect();
            const x=e.clientX-rect.left, y=e.clientY-rect.top;
            placeTower(x,y,selectedTowerType);
            selectedTowerType=null;
        }
    });

    function selectMap(mapKey){
        selectedMap=mapKey;
        path=maps[mapKey];
        document.querySelectorAll('.mapButton').forEach(btn=>btn.classList.remove('selected'));
        document.getElementById('map'+(Object.keys(maps).indexOf(mapKey)+1)).classList.add('selected');
        startGameButton.disabled=false;
    }

    map1Button.addEventListener('click',()=>selectMap('river'));
    map2Button.addEventListener('click',()=>selectMap('full'));
    map3Button.addEventListener('click',()=>selectMap('heartbeat'));

    startGameButton.addEventListener('click', () => {
    if (!selectedMap) return;
    startMenu.style.display = 'none';   // hide menu
    gameContainer.style.display = 'block';  // show game
    startGameLoop();  // start the game loop
});

    nightModeToggle.addEventListener('click',()=>{
        document.body.classList.toggle('dark');
        nightModeToggle.textContent=document.body.classList.contains('dark')?'☀️ Day Mode':'🌙 Night Mode';
    });

    console.log("Script loaded!"); // confirm JS is running
});
