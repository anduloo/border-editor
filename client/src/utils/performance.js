// 性能优化工具函数

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @param {boolean} immediate 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait, immediate = false) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 限制时间
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 事件监听器管理器
 */
export class EventManager {
  constructor() {
    this.listeners = new Map()
    this._idCounter = 0
  }

  /**
   * 添加事件监听器
   * @param {Element} element 目标元素
   * @param {string} event 事件类型
   * @param {Function} handler 处理函数
   * @param {Object} options 选项
   */
  add(element, event, handler, options = {}) {
    const key = `${event}-${++this._idCounter}`
    this.listeners.set(key, { element, event, handler, options })
    element.addEventListener(event, handler, options)
  }

  /**
   * 移除事件监听器
   * @param {Element} element 目标元素
   * @param {string} event 事件类型
   * @param {Function} handler 处理函数
   */
  remove(element, event, handler) {
    for (const [key, listener] of this.listeners) {
      if (listener.element === element && listener.event === event && listener.handler === handler) {
        element.removeEventListener(event, handler, listener.options)
        this.listeners.delete(key)
        return
      }
    }
  }

  /**
   * 清理所有事件监听器
   */
  clear() {
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options)
    })
    this.listeners.clear()
  }
}

/**
 * 图片尺寸计算工具
 */
export class ImageSizeCalculator {
  /**
   * 计算图片显示尺寸
   * @param {Object} image 图片对象
   * @param {number} containerWidth 容器宽度
   * @param {number} containerHeight 容器高度
   * @param {number} padding 内边距
   * @returns {Object} 显示尺寸信息
   */
  static calculateDisplaySize(image, containerWidth, containerHeight, padding = 80) {
    if (!image || !image.width || !image.height) {
      return { width: 0, height: 0, scale: 1 }
    }

    const maxWidth = containerWidth - padding
    const maxHeight = containerHeight - padding
    
    const scaleX = maxWidth / image.width
    const scaleY = maxHeight / image.height
    const scale = Math.min(scaleX, scaleY, 2) // 最大2倍缩放
    
    return {
      width: image.width * scale,
      height: image.height * scale,
      scale: scale
    }
  }

  /**
   * 计算坐标转换比例
   * @param {Object} originalImage 原始图片
   * @param {Object} displaySize 显示尺寸
   * @returns {Object} 缩放比例
   */
  static calculateScaleRatio(originalImage, displaySize) {
    return {
      scaleX: originalImage.width / displaySize.width,
      scaleY: originalImage.height / displaySize.height
    }
  }
}

/**
 * 错误处理工具
 */
export class ErrorHandler {
  /**
   * 处理异步错误
   * @param {Function} asyncFn 异步函数
   * @param {string} errorMessage 错误消息
   * @param {Function} onError 错误回调
   */
  static async handleAsync(asyncFn, errorMessage = '操作失败', onError = null) {
    try {
      return await asyncFn()
    } catch (error) {
      console.error(errorMessage, error)
      if (onError) {
        onError(error)
      }
      throw new Error(`${errorMessage}: ${error.message}`)
    }
  }

  /**
   * 用户友好的错误消息
   * @param {Error} error 错误对象
   * @returns {string} 用户友好的错误消息
   */
  static getUserFriendlyMessage(error) {
    if (error.message.includes('File too large')) {
      return '文件太大，请选择小于10MB的图片'
    }
    if (error.message.includes('Invalid file type')) {
      return '不支持的文件格式，请选择JPG、PNG、GIF或WebP格式'
    }
    if (error.message.includes('Network')) {
      return '网络连接失败，请检查网络后重试'
    }
    return '操作失败，请重试'
  }
} 