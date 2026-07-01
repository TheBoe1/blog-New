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
      'element-plus/es/components/aside',
      'element-plus/es/components/avatar',
      'element-plus/es/components/breadcrumb',
      'element-plus/es/components/breadcrumb-item',
      'element-plus/es/components/button',
      'element-plus/es/components/card',
      'element-plus/es/components/checkbox',
      'element-plus/es/components/col',
      'element-plus/es/components/color-picker',
      'element-plus/es/components/config-provider',
      'element-plus/es/components/container',
      'element-plus/es/components/date-picker',
      'element-plus/es/components/dialog',
      'element-plus/es/components/divider',
      'element-plus/es/components/dropdown',
      'element-plus/es/components/dropdown-item',
      'element-plus/es/components/dropdown-menu',
      'element-plus/es/components/empty',
      'element-plus/es/components/form',
      'element-plus/es/components/form-item',
      'element-plus/es/components/header',
      'element-plus/es/components/icon',
      'element-plus/es/components/input',
      'element-plus/es/components/input-number',
      'element-plus/es/components/main',
      'element-plus/es/components/menu',
      'element-plus/es/components/menu-item',
      'element-plus/es/components/option',
      'element-plus/es/components/pagination',
      'element-plus/es/components/popconfirm',
      'element-plus/es/components/progress',
      'element-plus/es/components/radio-button',
      'element-plus/es/components/radio-group',
      'element-plus/es/components/row',
      'element-plus/es/components/select',
      'element-plus/es/components/sub-menu',
      'element-plus/es/components/switch',
      'element-plus/es/components/tab-pane',
      'element-plus/es/components/table',
      'element-plus/es/components/table-column',
      'element-plus/es/components/tabs',
      'element-plus/es/components/tag',
      'element-plus/es/components/tooltip',
      'element-plus/es/components/upload',
      '@element-plus/icons-vue',
      'uc.micro',
      'entities',
      'markdown-it',
      'linkify-it',
    ],
    exclude: ['md-editor-v3'],
  },
  server: {
    port: 5175,
    host: true,
    historyApiFallback: true,
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
