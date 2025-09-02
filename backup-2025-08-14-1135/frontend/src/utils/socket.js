// src/utils/socket.js
import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_API_URL.replace(/\/+$/,""); // e.g. https://api.example.com

// initialize once, reuse everywhere
const socket = io(BACKEND, {
  path: "/socket.io",        // matches your server’s socket path
  transports: ["websocket"], // optional, but often more stable
  autoConnect: true,         // start connection immediately
});

export default socket;
