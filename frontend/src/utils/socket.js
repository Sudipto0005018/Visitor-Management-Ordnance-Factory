import { io } from "socket.io-client";
import baseURL from "./baseURL";

const socket = io(baseURL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
});

export default socket;
