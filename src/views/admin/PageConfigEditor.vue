<template>
  <div class="page-config-editor">
    <div class="config-header">
      <h2>页面可视化配置</h2>
      <div class="header-actions">
        <el-select v-model="selectedPage" placeholder="选择页面" @change="handlePageChange">
          <el-option
            v-for="page in availablePages"
            :key="page.value"
            :label="page.label"
            :value="page.value"
          />
        </el-select>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存配置
        </el-button>
      </div>
    </div>

    <div class="config-body">
      <div class="config-sidebar">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="区块管理" name="sections">
            <div class="section-list">
              <div
                v-for="(section, index) in configData.sections"
                :key="section.sectionKey"
                class="section-item"
                :class="{ active: selectedSection?.sectionKey === section.sectionKey }"
                @click="selectSection(section)"
              >
                <div class="section-info">
                  <span class="section-name">{{ section.sectionName }}</span>
                  <el-tag size="small">{{ section.elements.length }} 个元素</el-tag>
                </div>
                <div class="section-actions">
                  <el-button
                    text
                    size="small"
                    @click.stop="moveSection(index, -1)"
                    :disabled="index === 0"
                  >
                    <el-icon><ArrowUp /></el-icon>
                  </el-button>
                  <el-button
                    text
                    size="small"
                    @click.stop="moveSection(index, 1)"
                    :disabled="index === configData.sections.length - 1"
                  >
                    <el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <el-button
                    text
                    size="small"
                    type="danger"
                    @click.stop="handleDeleteSection(section.sectionKey)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <el-button class="add-section-btn" @click="showAddSectionDialog = true">
                <el-icon><Plus /></el-icon> 添加区块
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="元素管理" name="elements">
            <div v-if="selectedSection" class="element-list">
              <div class="section-header">
                <span>{{ selectedSection.sectionName }}</span>
                <el-button
                  type="primary"
                  size="small"
                  @click="showAddElementDialog = true"
                >
                  添加元素
                </el-button>
              </div>
              <draggable
                v-model="selectedSection.elements"
                item-key="elementKey"
                class="element-items"
                @end="handleElementReorder"
              >
                <template #item="{ element, index }">
                  <div
                    class="element-item"
                    :class="{ active: selectedElement?.elementKey === element.elementKey }"
                    @click="selectElement(element)"
                  >
                    <div class="element-info">
                      <el-icon class="drag-handle"><Rank /></el-icon>
                      <span class="element-key">{{ element.elementKey }}</span>
                      <el-tag size="small" :type="getElementTypeTag(element.elementType)">
                        {{ element.elementType }}
                      </el-tag>
                    </div>
                    <div class="element-actions">
                      <el-switch
                        v-model="element.isVisible"
                        size="small"
                        @change="handleElementVisibilityChange(element)"
                      />
                      <el-button
                        text
                        size="small"
                        type="danger"
                        @click.stop="handleDeleteElement(element.elementKey)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
            <el-empty v-else description="请先选择一个区块" />
          </el-tab-pane>

          <el-tab-pane label="全局样式" name="global">
            <div class="style-editor">
              <div
                v-for="(value, key) in configData.globalStyles"
                :key="key"
                class="style-item"
              >
                <el-input v-model="configData.globalStyles[key]" :placeholder="key">
                  <template #prepend>{{ key }}</template>
                </el-input>
                <el-button
                  text
                  type="danger"
                  @click="deleteGlobalStyle(key as string)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button @click="showAddStyleDialog = true">
                <el-icon><Plus /></el-icon> 添加样式
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="config-main">
        <div v-if="selectedElement" class="element-editor">
          <h3>元素编辑: {{ selectedElement.elementKey }}</h3>
          
          <el-form label-width="80px">
            <el-form-item label="元素类型">
              <el-select v-model="selectedElement.elementType">
                <el-option label="标签文本" value="label" />
                <el-option label="普通文本" value="text" />
                <el-option label="HTML内容" value="html" />
                <el-option label="图片" value="image" />
                <el-option label="链接" value="link" />
                <el-option label="列表" value="list" />
              </el-select>
            </el-form-item>

            <el-form-item label="内容">
              <el-input
                v-if="selectedElement.elementType === 'text' || selectedElement.elementType === 'label'"
                v-model="selectedElement.content"
                type="textarea"
                :rows="3"
              />
              <el-input
                v-else-if="selectedElement.elementType === 'html'"
                v-model="selectedElement.content"
                type="textarea"
                :rows="6"
              />
              <el-input
                v-else-if="selectedElement.elementType === 'image'"
                v-model="selectedElement.content"
                placeholder="图片URL"
              />
              <el-input
                v-else-if="selectedElement.elementType === 'link'"
                v-model="selectedElement.content"
                placeholder="链接地址"
              />
              <el-input
                v-else-if="selectedElement.elementType === 'list'"
                v-model="selectedElement.content"
                type="textarea"
                :rows="4"
                placeholder="每行一个列表项"
              />
            </el-form-item>

            <el-divider content-position="left">样式设置</el-divider>

            <div class="style-grid">
              <el-form-item label="宽度">
                <el-input v-model="selectedElement.styles.width" placeholder="如: 100px, 100%" />
              </el-form-item>
              <el-form-item label="高度">
                <el-input v-model="selectedElement.styles.height" placeholder="如: 100px, auto" />
              </el-form-item>
              <el-form-item label="字体大小">
                <el-input v-model="selectedElement.styles.fontSize" placeholder="如: 14px, 1rem" />
              </el-form-item>
              <el-form-item label="字体粗细">
                <el-select v-model="selectedElement.styles.fontWeight" clearable>
                  <el-option label="正常" value="normal" />
                  <el-option label="粗体" value="bold" />
                  <el-option label="100" value="100" />
                  <el-option label="200" value="200" />
                  <el-option label="300" value="300" />
                  <el-option label="400" value="400" />
                  <el-option label="500" value="500" />
                  <el-option label="600" value="600" />
                  <el-option label="700" value="700" />
                </el-select>
              </el-form-item>
              <el-form-item label="文字颜色">
                <el-color-picker v-model="selectedElement.styles.color" />
              </el-form-item>
              <el-form-item label="背景颜色">
                <el-color-picker v-model="selectedElement.styles.backgroundColor" />
              </el-form-item>
              <el-form-item label="内边距">
                <el-input v-model="selectedElement.styles.padding" placeholder="如: 10px 20px" />
              </el-form-item>
              <el-form-item label="外边距">
                <el-input v-model="selectedElement.styles.margin" placeholder="如: 10px 0" />
              </el-form-item>
              <el-form-item label="边框">
                <el-input v-model="selectedElement.styles.border" placeholder="如: 1px solid #ccc" />
              </el-form-item>
              <el-form-item label="圆角">
                <el-input v-model="selectedElement.styles.borderRadius" placeholder="如: 4px" />
              </el-form-item>
            </div>

            <el-divider content-position="left">自定义样式</el-divider>

            <div
              v-for="(value, key) in selectedElement.styles"
              :key="key"
              class="custom-style-item"
            >
              <el-input :model-value="key" disabled style="width: 120px" />
              <el-input v-model="selectedElement.styles[key as string]" />
              <el-button text type="danger" @click="deleteElementStyle(key as string)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button size="small" @click="showAddElementStyleDialog = true">
              <el-icon><Plus /></el-icon> 添加自定义样式
            </el-button>

            <el-divider content-position="left">属性设置</el-divider>

            <div
              v-for="(value, key) in selectedElement.attributes"
              :key="key"
              class="custom-style-item"
            >
              <el-input :model-value="key" disabled style="width: 120px" />
              <el-input v-model="selectedElement.attributes[key as string]" />
              <el-button text type="danger" @click="deleteElementAttribute(key as string)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button size="small" @click="showAddAttributeDialog = true">
              <el-icon><Plus /></el-icon> 添加属性
            </el-button>
          </el-form>
        </div>

        <div v-else-if="selectedSection" class="section-editor">
          <h3>区块编辑: {{ selectedSection.sectionName }}</h3>
          
          <el-form label-width="80px">
            <el-form-item label="区块名称">
              <el-input v-model="selectedSection.sectionName" />
            </el-form-item>
            <el-form-item label="布局类型">
              <el-select v-model="selectedSection.layout">
                <el-option label="网格布局" value="grid" />
                <el-option label="弹性布局" value="flex" />
                <el-option label="列表布局" value="list" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">布局配置</el-divider>

            <el-form-item v-if="selectedSection.layout === 'grid'" label="列数">
              <el-input-number v-model="selectedSection.layoutConfig.columns" :min="1" :max="12" />
            </el-form-item>
            <el-form-item label="间距">
              <el-input v-model="selectedSection.layoutConfig.gap" placeholder="如: 20px" />
            </el-form-item>
            <el-form-item v-if="selectedSection.layout === 'flex'" label="方向">
              <el-select v-model="selectedSection.layoutConfig.direction">
                <el-option label="横向" value="row" />
                <el-option label="纵向" value="column" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="selectedSection.layout === 'flex'" label="换行">
              <el-switch v-model="selectedSection.layoutConfig.wrap" />
            </el-form-item>

            <el-divider content-position="left">区块样式</el-divider>

            <div class="style-grid">
              <el-form-item label="宽度">
                <el-input v-model="selectedSection.styles.width" />
              </el-form-item>
              <el-form-item label="内边距">
                <el-input v-model="selectedSection.styles.padding" />
              </el-form-item>
              <el-form-item label="外边距">
                <el-input v-model="selectedSection.styles.margin" />
              </el-form-item>
              <el-form-item label="背景色">
                <el-color-picker v-model="selectedSection.styles.backgroundColor" />
              </el-form-item>
            </div>
          </el-form>
        </div>

        <el-empty v-else description="请选择一个区块或元素进行编辑" />
      </div>

      <div class="config-preview">
        <div class="preview-header">
          <span>实时预览</span>
          <el-button size="small" @click="refreshPreview">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
        <div class="preview-content" v-html="previewHtml"></div>
      </div>
    </div>

    <el-dialog v-model="showAddSectionDialog" title="添加区块" width="500px">
      <el-form :model="newSection" label-width="80px">
        <el-form-item label="区块标识">
          <el-input v-model="newSection.sectionKey" placeholder="如: hero-section" />
        </el-form-item>
        <el-form-item label="区块名称">
          <el-input v-model="newSection.sectionName" placeholder="如: 英雄区" />
        </el-form-item>
        <el-form-item label="布局类型">
          <el-select v-model="newSection.layout">
            <el-option label="网格布局" value="grid" />
            <el-option label="弹性布局" value="flex" />
            <el-option label="列表布局" value="list" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddSectionDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddSection">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddElementDialog" title="添加元素" width="500px">
      <el-form :model="newElement" label-width="80px">
        <el-form-item label="元素标识">
          <el-input v-model="newElement.elementKey" placeholder="如: site-keywords" />
        </el-form-item>
        <el-form-item label="元素类型">
          <el-select v-model="newElement.elementType">
            <el-option label="标签文本" value="label" />
            <el-option label="普通文本" value="text" />
            <el-option label="HTML内容" value="html" />
            <el-option label="图片" value="image" />
            <el-option label="链接" value="link" />
            <el-option label="列表" value="list" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="newElement.content" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddElementDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddElement">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddStyleDialog" title="添加全局样式" width="400px">
      <el-form :model="newStyle" label-width="80px">
        <el-form-item label="样式名">
          <el-input v-model="newStyle.key" placeholder="如: primaryColor" />
        </el-form-item>
        <el-form-item label="样式值">
          <el-input v-model="newStyle.value" placeholder="如: #667eea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddStyleDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddGlobalStyle">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddElementStyleDialog" title="添加元素样式" width="400px">
      <el-form :model="newElementStyle" label-width="80px">
        <el-form-item label="样式属性">
          <el-input v-model="newElementStyle.key" placeholder="如: boxShadow" />
        </el-form-item>
        <el-form-item label="样式值">
          <el-input v-model="newElementStyle.value" placeholder="如: 0 2px 12px rgba(0,0,0,0.1)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddElementStyleDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddElementStyle">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddAttributeDialog" title="添加属性" width="400px">
      <el-form :model="newAttribute" label-width="80px">
        <el-form-item label="属性名">
          <el-input v-model="newAttribute.key" placeholder="如: class, id, data-*" />
        </el-form-item>
        <el-form-item label="属性值">
          <el-input v-model="newAttribute.value" placeholder="属性值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAttributeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddAttribute">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import { usePageConfigStore } from '@/stores/pageConfig'
import type { PageConfig, PageSectionConfig, PageElementConfig } from '@/types'

const pageConfigStore = usePageConfigStore()

const selectedPage = ref('home')
const activeTab = ref('sections')
const saving = ref(false)
const previewHtml = ref('')

const configData = reactive<PageConfig>({
  id: '',
  page: 'home',
  pageName: '首页',
  sections: [],
  globalStyles: {},
  createdAt: '',
  updatedAt: ''
})

const selectedSection = ref<PageSectionConfig | null>(null)
const selectedElement = ref<PageElementConfig | null>(null)

const availablePages = [
  { label: '首页', value: 'home' },
  { label: '文章列表', value: 'articles' },
  { label: '文章详情', value: 'article-detail' },
  { label: '分类页面', value: 'category' },
  { label: '关于页面', value: 'about' },
  { label: '项目页面', value: 'projects' }
]

const showAddSectionDialog = ref(false)
const showAddElementDialog = ref(false)
const showAddStyleDialog = ref(false)
const showAddElementStyleDialog = ref(false)
const showAddAttributeDialog = ref(false)

const newSection = reactive({
  sectionKey: '',
  sectionName: '',
  layout: 'flex' as 'grid' | 'flex' | 'list' | 'custom'
})

const newElement = reactive({
  elementKey: '',
  elementType: 'text' as 'label' | 'text' | 'html' | 'image' | 'link' | 'list',
  content: ''
})

const newStyle = reactive({ key: '', value: '' })
const newElementStyle = reactive({ key: '', value: '' })
const newAttribute = reactive({ key: '', value: '' })

function getElementTypeTag(type: string) {
  const typeMap: Record<string, string> = {
    label: '',
    text: 'success',
    html: 'warning',
    image: 'info',
    link: 'primary',
    list: 'danger'
  }
  return typeMap[type] || ''
}

async function handlePageChange() {
  await loadPageConfig()
  selectedSection.value = null
  selectedElement.value = null
}

async function loadPageConfig() {
  try {
    const config = await pageConfigStore.fetchPageConfig(selectedPage.value)
    if (config) {
      Object.assign(configData, config)
      generatePreview()
    }
  } catch (error) {
    console.error('Failed to load page config:', error)
  }
}

function selectSection(section: PageSectionConfig) {
  selectedSection.value = section
  selectedElement.value = null
}

function selectElement(element: PageElementConfig) {
  selectedElement.value = element
}

function handleElementReorder() {
  generatePreview()
}

function handleElementVisibilityChange(element: PageElementConfig) {
  generatePreview()
}

async function moveSection(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= configData.sections.length) return
  
  const sections = [...configData.sections]
  const temp = sections[index]
  sections[index] = sections[newIndex]
  sections[newIndex] = temp
  
  sections[index].sortOrder = index
  sections[newIndex].sortOrder = newIndex
  
  configData.sections = sections
  generatePreview()
}

async function handleAddSection() {
  if (!newSection.sectionKey || !newSection.sectionName) {
    ElMessage.warning('请填写完整的区块信息')
    return
  }

  const section: PageSectionConfig = {
    id: Date.now().toString(),
    page: selectedPage.value,
    sectionKey: newSection.sectionKey,
    sectionName: newSection.sectionName,
    layout: newSection.layout,
    layoutConfig: { columns: 3, gap: '20px', direction: 'row', wrap: true },
    styles: {},
    elements: [],
    sortOrder: configData.sections.length,
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  configData.sections.push(section)
  showAddSectionDialog.value = false
  newSection.sectionKey = ''
  newSection.sectionName = ''
  newSection.layout = 'flex'
  
  generatePreview()
  ElMessage.success('区块添加成功')
}

async function handleDeleteSection(sectionKey: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个区块吗？', '提示', {
      type: 'warning'
    })
    configData.sections = configData.sections.filter(s => s.sectionKey !== sectionKey)
    if (selectedSection.value?.sectionKey === sectionKey) {
      selectedSection.value = null
      selectedElement.value = null
    }
    generatePreview()
    ElMessage.success('区块删除成功')
  } catch {
    // 用户取消
  }
}

async function handleAddElement() {
  if (!newElement.elementKey || !selectedSection.value) {
    ElMessage.warning('请填写完整的元素信息')
    return
  }

  const element: PageElementConfig = {
    id: Date.now().toString(),
    page: selectedPage.value,
    elementKey: newElement.elementKey,
    elementType: newElement.elementType,
    content: newElement.content,
    styles: {},
    attributes: {},
    sortOrder: selectedSection.value.elements.length,
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  selectedSection.value.elements.push(element)
  showAddElementDialog.value = false
  newElement.elementKey = ''
  newElement.elementType = 'text'
  newElement.content = ''
  
  generatePreview()
  ElMessage.success('元素添加成功')
}

async function handleDeleteElement(elementKey: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个元素吗？', '提示', {
      type: 'warning'
    })
    if (selectedSection.value) {
      selectedSection.value.elements = selectedSection.value.elements.filter(
        e => e.elementKey !== elementKey
      )
      if (selectedElement.value?.elementKey === elementKey) {
        selectedElement.value = null
      }
      generatePreview()
      ElMessage.success('元素删除成功')
    }
  } catch {
    // 用户取消
  }
}

function handleAddGlobalStyle() {
  if (!newStyle.key) {
    ElMessage.warning('请输入样式名')
    return
  }
  configData.globalStyles[newStyle.key] = newStyle.value
  showAddStyleDialog.value = false
  newStyle.key = ''
  newStyle.value = ''
  generatePreview()
}

function deleteGlobalStyle(key: string) {
  delete configData.globalStyles[key]
  generatePreview()
}

function handleAddElementStyle() {
  if (!newElementStyle.key || !selectedElement.value) {
    ElMessage.warning('请输入样式信息')
    return
  }
  selectedElement.value.styles[newElementStyle.key] = newElementStyle.value
  showAddElementStyleDialog.value = false
  newElementStyle.key = ''
  newElementStyle.value = ''
  generatePreview()
}

function deleteElementStyle(key: string) {
  if (selectedElement.value) {
    delete selectedElement.value.styles[key]
    generatePreview()
  }
}

function handleAddAttribute() {
  if (!newAttribute.key || !selectedElement.value) {
    ElMessage.warning('请输入属性信息')
    return
  }
  selectedElement.value.attributes[newAttribute.key] = newAttribute.value
  showAddAttributeDialog.value = false
  newAttribute.key = ''
  newAttribute.value = ''
  generatePreview()
}

function deleteElementAttribute(key: string) {
  if (selectedElement.value) {
    delete selectedElement.value.attributes[key]
    generatePreview()
  }
}

function generatePreview() {
  let html = `<div class="preview-container" style="${Object.entries(configData.globalStyles)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')}">`
  
  configData.sections.forEach(section => {
    if (!section.isVisible) return
    
    let sectionStyle = Object.entries(section.styles)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ')
    
    let sectionClass = `section-${section.layout}`
    
    html += `<div class="${sectionClass}" style="${sectionStyle}">`
    html += `<h4 style="margin: 0 0 10px; color: #667eea; font-size: 14px;">${section.sectionName}</h4>`
    
    section.elements.forEach(element => {
      if (!element.isVisible) return
      
      const style = Object.entries(element.styles)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ')
      
      const attrs = Object.entries(element.attributes)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      
      switch (element.elementType) {
        case 'label':
          html += `<label style="${style}" ${attrs}>${element.content}</label>`
          break
        case 'text':
          html += `<p style="${style}" ${attrs}>${element.content}</p>`
          break
        case 'html':
          html += `<div style="${style}" ${attrs}>${element.content}</div>`
          break
        case 'image':
          html += `<img src="${element.content}" style="${style}" ${attrs} />`
          break
        case 'link':
          html += `<a href="${element.content}" style="${style}" ${attrs}>${element.content}</a>`
          break
        case 'list':
          const items = element.content.split('\n').filter(Boolean)
          html += `<ul style="${style}" ${attrs}>`
          items.forEach(item => {
            html += `<li>${item}</li>`
          })
          html += '</ul>'
          break
      }
    })
    
    html += '</div><hr style="margin: 10px 0; border: none; border-top: 1px dashed #ddd;" />'
  })
  
  html += '</div>'
  previewHtml.value = html
}

function refreshPreview() {
  generatePreview()
  ElMessage.success('预览已刷新')
}

async function handleSave() {
  saving.value = true
  try {
    await pageConfigStore.savePageConfig(selectedPage.value, configData)
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('配置保存失败')
  } finally {
    saving.value = false
  }
}

watch(selectedElement, () => {
  generatePreview()
}, { deep: true })

watch(() => selectedSection?.value?.styles, () => {
  generatePreview()
}, { deep: true })

onMounted(() => {
  loadPageConfig()
})
</script>

<style scoped lang="scss">
.page-config-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;

  .config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: white;
    border-bottom: 1px solid #e4e7ed;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .config-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    .config-sidebar {
      width: 320px;
      background: white;
      border-right: 1px solid #e4e7ed;
      overflow-y: auto;

      :deep(.el-tabs__header) {
        margin: 0;
        padding: 0 16px;
      }

      :deep(.el-tabs__content) {
        padding: 16px;
      }

      .section-list {
        .section-item {
          padding: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #667eea;
          }

          &.active {
            border-color: #667eea;
            background: #f0f2ff;
          }

          .section-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .section-name {
              font-weight: 500;
              color: #303133;
            }
          }

          .section-actions {
            display: flex;
            justify-content: flex-end;
            gap: 4px;
          }
        }

        .add-section-btn {
          width: 100%;
          margin-top: 8px;
        }
      }

      .element-list {
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 500;
          color: #303133;
        }

        .element-items {
          min-height: 100px;
        }

        .element-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #667eea;
          }

          &.active {
            border-color: #667eea;
            background: #f0f2ff;
          }

          .element-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .drag-handle {
              cursor: move;
              color: #909399;
            }

            .element-key {
              font-size: 13px;
              color: #606266;
            }
          }

          .element-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }
      }

      .style-editor {
        .style-item {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;

          :deep(.el-input) {
            flex: 1;
          }
        }
      }
    }

    .config-main {
      flex: 1;
      padding: 24px;
      overflow-y: auto;

      .element-editor,
      .section-editor {
        h3 {
          margin: 0 0 20px;
          font-size: 18px;
          color: #303133;
        }

        .style-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .custom-style-item {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
      }
    }

    .config-preview {
      width: 400px;
      background: white;
      border-left: 1px solid #e4e7ed;
      display: flex;
      flex-direction: column;

      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e4e7ed;
        font-weight: 500;
        color: #303133;
      }

      .preview-content {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background: #fafafa;

        :deep(.preview-container) {
          background: white;
          padding: 16px;
          border-radius: 8px;
        }

        :deep(.section-grid) {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 6px;
          margin-bottom: 10px;
        }

        :deep(.section-flex) {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 6px;
          margin-bottom: 10px;
        }

        :deep(.section-list) {
          padding: 10px;
          background: #f9f9f9;
          border-radius: 6px;
          margin-bottom: 10px;
        }

        :deep(label) {
          display: block;
          padding: 4px 0;
          color: #606266;
        }

        :deep(p) {
          margin: 4px 0;
          color: #303133;
        }

        :deep(img) {
          max-width: 100%;
          border-radius: 4px;
        }

        :deep(ul) {
          margin: 8px 0;
          padding-left: 20px;
        }

        :deep(li) {
          margin: 4px 0;
          color: #606266;
        }
      }
    }
  }
}
</style>
