import { io } from "socket.io-client";
import { API_URL } from "../constants";
// import useAuthStore from "./store/authStore";

//https://ludo-serverside.onrender.com
//http://localhost:4002
const persisted = localStorage.getItem("auth-storage");
let token = null;
if (persisted) {
  try {
    const parsed = JSON.parse(persisted);
    token = parsed?.state?.token;
  } catch (e) {
    console.log(e);
  }
}
// console.log(token, "frgegre");
// Get token from localStorage

const socket = io(API_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  transports: ["websocket", "polling"],
  auth: {
    token: token, // Include token in socket connection
  },
});

// Add connection event listeners for debugging
socket.on("connect", () => {
  console.log("Socket connected with ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);

  // Check if it's an authentication error
  if (error.message && error.message.includes("Account deactivated")) {
    // Handle account deactivation
    const notification = document.createElement("div");
    notification.className =
      "fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 text-center font-semibold shadow-lg";
    notification.innerHTML = `
      <div class="flex items-center justify-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <span>Your account has been deactivated. Please contact support.</span>
      </div>
    `;
    document.body.appendChild(notification);

    // Clear auth storage and redirect
    setTimeout(() => {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }, 3000);
  }
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

// Reconnect lifecycle diagnostics and sync
socket.on("reconnect_attempt", (n) => console.log("reconnect_attempt", n));
socket.on("reconnect", (n) => {
  console.log("reconnect", n, "newId=", socket.id);
  try {
    const persistedRoom = localStorage.getItem("current-room-id");
    const persistedName = localStorage.getItem("current-username");
    if (persistedRoom && persistedName) {
      socket.emit("reconnect_to_room", {
        roomId: persistedRoom,
        playerName: persistedName,
      });
      socket.emit("sync_state", { roomId: persistedRoom });
    }
  } catch (e) {
    console.log("reconnect sync error", e);
  }
});
socket.on("reconnect_error", (e) => console.log("reconnect_error", e?.message));
socket.on("reconnect_failed", () => console.log("reconnect_failed"));

// {"state":{"user":{"id":"c47f68f3-9ab4-4c10-975a-e1f9831b8382","phone":"7","username":"ronaldo","password":"$2b$10$X9F2HidwwxpxZFOrGdEOKuIT8AhnA9Wupkkjf0r4XARXZW4lDK9qe","role":"PLAYER","isActive":true,"createdAt":"2025-06-17T17:13:11.080Z","updatedAt":"2025-06-17T17:13:11.080Z"},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM0N2Y2OGYzLTlhYjQtNGMxMC05NzVhLWUxZjk4MzFiODM4MiIsInJvbGUiOiJQTEFZRVIiLCJ1c2VybmFtZSI6InJvbmFsZG8iLCJpYXQiOjE3NTIwOTIyNzAsImV4cCI6MTc1MjM1MTQ3MH0.ny9FDhgbTCy3kOS8BClvJIyjfl3fRxFhTfiwU4Bs1Lo","loading":false,"error":null},"version":0}

export default socket;
