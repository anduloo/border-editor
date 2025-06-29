<template>
  <div class="border-color-picker">
    <!-- 颜色类型选择 -->
    <div class="control-item">
      <label>颜色类型</label>
      <select v-model="colorType" @change="updateColor">
        <option value="solid">纯色</option>
        <option value="gradient">渐变色</option>
      </select>
    </div>
    
    <!-- 纯色选择器 -->
    <div v-if="colorType === 'solid'" class="control-item">
      <label>边框颜色</label>
      <div ref="pickrRef" class="color-picker"></div>
      <!--<div class="color-preview" :style="{ backgroundColor: solidColor }"></div>-->
    </div>
    
    <!-- 渐变色选择器 -->
    <div v-if="colorType === 'gradient'">
      <!-- 渐变类型和预设渐变在同一行 -->
      <div class="control-row">
        <div class="control-item">
          <label>渐变类型</label>
          <select v-model="gradientType" @change="updateColor">
            <option value="linear">线性渐变</option>
            <option value="radial">径向渐变</option>
          </select>
        </div>
        
        <div class="control-item">
          <label>预设渐变</label>
          <select @change="selectPresetGradientByKey">
            <option value="">选择预设</option>
            <option v-for="(grad, key) in presetGradients" :key="key" :value="key">{{ grad.name }}</option>
          </select>
        </div>
      </div>
      
      <!-- 线性渐变角度 -->
      <div v-if="gradientType === 'linear'" class="control-item">
        <label>角度</label>
        <input 
          type="range" 
          v-model="gradientAngle" 
          min="0" 
          max="360" 
          @input="updateColor"
          class="angle-slider"
        >
        <span class="angle-value">{{ gradientAngle }}°</span>
      </div>
      
      <!-- 颜色选择器在同一行 -->
      <div class="control-row">
        <div class="control-item">
          <label>起始色</label>
          <div ref="startColorRef" class="color-picker"></div>
        </div>
        
        <div class="control-item">
          <label>结束色</label>
          <div ref="endColorRef" class="color-picker"></div>
        </div>
        
        <!-- 中间色（可选） -->
        <div v-if="hasMiddleColor" class="control-item">
          <label>中间色</label>
          <div ref="middleColorRef" class="color-picker"></div>
          <button @click="removeMiddleColor" class="remove-color-btn">×</button>
        </div>
      </div>
      
      <!-- 添加中间色按钮 -->
      <div v-if="!hasMiddleColor" class="control-item">
        <button @click="addMiddleColor" class="add-color-btn">
          + 添加中间色
        </button>
      </div>
      
      <!-- 渐变预览
      <div class="gradient-preview" :style="{ background: generateGradientCSS() }"></div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Pickr from '@simonwep/pickr'
import '@simonwep/pickr/dist/themes/classic.min.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: '#ff00cc'
  }
})

const emit = defineEmits(['update:modelValue'])

// 响应式数据
const colorType = ref('solid')
const solidColor = ref('#ff00cc')
const gradientType = ref('linear')
const gradientAngle = ref(45)
const gradientStartColor = ref('#ff00cc')
const gradientMiddleColor = ref('#ff6600')
const gradientEndColor = ref('#00ff66')
const hasMiddleColor = ref(false)

// Pickr实例
const pickrRef = ref(null)
const startColorRef = ref(null)
const middleColorRef = ref(null)
const endColorRef = ref(null)
let pickrInstance = null
let startColorInstance = null
let middleColorInstance = null
let endColorInstance = null

// 预设渐变色
const presetGradients = {
  'sunny-sky': { name: '晴空蓝橙', type: 'linear', angle: 90, colors: ['#00c6ff', '#ffde00'] },
  'candy-pink': { name: '糖果粉紫', type: 'linear', angle: 135, colors: ['#ff61a6', '#ffb347'] },
  'ocean-wave': { name: '海浪蓝绿', type: 'linear', angle: 120, colors: ['#43cea2', '#185a9d'] },
  'sunset-glow': { name: '落日橙紫', type: 'linear', angle: 160, colors: ['#ff9966', '#ff5e62'] },
  'radial-rainbow': { name: '彩虹径向', type: 'radial', colors: ['#f7971e', '#ffd200'] },
  'radial-sunset': { name: '落日径向', type: 'radial', colors: ['#ff512f', '#dd2476'] },
  'aqua-pink': { name: '水粉蓝粉', type: 'linear', angle: 135, colors: ['#43e97b', '#38f9d7'] },
  'sunrise-orange': { name: '日出橙色', type: 'linear', angle: 15, colors: ['#FF512F', '#F09819'] },
  'deep-ocean': { name: '深海蓝', type: 'linear', angle: 135, colors: ['#005AA7', '#FFFDE4'] },
  'purple-dream': { name: '紫色梦境', type: 'radial', colors: ['#9D50BB', '#6E48AA'] },
  'forest-fresh': { name: '森林清新', type: 'linear', angle: 225, colors: ['#00b09b', '#96c93d'] },
  'cyber-blue': { name: '赛博蓝', type: 'linear', angle: 45, colors: ['#00F260', '#0575E6'] }
}

// 初始化颜色选择器
const initColorPickers = () => {
  // 等待DOM更新完成
  nextTick(() => {
    console.log('初始化颜色选择器:', {
      pickrRef: !!pickrRef.value,
      startColorRef: !!startColorRef.value,
      middleColorRef: !!middleColorRef.value,
      endColorRef: !!endColorRef.value,
      hasMiddleColor: hasMiddleColor.value
    })
    
    // 纯色选择器
    if (pickrRef.value && !pickrInstance) {
      console.log('创建纯色选择器')
      pickrInstance = Pickr.create({
        el: pickrRef.value,
        theme: 'classic',
        default: solidColor.value,
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: {
            hex: true,
            rgba: true,
            hsla: true,
            hsva: true,
            cmyk: true,
            input: true,
            clear: true,
            save: true
          }
        }
      })

      pickrInstance.on('save', (color) => {
        const rgbaArr = color.toRGBA()
        if (rgbaArr && rgbaArr.length === 4) {
          const [r, g, b, a] = rgbaArr
          solidColor.value = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
          updateColor()
        }
        pickrInstance.hide()
      })
    }

    // 起始色选择器
    if (startColorRef.value && !startColorInstance) {
      console.log('创建起始色选择器')
      startColorInstance = Pickr.create({
        el: startColorRef.value,
        theme: 'classic',
        default: gradientStartColor.value,
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: {
            hex: true,
            rgba: true,
            hsla: true,
            hsva: true,
            cmyk: true,
            input: true,
            clear: true,
            save: true
          }
        }
      })

      startColorInstance.on('save', (color) => {
        const rgbaArr = color.toRGBA()
        if (rgbaArr && rgbaArr.length === 4) {
          const [r, g, b, a] = rgbaArr
          gradientStartColor.value = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
          updateColor()
        }
        startColorInstance.hide()
      })
    }

    // 中间色选择器
    if (middleColorRef.value && hasMiddleColor.value && !middleColorInstance) {
      console.log('创建中间色选择器')
      middleColorInstance = Pickr.create({
        el: middleColorRef.value,
        theme: 'classic',
        default: gradientMiddleColor.value,
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: {
            hex: true,
            rgba: true,
            hsla: true,
            hsva: true,
            cmyk: true,
            input: true,
            clear: true,
            save: true
          }
        }
      })

      middleColorInstance.on('save', (color) => {
        const rgbaArr = color.toRGBA()
        if (rgbaArr && rgbaArr.length === 4) {
          const [r, g, b, a] = rgbaArr
          gradientMiddleColor.value = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
          updateColor()
        }
        middleColorInstance.hide()
      })
    }

    // 结束色选择器
    if (endColorRef.value && !endColorInstance) {
      console.log('创建结束色选择器')
      endColorInstance = Pickr.create({
        el: endColorRef.value,
        theme: 'classic',
        default: gradientEndColor.value,
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: {
            hex: true,
            rgba: true,
            hsla: true,
            hsva: true,
            cmyk: true,
            input: true,
            clear: true,
            save: true
          }
        }
      })

      endColorInstance.on('save', (color) => {
        const rgbaArr = color.toRGBA()
        if (rgbaArr && rgbaArr.length === 4) {
          const [r, g, b, a] = rgbaArr
          gradientEndColor.value = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
          updateColor()
        }
        endColorInstance.hide()
      })
    }
  })
}

// 生成渐变CSS
const generateGradientCSS = (gradient = null) => {
  if (gradient) {
    if (gradient.type === 'linear') {
      return `linear-gradient(${gradient.angle}deg, ${gradient.colors.join(', ')})`
    } else {
      return `radial-gradient(circle, ${gradient.colors.join(', ')})`
    }
  }

  if (colorType.value === 'solid') {
    return solidColor.value
  }

  if (colorType.value === 'gradient') {
    const colors = hasMiddleColor.value 
      ? [gradientStartColor.value, gradientMiddleColor.value, gradientEndColor.value]
      : [gradientStartColor.value, gradientEndColor.value]
    
    if (gradientType.value === 'linear') {
      return `linear-gradient(${gradientAngle.value}deg, ${colors.join(', ')})`
    } else {
      return `radial-gradient(circle, ${colors.join(', ')})`
    }
  }

  return solidColor.value
}

// 选择预设渐变
const selectPresetGradient = (gradient) => {
  gradientType.value = gradient.type
  gradientAngle.value = gradient.angle || 45
  gradientStartColor.value = gradient.colors[0]
  gradientEndColor.value = gradient.colors[gradient.colors.length - 1]
  
  if (gradient.colors.length > 2) {
    gradientMiddleColor.value = gradient.colors[1]
    hasMiddleColor.value = true
  } else {
    hasMiddleColor.value = false
  }
  
  colorType.value = 'gradient'
  updateColor()
}

// 通过key选择预设渐变
const selectPresetGradientByKey = (event) => {
  const key = event.target.value
  if (key && presetGradients[key]) {
    selectPresetGradient(presetGradients[key])
  }
}

// 添加中间色
const addMiddleColor = () => {
  hasMiddleColor.value = true
  nextTick(() => {
    initColorPickers()
  })
  updateColor()
}

// 移除中间色
const removeMiddleColor = () => {
  hasMiddleColor.value = false
  if (middleColorInstance) {
    middleColorInstance.destroy()
    middleColorInstance = null
  }
  updateColor()
}

// 更新颜色
const updateColor = () => {
  const colorValue = generateGradientCSS()
  emit('update:modelValue', colorValue)
}

// 解析输入的颜色值
const parseColorValue = (value) => {
  if (value && value.includes('gradient')) {
    colorType.value = 'gradient'
    // 解析渐变
    if (value.includes('linear-gradient')) {
      gradientType.value = 'linear'
      // 提取角度和颜色
      const angleMatch = value.match(/(\d+)deg/)
      if (angleMatch) {
        gradientAngle.value = parseInt(angleMatch[1])
      }
      
      // 提取颜色
      const colors = value.match(/#[a-fA-F0-9]{6}|rgba?\([^)]+\)/g) || []
      if (colors.length >= 2) {
        gradientStartColor.value = colors[0]
        gradientEndColor.value = colors[colors.length - 1]
        if (colors.length > 2) {
          gradientMiddleColor.value = colors[1]
          hasMiddleColor.value = true
        } else {
          hasMiddleColor.value = false
        }
      }
    } else if (value.includes('radial-gradient')) {
      gradientType.value = 'radial'
      // 提取颜色
      const colors = value.match(/#[a-fA-F0-9]{6}|rgba?\([^)]+\)/g) || []
      if (colors.length >= 2) {
        gradientStartColor.value = colors[0]
        gradientEndColor.value = colors[colors.length - 1]
        if (colors.length > 2) {
          gradientMiddleColor.value = colors[1]
          hasMiddleColor.value = true
        } else {
          hasMiddleColor.value = false
        }
      }
    }
  } else if (value) {
    colorType.value = 'solid'
    solidColor.value = value
  }
}

// 监听输入值变化
watch(() => props.modelValue, (newValue) => {
  const currentValue = generateGradientCSS()
  if (newValue && newValue !== currentValue) {
    parseColorValue(newValue)
  }
}, { immediate: true })

// 监听颜色类型变化
watch(colorType, () => {
  updateColor()
  // 重新初始化颜色选择器
  nextTick(() => {
    // 销毁现有实例
    if (pickrInstance) {
      pickrInstance.destroy()
      pickrInstance = null
    }
    if (startColorInstance) {
      startColorInstance.destroy()
      startColorInstance = null
    }
    if (middleColorInstance) {
      middleColorInstance.destroy()
      middleColorInstance = null
    }
    if (endColorInstance) {
      endColorInstance.destroy()
      endColorInstance = null
    }
    // 重新初始化
    initColorPickers()
  })
})

// 监听渐变角度变化
watch(gradientAngle, () => {
  if (colorType.value === 'gradient' && gradientType.value === 'linear') {
    updateColor()
  }
})

// 监听渐变颜色变化
watch([gradientStartColor, gradientMiddleColor, gradientEndColor], () => {
  if (colorType.value === 'gradient') {
    updateColor()
  }
})

onMounted(() => {
  // 延迟初始化，确保DOM完全渲染
  setTimeout(() => {
    initColorPickers()
  }, 100)
})

onBeforeUnmount(() => {
  if (pickrInstance) pickrInstance.destroy()
  if (startColorInstance) startColorInstance.destroy()
  if (middleColorInstance) middleColorInstance.destroy()
  if (endColorInstance) endColorInstance.destroy()
})
</script>

<style scoped>
.border-color-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
  min-width: 60px;
}

.control-item input,
.control-item select {
  height: 32px;
  padding: 0 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  font-size: 0.875rem;
  background: var(--primary-bg);
  color: var(--text-color);
  transition: all 0.2s;
  outline: none;
}

.control-item input:focus,
.control-item select:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.control-item input[type="number"] {
  width: 60px;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  cursor: pointer;
  background: var(--secondary-bg);
  position: relative;
  z-index: 1000;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  border: 2px solid var(--border-color);
  cursor: pointer;
  position: relative;
  z-index: 1000;
}

.remove-color-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--danger-color);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-color-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.add-color-btn {
  height: 32px;
  padding: 0 0.75rem;
  border: 1px dashed var(--border-color);
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.add-color-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.gradient-preview {
  width: 100%;
  height: 40px;
  border-radius: var(--radius);
  border: 2px solid var(--border-color);
  margin-top: 8px;
}

.angle-slider {
  width: 100%;
}

.angle-value {
  margin-left: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.control-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 8px;
}

.control-row .control-item {
  flex: 1;
  margin-bottom: 0;
}
</style> 