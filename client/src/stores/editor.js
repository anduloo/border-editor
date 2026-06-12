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

  const addBox = (type = 'rectangle', options = {}) => {
    const colors = ['#5e6ad2', '#1a1d23', '#d94841', '#3dab5e', '#d4860a', '#f2994a']
    const color = colors[cropBoxes.value.length % colors.length]

    const newBox = {
      id: Date.now() + Math.random(),
      type,
      color: options.color || color,
      x: options.x || 100,
      y: options.y || 100,
      width: options.width || 200,
      height: options.height || 200,
      borderWidth: options.borderWidth || 4,
      borderRadius: options.borderRadius || (type === 'circle' ? 50 : type === 'square' ? 0 : 8),
      shadowEnabled: options.shadowEnabled || false,
      shadowColor: options.shadowColor || 'rgba(0,0,0,0.5)',
      shadowX: options.shadowX || 0,
      shadowY: options.shadowY || 0,
      shadowBlur: options.shadowBlur || 10,
      lockAspectRatio: options.lockAspectRatio !== undefined ? options.lockAspectRatio : true
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
    reset
  }
})
