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

      // 创建图片对象
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
        img.onerror = (err) => {
          console.error('Store: 图片加载失败:', err)
          reject(err)
        }
        img.src = imageUrl
      })

    } catch (err) {
      error.value = '图片加载失败'
      console.error('Store: 处理图片失败:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const addBox = (type = 'rectangle', options = {}) => {
    const colors = ['#ff00cc', '#3333ff', '#00ff66', '#ff6600', '#9900ff', '#00ccff']
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
      borderRadius: options.borderRadius || (type === 'circle' ? 50 : type === 'square' ? 0 : 10),
      shadowEnabled: options.shadowEnabled || false,
      shadowColor: options.shadowColor || 'rgba(0,0,0,0.5)',
      shadowX: options.shadowX || 0,
      shadowY: options.shadowY || 0,
      shadowBlur: options.shadowBlur || 10
    }

    cropBoxes.value.push(newBox)
    setActiveBox(cropBoxes.value.length - 1)
  }

  const setActiveBox = (index) => {
    activeBoxIndex.value = index
  }

  const updateBox = (index, updates) => {
    if (index >= 0 && index < cropBoxes.value.length) {
      // 只更新指定的属性，保持其他属性不变
      const currentBox = cropBoxes.value[index]
      const updatedBox = { ...currentBox }
      
      // 只更新传入的属性
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          updatedBox[key] = updates[key]
        }
      })
      
      // 更新边框数据
      cropBoxes.value[index] = updatedBox
      
      // 强制触发响应式更新
      cropBoxes.value = [...cropBoxes.value]
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

  const processImage = async (displaySize = null) => {
    try {
      isLoading.value = true
      error.value = null

      console.log('开始处理图片...')
      console.log('当前图片:', currentImage.value)
      console.log('边框数据:', cropBoxes.value)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 加载原始图片
      const originalImg = new Image()
      await new Promise((resolve, reject) => {
        originalImg.onload = resolve
        originalImg.onerror = reject
        originalImg.src = currentImage.value.url
      })
      
      console.log('原始图片尺寸:', { width: originalImg.width, height: originalImg.height })
      
      // 设置画布尺寸为原始图片尺寸
      canvas.width = originalImg.width
      canvas.height = originalImg.height
      
      // 首先绘制原始图片
      ctx.drawImage(originalImg, 0, 0)
      console.log('原始图片已绘制到画布')
      
      // 获取预览图片的实际显示尺寸
      let actualPreviewWidth, actualPreviewHeight
      
      if (displaySize && displaySize.width && displaySize.height) {
        actualPreviewWidth = displaySize.width
        actualPreviewHeight = displaySize.height
        console.log('使用传入的显示尺寸:', { width: actualPreviewWidth, height: actualPreviewHeight })
      } else {
        // 备用方法：从DOM获取
        const previewImg = document.querySelector('.canvas-container img')
        if (previewImg) {
          const computedStyle = window.getComputedStyle(previewImg)
          actualPreviewWidth = parseFloat(computedStyle.width)
          actualPreviewHeight = parseFloat(computedStyle.height)
          console.log('从DOM获取的显示尺寸:', { width: actualPreviewWidth, height: actualPreviewHeight })
        } else {
          // 最后的备用方案：使用原始图片尺寸
          actualPreviewWidth = originalImg.width
          actualPreviewHeight = originalImg.height
          console.log('使用原始图片尺寸作为显示尺寸:', { width: actualPreviewWidth, height: actualPreviewHeight })
        }
      }
      
      // 计算缩放比例：预览尺寸到原始尺寸
      const scaleX = originalImg.width / actualPreviewWidth
      const scaleY = originalImg.height / actualPreviewHeight
      
      console.log('缩放比例:', { scaleX, scaleY })
      
      // 处理每个边框
      cropBoxes.value.forEach((box, index) => {
        console.log(`处理边框 ${index + 1}:`, box)
        
        const { type, x, y, width, height, borderWidth, borderRadius, color, shadowEnabled, shadowColor, shadowX, shadowY, shadowBlur } = box
        
        // 将预览坐标转换为原始图片坐标
        const originalX = x * scaleX
        const originalY = y * scaleY
        const originalWidth = width * scaleX
        const originalHeight = height * scaleY
        const originalBorderWidth = borderWidth * scaleX
        const originalBorderRadius = borderRadius * scaleX
        
        console.log(`边框 ${index + 1} 转换后坐标:`, {
          originalX, originalY, originalWidth, originalHeight,
          originalBorderWidth, originalBorderRadius
        })
        
        // 边界检查：确保边框不超出图片范围
        const maxX = originalImg.width - originalWidth
        const maxY = originalImg.height - originalHeight
        const constrainedX = Math.max(0, Math.min(originalX, maxX))
        const constrainedY = Math.max(0, Math.min(originalY, maxY))
        
        console.log(`边框 ${index + 1} 约束后坐标:`, { constrainedX, constrainedY })
        
        // 设置阴影
        if (shadowEnabled) {
          ctx.shadowColor = shadowColor
          ctx.shadowBlur = shadowBlur * scaleX
          ctx.shadowOffsetX = shadowX * scaleX
          ctx.shadowOffsetY = shadowY * scaleY
        } else {
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        }
        
        if (type === 'circle') {
          // 绘制圆形边框
          console.log(`绘制圆形边框 ${index + 1}`)
          
          // 先挖空圆形区域
          ctx.globalCompositeOperation = 'destination-out'
          ctx.beginPath()
          const centerX = constrainedX + originalWidth / 2
          const centerY = constrainedY + originalHeight / 2
          const radius = Math.min(originalWidth, originalHeight) / 2 - originalBorderWidth / 2
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
          ctx.fill()
          
          // 绘制边框
          ctx.globalCompositeOperation = 'source-over'
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius + originalBorderWidth / 2, 0, 2 * Math.PI)
          ctx.strokeStyle = color
          ctx.lineWidth = originalBorderWidth
          ctx.stroke()
          
        } else {
          // 绘制矩形边框
          console.log(`绘制矩形边框 ${index + 1}`)
          
          // 先挖空矩形区域
          ctx.globalCompositeOperation = 'destination-out'
          ctx.beginPath()
          
          const rectX = constrainedX + originalBorderWidth / 2
          const rectY = constrainedY + originalBorderWidth / 2
          const rectWidth = originalWidth - originalBorderWidth
          const rectHeight = originalHeight - originalBorderWidth
          const radius = type === 'square' ? 0 : originalBorderRadius
          
          if (radius > 0) {
            // 圆角矩形
            ctx.moveTo(rectX + radius, rectY)
            ctx.lineTo(rectX + rectWidth - radius, rectY)
            ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius)
            ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius)
            ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight)
            ctx.lineTo(rectX + radius, rectY + rectHeight)
            ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius)
            ctx.lineTo(rectX, rectY + radius)
            ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY)
          } else {
            // 普通矩形
            ctx.rect(rectX, rectY, rectWidth, rectHeight)
          }
          
          ctx.closePath()
          ctx.fill()
          
          // 绘制边框
          ctx.globalCompositeOperation = 'source-over'
          ctx.beginPath()
          
          if (radius > 0) {
            // 圆角矩形边框
            ctx.moveTo(constrainedX + radius, constrainedY)
            ctx.lineTo(constrainedX + originalWidth - radius, constrainedY)
            ctx.quadraticCurveTo(constrainedX + originalWidth, constrainedY, constrainedX + originalWidth, constrainedY + radius)
            ctx.lineTo(constrainedX + originalWidth, constrainedY + originalHeight - radius)
            ctx.quadraticCurveTo(constrainedX + originalWidth, constrainedY + originalHeight, constrainedX + originalWidth - radius, constrainedY + originalHeight)
            ctx.lineTo(constrainedX + radius, constrainedY + originalHeight)
            ctx.quadraticCurveTo(constrainedX, constrainedY + originalHeight, constrainedX, constrainedY + originalHeight - radius)
            ctx.lineTo(constrainedX, constrainedY + radius)
            ctx.quadraticCurveTo(constrainedX, constrainedY, constrainedX + radius, constrainedY)
          } else {
            // 普通矩形边框
            ctx.rect(constrainedX, constrainedY, originalWidth, originalHeight)
          }
          
          ctx.closePath()
          ctx.strokeStyle = color
          ctx.lineWidth = originalBorderWidth
          ctx.stroke()
        }
      })
      
      console.log('所有边框处理完成，准备导出...')
      
      // 导出图片
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `edited-${currentImage.value.name || 'image'}.png`
          link.click()
          URL.revokeObjectURL(url)
          console.log('图片导出成功')
        } else {
          console.error('创建blob失败')
          error.value = '导出失败：无法创建图片文件'
        }
      }, 'image/png')

    } catch (err) {
      console.error('图片处理错误:', err)
      error.value = '图片处理失败: ' + err.message
      throw err
    } finally {
      isLoading.value = false
    }
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
    processImage,
    reset
  }
}) 