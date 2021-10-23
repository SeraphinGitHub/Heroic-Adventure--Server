
"use strict"

// =====================================================================
// Initiallize client scripts
// =====================================================================
const scripts = [
   "client_GameHandler.js",
   "client_Classes.js",
   "client_PlayerHandler.js",
];

const instantiate = (scriptName) => {
   const newScript = document.createElement("script");
   newScript.type = "text/javascript";
   newScript.src = `/client/javascript/${scriptName}`;
   document.body.appendChild(newScript);
}

window.onload = () => {
   scripts.forEach(item => instantiate(item));
}