import { createApp } from 'vue'
import pinia from './stores'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'

import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-loading.css'

import App from './App.vue'
import router from './router'
import { vScrollAnimate } from './directives/scrollAnimate'
import { vLazyImg } from './directives/lazyImg'
import './styles/index.scss'

import pace from 'pace-js'
pace.start({ restartOnRequestAfter: false, ajax: { trackMethods: ['GET', 'POST'] } })

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.directive('scroll-animate', vScrollAnimate)
app.directive('lazy-img', vLazyImg)

app.use(pinia)
app.use(router)

app.mount('#app')
