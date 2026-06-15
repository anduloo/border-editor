<template>
  <div 
    class="image-editor" 
    :class="{ 'has-selected-box': selectedBoxIndex >= 0 }"
    ref="editorRef" 
    tabindex="0" 
    @keydown="handleKeydown" 
    @click="handleContainerClick"
  >
    <div class="canvas-container" ref="containerRef" tabindex="-1">
      <!-- 图片包装器，用于正确定位边框 -->
      <div class="image-wrapper" :style="imageWrapperStyle">
        <img 
          v-if="store.currentImage" 
          :src="store.currentImage.url" 
          :style="imageStyle"
          draggable="false"
          @dragstart.prevent
          @load="onImageLoad"
          ref="imageRef"
        />
        
        <!-- 边框组件 -->
        <BorderBox
          v-for="(box, index) in displayBoxes"
          :key="box.id"
          :box="box"
          :index="index"
          :is-active="selectedBoxIndex === index"
          :lock-aspect-ratio="lockAspectRatio"
          :other-boxes="getOtherBoxes(index)"
          :canvas-size="canvasSize"
          @update="updateBox"
          @select="selectBox"
          @snap-guides="handleSnapGuides"
        />
        
        <!-- 辅助线 -->
        <Guides 
          v-if="showAlignmentGuides && guides.length > 0"
          :guides="guides"
        />
  </div>
  
  <!-- 右键菜单 -->
  <Teleport to="body">
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="context-menu-item" @click="handleContextMenuAction('export')">
        <svg class="context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>快速导出</span>
        <span class="context-shortcut">Ctrl+S</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('advanced-export')">
        <svg class="context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>高级导出...</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleContextMenuAction('add-rectangle')">
        <svg class="context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        <span>添加矩形边框</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('add-square')">
        <svg class="context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        <span>添加正方形边框</span>
      </div>
      <div class="context-menu-item" @click="handleContextMenuAction('add-circle')">
        <svg class="context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
        <span>添加圆形边框</span>
      </div>
      <div class="context-menu-divider"></div>
      <div 
        class="context-menu-item" 
        :class="{ 'disabled': selectedBoxIndex < 0 }"
        @click="handleContextMenuAction('delete')"
      >
        <svg class="context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        <span>删除边框</span>
        <span class="context-shortcut">Delete</span>
      </div>
      <div 
        class="context-menu-item" 
        :class="{ 'disabled': selectedBoxIndex < 0 }"
        @click="handleContextMenuAction('duplicate')"
      >
        <svg class="context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        <span>复制边框</span>
        <span class="context-shortcut">Ctrl+D</span>
      </div>
      <div class="context-menu-divider"></div>
      <div 
        class="context-menu-item" 
        :class="{ 'disabled': selectedBoxIndex < 0 }"
        @click="handleContextMenuAction('layer-top')"
      >
        <span>置顶</span>
        <span class="context-shortcut">⌘⌥↑</span>
      </div>
      <div 
        class="context-menu-item" 
        :class="{ 'disabled': selectedBoxIndex < 0 }"
        @click="handleContextMenuAction('layer-up')"
      >
        <span>上移一层</span>
        <span class="context-shortcut">⌘↑</span>
      </div>
      <div 
        class="context-menu-item" 
        :class="{ 'disabled': selectedBoxIndex < 0 }"
        @click="handleContextMenuAction('layer-down')"
      >
        <span>下移一层</span>
        <span class="context-shortcut">⌘↓</span>
      </div>
      <div 
        class="context-menu-item" 
        :class="{ 'disabled': selectedBoxIndex < 0 }"
        @click="handleContextMenuAction('layer-bottom')"
      >
        <span>置底</span>
        <span class="context-shortcut">⌘⌥↓</span>
      </div>
    </div>
  </Teleport>
  
  <!-- 进度条 -->
      <ProgressBar
        :show="isProcessing"
        :progress="progress"
        title="处理图片中..."
        :message="progressMessage"
      />
      
      <!-- 状态指示器 -->
      <div v-if="selectedBoxIndex >= 0" class="status-indicator">
        <span class="status-text">边框 {{ selectedBoxIndex + 1 }} 已选中</span>
        <span class="status-hint">使用方向键调整位置</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useEditorStore } from '../stores/editor.js'
import { useImageProcessor } from '../composables/useImageProcessor.js'
import { useUndoRedo } from '../composables/useUndoRedo.js'
import { globalCoordinateMapper, getCurrentContainerSize } from '../utils/coordinateMapper.js'
import { getSnapGuides } from '../utils/snapGuides.js'
import { debounce } from '../utils/performance.js'
import BorderBox from './BorderBox.vue'
import ProgressBar from './ProgressBar.vue'
import Guides from './Guides.vue'

const props = defineProps({
  image: {
    type: Object,
    default: null
  },
  lockAspectRatio: {
    type: Boolean,
    default: false
  },
  showAlignmentGuides: {
    type: Boolean,
    default: true
  },
  zoomLevel: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['update', 'toast', 'add-box', 'context-export', 'context-advanced-export'])

// 组件引用
const editorRef = ref(null)
const containerRef = ref(null)
const imageRef = ref(null)

// Store
const store = useEditorStore()

// 组合式函数
const { processImage, downloadImage, isProcessing, progress, getImageDisplaySize, validateBoxes } = useImageProcessor()
const { saveState, undo, redo, isUndoAvailable, isRedoAvailable } = useUndoRedo()

// 本地状态
const selectedBoxIndex = ref(-1)
const imageDisplaySize = ref({ width: 0, height: 0 })
const progressMessage = ref('正在处理...')
const guides = ref([])
const canvasSize = ref({ width: 800, height: 600 })

// 计算属性
const imageWrapperStyle = computed(() => {
  if (!imageDisplaySize.value.width || !imageDisplaySize.value.height) {
    return {}
  }
  
  return {
    position: 'relative',
    width: `${imageDisplaySize.value.width}px`,
    height: `${imageDisplaySize.value.height}px`,
    display: 'inline-block',
    transform: `scale(${props.zoomLevel})`,
    transformOrigin: 'center center',
    transition: 'transform 0.15s ease'
  }
})

const imageStyle = computed(() => {
  if (!imageDisplaySize.value.width || !imageDisplaySize.value.height) {
    return {}
  }
  
  return {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'contain'
  }
})

const displayBoxes = computed(() => {
  // 如果没有图片，返回空数组
  if (!store.currentImage) {
    return []
  }
  
  // 如果坐标映射器还没有初始化，立即初始化
  // 这防止竞态条件：displayBoxes 返回原始坐标量级的 box，
  // 但之后映射器初始化 → BorderBox 的 localBox 仍持有旧值，
  // 拖拽时误将原始坐标乘以 scaleRatio 导致宽高爆炸到图片尺寸
  if (!globalCoordinateMapper.previewSize.width) {
    const containerSize = getCurrentContainerSize()
    globalCoordinateMapper.init(store.currentImage, containerSize)
    imageDisplaySize.value = globalCoordinateMapper.previewSize
    canvasSize.value = {
      width: globalCoordinateMapper.previewSize.width,
      height: globalCoordinateMapper.previewSize.height
    }
  }
  
  // 转换边框坐标（从原始坐标到预览坐标）
  const convertedBoxes = store.cropBoxes.map(box => 
    globalCoordinateMapper.convertBoxOriginalToPreview(box)
  )
  return convertedBoxes
})

// 获取其他边框数据（排除当前边框）
const getOtherBoxes = (currentIndex) => {
  return displayBoxes.value
    .map((box, index) => ({ ...box, index }))
    .filter((_, index) => index !== currentIndex)
}

// 方法
const onImageLoad = async () => {
  if (!store.currentImage) return
  
  await nextTick()
  
  // 计算图片显示尺寸
  const containerSize = getCurrentContainerSize()
  globalCoordinateMapper.init(store.currentImage, containerSize)
  imageDisplaySize.value = globalCoordinateMapper.previewSize
  
  // 更新画布尺寸 - 使用图片的实际显示尺寸，而不是容器尺寸
  canvasSize.value = {
    width: globalCoordinateMapper.previewSize.width,
    height: globalCoordinateMapper.previewSize.height
  }
  
  // 验证和约束边框坐标
  const validatedBoxes = validateBoxes(store.cropBoxes, store.currentImage)
  if (JSON.stringify(validatedBoxes) !== JSON.stringify(store.cropBoxes)) {
    store.cropBoxes = validatedBoxes
  }
  
  // 保存初始状态
  saveState({
    boxes: store.cropBoxes,
    image: store.currentImage
  })
}

const updateBox = (index, updatedBox) => {
  // 极值保护：防止坐标映射器未初始化或异常导致的数值爆炸
  const maxSafeBoxSize = Math.max(
    (store.currentImage?.width || 10000) * 10,
    (store.currentImage?.height || 10000) * 10
  )
  if (updatedBox.width > maxSafeBoxSize || updatedBox.height > maxSafeBoxSize ||
      updatedBox.borderWidth > 10000 || updatedBox.borderRadius > 10000) {
    return
  }
  
  // 转换回原始坐标
  const originalBox = globalCoordinateMapper.convertBoxPreviewToOriginal(updatedBox)
  
  // 更新store
  store.updateBox(index, originalBox)
  
  // 计算辅助线
  if (props.showAlignmentGuides) {
    const otherBoxes = displayBoxes.value.filter((_, i) => i !== index)
    const snapResult = calculateSnapGuides(updatedBox, otherBoxes)
    guides.value = snapResult.guides
  }
  
  // 保存状态到历史记录
  saveState({
    boxes: store.cropBoxes,
    image: store.currentImage
  })
  
  emit('update')
}

const selectBox = (index) => {
  selectedBoxIndex.value = index
  store.setActiveBox(index)
  
  // 清除辅助线
  guides.value = []
}

/**
 * @deprecated 直接导出入口已废弃，实际导出逻辑由 App.vue 中的 imageProcessor.processImage 统一处理。
 * 仅保留用于 Ctrl+S 快捷键的兼容调用，建议后续迁移到统一导出入口。
 */
const exportImage = async () => {
  if (!store.currentImage || store.cropBoxes.length === 0) {
    emit('toast', { message: '请先添加边框', type: 'error' })
    return
  }
  
  try {
    progressMessage.value = '正在处理图片...'
    
    // 确保坐标映射器已初始化
    const containerSize = getCurrentContainerSize()
    globalCoordinateMapper.init(store.currentImage, containerSize)
    
    const blob = await processImage(store.currentImage, store.cropBoxes)
    
    progressMessage.value = '正在下载...'
    downloadImage(blob, `edited-${store.currentImage.name || 'image'}.png`)
    
    progressMessage.value = '处理完成'
  } catch (error) {
    console.error('导出失败:', error)
    emit('toast', { message: '导出失败，请重试', type: 'error' })
  }
}

const handleUndo = () => {
  const previousState = undo()
  if (previousState) {
    store.cropBoxes = previousState.boxes
    emit('update')
  }
}

const handleRedo = () => {
  const nextState = redo()
  if (nextState) {
    store.cropBoxes = nextState.boxes
    emit('update')
  }
}

// 窗口大小变化处理
const handleResize = debounce(() => {
  if (!store.currentImage) return
  
  // 重新计算显示尺寸
  const containerSize = getCurrentContainerSize()
  globalCoordinateMapper.init(store.currentImage, containerSize)
  imageDisplaySize.value = globalCoordinateMapper.previewSize
  
  // 更新画布尺寸 - 使用图片的实际显示尺寸
  canvasSize.value = {
    width: globalCoordinateMapper.previewSize.width,
    height: globalCoordinateMapper.previewSize.height
  }
  
  // 重新验证边框坐标
  const validatedBoxes = validateBoxes(store.cropBoxes, store.currentImage)
  store.cropBoxes = validatedBoxes
}, 150)

// 键盘快捷键
const handleKeydown = (event) => {
  // 边框位置调整快捷键 - 只有在有边框被选中时才处理
  if (selectedBoxIndex.value >= 0 && displayBoxes.value[selectedBoxIndex.value]) {
    const selectedBox = displayBoxes.value[selectedBoxIndex.value] // 使用预览坐标
    let moved = false
    let deltaX = 0
    let deltaY = 0
    
    // 确定移动步长
    const baseStep = event.shiftKey ? 10 : 1 // Shift键加速移动
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        deltaX = -baseStep
        moved = true
        break
      case 'ArrowRight':
        event.preventDefault()
        deltaX = baseStep
        moved = true
        break
      case 'ArrowUp':
        event.preventDefault()
        deltaY = -baseStep
        moved = true
        break
      case 'ArrowDown':
        event.preventDefault()
        deltaY = baseStep
        moved = true
        break
    }
    
    // 如果边框移动了，更新位置
    if (moved) {
      const newX = selectedBox.x + deltaX
      const newY = selectedBox.y + deltaY
      
      // 约束边框在图片范围内
      const { width: canvasWidth, height: canvasHeight } = canvasSize.value
      const constrainedX = Math.max(0, Math.min(newX, canvasWidth - selectedBox.width))
      const constrainedY = Math.max(0, Math.min(newY, canvasHeight - selectedBox.height))
      
      // 创建更新后的预览坐标边框
      const updatedPreviewBox = {
        ...selectedBox,
        x: constrainedX,
        y: constrainedY
      }
      
      // 转换回原始坐标并更新
      const originalBox = globalCoordinateMapper.convertBoxPreviewToOriginal(updatedPreviewBox)
      store.updateBox(selectedBoxIndex.value, originalBox)
      
      emit('update')
      return
    }
  }
  
  // 其他快捷键
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'z':
        event.preventDefault()
        if (event.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        break
      case 'y':
        event.preventDefault()
        handleRedo()
        break
      case 's':
        event.preventDefault()
        exportImage()
        break
    }
  }
  
  // 删除选中的边框
  if (event.key === 'Delete' && selectedBoxIndex.value >= 0) {
    store.removeBox(selectedBoxIndex.value)
    selectedBoxIndex.value = -1
    emit('update')
  }
}

// 处理容器点击，取消选中
const handleContainerClick = (event) => {
  // 检查点击的目标是否是边框相关的元素
  const isBorderElement = event.target.closest('.border-box') || 
                         event.target.closest('.resize-handle') ||
                         event.target.closest('.selection-indicator')
  
  // 检查点击的目标是否是图片
  const isImageElement = event.target.tagName === 'IMG'
  
  // 检查点击的目标是否是辅助线
  const isGuideElement = event.target.closest('.guide-line')
  
  // 如果点击的不是边框、图片或辅助线，则取消选中
  if (!isBorderElement && !isImageElement && !isGuideElement) {
    selectedBoxIndex.value = -1
    store.setActiveBox(-1)
    guides.value = []
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('click', closeContextMenu)
  editorRef.value?.addEventListener('contextmenu', handleContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('click', closeContextMenu)
  editorRef.value?.removeEventListener('contextmenu', handleContextMenu)
})

// 监听图片变化
watch(() => store.currentImage, (newImage) => {
  if (newImage) {
    onImageLoad()
  }
}, { immediate: true })

// 计算辅助线 — 使用统一工具函数
const calculateSnapGuides = (box, otherBoxes) => {
  const { width: canvasWidth, height: canvasHeight } = canvasSize.value
  const guides = getSnapGuides(box, canvasWidth, canvasHeight, otherBoxes)
  return { guides }
}

// 处理吸附辅助线
const handleSnapGuides = (snapGuides) => {
  if (props.showAlignmentGuides) {
    guides.value = snapGuides
  }
}

// 右键菜单
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

const contextMenuStyle = computed(() => ({
  left: `${contextMenuPosition.value.x}px`,
  top: `${contextMenuPosition.value.y}px`
}))

const handleContextMenu = (event) => {
  event.preventDefault()
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

const closeContextMenu = () => {
  showContextMenu.value = false
}

const handleContextMenuAction = (action) => {
  closeContextMenu()
  switch (action) {
    case 'export':
      emit('context-export')
      break
    case 'advanced-export':
      emit('context-advanced-export')
      break
    case 'add-rectangle':
      emit('add-box', 'rectangle', 16/9)
      break
    case 'add-square':
      emit('add-box', 'square')
      break
    case 'add-circle':
      emit('add-box', 'circle')
      break
    case 'delete':
      if (selectedBoxIndex.value >= 0) {
        store.removeBox(selectedBoxIndex.value)
        selectedBoxIndex.value = -1
        emit('update')
      }
      break
    case 'duplicate':
      if (selectedBoxIndex.value >= 0 && store.cropBoxes[selectedBoxIndex.value]) {
        const box = { ...store.cropBoxes[selectedBoxIndex.value] }
        box.x += 20
        box.y += 20
        store.addBox(box.type || 'rectangle', box)
        emit('update')
      }
      break
    case 'layer-top':
      if (selectedBoxIndex.value >= 0) {
        store.moveToTop(selectedBoxIndex.value)
        emit('update')
      }
      break
    case 'layer-up':
      if (selectedBoxIndex.value > 0) {
        store.moveUp(selectedBoxIndex.value)
        emit('update')
      }
      break
    case 'layer-down':
      if (selectedBoxIndex.value < store.cropBoxes.length - 1) {
        store.moveDown(selectedBoxIndex.value)
        emit('update')
      }
      break
    case 'layer-bottom':
      if (selectedBoxIndex.value >= 0) {
        store.moveToBottom(selectedBoxIndex.value)
        emit('update')
      }
      break
  }
}

// 暴露方法给父组件
defineExpose({
  exportImage,
  handleUndo,
  handleRedo,
  isUndoAvailable,
  isRedoAvailable,
  getImageDisplaySize: () => {
    // 如果坐标映射器已初始化，使用其预览尺寸
    if (globalCoordinateMapper.previewSize.width && globalCoordinateMapper.previewSize.height) {
      return globalCoordinateMapper.previewSize
    }
    
    // 否则使用本地状态
    return imageDisplaySize.value
  }
})
</script>

<style scoped>
.image-editor {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: none; /* 移除默认的焦点轮廓 */
}

.image-editor:focus {
  outline: none; /* 默认不显示焦点轮廓 */
}

.image-editor:focus.has-selected-box {
  outline: 2px solid #5e6ad2;
  outline-offset: 2px;
}

.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  outline: none; /* 确保不显示焦点轮廓 */
}

.canvas-container:focus {
  outline: none !important; /* 强制不显示焦点轮廓 */
}

.image-wrapper {
  position: relative;
  display: inline-block;
}

.canvas-container img {
  display: block;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-select: none;
  -ms-user-select: none;
  pointer-events: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-container {
    border-radius: 4px;
  }
}

/* 状态指示器样式 */
.status-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(94, 106, 210, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-text {
  font-weight: 600;
}

.status-hint {
  font-size: 0.75rem;
  opacity: 0.9;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  min-width: 180px;
  z-index: 10000;
  font-size: 0.8125rem;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  color: var(--text-color, #1f2937);
}

.context-menu-item:hover {
  background: #f3f4f6;
}

.context-menu-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.context-menu-divider {
  height: 1px;
  background: var(--border-color, #e5e7eb);
  margin: 3px 0;
}

.context-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.7;
}

.context-shortcut {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--text-muted, #9ca3af);
  font-variant-numeric: tabular-nums;
}
</style> 