import { createApp } from 'vue'
import { MessageUcoLabPlugin } from 'minifront-mensajes/vue'
import App from './App.vue'
import router from './router.js'
import { mensajesConfig } from './messageucolab.js'
import './assets/app.css'

createApp(App).use(router).use(MessageUcoLabPlugin, mensajesConfig).mount('#app')
