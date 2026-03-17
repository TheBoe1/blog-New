<template>
  <div class="page-home">
    <div class="home-content">
      <section class="section-card hero">
        <h2 class="title">怜言语记</h2>
        <p class="subtitle">技术成长与沉淀的个人知识库</p>
        <div class="quick-actions">
          <router-link class="action primary" to="/learning">文章列表</router-link>
          <router-link class="action" to="/projects">专题看板</router-link>
          <router-link class="action" to="/questions">常见问题</router-link>
          <router-link class="action" to="/about">关于系统</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page-home {
  min-height: 100%;
}

.home-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
}

.hero .title {
  margin: 0 0 8px 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #333;
}

.hero .subtitle {
  margin: 0 0 18px 0;
  color: #71777c;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #f1f1f1;
  background: #fff;
  color: #333;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.action:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 195, 255, 0.5);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.action.primary {
  background: rgba(0, 195, 255, 0.1);
  border-color: rgba(0, 195, 255, 0.35);
  color: #00a7d6;
  font-weight: 700;
}
</style>
