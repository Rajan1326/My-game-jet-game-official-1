const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let keys = {};
let bullets = [], enemies = [], enemyBullets = [], guards = [], bosses = [], stars = [], hearts = [], trophy = null;
let player, score = 0, lives = 3, warriorLives = 10, level = 1, running = false;
let godJetMode = false, inMothership = false, spawnTimer = 0, heartTimer = 0, lastTime = 0;

// -------------------- ENTITIES --------------------
class Star {
constructor(){ this.reset(); }
reset(){ this.x=Math.random()*W; this.y=Math.random()*H; this.size=Math.random()*2; this.speed=20+Math.random()*60; }
update(dt){ this.y+=this.speed*dt; if(this.y>H){ this.y=0; this.x=Math.random()*W; } }
draw(){
if(!inMothership){
ctx.fillStyle="white";
ctx.fillRect(this.x,this.y,this.size,this.size);
}
}
}
class Bullet {
constructor(x,y,speed,color){ this.x=x; this.y=y; this.speed=speed; this.color=color; this.r=4; this.dead=false; }
update(dt){ this.y+=this.speed*dt; if(this.y<0||this.y>H) this.dead=true; }
draw(){ ctx.fillStyle=this.color; ctx.fillRect(this.x-2,this.y-8,4,12); }
}
class Jet {
constructor(){ this.x=W/2; this.y=H-80; this.cool=0; this.r=18; }
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
ctx.fillStyle="cyan";
ctx.beginPath();
ctx.moveTo(this.x,this.y-20);
ctx.lineTo(this.x-20,this.y+20);
ctx.lineTo(this.x+20,this.y+20);
ctx.closePath();
ctx.fill();
ctx.fillStyle="orange";
ctx.fillRect(this.x-5,this.y+20,10,8); // engine glow
}
}
class Enemy {
constructor(x,y,rate=2){ this.x=x; this.y=y; this.r=15; this.dead=false; this.speed=100; this.cool=rate; this.rate=rate; }
update(dt){
this.y+=this.speed*dt;
this.cool-=dt;
if(this.cool<=0){ enemyBullets.push(new Bullet(this.x,this.y+10,200,"red")); this.cool=this.rate; }
if(this.y>H+20) this.dead=true;
}
draw(){
ctx.fillStyle="darkred";
ctx.beginPath();
ctx.moveTo(this.x,this.y-15);
ctx.lineTo(this.x-20,this.y+15);
ctx.lineTo(this.x+20,this.y+15);
ctx.closePath();
ctx.fill();
ctx.fillStyle="yellow";
ctx.fillRect(this.x-5,this.y+10,10,5); // engine glow
}
}
class Boss {
constructor(x,y){ this.x=x; this.y=y; this.r=60; this.hp=12; this.dead=false; this.cool=1.5; }
update(dt){
this.cool-=dt;
if(this.cool<=0){
enemyBullets.push(new Bullet(this.x-30,this.y+20,250,"red"));
enemyBullets.push(new Bullet(this.x,this.y+20,250,"red"));
enemyBullets.push(new Bullet(this.x+30,this.y+20,250,"red"));
this.cool=1.5;
}
}
draw(){
ctx.fillStyle="gray";
ctx.fillRect(this.x-80,this.y-40,160,80);
ctx.fillStyle="red";
ctx.fillRect(this.x-10,this.y-50,20,10); // cockpit
ctx.fillStyle="orange";
ctx.fillText("HP:"+this.hp,this.x-20,this.y-60);
ctx.fillStyle="blue";
ctx.fillRect(this.x-70,this.y+30,30,10); // engine glow left
ctx.fillRect(this.x+40,this.y+30,30,10); // engine glow right
}
hit(){ this.hp--; if(this.hp<=0) this.dead=true; }
}
class Warrior {
constructor(){ this.x=W/2; this.y=H-60; this.r=15; this.cool=0; }
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
ctx.fillStyle="lightblue";
ctx.fillRect(this.x-10,this.y-20,20,40); // body
ctx.fillStyle="white";
ctx.fillRect(this.x-8,this.y-28,16,10); // helmet
ctx.fillStyle="blue";
ctx.fillRect(this.x-6,this.y-26,12,6); // visor
}
}
class Guard {
constructor(x,y){ this.x=x; this.y=y; this.r=16; this.dead=false; this.speed=60; this.cool=2; }
update(dt){
let dx=player.x-this.x, dy=player.y-this.y, d=Math.hypot(dx,dy);
if(d>0){ this.x+=dx/d*this.speed*dt; this.y+=dy/d*this.speed*dt; }
this.cool-=dt;
if(this.cool<=0){ enemyBullets.push(new Bullet(this.x,this.y,220,"red")); this.cool=2; }
}
draw(){
ctx.fillStyle="green";
ctx.beginPath();
ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
ctx.fill();
ctx.fillStyle="red";
ctx.fillRect(this.x-5,this.y+8,10,5); // blaster glow
}
}
class GodJet {
constructor(){ this.x=W/2; this.y=H-80; this.r=20; this.cool=0; this.hp=10; this.altFire=false; }
update(dt){
if(keys["ArrowLeft"] && this.x>20) this.x-=300*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x+=300*dt;
if(keys["ArrowUp"] && this.y>20) this.y-=300*dt;
if(keys["ArrowDown"] && this.y<H-20) this.y+=300*dt;
this.altFire = keys["ShiftLeft"];
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
ctx.fillStyle="gold";
ctx.beginPath();
ctx.moveTo(this.x,this.y-30);
ctx.lineTo(this.x-25,this.y+25);
ctx.lineTo(this.x+25,this.y+25);
ctx.closePath();
ctx.fill();
ctx.fillStyle="orange";
ctx.fillRect(this.x-5,this.y+25,10,10); // engine glow
}
}
class Heart {
constructor(x,y){ this.x=x; this.y=y; this.r=10; this.dead=false; }
update(dt){ this.y+=60*dt; if(this.y>H+20) this.dead=true; }
draw(){ ctx.fillStyle="pink"; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}
class Trophy {
constructor(x,y){ this.x=x; this.y=y; this.r=20; }
draw(){ ctx.fillStyle="yellow"; ctx.fillRect(this.x-15,this.y-20,30,40); ctx.fillStyle="orange"; ctx.fillText("🏆",this.x-12,this.y+10); }
}

// -------------------- GAME STATE --------------------
function resetGame(){
player=new Jet();
score=0; lives=3; warriorLives=10; level=1;
bullets=[]; enemies=[]; enemyBullets=[]; guards=[]; bosses=[]; hearts=[]; trophy=null;
stars=[...Array(60)].map(()=>new Star());
inMothership=false; godJetMode=false; running=false; spawnTimer=0; heartTimer=0;
}
function startGame(){ resetGame(); running=true; document.getElementById("overlay").classList.add("hidden"); lastTime=performance.now(); requestAnimationFrame(loop); }
function enterMothership(){
inMothership=true; player=new Warrior();
guards=[new Guard(100,100), new Guard(800,100), new Guard(200,400), new Guard(700,300), new Guard(400,200)];
document.getElementById("overlay").classList.add("hidden");
running=true; lastTime=performance.now(); requestAnimationFrame(loop);
}
function claimGodJet(){
inMothership=false; godJetMode=true; player=new GodJet();
bosses=[...Array(10)].map((_,i)=>new Boss(150+(i%5)*150, 100+Math.floor(i/5)*120));
document.getElementById("overlay").classList.add("hidden");
running=true; lastTime=performance.now(); requestAnimationFrame(loop);
}
function endGame(msg){ running=false; document.getElementById("ovTitle").textContent=msg; document.getElementById("ovMsg").textContent="Final Score: "+score; document.getElementById("overlay").classList.remove("hidden"); }

// -------------------- MAIN LOOP --------------------
function loop(t){
if(!running) return;
let dt=(t-lastTime)/1000; lastTime=t;

player.update(dt);
bullets.forEach(b=>b.update(dt));
enemies.forEach(e=>e.update(dt));
enemyBullets.forEach(b=>b.update(dt));
hearts.forEach(h=>h.update(dt));
stars.forEach(s=>s.update(dt));
if(bosses.length>0) bosses.forEach(b=>b.update(dt));
if(inMothership) guards.forEach(g=>g.update(dt));

// Collisions with bullets
for (let eb of enemyBullets) {
if (!eb.dead && Math.hypot(eb.x - player.x, eb.y - player.y) < 20) {
eb.dead=true;
if (player instanceof Jet) { lives=Math.max(0,lives-1); if(lives<=0) return endGame("Game Over ❌"); }
if (player instanceof Warrior) { warriorLives=Math.max(0,warriorLives-1); if(warriorLives<=0) return endGame("Defeated in Mothership ❌"); }
if (player instanceof GodJet) { player.hp=Math.max(0,player.hp-1); if(player.hp<=0) return endGame("God Jet Destroyed ❌"); }
}
}

// Collisions: hearts
for(let h of hearts){
if(!h.dead && Math.hypot(h.x-player.x,h.y-player.y)<20){
h.dead=true;
if(player instanceof Jet) lives++;
if(player instanceof Warrior) warriorLives++;
if(player instanceof GodJet) player.hp++;
}
}

// ✅ Trophy collision (restart after win)
if (trophy && Math.hypot(trophy.x - player.x, trophy.y - player.y) < 30) {
running = false;
score = 0; // reset score
document.getElementById("ovTitle").textContent = "Final Victory 🏆";
document.getElementById("ovMsg").textContent = "Congratulations! You beat the game.";
document.getElementById("ovBtn").textContent = "Play Again";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick = startGame;
}

// Enemy + Boss + Guard hits
for (let e of enemies){
for (let b of bullets){
if(!b.dead && !e.dead && Math.hypot(b.x-e.x,b.y-e.y)<e.r){ e.dead=true; b.dead=true; score+=10; }
}
}
if(bosses.length>0){
for (let b of bullets){
for (let boss of bosses){
if(!b.dead && !boss.dead && Math.hypot(b.x-boss.x,b.y-boss.y)<boss.r){
b.dead=true; boss.hit();
if(boss.dead && godJetMode && bosses.every(bs=>bs.dead)){
trophy=new Trophy(W/2,H/2);
}
if(boss.dead && !godJetMode){
running=false;
document.getElementById("ovTitle").textContent="Boss Defeated!";
document.getElementById("ovMsg").textContent="Going into Mothership...";
document.getElementById("ovBtn").textContent="Go";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick=enterMothership;
}
}
}
}
}
if(inMothership){
for(let g of guards){
for(let b of bullets){
if(!b.dead && !g.dead && Math.hypot(b.x-g.x,b.y-g.y)<g.r){ g.dead=true; b.dead=true; }
}
}
guards=guards.filter(g=>!g.dead);
if(guards.length===0){
running=false;
document.getElementById("ovTitle").textContent="You found the God Jet!";
document.getElementById("ovMsg").textContent="Claim it to continue!";
document.getElementById("ovBtn").textContent="Claim Jet";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick=claimGodJet;
}
}

// Progression
if(level===1 && score>=200){
running=false;
document.getElementById("ovTitle").textContent="Round 1 Complete 🏆";
document.getElementById("ovMsg").textContent="Proceed to Level 2";
document.getElementById("ovBtn").textContent="Next Level";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick=()=>{ level=2; running=true; document.getElementById("overlay").classList.add("hidden"); lastTime=performance.now(); requestAnimationFrame(loop); };
}
if(level===2 && score>=400 && bosses.length===0){ bosses=[new Boss(W/2,120)]; }

// Spawning enemies + hearts
spawnTimer-=dt; heartTimer-=dt;
if(spawnTimer<=0 && level<=2){ enemies.push(new Enemy(Math.random()*(W-40)+20,-20, level===2?1.5:2)); spawnTimer=1.5; }
if(heartTimer<=0 && hearts.length<7){ hearts.push(new Heart(Math.random()*(W-40)+20,-20)); heartTimer=5; }

// Cleanup
bullets=bullets.filter(b=>!b.dead); enemyBullets=enemyBullets.filter(b=>!b.dead); enemies=enemies.filter(e=>!e.dead); bosses=bosses.filter(b=>!b.dead); hearts=hearts.filter(h=>!h.dead);

// 🎨 Background draw
ctx.clearRect(0,0,W,H);
if(!inMothership){
stars.forEach(s=>s.draw());
} else {
ctx.fillStyle = "#222"; ctx.fillRect(0,0,W,H);
ctx.strokeStyle="#555";
for(let i=0;i<W;i+=80){
for(let j=0;j<H;j+=80){
ctx.strokeRect(i,j,80,80); // grid panels
}
}
}

// Entities draw
enemies.forEach(e=>e.draw()); enemyBullets.forEach(b=>b.draw()); bosses.forEach(b=>b.draw()); guards.forEach(g=>g.draw()); hearts.forEach(h=>h.draw());
if(trophy) trophy.draw();
player.draw(); bullets.forEach(b=>b.draw());

document.getElementById("score").textContent=score;
document.getElementById("lives").textContent= player instanceof Warrior ? warriorLives : (player instanceof GodJet ? player.hp : lives);
document.getElementById("level").textContent= godJetMode ? "4" : (inMothership ? "3" : level);

requestAnimationFrame(loop);
}

// -------------------- INPUT --------------------
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

document.getElementById("btnStart").onclick = startGame;
document.getElementById("btnRestart").onclick = startGame;
document.getElementById("ovBtn").onclick = startGame;
document.getElementById("btnPause").onclick = () => running = !running;
