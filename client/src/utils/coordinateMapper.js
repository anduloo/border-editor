// 坐标映射工具

/**
 * 坐标映射器
 * 用于处理预览图片和原始图片之间的坐标转换
 */
export class CoordinateMapper {
  constructor() {
    this.previewSize = { width: 0, height: 0 }
    this.originalSize = { width: 0, height: 0 }
    this.scaleRatio = { x: 1, y: 1 }
    this.containerSize = { width: 0, height: 0 }
  }

  /**
   * 初始化坐标映射器
   * @param {Object} originalImage 原始图片信息
   * @param {Object} containerSize 容器尺寸
   */
  init(originalImage, containerSize) {
    this.originalSize = {
      width: originalImage.width,
      height: originalImage.height
    }
    
    this.containerSize = containerSize
    
    // 计算预览尺寸
    this.previewSize = this.calculatePreviewSize(originalImage, containerSize)
    
    // 计算缩放比例
    this.scaleRatio = {
      x: this.originalSize.width / this.previewSize.width,
      y: this.originalSize.height / this.previewSize.height
    }
  }

  /**
   * 计算预览尺寸
   * @param {Object} image 图片信息
   * @param {Object} container 容器尺寸
   * @returns {Object} 预览尺寸
   */
  calculatePreviewSize(image, container) {
    const maxWidth = container.width - 80
    const maxHeight = container.height - 80
    
    const scaleX = maxWidth / image.width
    const scaleY = maxHeight / image.height
    const scale = Math.min(scaleX, scaleY, 1) // 最大1倍缩放，避免放大
    
    return {
      width: image.width * scale,
      height: image.height * scale,
      scale: scale
    }
  }

  /**
   * 预览坐标转原始坐标
   * @param {number} previewX 预览X坐标
   * @param {number} previewY 预览Y坐标
   * @returns {Object} 原始坐标
   */
  previewToOriginal(previewX, previewY) {
    return {
      x: previewX * this.scaleRatio.x,
      y: previewY * this.scaleRatio.y
    }
  }

  /**
   * 原始坐标转预览坐标
   * @param {number} originalX 原始X坐标
   * @param {number} originalY 原始Y坐标
   * @returns {Object} 预览坐标
   */
  originalToPreview(originalX, originalY) {
    return {
      x: originalX / this.scaleRatio.x,
      y: originalY / this.scaleRatio.y
    }
  }

  /**
   * 预览尺寸转原始尺寸
   * @param {number} previewWidth 预览宽度
   * @param {number} previewHeight 预览高度
   * @returns {Object} 原始尺寸
   */
  previewSizeToOriginal(previewWidth, previewHeight) {
    return {
      width: previewWidth * this.scaleRatio.x,
      height: previewHeight * this.scaleRatio.y
    }
  }

  /**
   * 原始尺寸转预览尺寸
   * @param {number} originalWidth 原始宽度
   * @param {number} originalHeight 原始高度
   * @returns {Object} 预览尺寸
   */
  originalSizeToPreview(originalWidth, originalHeight) {
    return {
      width: originalWidth / this.scaleRatio.x,
      height: originalHeight / this.scaleRatio.y
    }
  }

  /**
   * 转换边框数据（预览到原始）
   * @param {Object} previewBox 预览边框数据
   * @returns {Object} 原始边框数据
   */
  convertBoxPreviewToOriginal(previewBox) {
    const originalCoords = this.previewToOriginal(previewBox.x, previewBox.y)
    const originalSize = this.previewSizeToOriginal(previewBox.width, previewBox.height)
    
    // 显式构造，仅转换空间属性；borderWidth/borderRadius/borderColor 等保持不变
    return {
      id: previewBox.id,
      label: previewBox.label,
      type: previewBox.type,
      color: previewBox.color,
      x: originalCoords.x,
      y: originalCoords.y,
      width: originalSize.width,
      height: originalSize.height,
      borderWidth: previewBox.borderWidth,
      borderRadius: previewBox.borderRadius,
      shadowEnabled: previewBox.shadowEnabled,
      shadowColor: previewBox.shadowColor,
      shadowX: previewBox.shadowX,
      shadowY: previewBox.shadowY,
      shadowBlur: previewBox.shadowBlur,
      lockAspectRatio: previewBox.lockAspectRatio
    }
  }

  /**
   * 转换边框数据（原始到预览）
   * @param {Object} originalBox 原始边框数据
   * @returns {Object} 预览边框数据
   */
  convertBoxOriginalToPreview(originalBox) {
    const previewCoords = this.originalToPreview(originalBox.x, originalBox.y)
    const previewSize = this.originalSizeToPreview(originalBox.width, originalBox.height)
    
    // 显式构造，仅转换空间属性；borderWidth/borderRadius/borderColor 等保持不变
    return {
      id: originalBox.id,
      label: originalBox.label,
      type: originalBox.type,
      color: originalBox.color,
      x: previewCoords.x,
      y: previewCoords.y,
      width: previewSize.width,
      height: previewSize.height,
      borderWidth: originalBox.borderWidth,
      borderRadius: originalBox.borderRadius,
      shadowEnabled: originalBox.shadowEnabled,
      shadowColor: originalBox.shadowColor,
      shadowX: originalBox.shadowX,
      shadowY: originalBox.shadowY,
      shadowBlur: originalBox.shadowBlur,
      lockAspectRatio: originalBox.lockAspectRatio
    }
  }

  /**
   * 获取当前映射信息
   * @returns {Object} 映射信息
   */
  getMappingInfo() {
    return {
      previewSize: { ...this.previewSize },
      originalSize: { ...this.originalSize },
      scaleRatio: { ...this.scaleRatio },
      containerSize: { ...this.containerSize }
    }
  }

  /**
   * 验证坐标是否在有效范围内
   * @param {number} x X坐标
   * @param {number} y Y坐标
   * @param {number} width 宽度
   * @param {number} height 高度
   * @param {boolean} isPreview 是否为预览坐标
   * @returns {boolean} 是否有效
   */
  validateCoordinates(x, y, width, height, isPreview = true) {
    const maxWidth = isPreview ? this.previewSize.width : this.originalSize.width
    const maxHeight = isPreview ? this.previewSize.height : this.originalSize.height
    
    return x >= 0 && y >= 0 && 
           x + width <= maxWidth && 
           y + height <= maxHeight &&
           width > 0 && height > 0
  }

  /**
   * 约束坐标到有效范围
   * @param {number} x X坐标
   * @param {number} y Y坐标
   * @param {number} width 宽度
   * @param {number} height 高度
   * @param {boolean} isPreview 是否为预览坐标
   * @returns {Object} 约束后的坐标
   */
  constrainCoordinates(x, y, width, height, isPreview = true) {
    const maxWidth = isPreview ? this.previewSize.width : this.originalSize.width
    const maxHeight = isPreview ? this.previewSize.height : this.originalSize.height
    
    const minSize = isPreview ? 20 : 20 * this.scaleRatio.x
    
    return {
      x: Math.max(0, Math.min(x, maxWidth - Math.max(minSize, width))),
      y: Math.max(0, Math.min(y, maxHeight - Math.max(minSize, height))),
      width: Math.max(minSize, width),
      height: Math.max(minSize, height)
    }
  }
}

/**
 * 全局坐标映射器实例
 */
export const globalCoordinateMapper = new CoordinateMapper()

/**
 * 获取当前容器的实际尺寸
 * @returns {Object} 容器尺寸
 */
export function getCurrentContainerSize() {
  // 首先尝试获取canvas-container
  const canvasContainer = document.querySelector('.canvas-container')
  if (canvasContainer) {
    return {
      width: canvasContainer.offsetWidth,
      height: canvasContainer.offsetHeight
    }
  }
  
  // 备用方案：获取preview-section
  const previewSection = document.querySelector('.preview-section')
  if (previewSection) {
    return {
      width: previewSection.offsetWidth,
      height: previewSection.offsetHeight
    }
  }
  
  // 最后的备用方案：使用窗口尺寸
  return {
    width: window.innerWidth - 480,
    height: window.innerHeight - 100
  }
}

/**
 * 获取图片的实际显示尺寸
 * @param {Object} image 图片对象
 * @returns {Object} 显示尺寸
 */
export function getImageDisplaySize(image) {
  const containerSize = getCurrentContainerSize()
  const mapper = new CoordinateMapper()
  mapper.init(image, containerSize)
  return mapper.previewSize
} 