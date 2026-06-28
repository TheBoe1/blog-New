<template>
  <div class="columns">
    <SidebarLeft />
    <main class="column column-main">
      <slot />
    </main>
    <SidebarRight :show-default-widgets="showSidebarWidgets">
      <template v-if="$slots.top" #top>
        <slot name="top" />
      </template>
    </SidebarRight>
  </div>
</template>

<script setup lang="ts">
import SidebarLeft from './SidebarLeft.vue'
import SidebarRight from './SidebarRight.vue'

withDefaults(defineProps<{ showSidebarWidgets?: boolean }>(), { showSidebarWidgets: true })
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
    grid-template-columns: 1fr 6fr;
  }
  .column-main { order: 2; }
  .column-left { order: 1; }
  :deep(.column-right) { display: none; }
}

@media (min-width: 1216px) {
  .columns {
    grid-template-columns: 1fr 5fr 1.5fr;
  }
  :deep(.column-right) { display: block; }
}

@media (max-width: 768px) {
  .columns {
    gap: var(--space-4);
  }
}
</style>
