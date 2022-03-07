
"use strict"


// =========================  Development  =========================
// CSS ==> logScreen l.12
// CSS ==> viewport l.154

const easyLogin = () => {
   
   setTimeout(() => {
      isSocket = true;
      const logScreen = document.querySelector(".log-screen");
      const navBarUI = document.querySelectorAll(".UI-navBar");
      
      // Send player's name
      const socket = io();
      socket.emit("send_initClient", "Séraphin");
      
      // Await for server response
      socket.on("received_initClient", (playerID) => {

         initPlayer(socket, playerID); // ==> Client_PlayerHandler.js
         initChat(socket);             // ==> Client_ChatHandler.js

         // Reset inputField's value
         logFormInput.value = ""
         logFormInput.blur();
         logScreen.classList.add("hide-LogScreen");

         navBarUI.forEach(nav => {
            nav.classList.add("visible");
            nav.classList.remove("toggle-nav-left");
            nav.classList.remove("toggle-nav-right");
         });
      });
   }, 300);
}

easyLogin();
// =========================  Development  =========================



// =====================================================================
// Init Client
// =====================================================================
const instantiate = (scriptName) => {
   const newScript = document.createElement("script");
   newScript.type = "text/javascript";
   newScript.src = `/client/javascript/${scriptName}`;
   document.body.insertAdjacentElement("beforeend", newScript);
}

// Instantiate client scripts
const initClientScripts = () => {

   const scripts = [
      
      // Classes
      "classes/ClientCharacter.js",
      "classes/ClientEnemy.js",
      "classes/ClientPlayer.js",
      "classes/FloatingText.js",
      "classes/Fluidity.js",
      "classes/GameBar.js",
      "classes/Tile.js",
      "classes/Viewport.js",
      
      // Scripts
      "client_PlayerHandler.js",
      "client_MapHandler.js",
      "client_ChatHandler.js",
      
      // Game Handler (Last)
      "client_GameHandler.js",
   ];

   scripts.forEach(script => {
      const initPromise = new Promise((resolve, reject) => resolve(script));
   
      initPromise
      .then((item) => instantiate(item))
      .catch(() => console.log(`${script} could not be loaded !`));
   });
}


// =====================================================================
// Load Client
// =====================================================================
const loadClient = () => {
   
   isSocket = true;
   const logScreen = document.querySelector(".log-screen");
   const navBarUI = document.querySelectorAll(".UI-navBar");
   
   // Send player's name
   const socket = io();
   socket.emit("send_initClient", logFormInput.value);
   
   // Await for server response
   socket.on("received_initClient", (playerID) => {

      initPlayer(socket, playerID); // ==> Client_PlayerHandler.js
      initChat(socket);             // ==> Client_ChatHandler.js

      setTimeout(() => {
         // Reset inputField's value
         logFormInput.value = ""
         logFormInput.blur();
         logScreen.classList.add("hide-LogScreen");
         
         navBarUI.forEach(nav => {
            nav.classList.add("visible");
            nav.classList.remove("toggle-nav-left");
            nav.classList.remove("toggle-nav-right");
         });
      }, 500);
   });
}


// =====================================================================
// Login System
// =====================================================================
const logFormInput = document.querySelector(".log-form input");
let isSocket = false;

// Login Form & Button
const loginForm = () => {

   const logBtn = document.querySelector(".log-btn");
   const logForm = document.querySelector(".log-form");
   
   logForm.addEventListener("submit", (event) => {
      event.preventDefault();
      formValidation();
   });
   
   logBtn.addEventListener("click", () => {
      formValidation();
   });
}

// Form Validation
const formValidation = () => {
   
   const emptyFieldAlert = document.querySelector(".empty-field");
   const invalidAlert = document.querySelector(".invalid-chars");
   const whiteSpaceAlert = document.querySelector(".white-space");
   const minCharsAlert = document.querySelector(".min-chars");
   const maxCharsAlert = document.querySelector(".max-chars");
   
   // if include: LETTER || letter || accent letters && No white space && minimum 4 characters 
   const playerNameRegEx = new RegExp(/^[A-Za-zÜ-ü]+$/);
   
   // if include: White Space
   const includeSpaceRegEx = new RegExp(" ");


   // if Empty Field
   if(logFormInput.value === "") alertMessage(emptyFieldAlert);

   // if player name is less than 4 characters
   else if(logFormInput.value.length < 4) alertMessage(minCharsAlert);

   // if player name is more than 10 characters
   else if(logFormInput.value.length > 12) alertMessage(maxCharsAlert);

   // if include white space
   else if(includeSpaceRegEx.test(logFormInput.value)) alertMessage(whiteSpaceAlert);

   // if include any special characters or number
   else if(!playerNameRegEx.test(logFormInput.value)) alertMessage(invalidAlert);

   // if everything's fine ==> Connect Player
   else if(!isSocket) loadClient();
}

// Pop Up Alert Messages
const alertMessage = (messageClass) => {
   const duration = 2500;
   messageClass.classList.add("visible");
   setTimeout(() => messageClass.classList.remove("visible"), duration);
}


// =====================================================================
// Window OnLoad
// =====================================================================
window.addEventListener("load", () => {
   
   initClientScripts();
   loginForm();
});