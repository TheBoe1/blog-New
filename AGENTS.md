# AGENTS.md - Coding Agent Instructions

## Project Overview

Personal blog application built with Vue 3 + TypeScript + Vite. Uses Element Plus for UI, Pinia for state management, UnoCSS for styling, and communicates with a Go backend at `localhost:9090` via Axios.

## Build / Dev / Lint Commands

```bash
npm run dev        # Start dev server on port 5175
npm run build      # Type-check with vue-tsc, then build with Vite
npm run preview    # Preview production build
npm run lint       # ESLint auto-fix for .vue,.js,.ts files
```

- **No test framework is configured.** There are no test scripts or test files in this project.
- **Type-check only:** `npx vue-tsc --noEmit`
- **Build includes type-checking:** `npm run build` runs `vue-tsc && vite build`

## Project Structure

```
src/
  api/           # Axios API modules (article.ts, auth.ts, stats.ts, request.ts)
  stores/        # Pinia stores (user.ts, blog.ts)
  types/         # TypeScript interfaces (index.ts)
  views/         # Page components
    admin/       # Admin panel views
  layouts/       # FrontLayout.vue, AdminLayout.vue
  router/        # Vue Router config (index.ts)
  styles/        # Global SCSS (variables.scss, index.scss)
  components.d.ts # Auto-generated component declarations
  auto-imports.d.ts
```

Path alias: `@` maps to `src/` (configured in vite.config.ts and tsconfig.json).

## Code Style Guidelines

### Vue Components

- Use `<script setup lang="ts">` (Composition API). Never use Options API.
- Single File Components: `<template>` → `<script setup>` → `<style scoped lang="scss">` order.
- Import `ref`, `computed`, `onMounted` from `vue`. These are auto-imported by `unplugin-auto-import` but explicit imports are preferred for clarity in stores and complex components.

### TypeScript

- `strict: true` is enabled in tsconfig. Always type your variables and function returns.
- Define shared types in `src/types/index.ts`. Export interfaces, not types (use `interface` for objects).
- Use `type` keyword for imports: `import type { Article } from '@/types'`.
- Generic API response: `ApiResponse<T>`, `PaginatedResponse<T>`.

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ArticleDetail.vue` |
| Stores | camelCase with `use` prefix | `useUserStore`, `useBlogStore` |
| API modules | camelCase object exports | `articleApi.getList()`, `categoryApi.create()` |
| Type files | `index.ts` in `types/` dir | `src/types/index.ts` |
| Route names | PascalCase | `'ArticleDetail'`, `'AdminArticles'` |
| CSS classes | kebab-case | `article-card`, `hero-section` |

### Imports Order

1. Vue / Vue ecosystem (`vue`, `vue-router`, `pinia`)
2. Third-party libraries (`element-plus`, `axios`, `dayjs`)
3. Internal modules using `@/` alias
4. Relative imports (`./`)
5. Type-only imports last or mixed with source (both patterns exist)

### Styling

- **UnoCSS** for utility classes. Use shortcuts defined in `uno.config.ts`: `flex-center`, `flex-between`, `card-base`, `btn-primary`, `input-base`.
- **SCSS** with `scoped` for component-specific styles. Use `:deep()` to penetrate Element Plus component styles.
- Primary color: `#667eea`, Secondary: `#764ba2`.
- Use Element Plus components (`el-button`, `el-card`, `el-tag`, etc.) for UI consistency.

### State Management

- Pinia stores use Composition API style (`defineStore` with setup function).
- Persist user store with `pinia-plugin-persistedstate` (configured in main.ts).
- Stores expose reactive refs, computed properties, and async action functions.

### API / HTTP

- All API calls go through the wrapper in `src/api/request.ts`.
- Use `request.get/post/put/delete/upload<T>()` with explicit return types.
- Backend API convention: `{ code: 0 | 200, data?: T, rows?: T[], total?: number, msg?: string }`.
- Auth token stored in user store, auto-attached via Axios interceptor.

### Error Handling

- API errors are caught by Axios response interceptor and shown via `ElMessage.error()`.
- 401 responses trigger automatic logout and redirect to `/login`.
- Components use try/catch for async operations with `ElMessage` for user feedback.

### Environment Variables

- `.env` file (gitignored) with `VITE_API_BASE_URL` for backend URL.
- Dev proxy: `/api` → `http://localhost:9090` (configured in vite.config.ts).

## Key Libraries

- **Vue 3.3** + **TypeScript 5.2** + **Vite 4.5**
- **Element Plus 2.4** (full import, Chinese locale)
- **Pinia 2.1** with persistedstate plugin
- **Vue Router 4.2** (history mode)
- **UnoCSS 0.57** (attributify, icons, typography presets)
- **Axios 1.6** for HTTP
- **WangEditor 5.1** for rich text editing
- **highlight.js** for code highlighting
- **dayjs** for date formatting
