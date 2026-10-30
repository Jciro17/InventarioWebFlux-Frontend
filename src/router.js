import { createRouter, createWebHistory } from 'vue-router'
import InventarioView from './views/InventarioView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'inventario', component: InventarioView }
  ]
})
