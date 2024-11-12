import { createApp } from 'vue'
import type { Component } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.scss'
import { userRoute } from './routes/userRoute.ts'
const pinia = createPinia()
const app = createApp( App as Component )
const router = createRouter( {
  history: createWebHistory(),
  routes: userRoute,
} )
app.use( pinia )
app.use( router )
app.mount( '#app' )
