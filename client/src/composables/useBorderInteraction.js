// 边框交互组合式函数

import { ref, computed } from 'vue'
import { debounce, throttle, EventManager } from '../utils/performance.js'
import { applySnapPosition, SNAP_THRESHOLD } from '../utils/snapGuides.js'

export function useBorderInteraction() {
  const isDragging = ref(false)
  const isResizing = ref(false)
  const activeBoxIndex = ref(-1)
  const resizeHandle = ref(null)
  const startPosition = ref({ x: 0, y: 0 })
  const originalBoxData = ref({})
  const aspectRatioLocked = ref(false)
  const originalAspectRatio = ref(1)
  const showGuides = ref(true)
  const snapThreshold = ref(SNAP_THRESHOLD) // 吸附阈值，使用统一常量
  
  const eventManager = new EventManager()

  // 调整大小的手柄配置
  const resizeHandles = [
    { position: 'nw', cursor: 'nw-resize' },
    { position: 'ne', cursor: 'ne-resize' },
    { position: 'sw', cursor: 'sw-resize' },
    { position: 'se', cursor: 'se-resize' },
    { position: 'n', cursor: 'n-resize' },
    { position: 's', cursor: 's-resize' },
    { position: 'w', cursor: 'w-resize' },
    { position: 'e', cursor: 'e-resize' }
  ]

  /**
   * 开始拖拽
   * @param {MouseEvent} event 鼠标事件
   * @param {number} boxIndex 边框索引
   * @param {Object} currentBox 当前边框数据
   * @param {Function} onUpdate 更新回调
   * @param {Array} otherBoxes 其他边框数据
   */
  const startDrag = (event, boxIndex, currentBox, onUpdate, otherBoxes = []) => {
    event.stopPropagation()
    
    isDragging.value = true
    activeBoxIndex.value = boxIndex
    startPosition.value = { x: event.clientX, y: event.clientY }
    
    // 保存原始数据
    originalBoxData.value = { 
      x: currentBox.x, 
      y: currentBox.y, 
      width: currentBox.width, 
      height: currentBox.height 
    }
    
    // 添加事件监听器
    const throttledDrag = throttle((e) => handleDrag(e, onUpdate, otherBoxes), 16) // 60fps
    const debouncedEnd = debounce(() => endDrag(onUpdate), 100)
    
    eventManager.add(document, 'mousemove', throttledDrag)
    eventManager.add(document, 'mouseup', debouncedEnd)
  }

  /**
   * 开始调整大小
   * @param {MouseEvent} event 鼠标事件
   * @param {string} handle 调整手柄位置
   * @param {number} boxIndex 边框索引
   * @param {Object} currentBox 当前边框数据
   * @param {Function} onUpdate 更新回调
   */
  const startResize = (event, handle, boxIndex, currentBox, onUpdate) => {
    event.stopPropagation()
    
    isResizing.value = true
    resizeHandle.value = handle
    activeBoxIndex.value = boxIndex
    startPosition.value = { x: event.clientX, y: event.clientY }
    
    // 保存原始数据
    originalBoxData.value = { 
      x: currentBox.x, 
      y: currentBox.y, 
      width: currentBox.width, 
      height: currentBox.height 
    }
    
    // 计算原始宽高比
    originalAspectRatio.value = currentBox.width / currentBox.height
    
    // 添加事件监听器
    const throttledResize = throttle((e) => handleResize(e, onUpdate), 16) // 60fps
    const debouncedEnd = debounce(() => endResize(onUpdate), 100)
    
    eventManager.add(document, 'mousemove', throttledResize)
    eventManager.add(document, 'mouseup', debouncedEnd)
  }

  /**
   * 处理拖拽
   * @param {MouseEvent} event 鼠标事件
   * @param {Function} onUpdate 更新回调
   */
  const handleDrag = (event, onUpdate, otherBoxes) => {
    if (!isDragging.value || activeBoxIndex.value < 0) return
    
    const zoomScale = getZoomScale()
    const deltaX = (event.clientX - startPosition.value.x) / zoomScale
    const deltaY = (event.clientY - startPosition.value.y) / zoomScale
    
    // 计算新位置
    const newX = Math.max(0, originalBoxData.value.x + deltaX)
    const newY = Math.max(0, originalBoxData.value.y + deltaY)
    
    // 边界检测
    const boundedPosition = applyBoundaryConstraints(newX, newY, originalBoxData.value)
    
    // 应用吸附（如果有其他边框数据）
    const snapResult = calculateSnapPosition(
      boundedPosition.x, 
      boundedPosition.y, 
      originalBoxData.value.width, 
      originalBoxData.value.height,
      otherBoxes
    )
    
    // 触发更新
    if (onUpdate) {
      onUpdate(activeBoxIndex.value, { 
        x: snapResult.x, 
        y: snapResult.y 
      })
    }
  }

  /**
   * 处理调整大小
   * @param {MouseEvent} event 鼠标事件
   * @param {Function} onUpdate 更新回调
   */
  const handleResize = (event, onUpdate) => {
    if (!isResizing.value || activeBoxIndex.value < 0) return
    
    const zoomScale = getZoomScale()
    const deltaX = (event.clientX - startPosition.value.x) / zoomScale
    const deltaY = (event.clientY - startPosition.value.y) / zoomScale
    
    const newDimensions = calculateNewDimensions(
      resizeHandle.value,
      originalBoxData.value,
      deltaX,
      deltaY
    )
    
    // 边界检测
    const boundedDimensions = applyBoundaryConstraints(
      newDimensions.x,
      newDimensions.y,
      newDimensions
    )
    
    // 触发更新
    if (onUpdate) {
      onUpdate(activeBoxIndex.value, boundedDimensions)
    }
  }

  /**
   * 结束拖拽
   * @param {Function} onUpdate 更新回调
   */
  const endDrag = (onUpdate) => {
    isDragging.value = false
    activeBoxIndex.value = -1
    eventManager.clear()
    
    if (onUpdate) {
      onUpdate()
    }
  }

  /**
   * 结束调整大小
   * @param {Function} onUpdate 更新回调
   */
  const endResize = (onUpdate) => {
    isResizing.value = false
    resizeHandle.value = null
    activeBoxIndex.value = -1
    eventManager.clear()
    
    if (onUpdate) {
      onUpdate()
    }
  }

  /**
   * 计算新尺寸
   * @param {string} handle 调整手柄
   * @param {Object} originalData 原始数据
   * @param {number} deltaX X轴变化
   * @param {number} deltaY Y轴变化
   * @returns {Object} 新尺寸
   */
  const calculateNewDimensions = (handle, originalData, deltaX, deltaY) => {
    let newX = originalData.x
    let newY = originalData.y
    let newWidth = originalData.width
    let newHeight = originalData.height
    
    const minSize = 20 // 最小尺寸
    const containerWidth = getContainerWidth()
    const containerHeight = getContainerHeight()
    const maxWidth = containerWidth
    const maxHeight = containerHeight
    
    switch (handle) {
      case 'se':
        newWidth = Math.max(minSize, Math.min(maxWidth, originalData.width + deltaX))
        newHeight = Math.max(minSize, Math.min(maxHeight, originalData.height + deltaY))
        break
      case 'sw':
        newWidth = Math.max(minSize, Math.min(maxWidth, originalData.width - deltaX))
        newHeight = Math.max(minSize, Math.min(maxHeight, originalData.height + deltaY))
        newX = Math.max(0, originalData.x + originalData.width - newWidth)
        break
      case 'ne':
        newWidth = Math.max(minSize, Math.min(maxWidth, originalData.width + deltaX))
        newHeight = Math.max(minSize, Math.min(maxHeight, originalData.height - deltaY))
        newY = Math.max(0, originalData.y + originalData.height - newHeight)
        break
      case 'nw':
        newWidth = Math.max(minSize, Math.min(maxWidth, originalData.width - deltaX))
        newHeight = Math.max(minSize, Math.min(maxHeight, originalData.height - deltaY))
        newX = Math.max(0, originalData.x + originalData.width - newWidth)
        newY = Math.max(0, originalData.y + originalData.height - newHeight)
        break
      case 'e':
        newWidth = Math.max(minSize, Math.min(maxWidth, originalData.width + deltaX))
        break
      case 'w':
        newWidth = Math.max(minSize, Math.min(maxWidth, originalData.width - deltaX))
        newX = Math.max(0, originalData.x + originalData.width - newWidth)
        break
      case 's':
        newHeight = Math.max(minSize, Math.min(maxHeight, originalData.height + deltaY))
        break
      case 'n':
        newHeight = Math.max(minSize, Math.min(maxHeight, originalData.height - deltaY))
        newY = Math.max(0, originalData.y + originalData.height - newHeight)
        break
    }
    
    // 如果锁定宽高比，调整尺寸
    if (aspectRatioLocked.value) {
      const newAspectRatio = newWidth / newHeight
      const targetAspectRatio = originalAspectRatio.value
      
      if (Math.abs(newAspectRatio - targetAspectRatio) > 0.01) {
        // 根据主要变化方向调整
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 水平变化为主，调整高度
          newHeight = newWidth / targetAspectRatio
          if (handle.includes('n')) {
            newY = originalData.y + originalData.height - newHeight
          }
        } else {
          // 垂直变化为主，调整宽度
          newWidth = newHeight * targetAspectRatio
          if (handle.includes('w')) {
            newX = originalData.x + originalData.width - newWidth
          }
        }
      }
    }
    
    return { x: newX, y: newY, width: newWidth, height: newHeight }
  }

  /**
   * 应用边界约束
   * @param {number} x X坐标
   * @param {number} y Y坐标
   * @param {Object} dimensions 尺寸信息
   * @returns {Object} 约束后的位置和尺寸
   */
  const applyBoundaryConstraints = (x, y, dimensions) => {
    const containerWidth = getContainerWidth()
    const containerHeight = getContainerHeight()
    
    // 确保不超出容器边界
    const maxX = containerWidth - dimensions.width
    const maxY = containerHeight - dimensions.height
    
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
      width: dimensions.width,
      height: dimensions.height
    }
  }

  /**
   * 获取容器宽度（使用图片实际显示尺寸，即 image-wrapper 的尺寸）
   * @returns {number} 容器宽度
   */
  const getContainerWidth = () => {
    const wrapper = document.querySelector('.image-wrapper')
    if (wrapper) return wrapper.offsetWidth
    const container = document.querySelector('.canvas-container')
    return container?.offsetWidth || window.innerWidth - 480
  }

  /**
   * 获取容器高度（使用图片实际显示尺寸，即 image-wrapper 的尺寸）
   * @returns {number} 容器高度
   */
  const getContainerHeight = () => {
    const wrapper = document.querySelector('.image-wrapper')
    if (wrapper) return wrapper.offsetHeight
    const container = document.querySelector('.canvas-container')
    return container?.offsetHeight || window.innerHeight - 100
  }

  /**
   * 获取当前 zoom 缩放比例
   */
  const getZoomScale = () => {
    const wrapper = document.querySelector('.image-wrapper')
    if (!wrapper) return 1
    const rect = wrapper.getBoundingClientRect()
    if (wrapper.offsetWidth === 0 || wrapper.offsetHeight === 0) return 1
    // getBoundingClientRect 包含 CSS transform，offsetWidth 不包含
    return rect.width / wrapper.offsetWidth
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    eventManager.clear()
    isDragging.value = false
    isResizing.value = false
    activeBoxIndex.value = -1
    resizeHandle.value = null
  }

  /**
   * 设置锁定宽高比
   * @param {boolean} locked 是否锁定
   */
  const setAspectRatioLocked = (locked) => {
    aspectRatioLocked.value = locked
  }

  /**
   * 切换锁定宽高比
   */
  const toggleAspectRatioLocked = () => {
    aspectRatioLocked.value = !aspectRatioLocked.value
  }

  /**
   * 计算吸附位置
   * @param {number} x 当前x坐标
   * @param {number} y 当前y坐标
   * @param {number} width 宽度
   * @param {number} height 高度
   * @param {Array} otherBoxes 其他边框
   * @returns {Object} 吸附后的位置
   */
  const calculateSnapPosition = (x, y, width, height, otherBoxes) => {
    const containerWidth = getContainerWidth()
    const containerHeight = getContainerHeight()

    const { snappedX, snappedY, guides } = applySnapPosition(
      x, y, width, height, containerWidth, containerHeight, otherBoxes, SNAP_THRESHOLD
    )

    return { x: snappedX, y: snappedY, guides }
  }

  return {
    isDragging: computed(() => isDragging.value),
    isResizing: computed(() => isResizing.value),
    activeBoxIndex: computed(() => activeBoxIndex.value),
    aspectRatioLocked: computed(() => aspectRatioLocked.value),
    showGuides: computed(() => showGuides.value),
    snapThreshold: computed(() => snapThreshold.value),
    resizeHandles,
    startDrag,
    startResize,
    setAspectRatioLocked,
    toggleAspectRatioLocked,
    calculateSnapPosition,
    cleanup
  }
} 