<template>
  <el-config-provider :locale="zhCn">
    <router-view />
    <GlobalLoading />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import GlobalLoading from '@/components/GlobalLoading.vue'

// Apply dark mode from localStorage if saved
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark')
}
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Inter', 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}
</style>
