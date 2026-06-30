import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Check auth on startup
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore(pinia)
authStore.checkAuth().finally(() => {
  app.mount('#app')
})
