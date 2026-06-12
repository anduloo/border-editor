<template>
  <div id="app-container">
    <!-- Toast 通知 -->
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
        <span class="toast-icon">{{ toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✅' : 'ℹ️' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="removeToast(toast.id)">×</button>
      </div>
    </TransitionGroup>

    <!-- 顶部工具栏 -->
    <header class="app__toolbar">
      <div class="toolbar__logo">Border <span>Editor</span></div>
      <div class="toolbar__divider"></div>
      
      <button class="toolbar-btn toolbar-btn--primary" @click="$refs.fileInput.click()" title="上传图片">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        上传
      </button>
      
      <div class="toolbar-dropdown-wrapper">
        <button class="toolbar-btn toolbar-btn--ghost" @click="showAddBorderDropdown = !showAddBorderDropdown" title="添加边框">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加边框
          <span class="toolbar__dropdown-arrow">▾</span>
        </button>
        <div v-if="showAddBorderDropdown" class="toolbar-dropdown">
          <button class="toolbar-dropdown__item" @click="addCropBoxWithGlobalSettings('rectangle', 16/9); showAddBorderDropdown = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
            矩形边框 (16:9)
          </button>
          <button class="toolbar-dropdown__item" @click="addCropBoxWithGlobalSettings('rectangle', 4/3); showAddBorderDropdown = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
            矩形边框 (4:3)
          </button>
          <button class="toolbar-dropdown__item" @click="addCropBoxWithGlobalSettings('square'); showAddBorderDropdown = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
            正方形边框
          </button>
          <button class="toolbar-dropdown__item" @click="addCropBoxWithGlobalSettings('circle'); showAddBorderDropdown = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>
            圆形边框
          </button>
        </div>
      </div>
      
      <div class="toolbar__divider"></div>
      
      <button class="toolbar-btn toolbar-btn--icon" :disabled="!isUndoAvailable" @click="handleUndo" title="撤销 (Ctrl+Z)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </button>
      <button class="toolbar-btn toolbar-btn--icon" :disabled="!isRedoAvailable" @click="handleRedo" title="重做 (Ctrl+Shift+Z)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
      </button>
      
      <div class="toolbar__spacer"></div>
      
      <button class="toolbar-btn toolbar-btn--icon" @click="fitCanvas" title="适应画布">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>
      
      <div class="toolbar-zoom">
        <button class="toolbar-zoom__btn" @click="zoomOut" title="缩小">−</button>
        <span class="toolbar-zoom__value" @click="zoomReset">{{ Math.round(zoomLevel * 100) }}%</span>
        <button class="toolbar-zoom__btn" @click="zoomIn" title="放大">+</button>
      </div>
      
    </header>
    
    <div class="app__body">
      <!-- 左侧面板 -->
      <aside class="app__panel">
        <div class="panel-content">
          <!-- 错误提示 -->
          <div v-if="store.error" class="panel-error">
            <p>{{ store.error }}</p>
          </div>

          <template v-if="store.hasImage">
            <!-- 边框列表 — accordion -->
            <div class="accordion" :class="{ 'accordion--open': accordionOpen.borderList }">
              <div class="accordion__header" @click="accordionOpen.borderList = !accordionOpen.borderList">
                <span class="accordion__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
                </span>
                <span class="accordion__title">边框列表</span>
                <span class="accordion__chevron">▾</span>
              </div>
              <div class="accordion__body">
                <div v-if="!store.hasBoxes" class="panel-empty">点击工具栏「添加边框」开始</div>
                <div v-else class="border-items">
                  <template v-for="(box, index) in store.cropBoxes" :key="box.id">
                    <div 
                      :class="['border-item', { 'border-item--active': index === store.activeBoxIndex }]"
                      @click="setActiveBox(index)"
                    >
                      <span class="border-item__shape-icon">
                        <svg v-if="box.type === 'circle'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/></svg>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                      </span>
                      <span class="border-item__name">边框 {{ index + 1 }}</span>
                      <span class="border-item__color-swatch" :style="{ background: box.color }"></span>
                      <button 
                        :class="['border-item__lock-btn', { 'border-item__lock-btn--locked': box.lockAspectRatio }]"
                        @click.stop="toggleBoxLock(index)"
                        :title="box.lockAspectRatio ? '解锁宽高比' : '锁定宽高比'"
                      >
                        <svg v-if="box.lockAspectRatio" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                      </button>
                      <button class="border-item__delete" @click.stop="removeBox(index)" title="删除">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </template>
                  <div class="border-item__actions">
                    <button @click="removeActiveBox" class="panel-btn panel-btn--sm panel-btn--danger" :disabled="!(store.activeBoxIndex >= 0)">删除选中</button>
                    <button @click="clearAllBoxes" class="panel-btn panel-btn--sm panel-btn--danger" :disabled="!store.hasBoxes">清除全部</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 外观设置 — accordion -->
            <div class="accordion" :class="{ 'accordion--open': accordionOpen.appearance }">
              <div class="accordion__header" @click="accordionOpen.appearance = !accordionOpen.appearance">
                <span class="accordion__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </span>
                <span class="accordion__title">外观设置</span>
                <span class="accordion__chevron">▾</span>
              </div>
              <div class="accordion__body">
                <template v-if="store.hasBoxes">
                  <div class="tab-switch">
                    <button :class="['tab-switch__btn', { 'tab-switch__btn--active': appearanceTab === 'solid' }]" @click="appearanceTab = 'solid'">纯色</button>
                    <button :class="['tab-switch__btn', { 'tab-switch__btn--active': appearanceTab === 'gradient' }]" @click="appearanceTab = 'gradient'">渐变</button>
                  </div>

                  <!-- 纯色模式 -->
                  <template v-if="appearanceTab === 'solid'">
                    <div class="prop-row">
                      <span class="prop-row__label">颜色</span>
                      <div class="prop-row__value">
                        <div ref="borderSolidColorRef" class="color-picker-trigger" :style="{ background: globalBorderColor }" tabindex="0"></div>
                      </div>
                    </div>
                  </template>

                  <!-- 渐变模式 -->
                  <template v-if="appearanceTab === 'gradient'">
                    <div class="prop-row">
                      <span class="prop-row__label">类型</span>
                      <div class="prop-row__value">
                        <select v-model="gradientStyle" class="panel-select" @change="onGradientChange">
                          <option value="linear">线性</option>
                          <option value="radial">径向</option>
                        </select>
                      </div>
                    </div>
                    <div class="prop-row" v-if="gradientStyle === 'linear'">
                      <span class="prop-row__label">角度</span>
                      <div class="prop-row__value">
                        <div class="slider-group">
                          <input type="range" v-model.number="gradientAngle" min="0" max="360" @input="onGradientChange">
                          <input type="text" class="num-input" :value="gradientAngle" @input="gradientAngle = Number($event.target.value); onGradientChange()" @change="onGradientChange">
                        </div>
                      </div>
                    </div>
                    <div class="prop-row">
                      <span class="prop-row__label">起始色</span>
                      <div class="prop-row__value">
                        <div ref="gradientStartColorRef" class="color-picker-trigger" :style="{ background: gradientStartColor }" tabindex="0"></div>
                      </div>
                    </div>
                    <div class="prop-row">
                      <span class="prop-row__label">中间色</span>
                      <div class="prop-row__value" style="display:flex;align-items:center;gap:8px;">
                        <button :class="['toggle', { 'toggle--on': gradientUseMiddle }]" @click="gradientUseMiddle = !gradientUseMiddle; onGradientChange()">
                          <span class="toggle__thumb"></span>
                        </button>
                        <div v-if="gradientUseMiddle" ref="gradientMiddleColorRef" class="color-picker-trigger" :style="{ background: gradientMiddleColor }" tabindex="0"></div>
                      </div>
                    </div>
                    <div class="prop-row">
                      <span class="prop-row__label">结束色</span>
                      <div class="prop-row__value">
                        <div ref="gradientEndColorRef" class="color-picker-trigger" :style="{ background: gradientEndColor }" tabindex="0"></div>
                      </div>
                    </div>
                  </template>

                  <div class="prop-row">
                    <span class="prop-row__label">宽度</span>
                    <div class="prop-row__value">
                      <div class="slider-group">
                        <input type="range" v-model.number="globalBorderWidth" min="1" max="40" @input="scheduleSync">
                        <input type="text" class="num-input" :value="globalBorderWidth" @input="globalBorderWidth = Number($event.target.value)" @change="scheduleSync">
                      </div>
                    </div>
                  </div>
                  <div class="prop-row">
                    <span class="prop-row__label">圆角</span>
                    <div class="prop-row__value">
                      <div class="slider-group">
                        <input type="range" v-model.number="globalBorderRadius" min="0" max="100" @input="scheduleSync">
                        <input type="text" class="num-input" :value="globalBorderRadius" @input="globalBorderRadius = Number($event.target.value)" @change="scheduleSync">
                      </div>
                    </div>
                  </div>
                  <div class="prop-row">
                    <span class="prop-row__label">辅助线</span>
                    <div class="prop-row__value">
                      <button :class="['toggle', { 'toggle--on': showAlignmentGuides }]" @click="showAlignmentGuides = !showAlignmentGuides">
                        <span class="toggle__thumb"></span>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- 阴影设置 — accordion -->
            <div class="accordion" :class="{ 'accordion--open': accordionOpen.shadow }">
              <div class="accordion__header" @click="accordionOpen.shadow = !accordionOpen.shadow">
                <span class="accordion__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1" opacity="0.3"/></svg>
                </span>
                <span class="accordion__title">阴影</span>
                <span class="accordion__chevron">▾</span>
              </div>
              <div class="accordion__body">
                <template v-if="store.hasBoxes">
                  <div class="prop-row">
                    <span class="prop-row__label">启用</span>
                    <div class="prop-row__value">
                      <button :class="['toggle', { 'toggle--on': globalShadowEnabled }]" @click="globalShadowEnabled = !globalShadowEnabled; handleShadowEnabledChange()">
                        <span class="toggle__thumb"></span>
                      </button>
                    </div>
                  </div>
                  <template v-if="globalShadowEnabled">
                    <div class="prop-row">
                      <span class="prop-row__label">颜色</span>
                      <div class="prop-row__value">
                        <div ref="shadowColorRef" class="color-picker-trigger" :style="{ background: globalShadowColor }" tabindex="0"></div>
                      </div>
                    </div>
                    <div class="prop-row">
                      <span class="prop-row__label">X偏移</span>
                      <div class="prop-row__value">
                        <div class="slider-group">
                          <input type="range" v-model.number="globalShadowX" min="-20" max="20" @input="scheduleSync">
                          <input type="text" class="num-input" :value="globalShadowX" @input="globalShadowX = Number($event.target.value)" @change="scheduleSync">
                        </div>
                      </div>
                    </div>
                    <div class="prop-row">
                      <span class="prop-row__label">Y偏移</span>
                      <div class="prop-row__value">
                        <div class="slider-group">
                          <input type="range" v-model.number="globalShadowY" min="-20" max="20" @input="scheduleSync">
                          <input type="text" class="num-input" :value="globalShadowY" @input="globalShadowY = Number($event.target.value)" @change="scheduleSync">
                        </div>
                      </div>
                    </div>
                    <div class="prop-row">
                      <span class="prop-row__label">模糊</span>
                      <div class="prop-row__value">
                        <div class="slider-group">
                          <input type="range" v-model.number="globalShadowBlur" min="0" max="30" @input="scheduleSync">
                          <input type="text" class="num-input" :value="globalShadowBlur" @input="globalShadowBlur = Number($event.target.value)" @change="scheduleSync">
                        </div>
                      </div>
                    </div>
                  </template>
                </template>
              </div>
            </div>

            <!-- 导出 — accordion -->
            <div class="accordion" :class="{ 'accordion--open': accordionOpen.export }">
              <div class="accordion__header" @click="accordionOpen.export = !accordionOpen.export">
                <span class="accordion__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </span>
                <span class="accordion__title">导出</span>
                <span class="accordion__chevron">▾</span>
              </div>
              <div class="accordion__body">
                <div class="export-quick">
                  <button class="btn btn--primary export-quick__btn" @click="quickExport" :disabled="!store.hasBoxes || store.isLoading || isExporting">
                    <span v-if="isExporting" class="loading-spinner"></span>
                    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {{ isExporting ? '导出中...' : '导出图片' }}
                  </button>
                  <button class="export-advanced-link" @click="showExportSettings = true">高级导出选项…</button>
                </div>
              </div>
            </div>

            <!-- 操作区 -->
            <div class="panel-actions">
              <button @click="showResetConfirm = true" class="panel-btn panel-btn--secondary">重置所有设置</button>
            </div>

            <!-- 快捷键提示 -->
            <div class="panel-tips">
              <div class="tip-row"><span class="tip-key">▲▼◀▶</span> 方向键微调</div>
              <div class="tip-row"><span class="tip-key">⇧</span> Shift 加速移动</div>
              <div class="tip-row"><span class="tip-key">⌫</span> Delete 删除边框</div>
            </div>
          </template>
        </div>
      </aside>
      
      <div 
        class="preview-section"
        :class="{ 'drag-over': isDragOver }"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <!-- 隐藏的文件上传 input -->
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileUpload" 
          accept="image/*" 
          style="display: none"
        >
        <!-- 图片编辑器 -->
        <ImageEditor 
          ref="imageEditorRef"
          v-if="store.hasImage"
          :image="store.currentImage"
          :lock-aspect-ratio="store.activeBox?.lockAspectRatio ?? true"
          :show-alignment-guides="showAlignmentGuides"
          :zoom-level="zoomLevel"
          @update="handleUpdate"
          @toast="(payload) => showToast(payload.message, payload.type)"
          @add-box="(type, ratio) => addCropBoxWithGlobalSettings(type, ratio)"
          @context-export="quickExport"
          @context-advanced-export="showExportSettings = true"
        />
        <div v-else class="empty-state" @click="$refs.fileInput.click()">
          <svg class="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <h3>拖拽图片到此处或点击上传</h3>
          <p>支持 JPG, PNG, GIF, WebP 格式</p>
          <button class="toolbar-btn toolbar-btn--primary" @click.stop="$refs.fileInput.click()">选择图片</button>
        </div>
      </div>
    </div>
    
    <!-- 状态栏 -->
    <footer class="status-bar">
      <div class="status-left">
        <span v-if="store.hasImage" class="status-item">
          📐 画布 {{ store.currentImage?.width }} × {{ store.currentImage?.height }}
        </span>
        <span v-if="store.activeBox" class="status-item">
          📏 边框 {{ Math.round(store.activeBox.width) }} × {{ Math.round(store.activeBox.height) }}px
        </span>
        <span v-if="store.hasBoxes" class="status-item">
          🔲 边框 {{ store.cropBoxes.length }} 个
        </span>
      </div>
      <div class="status-right">
        <span v-if="store.hasImage" class="status-item">
          🔍 {{ Math.round(zoomLevel * 100) }}%
        </span>
        <span class="status-item">Border Editor v1.0</span>
      </div>
    </footer>
    
    <!-- 导出设置弹窗 -->
    <div v-if="showExportSettings" class="modal-overlay" @click="showExportSettings = false">
      <div class="modal-content" @click.stop>
        <ExportSettings
          :image="store.currentImage"
          :boxes="store.cropBoxes"
          :image-processor="imageProcessor"
          @close="showExportSettings = false"
          @export="handleExportConfirm"
          @toast="(payload) => showToast(payload.message, payload.type)"
        />
      </div>
    </div>

    <!-- 重置确认弹窗 -->
    <div v-if="showResetConfirm" class="modal-overlay" @click="showResetConfirm = false">
      <div class="modal-content confirm-dialog" @click.stop>
        <div class="confirm-header">
          <svg class="icon-svg warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <h3>确认重置</h3>
        </div>
        <p class="confirm-message">此操作将清除当前图片和所有边框设置，且无法通过撤销恢复。确定要继续吗？</p>
        <div class="confirm-actions">
          <button @click="showResetConfirm = false" class="btn btn-secondary">取消</button>
          <button @click="doReset" class="btn btn-danger">确认重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditorStore } from './stores/editor'
import { useImageProcessor } from './composables/useImageProcessor'
import { useUndoRedo } from './composables/useUndoRedo'
import ImageEditor from './components/ImageEditor.vue'
import ExportSettings from './components/ExportSettings.vue'
import Pickr from '@simonwep/pickr'
import '@simonwep/pickr/dist/themes/classic.min.css'

const store = useEditorStore()
const imageProcessor = useImageProcessor()
const { saveState, undo, redo, isUndoAvailable, isRedoAvailable } = useUndoRedo()

const showAlignmentGuides = ref(true)
const zoomLevel = ref(1)

// 全局边框设置
const globalBorderColor = ref('#5e6ad2')
const globalBorderWidth = ref(4)
const globalBorderRadius = ref(8)
const globalShadowEnabled = ref(false)
const globalShadowColor = ref('rgba(0,0,0,0.5)')
const globalShadowX = ref(0)
const globalShadowY = ref(0)
const globalShadowBlur = ref(10)

// 渐变边框设置
const gradientStyle = ref('linear')
const gradientAngle = ref(45)
const gradientStartColor = ref('#5e6ad2')
const gradientUseMiddle = ref(false)
const gradientMiddleColor = ref('rgba(128,128,255,1)')
const gradientEndColor = ref('#1a1d23')

// 导出相关
const showExportSettings = ref(false)
const exportProgress = ref(0)
const isExporting = ref(false)
const showResetConfirm = ref(false)

// 拖拽上传
const isDragOver = ref(false)
let dragCounter = 0
const onDragOver = () => {
  dragCounter++
  isDragOver.value = true
}
const onDragLeave = () => {
  dragCounter--
  if (dragCounter === 0) {
    isDragOver.value = false
  }
}
const onDrop = async (event) => {
  dragCounter = 0
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await doUpload(file)
  } else {
    showToast('请上传图片文件', 'error')
  }
}

// Toast 通知系统
const toasts = ref([])
let toastId = 0
const toastTimers = new Map()
const showToast = (message, type = 'info') => {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  const timer = setTimeout(() => removeToast(id), 3500)
  toastTimers.set(id, timer)
}
const removeToast = (id) => {
  const timer = toastTimers.get(id)
  if (timer) { clearTimeout(timer); toastTimers.delete(id) }
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// 阴影颜色选择器
const shadowColorRef = ref(null)
let shadowColorInstance = null

// 纯色边框颜色选择器
const borderSolidColorRef = ref(null)
let borderSolidColorInstance = null

// 渐变起止色选择器
const gradientStartColorRef = ref(null)
const gradientMiddleColorRef = ref(null)
const gradientEndColorRef = ref(null)
let gradientStartColorInstance = null
let gradientMiddleColorInstance = null
let gradientEndColorInstance = null

const { uploadImage, addBox, setActiveBox, removeBox, clearAllBoxes, reset: storeReset } = store
const { processImage, downloadImage, generateFilename, setExportConfig, debugCoordinateConversion } = imageProcessor
const imageEditorRef = ref(null)

// rAF 批量同步，避免高频 slider 输入时每帧多次触发
let syncRafId = null
const scheduleSync = () => {
  if (syncRafId) return
  syncRafId = requestAnimationFrame(() => {
    forceSyncAllBoxes()
    syncRafId = null
  })
}

// Pickr 工厂函数 — 消除三段重复的初始化代码
const PICKR_COMPONENTS = {
  preview: true, opacity: true, hue: true,
  interaction: { hex: true, rgba: true, hsla: true, hsva: true, cmyk: true, input: true, clear: true, save: true }
}

const createPickrInstance = (el, defaultColor, onSave, extraOptions = {}) => {
  if (!el) return null
  const instance = Pickr.create({
    el,
    theme: 'classic',
    default: defaultColor,
    components: PICKR_COMPONENTS,
    ...extraOptions
  })
  instance.on('save', (color) => {
    const rgbaArr = color.toRGBA()
    if (rgbaArr && rgbaArr.length === 4) {
      const [r, g, b, a] = rgbaArr
      onSave(`rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`)
    }
    instance.hide()
  })
  return instance
}

const initShadowColorPicker = () => {
  if (!shadowColorRef.value || !globalShadowEnabled.value || shadowColorInstance) return
  shadowColorInstance = createPickrInstance(
    shadowColorRef.value,
    globalShadowColor.value || 'rgba(0,0,0,0.5)',
    (rgba) => { globalShadowColor.value = rgba; forceSyncAllBoxes() }
  )
}

const initBorderSolidColorPicker = () => {
  if (!borderSolidColorRef.value || borderSolidColorInstance) return
  borderSolidColorInstance = createPickrInstance(
    borderSolidColorRef.value,
    globalBorderColor.value || '#5e6ad2',
    (rgba) => { globalBorderColor.value = rgba; forceSyncAllBoxes() }
  )
}

const initGradientColorPickers = () => {
  if (gradientStartColorRef.value && !gradientStartColorInstance) {
    gradientStartColorInstance = createPickrInstance(
      gradientStartColorRef.value,
      gradientStartColor.value || '#5e6ad2',
      (rgba) => { gradientStartColor.value = rgba; onGradientChange() }
    )
  }
  if (gradientMiddleColorRef.value && !gradientMiddleColorInstance) {
    gradientMiddleColorInstance = createPickrInstance(
      gradientMiddleColorRef.value,
      gradientMiddleColor.value || 'rgba(128,128,255,1)',
      (rgba) => { gradientMiddleColor.value = rgba; onGradientChange() }
    )
  }
  if (gradientEndColorRef.value && !gradientEndColorInstance) {
    gradientEndColorInstance = createPickrInstance(
      gradientEndColorRef.value,
      gradientEndColor.value || '#1a1d23',
      (rgba) => { gradientEndColor.value = rgba; onGradientChange() }
    )
  }
}

const destroyGradientPickers = () => {
  if (gradientStartColorInstance) { gradientStartColorInstance.destroy(); gradientStartColorInstance = null }
  if (gradientMiddleColorInstance) { gradientMiddleColorInstance.destroy(); gradientMiddleColorInstance = null }
  if (gradientEndColorInstance) { gradientEndColorInstance.destroy(); gradientEndColorInstance = null }
}

const destroyBorderSolidPicker = () => {
  if (borderSolidColorInstance) { borderSolidColorInstance.destroy(); borderSolidColorInstance = null }
}

const onGradientChange = () => {
  const colors = gradientUseMiddle.value
    ? [gradientStartColor.value, gradientMiddleColor.value, gradientEndColor.value]
    : [gradientStartColor.value, gradientEndColor.value]
  if (gradientStyle.value === 'linear') {
    globalBorderColor.value = `linear-gradient(${gradientAngle.value}deg, ${colors.join(', ')})`
  } else {
    globalBorderColor.value = `radial-gradient(circle, ${colors.join(', ')})`
  }
  forceSyncAllBoxes()
}

// 中间色开关变化时，初始化和销毁颜色选择器
watch(gradientUseMiddle, (enabled) => {
  if (enabled) {
    nextTick(() => initGradientColorPickers())
  } else {
    if (gradientMiddleColorInstance) {
      gradientMiddleColorInstance.destroy()
      gradientMiddleColorInstance = null
    }
  }
})

const doUpload = async (file) => {
  try {
    await uploadImage(file)
    await nextTick()
    saveState({ boxes: JSON.parse(JSON.stringify(store.cropBoxes)), imageMeta: store.currentImage ? { url: store.currentImage.url, width: store.currentImage.width, height: store.currentImage.height, name: store.currentImage.name } : null })
  } catch {
    showToast('图片加载失败，请重试', 'error')
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) await doUpload(file)
}

const addCropBoxWithGlobalSettings = (type, ratio = 1) => {
  // 边框尺寸相对于图片尺寸，默认占图片较短边的 30%
  const imgW = store.currentImage?.width || 800
  const imgH = store.currentImage?.height || 600
  const refSize = Math.min(imgW, imgH) * 0.3
  const width = refSize
  const height = refSize / ratio
  const x = (imgW - width) / 2
  const y = (imgH - height) / 2
  const borderRadius = type === 'circle' ? 50 : globalBorderRadius.value
  
  addBox(type, {
    x, y, width, height,
    color: globalBorderColor.value,
    borderWidth: globalBorderWidth.value,
    borderRadius,
    shadowEnabled: globalShadowEnabled.value,
    shadowColor: globalShadowColor.value,
    shadowX: globalShadowX.value,
    shadowY: globalShadowY.value,
    shadowBlur: globalShadowBlur.value
  })
  
  nextTick(() => {
    saveState({ boxes: JSON.parse(JSON.stringify(store.cropBoxes)), imageMeta: store.currentImage ? { url: store.currentImage.url, width: store.currentImage.width, height: store.currentImage.height, name: store.currentImage.name } : null })
  })
}

const forceSyncAllBoxes = () => {
  if (store.cropBoxes.length === 0) return
  store.cropBoxes.forEach((box, index) => {
    store.updateBox(index, {
      color: globalBorderColor.value,
      borderWidth: globalBorderWidth.value,
      borderRadius: box.type === 'circle' ? 50 : globalBorderRadius.value,
      shadowEnabled: globalShadowEnabled.value,
      shadowColor: globalShadowColor.value,
      shadowX: globalShadowX.value,
      shadowY: globalShadowY.value,
      shadowBlur: globalShadowBlur.value
    })
  })
}

const removeActiveBox = () => {
  if (store.activeBoxIndex >= 0) {
    removeBox(store.activeBoxIndex)
    saveState({ boxes: JSON.parse(JSON.stringify(store.cropBoxes)), imageMeta: store.currentImage ? { url: store.currentImage.url, width: store.currentImage.width, height: store.currentImage.height, name: store.currentImage.name } : null })
  }
}

const handleShadowEnabledChange = () => {
  // 关闭阴影时销毁 Pickr 实例
  if (!globalShadowEnabled.value) {
    if (shadowColorInstance) {
      shadowColorInstance.destroy()
      shadowColorInstance = null
    }
    forceSyncAllBoxes()
    return
  }
  forceSyncAllBoxes()
  nextTick(() => initShadowColorPicker())
}

// 缩放
const zoomIn = () => { zoomLevel.value = Math.min(3, zoomLevel.value + 0.25) }
const zoomOut = () => { zoomLevel.value = Math.max(0.25, zoomLevel.value - 0.25) }
const zoomReset = () => { zoomLevel.value = 1 }
const fitCanvas = () => {
  zoomLevel.value = 1
  showToast('已适应画布', 'info')
}

// 面板折叠状态
const accordionOpen = ref({
  borderList: true,
  appearance: true,
  shadow: false,
  export: false
})

// 外观选项卡
const appearanceTab = ref('solid')

// 添加边框下拉
const showAddBorderDropdown = ref(false)

// 撤销/重做
const handleUndo = () => {
  const previousState = undo()
  if (previousState) store.cropBoxes = previousState.boxes
}
const handleRedo = () => {
  const nextState = redo()
  if (nextState) store.cropBoxes = nextState.boxes
}

const toggleBoxLock = (index) => {
  if (index >= 0 && index < store.cropBoxes.length) {
    const box = store.cropBoxes[index]
    store.updateBox(index, { lockAspectRatio: !box.lockAspectRatio })
  }
}

const getDisplaySize = () => {
  if (imageEditorRef.value?.getImageDisplaySize) {
    return imageEditorRef.value.getImageDisplaySize()
  }
  const previewImg = document.querySelector('.canvas-container img')
  if (previewImg) {
    const cs = window.getComputedStyle(previewImg)
    return { width: parseFloat(cs.width), height: parseFloat(cs.height) }
  }
  if (store.currentImage) {
    return { width: store.currentImage.width, height: store.currentImage.height }
  }
  return null
}

const quickExport = async () => {
  if (!store.currentImage || store.cropBoxes.length === 0) {
    showToast('请先添加边框', 'error')
    return
  }
  
  try {
    isExporting.value = true
    exportProgress.value = 0
    
    const displaySize = getDisplaySize()
    if (!displaySize) throw new Error('无法获取图片显示尺寸')
    
    debugCoordinateConversion(store.currentImage, store.cropBoxes)
    
    // 监听真实的导出进度
    const unwatch = watch(() => imageProcessor.progress.value, (v) => {
      exportProgress.value = v
    })
    
    const blob = await processImage(store.currentImage, store.cropBoxes, displaySize)
    const filename = generateFilename(store.currentImage)
    downloadImage(blob, filename, 'png')
    
    unwatch()
    exportProgress.value = 100
    showToast('导出成功！', 'success')
    
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
    }, 1500)
    
  } catch (err) {
    showToast('导出失败: ' + (err.message || '未知错误'), 'error')
    isExporting.value = false
    exportProgress.value = 0
  }
}

const handleExportConfirm = async (exportConfig) => {
  try {
    isExporting.value = true
    exportProgress.value = 0
    
    const displaySize = getDisplaySize()
    if (!displaySize) throw new Error('无法获取图片显示尺寸')
    
    const unwatch = watch(() => imageProcessor.progress.value, (v) => {
      exportProgress.value = v
    })
    
    const blob = await processImage(store.currentImage, store.cropBoxes, displaySize, exportConfig)
    const filename = exportConfig.filename || generateFilename(store.currentImage)
    downloadImage(blob, filename, exportConfig.format)
    
    unwatch()
    exportProgress.value = 100
    showExportSettings.value = false
    showToast('导出成功！', 'success')
    
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
    }, 1500)
    
  } catch (err) {
    showToast('导出失败: ' + (err.message || '未知错误'), 'error')
    isExporting.value = false
    exportProgress.value = 0
  }
}

const doReset = () => {
  showResetConfirm.value = false
  storeReset()
  showToast('已重置所有设置', 'info')
}

const handleUpdate = () => {
  // TODO: 预留编辑器状态同步扩展点 — 当 ImageEditor 内部状态变化时同步到 App 层
}

// 粘贴上传
const handlePaste = (event) => {
  if (!store.hasImage) {
    const items = event.clipboardData?.items
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          const file = item.getAsFile()
          doUpload(file)
          break
        }
      }
    }
  }
}

onMounted(() => {
  document.addEventListener('paste', handlePaste)
  watch(() => store.cropBoxes.length, (newLen) => {
    if (newLen > 0) nextTick(() => {
      forceSyncAllBoxes()
      // 首次添加边框后初始化颜色选择器（onMounted 时 DOM 尚不存在）
      if (appearanceTab.value === 'solid') {
        initBorderSolidColorPicker()
      } else {
        initGradientColorPickers()
      }
    })
  }, { immediate: true })
  // 初始化纯色选择器
  nextTick(() => initBorderSolidColorPicker())
  // 监听外观选项卡切换
  watch(appearanceTab, (tab) => {
    nextTick(() => {
      if (tab === 'solid') {
        destroyGradientPickers()
        initBorderSolidColorPicker()
      } else {
        destroyBorderSolidPicker()
        initGradientColorPickers()
      }
    })
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste)
  toastTimers.forEach(timer => clearTimeout(timer))
  toastTimers.clear()
  if (shadowColorInstance) shadowColorInstance.destroy()
  if (borderSolidColorInstance) borderSolidColorInstance.destroy()
  if (gradientStartColorInstance) gradientStartColorInstance.destroy()
  if (gradientMiddleColorInstance) gradientMiddleColorInstance.destroy()
  if (gradientEndColorInstance) gradientEndColorInstance.destroy()
  if (syncRafId) cancelAnimationFrame(syncRafId)
})
</script>

<style scoped>
/* ============================================================
   1. App Shell — 对齐原型 layout
   ============================================================ */
#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f9fafb;
  font-size: 13px;
  color: #1a1d23;
}

/* ---- 顶部工具栏 (48px) ---- */
.app__toolbar {
  flex-shrink: 0;
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #e2e5e9;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 4px;
  z-index: 20;
}

.toolbar__logo {
  font-size: 13px;
  font-weight: 600;
  color: #1a1d23;
  margin-right: 12px;
  white-space: nowrap;
  letter-spacing: -0.01em;
}
.toolbar__logo span { color: #5e6ad2; }

.toolbar__divider {
  width: 1px;
  height: 20px;
  background: #e2e5e9;
  margin: 0 6px;
  flex-shrink: 0;
}

.toolbar__spacer { flex: 1; }
.toolbar__dropdown-arrow { font-size: 10px; margin-left: 2px; opacity: 0.6; }

/* ---- Toolbar Buttons ---- */
.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.12s ease, color 0.12s ease;
  outline: none;
  white-space: nowrap;
  border-radius: 4px;
}

.toolbar-btn:focus-visible { box-shadow: 0 0 0 2px rgba(94,106,210,0.2); }
.toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.toolbar-btn--primary {
  background: #5e6ad2;
  color: #fff;
  padding: 6px 14px;
  height: 30px;
}
.toolbar-btn--primary:hover { background: #4f5bc4; }

.toolbar-btn--ghost {
  background: transparent;
  color: #6b7084;
  padding: 6px 8px;
  height: 30px;
}
.toolbar-btn--ghost:hover { background: #f4f5f7; color: #1a1d23; }

.toolbar-btn--icon {
  width: 32px;
  height: 32px;
  background: transparent;
  color: #6b7084;
  padding: 0;
}
.toolbar-btn--icon:hover { background: #f4f5f7; color: #1a1d23; }

/* ---- Toolbar Dropdown ---- */
.toolbar-dropdown-wrapper { position: relative; }

.toolbar-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 2px;
  min-width: 170px;
  background: #ffffff;
  border: 1px solid #e2e5e9;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 4px 0;
  z-index: 1001;
}

.toolbar-dropdown__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  color: #1a1d23;
  transition: background 0.12s ease;
  text-align: left;
}
.toolbar-dropdown__item:hover { background: #f4f5f7; }
.toolbar-dropdown__item svg { width: 16px; height: 16px; flex-shrink: 0; }

/* ---- Toolbar Zoom ---- */
.toolbar-zoom {
  display: flex;
  align-items: center;
  border: 1px solid #e2e5e9;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar-zoom__btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #6b7084;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
.toolbar-zoom__btn:hover { background: #f4f5f7; }

.toolbar-zoom__value {
  width: 44px;
  text-align: center;
  font-size: 11px;
  color: #6b7084;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  border-left: 1px solid #e2e5e9;
  border-right: 1px solid #e2e5e9;
  padding: 4px 0;
}
.toolbar-zoom__value:hover { background: #f4f5f7; }

/* ---- Body (Panel + Canvas) ---- */
.app__body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.app__panel {
  flex-shrink: 0;
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e5e9;
  overflow-y: auto;
  overflow-x: hidden;
}

.panel-content {
  padding: 0;
}

/* ---- Accordion ---- */
.accordion {
  /* border handled by header */
}

.accordion__header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #e2e5e9;
  transition: background 0.12s;
}
.accordion__header:hover { background: #f9fafb; }

.accordion__icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  color: #6b7084;
  flex-shrink: 0;
}

.accordion__title {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #1a1d23;
}

.accordion__chevron {
  font-size: 10px;
  color: #7c829a;
  transition: transform 0.15s;
}
.accordion--open .accordion__chevron { transform: rotate(180deg); }

.accordion__body { display: none; padding: 12px; border-bottom: 1px solid #e2e5e9; }
.accordion--open .accordion__body { display: block; }

/* ---- Border Items (in accordion) ---- */
.border-items { display: flex; flex-direction: column; gap: 3px; }

.border-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s;
}
.border-item:hover { background: #f9fafb; }
.border-item--active { background: #ecedf8; }
.border-item--active .border-item__shape-icon { color: #5e6ad2; }

.border-item__shape-icon { width: 16px; height: 16px; color: #7c829a; flex-shrink: 0; }
.border-item__shape-icon svg { width: 16px; height: 16px; }

.border-item__name { flex: 1; font-size: 12px; font-weight: 500; }

.border-item__color-swatch {
  width: 12px; height: 12px;
  border-radius: 4px;
  border: 1px solid #e2e5e9;
  flex-shrink: 0;
}

.border-item__delete {
  opacity: 0;
  background: none; border: none;
  cursor: pointer; color: #7c829a;
  padding: 2px; border-radius: 3px;
  display: flex; align-items: center;
  transition: opacity 0.12s, background 0.12s, color 0.12s;
}
.border-item:hover .border-item__delete { opacity: 1; }
.border-item__delete:hover { background: #fce8e7; color: #d94841; }
.border-item__delete svg { width: 14px; height: 14px; }

.border-item__actions { display: flex; gap: 4px; margin-top: 4px; }

/* ---- Border Item Aspect Row ---- */
.border-item__aspect-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 6px;
  margin-top: 2px;
}

.border-item__lock-btn {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none;
  cursor: pointer; border-radius: 4px;
  color: #7c829a; padding: 0; flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}
.border-item__lock-btn:hover { background: #f4f5f7; }
.border-item__lock-btn--locked { color: #5e6ad2; }
.border-item__lock-btn--locked:hover { background: #ecedf8; }
.border-item__lock-btn svg { width: 14px; height: 14px; }

.border-item__size-text {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #7c829a;
  display: flex; align-items: center; gap: 4px;
}

.link-icon {
  width: 10px; height: 10px;
  color: #5e6ad2;
}

/* ---- Panel Buttons ---- */
.panel-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid #e2e5e9;
  border-radius: 4px;
  background: #ffffff;
  color: #1a1d23;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.12s ease;
}
.panel-btn:hover { border-color: #5e6ad2; background: #f9fafb; }
.panel-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.panel-btn--sm { padding: 2px 6px; font-size: 11px; }
.panel-btn--active { background: #5e6ad2; border-color: #5e6ad2; color: white; }
.panel-btn--danger { color: #d94841; border-color: #e2e5e9; }
.panel-btn--danger:hover { background: #fce8e7; border-color: #d94841; }
.panel-btn--secondary { background: #f4f5f7; color: #5e6ad2; border-color: #5e6ad2; }
.panel-btn--secondary:hover { background: #5e6ad2; color: white; }
.panel-btn--ghost { background: transparent; color: #6b7084; border-color: transparent; }
.panel-btn--ghost:hover { background: #f4f5f7; border-color: #e2e5e9; }

/* ---- Tab Switch (纯色/渐变) ---- */
.tab-switch {
  display: inline-flex;
  background: #f4f5f7;
  border-radius: 4px;
  padding: 2px;
  margin-bottom: 12px;
}
.tab-switch__btn {
  padding: 4px 12px;
  font-size: 11px; font-weight: 500;
  color: #6b7084;
  background: transparent;
  border: none; border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s, color 0.12s, box-shadow 0.12s;
}
.tab-switch__btn--active {
  background: #ffffff;
  color: #1a1d23;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}
.tab-switch__btn:hover:not(.tab-switch__btn--active) { color: #1a1d23; }

/* ---- Property Row ---- */
.prop-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 30px;
  margin-bottom: 4px;
}
.prop-row__label {
  font-size: 12px;
  color: #6b7084;
  flex-shrink: 0;
}
.prop-row__value {
  display: flex; align-items: center; gap: 6px;
}

/* ---- Slider Group ---- */
.slider-group {
  display: flex; align-items: center; gap: 6px; width: 100%;
}
.slider-group input[type="range"] {
  flex: 1;
  -webkit-appearance: none; appearance: none;
  height: 4px;
  background: #e8eaed;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid #5e6ad2;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* ---- Number Input ---- */
.num-input {
  width: 52px;
  height: 24px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  text-align: right;
  color: #1a1d23;
  background: #ffffff;
  border: 1px solid #e2e5e9;
  border-radius: 4px;
  padding: 0 6px;
  outline: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.num-input:focus {
  border-color: #5e6ad2;
  box-shadow: 0 0 0 2px rgba(94,106,210,0.2);
}

/* ---- Panel Select ---- */
.panel-select {
  height: 28px;
  padding: 0 6px;
  background: #ffffff;
  border: 1px solid #e2e5e9;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  color: #1a1d23;
  cursor: pointer;
  outline: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.panel-select:hover { border-color: #c9cdd4; }
.panel-select:focus {
  border-color: #5e6ad2;
  box-shadow: 0 0 0 2px rgba(94,106,210,0.2);
}

/* ---- Toggle ---- */
.toggle {
  width: 32px; height: 18px;
  border-radius: 9px;
  background: #e8eaed;
  border: none;
  position: relative;
  cursor: pointer;
  padding: 0;
  transition: background 0.12s;
}
.toggle__thumb {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  position: absolute;
  top: 2px; left: 2px;
  transition: transform 0.12s;
}
.toggle--on { background: #5e6ad2; }
.toggle--on .toggle__thumb { transform: translateX(14px); }

/* ---- Color Picker Trigger ---- */
.color-picker-trigger {
  width: 28px; height: 28px;
  border-radius: 4px;
  border: 2px solid #e2e5e9;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.color-picker-trigger:hover { border-color: #c9cdd4; }
.color-picker-trigger:focus { border-color: #5e6ad2; box-shadow: 0 0 0 2px rgba(94,106,210,0.2); outline: none; }

/* ---- Export ---- */
.export-quick {
  display: flex; flex-direction: column; gap: 6px;
}
.export-quick__btn {
  width: 100%;
  justify-content: center;
  background: #5e6ad2; color: #ffffff;
  border: none; border-radius: 4px;
  padding: 6px 14px; height: 30px;
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  transition: background 0.12s;
}
.export-quick__btn:hover:not(:disabled) { background: #4f5bc4; }
.export-quick__btn:disabled { opacity: 0.4; cursor: not-allowed; }

.export-advanced-link {
  font-size: 11px; color: #5e6ad2;
  background: none; border: none;
  cursor: pointer; padding: 0;
  font-family: inherit;
  transition: color 0.12s;
}
.export-advanced-link:hover { color: #4f5bc4; text-decoration: underline; }

/* ---- Panel Actions ---- */
.panel-actions {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid #e2e5e9;
}

/* ---- Panel Tips ---- */
.panel-tips {
  padding: 6px 12px;
  font-size: 11px;
  color: #7c829a;
  display: flex; flex-direction: column; gap: 2px;
}

.tip-row { display: flex; align-items: center; gap: 4px; }
.tip-key { font-size: 11px; color: #7c829a; }

/* ---- Panel Error / Empty ---- */
.panel-error {
  margin: 8px 12px;
  background: #fef2f2;
  color: #dc2626;
  border-left: 3px solid #ef4444;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
}

.panel-empty {
  color: #9ca3af;
  font-size: 11px;
  text-align: center;
  padding: 8px 0;
}

/* ============================================================
   2. Canvas Area — 保持现有结构
   ============================================================ */
.preview-section {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #ebedf0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.preview-section.drag-over {
  background: #eef2ff;
  outline: 3px dashed #5e6ad2;
  outline-offset: -12px;
}

/* ---- Empty State ---- */
.empty-state {
  text-align: center;
  color: #6b7084;
  padding: 60px 80px;
  cursor: pointer;
  border: 2px dashed #e2e5e9;
  border-radius: 12px;
  transition: all 0.2s ease;
  max-width: 560px;
  width: 80%;
  background: #ffffff;
}
.empty-state:hover { border-color: #5e6ad2; background: rgba(94,106,210,0.02); }
.empty-state h3 { margin: 12px 0 8px 0; color: #1a1d23; font-weight: 600; font-size: 17px; }
.empty-state p { margin: 0 0 16px 0; font-size: 14px; }
.empty-icon-svg { color: #9ca3af; opacity: 0.5; width: 64px; height: 64px; }

/* ============================================================
   3. Status Bar
   ============================================================ */
.status-bar {
  flex-shrink: 0;
  height: 28px;
  background: #f4f5f7;
  border-top: 1px solid #e2e5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 11px;
  color: #7c829a;
  gap: 12px;
}
.status-left, .status-right { display: flex; align-items: center; gap: 12px; }
.status-item { white-space: nowrap; }

/* ============================================================
   4. Modals
   ============================================================ */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-content { max-width: 90vw; max-height: 90vh; overflow: hidden; }

.confirm-dialog {
  background: white;
  border-radius: 6px;
  padding: 20px;
  max-width: 380px;
  width: 100%;
}
.confirm-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.confirm-header h3 { margin: 0; font-size: 15px; color: #1a1d23; }
.confirm-message { color: #6b7084; font-size: 13px; line-height: 1.5; margin-bottom: 16px; }
.confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }

/* ---- Export Progress ---- */
.export-progress { margin-top: 6px; text-align: center; }
.progress-bar { width: 100%; height: 5px; background-color: #e5e7eb; border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
.progress-fill { height: 100%; background: #5e6ad2; transition: width 0.3s ease; border-radius: 3px; }
.progress-text { font-size: 10px; color: #6b7084; }

/* ---- Loading ---- */
.loading-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 6px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* ---- SVG Icons ---- */
.icon-svg { width: 14px; height: 14px; color: #5e6ad2; flex-shrink: 0; }
.icon-svg.warn { color: #ef4444; width: 24px; height: 24px; }

/* ============================================================
   5. Toast
   ============================================================ */
.toast-container {
  position: fixed;
  top: 56px; right: 16px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  font-size: 13px;
  min-width: 260px;
  max-width: 400px;
  animation: toastIn 0.2s ease;
  background: #ffffff;
}
.toast-error { border-left: 3px solid #d94841; color: #dc2626; }
.toast-success { border-left: 3px solid #3dab5e; color: #16a34a; }
.toast-info { border-left: 3px solid #5e6ad2; color: #5e6ad2; }
.toast-message { flex: 1; }
.toast-close { background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.4; color: inherit; }
.toast-close:hover { opacity: 1; }
@keyframes toastIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
.toast-leave-active { animation: toastOut 0.2s ease; }
@keyframes toastOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100px); } }

/* ============================================================
   6. Scrollbar
   ============================================================ */
.app__panel::-webkit-scrollbar,
.preview-section::-webkit-scrollbar { width: 4px; }
.app__panel::-webkit-scrollbar-track,
.preview-section::-webkit-scrollbar-track { background: transparent; }
.app__panel::-webkit-scrollbar-thumb,
.preview-section::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }

/* ============================================================
   7. Responsive
   ============================================================ */
@media (max-width: 768px) {
  .app__body { flex-direction: column; }
  .app__panel { width: 100%; max-height: 40vh; }
  .preview-section { min-height: 300px; }
}
@media (max-width: 480px) {
  .app__toolbar { padding: 0 8px; gap: 2px; }
  .toolbar__logo { margin-right: 6px; font-size: 12px; }
}
</style> 