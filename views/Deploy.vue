<template>
  <div class="page-deploy">
    <div class="content-wrapper">
      <h2 class="page-title">系统部署</h2>

      <section class="section-card">
        <h3 class="section-title">前端部署（当前项目）</h3>
        <div class="block">
          <div class="k">构建</div>
          <pre class="code">npm run build</pre>
        </div>
        <div class="block">
          <div class="k">访问路径</div>
          <div class="v">当前路由基座为 /index/，部署时建议将 dist 放到 /index/ 目录</div>
        </div>
      </section>

      <section class="section-card">
        <h3 class="section-title">后端联动（可选）</h3>
        <div class="block">
          <div class="k">接口前缀</div>
          <div class="v">博客页面目前不强依赖后端接口；如需对接，可通过 Nginx 将 /prod-api 转发到后端。</div>
        </div>
        <div class="block">
          <div class="k">说明</div>
          <div class="v">如果你后端开启了鉴权，需要在同域或正确配置 CORS。</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  document.title = '系统部署';
});

onUnmounted(() => {
  document.title = '文章分类';
});
</script>

<style scoped>
.page-deploy {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  color: #111827;
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 18px 0;
}

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 14px 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: #111827;
}

.block {
  margin-top: 12px;
}

.k {
  font-size: 0.9rem;
  font-weight: 800;
  color: #374151;
  margin-bottom: 8px;
}

.v {
  color: #6b7280;
  line-height: 1.6;
}

.code {
  margin: 0;
  padding: 12px 14px;
  background: #0b1220;
  color: #e5e7eb;
  border-radius: 10px;
  overflow: auto;
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>

