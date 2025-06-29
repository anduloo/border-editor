// 图片处理组合式函数

import { ref, computed } from 'vue'
import { BorderRenderer } from '../utils/borderRenderer.js'
import { globalCoordinateMapper, getCurrentContainerSize } from '../utils/coordinateMapper.js'

export function useImageProcessor() {
  const isProcessing = ref(false)
  const progress = ref(0)
  const error = ref(null)

  // 导出配置
  const exportConfig = ref({
    format: 'png', // png, jpeg, webp
    quality: 0.9, // 0-1
    scale: 1, // 缩放倍数，用于高质量导出
    filename: '', // 自定义文件名
    includeMetadata: true // 是否包含元数据
  })

  /**
   * 处理图片
   * @param {Object} image 图片对象
   * @param {Array} boxes 边框数组
   * @param {Object} displaySize 显示尺寸
   * @param {Object} config 导出配置
   * @returns {Promise<Blob>} 处理后的图片blob
   */
  const processImage = async (image, boxes, displaySize = null, config = {}) => {
    try {
      isProcessing.value = true
      progress.value = 0
      error.value = null

      // 合并配置
      const finalConfig = { ...exportConfig.value, ...config }
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 加载原始图片
      const originalImg = await loadImage(image.url)
      progress.value = 20
      
      // 设置画布尺寸（支持高质量导出）
      const scale = finalConfig.scale || 1
      canvas.width = originalImg.width * scale
      canvas.height = originalImg.height * scale
      
      // 启用图像平滑
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // 绘制原始图片（缩放）
      ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height)
      progress.value = 40
      
      // 初始化坐标映射器
      const containerSize = getCurrentContainerSize()
      globalCoordinateMapper.init(image, containerSize)
      progress.value = 60
      
      // 转换边框坐标（从原始坐标到导出坐标，并应用缩放）
      const originalBoxes = boxes.map(box => {
        // 边框坐标已经是原始坐标，直接应用导出缩放
        const scaledBox = {
          ...box,
          x: box.x * scale,
          y: box.y * scale,
          width: box.width * scale,
          height: box.height * scale,
          borderWidth: box.borderWidth * scale,
          borderRadius: box.borderRadius * scale
        }
        
        // 调试信息
        console.log('坐标转换详情:', {
          originalBox: box,
          scaledBox: scaledBox,
          scale: scale,
          mappingInfo: globalCoordinateMapper.getMappingInfo()
        })
        
        return scaledBox
      })
      progress.value = 80
      
      // 绘制边框
      await drawBorders(ctx, originalBoxes)
      progress.value = 90
      
      // 转换为blob
      const blob = await canvasToBlob(canvas, finalConfig.format, finalConfig.quality)
      progress.value = 100
      
      return blob
    } catch (err) {
      console.error('图片处理失败:', err)
      error.value = err.message
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 加载图片
   * @param {string} url 图片URL
   * @returns {Promise<HTMLImageElement>} 图片元素
   */
  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // 支持跨域图片
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  /**
   * 绘制边框
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   * @param {Array} boxes 边框数组（原始坐标）
   */
  const drawBorders = async (ctx, boxes) => {
    for (const box of boxes) {
      const { 
        type, 
        x, 
        y, 
        width, 
        height, 
        borderWidth, 
        borderRadius, 
        color, 
        shadowEnabled, 
        shadowColor, 
        shadowX, 
        shadowY, 
        shadowBlur 
      } = box
      
      // 应用阴影
      if (shadowEnabled) {
        BorderRenderer.applyShadow(ctx, {
          enabled: shadowEnabled,
          color: shadowColor,
          x: shadowX,
          y: shadowY,
          blur: shadowBlur
        }, { scaleX: 1, scaleY: 1 }) // 原始坐标不需要缩放
      }

      // 绘制边框
      if (type === 'circle') {
        BorderRenderer.drawCircleBorder(ctx, box, box)
      } else {
        BorderRenderer.drawRectangleBorder(ctx, box, box)
      }

      // 清除阴影
      BorderRenderer.clearShadow(ctx)
    }
  }

  /**
   * Canvas转Blob（支持多种格式）
   * @param {HTMLCanvasElement} canvas Canvas元素
   * @param {string} format 格式 (png, jpeg, webp)
   * @param {number} quality 质量 (0-1)
   * @returns {Promise<Blob>} Blob对象
   */
  const canvasToBlob = (canvas, format = 'png', quality = 0.9) => {
    return new Promise((resolve, reject) => {
      try {
        let mimeType, qualityParam
        
        switch (format.toLowerCase()) {
          case 'jpeg':
          case 'jpg':
            mimeType = 'image/jpeg'
            qualityParam = quality
            break
          case 'webp':
            mimeType = 'image/webp'
            qualityParam = quality
            break
          case 'png':
          default:
            mimeType = 'image/png'
            qualityParam = undefined // PNG不支持质量参数
            break
        }
        
        canvas.toBlob(resolve, mimeType, qualityParam)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 下载图片
   * @param {Blob} blob 图片blob
   * @param {string} filename 文件名
   * @param {string} format 格式
   */
  const downloadImage = (blob, filename = 'edited-image', format = 'png') => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 确保文件名有正确的扩展名
    const extension = format.toLowerCase()
    const finalFilename = filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`
    
    link.download = finalFilename
    link.click()
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  /**
   * 生成文件名
   * @param {Object} image 图片对象
   * @param {string} prefix 前缀
   * @param {string} suffix 后缀
   * @returns {string} 文件名
   */
  const generateFilename = (image, prefix = 'edited', suffix = '') => {
    const baseName = image.name ? image.name.replace(/\.[^/.]+$/, '') : 'image'
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    return `${prefix}-${baseName}${suffix ? `-${suffix}` : ''}-${timestamp}`
  }

  /**
   * 获取支持的导出格式
   * @returns {Array} 支持的格式列表
   */
  const getSupportedFormats = () => {
    const formats = [
      { value: 'png', label: 'PNG (无损)', description: '高质量，文件较大' },
      { value: 'jpeg', label: 'JPEG (有损)', description: '文件小，质量可调' },
      { value: 'webp', label: 'WebP (现代)', description: '高质量，文件小' }
    ]
    
    // 检查浏览器支持
    const canvas = document.createElement('canvas')
    const supportedFormats = formats.filter(format => {
      try {
        return canvas.toDataURL(`image/${format.value}`) !== 'data:,'
      } catch {
        return false
      }
    })
    
    return supportedFormats
  }

  /**
   * 预览导出效果
   * @param {Object} image 图片对象
   * @param {Array} boxes 边框数组
   * @param {Object} config 导出配置
   * @returns {Promise<string>} 预览图片的dataURL
   */
  const previewExport = async (image, boxes, config = {}) => {
    const finalConfig = { ...exportConfig.value, ...config, scale: 1 } // 预览使用1倍缩放
    const blob = await processImage(image, boxes, null, finalConfig)
    return URL.createObjectURL(blob)
  }

  /**
   * 批量导出
   * @param {Array} images 图片数组
   * @param {Array} boxesArray 边框数组的数组
   * @param {Object} config 导出配置
   * @returns {Promise<Array>} 导出的文件信息数组
   */
  const batchExport = async (images, boxesArray, config = {}) => {
    const results = []
    
    for (let i = 0; i < images.length; i++) {
      try {
        const image = images[i]
        const boxes = boxesArray[i] || []
        const filename = generateFilename(image, 'batch', `item-${i + 1}`)
        
        const blob = await processImage(image, boxes, null, config)
        downloadImage(blob, filename, config.format || 'png')
        
        results.push({
          index: i,
          filename,
          success: true,
          size: blob.size
        })
        
        // 添加延迟避免浏览器阻塞
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message
        })
      }
    }
    
    return results
  }

  /**
   * 获取图片显示尺寸
   * @param {Object} image 图片对象
   * @returns {Object} 显示尺寸
   */
  const getImageDisplaySize = (image) => {
    const containerSize = getCurrentContainerSize()
    globalCoordinateMapper.init(image, containerSize)
    return globalCoordinateMapper.previewSize
  }

  /**
   * 验证边框坐标
   * @param {Array} boxes 边框数组
   * @param {Object} image 图片对象
   * @returns {Array} 验证后的边框数组
   */
  const validateBoxes = (boxes, image) => {
    const containerSize = getCurrentContainerSize()
    globalCoordinateMapper.init(image, containerSize)
    
    return boxes.map(box => {
      const constrained = globalCoordinateMapper.constrainCoordinates(
        box.x, 
        box.y, 
        box.width, 
        box.height, 
        true // 预览坐标
      )
      
      return { ...box, ...constrained }
    })
  }

  /**
   * 设置导出配置
   * @param {Object} config 配置对象
   */
  const setExportConfig = (config) => {
    exportConfig.value = { ...exportConfig.value, ...config }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    isProcessing.value = false
    progress.value = 0
    error.value = null
  }

  /**
   * 调试坐标转换
   * @param {Object} image 图片对象
   * @param {Array} boxes 边框数组
   */
  const debugCoordinateConversion = (image, boxes) => {
    console.log('=== 坐标转换调试 ===')
    console.log('图片信息:', {
      originalSize: { width: image.width, height: image.height },
      url: image.url
    })
    
    console.log('边框信息 (原始坐标):', boxes)
    
    // 初始化坐标映射器
    const containerSize = getCurrentContainerSize()
    globalCoordinateMapper.init(image, containerSize)
    
    console.log('坐标映射器信息:', globalCoordinateMapper.getMappingInfo())
    
    // 转换到预览坐标
    const previewBoxes = boxes.map(box => 
      globalCoordinateMapper.convertBoxOriginalToPreview(box)
    )
    console.log('边框信息 (预览坐标):', previewBoxes)
    
    // 转换回原始坐标
    const backToOriginal = previewBoxes.map(box => 
      globalCoordinateMapper.convertBoxPreviewToOriginal(box)
    )
    console.log('边框信息 (转换回原始坐标):', backToOriginal)
    
    // 检查是否一致
    const isConsistent = boxes.every((box, index) => {
      const back = backToOriginal[index]
      return Math.abs(box.x - back.x) < 0.1 && 
             Math.abs(box.y - back.y) < 0.1 &&
             Math.abs(box.width - back.width) < 0.1 &&
             Math.abs(box.height - back.height) < 0.1
    })
    
    console.log('坐标转换一致性检查:', isConsistent ? '✅ 通过' : '❌ 失败')
    console.log('=== 调试结束 ===')
  }

  return {
    isProcessing: computed(() => isProcessing.value),
    progress: computed(() => progress.value),
    error: computed(() => error.value),
    exportConfig: computed(() => exportConfig.value),
    processImage,
    downloadImage,
    generateFilename,
    getSupportedFormats,
    previewExport,
    batchExport,
    setExportConfig,
    getImageDisplaySize,
    validateBoxes,
    debugCoordinateConversion,
    reset
  }
} 