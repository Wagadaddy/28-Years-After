document.addEventListener("DOMContentLoaded", () => {
  const startMenu = document.getElementById('startMenu');
  const gameContainer = document.getElementById('gameContainer');
  const startGameButton = document.getElementById('startGame');
  const startWaveButton = document.getElementById('startWave');
  const mainMenuBtn = document.getElementById('mainMenuBtn');
  const nightBtn = document.getElementById('nightModeToggle');
  const rifleTowerButton = document.getElementById('rifleTower');
  const sniperTowerButton = document.getElementById('sniperTower');
  const map1Button = document.getElementById('map1');
  const map2Button = document.getElementById('map2');
  const map3Button = document.getElementById('map3');

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const livesEl = document.getElementById('lives');
  const moneyEl = document.getElementById('money');
  const waveEl = document.getElementById('wave');
  const scoreEl = document.getElementById('score');
  const highscoreEl = document.getElementById('highscoreValue');

  let lives, money, wave, score, highscore = 0;
  let enemies = [], towers = [], projectiles = [];
  let selectedTowerType = null;
  let selectedMap = null, path = [];
  let lastTime = 0;

  // --- Responsive Canvas ---
  function resizeCanvas() {
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.65;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const ENEMY_RADIUS = () => canvas.width / 80;
  const TOWER_SIZE = () => canvas.width / 35;
  const PROJECTILE_SIZE = () => canvas.width / 150;

  // --- Maps ---
  const maps = {
    river: [
      {x:0,y:300},{x:100,y:250},{x:200,y:320},{x:300,y:290},
      {x:400,y:330},{x:500,y:280},{x:600,y:310},{x:700,y:290},{x:800,y:300}
    ],
    full: [
      {x:0,y:300},{x:50,y:300},{x:50,y:20},{x:400,y:20},{x:400,y:150},
      {x:780,y:150},{x:780,y:300},{x:400,y:300},{x:400,y:450},
      {x:20,y:450},{x:20,y:580},{x:800,y:580}
    ],
    heartbeat: [
      {x:0,y:300},{x:50,y:300},{x:100,y:200},{x:150,y:400},
      {x:200,y:300},{x:300,y:300},{x:400,y:200},{x:450,y:400},
      {x:500,y:300},{x:600,y:300},{x:700,y:200},{x:800,y:300}
    ]
  };

  function scalePath(p) {
    const scaleX = canvas.width / 800;
    const scaleY = canvas.height / 600;
    return p.map(pt => ({ x: pt.x * scaleX, y: pt.y * scaleY }));
  }

  function selectMap(key) {
    selectedMap = key;
    path = scalePath(maps[key]);
    document.querySelectorAll('.mapButton').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(key==='river'?'map1':key==='full'?'map2':'map3').classList.add('selected');
    startGameButton.disabled = false;
  }

  map1Button.onclick = () => selectMap('river');
  map2Button.onclick = () => selectMap('full');
  map3Button.onclick = () => selectMap('heartbeat');

  // --- Reset ---
  function resetGame() {
    lives=20; money=90; wave=0; score=0;
    enemies=[]; towers=[]; projectiles=[];
    selectedTowerType=null; lastTime=0;
    updateUI();
  }

  function updateUI() {
    livesEl.textContent = lives;
    moneyEl.textContent = money;
    waveEl.textContent = wave;
    scoreEl.textContent = score;
    if(score>highscore){ highscore=score; highscoreEl.textContent=highscore; }
  }

  // --- Start Game ---
  startGameButton.onclick = () => {
    if(!selectedMap) return;
    resetGame();
    startMenu.style.display='none';
    gameContainer.style.display='block';
    requestAnimationFrame(gameLoop);
  };

  mainMenuBtn.onclick = () => {
    resetGame();
    startMenu.style.display='block';
    gameContainer.style.display='none';
    selectedMap=null; path=[];
    startGameButton.disabled=true;
  };

  // --- Modes ---
  nightBtn.onclick = () => {
    document.body.classList.toggle('dark');
  };

  rifleTowerButton.onclick = () => selectedTowerType='rifle';
  sniperTowerButton.onclick = () => selectedTowerType='sniper';

  function handleCanvasClick(x,y){
    if(!selectedTowerType) return;
    const cost = selectedTowerType==='rifle'?50:100;
    if(money<cost) return;
    towers.push(new Tower(x,y,selectedTowerType));
    money -= cost; selectedTowerType=null; updateUI();
  }

  canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect();
    handleCanvasClick(e.clientX - rect.left, e.clientY - rect.top);
  };

  canvas.addEventListener('touchstart', e => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handleCanvasClick(touch.clientX - rect.left, touch.clientY - rect.top);
    e.preventDefault();
  });

  // --- Waves ---
  startWaveButton.onclick = () => {
    if(!selectedMap) return;
    wave++; updateUI();
    let count = Math.ceil(wave + 5);
    let spawned=0;
    const waveInterval = setInterval(()=>{
      const enemy=new Enemy(wave);
      if((spawned+1)%5===0){ enemy.speed*=1.5; enemy.color='orange'; } 
      else { enemy.color='red'; }
      enemies.push(enemy); spawned++;
      if(spawned>=count) clearInterval(waveInterval);
    },800);
  };

  // --- Classes ---
  class Enemy{
    constructor(wave){
      this.f=0;
      this.speed=1;
      this.hp=100*(1+0.1*(wave-1));
      this.maxHp=this.hp;
      this.reward=10;
      this.x=path[0].x; this.y=path[0].y;
      this.color='red';
    }
    update(){
      if(this.f>=path.length-1){ lives--; this.hp=0; return; }
      const i=Math.floor(this.f);
      const nextI=i+1;
      const p1=path[i], p2=path[nextI];
      const dx=p2.x-p1.x, dy=p2.y-p1.y;
      const dist=Math.hypot(dx,dy);
      this.x+=(dx/dist)*this.speed; this.y+=(dy/dist)*this.speed;
      this.f=i+Math.hypot(this.x-p1.x,this.y-p1.y)/dist;
    }
    draw(){
      ctx.fillStyle=this.color;
      ctx.beginPath();
      ctx.arc(this.x,this.y,ENEMY_RADIUS(),0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='black';
      ctx.fillRect(this.x-ENEMY_RADIUS(),this.y-ENEMY_RADIUS()*1.5,ENEMY_RADIUS()*2,4);
      const hpWidth=(this.hp/this.maxHp)*ENEMY_RADIUS()*2;
      ctx.fillStyle='green';
      ctx.fillRect(this.x-ENEMY_RADIUS(),this.y-ENEMY_RADIUS()*1.5,hpWidth,4);
    }
  }

  class Tower{
    constructor(x,y,type){
      this.x=x; this.y=y;
      this.range=type==='rifle'?canvas.width/6:canvas.width/4;
      this.damage=type==='rifle'?25:50;
      this.rate=type==='rifle'?500:900;
      this.last=0;
    }
    update(t){
      if(t-this.last<this.rate) return;
      const e=enemies.find(e=>Math.hypot(e.x-this.x,e.y-this.y)<=this.range);
      if(e){ projectiles.push(new Projectile(this.x,this.y,e,this.damage)); this.last=t; }
    }
    draw(){
      ctx.fillStyle='blue';
      const size=TOWER_SIZE();
      ctx.fillRect(this.x-size/2,this.y-size/2,size,size);
    }
  }

  class Projectile{
    constructor(x,y,t,d){ this.x=x; this.y=y; this.t=t; this.d=d; this.s=5; }
    update(){
      const dx=this.t.x-this.x, dy=this.t.y-this.y;
      const dist=Math.hypot(dx,dy);
      if(dist<this.s){ this.t.hp-=this.d; if(this.t.hp<=0){money+=this.t.reward; score+=this.t.reward;} return true; }
      this.x+=dx/dist*this.s; this.y+=dy/dist*this.s; return false;
    }
    draw(){
      ctx.fillStyle='yellow';
      const s=PROJECTILE_SIZE();
      ctx.fillRect(this.x-s/2,this.y-s/2,s,s);
    }
  }

  function drawPath(){
    if(path.length<2) return;
    ctx.strokeStyle='gray'; ctx.lineWidth=18;
    ctx.beginPath(); ctx.moveTo(path[0].x,path[0].y);
    for(let i=1;i<path.length;i++){
      selectedMap==='river' 
        ? ctx.quadraticCurveTo(path[i-1].x,path[i-1].y,path[i].x,path[i].y) 
        : ctx.lineTo(path[i].x,path[i].y);
    }
    ctx.stroke();
  }

  function gameLoop(t){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawPath();
    enemies=enemies.filter(e=>{ e.update(); e.draw(); return e.hp>0; });
    towers.forEach(tw=>{ tw.update(t); tw.draw(); });
    projectiles=projectiles.filter(p=>{ const h=p.update(); p.draw(); return !h; });
    updateUI();
    if(lives>0) requestAnimationFrame(gameLoop); 
    else alert("Game Over!");
  }

});

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
    if (!selectedMap) return;  // safety check

    wave++;                    // increment wave counter
    updateUI();                // refresh wave display

    let count = Math.ceil(wave + 5);
    let spawned = 0;

    const waveInterval = setInterval(() => {
        const enemy = new Enemy(wave);
        if ((spawned + 1) % 5 === 0) {
            enemy.speed *= 1.5;
            enemy.color = 'orange';
        } else {
            enemy.color = 'red';
        }
        enemies.push(enemy);
        spawned++;

        if (spawned >= count) {
            clearInterval(waveInterval); // only clears THIS wave
        }
    }, 800);
};


    /* =========================
       CLASSES
    ========================= */
  class Enemy {
    constructor() {
        this.f = 0; // position along path
        this.speed = 1; // base speed
        this.hp = 100 * (1 + 0.1 * (wave - 1)); // increase 10% per wave
        this.maxHp = this.hp;
        this.reward = 10;
        this.x = path[0].x;
        this.y = path[0].y;
        this.color = 'red'; // default color
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

        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;

        this.f = i + Math.hypot(this.x - p1.x, this.y - p1.y) / dist;

    }

    draw() {
        // draw body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // hp bar outline
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 10, this.y - 15, 20, 4);

        // hp bar amount
        const hpWidth = (this.hp / this.maxHp) * 20;
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 10, this.y - 15, hpWidth, 4);
    }
}

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPath();

    enemies = enemies.filter(e => { e.update(); e.draw(); return e.hp > 0; });
    towers.forEach(tw => { tw.update(t); tw.draw(); });
    projectiles = projectiles.filter(p => { const h = p.update(); p.draw(); return !h; });

    updateUI();
        

    if (lives > 0) requestAnimationFrame(gameLoop);
    else alert("Game Over!");
}

});
