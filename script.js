document.addEventListener("DOMContentLoaded", () => {
  // --- DOM elements ---
  const startMenu = document.getElementById('startMenu');
  const gameContainer = document.getElementById('gameContainer');
  const startGameButton = document.getElementById('startGame');
  const startWaveButton = document.getElementById('startWave');
  const mainMenuBtn = document.getElementById('mainMenuBtn');
  const nightBtn = document.getElementById('nightModeToggle');
  const rageBtn = document.getElementById('rageModeToggle');
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

  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;

  // --- Responsive scaling ---
  function resizeCanvas() {
    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function scaleX(x){ return x * canvas.clientWidth / BASE_WIDTH; }
  function scaleY(y){ return y * canvas.clientHeight / BASE_HEIGHT; }
  function ENEMY_RADIUS(){ return canvas.clientWidth / 80; }
  function TOWER_SIZE(){ return canvas.clientWidth / 35; }
  function PROJECTILE_SIZE(){ return canvas.clientWidth / 150; }

  // --- Maps ---
  const maps = {
    river: [{x:0,y:300},{x:100,y:250},{x:200,y:320},{x:300,y:290},{x:400,y:330},{x:500,y:280},{x:600,y:310},{x:700,y:290},{x:800,y:300}],
    full: [{x:0,y:300},{x:50,y:300},{x:50,y:20},{x:400,y:20},{x:400,y:150},{x:780,y:150},{x:780,y:300},{x:400,y:300},{x:400,y:450},{x:20,y:450},{x:20,y:580},{x:800,y:580}],
    heartbeat: [{x:0,y:300},{x:50,y:300},{x:100,y:200},{x:150,y:400},{x:200,y:300},{x:300,y:300},{x:400,y:200},{x:450,y:400},{x:500,y:300},{x:600,y:300},{x:700,y:200},{x:800,y:300}]
  };

  function selectMap(key){
    selectedMap = key;
    path = maps[key];
    document.querySelectorAll('.mapButton').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(key==='river'?'map1':key==='full'?'map2':'map3').classList.add('selected');
    startGameButton.disabled = false;
  }

  map1Button.onclick = ()=>selectMap('river');
  map2Button.onclick = ()=>selectMap('full');
  map3Button.onclick = ()=>selectMap('heartbeat');

  // --- Game reset & UI ---
  function resetGame(){
    lives=20; money=90; wave=0; score=0;
    enemies=[]; towers=[]; projectiles=[];
    selectedTowerType=null; lastTime=0;
    updateUI();
  }

  function updateUI(){
    livesEl.textContent = lives;
    moneyEl.textContent = money;
    waveEl.textContent = wave;
    scoreEl.textContent = score;
    if(score>highscore){ highscore=score; highscoreEl.textContent=highscore; }
  }

  startGameButton.onclick = ()=>{
    if(!selectedMap) return;
    resetGame();
    startMenu.style.display='none';
    gameContainer.style.display='block';
    requestAnimationFrame(gameLoop);
  };

  mainMenuBtn.onclick = ()=>{
    resetGame();
    startMenu.style.display='block';
    gameContainer.style.display='none';
    selectedMap=null; path=[];
    startGameButton.disabled=true;
  };

  nightBtn.onclick = ()=>{ document.body.classList.toggle('dark'); };
  rageBtn.onclick = ()=>{ document.body.classList.toggle('rage'); };

  rifleTowerButton.onclick = ()=>selectedTowerType='rifle';
  sniperTowerButton.onclick = ()=>selectedTowerType='sniper';

  function handleCanvasClick(x,y){
    if(!selectedTowerType) return;
    const cost = selectedTowerType==='rifle'?50:100;
    if(money<cost) return;
    towers.push(new Tower(x,y,selectedTowerType));
    money -= cost; selectedTowerType=null;
    updateUI();
  }

  canvas.onclick = e=>{
    const rect = canvas.getBoundingClientRect();
    handleCanvasClick((e.clientX-rect.left)*BASE_WIDTH/canvas.clientWidth,(e.clientY-rect.top)*BASE_HEIGHT/canvas.clientHeight);
  }

  canvas.addEventListener('touchstart', e=>{
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handleCanvasClick((touch.clientX-rect.left)*BASE_WIDTH/canvas.clientWidth,(touch.clientY-rect.top)*BASE_HEIGHT/canvas.clientHeight);
    e.preventDefault();
  });

  startWaveButton.onclick = ()=>{
    if(!selectedMap) return;
    wave++; updateUI();
    let count = Math.ceil(wave+5), spawned=0;
    const waveInterval = setInterval(()=>{
      const enemy = new Enemy(wave);
      if((spawned+1)%5===0){ enemy.speed*=1.5; enemy.color='orange'; }
      else{ enemy.color='red'; }
      enemies.push(enemy); spawned++;
      if(spawned>=count) clearInterval(waveInterval);
    },800);
  };

  // --- Classes ---
  class Enemy{
    constructor(wave){
      this.f=0; this.speed=1; this.hp=100*(1+0.1*(wave-1));
      this.maxHp=this.hp; this.reward=10;
      this.x=path[0].x; this.y=path[0].y; this.color='red';
    }
    update(){
      if(this.f>=path.length-1){ lives--; this.hp=0; return; }
      const i=Math.floor(this.f), nextI=i+1;
      const p1=path[i], p2=path[nextI];
      const dx=p2.x-p1.x, dy=p2.y-p1.y;
      const dist=Math.hypot(dx,dy);
      this.x+=(dx/dist)*this.speed; this.y+=(dy/dist)*this.speed;
      this.f=i+Math.hypot(this.x-p1.x,this.y-p1.y)/dist;
    }
    draw(){
      ctx.fillStyle=this.color;
      ctx.beginPath();
      ctx.arc(scaleX(this.x),scaleY(this.y),ENEMY_RADIUS(),0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='black';
      ctx.fillRect(scaleX(this.x-10),scaleY(this.y-15),ENEMY_RADIUS()*2,4);
      ctx.fillStyle='green';
      const hpWidth=(this.hp/this.maxHp)*ENEMY_RADIUS()*2;
      ctx.fillRect(scaleX(this.x-10),scaleY(this.y-15),hpWidth,4);
    }
  }

  class Tower{
    constructor(x,y,type){
      this.x=x; this.y=y;
      this.range=type==='rifle'?120:170; this.damage=type==='rifle'?25:50;
      this.rate=type==='rifle'?500:900; this.last=0;
    }
    update(t){
      if(t-this.last<this.rate) return;
      const e=enemies.find(e=>Math.hypot(e.x-this.x,e.y-this.y)<=this.range);
      if(e){ projectiles.push(new Projectile(this.x,this.y,e,this.damage)); this.last=t; }
    }
    draw(){
      ctx.fillStyle='blue';
      const size=TOWER_SIZE();
      ctx.fillRect(scaleX(this.x)-size/2, scaleY(this.y)-size/2, size, size);
    }
  }

  class Projectile{
    constructor(x,y,t,d){ this.x=x; this.y=y; this.t=t; this.d=d; this.s=5; }
    update(){
      const dx=this.t.x-this.x, dy=this.t.y-this.y;
      const dist=Math.hypot(dx,dy);
      if(dist<this.s){ this.t.hp-=this.d; if(this.t.hp<=0){money+=this.t.reward;score+=this.t.reward;} return true; }
      this.x+=dx/dist*this.s; this.y+=dy/dist*this.s; return false;
    }
    draw(){
      ctx.fillStyle='yellow';
      const s=PROJECTILE_SIZE();
      ctx.fillRect(scaleX(this.x)-s/2, scaleY(this.y)-s/2, s, s);
    }
  }

  function drawPath(){
    if(path.length<2) return;
    ctx.strokeStyle='gray'; ctx.lineWidth=18;
    ctx.beginPath();
    ctx.moveTo(scaleX(path[0].x), scaleY(path[0].y));
    for(let i=1;i<path.length;i++){
      selectedMap==='river' ? 
        ctx.quadraticCurveTo(scaleX(path[i-1].x), scaleY(path[i-1].y), scaleX(path[i].x), scaleY(path[i].y)) :
        ctx.lineTo(scaleX(path[i].x), scaleY(path[i].y));
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
  };

  function selectMap(key){
    selectedMap = key;
    path = maps[key]; // keep original coordinates
    document.querySelectorAll('.mapButton').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(key==='river'?'map1':key==='full'?'map2':'map3').classList.add('selected');
    startGameButton.disabled = false;
  }

  map1Button.onclick = ()=>selectMap('river');
  map2Button.onclick = ()=>selectMap('full');
  map3Button.onclick = ()=>selectMap('heartbeat');

  // --- Reset ---
  function resetGame(){
    lives=20; money=90; wave=0; score=0;
    enemies=[]; towers=[]; projectiles=[];
    selectedTowerType=null; lastTime=0;
    updateUI();
  }

  function updateUI(){
    livesEl.textContent = lives;
    moneyEl.textContent = money;
    waveEl.textContent = wave;
    scoreEl.textContent = score;
    if(score>highscore){ highscore=score; highscoreEl.textContent=highscore; }
  }

  // --- Start Game ---
  startGameButton.onclick = ()=>{
    if(!selectedMap) return;
    resetGame();
    startMenu.style.display='none';
    gameContainer.style.display='block';
    requestAnimationFrame(gameLoop);
  };

  mainMenuBtn.onclick = ()=>{
    resetGame();
    startMenu.style.display='block';
    gameContainer.style.display='none';
    selectedMap=null; path=[];
    startGameButton.disabled=true;
  };

  // --- Modes ---
  nightBtn.onclick = ()=>{ document.body.classList.toggle('dark'); };
  rifleTowerButton.onclick = ()=>selectedTowerType='rifle';
  sniperTowerButton.onclick = ()=>selectedTowerType='sniper';

  function handleCanvasClick(x,y){
    if(!selectedTowerType) return;
    const cost = selectedTowerType==='rifle'?50:100;
    if(money<cost) return;
    towers.push(new Tower(x,y,selectedTowerType));
    money-=cost; selectedTowerType=null; updateUI();
  }

  canvas.onclick = e=>{
    const rect = canvas.getBoundingClientRect();
    handleCanvasClick((e.clientX-rect.left)*BASE_WIDTH/canvas.width, (e.clientY-rect.top)*BASE_HEIGHT/canvas.height);
  }

  canvas.addEventListener('touchstart', e=>{
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handleCanvasClick((touch.clientX-rect.left)*BASE_WIDTH/canvas.width,(touch.clientY-rect.top)*BASE_HEIGHT/canvas.height);
    e.preventDefault();
  });

  // --- Waves ---
  startWaveButton.onclick = ()=>{
    if(!selectedMap) return;
    wave++; updateUI();
    let count = Math.ceil(wave+5), spawned=0;
    const waveInterval = setInterval(()=>{
      const enemy = new Enemy(wave);
      if((spawned+1)%5===0){ enemy.speed*=1.5; enemy.color='orange'; }
      else{ enemy.color='red'; }
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
      const i=Math.floor(this.f), nextI=i+1;
      const p1=path[i], p2=path[nextI];
      const dx=p2.x-p1.x, dy=p2.y-p1.y;
      const dist=Math.hypot(dx,dy);
      this.x+=(dx/dist)*this.speed; this.y+=(dy/dist)*this.speed;
      this.f=i+Math.hypot(this.x-p1.x,this.y-p1.y)/dist;
    }
    draw(){
      ctx.fillStyle=this.color;
      ctx.beginPath();
      ctx.arc(scaleX(this.x),scaleY(this.y),ENEMY_RADIUS(),0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='black';
      ctx.fillRect(scaleX(this.x-10),scaleY(this.y-15),ENEMY_RADIUS()*2,4);
      ctx.fillStyle='green';
      const hpWidth=(this.hp/this.maxHp)*ENEMY_RADIUS()*2;
      ctx.fillRect(scaleX(this.x-10),scaleY(this.y-15),hpWidth,4);
    }
  }

  class Tower{
    constructor(x,y,type){
      this.x=x; this.y=y;
      this.range=type==='rifle'?120:170;
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
      ctx.fillRect(scaleX(this.x)-size/2, scaleY(this.y)-size/2, size, size);
    }
  }

  class Projectile{
    constructor(x,y,t,d){ this.x=x; this.y=y; this.t=t; this.d=d; this.s=5; }
    update(){
      const dx=this.t.x-this.x, dy=this.t.y-this.y;
      const dist=Math.hypot(dx,dy);
      if(dist<this.s){ this.t.hp-=this.d; if(this.t.hp<=0){money+=this.t.reward;score+=this.t.reward;} return true; }
      this.x+=dx/dist*this.s; this.y+=dy/dist*this.s; return false;
    }
    draw(){
      ctx.fillStyle='yellow';
      const s=PROJECTILE_SIZE();
      ctx.fillRect(scaleX(this.x)-s/2, scaleY(this.y)-s/2, s, s);
    }
  }

  function drawPath(){
    if(path.length<2) return;
    ctx.strokeStyle='gray'; ctx.lineWidth=18;
    ctx.beginPath();
    ctx.moveTo(scaleX(path[0].x), scaleY(path[0].y));
    for(let i=1;i<path.length;i++){
      selectedMap==='river'
        ? ctx.quadraticCurveTo(scaleX(path[i-1].x),scaleY(path[i-1].y),scaleX(path[i].x),scaleY(path[i].y))
        : ctx.lineTo(scaleX(path[i].x),scaleY(path[i].y));
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
    if(lives>0) requestAnimationFrame(gameLoop); else alert("Game Over!");
  }

});
