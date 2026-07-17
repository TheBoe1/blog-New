<template>
  <div class="columns">
    <SidebarLeft v-if="showSidebars" />
    <main class="column column-main">
      <slot />
    </main>
    <SidebarRight v-if="showSidebars" :show-default-widgets="showSidebarWidgets">
      <template v-if="$slots.top" #top>
        <slot name="top" />
      </template>
    </SidebarRight>
  </div>
</template>

<script setup lang="ts">
import SidebarLeft from './SidebarLeft.vue'
import SidebarRight from './SidebarRight.vue'
import { useMediaQuery } from '@vueuse/core'

withDefaults(defineProps<{ showSidebarWidgets?: boolean }>(), { showSidebarWidgets: true })
const showSidebars = useMediaQuery('(min-width: 769px)')
</script>

<style scoped lang="scss">
.columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

.column-main { order: 2; }
.column-left { order: 1; }
.column-right { order: 3; }

@media (min-width: 769px) {
  .columns {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  .column-main { order: 2; }
  .column-left { order: 1; }
  :deep(.column-right) { display: none; }
}

@media (min-width: 1280px) {
  .columns {
    grid-template-columns: 220px minmax(0, 1fr) 240px;
  }
  :deep(.column-right) { display: block; }
}

@media (max-width: 768px) {
  .columns {
    gap: var(--space-4);
  }
}
</style>
