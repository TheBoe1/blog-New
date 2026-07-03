<template>
  <div class="dynamic-section" :style="sectionStyles">
    <component
      :is="getComponentName(element)"
      v-for="element in visibleElements"
      :key="element.elementKey"
      :style="getElementStyles(element)"
      v-bind="getElementAttributes(element)"
      :class="`dynamic-element element-${element.elementType}`"
    >
      <template v-if="element.elementType === 'image'">
        <img :src="element.content" :alt="element.elementKey" />
      </template>
      <template v-else-if="element.elementType === 'link'">
        <a :href="element.content" target="_blank" rel="noopener">{{ element.content }}</a>
      </template>
      <template v-else-if="element.elementType === 'list'">
        <ul>
          <li v-for="(item, index) in getListItems(element.content)" :key="index">
            {{ item }}
          </li>
        </ul>
      </template>
      <template v-else-if="element.elementType === 'html'">
        <div v-html="element.content"></div>
      </template>
      <template v-else>
        {{ element.content }}
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PageSectionConfig, PageElementConfig } from '@/types'

const props = defineProps<{
  section: PageSectionConfig
}>()

const visibleElements = computed(() => {
  return props.section.elements
    .filter(e => e.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

const sectionStyles = computed(() => {
  const styles: Record<string, string> = { ...props.section.styles }
  
  if (props.section.layout === 'grid') {
    styles.display = 'grid'
    styles.gridTemplateColumns = `repeat(${props.section.layoutConfig.columns || 3}, 1fr)`
    styles.gap = props.section.layoutConfig.gap || '20px'
  } else if (props.section.layout === 'flex') {
    styles.display = 'flex'
    styles.flexDirection = props.section.layoutConfig.direction || 'row'
    styles.gap = props.section.layoutConfig.gap || '20px'
    if (props.section.layoutConfig.wrap) {
      styles.flexWrap = 'wrap'
    }
  }
  
  return styles
})

function getComponentName(element: PageElementConfig) {
  const componentMap: Record<string, string> = {
    label: 'label',
    text: 'p',
    html: 'div',
    image: 'div',
    link: 'div',
    list: 'div'
  }
  return componentMap[element.elementType] || 'div'
}

function getElementStyles(element: PageElementConfig) {
  return { ...element.styles }
}

function getElementAttributes(element: PageElementConfig) {
  return { ...element.attributes }
}

function getListItems(content: string) {
  return content.split('\n').filter(Boolean)
}
</script>

<style scoped lang="scss">
.dynamic-section {
  width: 100%;
  
  .dynamic-element {
    transition: all 0.3s ease;
    
    &.element-label {
      display: block;
      font-weight: 500;
      color: #606266;
    }
    
    &.element-text {
      margin: 0;
      line-height: 1.6;
      color: #303133;
    }
    
    &.element-html {
      width: 100%;
      
      :deep(img) {
        max-width: 100%;
        height: auto;
      }
      
      :deep(a) {
        color: #667eea;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    &.element-image {
      img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
      }
    }
    
    &.element-link {
      a {
        color: #667eea;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    &.element-list {
      ul {
        margin: 0;
        padding-left: 20px;
        
        li {
          margin: 8px 0;
          line-height: 1.6;
          color: #606266;
        }
      }
    }
  }
}
</style>
