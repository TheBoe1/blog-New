import { createApp } from 'vue'
import pinia from './stores'
import {
  ArrowDown, ArrowLeft, ArrowUp, Calendar, DataAnalysis, Delete, Document,
  Edit, EditPen, Folder, FolderOpened, InfoFilled, Link, Loading, Lock,
  Plus, PriceTag, Rank, Refresh, Setting, Share, Star, Upload, User,
} from '@element-plus/icons-vue'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'

import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-loading.css'
// Element Plus 暗色模式变量表：配合 <html>.dark 类名激活，覆盖 el-skeleton 等所有 EP 组件
import 'element-plus/theme-chalk/dark/css-vars.css'

import '@fortawesome/fontawesome-free/css/fontawesome.css'
import '@fortawesome/fontawesome-free/css/solid.css'
import '@fortawesome/fontawesome-free/css/regular.css'
import '@fontsource/ubuntu/400.css'
import '@fontsource/ubuntu/500.css'
import '@fontsource/ubuntu/700.css'
import '@fontsource/source-code-pro/400.css'
import '@fontsource/source-code-pro/600.css'

import App from './App.vue'
import router from './router'
import { vScrollAnimate } from './directives/scrollAnimate'
import { vLazyImg } from './directives/lazyImg'
import './styles/index.scss'

import pace from 'pace-js'
pace.start({ restartOnRequestAfter: false, ajax: { trackMethods: ['GET', 'POST'] } })

const app = createApp(App)

const icons = {
  ArrowDown, ArrowLeft, ArrowUp, Calendar, DataAnalysis, Delete, Document,
  Edit, EditPen, Folder, FolderOpened, InfoFilled, Link, Loading, Lock,
  Plus, PriceTag, Rank, Refresh, Setting, Share, Star, Upload, User,
}
for (const [name, component] of Object.entries(icons)) {
  app.component(name, component)
}

app.directive('scroll-animate', vScrollAnimate)
app.directive('lazy-img', vLazyImg)

app.use(pinia)
app.use(router)

app.mount('#app')
