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
          enabledCollections: ['ep', 'carbon', 'mdi'],
        }),
      ],
      dts: 'src/components.d.ts',
    }),
    Icons({
      autoInstall: true,
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
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus') || id.includes('@element-plus') || 
                id.includes('vue') || id.includes('pinia') || id.includes('@vueuse') ||
                id.includes('vue-router')) {
              return 'vue-vendor'
            }
            if (id.includes('axios') || id.includes('dayjs')) {
              return 'utils'
            }
            if (id.includes('@iconify') || id.includes('unplugin-icons')) {
              return 'icons'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
