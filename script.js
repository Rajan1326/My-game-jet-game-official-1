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

// -------------------- COLLISIONS --------------------
// Bullets hitting player
for(let eb of enemyBullets){
if(!eb.dead && Math.hypot(eb.x-player.x, eb.y-player.y)<20){
eb.dead=true;
if(player instanceof Jet){ lives=Math.max(0,lives-1); if(lives<=0) return endGame("Game Over ❌"); }
if(player instanceof Warrior){ warriorLives=Math.max(0,warriorLives-1); if(warriorLives<=0) return endGame("Defeated in Mothership ❌"); }
if(player instanceof GodJet){ player.hp=Math.max(0,player.hp-1); if(player.hp<=0) return endGame("God Jet Destroyed ❌"); }
}
}

// Hearts collection
for(let h of hearts){
if(!h.dead && Math.hypot(h.x-player.x,h.y-player.y)<20){
h.dead=true;
if(player instanceof Jet) lives++;
if(player instanceof Warrior) warriorLives++;
if(player instanceof GodJet) player.hp++;
}
}

// Trophy collection
if(trophy && Math.hypot(trophy.x-player.x,trophy.y-player.y)<30){
return endGame("Final Victory 🏆");
}

// Player bullets vs enemies
for(let e of enemies){
for(let b of bullets){
if(!b.dead && !e.dead && Math.hypot(b.x-e.x,b.y-e.y)<e.r){
e.dead=true; b.dead=true; score+=10;
}
}
}

// Player bullets vs bosses
if(bosses.length>0){
for(let b of bullets){
for(let boss of bosses){
if(!b.dead && !boss.dead && Math.hypot(b.x-boss.x,b.y-boss.y)<boss.r){
b.dead=true; boss.hit();
if(boss.dead && godJetMode && bosses.every(bs=>bs.dead) && !inFinalBattle){
// Celebration cutscene before final battle
running=false;
for(let i=0;i<100;i++){
let colors=["red","yellow","blue","green","purple","orange"];
confetti.push(new Confetti(Math.random()*W,-20,colors[Math.floor(Math.random()*colors.length)]));
}
showDialogue([
{speaker:"Crew", text:"Hooray! Our hero returns! 🎉"},
{speaker:"Commander", text:"Rest up. Tomorrow is the FINAL battle."}
], ()=>{ confetti=[]; startFinalBattle(); });
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

// Player bullets vs guards
if(inMothership){
for(let g of guards){
for(let b of bullets){
if(!b.dead && !g.dead && Math.hypot(b.x-g.x,b.y-g.y)<g.r){
g.dead=true; b.dead=true;
}
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

// -------------------- PROGRESSION --------------------
if(level===1 && score>=200){
running=false;
document.getElementById("ovTitle").textContent="Round 1 Complete 🏆";
document.getElementById("ovMsg").textContent="Proceed to Level 2";
document.getElementById("ovBtn").textContent="Next Level";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick=()=>{
level=2; running=true;
document.getElementById("overlay").classList.add("hidden");
lastTime=performance.now(); requestAnimationFrame(loop);
};
}
if(level===2 && score>=400 && bosses.length===0){
bosses=[new Boss(W/2,120)];
}

// Final battle waves
if(inFinalBattle && bosses.length===0){
if(wave<5){
running=false;
showDialogue([{speaker:"Commander",text:`Wave ${wave} cleared! Get ready for the next!`}],()=>{
wave++; spawnFinalWave();
running=true; requestAnimationFrame(loop);
});
} else {
trophy=new Trophy(W/2,H/2);
}
}

// -------------------- SPAWNING --------------------
spawnTimer-=dt; heartTimer-=dt;
if(spawnTimer<=0 && level<=2){
enemies.push(new Enemy(Math.random()*(W-40)+20,-20, level===2?1.5:2));
spawnTimer=1.5;
}
if(heartTimer<=0 && hearts.length<7){
hearts.push(new Heart(Math.random()*(W-40)+20,-20));
heartTimer=5;
}

// -------------------- CLEANUP --------------------
bullets=bullets.filter(b=>!b.dead);
enemyBullets=enemyBullets.filter(b=>!b.dead);
enemies=enemies.filter(e=>!e.dead);
bosses=bosses.filter(b=>!b.dead);
hearts=hearts.filter(h=>!h.dead);
confetti=confetti.filter(c=>!c.dead);

// -------------------- DRAW --------------------
ctx.clearRect(0,0,W,H);
if(inMothership){ ctx.fillStyle="#222"; ctx.fillRect(0,0,W,H); }
else if(inFinalBattle){
ctx.fillStyle="black"; ctx.fillRect(0,0,W,H);
ctx.fillStyle="purple"; ctx.font="24px Arial";
ctx.fillText("FINAL BATTLE - WAVE "+wave,W/2-140,40);
} else {
stars.forEach(s=>s.draw());
}

enemies.forEach(e=>e.draw());
enemyBullets.forEach(b=>b.draw());
bosses.forEach(b=>b.draw());
guards.forEach(g=>g.draw());
hearts.forEach(h=>h.draw());
allies.forEach(a=>a.draw());
confetti.forEach(c=>c.draw());
if(trophy) trophy.draw();
player.draw();
bullets.forEach(b=>b.draw());

document.getElementById("score").textContent=score;
document.getElementById("lives").textContent= player instanceof Warrior ? warriorLives : (player instanceof GodJet ? player.hp : lives);
document.getElementById("level").textContent= inFinalBattle ? "FINAL" : (godJetMode ? "4" : (inMothership ? "3" : level));

requestAnimationFrame(loop);
}
