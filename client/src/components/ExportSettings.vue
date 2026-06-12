<template>
  <div class="export-settings">
    <div class="settings-header">
      <h3>导出设置</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    
    <div class="settings-content">
      <!-- 导出格式 -->
      <div class="setting-group">
        <label class="group-label">导出格式</label>
        <div class="format-options">
          <div 
            v-for="format in supportedFormats" 
            :key="format.value"
            class="format-option"
            :class="{ active: config.format === format.value }"
            @click="updateConfig({ format: format.value })"
          >
            <div class="format-icon">{{ getFormatIcon(format.value) }}</div>
            <div class="format-info">
              <div class="format-name">{{ format.label }}</div>
              <div class="format-desc">{{ format.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 质量设置 -->
      <div class="setting-group" v-if="config.format !== 'png'">
        <label class="group-label">质量设置</label>
        <div class="quality-control">
          <input 
            type="range" 
            v-model.number="config.quality" 
            min="0.1" 
            max="1" 
            step="0.1"
            @input="updateConfig({ quality: config.quality })"
          >
          <span class="quality-value">{{ Math.round(config.quality * 100) }}%</span>
        </div>
      </div>
      
      <!-- 分辨率设置 -->
      <div class="setting-group">
        <label class="group-label">分辨率</label>
        <div class="resolution-control">
          <select v-model="config.scale" @change="updateConfig({ scale: config.scale })">
            <option value="1">标准 (1x)</option>
            <option value="2">高清 (2x)</option>
            <option value="3">超高清 (3x)</option>
            <option value="4">印刷级 (4x)</option>
          </select>
          <div class="resolution-info">
            <span>输出尺寸: {{ outputSize }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 预览区域 -->
    <div class="preview-section" v-if="previewUrl">
      <label class="group-label">导出预览</label>
      <div class="preview-container">
        <img :src="previewUrl" alt="导出预览" class="preview-image" />
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="actions">
      <button class="btn btn-secondary" @click="generatePreview">
        生成预览
      </button>
      <button class="btn btn-primary" @click="exportImage">
        导出图片
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  image: {
    type: Object,
    required: true
  },
  boxes: {
    type: Array,
    default: () => []
  },
  imageProcessor: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'export', 'toast'])

// 本地状态
const config = ref({
  format: 'png',
  quality: 0.9,
  scale: 1,
  filename: '',
  includeMetadata: true
})

const previewUrl = ref('')
const isGeneratingPreview = ref(false)

// 计算属性
const supportedFormats = computed(() => {
  return props.imageProcessor.getSupportedFormats()
})

const outputSize = computed(() => {
  if (!props.image) return '未知'
  const width = Math.round(props.image.width * config.value.scale)
  const height = Math.round(props.image.height * config.value.scale)
  return `${width} × ${height}px`
})

// 方法
const updateConfig = (updates) => {
  config.value = { ...config.value, ...updates }
  props.imageProcessor.setExportConfig(config.value)
}

const getFormatIcon = (format) => {
  const icons = {
    png: '🖼️',
    jpeg: '📷',
    jpg: '📷',
    webp: '🌐'
  }
  return icons[format] || '📄'
}

const generatePreview = async () => {
  if (!props.image || props.boxes.length === 0) {
    emit('toast', { message: '请先添加边框', type: 'error' })
    return
  }
  
  try {
    isGeneratingPreview.value = true
    const url = await props.imageProcessor.previewExport(props.image, props.boxes, config.value)
    previewUrl.value = url
  } catch (error) {
    console.error('生成预览失败:', error)
    emit('toast', { message: '生成预览失败: ' + error.message, type: 'error' })
  } finally {
    isGeneratingPreview.value = false
  }
}

const exportImage = () => {
  emit('export', config.value)
}

// 监听配置变化，自动更新处理器配置
watch(config, (newConfig) => {
  props.imageProcessor.setExportConfig(newConfig)
}, { deep: true })

// 初始化
onMounted(() => {
  // 设置默认配置
  props.imageProcessor.setExportConfig(config.value)
})
</script>

<style scoped>
.export-settings {
  background: white;
  border-radius: var(--radius-lg, 6px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.settings-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.settings-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-muted, #6b7280);
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius, 4px);
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--primary-bg, #f3f4f6);
  color: var(--text-color, #1f2937);
}

.settings-content {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.group-label {
  display: block;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin-bottom: 10px;
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0;
}

.format-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.format-option {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius, 4px);
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--secondary-bg, #fff);
}

.format-option:hover {
  border-color: var(--accent-color, #5e6ad2);
}

.format-option.active {
  border-color: var(--accent-color, #5e6ad2);
  background: rgba(94, 106, 210, 0.06);
}

.format-icon {
  font-size: 20px;
  margin-right: 10px;
  flex-shrink: 0;
}

.format-info {
  flex: 1;
  min-width: 0;
}

.format-name {
  font-weight: 600;
  color: var(--text-color, #1f2937);
  font-size: 13px;
  margin-bottom: 1px;
}

.format-desc {
  font-size: 11px;
  color: var(--text-muted, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quality-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quality-control input[type="range"] {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--border-color, #e5e7eb);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.quality-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-color, #5e6ad2);
  cursor: pointer;
}

.quality-value {
  min-width: 44px;
  text-align: right;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-color, #1f2937);
  font-variant-numeric: tabular-nums;
}

.resolution-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resolution-control select {
  padding: 6px 32px 6px 10px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius, 4px);
  background: white;
  font-size: 13px;
  color: var(--text-color, #1f2937);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  cursor: pointer;
}

.resolution-info {
  font-size: 12px;
  color: var(--text-muted, #6b7280);
  white-space: nowrap;
}

.preview-section {
  padding: 0 24px 20px;
  flex-shrink: 0;
}

.preview-container {
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius, 4px);
  overflow: hidden;
  background: var(--primary-bg, #f9fafb);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

.preview-image {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
}

.actions {
  flex-shrink: 0;
  display: flex;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background: var(--primary-bg, #f9fafb);
  border-radius: 0 0 var(--radius-lg, 6px) var(--radius-lg, 6px);
}

.btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius, 4px);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--accent-color, #5e6ad2);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover, #4f5bc4);
}

.btn-secondary {
  background: transparent;
  color: var(--text-color, #1f2937);
  border: 1px solid var(--border-color, #e5e7eb);
}

.btn-secondary:hover {
  background: var(--primary-bg, #f3f4f6);
  border-color: #d1d5db;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 