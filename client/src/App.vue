<template>
  <div id="app-container">
    <main class="main-content">
      <div class="config-section">
        <div class="config-header">
          <h1 class="app-title">图片编辑工具</h1>
          <p class="app-subtitle">专业级图片边框编辑工具</p>
        </div>
        <div class="config-content">
          <!-- 错误提示 -->
          <div v-if="store.error" class="error-card">
            <p>{{ store.error }}</p>
          </div>

          <!-- 上传区域 -->
          <div class="config-card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="icon">📤</span>
                上传图片
              </h3>
            </div>
            <div class="card-content">
              <div class="upload-area">
                <input 
                  type="file" 
                  ref="fileInput" 
                  @change="handleFileUpload" 
                  accept="image/*" 
                  style="display: none"
                >
                <button @click="$refs.fileInput.click()" class="btn btn-primary">
                  {{ store.isLoading ? '加载中...' : '选择图片' }}
                </button>
                <p class="upload-hint">支持 JPG, PNG, GIF, WebP 格式</p>
              </div>
            </div>
          </div>

          <!-- 编辑区域 -->
          <div v-if="store.hasImage" class="config-card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="icon">✏️</span>
                边框工具
              </h3>
            </div>
            <div class="card-content">
              <!-- 控制按钮 -->
              <div class="toolbar-section">
                <div class="group-title">添加边框</div>
                <div class="controls">
                  <button @click="addCropBoxWithGlobalSettings('rectangle', 16/9)" class="btn btn-primary">16:9</button>
                  <button @click="addCropBoxWithGlobalSettings('rectangle', 4/3)" class="btn btn-primary">4:3</button>
                  <button @click="addCropBoxWithGlobalSettings('square')" class="btn btn-primary">正方形</button>
                  <button @click="addCropBoxWithGlobalSettings('circle')" class="btn btn-primary">圆形</button>
                </div>
              </div>

              <!-- 边框管理 -->
              <div v-if="store.hasBoxes" class="toolbar-section">
                <div class="group-title">边框管理</div>
                <div class="box-list">
                  <div 
                    v-for="(box, index) in store.cropBoxes" 
                    :key="box.id"
                    :class="['box-item', { active: index === store.activeBoxIndex }]"
                    @click="setActiveBox(index)"
                  >
                    <div class="box-color" :style="{ backgroundColor: box.color }"></div>
                    <span class="box-name">边框 {{ index + 1 }} ({{ box.type }})</span>
                    <button @click.stop="removeBox(index)" class="btn btn-danger">删除</button>
                  </div>
                </div>
                <div class="box-actions">
                  <button @click="removeActiveBox" class="btn btn-danger" :disabled="!store.activeBox">删除选中</button>
                  <button @click="clearAllBoxes" class="btn btn-danger" :disabled="!store.hasBoxes">清除所有</button>
                </div>
                
                <!-- 快捷键提示 -->
                <div class="shortcut-tips">
                  <div class="tip-item">
                    <span class="tip-icon">⌨️</span>
                    <span class="tip-text">选中边框后，使用方向键微调位置</span>
                  </div>
                  <div class="tip-item">
                    <span class="tip-icon">⚡</span>
                    <span class="tip-text">按住Shift键加速移动</span>
                  </div>
                  <div class="tip-item">
                    <span class="tip-icon">🗑️</span>
                    <span class="tip-text">Delete键删除选中边框</span>
                  </div>
                  <div class="tip-item">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text">点击边框选中，点击空白区域取消选中</span>
                  </div>
                </div>
              </div>

              <!-- 边框设置 -->
              <div v-if="store.hasBoxes" class="toolbar-section">
                <div class="group-title">边框设置</div>
                
                <!-- 颜色选择器 -->
                <BorderColorPicker 
                  v-model="globalBorderColor" 
                  @update:modelValue="updateAllBoxColors"
                />
                
                <!-- 控制按钮 -->
                <div class="control-buttons">
                  <button 
                    :class="['btn', 'btn-sm', { 'btn-active': lockAspectRatio }]" 
                    @click="lockAspectRatio = !lockAspectRatio"
                  >
                    <span class="btn-icon">🔒</span>
                    锁定宽高比
                  </button>
                  <button 
                    :class="['btn', 'btn-sm', { 'btn-active': showAlignmentGuides }]" 
                    @click="showAlignmentGuides = !showAlignmentGuides"
                  >
                    <span class="btn-icon">📐</span>
                    显示辅助线
                  </button>
                </div>
                
                <!-- 边框宽度 -->
                <div class="slider-container">
                  <label for="borderWidth">边框宽度:</label>
                  <input 
                    type="range" 
                    id="borderWidth" 
                    v-model.number="globalBorderWidth" 
                    min="1" 
                    max="40"
                    @input="updateAllBoxBorderWidth"
                  >
                  <span>{{ globalBorderWidth }}px</span>
                </div>
                
                <!-- 圆角半径 -->
                <div class="slider-container">
                  <label for="borderRadius">圆角半径:</label>
                  <input 
                    type="range" 
                    id="borderRadius" 
                    v-model.number="globalBorderRadius" 
                    min="0" 
                    max="100"
                    @input="updateAllBoxBorderRadius"
                  >
                  <span>{{ globalBorderRadius }}px</span>
                </div>
                
                <!-- 阴影设置 -->
                <div class="shadow-settings">
                  <div class="section-subtitle">阴影设置</div>
                  
                  <!-- 阴影开关 -->
                  <div class="checkbox-container">
                    <input type="checkbox" v-model="globalShadowEnabled" id="shadowEnabled" @change="updateAllBoxShadowEnabled">
                    <label for="shadowEnabled">启用阴影</label>
                  </div>
                  
                  <!-- 阴影颜色 -->
                  <div v-if="globalShadowEnabled" class="control-item">
                    <label>阴影颜色</label>
                    <div ref="shadowColorRef" class="color-picker"></div>
                    <!--<div class="color-preview" :style="{ backgroundColor: globalShadowColor }"></div>-->
                  </div>
                  
                  <!-- 阴影偏移 -->
                  <div v-if="globalShadowEnabled" class="shadow-offset">
                    <div class="slider-container">
                      <label for="shadowX">X偏移:</label>
                      <input 
                        type="range" 
                        id="shadowX" 
                        v-model.number="globalShadowX" 
                        min="-20" 
                        max="20"
                        @input="updateAllBoxShadow"
                      >
                      <span>{{ globalShadowX }}px</span>
                    </div>
                    <div class="slider-container">
                      <label for="shadowY">Y偏移:</label>
                      <input 
                        type="range" 
                        id="shadowY" 
                        v-model.number="globalShadowY" 
                        min="-20" 
                        max="20"
                        @input="updateAllBoxShadow"
                      >
                      <span>{{ globalShadowY }}px</span>
                    </div>
                  </div>
                  
                  <!-- 阴影模糊 -->
                  <div v-if="globalShadowEnabled" class="slider-container">
                    <label for="shadowBlur">模糊半径:</label>
                    <input 
                      type="range" 
                      id="shadowBlur" 
                      v-model.number="globalShadowBlur" 
                      min="0" 
                      max="30"
                      @input="updateAllBoxShadow"
                    >
                    <span>{{ globalShadowBlur }}px</span>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="toolbar-section">
                <div class="group-title">操作</div>
                <div class="actions">
                  <button @click="quickExport" class="btn btn-primary" :disabled="!store.hasBoxes || store.isLoading || isExporting">
                    <span v-if="isExporting" class="loading-spinner"></span>
                    {{ isExporting ? '导出中...' : '快速导出' }}
                  </button>
                  <button @click="advancedExport" class="btn btn-secondary" :disabled="!store.hasBoxes || store.isLoading">
                    高级导出
                  </button>
                  <button @click="reset" class="btn btn-danger">重置</button>
                </div>
                
                <!-- 导出进度条 -->
                <div v-if="isExporting" class="export-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: exportProgress + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ exportProgress }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="preview-section">
        <!-- 图片编辑器 -->
        <ImageEditor 
          ref="imageEditorRef"
          v-if="store.hasImage"
          :image="store.currentImage"
          :lock-aspect-ratio="lockAspectRatio"
          :show-alignment-guides="showAlignmentGuides"
          @update="handleUpdate"
        />
        <div v-else class="empty-state">
          <div class="empty-icon">📷</div>
          <h3>请选择图片开始编辑</h3>
          <p>支持多种图片格式，可添加多种边框效果</p>
        </div>
      </div>
    </main>
    
    <!-- 导出设置弹窗 -->
    <div v-if="showExportSettings" class="modal-overlay" @click="showExportSettings = false">
      <div class="modal-content" @click.stop>
        <ExportSettings
          :image="store.currentImage"
          :boxes="store.cropBoxes"
          :image-processor="imageProcessor"
          @close="showExportSettings = false"
          @export="handleExportConfirm"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditorStore } from './stores/editor'
import { useImageProcessor } from './composables/useImageProcessor'
import ImageEditor from './components/ImageEditor.vue'
import BorderColorPicker from './components/BorderColorPicker.vue'
import ExportSettings from './components/ExportSettings.vue'
import Pickr from '@simonwep/pickr'
import '@simonwep/pickr/dist/themes/classic.min.css'

const store = useEditorStore()
const imageProcessor = useImageProcessor()
const lockAspectRatio = ref(true)
const showAlignmentGuides = ref(true)

// 全局边框设置
const globalBorderColor = ref('#ff00cc')
const globalBorderWidth = ref(4)
const globalBorderRadius = ref(10)
const globalShadowEnabled = ref(false)
const globalShadowColor = ref('rgba(0,0,0,0.5)')
const globalShadowX = ref(0)
const globalShadowY = ref(0)
const globalShadowBlur = ref(10)

// 导出相关状态
const showExportSettings = ref(false)
const exportProgress = ref(0)
const isExporting = ref(false)

// 阴影颜色选择器
const shadowColorRef = ref(null)
let shadowColorInstance = null

// 直接使用 store，保持响应性
// 从 store 中获取方法
const { 
  uploadImage, 
  addBox, 
  setActiveBox, 
  updateBox, 
  removeBox, 
  clearAllBoxes, 
  reset 
} = store

// 从 imageProcessor 获取导出相关方法
const { 
  processImage, 
  downloadImage, 
  generateFilename, 
  getSupportedFormats, 
  previewExport, 
  setExportConfig,
  debugCoordinateConversion
} = imageProcessor

// ImageEditor组件引用
const imageEditorRef = ref(null)

// 初始化阴影颜色选择器
const initShadowColorPicker = () => {
  if (shadowColorRef.value && globalShadowEnabled.value) {
    shadowColorInstance = Pickr.create({
      el: shadowColorRef.value,
      theme: 'classic',
      default: globalShadowColor.value || 'rgba(0,0,0,0.5)',
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          rgba: true,
          hsla: true,
          hsva: true,
          cmyk: true,
          input: true,
          clear: true,
          save: true
        }
      }
    })

    shadowColorInstance.on('save', (color) => {
      const rgbaArr = color.toRGBA()
      if (rgbaArr && rgbaArr.length === 4) {
        const [r, g, b, a] = rgbaArr
        const shadowColor = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
        globalShadowColor.value = shadowColor
        updateAllBoxShadowColor()
      }
      shadowColorInstance.hide()
    })
  }
}

// 处理文件上传
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    try {
      await uploadImage(file)
      // 使用 nextTick 确保状态更新完成
      await nextTick()
    } catch (err) {
      console.error('上传失败:', err)
    }
  }
}

// 添加边框并应用全局设置
const addCropBoxWithGlobalSettings = (type, ratio = 1) => {
  // 计算基于比例的尺寸
  const baseSize = 200
  const width = baseSize
  const height = baseSize / ratio
  
  // 计算圆角值
  const borderRadius = type === 'circle' ? 50 : globalBorderRadius.value
  
  console.log('添加边框:', {
    type,
    ratio,
    width,
    height,
    borderRadius,
    globalBorderRadius: globalBorderRadius.value
  })
  
  // 添加边框
  addBox(type, {
    width: width,
    height: height,
    color: globalBorderColor.value,
    borderWidth: globalBorderWidth.value,
    borderRadius: borderRadius, // 只有圆形固定为50，其他都使用全局设置
    shadowEnabled: globalShadowEnabled.value,
    shadowColor: globalShadowColor.value,
    shadowX: globalShadowX.value,
    shadowY: globalShadowY.value,
    shadowBlur: globalShadowBlur.value
  })
  
  // 强制触发响应式更新
  nextTick(() => {
    store.cropBoxes = [...store.cropBoxes]
  })
}

// 强制同步所有边框到全局设置
const forceSyncAllBoxes = () => {
  if (store.cropBoxes.length === 0) return
  
  // 强制更新所有边框
  store.cropBoxes.forEach((box, index) => {
    const updates = {
      color: globalBorderColor.value,
      borderWidth: globalBorderWidth.value,
      borderRadius: box.type === 'circle' ? 50 : globalBorderRadius.value,
      shadowEnabled: globalShadowEnabled.value,
      shadowColor: globalShadowColor.value,
      shadowX: globalShadowX.value,
      shadowY: globalShadowY.value,
      shadowBlur: globalShadowBlur.value
    }
    
    // 强制触发响应式更新
    store.updateBox(index, updates)
  })
  
  // 强制触发Vue响应式更新
  nextTick(() => {
    // 通过重新赋值数组来强制触发响应式
    store.cropBoxes = [...store.cropBoxes]
  })
}

// 更新所有边框颜色
const updateAllBoxColors = () => {
  forceSyncAllBoxes()
}

// 更新所有边框宽度
const updateAllBoxBorderWidth = () => {
  forceSyncAllBoxes()
}

// 更新所有边框圆角
const updateAllBoxBorderRadius = () => {
  forceSyncAllBoxes()
}

// 更新所有边框阴影
const updateAllBoxShadow = () => {
  forceSyncAllBoxes()
}

// 更新所有边框阴影颜色
const updateAllBoxShadowColor = () => {
  forceSyncAllBoxes()
}

// 更新所有边框阴影开关
const updateAllBoxShadowEnabled = () => {
  forceSyncAllBoxes()
  if (globalShadowEnabled.value) {
    nextTick(() => {
      initShadowColorPicker()
    })
  }
}

// 删除活动边框
const removeActiveBox = () => {
  if (store.activeBoxIndex >= 0) {
    removeBox(store.activeBoxIndex)
  }
}

// 快速导出（使用默认设置）
const quickExport = async () => {
  if (!store.currentImage || store.cropBoxes.length === 0) {
    alert('请先添加边框')
    return
  }
  
  try {
    isExporting.value = true
    exportProgress.value = 0
    
    // 获取ImageEditor组件的显示尺寸
    let displaySize = null
    
    if (imageEditorRef.value && imageEditorRef.value.getImageDisplaySize) {
      displaySize = imageEditorRef.value.getImageDisplaySize()
    } else {
      // 备用方法：从DOM获取
      const previewImg = document.querySelector('.canvas-container img')
      if (previewImg) {
        const computedStyle = window.getComputedStyle(previewImg)
        displaySize = {
          width: parseFloat(computedStyle.width),
          height: parseFloat(computedStyle.height)
        }
      } else {
        // 最后的备用方案：使用store中的图片尺寸
        if (store.currentImage) {
          displaySize = {
            width: store.currentImage.width,
            height: store.currentImage.height
          }
        }
      }
    }
    
    if (!displaySize) {
      throw new Error('无法获取图片显示尺寸')
    }
    
    // 调试坐标转换
    debugCoordinateConversion(store.currentImage, store.cropBoxes)
    
    // 使用默认配置导出
    // 注意：store.cropBoxes 已经是原始坐标，不需要再次转换
    const blob = await processImage(store.currentImage, store.cropBoxes, displaySize)
    const filename = generateFilename(store.currentImage)
    downloadImage(blob, filename, 'png')
    
    exportProgress.value = 100
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
    }, 1000)
    
  } catch (err) {
    console.error('快速导出失败:', err)
    alert('导出失败: ' + err.message)
    isExporting.value = false
    exportProgress.value = 0
  }
}

// 高级导出（打开设置弹窗）
const advancedExport = () => {
  if (!store.currentImage || store.cropBoxes.length === 0) {
    alert('请先添加边框')
    return
  }
  showExportSettings.value = true
}

// 处理导出设置确认
const handleExportConfirm = async (exportConfig) => {
  try {
    isExporting.value = true
    exportProgress.value = 0
    
    // 获取ImageEditor组件的显示尺寸
    let displaySize = null
    
    if (imageEditorRef.value && imageEditorRef.value.getImageDisplaySize) {
      displaySize = imageEditorRef.value.getImageDisplaySize()
    } else {
      // 备用方法：从DOM获取
      const previewImg = document.querySelector('.canvas-container img')
      if (previewImg) {
        const computedStyle = window.getComputedStyle(previewImg)
        displaySize = {
          width: parseFloat(computedStyle.width),
          height: parseFloat(computedStyle.height)
        }
      } else {
        // 最后的备用方案：使用store中的图片尺寸
        if (store.currentImage) {
          displaySize = {
            width: store.currentImage.width,
            height: store.currentImage.height
          }
        }
      }
    }
    
    if (!displaySize) {
      throw new Error('无法获取图片显示尺寸')
    }
    
    // 使用自定义配置导出
    // 注意：store.cropBoxes 已经是原始坐标，不需要再次转换
    const blob = await processImage(store.currentImage, store.cropBoxes, displaySize, exportConfig)
    const filename = exportConfig.filename || generateFilename(store.currentImage)
    downloadImage(blob, filename, exportConfig.format)
    
    exportProgress.value = 100
    showExportSettings.value = false
    
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
    }, 1000)
    
  } catch (err) {
    console.error('高级导出失败:', err)
    alert('导出失败: ' + err.message)
    isExporting.value = false
    exportProgress.value = 0
  }
}

// 处理更新事件
const handleUpdate = () => {
  // 可以在这里添加更新后的处理逻辑
  console.log('ImageEditor updated')
}

// 监听活动边框变化，初始化阴影颜色选择器
const initShadowColorPickerWhenActive = () => {
  if (globalShadowEnabled.value) {
    nextTick(() => {
      initShadowColorPicker()
    })
  }
}

onMounted(() => {
  // 监听阴影开关变化
  watch(() => globalShadowEnabled.value, () => {
    initShadowColorPickerWhenActive()
  }, { immediate: true })
  
  // 监听边框数量变化，同步全局设置
  watch(() => store.cropBoxes.length, (newLength, oldLength) => {
    if (newLength > 0) {
      // 当边框数量变化时，同步全局设置
      nextTick(() => {
        forceSyncAllBoxes()
      })
    }
  }, { immediate: true })

  // 监听全局设置变化，自动同步到所有边框
  watch(globalBorderColor, updateAllBoxColors)
  watch(globalBorderWidth, updateAllBoxBorderWidth)
  watch(globalBorderRadius, updateAllBoxBorderRadius)
  watch(globalShadowEnabled, updateAllBoxShadowEnabled)
  watch(globalShadowColor, updateAllBoxShadowColor)
  watch([globalShadowX, globalShadowY, globalShadowBlur], updateAllBoxShadow)
})

onBeforeUnmount(() => {
  if (shadowColorInstance) {
    shadowColorInstance.destroy()
  }
})
</script>

<style scoped>
/* 主布局样式 */
#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--primary-bg);
}

.main-content {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  background: var(--primary-bg);
}

.config-section {
  width: 480px;
  flex-shrink: 0;
  background: var(--secondary-bg);
  border-right: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.config-header {
  background: linear-gradient(135deg, white 0%, #f0f9ff 100%);
  color: var(--text-color);
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-md);
  border-bottom: 1px solid var(--border-color);
}

.app-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.app-subtitle {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 400;
}

.config-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background: var(--secondary-bg);
}

.preview-section {
  flex-grow: 1;
  padding: 30px;
  overflow: auto;
  background: var(--primary-bg);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  min-width: 600px;
}

.preview-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(110, 231, 183, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 45% 55%, rgba(147, 197, 253, 0.1) 0%, transparent 40%);
  pointer-events: none;
}

/* 配置卡片样式 */
.config-card {
  background: var(--secondary-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.2s ease;
  margin-bottom: 15px;
}

.config-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.card-header {
  background: linear-gradient(135deg, white 0%, #f0f9ff 100%);
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  width: 1.125rem;
  height: 1.125rem;
  fill: var(--accent-color);
}

.card-content {
  padding: 15px;
}

/* 工具栏样式 */
.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--secondary-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.toolbar-section:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-sm);
}

.group-title {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 600;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.upload-area {
  text-align: center;
  padding: 20px;
}

.upload-hint {
  margin-top: 10px;
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* 边框列表样式 */
.box-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.box-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--primary-bg);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}

.box-item:hover {
  background: var(--secondary-bg);
  border-color: var(--accent-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.box-item.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.box-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
}

.box-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.box-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.actions .btn {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 错误提示样式 */
.error-card {
  background: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #ef4444;
  padding: 12px;
  border-radius: var(--radius);
  margin-bottom: 15px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 40px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* 滚动条美化 */
.config-content::-webkit-scrollbar,
.preview-section::-webkit-scrollbar {
  width: 6px;
}

.config-content::-webkit-scrollbar-track,
.preview-section::-webkit-scrollbar-track {
  background: transparent;
}

.config-content::-webkit-scrollbar-thumb,
.preview-section::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.config-content::-webkit-scrollbar-thumb:hover,
.preview-section::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 颜色选择器样式 */
.checkbox-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.checkbox-container input[type="checkbox"] {
  margin: 0;
}

.checkbox-container label {
  font-size: 0.875rem;
  color: var(--text-color);
  cursor: pointer;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.slider-container label {
  font-size: 0.875rem;
  color: var(--text-color);
  min-width: 80px;
}

.slider-container input[type="range"] {
  flex: 1;
}

.slider-container span {
  font-size: 0.875rem;
  color: var(--text-muted);
  min-width: 40px;
  text-align: right;
}

/* 控制按钮样式 */
.control-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--secondary-bg);
  color: var(--text-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.btn:hover {
  border-color: var(--accent-color);
  background: var(--primary-bg);
}

.btn.btn-active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 0.8rem;
}

.btn-icon {
  font-size: 1rem;
}

/* 阴影设置样式 */
.shadow-settings {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
}

.section-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 10px;
}

.shadow-offset {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.control-item label {
  font-size: 0.875rem;
  color: var(--text-color);
  min-width: 60px;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  cursor: pointer;
  background: var(--secondary-bg);
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  border: 2px solid var(--border-color);
  cursor: pointer;
}

/* 导出进度条样式 */
.export-progress {
  margin-top: 10px;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

/* 导出设置弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 按钮状态样式 */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:disabled:hover {
  transform: none;
  box-shadow: var(--shadow-sm);
}

/* 快捷键提示样式 */
.shortcut-tips {
  margin-top: 12px;
  padding: 10px;
  background: var(--primary-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  font-size: 1rem;
  width: 16px;
  text-align: center;
}

.tip-text {
  flex: 1;
  line-height: 1.3;
}
</style> 