import { createApp } from 'vue';
import { router } from './roters/index.js';
import AppRoot from './views/AppRoot.vue';

const app = createApp(AppRoot);

app.use(router);
app.mount('#app');