
"use strict"

// =====================================================================
// Scrips import
// =====================================================================
const Player = require("./classes/Player.js");
const collision = require("./collisions.js");
const bcrypt = require("bcrypt");


// =====================================================================
// Player connection
// =====================================================================
exports.onConnect = (socket, socketList) => {
   const player = new Player(socket.id);
   playerList[socket.id] = player;
   
   // Init player
   socket.on("playerName", (data) => {
      player.name = data;
      
      let receiverID;
      let receiverName;
      
      socket.emit("playerID", player.id);
      socket.emit("fameCount+1", player.fameCount);

      // Init Player Stats
      socket.emit("playerStats", {
         playerName: player.name,
         health: player.baseHealth,
         mana: player.baseMana,
         regenMana: player.baseRegenMana,
         energy: player.baseEnergy,
         regenEnergy: player.baseRegenEnergy,
         GcD: player.baseGcD,
      });
   
      // Init Player Score
      socket.emit("playerScore", {
         kills: player.kills,
         died: player.died,
         fame: player.fame,
         fameCount: player.fameCount,
      });

      // General Chat
      socket.on("generalMessage", (textMessage) => {
         for(let i in socketList) {
            socketList[i].emit("addMessage_General", `${player.name}: ${textMessage}`);
         }
      });
      
      // Private Chat
      socket.on("privateMessage", (textMessage) => {
         const prefix = "To >";
         let receiver = socketList[receiverID];
         
         if(receiver) {
            receiver.emit("addMessage_Private", `${player.name}: ${textMessage}`);
            socket.emit("addMessage_Private", `${prefix}${receiverName}: ${textMessage}`);
         }
         else socket.emit("addMessage_Private", `>${receiverName}< Has gone offline !`);
      });

      // Get reveiver ID for private chat 
      socket.on("chatReceiverName", (name) => {
         receiverName = name;
         
         for(let i in playerList) {
            let receiver = playerList[i];
            if(receiver.name === name) receiverID = receiver.id;
         }
      });
   });  
   
   // Movements
   socket.on("up", (state) => player.up = state);
   socket.on("down", (state) => player.down = state);
   socket.on("left", (state) => player.left = state);
   socket.on("right", (state) => player.right = state);

   // Spells cast
   socket.on("heal", (state) => player.cast_Heal = state);
   
   // States
   socket.on("run", (state) => player.isRunning = state);
   socket.on("attack", (state) => player.isAttacking = state);
   socket.on("casting", (state) => player.isCasting = state);
}


// =====================================================================
// Player disconnection
// =====================================================================
exports.onDisconnect = (socket) => {
   delete playerList[socket.id];
}


// =====================================================================
// Player Movements
// =====================================================================
const playerMovements = (player) => {
   let moveSpeed = player.walkSpeed;
   if(player.isRunning && player.isRunnable) moveSpeed = player.runSpeed;

   // console.log(player.x);
   // console.log(player.y);

   // Map Border Reached
   if(player.up && player.y < -15
   || player.down && player.y > 1550
   || player.left && player.x < 45
   || player.right && player.x > 2120) {
      return;
   }

   const axisOffset = {
      yAxis_x: 0,
      yAxis_y: 45,
      xAxis_x: 30,
      xAxis_y: 10,
   }
   
   crossMove(player, moveSpeed, axisOffset);
   diagMove(player, moveSpeed, axisOffset);
}

const crossMove = (player, moveSpeed, axisOffset) => {

   // Up & Down or Left & Right at the Same Time
   if(player.up && player.down || player.left && player.right) {
      player.frameY = 1;
      player.attkOffset_X = axisOffset.yAxis_x;
      player.attkOffset_Y = axisOffset.yAxis_y;
   }

   else {
      // Up (yAxis)
      if(player.up) {
         player.frameY = 0;
         player.y -= moveSpeed;
         player.attkOffset_X = axisOffset.yAxis_x;
         player.attkOffset_Y = -axisOffset.yAxis_y;
      }
      
      // Down (yAxis)
      if(player.down) {
         player.frameY = 1;
         player.y += moveSpeed;
         player.attkOffset_X = axisOffset.yAxis_x;
         player.attkOffset_Y = axisOffset.yAxis_y;
      }
      
      // Left (xAxis)
      if(player.left) {
         player.frameY = 2;
         player.x -= moveSpeed;
         player.attkOffset_X = -axisOffset.xAxis_x;
         player.attkOffset_Y = axisOffset.xAxis_y;
      }
      
      // Right (xAxis)
      if(player.right) {      
         player.frameY = 3;
         player.x += moveSpeed;
         player.attkOffset_X = axisOffset.xAxis_x;
         player.attkOffset_Y = axisOffset.xAxis_y;
      }
   }
}

const diagMove = (player, moveSpeed, axisOffset) => {

   let offset = ((axisOffset.yAxis_y + axisOffset.xAxis_x) / 2) * 0.7;

   // Up & Left
   if(player.up && player.left) {
      player.frameY = 0;
      player.attkOffset_X = -offset;
      player.attkOffset_Y = -offset; 
   }

   // Up & Right
   if(player.up && player.right) {
      player.frameY = 0;
      player.attkOffset_X = offset;
      player.attkOffset_Y = -offset;
   }

   // Down & Left
   if(player.down && player.left) {
      player.frameY = 1;
      player.attkOffset_X = -offset;
      player.attkOffset_Y = offset;
   }

   // Down & Right
   if(player.down && player.right) {
      player.frameY = 1;
      player.attkOffset_X = offset;
      player.attkOffset_Y = offset;
   }

   
   // =============== Diag Speed ===============
   if(player.up && player.left
   ||player.up && player.right
   ||player.down && player.left
   ||player.down && player.right) {
      moveSpeed = Math.sqrt(moveSpeed);
   }
}


// =====================================================================
// Player Running
// =====================================================================
const playerRunning = (player) => {
   if(player.energy < player.baseEnergy) player.energy += player.regenEnergy;
   if(player.energy >= player.baseEnergy) player.energy = player.baseEnergy;

   if(player.isRunning && player.isRunnable) {
      
      player.energy -= player.energyCost;
      if(player.energy <= 0) player.energy = 0;
      if(player.energy < player.energyCost) player.isRunnable = false;
   }

   if(!player.isRunning) player.isRunnable = true;
}


// =====================================================================
// Player Global Count Down
// =====================================================================
const playerGcD = (player, socketList, mobList) => {
   
   // Regen Mana
   if(player.mana < player.baseMana) player.mana += player.regenMana;
   
   // Regen GcD
   if(player.speedGcD < player.GcD) {
      player.speedGcD +=process.env.SYNC_COEFF* 1;
      if(player.isAttacking) player.isAttacking = false;
   }
   
   // GcD Up
   if(player.speedGcD >= player.GcD) {
      playerAttack(player, socketList, mobList);
      playerCast(player, socketList);
   }
}


// =====================================================================
// Player Attack
// =====================================================================
const playerAttack = (player, socketList, mobList) => {

   // Player Attack
   if(player.isAttacking && !player.attack_isAnimable) {

      player.frameX = 0;
      player.speedGcD = 0;
      player.isAttacking = false;
      player.attack_isAnimable = true;

      setTimeout(() => player.attack_isAnimable = false,
         animTimeOut(anim.attack.index, anim.attack.spritesNumber)
      );

      damagingOtherPlayers(player, socketList);
      damagingMobs(player, socketList, mobList);
   }
}


// =====================================================================
// Player Cast
// =====================================================================
const playerCast = (player, socketList) => {
   
   if(player.isCasting) {
      player.isCasting = false;

      playerHealing(player, socketList);
   }
}


// =====================================================================
// Player Healing
// =====================================================================
const playerHealing = (player, socketList) => {

   if(player.cast_Heal
   && player.mana >= player.healCost
   && player.health < player.baseHealth) {

      player.frameX = 0;
      player.speedGcD = 0;
      player.cast_Heal = false;
      player.heal_isAnimable = true;
      
      setTimeout(() => player.heal_isAnimable = false,
         animTimeOut(anim.heal.index, anim.heal.spritesNumber)
      );

      player.calcHealing = player.healRnG();
      player.health += player.calcHealing;
      player.mana -= player.healCost;

      if(player.health > player.baseHealth) player.health = player.baseHealth;
      let socket = socketList[player.id];

      socket.emit("getHeal", {
         id: player.id,
         x: player.x,
         y: player.y,
         calcHealing: player.calcHealing,
      });
   }
}


// =====================================================================
// Damaging Other Players
// =====================================================================
const PvPfameCost = 500;

const damagingOtherPlayers = (player, socketList) => {

   for(let i in playerList) {

      let otherPlayer = playerList[i];
      let socket = socketList[player.id];
      let otherSocket = socketList[otherPlayer.id];

      if(collision.circle_toCircle_withOffset(
      player,
      player.attkOffset_X,
      player.attkOffset_Y,
      player.attkRadius,
      otherPlayer)) {

         if(player !== otherPlayer
         && !otherPlayer.isDead) {
            
            otherPlayer.calcDamage = player.damageRnG();
            otherPlayer.health -= otherPlayer.calcDamage;
            
            // Other player's Death
            if(otherPlayer.health <= 0) {
               
               player.kills++;
               playerDeath(otherPlayer, PvPfameCost);
               playerFame(player, PvPfameCost, socket);
               
               // Player Score
               socket.emit("playerScore", {
                  kills: player.kills,
                  died: player.died,
                  fame: player.fame,
                  fameCount: player.fameCount,
               });
   
               socket.emit("getFame", player, PvPfameCost);
               otherSocket.emit("looseFame", otherPlayer, PvPfameCost);
            }
   
            const otherPlayerData = {
               id: otherPlayer.id,
               x: otherPlayer.x,
               y: otherPlayer.y,
               calcDamage: otherPlayer.calcDamage,
            };
            
            socket.emit("giveDamage", otherPlayerData);
            otherSocket.emit("getDamage", otherPlayerData);
         }
      }
   }
}


// =====================================================================
// Damaging Mobs
// =====================================================================
const PvEfameCost = 100;

const damagingMobs = (player, socketList, mobList) => {

   for(let i in mobList) {
      let mob = mobList[i];

      if(!mob.isDead
      && collision.circle_toCircle(player, mob)) {
         
         mob.calcDamage = player.damageRnG();
         mob.health -= mob.calcDamage;

         let socket = socketList[player.id];
         
         // Mob's Death
         if(mob.health <= 0) {
            
            mob.death();
            playerFame(player, PvEfameCost, socket);

            socket.emit("playerScore", {
               kills: player.kills,
               died: player.died,
               fame: player.fame,
               fameCount: player.fameCount,
            });
            
            socket.emit("getFame", player, PvEfameCost);
         }
         
         const mobData = {
            x: mob.x,
            y: mob.y,
            calcDamage: mob.calcDamage,
         };
         
         socket.emit("giveDamage", mobData);
      }
   }
}


// =====================================================================
// Player Fame
// =====================================================================
const playerFame = (player, fameCost, socket) => {

   player.fame += fameCost;
   player.fameValue += fameCost;

   if(player.fame / player.baseFame >= 1) {
      player.fameCount += Math.floor(player.fameValue / player.baseFame);
      player.fameValue = player.fame - (player.baseFame * player.fameCount);

      socket.emit("fameCount+1", player.fameCount);
   }
}


// =====================================================================
// Player Death
// =====================================================================
const playerDeath = (player, fameCost) => {

   player.health = 0;
   player.isDead = true;
   player.died++;

   player.deathCounts++;
   if(player.deathCounts === 10) player.deathCounts = 0;

   player.fame -= fameCost;
   if(player.fame <= 0) player.fame = 0;
   
   player.fameValue -= fameCost;
   if(player.fameValue <= 0) player.fameValue = 0;
   
   const respawnCooldown = setInterval(() => {
      player.respawnTimer --;
      
      if(player.respawnTimer <= 0) {

         player.isDead = false;
         player.isRespawning = true;

         // Reset Player Bars
         player.health = player.baseHealth;
         player.mana = player.baseMana;
         player.energy = player.baseEnergy;
         player.speedGcD = player.GcD;

         // Reset Respawn Timer
         player.respawnTimer = player.baseRespawnTimer;
         player.color = "darkviolet"; // <== Debug Mode

         // ================  Temporary  ================
         player.x = Math.floor(Math.random() * 2050) +50; // <== Randomize position on respawn
         player.y = Math.floor(Math.random() * 1550);
         // ================  Temporary  ================

         clearInterval(respawnCooldown);
      }
   }, 1000);
}


// =====================================================================
// Handle Player State
// =====================================================================
const anim = {
   idle: {
      index: 2,
      spritesNumber: 29,
   },

   walk: {
      index: 1,
      spritesNumber: 29,
   },

   run: {
      index: 1,
      spritesNumber: 14,
   },

   attack: {
      index: 1,
      spritesNumber: 14,
   },

   heal: {
      index: 2,
      spritesNumber: 14,
   },

   died: {
      index: 3,
      spritesNumber: 29,
   },
}

const animTimeOut = (index, spritesNumber) => {
   return process.env.FRAME_RATE * process.env.SYNC_COEFF * index * spritesNumber / 4;
}

const handlePlayerState = (frame, player) => {
   
   // Attack State
   if(player.attack_isAnimable) {
      player.animation(frame, anim.attack.index, anim.attack.spritesNumber);
      return player.state = "attack";
   }

   // Heal State
   if(player.heal_isAnimable) {
      player.animation(frame, anim.heal.index, anim.heal.spritesNumber);
      return player.state = "heal";
   }
   
   // Moving State
   if(player.up || player.down || player.left || player.right) {

      if(player.up && player.down || player.left && player.right) {
         player.animation(frame, anim.idle.index, anim.idle.spritesNumber);
         return player.state = "idle";
      }

      // Run State
      else if(player.isRunning && player.isRunnable) {
         player.animation(frame, anim.run.index, anim.run.spritesNumber);
         return player.state = "run";
      }

      // Walk State
      else {
         player.animation(frame, anim.walk.index, anim.walk.spritesNumber);
         return player.state = "walk";
      }
   }

   // Idle State
   else {
      player.animation(frame, anim.idle.index, anim.idle.spritesNumber);
      return player.state = "idle";
   }
}


// =====================================================================
// Player Update (Every frame)
// =====================================================================
let playerList;

exports.playerUpdate = (frame, socketList, globalPlayerList, mobList) => {
   
   playerList = globalPlayerList;
   let playerData = [];
   
   for(let i in playerList) {
      let player = playerList[i];
      
      if(!player.isDead) {
         playerGcD(player, socketList, mobList);
         playerMovements(player);
         playerRunning(player);
         handlePlayerState(frame, player);
      }

      else {
         player.animation(frame, anim.died.index, anim.died.spritesNumber);
         player.state = "died";
      }

      playerData.push(player);
   }
   
   return playerData;
}