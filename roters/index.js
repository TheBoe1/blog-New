import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/article/:big/:tech/:theme/:slug', name: 'Article', component: () => import('../views/LearningDetail.vue') },
  { path: '/article/detail/:id', name: 'ArticleById', component: () => import('../views/LearningDetail.vue') },
  { 
    path: '/learning', 
    name: 'Learning', 
    component: () => import('../views/Learning.vue'),
    children: [
      { path: 'detail/:id', name: 'LearningArticleById', component: () => import('../views/LearningDetail.vue') },
      { path: ':big/:tech/:theme/:slug', name: 'LearningArticle', component: () => import('../views/LearningDetail.vue') },
      { path: ':big/:tech/:theme', name: 'LearningTheme', component: () => import('../views/Learning.vue') },
      { path: ':big/:tech', name: 'LearningTech', component: () => import('../views/Learning.vue') },
      { path: ':big', name: 'LearningBig', component: () => import('../views/Learning.vue') }
    ]
  },
  // 详情已作为子路由呈现在 Learning 内部
  { 
    path: '/projects', 
    name: 'Projects', 
    component: () => import('../views/Projects.vue'),
    children: [
      { path: ':id', name: 'ProjectDetail', component: () => import('../views/ProjectDetail.vue') }
    ]
  },
  { path: '/deploy', name: 'Deploy', component: () => import('../views/Deploy.vue') },
  { path: '/git', name: 'Git', component: () => import('../views/Git.vue') },
  { path: '/questions', name: 'Questions', component: () => import('../views/Questions.vue') },
  { path: '/about', name: 'About', component: () => import('../views/About.vue') }
];

export const router = createRouter({
  history: createWebHistory('/carbon/'),
  routes
});
