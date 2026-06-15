import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEditorStore = defineStore('editor', () => {
  // 状态
  const currentImage = ref(null)
  const cropBoxes = ref([])
  const activeBoxIndex = ref(-1)
  const isLoading = ref(false)
  const error = ref(null)

  // 计算属性
  const hasImage = computed(() => currentImage.value !== null)
  const hasBoxes = computed(() => cropBoxes.value.length > 0)
  const activeBox = computed(() => 
    activeBoxIndex.value >= 0 ? cropBoxes.value[activeBoxIndex.value] : null
  )

  // 动作
  const uploadImage = async (file) => {
    try {
      isLoading.value = true
      error.value = null

      const imageUrl = URL.createObjectURL(file)
      const img = new Image()
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          currentImage.value = {
            file: file,
            url: imageUrl,
            width: img.width,
            height: img.height,
            name: file.name
          }
          cropBoxes.value = []
          activeBoxIndex.value = -1
          resolve()
        }
        img.onerror = reject
        img.src = imageUrl
      })

    } catch {
      error.value = '图片加载失败'
      throw new Error('图片加载失败')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 将边框位置和尺寸约束在图片边界内
   * @param {Object} box 边框对象 { x, y, width, height }
   * @param {Object} image 图片对象 { width, height }，可为 null
   * @returns {Object} 约束后的边框（修改 x/y/width/height）
   */
  const clampToImageBounds = (box, image) => {
    if (!image || !image.width || !image.height) return box
    const minSize = 10
    // x/y 的上限 = 图片尺寸 - max(minSize, 实际宽高)，保护尺寸不被挤压
    const clampedX = Math.max(0, Math.min(box.x, image.width - Math.max(minSize, box.width)))
    const clampedY = Math.max(0, Math.min(box.y, image.height - Math.max(minSize, box.height)))
    // 宽/高的上限 = 图片尺寸 - 已钳制的位置
    const clampedW = Math.max(minSize, Math.min(box.width, image.width - clampedX))
    const clampedH = Math.max(minSize, Math.min(box.height, image.height - clampedY))
    return { x: clampedX, y: clampedY, width: clampedW, height: clampedH }
  }

  const addBox = (type = 'rectangle', options = {}) => {
    const colors = ['#5e6ad2', '#1a1d23', '#d94841', '#3dab5e', '#d4860a', '#f2994a']
    const color = colors[cropBoxes.value.length % colors.length]

    let newBox = {
      id: Date.now() + Math.random(),
      type,
      color: options.color || color,
      x: options.x || 100,
      y: options.y || 100,
      width: options.width || 200,
      height: options.height || 200,
      borderWidth: options.borderWidth || 2,
      borderRadius: options.borderRadius || (type === 'circle' ? 50 : type === 'square' ? 0 : 8),
      shadowEnabled: options.shadowEnabled || false,
      shadowColor: options.shadowColor || 'rgba(0,0,0,0.5)',
      shadowX: options.shadowX || 0,
      shadowY: options.shadowY || 0,
      shadowBlur: options.shadowBlur || 10,
      lockAspectRatio: options.lockAspectRatio !== undefined ? options.lockAspectRatio : true
    }

    // 约束到图片边界内
    if (currentImage.value) {
      const clamped = clampToImageBounds(newBox, currentImage.value)
      Object.assign(newBox, { x: clamped.x, y: clamped.y, width: clamped.width, height: clamped.height })
    }

    cropBoxes.value.push(newBox)
    setActiveBox(cropBoxes.value.length - 1)
  }

  const setActiveBox = (index) => {
    activeBoxIndex.value = index
  }

  const updateBox = (index, updates) => {
    if (index >= 0 && index < cropBoxes.value.length) {
      const currentBox = cropBoxes.value[index]
      const updatedBox = { ...currentBox }
      
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          updatedBox[key] = updates[key]
        }
      })
      
      // 极值保护：拒绝明显异常的值
      if (updatedBox.width > 50000 || updatedBox.height > 50000 ||
          updatedBox.borderWidth > 10000 || updatedBox.borderRadius > 10000) {
        return
      }

      // 非负保护：位置和尺寸不允许为负数
      if (updatedBox.x < 0 || updatedBox.y < 0 || updatedBox.width < 0 || updatedBox.height < 0) {
        return
      }

      // 空间属性边界约束：确保边框不超过图片范围
      if (currentImage.value) {
        const clamped = clampToImageBounds(
          { x: updatedBox.x, y: updatedBox.y, width: updatedBox.width, height: updatedBox.height },
          currentImage.value
        )
        Object.assign(updatedBox, { x: clamped.x, y: clamped.y, width: clamped.width, height: clamped.height })
      }
      
      // 原地更新触发响应式
      cropBoxes.value[index] = updatedBox
    }
  }

  const removeBox = (index) => {
    if (index >= 0 && index < cropBoxes.value.length) {
      cropBoxes.value.splice(index, 1)
      if (activeBoxIndex.value === index) {
        activeBoxIndex.value = cropBoxes.value.length > 0 ? 0 : -1
      } else if (activeBoxIndex.value > index) {
        activeBoxIndex.value--
      }
    }
  }

  const clearAllBoxes = () => {
    cropBoxes.value = []
    activeBoxIndex.value = -1
  }

  // 图层层级调整
  const moveBox = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || fromIndex >= cropBoxes.value.length) return
    if (toIndex < 0 || toIndex >= cropBoxes.value.length) return
    
    const boxes = [...cropBoxes.value]
    const [moved] = boxes.splice(fromIndex, 1)
    boxes.splice(toIndex, 0, moved)
    cropBoxes.value = boxes
    
    // 调整选中索引
    if (activeBoxIndex.value === fromIndex) {
      activeBoxIndex.value = toIndex
    } else if (activeBoxIndex.value === toIndex) {
      activeBoxIndex.value = fromIndex > toIndex ? activeBoxIndex.value + 1 : activeBoxIndex.value - 1
    } else if (fromIndex < activeBoxIndex.value && toIndex >= activeBoxIndex.value) {
      activeBoxIndex.value--
    } else if (fromIndex > activeBoxIndex.value && toIndex <= activeBoxIndex.value) {
      activeBoxIndex.value++
    }
  }

  const moveUp = (index) => {
    if (index > 0) moveBox(index, index - 1)
  }

  const moveDown = (index) => {
    if (index < cropBoxes.value.length - 1) moveBox(index, index + 1)
  }

  const moveToTop = (index) => {
    if (index > 0) moveBox(index, 0)
  }

  const moveToBottom = (index) => {
    if (index < cropBoxes.value.length - 1) moveBox(index, cropBoxes.value.length - 1)
  }

  const reset = () => {
    if (currentImage.value && currentImage.value.url) {
      URL.revokeObjectURL(currentImage.value.url)
    }
    currentImage.value = null
    cropBoxes.value = []
    activeBoxIndex.value = -1
    error.value = null
  }

  return {
    currentImage,
    cropBoxes,
    activeBoxIndex,
    isLoading,
    error,
    hasImage,
    hasBoxes,
    activeBox,
    uploadImage,
    addBox,
    setActiveBox,
    updateBox,
    removeBox,
    clearAllBoxes,
    moveBox,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    reset
  }
})
