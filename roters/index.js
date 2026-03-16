import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { 
    path: '/learning', 
    name: 'Learning', 
    component: () => import('../views/Learning.vue'),
    children: [
      { path: ':id', name: 'LearningDetail', component: () => import('../views/LearningDetail.vue') }
    ]
  },
  { 
    path: '/projects', 
    name: 'Projects', 
    component: () => import('../views/Projects.vue'),
    children: [
      { path: ':id', name: 'ProjectDetail', component: () => import('../views/ProjectDetail.vue') }
    ]
  },
  { path: '/questions', name: 'Questions', component: () => import('../views/Questions.vue') },
  { path: '/about', name: 'About', component: () => import('../views/About.vue') }
];

export const router = createRouter({
  history: createWebHistory('/index/'),
  routes
});