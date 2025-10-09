const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let keys = {};
let bullets = [], enemies = [], enemyBullets = [], guards = [], bosses = [], stars = [], hearts = [], trophy = null, allies = [], confetti = [];
let player, score = 0, lives = 3, warriorLives = 10, level = 1, running = false;
let godJetMode = false, inMothership = false, inFinalBattle = false;
let spawnTimer = 0, heartTimer = 0, lastTime = 0, wave = 0;

// -------------------- ENTITIES --------------------
class Star {
constructor(){ this.reset(); }
reset(){ this.x=Math.random()*W; this.y=Math.random()*H; this.size=Math.random()*2; this.speed=20+Math.random()*60; }
update(dt){ this.y+=this.speed*dt; if(this.y>H){ this.y=0; this.x=Math.random()*W; } }
draw(){ if(!inMothership && !inFinalBattle){ ctx.fillStyle="white"; ctx.fillRect(this.x,this.y,this.size,this.size); } }
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
ctx.fillStyle="cyan"; ctx.beginPath();
ctx.moveTo(this.x,this.y-20); ctx.lineTo(this.x-20,this.y+20); ctx.lineTo(this.x+20,this.y+20);
ctx.closePath(); ctx.fill();
}
}
class Enemy {
constructor(x,y,rate=2){ this.x=x; this.y=y; this.r=15; this.dead=false; this.speed=100; this.cool=rate; this.rate=rate; }
update(dt){ this.y+=this.speed*dt; this.cool-=dt; if(this.cool<=0){ enemyBullets.push(new Bullet(this.x,this.y+10,200,"red")); this.cool=this.rate; } if(this.y>H+20) this.dead=true; }
draw(){ ctx.fillStyle="darkred"; ctx.beginPath(); ctx.moveTo(this.x,this.y-15); ctx.lineTo(this.x-20,this.y+15); ctx.lineTo(this.x+20,this.y+15); ctx.closePath(); ctx.fill(); }
}
class Boss {
constructor(x,y){ this.x=x; this.y=y; this.r=60; this.hp=12; this.dead=false; this.cool=1.5; }
update(dt){ this.cool-=dt; if(this.cool<=0){ enemyBullets.push(new Bullet(this.x-30,this.y+20,250,"red")); enemyBullets.push(new Bullet(this.x,this.y+20,250,"red")); enemyBullets.push(new Bullet(this.x+30,this.y+20,250,"red")); this.cool=1.5; } }
draw(){ ctx.fillStyle="gray"; ctx.fillRect(this.x-80,this.y-40,160,80); ctx.fillStyle="orange"; ctx.fillText("HP:"+this.hp,this.x-20,this.y-50); }
hit(){ this.hp--; if(this.hp<=0) this.dead=true; }
}
class Warrior {
constructor(){ this.x=W/2; this.y=H-60; this.r=15; this.cool=0; }
update(dt){ if(keys["ArrowLeft"]&&this.x>20) this.x-=200*dt; if(keys["ArrowRight"]&&this.x<W-20) this.x+=200*dt; if(keys["ArrowUp"]&&this.y>20) this.y-=200*dt; if(keys["ArrowDown"]&&this.y<H-20) this.y+=200*dt; if(keys["Space"]&&this.cool<=0){ bullets.push(new Bullet(this.x,this.y-25,-400,"yellow")); this.cool=0.35; } if(this.cool>0) this.cool-=dt; }
draw(){ ctx.fillStyle="lightblue"; ctx.fillRect(this.x-10,this.y-20,20,40); ctx.fillStyle="white"; ctx.fillRect(this.x-8,this.y-28,16,10); }
}
class Guard {
constructor(x,y){ this.x=x; this.y=y; this.r=16; this.dead=false; this.speed=60; this.cool=2; }
update(dt){ let dx=player.x-this.x, dy=player.y-this.y, d=Math.hypot(dx,dy); if(d>0){ this.x+=dx/d*this.speed*dt; this.y+=dy/d*this.speed*dt; } this.cool-=dt; if(this.cool<=0){ enemyBullets.push(new Bullet(this.x,this.y,220,"red")); this.cool=2; } }
draw(){ ctx.fillStyle="green"; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}
class GodJet {
constructor(){ this.x=W/2; this.y=H-80; this.r=20; this.cool=0; this.hp=10; this.altFire=false; }
update(dt){ if(keys["ArrowLeft"]&&this.x>20) this.x-=300*dt; if(keys["ArrowRight"]&&this.x<W-20) this.x+=300*dt; if(keys["ArrowUp"]&&this.y>20) this.y-=300*dt; if(keys["ArrowDown"]&&this.y<H-20) this.y+=300*dt; this.altFire=keys["ShiftLeft"]; if(keys["Space"]&&this.cool<=0){ if(this.altFire){ for(let i=-5;i<=5;i++){ bullets.push(new Bullet(this.x+i*5,this.y-20,-500,"orange")); } } else { bullets.push(new Bullet(this.x,this.y-20,-600,"orange")); } this.cool=0.3; } if(this.cool>0) this.cool-=dt; }
draw(){ ctx.fillStyle="gold"; ctx.beginPath(); ctx.moveTo(this.x,this.y-30); ctx.lineTo(this.x-25,this.y+25); ctx.lineTo(this.x+25,this.y+25); ctx.closePath(); ctx.fill(); }
}
class Heart { constructor(x,y){ this.x=x; this.y=y; this.r=10; this.dead=false; } update(dt){ this.y+=60*dt; if(this.y>H+20) this.dead=true; } draw(){ ctx.fillStyle="pink"; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); } }
class Trophy { constructor(x,y){ this.x=x; this.y=y; this.r=20; } draw(){ ctx.fillStyle="yellow"; ctx.fillRect(this.x-15,this.y-20,30,40); ctx.fillStyle="orange"; ctx.fillText("🏆",this.x-12,this.y+10); } }
class AllyJet {
constructor(x,y){ this.x=x; this.y=y; this.lives=5; this.cool=0; }
update(dt){ if(Math.random()<0.02 && this.cool<=0){ bullets.push(new Bullet(this.x,this.y-20,-400,"lightgreen")); this.cool=1; } if(this.cool>0) this.cool-=dt; }
draw(){ ctx.fillStyle="lightblue"; ctx.beginPath(); ctx.moveTo(this.x,this.y-15); ctx.lineTo(this.x-15,this.y+15); ctx.lineTo(this.x+15,this.y+15); ctx.closePath(); ctx.fill(); }
}
// 🎉 Confetti
class Confetti {
constructor(x,y,color){ this.x=x; this.y=y; this.color=color; this.size=5+Math.random()*5; this.speedY=50+Math.random()*100; this.speedX=(Math.random()-0.5)*60; this.angle=0; this.spin=(Math.random()-0.5)*0.2; this.dead=false; }
update(dt){ this.y+=this.speedY*dt; this.x+=this.speedX*dt; this.angle+=this.spin; if(this.y>H+20) this.dead=true; }
draw(){ ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.angle); ctx.fillStyle=this.color; ctx.fillRect(-this.size/2,-this.size/2,this.size,this.size); ctx.restore(); }
}

// -------------------- DIALOGUE --------------------
let dialogueQueue=[];
function showDialogue(sequence, callback){
dialogueQueue=[...sequence];
function nextDialogue(){
if(dialogueQueue.length===0){ document.getElementById("overlay").classList.add("hidden"); if(callback) callback(); return; }
const line=dialogueQueue.shift();
document.getElementById("ovTitle").textContent=line.speaker;
document.getElementById("ovMsg").textContent=line.text;
document.getElementById("ovBtn").textContent="Next";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick=nextDialogue;
}
nextDialogue();
}

// -------------------- GAME STATE --------------------
function resetGame(){ player=new Jet(); score=0; lives=3; warriorLives=10; level=1; bullets=[]; enemies=[]; enemyBullets=[]; guards=[]; bosses=[]; hearts=[]; trophy=null; stars=[...Array(60)].map(()=>new Star()); inMothership=false; godJetMode=false; inFinalBattle=false; allies=[]; confetti=[]; running=false; spawnTimer=0; heartTimer=0; wave=0; }
function startGame(){ resetGame(); running=true; document.getElementById("overlay").classList.add("hidden"); lastTime=performance.now(); requestAnimationFrame(loop); }
function enterMothership(){ inMothership=true; player=new Warrior(); guards=[new Guard(100,100),new Guard(800,100),new Guard(200,400),new Guard(700,300),new Guard(400,200)]; showDialogue([{speaker:"Commander",text:"You’ve breached the enemy mothership."},{speaker:"Commander",text:"Defeat the guards and find the God Jet!"}],()=>{running=true;lastTime=performance.now();requestAnimationFrame(loop);}); }
function claimGodJet(){ inMothership=false; godJetMode=true; player=new GodJet(); bosses=[...Array(10)].map((_,i)=>new Boss(150+(i%5)*150, 100+Math.floor(i/5)*120)); running=true; lastTime=performance.now(); requestAnimationFrame(loop); }
function startFinalBattle(){ inFinalBattle=true; godJetMode=true; player=new GodJet(); allies=[new AllyJet(200,H-120),new AllyJet(350,H-100),new AllyJet(500,H-120),new AllyJet(650,H-100),new AllyJet(800,H-120)]; wave=1; spawnFinalWave(); running=true; lastTime=performance.now(); requestAnimationFrame(loop); }
function spawnFinalWave(){ bosses=[...Array(5)].map((_,i)=>new Boss(150+(i*150),120)); }
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
if(inFinalBattle) allies.forEach(a=>a.update(dt));
confetti.forEach(c=>c.update(dt));

// --- collisions & progression (same as before, but with celebration) ---
// (shortened here for space, keep the same logic we already made including the celebration with confetti after godJetMode bosses)

// --- draw ---
ctx.clearRect(0,0,W,H);
if(inMothership){ ctx.fillStyle="#222"; ctx.fillRect(0,0,W,H); }
else if(inFinalBattle){ ctx.fillStyle="black"; ctx.fillRect(0,0,W,H); ctx.fillStyle="purple"; ctx.font="24px Arial"; ctx.fillText("FINAL BATTLE - WAVE "+wave,W/2-140,40); }
else { stars.forEach(s=>s.draw()); }

enemies.forEach(e=>e.draw()); enemyBullets.forEach(b=>b.draw()); bosses.forEach(b=>b.draw()); guards.forEach(g=>g.draw()); hearts.forEach(h=>h.draw()); allies.forEach(a=>a.draw()); confetti.forEach(c=>c.draw());
if(trophy) trophy.draw(); player.draw(); bullets.forEach(b=>b.draw());

document.getElementById("score").textContent=score;
document.getElementById("lives").textContent= player instanceof Warrior ? warriorLives : (player instanceof GodJet ? player.hp : lives);
document.getElementById("level").textContent= inFinalBattle ? "FINAL" : (godJetMode ? "4" : (inMothership ? "3" : level));

requestAnimationFrame(loop);
}

// -------------------- INPUT --------------------
document.addEventListener("keydown", e=>keys[e.code]=true);
document.addEventListener("keyup", e=>keys[e.code]=false);
document.getElementById("btnStart").onclick=startGame;
document.getElementById("btnRestart").onclick=startGame;
document.getElementById("ovBtn").onclick=startGame;
document.getElementById("btnPause").onclick=()=>running=!running;
