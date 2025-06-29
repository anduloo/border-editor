// 边框交互组合式函数

import { ref, computed } from 'vue'
import { debounce, throttle, EventManager } from '../utils/performance.js'

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
  const snapThreshold = ref(10) // 吸附阈值
  
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
    
    const deltaX = event.clientX - startPosition.value.x
    const deltaY = event.clientY - startPosition.value.y
    
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
    
    const deltaX = event.clientX - startPosition.value.x
    const deltaY = event.clientY - startPosition.value.y
    
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
    
    switch (handle) {
      case 'se':
        newWidth = Math.max(minSize, originalData.width + deltaX)
        newHeight = Math.max(minSize, originalData.height + deltaY)
        break
      case 'sw':
        newX = Math.max(0, originalData.x + deltaX)
        newWidth = Math.max(minSize, originalData.width - deltaX)
        newHeight = Math.max(minSize, originalData.height + deltaY)
        break
      case 'ne':
        newY = Math.max(0, originalData.y + deltaY)
        newWidth = Math.max(minSize, originalData.width + deltaX)
        newHeight = Math.max(minSize, originalData.height - deltaY)
        break
      case 'nw':
        newX = Math.max(0, originalData.x + deltaX)
        newY = Math.max(0, originalData.y + deltaY)
        newWidth = Math.max(minSize, originalData.width - deltaX)
        newHeight = Math.max(minSize, originalData.height - deltaY)
        break
      case 'e':
        newWidth = Math.max(minSize, originalData.width + deltaX)
        break
      case 'w':
        newX = Math.max(0, originalData.x + deltaX)
        newWidth = Math.max(minSize, originalData.width - deltaX)
        break
      case 's':
        newHeight = Math.max(minSize, originalData.height + deltaY)
        break
      case 'n':
        newY = Math.max(0, originalData.y + deltaY)
        newHeight = Math.max(minSize, originalData.height - deltaY)
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
   * 获取容器宽度
   * @returns {number} 容器宽度
   */
  const getContainerWidth = () => {
    const container = document.querySelector('.canvas-container')
    return container?.offsetWidth || window.innerWidth - 480
  }

  /**
   * 获取容器高度
   * @returns {number} 容器高度
   */
  const getContainerHeight = () => {
    const container = document.querySelector('.canvas-container')
    return container?.offsetHeight || window.innerHeight - 100
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
    let snappedX = x
    let snappedY = y
    const guides = []
    
    // 容器边界吸附
    const containerWidth = getContainerWidth()
    const containerHeight = getContainerHeight()
    
    // 左边界
    if (Math.abs(x) < snapThreshold.value) {
      snappedX = 0
      guides.push({ type: 'vertical', x: 0 })
    }
    
    // 右边界
    if (Math.abs(x + width - containerWidth) < snapThreshold.value) {
      snappedX = containerWidth - width
      guides.push({ type: 'vertical', x: containerWidth })
    }
    
    // 上边界
    if (Math.abs(y) < snapThreshold.value) {
      snappedY = 0
      guides.push({ type: 'horizontal', y: 0 })
    }
    
    // 下边界
    if (Math.abs(y + height - containerHeight) < snapThreshold.value) {
      snappedY = containerHeight - height
      guides.push({ type: 'horizontal', y: containerHeight })
    }
    
    // 中心线吸附
    const centerX = x + width / 2
    const centerY = y + height / 2
    const containerCenterX = containerWidth / 2
    const containerCenterY = containerHeight / 2
    
    if (Math.abs(centerX - containerCenterX) < snapThreshold.value) {
      snappedX = containerCenterX - width / 2
      guides.push({ type: 'vertical', x: containerCenterX })
    }
    
    if (Math.abs(centerY - containerCenterY) < snapThreshold.value) {
      snappedY = containerCenterY - height / 2
      guides.push({ type: 'horizontal', y: containerCenterY })
    }
    
    // 其他边框吸附
    otherBoxes.forEach(box => {
      // 左对齐
      if (Math.abs(x - box.x) < snapThreshold.value) {
        snappedX = box.x
        guides.push({ type: 'vertical', x: box.x })
      }
      
      // 右对齐
      if (Math.abs(x + width - (box.x + box.width)) < snapThreshold.value) {
        snappedX = box.x + box.width - width
        guides.push({ type: 'vertical', x: box.x + box.width })
      }
      
      // 上对齐
      if (Math.abs(y - box.y) < snapThreshold.value) {
        snappedY = box.y
        guides.push({ type: 'horizontal', y: box.y })
      }
      
      // 下对齐
      if (Math.abs(y + height - (box.y + box.height)) < snapThreshold.value) {
        snappedY = box.y + box.height - height
        guides.push({ type: 'horizontal', y: box.y + box.height })
      }
      
      // 中心对齐
      const boxCenterX = box.x + box.width / 2
      const boxCenterY = box.y + box.height / 2
      
      if (Math.abs(centerX - boxCenterX) < snapThreshold.value) {
        snappedX = boxCenterX - width / 2
        guides.push({ type: 'vertical', x: boxCenterX })
      }
      
      if (Math.abs(centerY - boxCenterY) < snapThreshold.value) {
        snappedY = boxCenterY - height / 2
        guides.push({ type: 'horizontal', y: boxCenterY })
      }
    })
    
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