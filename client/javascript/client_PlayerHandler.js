
"use strict"

// =====================================================================
// DOM Player UI
// =====================================================================
const playerStats = (data) => {
   const playerName = document.querySelector(".player-name");
   const playerStats = document.querySelector(".player-stats");
   
   camera.viewport_HTML.id = data.playerID;
   playerName.textContent = data.name;

   // Player infos
   const health = playerStats.querySelector(".health");
   const mana = playerStats.querySelector(".mana");
   const regenMana = playerStats.querySelector(".mana-regen");
   const energy = playerStats.querySelector(".energy");
   const regenEnergy = playerStats.querySelector(".energy-regen");
   const GcD = playerStats.querySelector(".GcD");

   // Set DOM text content
   health.textContent = `Health: ${data.health}`;
   mana.textContent = `Mana: ${data.mana}`;
   regenMana.textContent = `Regen mana: ${data.regenMana}`;
   energy.textContent = `Energy: ${data.energy}`;
   regenEnergy.textContent = `Regen energy: ${data.regenEnergy}`;
   GcD.textContent = `GcD: ${data.GcD}`;
}

const playerScore = (data) => {
   const playerScore = document.querySelector(".player-score");

   // Player score
   const kills = playerScore.querySelector(".kills");
   const died = playerScore.querySelector(".died");
   const fame = playerScore.querySelector(".fame");
   const fameCount = playerScore.querySelector(".fame-count");

   // Set DOM text content
   kills.textContent = `Kills: ${data.kills}`;
   died.textContent = `Died: ${data.died}`;
   fame.textContent = `Fame: ${data.fame}`;
   fameCount.textContent = `F_Count: ${data.fameCount}`;
}


// =====================================================================
// Game UI Handler ==> Socket Listening
// =====================================================================
const handleGameUI = (socket) => {  
   
   socket.on("playerStats", (data) => playerStats(data));
   socket.on("playerScore", (data) => playerScore(data));
   socket.on("fameCount+1", (fameCount) => {
   
      ctx.fixedBack.clearRect(0, 0, camera.viewSize.width, camera.viewSize.height);
      ctx.fixedFront.clearRect(0, 0, camera.viewSize.width, camera.viewSize.height);
      
      clientPlayer.drawHUD_Frame();
      clientPlayer.drawFame_Frame();
      clientPlayer.drawFame_Count(fameCount);
   });
}


// =====================================================================
// Player Controls
// =====================================================================
const controls = {
   movements: {
      up: "z",
      down: "s",
      left: "q",
      right: "d",
      run: " ",
   },

   spells: {
      heal: "r",
   }
}


// =====================================================================
// Movements & Casting
// =====================================================================
let isCasting = false;

const playerCommand = (socket, event, ctrlObj, state) => {
   let pairsArray = Object.entries(ctrlObj);
   
   pairsArray.forEach(pair => {
      let key = pair[0];
      let value = pair[1];

      if(event.key === value) {
         socket.emit(key, state);

         if(ctrlObj === controls.spells && isCasting !== state) {
            isCasting = state;
            socket.emit("casting", state);
         }
      }
   });
}

const onKeyboardInput = (socket) => {

   window.addEventListener("keydown", (event) => {
      if(insideCanvas) {
   
         const state = true;
         playerCommand(socket, event, controls.movements, state);
         playerCommand(socket, event, controls.spells, state);
      }
   });
   
   window.addEventListener("keyup", (event) => {
      const state = false;
      playerCommand(socket, event, controls.movements, state);
      playerCommand(socket,event, controls.spells, state);
   });
}


// =====================================================================
// Attack
// =====================================================================
const playerAttackCommand = (socket, event, state) => {
   if(event.which === 1 && insideCanvas) {
      socket.emit("attack", state);
   }
}

const onMouseInput = (socket) => {

   window.addEventListener("mousedown", (event) => playerAttackCommand(socket, event, true));
   window.addEventListener("mouseup", (event) => playerAttackCommand(socket, event, false));
}


// =====================================================================
// Death Screen
// =====================================================================
const deathScreen = (socket) => {

   const deathScreen = document.querySelector(".death-screen");
   const deathMessage = document.querySelector(".death-message");
   const respawnTimer = document.querySelector(".respawn-timer");
   
   socket.on("playerDeath", (player) => {
      
      let textValue = "You died !";
      let timerValue = `Respawn in ${player.respawnTimer} sec`;
   
      if(player.deathCounts === 3) textValue = "You died again !";
      if(player.deathCounts === 6) textValue = "Wasted !";
      if(player.deathCounts === 9) textValue = "You died like a bitch !";
   
      deathScreen.style = "visibility: visible";
      deathMessage.textContent = textValue;
      respawnTimer.textContent = timerValue;
   });
   
   socket.on("playerRespawn", () => {
      deathScreen.style = "visibility: hidden";
   });
}