import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? "https://oss.lianlab.top/main" : "/",
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('uni-')
        }
      }
    }),
    UnoCSS(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: 'Icon',
        }),
      ],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: 'Icon',
          enabledCollections: ['ep', 'carbon', 'mdi'],
        }),
      ],
      dts: 'src/components.d.ts',
    }),
    Icons({
      autoInstall: false,
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@vueuse/core',
      'axios',
      'dayjs',
      '@element-plus/icons-vue',
      'uc.micro',
      'entities',
      'markdown-it',
      'linkify-it',
    ],
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
        // 浏览器刷新/导航 GET /login（Accept: text/html）不转发后端登录接口（仅 POST），
        // 否则后端返回 500 "Request method 'GET' not supported"。交由 Vite 返回 SPA index.html。
        // POST /login、/login/2fa/verify、/login/2fa/backup（Accept: application/json）正常转发。
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      '/logout': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
      '/getInfo': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
      '/getRouters': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
      '/system': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
      '/profile': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
      '/captchaImage': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // echarts 按需引入后体积已小，但仍独立 chunk 便于缓存
            if (id.includes('echarts')) return 'vendor-echarts'
            // 编辑器只在懒加载路由使用。返回 undefined 交给 Rollup 跟随路由拆包，
            // 避免命名公共块被入口 modulepreload 提前下载。
            if (
              id.includes('@wangeditor') ||
              id.includes('md-editor-v3') ||
              id.includes('codemirror') ||
              id.includes('@codemirror') ||
              id.includes('@lezer/') ||
              id.includes('@replit') ||
              id.includes('crelt') ||
              id.includes('style-mod') ||
              id.includes('w3c-keyboard') ||
              id.includes('lucide-vue-next') ||
              id.includes('lucide') ||
              id.includes('medium-zoom') ||
              id.includes('@vavt')
            ) return undefined
            // Element Plus 独立 chunk，缓存友好
            if (id.includes('element-plus')) return 'vendor-element-plus'
            // Iconify 图标数据（纯 JSON，体积大，独立拆分利于缓存）
            if (id.includes('@iconify-json') || id.includes('@iconify/iconify')) return 'vendor-icons'
            // 框架核心
            if (id.includes('/vue/') || id.includes('pinia') || id.includes('@vueuse')) return 'framework'
            // 其他小依赖合入 vendor
            return 'vendor'
          }
        },
      },
    },
  },
})
