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
      <!-- 渐变边框 -->
      <div v-if="isGradient" class="gradient-border-inner" :style="gradientBorderStyle"></div>
      <!-- 普通边框 -->
      <div v-else-if="box.type === 'circle'" class="circle-border" :style="plainCircleStyle"></div>
      <div v-else class="rectangle-border" :style="plainRectangleStyle"></div>
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
import { computed, ref, watch, onUnmounted } from 'vue'
import { useBorderInteraction } from '../composables/useBorderInteraction.js'
import { applySnapPosition, SNAP_THRESHOLD } from '../utils/snapGuides.js'

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

const interaction = useBorderInteraction()
const { 
  isDragging, 
  isResizing,
  resizeHandles,
  setAspectRatioLocked,
  cleanup,
  startResize
} = interaction

const localBox = ref({ ...props.box })

// 拖拽时缓存的 wrapperRect，避免每帧 getBoundingClientRect
let cachedWrapperRect = null
let cachedZoomScale = 1

const isDraggingLocal = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragStartMousePos = ref({ x: 0, y: 0 })

const handleMouseDown = (event) => {
  event.preventDefault()
  event.stopPropagation()
  
  emit('select', props.index)
  
  const imageWrapper = document.querySelector('.image-wrapper')
  if (!imageWrapper) return
  
  // 缓存 wrapperRect，整个拖拽过程中复用
  cachedWrapperRect = imageWrapper.getBoundingClientRect()
  // 计算 zoom 缩放比例：getBoundingClientRect 包含 CSS transform，offsetWidth 不包含
  cachedZoomScale = imageWrapper.offsetWidth > 0 
    ? cachedWrapperRect.width / imageWrapper.offsetWidth 
    : 1
  
  isDraggingLocal.value = true
  dragStartPos.value = { x: localBox.value.x, y: localBox.value.y }
  dragStartMousePos.value = { 
    x: event.clientX - cachedWrapperRect.left, 
    y: event.clientY - cachedWrapperRect.top 
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (event) => {
  if (!isDraggingLocal.value || !cachedWrapperRect) return
  
  const mouseX = event.clientX - cachedWrapperRect.left
  const mouseY = event.clientY - cachedWrapperRect.top
  
  const deltaX = (mouseX - dragStartMousePos.value.x) / cachedZoomScale
  const deltaY = (mouseY - dragStartMousePos.value.y) / cachedZoomScale
  
  let newX = dragStartPos.value.x + deltaX
  let newY = dragStartPos.value.y + deltaY
  
  const constrainedPos = applyBoundaryConstraints(newX, newY, localBox.value)
  const snappedPos = applySnapToGuides(constrainedPos.x, constrainedPos.y, localBox.value)
  
  localBox.value.x = snappedPos.x
  localBox.value.y = snappedPos.y
  
  emit('update', props.index, { ...localBox.value })
}

const handleMouseUp = () => {
  isDraggingLocal.value = false
  cachedWrapperRect = null
  cachedZoomScale = 1
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const applyBoundaryConstraints = (x, y, box) => {
  const { width, height } = box
  const { width: canvasWidth, height: canvasHeight } = props.canvasSize
  
  const maxX = Math.max(0, canvasWidth - width)
  const maxY = Math.max(0, canvasHeight - height)
  
  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY))
  }
}

const applySnapToGuides = (x, y, box) => {
  const { width, height } = box
  const { width: canvasWidth, height: canvasHeight } = props.canvasSize

  // 过滤掉当前边框
  const otherRects = props.otherBoxes
    .filter(ob => ob.index !== props.index)
    .map(ob => ({ x: ob.x, y: ob.y, width: ob.width, height: ob.height }))

  const { snappedX, snappedY, guides } = applySnapPosition(
    x, y, width, height, canvasWidth, canvasHeight, otherRects, SNAP_THRESHOLD
  )

  if (isDraggingLocal.value && guides.length > 0) {
    emit('snap-guides', guides)
  } else if (!isDraggingLocal.value) {
    emit('snap-guides', [])
  }

  return { x: snappedX, y: snappedY }
}

watch(() => props.box, (newBox) => {
  localBox.value = { ...newBox }
}, { deep: true })

watch(() => props.lockAspectRatio, (locked) => {
  setAspectRatioLocked(locked)
}, { immediate: true })

const boxStyle = computed(() => {
  const { x, y, width, height } = localBox.value
  // 使用数组索引作为基础 zIndex，确保层级顺序与列表顺序严格一致
  // 活跃边框额外提升到更高层级，避免被其他边框遮挡
  const baseZIndex = props.index + 1
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: props.isActive ? baseZIndex + 1000 : baseZIndex
  }
})

const isGradient = computed(() => {
  return localBox.value.color.startsWith('linear-gradient(') || localBox.value.color.startsWith('radial-gradient(')
})

// 渐变边框：使用 mask 技术绘制纯色边框区域
const gradientBorderStyle = computed(() => {
  const { borderWidth, color, borderRadius, type, shadowEnabled, shadowColor, shadowX, shadowY, shadowBlur } = localBox.value
  const br = type === 'circle' ? '50%' : `${borderRadius}px`
  
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    width: '100%',
    height: '100%',
    borderRadius: br,
    background: color,
    // WebKit mask 方案
    WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    WebkitMaskComposite: 'xor',
    // 标准 mask 方案
    mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    maskComposite: 'exclude',
    padding: `${borderWidth}px`,
    boxShadow: shadowEnabled 
      ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
      : 'none',
    pointerEvents: 'none'
  }
})

// 普通圆形边框
const plainCircleStyle = computed(() => {
  const { borderWidth, color, shadowEnabled, shadowColor, shadowX, shadowY, shadowBlur } = localBox.value
  return {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: `${borderWidth}px solid ${color}`,
    boxShadow: shadowEnabled 
      ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
      : 'none'
  }
})

// 普通矩形边框
const plainRectangleStyle = computed(() => {
  const { borderWidth, color, borderRadius, type, shadowEnabled, shadowColor, shadowX, shadowY, shadowBlur } = localBox.value
  return {
    width: '100%',
    height: '100%',
    borderRadius: type === 'circle' ? '50%' : `${borderRadius}px`,
    border: `${borderWidth}px solid ${color}`,
    boxShadow: shadowEnabled 
      ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
      : 'none'
  }
})

const handleResizeStart = (event, handlePosition) => {
  const originalBox = { ...localBox.value }
  // 缓存 wrapperRect
  const imageWrapper = document.querySelector('.image-wrapper')
  if (imageWrapper) {
    cachedWrapperRect = imageWrapper.getBoundingClientRect()
  }
  
  startResize(event, handlePosition, props.index, originalBox, (index, updates) => {
    Object.assign(localBox.value, updates)
    emit('update', index, localBox.value)
  })
}

watch([isDragging, isResizing, isDraggingLocal], ([dragging, resizing, draggingLocal]) => {
  if (dragging || resizing || draggingLocal) {
    document.body.style.userSelect = 'none'
    document.body.style.cursor = (dragging || draggingLocal) ? 'grabbing' : 'auto'
  } else {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    cachedWrapperRect = null
    cachedZoomScale = 1
  }
})

onUnmounted(() => {
  cleanup()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  cachedWrapperRect = null
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
  box-shadow: none;
}

.border-box.dragging {
  opacity: 0.7;
  cursor: grabbing;
  box-shadow: 0 0 0 2px #5e6ad2, 0 4px 12px rgba(94, 106, 210, 0.3);
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
  background: #ffffff;
  border: 2px solid #5e6ad2;
  border-radius: 4px;
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
  border: none;
  pointer-events: none;
  z-index: 9;
}

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

.gradient-border-inner {
  pointer-events: none;
  z-index: 0;
}

.circle-border,
.rectangle-border {
  width: 100%;
  height: 100%;
}

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
