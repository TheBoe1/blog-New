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
        manualChunks: {
          'framework': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
})
