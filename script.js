console.log("Script loaded!");

document.addEventListener("DOMContentLoaded", () => {
    // --- Canvas & DOM ---
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

    // --- Game variables ---
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

    // --- Maps ---
    const maps = {
        river: [
            {x: 10, y: 300}, {x: 100, y: 50}, {x: 200, y: 320}, {x: 300, y: 290},
            {x: 400, y: 330}, {x: 500, y: 280}, {x: 600, y: 310}, {x: 700, y: 290}, {x: 790, y: 300}
        ],
        full: [
            {x: 10, y: 300}, {x: 10, y: 10}, {x: 400, y: 10}, {x: 400, y: 150}, {x: 800, y: 150},
            {x: 800, y: 300}, {x: 400, y: 300}, {x: 400, y: 450}, {x: 10, y: 450}, {x: 10, y: 600}, {x: 790, y: 600}
        ],
        heartbeat: [
            {x: 10, y: 300}, {x: 50, y: 300}, {x: 100, y: 200}, {x: 150, y: 400}, {x: 200, y: 300},
            {x: 250, y: 300}, {x: 300, y: 300}, {x: 350, y: 300}, {x: 400, y: 200}, {x: 450, y: 400},
            {x: 500, y: 300}, {x: 550, y: 300}, {x: 600, y: 300}, {x: 650, y: 300}, {x: 700, y: 200},
            {x: 750, y: 400}, {x: 790, y: 300}
        ]
    };

    // --- Classes ---
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
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.speed) {
                    this.pathIndex++;
                    if (this.pathIndex >= path.length - 1) {
                        lives--;
                        this.health = 0;
                        updateUI();
                    }
                } else {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
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

    class Tower {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.range = type === 'rifle' ? 100 : 150;
            this.damage = type === 'rifle' ? 25 : 50;
            this.fireRate = type === 'rifle' ? 500 : 1000;
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
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= this.range) return enemy;
            }
            return null;
        }

        draw() {
            ctx.fillStyle = this.type === 'rifle' ? 'blue' : 'purple';
            ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        }
    }

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
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < this.speed){
                this.target.health -= this.damage;
                if(this.target.health <= 0){
                    money += this.target.reward;
                    score += this.target.reward;
                    updateUI();
                }
                return true;
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
            return false;
        }

        draw() {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // --- Functions ---
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
            let count = wave * 5;
            let interval = setInterval(() => {
                spawnEnemy();
                count--;
                if(count <= 0){
                    clearInterval(interval);
                    gameRunning = false;
                }
            }, 1000);
            wave++;
            updateUI();
        }
    }

    function isValidTowerPosition(x, y) {
        const towerLeft = x-15, towerRight=x+15, towerTop=y-15, towerBottom=y+15;
        for(let i=0;i<path.length-1;i++){
            const start = path[i], end=path[i+1];
            const segLeft = Math.min(start.x,end.x)-10;
            const segRight = Math.max(start.x,end.x)+10;
            const segTop = Math.min(start.y,end.y)-10;
            const segBottom = Math.max(start.y,end.y)+10;
            if(towerLeft<segRight && towerRight>segLeft && towerTop<segBottom && towerBottom>segTop) return false;
        }
        for(let tower of towers){
            if(Math.abs(x-tower.x)<30 && Math.abs(y-tower.y)<30) return false;
        }
        return true;
    }

    function placeTower(x,y,type){
        const cost = type==='rifle'?50:100;
        if(money>=cost && isValidTowerPosition(x,y)){
            towers.push(new Tower(x,y,type));
            money-=cost;
            updateUI();
        }
    }

    function drawPath() {
        ctx.strokeStyle='gray';
        ctx.lineWidth=20;
        ctx.beginPath();
        if(selectedMap==='river'){
            ctx.moveTo(path[0].x,path[0].y);
            for(let i=1;i<path.length-1;i++){
                const xc=(path[i].x+path[i+1].x)/2;
                const yc=(path[i].y+path[i+1].y)/2;
                ctx.quadraticCurveTo(path[i].x,path[i].y,xc,yc);
            }
            const last=path[path.length-1];
            ctx.lineTo(last.x,last.y);
        } else {
            ctx.moveTo(path[0].x,path[0].y);
            for(let i=1;i<path.length;i++) ctx.lineTo(path[i].x,path[i].y);
        }
        ctx.stroke();
    }

    function gameLoop(time){
        const delta = time-lastTime;
        lastTime=time;
        ctx.clearRect(0,0,canvas.width,canvas.height);

        // Draw path
        drawPath();

        // Update & draw enemies
        enemies = enemies.filter(e => { e.update(); e.draw(); return e.health>0; });

        // Update & draw towers
        towers.forEach(t=>{ t.update(time); t.draw(); });

        // Update & draw projectiles
        projectiles = projectiles.filter(p => { const hit=p.update(); p.draw(); return !hit; });

        if(lives<=0){
            alert("Game Over!");
            lives=20; money=100; wave=1; score=0;
            enemies=[]; towers=[]; projectiles=[];
            selectedMap=null; path=[];
            startMenu.style.display='flex';
            gameContainer.classList.remove('active');
            updateUI();
        }

        requestAnimationFrame(gameLoop);
    }

    function startGameLoop(){
        lastTime=0;
        requestAnimationFrame(gameLoop);
    }

    // --- Event listeners ---
    startWaveButton.addEventListener('click', startWave);
    rifleTowerButton.addEventListener('click',()=>selectedTowerType='rifle');
    sniperTowerButton.addEventListener('click',()=>selectedTowerType='sniper');
    canvas.addEventListener('click',(e)=>{
        if(selectedTowerType){
            const rect=canvas.getBoundingClientRect();
            const x=e.clientX-rect.left;
            const y=e.clientY-rect.top;
            placeTower(x,y,selectedTowerType);
            selectedTowerType=null;
        }
    });

    function selectMap(mapKey) {
    selectedMap = mapKey;
    path = maps[mapKey]; // assign the correct map path

    // Highlight selected button
    document.querySelectorAll('.mapButton').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('map' + (Object.keys(maps).indexOf(mapKey) + 1)).classList.add('selected');

    startGameButton.disabled = false; // enable start button
}

    map1Button.addEventListener('click',()=>selectMap('river'));
    map2Button.addEventListener('click',()=>selectMap('full'));
    map3Button.addEventListener('click',()=>selectMap('heartbeat'));

    startGameButton.addEventListener('click',()=>{
        if(selectedMap){
            startMenu.style.display='none';
            gameContainer.classList.add('active');
            startGameLoop();
        }
    });

    nightModeToggle.addEventListener('click',()=>{
        document.body.classList.toggle('dark');
        nightModeToggle.textContent = document.body.classList.contains('dark')?'☀️ Day Mode':'🌙 Night Mode';
    });
});

