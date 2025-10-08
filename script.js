const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let keys = {};
let bullets = [], enemies = [], guards = [], bosses = [];
let stars = [], player, score = 0, lives = 3, level = 1, running = false;
let warriorLives = 10;
let godJetMode = false, inMothership = false;

// -------------------- ENTITIES --------------------

// Stars background
class Star {
constructor(){ this.reset(); }
reset(){ this.x=Math.random()*W; this.y=Math.random()*H; this.size=Math.random()*2; this.speed=20+Math.random()*60; }
update(dt){ this.y+=this.speed*dt; if(this.y>H){ this.y=0; this.x=Math.random()*W; } }
draw(){ ctx.fillStyle="white"; ctx.fillRect(this.x,this.y,this.size,this.size); }
}

// Bullet
class Bullet {
constructor(x,y,speed,color){ this.x=x; this.y=y; this.speed=speed; this.color=color; this.r=4; this.dead=false; }
update(dt){ this.y+=this.speed*dt; if(this.y<0||this.y>H) this.dead=true; }
draw(){ ctx.fillStyle=this.color; ctx.fillRect(this.x-2,this.y-8,4,12); }
}

// Jet
class Jet {
constructor(){ this.x=W/2; this.y=H-80; this.cool=0; this.r=18; this.hp=3; }
update(dt){
if(keys["ArrowLeft"] && this.x>20) this.x-=300*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x+=300*dt;
if(keys["ArrowUp"] && this.y>20) this.y-=300*dt;
if(keys["ArrowDown"] && this.y<H-20) this.y+=300*dt;
if(keys["Space"] && this.cool<=0){
bullets.push(new Bullet(this.x,this.y-20,-500,"lime"));
this.cool=0.25;
}
if(this.cool>0) this.cool-=dt;
}
draw(){
ctx.fillStyle="cyan"; ctx.beginPath();
ctx.moveTo(this.x,this.y-20);
ctx.lineTo(this.x-20,this.y+20);
ctx.lineTo(this.x+20,this.y+20);
ctx.closePath(); ctx.fill();
}
}

// Enemy ships
class Enemy {
constructor(x,y){ this.x=x; this.y=y; this.r=15; this.dead=false; this.speed=100; }
update(dt){ this.y+=this.speed*dt; if(this.y>H+20) this.dead=true; }
draw(){ ctx.fillStyle="red"; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}

// Boss ship
class Boss {
constructor(x,y){ this.x=x; this.y=y; this.r=40; this.hp=10; this.dead=false; }
update(dt){}
draw(){ ctx.fillStyle="darkred"; ctx.fillRect(this.x-40,this.y-20,80,40); ctx.fillStyle="white"; ctx.fillText(this.hp,this.x-5,this.y+5); }
hit(){ this.hp--; if(this.hp<=0) this.dead=true; }
}

// Warrior
class Warrior {
constructor(){ this.x=W/2; this.y=H-60; this.r=15; this.cool=0; this.hp=10; }
update(dt){
if(keys["ArrowLeft"] && this.x>20) this.x-=200*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x+=200*dt;
if(keys["ArrowUp"] && this.y>20) this.y-=200*dt;
if(keys["ArrowDown"] && this.y<H-20) this.y+=200*dt;
if(keys["Space"] && this.cool<=0){
bullets.push(new Bullet(this.x,this.y-25,-400,"yellow"));
this.cool=0.35;
}
if(this.cool>0) this.cool-=dt;
}
draw(){
ctx.fillStyle="cyan"; ctx.fillRect(this.x-10,this.y-20,20,40);
ctx.fillStyle="white"; ctx.fillRect(this.x-6,this.y-26,12,12);
}
}

// Guards
class Guard {
constructor(x,y){ this.x=x; this.y=y; this.r=16; this.dead=false; this.speed=80; }
update(dt){ let dx=player.x-this.x, dy=player.y-this.y, d=Math.hypot(dx,dy);
if(d>0){ this.x+=dx/d*this.speed*dt; this.y+=dy/d*this.speed*dt; } }
draw(){ ctx.fillStyle="green"; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}

// God Jet
class GodJet {
constructor(){ this.x=W/2; this.y=H-80; this.r=20; this.cool=0; this.hp=10; this.altFire=false; }
update(dt){
if(keys["ArrowLeft"] && this.x>20) this.x-=300*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x+=300*dt;
if(keys["ArrowUp"] && this.y>20) this.y-=300*dt;
if(keys["ArrowDown"] && this.y<H-20) this.y+=300*dt;
if(keys["ShiftLeft"]) this.altFire=true; else this.altFire=false;
if(keys["Space"] && this.cool<=0){
if(this.altFire){
for(let i=-5;i<=5;i++){ bullets.push(new Bullet(this.x+i*5,this.y-20,-500,"orange")); }
} else {
bullets.push(new Bullet(this.x,this.y-20,-600,"orange"));
}
this.cool=0.3;
}
if(this.cool>0) this.cool-=dt;
}
draw(){
ctx.fillStyle="gold"; ctx.beginPath();
ctx.moveTo(this.x,this.y-25); ctx.lineTo(this.x-25,this.y+25); ctx.lineTo(this.x+25,this.y+25);
ctx.closePath(); ctx.fill();
ctx.fillStyle="black"; ctx.fillText("God Jet", this.x-25,this.y-35);
}
}

// -------------------- GAME STATE --------------------
let spawnTimer=0, lastTime=0;

function resetGame(){
player=new Jet();
score=0; lives=3; warriorLives=10; level=1;
bullets=[]; enemies=[]; guards=[]; bosses=[];
stars=[...Array(60)].map(()=>new Star());
inMothership=false; godJetMode=false; running=false; spawnTimer=0;
}

// -------------------- FLOW --------------------
function startGame(){
resetGame();
running=true;
document.getElementById("overlay").classList.add("hidden");
lastTime=performance.now();
requestAnimationFrame(loop);
}

function enterMothership(){
inMothership=true; player=new Warrior();
guards=[new Guard(100,100), new Guard(800,100), new Guard(200,400), new Guard(700,300), new Guard(400,200)];
document.getElementById("overlay").classList.add("hidden");
running=true; lastTime=performance.now();
requestAnimationFrame(loop);
}

function claimGodJet(){
inMothership=false; godJetMode=true; player=new GodJet();
bosses=[...Array(10)].map((_,i)=>new Boss(150+(i%5)*150, 100+Math.floor(i/5)*120));
document.getElementById("overlay").classList.add("hidden");
running=true; lastTime=performance.now();
requestAnimationFrame(loop);
}

function endGame(msg){
running=false;
document.getElementById("ovTitle").textContent=msg;
document.getElementById("ovMsg").textContent="Thanks for playing!";
document.getElementById("overlay").classList.remove("hidden");
}

// -------------------- MAIN LOOP --------------------
function loop(t){
if(!running) return;
let dt=(t-lastTime)/1000; lastTime=t;

// Update
player.update(dt);
bullets.forEach(b=>b.update(dt));
stars.forEach(s=>s.update(dt));

// Level 1 enemies
if(level===1){
spawnTimer-=dt;
if(spawnTimer<=0){ enemies.push(new Enemy(Math.random()*(W-40)+20,-20)); spawnTimer=1.5; }
enemies.forEach(e=>e.update(dt));
}

// Collisions
if(level===1){
for(let e of enemies){
for(let b of bullets){
if(!b.dead && !e.dead && Math.hypot(b.x-e.x,b.y-e.y)<e.r){
e.dead=true; b.dead=true; score+=10;
}
}
}
enemies=enemies.filter(e=>!e.dead);
if(score>=200){ level=2; }
}

if(inMothership){
guards.forEach(g=>g.update(dt));
for(let g of guards){
for(let b of bullets){
if(!b.dead && !g.dead && Math.hypot(b.x-g.x,b.y-g.y)<g.r){ g.dead=true; b.dead=true; }
}
}
guards=guards.filter(g=>!g.dead);
if(guards.length===0){
running=false;
document.getElementById("ovTitle").textContent="You found the God Jet!";
document.getElementById("ovMsg").textContent="Claim it to fight 10 bosses!";
document.getElementById("ovBtn").textContent="Claim Jet";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick=claimGodJet;
return;
}
}

if(godJetMode){
for(let b of bullets){
for(let boss of bosses){
if(!b.dead && !boss.dead && Math.hypot(b.x-boss.x,b.y-boss.y)<boss.r){ b.dead=true; boss.hit(); }
}
}
bosses=bosses.filter(b=>!b.dead);
if(bosses.length===0){ return endGame("Final Victory 🏆"); }
}

// Cleanup
bullets=bullets.filter(b=>!b.dead);

// Draw
ctx.clearRect(0,0,W,H);
if(inMothership){ ctx.fillStyle="#111"; ctx.fillRect(0,0,W,H); guards.forEach(g=>g.draw()); }
else { stars.forEach(s=>s.draw()); enemies.forEach(e=>e.draw()); }
if(godJetMode) bosses.forEach(b=>b.draw());
player.draw(); bullets.forEach(b=>b.draw());

// HUD
document.getElementById("score").textContent=score;
document.getElementById("lives").textContent=inMothership ? warriorLives : (godJetMode ? player.hp : lives);
document.getElementById("level").textContent=inMothership ? "3 (Mothership)" : (godJetMode ? "3 (God Jet)" : level);

requestAnimationFrame(loop);
}

// -------------------- INPUT --------------------
document.addEventListener("keydown", e=>keys[e.code]=true);
document.addEventListener("keyup", e=>keys[e.code]=false);

// Buttons
document.getElementById("btnStart").onclick=startGame;
document.getElementById("btnRestart").onclick=startGame;
document.getElementById("ovBtn").onclick=startGame;
document.getElementById("btnPause").onclick=()=>running=!running;
