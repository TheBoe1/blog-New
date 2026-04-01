import { createApp } from 'vue';
import { router } from './roters/index.js';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import AppRoot from './views/AppRoot.vue';

const app = createApp(AppRoot);

app.use(router);
app.use(Antd);
app.mount('#app');
