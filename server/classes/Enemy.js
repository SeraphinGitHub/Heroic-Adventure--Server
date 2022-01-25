
"use strict"

// Enemy Obj ==> Exemple
// {
//    health: 100,
//    radius: 50,
//    wanderBreakTime: 1500,
//    wanderRange: 200,
//    chasingRange: 400,
//    GcD: 50,
//    hiddenTime: 3000,
//    respawnTime: 10000,
//    damages: 15,
//    damageRatio: 0.5,
//    walkSpeed: 2,
//    runSpeed: 6,
// }

class Enemy {
   constructor(spawnX, spawnY, enemySpecs) {

      this.x = spawnX;
      this.y = spawnY;
      this.spawnX = spawnX;
      this.spawnY = spawnY;
      this.radius = enemySpecs.radius;

      // State Machine
      this.calcX = spawnX;
      this.calcY = spawnY;
      this.wanderBreakTime = enemySpecs.wanderBreakTime;
      this.wanderRange = enemySpecs.wanderRange;
      this.chasingRange = enemySpecs.chasingRange

      // Enemy Health
      this.baseHealth = enemySpecs.health;
      this.health = this.baseHealth;

      // Respawn Time
      this.hiddenTime = enemySpecs.hiddenTime;
      this.respawnTime = enemySpecs.respawnTime;

      // Enemy GcD
      this.baseGcD = enemySpecs.GcD;
      this.GcD = process.env.SYNC_COEFF* this.baseGcD;
      this.speedGcD = this.GcD;

      // Damages
      this.baseDamage = enemySpecs.damages;
      this.calcDamage;
      this.damageRatio = enemySpecs.damageRatio;

      // Movements Speed
      this.walkSpeed = Math.round(process.env.SYNC_COEFF* enemySpecs.walkSpeed) /2; // <== WalkSpeed
      this.runSpeed = Math.round(process.env.SYNC_COEFF* enemySpecs.runSpeed) /2; // <== RunSpeed

      // States
      this.isDead = false;
      this.isHidden = false;
      this.isAttacking = false;
      this.isCalcPos = false;
      this.isReCalc = false;

      // Anim States
      this.attack_isAnimable = false;

      // Animation
      this.state;
      this.frameX = 0;
      this.frameY = 1;
   }

   RnG(baseSpec, coeff) {
      return Math.floor(baseSpec) + Math.floor(Math.random() * (baseSpec * coeff));
   }

   damageRnG() {
      return this.RnG(this.baseDamage, this.damageRatio); // More high => Higher RnG Range => More damage (0 ~ 1)
   }

   wandering() {
      
      // Calculate random position (Run once)
      if(!this.isCalcPos) {
         this.isCalcPos = true;
         
         let RnG_Distance = this.RnG(1, this.wanderRange);
         let RnG_Degrees = this.RnG(1, 360);
         let RnG_Radians = RnG_Degrees * Math.PI / 180;
         
         this.calcX = this.spawnX + (RnG_Distance * Math.cos(RnG_Radians));
         this.calcY = this.spawnY + (RnG_Distance * Math.sin(RnG_Radians));
      }


      // Reach calculated position (Every Frame)
      if(this.calcX > this.x) {
         this.x += this.walkSpeed;
         if(this.x + this.walkSpeed > this.calcX) this.x = this.calcX;
      }

      if(this.calcX < this.x) {
         this.x -= this.walkSpeed;
         if(this.x - this.walkSpeed < this.calcX) this.x = this.calcX;
      }

      if(this.calcY > this.y) {
         this.y += this.walkSpeed;
         if(this.y + this.walkSpeed > this.calcY) this.y = this.calcY;
      }

      if(this.calcY < this.y) {
         this.y -= this.walkSpeed;
         if(this.y - this.walkSpeed < this.calcY) this.y = this.calcY;
      }


      // Stop && Renewal calculation (Run once)
      if(this.calcX === this.x && this.calcY === this.y && !this.isReCalc) {
         this.isReCalc = true;

         setTimeout(() => {
            this.isReCalc = false;
            this.isCalcPos = false
         }, this.wanderBreakTime);
      }
   }

   death() {
      this.health = 0;
      this.isDead = true;
      this.x = this.spawnX;
      this.y = this.spawnY;

      setTimeout(() => {
         this.isHidden = true
         
         setTimeout(() => {
            this.isDead = false;
            this.isHidden = false;
            this.health = this.baseHealth;
   
         }, this.respawnTime);
      }, this.hiddenTime);
      
      console.log("Mob is Dead !");
   }

   animation(frame, index, spritesNumber) {
      if(frame % index === 0) {       
         if(this.frameX < spritesNumber) this.frameX++;
         else this.frameX = 0;
      }
   }
}

module.exports = Enemy;