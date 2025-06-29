<template>
  <div 
    class="border-box"
    :class="{ 
      'active': isActive,
      'dragging': isDragging || isDraggingLocal,
      'resizing': isResizing 
    }"
    :style="boxStyle"
    ref="dragRef"
    @mousedown="handleMouseDown"
  >
    <!-- 边框内容 -->
    <div class="border-content">
      <div 
        v-if="box.type === 'circle'"
        class="circle-border"
        :class="{ 'gradient-border': isGradient }"
        :style="circleStyle"
      >
        <div v-if="isGradient" class="gradient-border-inner" :style="gradientBorderStyle"></div>
      </div>
      <div 
        v-else
        class="rectangle-border"
        :class="{ 'gradient-border': isGradient }"
        :style="rectangleStyle"
      >
        <div v-if="isGradient" class="gradient-border-inner" :style="gradientBorderStyle"></div>
      </div>
    </div>

    <!-- 调整大小手柄 -->
    <template v-if="isActive">
      <div 
        v-for="handle in resizeHandles"
        :key="handle.position"
        class="resize-handle"
        :class="`handle-${handle.position}`"
        :style="{ cursor: handle.cursor }"
        @mousedown.stop="handleResizeStart($event, handle.position)"
      ></div>
    </template>

    <!-- 选择指示器 -->
    <div v-if="isActive" class="selection-indicator"></div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted, onMounted } from 'vue'
import { useBorderInteraction } from '../composables/useBorderInteraction.js'
import { BorderRenderer } from '../utils/borderRenderer.js'

const props = defineProps({
  box: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  lockAspectRatio: {
    type: Boolean,
    default: false
  },
  otherBoxes: {
    type: Array,
    default: () => []
  },
  canvasSize: {
    type: Object,
    default: () => ({ width: 800, height: 600 })
  }
})

const emit = defineEmits(['update', 'select', 'snap-guides'])

// 使用边框交互逻辑
const { 
  isDragging, 
  isResizing, 
  activeBoxIndex, 
  resizeHandles,
  startDrag, 
  startResize, 
  setAspectRatioLocked,
  cleanup 
} = useBorderInteraction()

// 本地状态
const localBox = ref({ ...props.box })

// 拖拽绑定
const dragRef = ref(null)

onMounted(() => {
  console.log('dragRef', dragRef.value)
})

// 原生拖拽实现
const isDraggingLocal = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragStartMousePos = ref({ x: 0, y: 0 })
const snapThreshold = ref(10) // 吸附阈值

const handleMouseDown = (event) => {
  console.log('鼠标按下', event)
  event.preventDefault()
  event.stopPropagation()
  
  // 选择边框
  emit('select', props.index)
  
  // 获取图片包装器的位置信息
  const imageWrapper = document.querySelector('.image-wrapper')
  if (!imageWrapper) return
  
  const wrapperRect = imageWrapper.getBoundingClientRect()
  
  // 开始拖拽
  isDraggingLocal.value = true
  dragStartPos.value = { x: localBox.value.x, y: localBox.value.y }
  // 记录鼠标相对于图片包装器的起始位置
  dragStartMousePos.value = { 
    x: event.clientX - wrapperRect.left, 
    y: event.clientY - wrapperRect.top 
  }
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event) => {
  if (!isDraggingLocal.value) return
  
  console.log('鼠标移动', event.clientX, event.clientY)
  
  // 获取图片包装器的位置信息
  const imageWrapper = document.querySelector('.image-wrapper')
  
  if (!imageWrapper) return
  
  // 获取图片包装器的位置信息
  const wrapperRect = imageWrapper.getBoundingClientRect()
  
  // 计算鼠标相对于图片包装器的位置
  const mouseX = event.clientX - wrapperRect.left
  const mouseY = event.clientY - wrapperRect.top
  
  // 计算鼠标移动距离（相对于图片包装器）
  const deltaX = mouseX - dragStartMousePos.value.x
  const deltaY = mouseY - dragStartMousePos.value.y
  
  // 调试输出坐标转换信息
  console.log('坐标转换:', {
    clientPos: { x: event.clientX, y: event.clientY },
    wrapperRect: { left: wrapperRect.left, top: wrapperRect.top, width: wrapperRect.width, height: wrapperRect.height },
    mouseRelativeToWrapper: { x: mouseX, y: mouseY },
    delta: { x: deltaX, y: deltaY },
    dragStartPos: dragStartPos.value,
    dragStartMousePos: dragStartMousePos.value
  })
  
  // 计算新位置
  let newX = dragStartPos.value.x + deltaX
  let newY = dragStartPos.value.y + deltaY
  
  // 应用边界约束
  const constrainedPos = applyBoundaryConstraints(newX, newY, localBox.value)
  
  // 应用吸附功能
  const snappedPos = applySnapToGuides(constrainedPos.x, constrainedPos.y, localBox.value)
  
  // 更新位置
  localBox.value.x = snappedPos.x
  localBox.value.y = snappedPos.y
  
  console.log('拖拽中，当前 box', localBox.value)
  emit('update', props.index, { ...localBox.value })
}

const handleMouseUp = () => {
  console.log('鼠标释放')
  isDraggingLocal.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 边界约束函数
const applyBoundaryConstraints = (x, y, box) => {
  const { width, height } = box
  
  // 直接使用传入的canvasSize，这个值已经是图片的实际显示尺寸
  const { width: canvasWidth, height: canvasHeight } = props.canvasSize
  
  // 确保不超出图片边界，边框完全在图片内
  const maxX = Math.max(0, canvasWidth - width)
  const maxY = Math.max(0, canvasHeight - height)
  
  const constrainedX = Math.max(0, Math.min(x, maxX))
  const constrainedY = Math.max(0, Math.min(y, maxY))
  
  // 调试输出
  if (isDraggingLocal.value) {
    console.log('边界约束详情:', {
      original: { x, y },
      canvasSize: { width: canvasWidth, height: canvasHeight },
      box: { width, height },
      max: { x: maxX, y: maxY },
      constrained: { x: constrainedX, y: constrainedY },
      propsCanvasSize: props.canvasSize
    })
  }
  
  return {
    x: constrainedX,
    y: constrainedY
  }
}

// 吸附功能函数
const applySnapToGuides = (x, y, box) => {
  let snappedX = x
  let snappedY = y
  const { width, height } = box
  const { width: canvasWidth, height: canvasHeight } = props.canvasSize
  const snapGuides = []
  
  // 图片边界吸附
  // 左边界
  if (Math.abs(x) < snapThreshold.value) {
    snappedX = 0
    snapGuides.push({ type: 'vertical', x: 0 })
  }
  
  // 右边界
  if (Math.abs(x + width - canvasWidth) < snapThreshold.value) {
    snappedX = canvasWidth - width
    snapGuides.push({ type: 'vertical', x: canvasWidth })
  }
  
  // 上边界
  if (Math.abs(y) < snapThreshold.value) {
    snappedY = 0
    snapGuides.push({ type: 'horizontal', y: 0 })
  }
  
  // 下边界
  if (Math.abs(y + height - canvasHeight) < snapThreshold.value) {
    snappedY = canvasHeight - height
    snapGuides.push({ type: 'horizontal', y: canvasHeight })
  }
  
  // 图片中心线吸附
  const centerX = x + width / 2
  const centerY = y + height / 2
  const canvasCenterX = canvasWidth / 2
  const canvasCenterY = canvasHeight / 2
  
  if (Math.abs(centerX - canvasCenterX) < snapThreshold.value) {
    snappedX = canvasCenterX - width / 2
    snapGuides.push({ type: 'vertical', x: canvasCenterX })
  }
  
  if (Math.abs(centerY - canvasCenterY) < snapThreshold.value) {
    snappedY = canvasCenterY - height / 2
    snapGuides.push({ type: 'horizontal', y: canvasCenterY })
  }
  
  // 其他边框吸附
  props.otherBoxes.forEach(otherBox => {
    if (otherBox.index === props.index) return // 跳过自己
    
    // 水平对齐吸附
    if (Math.abs(y - otherBox.y) < snapThreshold.value) {
      snappedY = otherBox.y
      snapGuides.push({ type: 'horizontal', y: otherBox.y })
    }
    if (Math.abs((y + height) - (otherBox.y + otherBox.height)) < snapThreshold.value) {
      snappedY = otherBox.y + otherBox.height - height
      snapGuides.push({ type: 'horizontal', y: otherBox.y + otherBox.height })
    }
    if (Math.abs((y + height / 2) - (otherBox.y + otherBox.height / 2)) < snapThreshold.value) {
      snappedY = otherBox.y + otherBox.height / 2 - height / 2
      snapGuides.push({ type: 'horizontal', y: otherBox.y + otherBox.height / 2 })
    }
    
    // 垂直对齐吸附
    if (Math.abs(x - otherBox.x) < snapThreshold.value) {
      snappedX = otherBox.x
      snapGuides.push({ type: 'vertical', x: otherBox.x })
    }
    if (Math.abs((x + width) - (otherBox.x + otherBox.width)) < snapThreshold.value) {
      snappedX = otherBox.x + otherBox.width - width
      snapGuides.push({ type: 'vertical', x: otherBox.x + otherBox.width })
    }
    if (Math.abs((x + width / 2) - (otherBox.x + otherBox.width / 2)) < snapThreshold.value) {
      snappedX = otherBox.x + otherBox.width / 2 - width / 2
      snapGuides.push({ type: 'vertical', x: otherBox.x + otherBox.width / 2 })
    }
  })
  
  // 发送辅助线数据给父组件
  if (isDraggingLocal.value && snapGuides.length > 0) {
    emit('snap-guides', snapGuides)
  } else if (!isDraggingLocal.value) {
    emit('snap-guides', [])
  }
  
  return { x: snappedX, y: snappedY }
}

// 监听props变化
watch(() => props.box, (newBox) => {
  localBox.value = { ...newBox }
}, { deep: true })

// 监听锁定宽高比状态变化
watch(() => props.lockAspectRatio, (locked) => {
  setAspectRatioLocked(locked)
}, { immediate: true })

// 计算样式
const boxStyle = computed(() => {
  const { x, y, width, height } = localBox.value
  
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: props.isActive ? 10 : 1
  }
})

// 检查是否为渐变色
const isGradient = computed(() => {
  return localBox.value.color.includes('gradient')
})

// 渐变边框样式
const gradientBorderStyle = computed(() => {
  const { borderWidth, color, borderRadius, type } = localBox.value
  
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: type === 'circle' ? '50%' : `${borderRadius}px`,
    background: color,
    mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    maskComposite: 'exclude',
    WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    WebkitMaskComposite: 'xor',
    padding: `${borderWidth}px`
  }
})

const circleStyle = computed(() => {
  const { borderWidth, color, shadowEnabled, shadowColor, shadowX, shadowY, shadowBlur } = localBox.value
  
  // 检查是否为渐变色
  const isGradient = color.includes('gradient')
  
  if (isGradient) {
    // 使用伪元素方法渲染渐变边框
    return {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      position: 'relative',
      boxShadow: shadowEnabled 
        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
        : 'none'
    }
  } else {
    // 普通颜色边框
    return {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: `${borderWidth}px solid ${color}`,
      boxShadow: shadowEnabled 
        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
        : 'none'
    }
  }
})

const rectangleStyle = computed(() => {
  const { 
    borderWidth, 
    color, 
    borderRadius, 
    type,
    shadowEnabled, 
    shadowColor, 
    shadowX, 
    shadowY, 
    shadowBlur 
  } = localBox.value
  
  // 检查是否为渐变色
  const isGradient = color.includes('gradient')
  
  if (isGradient) {
    // 使用伪元素方法渲染渐变边框
    return {
      width: '100%',
      height: '100%',
      borderRadius: type === 'circle' ? '50%' : `${borderRadius}px`,
      position: 'relative',
      boxShadow: shadowEnabled 
        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
        : 'none'
    }
  } else {
    // 普通颜色边框
    return {
      width: '100%',
      height: '100%',
      borderRadius: type === 'circle' ? '50%' : `${borderRadius}px`,
      border: `${borderWidth}px solid ${color}`,
      boxShadow: shadowEnabled 
        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
        : 'none'
    }
  }
})

// 事件处理
const handleResizeStart = (event, handlePosition) => {
  // 开始调整大小
  startResize(event, handlePosition, props.index, localBox.value, (index, updates) => {
    // 更新本地状态
    Object.assign(localBox.value, updates)
    // 触发更新事件
    emit('update', index, localBox.value)
  })
}

// 监听拖拽和调整大小状态变化
watch([isDragging, isResizing, isDraggingLocal], ([dragging, resizing, draggingLocal]) => {
  if (dragging || resizing || draggingLocal) {
    // 添加全局样式
    document.body.style.userSelect = 'none'
    document.body.style.cursor = (dragging || draggingLocal) ? 'grabbing' : 'auto'
  } else {
    // 恢复全局样式
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }
})

// 组件卸载时清理
onUnmounted(() => {
  cleanup()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.border-box {
  position: absolute;
  cursor: move;
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
  animation: fadeIn 0.2s ease-out;
}

.border-box.active {
  box-shadow: 0 0 0 2px #3b82f6;
}

.border-box.dragging {
  opacity: 0.7;
  cursor: grabbing;
  box-shadow: 0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: opacity 0.2s ease, box-shadow 0.2s ease;
}

.border-box.resizing {
  opacity: 0.8;
}

.border-content {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border: 1px solid white;
  border-radius: 50%;
  z-index: 11;
}

.handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
.handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
.handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.handle-se { bottom: -4px; right: -4px; cursor: se-resize; }
.handle-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.handle-w { left: -4px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
.handle-e { right: -4px; top: 50%; transform: translateY(-50%); cursor: e-resize; }

.selection-indicator {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px dashed #3b82f6;
  pointer-events: none;
  z-index: 9;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 渐变边框样式 */
.gradient-border {
  position: relative;
}

.gradient-border-inner {
  pointer-events: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .resize-handle {
    width: 12px;
    height: 12px;
  }
  
  .handle-nw { top: -6px; left: -6px; }
  .handle-ne { top: -6px; right: -6px; }
  .handle-sw { bottom: -6px; left: -6px; }
  .handle-se { bottom: -6px; right: -6px; }
  .handle-n { top: -6px; }
  .handle-s { bottom: -6px; }
  .handle-w { left: -6px; }
  .handle-e { right: -6px; }
}
</style> 