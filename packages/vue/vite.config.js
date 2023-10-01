/** @format */

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  server: {
    proxy: {
      "/fastify": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fastify/, "")
      }
    }
  },
  plugins: [vue()]
})
