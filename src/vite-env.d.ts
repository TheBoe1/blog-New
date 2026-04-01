/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 1. 解决 main.ts 中 zh-cn.mjs 标红的问题
declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const content: any
  export default content
}

declare module 'virtual:uno.css' {
  const css: string
  export default css
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_UPLOAD_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}