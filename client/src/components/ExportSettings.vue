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
      
      <!-- 文件名设置 -->
      <div class="setting-group">
        <label class="group-label">文件名</label>
        <div class="filename-control">
          <input 
            type="text" 
            v-model="config.filename" 
            placeholder="输入自定义文件名"
            @input="updateConfig({ filename: config.filename })"
          >
          <div class="filename-preview">
            预览: {{ previewFilename }}
          </div>
        </div>
      </div>
      
      <!-- 高级选项 -->
      <div class="setting-group">
        <label class="group-label">高级选项</label>
        <div class="advanced-options">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="config.includeMetadata"
              @change="updateConfig({ includeMetadata: config.includeMetadata })"
            >
            包含图片元数据
          </label>
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

const emit = defineEmits(['close', 'export'])

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

const previewFilename = computed(() => {
  const baseName = config.value.filename || props.imageProcessor.generateFilename(props.image)
  const extension = config.value.format.toLowerCase()
  return `${baseName}.${extension}`
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
    alert('请先添加边框')
    return
  }
  
  try {
    isGeneratingPreview.value = true
    const url = await props.imageProcessor.previewExport(props.image, props.boxes, config.value)
    previewUrl.value = url
  } catch (error) {
    console.error('生成预览失败:', error)
    alert('生成预览失败: ' + error.message)
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
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.settings-content {
  padding: 20px;
}

.setting-group {
  margin-bottom: 24px;
}

.group-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.format-options {
  display: grid;
  gap: 8px;
}

.format-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-option:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.format-option.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.format-icon {
  font-size: 24px;
  margin-right: 12px;
}

.format-info {
  flex: 1;
}

.format-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.format-desc {
  font-size: 12px;
  color: #6b7280;
}

.quality-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quality-control input[type="range"] {
  flex: 1;
}

.quality-value {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: #374151;
}

.resolution-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resolution-control select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.resolution-info {
  font-size: 12px;
  color: #6b7280;
}

.filename-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filename-control input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.filename-preview {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.preview-section {
  padding: 0 20px 20px;
}

.preview-container {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 