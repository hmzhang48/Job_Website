import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
export default defineConfig( {
  build: {
    target: "esnext",
    outDir: "../fastify/client",
  },
  server: {
    proxy: {
      "/": {
        target: "http://localhost:3000",
        changeOrigin: true,
      }
    }
  },
  plugins: [ vue() ]
} )
