// 吸附辅助线统一工具函数
// 替换 ImageEditor / BorderBox / useBorderInteraction 中的三处重复实现

export const SNAP_THRESHOLD = 10

/**
 * 计算吸附后的位置和辅助线
 * @param {number} x 当前x坐标
 * @param {number} y 当前y坐标
 * @param {number} width 边框宽度
 * @param {number} height 边框高度
 * @param {number} canvasWidth 画布宽度
 * @param {number} canvasHeight 画布高度
 * @param {Array} otherBoxes 其他边框数组 (含 x, y, width, height)
 * @param {number} threshold 吸附阈值，默认 SNAP_THRESHOLD
 * @returns {{ snappedX: number, snappedY: number, guides: Array }}
 */
export function applySnapPosition(x, y, width, height, canvasWidth, canvasHeight, otherBoxes = [], threshold = SNAP_THRESHOLD) {
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    return { snappedX: x, snappedY: y, guides: [] }
  }

  let snappedX = x
  let snappedY = y
  const guides = []

  const centerX = x + width / 2
  const centerY = y + height / 2
  const canvasCenterX = canvasWidth / 2
  const canvasCenterY = canvasHeight / 2

  // 画布边界吸附
  if (Math.abs(x) < threshold) {
    snappedX = 0
    guides.push({ type: 'vertical', x: 0 })
  }
  if (Math.abs(x + width - canvasWidth) < threshold) {
    snappedX = canvasWidth - width
    guides.push({ type: 'vertical', x: canvasWidth })
  }
  if (Math.abs(y) < threshold) {
    snappedY = 0
    guides.push({ type: 'horizontal', y: 0 })
  }
  if (Math.abs(y + height - canvasHeight) < threshold) {
    snappedY = canvasHeight - height
    guides.push({ type: 'horizontal', y: canvasHeight })
  }

  // 画布中心线吸附
  if (Math.abs(centerX - canvasCenterX) < threshold) {
    snappedX = canvasCenterX - width / 2
    guides.push({ type: 'vertical', x: canvasCenterX })
  }
  if (Math.abs(centerY - canvasCenterY) < threshold) {
    snappedY = canvasCenterY - height / 2
    guides.push({ type: 'horizontal', y: canvasCenterY })
  }

  // 其他边框吸附
  for (const otherBox of otherBoxes) {
    const { x: ox, y: oy, width: ow, height: oh } = otherBox

    // X 方向
    if (Math.abs(x - ox) < threshold) {
      snappedX = ox
      guides.push({ type: 'vertical', x: ox })
    }
    if (Math.abs(x + width - (ox + ow)) < threshold) {
      snappedX = ox + ow - width
      guides.push({ type: 'vertical', x: ox + ow })
    }
    if (Math.abs(centerX - (ox + ow / 2)) < threshold) {
      snappedX = ox + ow / 2 - width / 2
      guides.push({ type: 'vertical', x: ox + ow / 2 })
    }

    // Y 方向
    if (Math.abs(y - oy) < threshold) {
      snappedY = oy
      guides.push({ type: 'horizontal', y: oy })
    }
    if (Math.abs(y + height - (oy + oh)) < threshold) {
      snappedY = oy + oh - height
      guides.push({ type: 'horizontal', y: oy + oh })
    }
    if (Math.abs(centerY - (oy + oh / 2)) < threshold) {
      snappedY = oy + oh / 2 - height / 2
      guides.push({ type: 'horizontal', y: oy + oh / 2 })
    }
  }

  return { snappedX, snappedY, guides }
}

/**
 * 仅生成辅助线（不修改坐标），用于 ImageEditor 的计算
 * @param {Object} box 当前边框 { x, y, width, height }
 * @param {number} canvasWidth 画布宽度
 * @param {number} canvasHeight 画布高度
 * @param {Array} otherBoxes 其他边框数组
 * @param {number} threshold 吸附阈值
 * @returns {Array} 辅助线数组
 */
export function getSnapGuides(box, canvasWidth, canvasHeight, otherBoxes = [], threshold = SNAP_THRESHOLD) {
  const { guides } = applySnapPosition(box.x, box.y, box.width, box.height, canvasWidth, canvasHeight, otherBoxes, threshold)
  return guides
}
