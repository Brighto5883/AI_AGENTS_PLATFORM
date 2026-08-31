import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],

  server: {
        allowedHosts: [
              "squatter-finite-dean.ngrok-free.dev",
        ],
        
    
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },

            "/webhooks": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
});
