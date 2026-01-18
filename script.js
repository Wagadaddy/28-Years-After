document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       DOM ELEMENTS
    ========================= */
    const startMenu = document.getElementById('startMenu');
    const gameContainer = document.getElementById('gameContainer');
    const startGameButton = document.getElementById('startGame');
    const startWaveButton = document.getElementById('startWave');
    const mainMenuBtn = document.getElementById('mainMenuBtn');

    const nightBtn = document.getElementById('nightModeToggle');
    const rageBtn = document.getElementById('rageModeToggle');

    const map1Button = document.getElementById('map1');
    const map2Button = document.getElementById('map2');
    const map3Button = document.getElementById('map3');

    const rifleTowerButton = document.getElementById('rifleTower');
    const sniperTowerButton = document.getElementById('sniperTower');

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const livesElement = document.getElementById('lives');
    const moneyElement = document.getElementById('money');
    const waveElement = document.getElementById('wave');
    const scoreElement = document.getElementById('score');
    const highscoreEl = document.getElementById('highscoreValue');

    /* =========================
       GAME STATE
    ========================= */
    let lives, money, wave, score;
    let enemies, towers, projectiles;
    let selectedTowerType = null;
    let selectedMap = null;
    let path = [];
    let gameRunning = false;
    let spawnIntervalId = null;
    let lastTime = 0;
    let highscore = 0;

    /* =========================
       MAPS
    ========================= */
    const maps = {
        river: [
            {x:0,y:300},{x:100,y:250},{x:200,y:320},{x:300,y:290},
            {x:400,y:330},{x:500,y:280},{x:600,y:310},{x:700,y:290},{x:800,y:300}
        ],
        full: [
            {x:0,y:300},{x:10,y:10},{x:400,y:10},{x:400,y:150},
            {x:800,y:150},{x:800,y:300},{x:400,y:300},{x:400,y:450},
            {x:10,y:450},{x:10,y:600},{x:800,y:600}
        ],
        heartbeat: [
            {x:0,y:300},{x:50,y:300},{x:100,y:200},{x:150,y:400},
            {x:200,y:300},{x:300,y:300},{x:400,y:200},{x:450,y:400},
            {x:500,y:300},{x:600,y:300},{x:700,y:200},{x800,y:300}
        ]
    };

    /* =========================
       RESET GAME
    ========================= */
    function resetGame() {
        lives = 20;
        money = 100;
        wave = 1;
        score = 0;
        enemies = [];
        towers = [];
        projectiles = [];
        selectedTowerType = null;
        gameRunning = false;
        lastTime = 0;

        if (spawnIntervalId) {
            clearInterval(spawnIntervalId);
            spawnIntervalId = null;
        }

        updateUI();
    }

    /* =========================
       UI
    ========================= */
    function updateUI() {
        livesElement.textContent = lives;
        moneyElement.textContent = money;
        waveElement.textContent = wave;
        scoreElement.textContent = score;

        if (score > highscore) {
            highscore = score;
            highscoreEl.textContent = highscore;
        }
    }

    /* =========================
       MAP SELECTION
    ========================= */
    function selectMap(mapKey) {
        selectedMap = mapKey;
        path = maps[mapKey];

        document.querySelectorAll('.mapButton')
            .forEach(btn => btn.classList.remove('selected'));

        document.getElementById(
            mapKey === 'river' ? 'map1' :
            mapKey === 'full' ? 'map2' : 'map3'
        ).classList.add('selected');

        startGameButton.disabled = false;
    }

    map1Button.onclick = () => selectMap('river');
    map2Button.onclick = () => selectMap('full');
    map3Button.onclick = () => selectMap('heartbeat');

    /* =========================
       START GAME
    ========================= */
    startGameButton.onclick = () => {
        if (!selectedMap) return;
        resetGame();
        startMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        requestAnimationFrame(gameLoop);
    };

    mainMenuBtn.onclick = () => {
        resetGame();
        startMenu.style.display = 'block';
        gameContainer.style.display = 'none';
        selectedMap = null;
        path = [];
        startGameButton.disabled = true;
    };

    /* =========================
       MODES
    ========================= */
   

nightBtn.onclick = () => {
    document.body.classList.remove('rage');
    const isDark = document.body.classList.toggle('dark');
    nightBtn.textContent = isDark ? 'Day Mode' : 'Night Mode';
};

rageBtn.onclick = () => {
    document.body.classList.remove('dark');
    document.body.classList.toggle('rage');
};



    /* =========================
       TOWERS
    ========================= */
    rifleTowerButton.onclick = () => selectedTowerType = 'rifle';
    sniperTowerButton.onclick = () => selectedTowerType = 'sniper';

    canvas.onclick = e => {
        if (!selectedTowerType) return;

        const cost = selectedTowerType === 'rifle' ? 50 : 100;
        if (money < cost) return;

        const rect = canvas.getBoundingClientRect();
        towers.push(new Tower(
            e.clientX - rect.left,
            e.clientY - rect.top,
            selectedTowerType
        ));

        money -= cost;
        selectedTowerType = null;
        updateUI();
    };

    /* =========================
       WAVES
    ========================= */
    startWaveButton.onclick = () => {
        if (gameRunning) return;
        gameRunning = true;

        let count = 5 + wave;
        spawnIntervalId = setInterval(() => {
            enemies.push(new Enemy());
            if (--count <= 0) {
                clearInterval(spawnIntervalId);
                spawnIntervalId = null;
                gameRunning = false;
            }
        }, 800);

        wave++;
        updateUI();
    };

    /* =========================
       CLASSES
    ========================= */
  class Enemy {
    constructor() {
        this.f = 0; // fractional index along path
        this.speed = 1; // pixels per frame
        this.hp = 100 * (1 + 0.1 * (wave - 1)); // 10% increase per wave
        this.maxHp = 100 * (1 + 0.1 * (wave - 1));
        this.reward = 10;

        // starting position
        this.x = path[0].x;
        this.y = path[0].y;
    }

    update() {
        if (this.f >= path.length - 1) {
            lives--;
            this.hp = 0;
            return;
        }

        const i = Math.floor(this.f);
        const nextI = i + 1;
        const p1 = path[i];
        const p2 = path[nextI];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        // move along segment proportional to distance
        this.f += this.speed / dist;

        this.x = p1.x + dx * (this.f - i);
        this.y = p1.y + dy * (this.f - i);
    }

    draw() {
        // draw enemy as circle
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // hp bar background
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x - 12, this.y - 18, 24, 4);

        // hp bar
        const hpWidth = (this.hp / this.maxHp) * 24;
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 12, this.y - 18, hpWidth, 4);
    }
}


     // draw hp bar outline
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x - 10, this.y - 15, 20, 4);

        // draw hp amount
        const hpWidth = (this.hp / this.maxHp) * 20;
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 10, this.y - 15, hpWidth, 4);
    


    class Tower {
        constructor(x,y,type) {
            this.x=x; this.y=y;
            this.range = type==='rifle'?120:170;
            this.damage = type==='rifle'?25:50;
            this.rate = type==='rifle'?500:900;
            this.last=0;
        }
        update(t) {
            if (t-this.last < this.rate) return;
            const e = enemies.find(e=>Math.hypot(e.x-this.x,e.y-this.y)<=this.range);
            if (e) {
                projectiles.push(new Projectile(this.x,this.y,e,this.damage));
                this.last=t;
            }
        }
        draw() {
            ctx.fillStyle='blue';
            ctx.fillRect(this.x-12,this.y-12,24,24);
        }
    }

    class Projectile {
        constructor(x,y,t,d){this.x=x;this.y=y;this.t=t;this.d=d;this.s=5;}
        update() {
            const dx=this.t.x-this.x, dy=this.t.y-this.y;
            const dist=Math.hypot(dx,dy);
            if (dist<this.s) {
                this.t.hp-=this.d;
                if(this.t.hp<=0){money+=this.t.reward;score+=this.t.reward;}
                return true;
            }
            this.x+=dx/dist*this.s; this.y+=dy/dist*this.s;
            return false;
        }
        draw(){ctx.fillStyle='yellow';ctx.fillRect(this.x-2,this.y-2,4,4);}
    }

    /* =========================
       PATH DRAWING
    ========================= */
    function drawPath() {
        if (path.length<2) return;
        ctx.strokeStyle='gray'; ctx.lineWidth=18;
        ctx.beginPath(); ctx.moveTo(path[0].x,path[0].y);
        for(let i=1;i<path.length;i++){
            selectedMap==='river'
                ? ctx.quadraticCurveTo(path[i-1].x,path[i-1].y,path[i].x,path[i].y)
                : ctx.lineTo(path[i].x,path[i].y);
        }
        ctx.stroke();
    }

    /* =========================
       GAME LOOP
    ========================= */
    function gameLoop(t) {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        drawPath();

        enemies = enemies.filter(e=>{e.update();e.draw();return e.hp>0;});
        towers.forEach(tw=>{tw.update(t);tw.draw();});
        projectiles = projectiles.filter(p=>{const h=p.update();p.draw();return !h;});

        updateUI();
        if (lives>0) requestAnimationFrame(gameLoop);
        else alert("Game Over!");
    }

});
