import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './assets/app.css'

// Los textos de la pantalla los resuelve el backend de Inventario (src/composables/useMensajes.js).
createApp(App).use(router).mount('#app')
