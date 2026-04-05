export interface Project {
  id: string
  name: string
  description: string
  cover: string
  tags: string[]
  stars: number
  updatedAt: string
  link?: string
  github?: string
  techStack: { name: string; description: string }[]
  features: string[]
  screenshots: string[]
}

export const projects: Project[] = [
  {
    id: '1',
    name: '个人博客系统',
    description: '基于 Vue 3 + TypeScript + Element Plus 构建的个人博客系统，支持文章管理、分类标签、评论系统等功能。采用现代化的前端技术栈，提供流畅的用户体验和便捷的后台管理功能。',
    cover: 'https://theboe.oss-cn-beijing.aliyuncs.com/image/%E4%B8%AA%E4%BA%BA%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2.png',
    tags: ['Vue 3', 'TypeScript', 'Element Plus', 'Pinia'],
    stars: 128,
    updatedAt: '2024-01-15',
    link: 'https://lianlab.top',
    github: 'https://github.com/TheBoe1/LianLab-content',
    techStack: [
      { name: 'Vue 3', description: '渐进式 JavaScript 框架' },
      { name: 'TypeScript', description: 'JavaScript 的超集' },
      { name: 'Element Plus', description: 'Vue 3 组件库' },
      { name: 'Pinia', description: 'Vue 状态管理' },
      { name: 'Vite', description: '下一代前端构建工具' },
      { name: 'wangEditor', description: '富文本编辑器' }
    ],
    features: [
      '文章的增删改查和富文本编辑',
      '分类和标签管理',
      '评论系统和审核功能',
      '文章搜索和归档',
      '响应式设计，支持移动端',
      '后台管理系统'
    ],
    screenshots: []
  },
  {
    id: '2',
    name: '可视化数据平台',
    description: '企业级数据可视化平台，支持多种图表类型和实时数据展示，提供拖拽式图表配置和数据源管理功能。',
    cover: 'https://oss.lianlab.top/image/%E5%8F%AF%E8%A7%86%E5%8C%96%E5%B0%81%E9%9D%A2.png',
    tags: ['Vue 3', 'ECharts', 'DataV'],
    stars: 256,
    updatedAt: '2024-01-10',
    link: 'https://lianlab.top/Visual/',
    techStack: [
      { name: 'Vue 3', description: '渐进式 JavaScript 框架' },
      { name: 'ECharts', description: '数据可视化图表库' },
      { name: 'DataV', description: '大屏数据可视化组件' },
      { name: 'Pinia', description: 'Vue 状态管理' }
    ],
    features: [
      '多种图表类型支持',
      '拖拽式图表配置',
      '实时数据展示',
      '数据源管理',
      '大屏自适应'
    ],
    screenshots: []
  },
  {
    id: '3',
    name: '双碳管理系统',
    description: '通用的双碳后台管理系统模板，集成权限管理、用户管理等功能模块，开箱即用。',
    cover: 'https://oss.lianlab.top/image/%E5%8F%8C%E7%A2%B3%E7%AE%A1%E7%90%86%E7%B3%BB%E7%BB%9F%E5%B0%81%E9%9D%A2.png',
    tags: ['Vue 3', 'Pinia', 'Axios'],
    stars: 89,
    updatedAt: '2024-01-05',
    link: 'https://lianlab.top/carbon/',
    techStack: [
      { name: 'Vue 3', description: '渐进式 JavaScript 框架' },
      { name: 'Pinia', description: 'Vue 状态管理' },
      { name: 'Axios', description: 'HTTP 请求库' },
      { name: 'Element Plus', description: 'Vue 3 组件库' }
    ],
    features: [
      '用户管理',
      '角色权限管理',
      '菜单管理',
      '日志管理',
      '系统监控'
    ],
    screenshots: []
  },
]

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id)
}
