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
import { useBorderInteraction } from '../composables/useBorderInteraction.js'
import { useImageProcessor } from '../composables/useImageProcessor.js'
import { useUndoRedo } from '../composables/useUndoRedo.js'
import { globalCoordinateMapper, getCurrentContainerSize } from '../utils/coordinateMapper.js'
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
  }
})

const emit = defineEmits(['update'])

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
    display: 'inline-block'
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
  
  // 如果坐标映射器还没有初始化，使用原始坐标
  if (!globalCoordinateMapper.previewSize.width) {
    return store.cropBoxes
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
  
  console.log('画布尺寸更新:', {
    imageDisplaySize: imageDisplaySize.value,
    canvasSize: canvasSize.value,
    containerSize: containerSize,
    previewSize: globalCoordinateMapper.previewSize
  })
  
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
  console.log('选中边框:', {
    index,
    previousIndex: selectedBoxIndex.value,
    box: displayBoxes.value[index]
  })
  
  selectedBoxIndex.value = index
  store.setActiveBox(index)
  
  // 清除辅助线
  guides.value = []
}

const exportImage = async () => {
  if (!store.currentImage || store.cropBoxes.length === 0) {
    alert('请先添加边框')
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
    alert('导出失败，请重试')
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
const handleResize = () => {
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
}

// 键盘快捷键
const handleKeydown = (event) => {
  // 调试：记录所有键盘事件
  console.log('键盘事件:', {
    key: event.key,
    code: event.code,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    selectedBoxIndex: selectedBoxIndex.value,
    hasDisplayBoxes: displayBoxes.value.length > 0
  })
  
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
      console.log('键盘移动边框:', {
        key: event.key,
        shiftKey: event.shiftKey,
        baseStep,
        deltaX,
        deltaY,
        selectedBoxIndex: selectedBoxIndex.value,
        currentPosition: { x: selectedBox.x, y: selectedBox.y }
      })
      
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
      
      console.log('边框移动完成:', {
        newPosition: { x: constrainedX, y: constrainedY },
        originalPosition: originalBox
      })
      
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
  
  console.log('点击事件分析:', {
    target: event.target,
    targetClass: event.target.className,
    targetTag: event.target.tagName,
    isBorderElement,
    isImageElement,
    isGuideElement,
    shouldDeselect: !isBorderElement && !isImageElement && !isGuideElement
  })
  
  // 如果点击的不是边框、图片或辅助线，则取消选中
  if (!isBorderElement && !isImageElement && !isGuideElement) {
    console.log('点击空白区域，取消选中边框')
    selectedBoxIndex.value = -1
    store.setActiveBox(-1)
    guides.value = []
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听图片变化
watch(() => store.currentImage, (newImage) => {
  if (newImage) {
    onImageLoad()
  }
}, { immediate: true })

// 计算辅助线
const calculateSnapGuides = (box, otherBoxes) => {
  const guides = []
  const snapThreshold = 10
  
  // 使用图片的实际显示尺寸，而不是容器尺寸
  const { width: canvasWidth, height: canvasHeight } = canvasSize.value
  
  // 图片边界辅助线
  // 左边界
  if (Math.abs(box.x) < snapThreshold) {
    guides.push({ type: 'vertical', x: 0 })
  }
  
  // 右边界
  if (Math.abs(box.x + box.width - canvasWidth) < snapThreshold) {
    guides.push({ type: 'vertical', x: canvasWidth })
  }
  
  // 上边界
  if (Math.abs(box.y) < snapThreshold) {
    guides.push({ type: 'horizontal', y: 0 })
  }
  
  // 下边界
  if (Math.abs(box.y + box.height - canvasHeight) < snapThreshold) {
    guides.push({ type: 'horizontal', y: canvasHeight })
  }
  
  // 图片中心线辅助线
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  const canvasCenterX = canvasWidth / 2
  const canvasCenterY = canvasHeight / 2
  
  if (Math.abs(centerX - canvasCenterX) < snapThreshold) {
    guides.push({ type: 'vertical', x: canvasCenterX })
  }
  
  if (Math.abs(centerY - canvasCenterY) < snapThreshold) {
    guides.push({ type: 'horizontal', y: canvasCenterY })
  }
  
  // 其他边框辅助线
  otherBoxes.forEach(otherBox => {
    // 左对齐
    if (Math.abs(box.x - otherBox.x) < snapThreshold) {
      guides.push({ type: 'vertical', x: otherBox.x })
    }
    
    // 右对齐
    if (Math.abs(box.x + box.width - (otherBox.x + otherBox.width)) < snapThreshold) {
      guides.push({ type: 'vertical', x: otherBox.x + otherBox.width })
    }
    
    // 上对齐
    if (Math.abs(box.y - otherBox.y) < snapThreshold) {
      guides.push({ type: 'horizontal', y: otherBox.y })
    }
    
    // 下对齐
    if (Math.abs(box.y + box.height - (otherBox.y + otherBox.height)) < snapThreshold) {
      guides.push({ type: 'horizontal', y: otherBox.y + otherBox.height })
    }
    
    // 中心对齐
    const otherCenterX = otherBox.x + otherBox.width / 2
    const otherCenterY = otherBox.y + otherBox.height / 2
    
    if (Math.abs(centerX - otherCenterX) < snapThreshold) {
      guides.push({ type: 'vertical', x: otherCenterX })
    }
    
    if (Math.abs(centerY - otherCenterY) < snapThreshold) {
      guides.push({ type: 'horizontal', y: otherCenterY })
    }
  })
  
  return { guides }
}

// 处理吸附辅助线
const handleSnapGuides = (snapGuides) => {
  if (props.showAlignmentGuides) {
    guides.value = snapGuides
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
      console.log('使用坐标映射器的预览尺寸:', globalCoordinateMapper.previewSize)
      return globalCoordinateMapper.previewSize
    }
    
    // 否则使用本地状态
    console.log('使用本地状态的显示尺寸:', imageDisplaySize.value)
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
  outline: 2px solid #3b82f6;
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
  background: rgba(59, 130, 246, 0.9);
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
</style> 