import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: true,
        port: 5173,
    },
    // server: {
    //     host: "192.168.31.115", // Replace with your local IP
    //     port: 5173,
    //     https: {
    //         key: fs.readFileSync("./192.168.31.115-key.pem"),
    //         cert: fs.readFileSync("./192.168.31.115.pem"),
    //     },
    // },
});
