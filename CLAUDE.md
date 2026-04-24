# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Vue 3 personal blog with admin management backend. Frontend at port 5175, proxies API requests to backend at localhost:9090.

## Commands

```bash
npm run dev      # Start dev server at port 5175
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Lint with ESLint + auto-fix
```

## Tech Stack

- **Framework**: Vue 3 (Composition API) + TypeScript
- **Build**: Vite 4
- **State**: Pinia with `pinia-plugin-persistedstate` (persists to localStorage)
- **Router**: Vue Router 4 with route-based code splitting
- **UI**: Element Plus + UnoCSS (utility-first CSS) + SCSS for component styles
- **HTTP**: Axios with interceptors for auth, loading states, error handling
- **Editor**: WangEditor for admin article editing, md-editor-v3 for markdown
- **Icons**: @iconify/json with ep/carbon/mdi collections

## Architecture

### Directory Structure

```
src/
├── api/           # API modules (request.ts wraps axios, others call specific endpoints)
├── components/    # Global components (auto-imported via unplugin-vue-components)
├── composables/   # Reusable composition functions
├── data/         # Static data (projects.ts)
├── layouts/      # FrontLayout.vue (public) and AdminLayout.vue (protected)
├── router/       # Route definitions with auth guards
├── stores/       # Pinia stores (blog, user, pageConfig, loading)
├── styles/       # Global SCSS (variables.scss, index.scss)
├── types/        # TypeScript interfaces
├── utils/        # Utility functions (markdown.ts)
└── views/        # Page components (Home, Articles, ArticleDetail, admin/*)
```

### Routing

- `/` → FrontLayout: Home, Articles, ArticleDetail, CategoryArticles, About, Projects, ProjectDetail
- `/admin` → AdminLayout: Dashboard, ArticleList, ArticleEditor, CategoryList, TagList, Settings, PageConfigEditor (requires auth)
- `/login` → Login page

### API Layer (`src/api/request.ts`)

- Axios instance with baseURL from `VITE_API_BASE_URL` env var
- Request interceptor: attaches Bearer token, shows global loading
- Response interceptor: handles 401 (token expiry), 403 (permission denied), other errors
- Whitelist for public endpoints (login, articles, categories, tags, stats)
- Exports `request.get/post/put/delete/upload` methods

### State Management

- `useUserStore`: Auth state (token persisted), login/logout/fetchUserInfo
- `useBlogStore`: Article/category/tag data caching
- `usePageConfigStore`: Dynamic page configuration
- `useLoadingStore`: Global loading overlay control

### Auto-Imports

Configured via `unplugin-auto-import` and `unplugin-vue-components`:
- Vue, vue-router, pinia, @vueuse/core APIs auto-imported
- Element Plus components auto-imported
- Iconify icons available as `<IconEpName />` syntax
- Generated type definitions in `src/auto-imports.d.ts` and `src/components.d.ts`

### Development Proxy

Vite proxies these paths to `http://localhost:9090`:
- `/api` → general API
- `/system` → user/system APIs
- `/logout`, `/getInfo`, `/getRouters`, `/profile`, `/captchaImage`

### Styling

- UnoCSS short cuts and theme in `uno.config.ts` (primary: #667eea, secondary: #764ba2)
- SCSS variables in `src/styles/variables.scss`
- Global styles in `src/styles/index.scss`

## Environment Variables

```env
VITE_API_BASE_URL=    # API base URL (defaults to relative path)
```

## Key Patterns

1. **Component auto-import**: Components in `src/components/` are auto-imported without explicit import
2. **API error handling**: request.ts handles 401/403 centrally; components don't need to handle token expiry
3. **Admin route guard**: `meta.requiresAuth` checked in router.beforeEach
4. **Page config system**: Dynamic page elements stored in backend, fetched via `pageConfigApi`

## UI/UX Design Skills

This project has integrated a comprehensive UI/UX design skill set under `.claude/skills/`:

### Available Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **UI/UX Pro Max** | `/ui-ux-pro-max` | Design intelligence with 50+ styles, 161 color palettes, 57 font pairings, searchable databases |
| **Design** | `/ckm:design` | Brand identity, logo design, CIP mockups, presentations, banners, icons |
| **Design System** | `/ckm:design-system` | Token architecture (primitive→semantic→component), component specs |
| **UI Styling** | `/ckm:ui-styling` | shadcn/ui + Tailwind CSS styling, canvas design |

### UI/UX Pro Max Quick Search

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
```

**Domains:** `product`, `style`, `typography`, `color`, `landing`, `chart`, `ux`, `google-fonts`, `web`

**Example:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "blog minimal" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system
```

### When to Use UI/UX Skills

- Designing new pages or refactoring UI components
- Choosing color schemes, typography, or layout systems
- Reviewing UI code for UX/accessibility issues
- Implementing animations or responsive behavior
