import { createApp } from "vue"
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from "./App.vue"
import { userRoute } from "./routes/userRoute.ts"
const pinia = createPinia()
const app = createApp( App )
const router = createRouter( {
  history: createWebHistory(),
  routes: userRoute
} )
app.use( pinia )
app.use( router )
app.mount( "#app" )
