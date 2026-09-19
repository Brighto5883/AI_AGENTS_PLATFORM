import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");
  const backend = env.VITE_BACKEND_URL || 'http://0.0.0.0:8000 ' || "https://aiagentsplatform-production.up.railway.app" ;

  return {
    plugins: [react()],

    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },

    server: {
      proxy: {
        "/api": {
          target: backend,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
