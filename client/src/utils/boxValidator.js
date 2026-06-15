/**
 * 边框位置与尺寸校验工具
 *
 * 用于验证边框的 X/Y 位置和 Width/Height 尺寸是否满足约束条件，
 * 确保边框始终位于图片边界之内，并支持水平对齐模式。
 *
 * 使用场景：
 * - 手动精确输入边框位置/尺寸时（属性面板中的 X/Y/W/H 输入）
 * - 程序化批量校验（如粘贴边框、加载预设时）
 * - 导出前预检
 */

/**
 * 校验单个边框的位置与尺寸
 *
 * 校验规则：
 * 1. 位置 (x, y) 和尺寸 (width, height) 必须 >= 0，负数需拦截
 * 2. 边界约束：x + width <= imageWidth, y + height <= imageHeight
 * 3. 水平对齐模式下额外的约束：
 *    - 'right'（靠右）：x 表示距右边的距离，x + width <= imageWidth
 *    - 'center'（居中）：|x - imageWidth/2| + width/2 <= imageWidth/2
 *    - 'left'（默认靠左）：x >= 0，x + width <= imageWidth
 * 4. 宽度和高度最小值保护：至少为 1px
 *
 * @param {Object} box - 边框对象，必须包含 { x, y, width, height }（均为数字）
 * @param {Object} constraints - 约束条件
 * @param {number} constraints.imageWidth  - 图片宽度（原始坐标，下同）
 * @param {number} constraints.imageHeight - 图片高度
 * @param {Object} [options] - 可选配置
 * @param {'left'|'center'|'right'} [options.horizontalAlign='left'] - 水平对齐模式
 * @param {number} [options.minSize=1] - 边框最小宽度/高度
 * @param {boolean} [options.autoCorrect=false] - 是否自动修正越界值
 * @returns {{ valid: boolean, errors: Array<{ field: string, message: string, value: number }>, corrected: Object|null }}
 *
 * @example
 * // 基本校验
 * const result = validateBoxBounds(
 *   { x: -5, y: 10, width: 200, height: 300 },
 *   { imageWidth: 1920, imageHeight: 1080 }
 * )
 * // => { valid: false, errors: [{ field: 'x', message: '左侧距离 (x) 不能为负数', value: -5 }], corrected: null }
 *
 * @example
 * // 靠右对齐
 * const result = validateBoxBounds(
 *   { x: 200, y: 50, width: 1800, height: 400 },
 *   { imageWidth: 1920, imageHeight: 1080 },
 *   { horizontalAlign: 'right' }
 * )
 * // => { valid: false, errors: [{ field: 'x', message: '靠右对齐时，左侧距离 + 边框宽度 (2000px) 超出图片右边界 (1920px)', ... }], corrected: null }
 *
 * @example
 * // 自动修正
 * const result = validateBoxBounds(
 *   { x: 1900, y: 50, width: 200, height: 400 },
 *   { imageWidth: 1920, imageHeight: 1080 },
 *   { autoCorrect: true }
 * )
 * // => { valid: true, errors: [], corrected: { x: 1720, y: 50, width: 200, height: 400 } }
 */
export function validateBoxBounds(box, constraints, options = {}) {
  const {
    horizontalAlign = 'left',
    minSize = 1,
    autoCorrect = false
  } = options

  const { imageWidth, imageHeight } = constraints
  const errors = []

  // 参数类型校验
  if (typeof imageWidth !== 'number' || typeof imageHeight !== 'number') {
    errors.push({
      field: 'constraints',
      message: '图片尺寸无效：必须提供 imageWidth 和 imageHeight',
      value: null
    })
    return { valid: false, errors, corrected: null }
  }

  // 提取并规范化字段值
  const fields = {
    x: { value: box.x, label: '左侧距离 (x)' },
    y: { value: box.y, label: '顶部距离 (y)' },
    width: { value: box.width, label: '边框宽度' },
    height: { value: box.height, label: '边框高度' }
  }

  // ---- 规则 1：非负校验 ----
  for (const [key, { value, label }] of Object.entries(fields)) {
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push({
        field: key,
        message: `${label} 必须为有效数字`,
        value
      })
    } else if (value < 0) {
      errors.push({
        field: key,
        message: `${label} 不能为负数，当前值: ${value}`,
        value
      })
    }
  }

  // 如果已有非负数错误，直接返回（后续校验依赖合法值）
  if (errors.length > 0) {
    return { valid: false, errors, corrected: null }
  }

  const { x, y, width, height } = box

  // ---- 规则 3：最小值保护 ----
  if (width < minSize) {
    errors.push({
      field: 'width',
      message: `边框宽度不能小于 ${minSize}px，当前值: ${width}`,
      value: width
    })
  }
  if (height < minSize) {
    errors.push({
      field: 'height',
      message: `边框高度不能小于 ${minSize}px，当前值: ${height}`,
      value: height
    })
  }

  // ---- 规则 2：边界溢出校验 ----
  const rightEdge = x + width
  const bottomEdge = y + height

  if (rightEdge > imageWidth) {
    const overflow = rightEdge - imageWidth
    const label =
      horizontalAlign === 'right'
        ? `靠右对齐时，左侧距离 + 边框宽度 (${rightEdge}px) 超出图片右边界 (${imageWidth}px)，溢出 ${overflow}px`
        : `边框右边缘 (${rightEdge}px) 超出图片宽度 (${imageWidth}px)，溢出 ${overflow}px`

    errors.push({
      field: horizontalAlign === 'right' ? 'x' : 'width',
      message: label,
      value: overflow
    })
  }

  if (bottomEdge > imageHeight) {
    const overflow = bottomEdge - imageHeight
    errors.push({
      field: 'height',
      message: `边框下边缘 (${bottomEdge}px) 超出图片高度 (${imageHeight}px)，溢出 ${overflow}px`,
      value: overflow
    })
  }

  // ---- 规则 3 补充：居中模式校验 ----
  if (horizontalAlign === 'center') {
    const centerX = imageWidth / 2
    const leftOffset = Math.abs(x - centerX)
    const halfWidth = width / 2

    if (leftOffset + halfWidth > centerX) {
      errors.push({
        field: 'x',
        message: `居中对齐时，边框左/右边缘超出图片范围（中心偏移 ${leftOffset}px + 半宽 ${halfWidth}px > ${centerX}px）`,
        value: x
      })
    }
  }

  // ---- 如果无效且需要自动修正 ----
  if (!autoCorrect) {
    return { valid: errors.length === 0, errors, corrected: null }
  }

  // 自动修正逻辑：将值钳制到有效范围
  const corrected = {
    x: Math.max(0, Math.min(x, imageWidth - Math.max(minSize, width))),
    y: Math.max(0, Math.min(y, imageHeight - Math.max(minSize, height))),
    width: Math.max(minSize, width),
    height: Math.max(minSize, height)
  }

  return { valid: true, errors: [], corrected }
}


/**
 * 批量校验多个边框
 *
 * @param {Array<Object>} boxes - 边框数组
 * @param {Object} constraints - 图片尺寸约束
 * @param {Object} [options] - 同 validateBoxBounds 的 options
 * @returns {{ valid: boolean, results: Array<{ index: number, valid: boolean, errors: Array }> }}
 */
export function validateBoxesBounds(boxes, constraints, options = {}) {
  const results = boxes.map((box, index) => {
    const result = validateBoxBounds(box, constraints, options)
    return { index, valid: result.valid, errors: result.errors, corrected: result.corrected }
  })

  const valid = results.every(r => r.valid)

  return { valid, results }
}
