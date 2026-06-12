// 边框渲染工具类

/**
 * 边框渲染器
 */
export class BorderRenderer {
  /**
   * 创建渐变
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   * @param {string} color 颜色字符串
   * @param {number} x 起始x坐标
   * @param {number} y 起始y坐标
   * @param {number} width 宽度
   * @param {number} height 高度
   * @returns {CanvasGradient} 渐变对象
   */
  static createGradient(ctx, color, x, y, width, height) {
    if (color.includes('linear-gradient')) {
      return this.createLinearGradient(ctx, color, x, y, width, height)
    } else if (color.includes('radial-gradient')) {
      return this.createRadialGradient(ctx, color, x, y, width, height)
    }
    return null
  }

  /**
   * 创建线性渐变
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   * @param {string} color 颜色字符串
   * @param {number} x 起始x坐标
   * @param {number} y 起始y坐标
   * @param {number} width 宽度
   * @param {number} height 高度
   * @returns {CanvasGradient} 线性渐变对象
   */
  static createLinearGradient(ctx, color, x, y, width, height) {
    const angleMatch = color.match(/(\d+)deg/)
    const angle = angleMatch ? parseInt(angleMatch[1]) : 0
    const colors = color.match(/#[a-fA-F0-9]{6}|rgba?\([^)]+\)/g) || []
    
    const rad = (angle - 90) * Math.PI / 180
    const centerX = x + width / 2
    const centerY = y + height / 2
    
    const x1 = centerX - Math.cos(rad) * width / 2
    const y1 = centerY - Math.sin(rad) * height / 2
    const x2 = centerX + Math.cos(rad) * width / 2
    const y2 = centerY + Math.sin(rad) * height / 2
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color)
    })
    
    return gradient
  }

  /**
   * 创建径向渐变
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   * @param {string} color 颜色字符串
   * @param {number} x 起始x坐标
   * @param {number} y 起始y坐标
   * @param {number} width 宽度
   * @param {number} height 高度
   * @returns {CanvasGradient} 径向渐变对象
   */
  static createRadialGradient(ctx, color, x, y, width, height) {
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radius = Math.min(width, height) / 2
    const colors = color.match(/#[a-fA-F0-9]{6}|rgba?\([^)]+\)/g) || []
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color)
    })
    
    return gradient
  }

  /**
   * 绘制圆形边框
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   * @param {Object} box 边框对象
   * @param {Object} originalCoords 原始坐标
   */
  static drawCircleBorder(ctx, box, originalCoords) {
    const { x, y, width, height, borderWidth, color } = originalCoords
    
    ctx.save()
    try {
      // 绘制镂空
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      const centerX = x + width / 2
      const centerY = y + height / 2
      const radiusX = width / 2 - borderWidth / 2
      const radiusY = height / 2 - borderWidth / 2
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      ctx.fill()
      
      // 绘制边框
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      
      if (color.includes('gradient')) {
        const gradient = this.createGradient(ctx, color, x, y, width, height)
        ctx.strokeStyle = gradient
      } else {
        ctx.strokeStyle = color
      }
      
      ctx.lineWidth = borderWidth
      ctx.stroke()
    } finally {
      ctx.restore()
    }
  }

  /**
   * 绘制矩形边框
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   * @param {Object} box 边框对象
   * @param {Object} originalCoords 原始坐标
   */
  static drawRectangleBorder(ctx, box, originalCoords) {
    const { x, y, width, height, borderWidth, borderRadius, color, type } = originalCoords
    
    ctx.save()
    try {
      // 绘制镂空
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      
      const rectX = x + borderWidth / 2
      const rectY = y + borderWidth / 2
      const rectWidth = width - borderWidth
      const rectHeight = height - borderWidth
      const radius = type === 'square' ? 0 : borderRadius
      
      if (radius > 0) {
        this.drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, radius)
      } else {
        ctx.rect(rectX, rectY, rectWidth, rectHeight)
      }
      
      ctx.closePath()
      ctx.fill()
      
      // 绘制边框
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      
      if (radius > 0) {
        this.drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, radius)
      } else {
        ctx.rect(rectX, rectY, rectWidth, rectHeight)
      }
      
      ctx.closePath()
      
      if (color.includes('gradient')) {
        const gradient = this.createGradient(ctx, color, x, y, width, height)
        ctx.strokeStyle = gradient
      } else {
        ctx.strokeStyle = color
      }
      
      ctx.lineWidth = borderWidth
      ctx.stroke()
    } finally {
      ctx.restore()
    }
  }

  /**
   * 绘制圆角矩形路径
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   * @param {number} x 起始x坐标
   * @param {number} y 起始y坐标
   * @param {number} width 宽度
   * @param {number} height 高度
   * @param {number} radius 圆角半径
   */
  static drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
  }

  /**
   * 应用阴影
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   * @param {Object} shadow 阴影配置
   * @param {Object} scaleRatio 缩放比例
   */
  static applyShadow(ctx, shadow, scaleRatio) {
    if (shadow.enabled) {
      ctx.shadowColor = shadow.color
      ctx.shadowBlur = shadow.blur * scaleRatio.scaleX
      ctx.shadowOffsetX = shadow.x * scaleRatio.scaleX
      ctx.shadowOffsetY = shadow.y * scaleRatio.scaleY
    } else {
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
  }

  /**
   * 清除阴影
   * @param {CanvasRenderingContext2D} ctx Canvas上下文
   */
  static clearShadow(ctx) {
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  /**
   * 为CSS样式创建渐变背景
   * @param {string} color 颜色字符串
   * @returns {string} CSS渐变字符串
   */
  static createCSSGradient(color) {
    if (color.includes('linear-gradient')) {
      return color
    } else if (color.includes('radial-gradient')) {
      return color
    }
    return color
  }
} 