# 设计令牌文档 — 图片边框编辑器（Border Editor）

> 基于 Linear Design System 定制，融合 Figma 交互模式与 Raycast 面板风格

---

## 设计系统推荐

| 方案 | 设计系统 | 匹配度 | 特征 | 适合原因 |
|------|---------|--------|------|---------|
| A | **Linear** | ★★★★★ | 克制极简、紫蓝主色、紧凑信息密度、冷灰中性色系 | 用户指定主参考，品牌色 #5e6ad2 与 Linear 同源，工具型 SaaS 的标杆设计 |
| B | **Figma** | ★★★★☆ | 画布编辑器范式、属性面板交互、选择/变换手柄 | 交互参考——边框拖拽、resize、属性面板与 Figma 编辑器交互高度一致 |
| C | **Raycast** | ★★★★☆ | 命令面板、紧凑面板布局、快速操作反馈 | 面板参考——260px 左侧面板的折叠分组、紧凑间距、键盘快捷键体验 |

**最终方案**：以 Linear 为骨架，吸收 Figma 的画布交互模式与 Raycast 的面板紧凑布局，生成项目专属设计令牌。

---

## 1. Visual Theme（视觉主题）

**Philosophy**: 以最少的视觉噪音传递最大的操作信息——工具应当隐形，让用户的注意力完全停留在创作内容上。

**Direction**: Modern Minimal 为基调，局部融入 Tech Utility
- 关键词：克制、专业、紧凑、高效、安静
- ❌ 不走 Brutalist / Soft Warm / Editorial

**Personality**: confident, precise, unobtrusive

**Reference**: Linear（主视觉）+ Figma（画布交互）+ Raycast（面板紧凑度）

**Visual Direction Mapping**:
- Modern Minimal 占 70%——严格的黑白灰层级、单一强调色、等距对齐
- Tech Utility 占 30%——紧凑间距、信息密度、精确的状态反馈

---

## 2. Color Palette（调色板）

### Primary（主色）

| Token | HEX | OKLCh | CSS Variable | Usage |
|-------|-----|-------|-------------|-------|
| --color-primary | #5e6ad2 | oklch(52% 0.15 275) | var(--color-primary) | CTA 按钮、链接、活跃状态、选中指示器 |
| --color-primary-hover | #4f5bc4 | oklch(48% 0.16 275) | var(--color-primary-hover) | 主色 hover 态 |
| --color-primary-active | #434db3 | oklch(44% 0.15 275) | var(--color-primary-active) | 主色 active/pressed 态 |
| --color-primary-subtle | #ecedf8 | oklch(94% 0.03 275) | var(--color-primary-subtle) | 主色浅底、选中行背景、标签背景 |
| --color-primary-text | #ffffff | oklch(100% 0 0) | var(--color-primary-text) | 主色上的文字 |

### Neutral（中性色）

| Token | HEX | CSS Variable | Usage |
|-------|-----|-------------|-------|
| --color-bg-page | #f9fafb | var(--color-bg-page) | 页面底层背景 |
| --color-bg-surface | #ffffff | var(--color-bg-surface) | 面板、卡片、弹窗背景 |
| --color-bg-subtle | #f4f5f7 | var(--color-bg-subtle) | 输入框背景、hover 行背景 |
| --color-bg-muted | #e8eaed | var(--color-bg-muted) | 分隔区域、禁用背景 |
| --color-border | #e2e5e9 | var(--color-border) | 默认边框、分隔线 |
| --color-border-strong | #c9cdd4 | var(--color-border-strong) | 强调边框、面板外边框 |
| --color-border-focus | #5e6ad2 | var(--color-border-focus) | 焦点环颜色 |
| --color-text-primary | #1a1d23 | var(--color-text-primary) | 标题、正文 |
| --color-text-secondary | #6b7084 | var(--color-text-secondary) | 说明文字、标签 |
| --color-text-tertiary | #7c829a | var(--color-text-tertiary) | 占位符、禁用文字 |
| --color-text-inverse | #ffffff | var(--color-text-inverse) | 深色背景上的文字 |

### Semantic（语义色）

| Token | HEX | CSS Variable | Usage |
|-------|-----|-------------|-------|
| --color-success | #3dab5e | var(--color-success) | 成功状态、导出完成 |
| --color-success-subtle | #e8f5ec | var(--color-success-subtle) | 成功浅底 |
| --color-warning | #d4860a | var(--color-warning) | 警告状态 |
| --color-warning-subtle | #fef4e1 | var(--color-warning-subtle) | 警告浅底 |
| --color-danger | #d94841 | var(--color-danger) | 错误、破坏性操作 |
| --color-danger-subtle | #fce8e7 | var(--color-danger-subtle) | 危险浅底 |
| --color-info | #5e6ad2 | var(--color-info) | 信息提示（复用主色） |

### Canvas-Specific（画布专用色）

| Token | HEX | CSS Variable | Usage |
|-------|-----|-------------|-------|
| --color-canvas-bg | #ebedf0 | var(--color-canvas-bg) | 画布工作区背景（比面板背景深一级，区分层级） |
| --color-canvas-grid | #d8dbe1 | var(--color-canvas-grid) | 画布网格线 |
| --color-selection | #5e6ad2 | var(--color-selection) | 选中边框的颜色 |
| --color-selection-fill | rgba(94,106,210,0.08) | var(--color-selection-fill) | 选中区域填充 |
| --color-handle | #ffffff | var(--color-handle) | resize 手柄填充 |
| --color-handle-border | #5e6ad2 | var(--color-handle-border) | resize 手柄边框 |
| --color-guide | #f59e0b | var(--color-guide) | 吸附辅助线颜色 |
| --color-ruler | #6b7084 | var(--color-ruler) | 标尺刻度颜色 |

---

## 3. Typography（排版）

### Font Stacks

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
--font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Liberation Mono', Menlo, monospace;
```

> 注意：不引入外部字体，使用系统字体栈确保零加载延迟和原生渲染质量。

### Scale

| Level | Size | Weight | Line-height | Letter-spacing | CSS Variable | Usage |
|-------|------|--------|-------------|---------------|-------------|-------|
| H1 | 20px / 1.25rem | 600 | 1.3 | -0.01em | var(--text-h1) | 面板标题 |
| H2 | 14px / 0.875rem | 600 | 1.4 | 0 | var(--text-h2) | 分组标题、Accordion header |
| Body | 13px / 0.8125rem | 400 | 1.5 | 0 | var(--text-body) | 面板正文、属性标签 |
| Small | 12px / 0.75rem | 400 | 1.5 | 0 | var(--text-small) | 辅助文字、状态栏 |
| Micro | 11px / 0.6875rem | 500 | 1.4 | 0.02em | var(--text-micro) | 徽章、快捷键提示、尺寸标注 |
| Mono | 12px / 0.75rem | 400 | 1.5 | 0 | var(--text-mono) | 数值输入、坐标值、尺寸显示 |

> 编辑器工具采用偏小字号（13px body），与 Linear/Raycast 一致，确保面板内信息密度。

---

## 4. Component Styles（组件样式）

### Button

**Primary（主操作按钮）**
```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: var(--text-small);  /* 12px */
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  transition: background 120ms ease;
}
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:active { background: var(--color-primary-active); }
```

**Secondary（次操作按钮）**
```css
.btn-secondary {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 6px 14px;
  font-size: var(--text-small);
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}
.btn-secondary:hover { background: var(--color-bg-subtle); border-color: var(--color-border-strong); }
```

**Ghost（幽灵按钮）**
```css
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: var(--text-small);
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.btn-ghost:hover { background: var(--color-bg-subtle); color: var(--color-text-primary); }
```

**Icon Button（图标按钮 — 工具栏专用）**
```css
.btn-icon {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.btn-icon:hover { background: var(--color-bg-subtle); color: var(--color-text-primary); }
.btn-icon.active { background: var(--color-primary-subtle); color: var(--color-primary); }
```

### Input

```css
.input {
  height: 30px;
  padding: 0 8px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: var(--text-small);  /* 12px */
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.input:hover { border-color: var(--color-border-strong); }
.input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 2px rgba(94, 106, 210, 0.2);
}
.input::placeholder { color: var(--color-text-tertiary); }
.input:disabled { background: var(--color-bg-muted); color: var(--color-text-tertiary); cursor: not-allowed; }
```

### Number Input（数值输入 — 属性面板专用）

```css
.input-number {
  height: 28px;
  width: 64px;
  padding: 0 6px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: var(--text-mono);  /* 12px mono */
  font-family: var(--font-mono);
  color: var(--color-text-primary);
  text-align: right;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
/* 与普通 input 相同的 hover/focus 行为 */
```

### Slider（滑块 — 属性面板专用）

```css
.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-bg-surface);
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition: box-shadow 120ms ease;
}
.slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 3px rgba(94, 106, 210, 0.15);
}
.slider::-webkit-slider-thumb:active {
  background: var(--color-primary-subtle);
}
```

### Color Picker（颜色选择器触发器）

```css
.color-picker-trigger {
  width: 28px;
  height: 28px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 120ms ease;
  /* background 设为用户选中的颜色 */
}
.color-picker-trigger:hover { border-color: var(--color-border-strong); }
.color-picker-trigger.active { border-color: var(--color-primary); }
```

### Select / Dropdown

```css
.select-trigger {
  height: 30px;
  padding: 0 28px 0 8px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: var(--text-small);
  color: var(--color-text-primary);
  cursor: pointer;
  position: relative;
  /* 下拉箭头用 CSS 或 SVG icon */
}
.select-trigger:hover { border-color: var(--color-border-strong); }
.select-trigger.open {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 2px rgba(94, 106, 210, 0.2);
}

.select-dropdown {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 4px;
  z-index: 200;
}
.select-option {
  padding: 6px 8px;
  border-radius: 4px;
  font-size: var(--text-small);
  cursor: pointer;
}
.select-option:hover { background: var(--color-bg-subtle); }
.select-option.selected { background: var(--color-primary-subtle); color: var(--color-primary); }
```

### Panel（面板 — 左侧设置面板）

```css
.panel {
  width: 260px;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
```

### Accordion（折叠分组 — 面板内分区）

```css
.accordion-header {
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-h2);  /* 14px */
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  user-select: none;
  transition: background 120ms ease;
}
.accordion-header:hover { background: var(--color-bg-subtle); }
.accordion-header .chevron {
  transition: transform 150ms ease;
}
.accordion-header.collapsed .chevron {
  transform: rotate(-90deg);
}
.accordion-content {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}
```

### Property Row（属性行 — 面板内键值对）

```css
.prop-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 30px;
  gap: 8px;
}
.prop-label {
  font-size: var(--text-small);  /* 12px */
  color: var(--color-text-secondary);
  flex-shrink: 0;
  min-width: 60px;
}
.prop-value {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: flex-end;
}
```

### Toolbar（顶部工具栏）

```css
.toolbar {
  height: 48px;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 4px;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 4px;
}
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}
```

### Status Bar（底部状态栏）

```css
.status-bar {
  height: 28px;
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: var(--text-micro);  /* 11px */
  color: var(--color-text-tertiary);
}
```

### Modal / Dialog（弹窗）

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}
.modal {
  background: var(--color-bg-surface);
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  min-width: 360px;
  max-width: 440px;
}
.modal-header {
  padding: 16px 20px 0;
  font-size: var(--text-h1);  /* 20px */
  font-weight: 600;
  color: var(--color-text-primary);
}
.modal-body {
  padding: 12px 20px;
  font-size: var(--text-body);  /* 13px */
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.modal-footer {
  padding: 12px 20px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```

### Toast（通知提示）

```css
.toast {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-small);  /* 12px */
  color: var(--color-text-primary);
  min-width: 240px;
  max-width: 360px;
  z-index: 400;
  animation: toast-slide-in 200ms ease-out;
}
@keyframes toast-slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.toast-icon-success { color: var(--color-success); }
.toast-icon-warning { color: var(--color-warning); }
.toast-icon-danger { color: var(--color-danger); }
.toast-icon-info { color: var(--color-info); }
```

### Tooltip

```css
.tooltip {
  background: var(--color-text-primary);
  color: var(--color-text-inverse);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: var(--text-micro);  /* 11px */
  white-space: nowrap;
  z-index: 250;
  pointer-events: none;
  animation: tooltip-fade-in 100ms ease-out;
}
@keyframes tooltip-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Context Menu（右键菜单）

```css
.context-menu {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 4px;
  min-width: 180px;
  z-index: 200;
}
.context-menu-item {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: var(--text-small);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}
.context-menu-item:hover { background: var(--color-bg-subtle); }
.context-menu-item.danger { color: var(--color-danger); }
.context-menu-item .shortcut {
  font-size: var(--text-micro);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}
```

---

## 5. Layout（布局）

### App Shell（应用外壳）

```
┌──────────────────────────────────────────────────┐
│  Toolbar (h: 48px)                               │
├──────────────┬───────────────────────────────────┤
│              │                                   │
│  Left Panel  │    Canvas Workspace               │
│  (w: 260px)  │    (flex: 1)                      │
│              │                                   │
│              │                                   │
├──────────────┴───────────────────────────────────┤
│  Status Bar (h: 28px)                            │
└──────────────────────────────────────────────────┘
```

### Spacing Scale

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| --space-1 | 2px | var(--space-1) | 微间距、icon与文字间隙 |
| --space-2 | 4px | var(--space-2) | 内联元素间距、紧凑内边距 |
| --space-3 | 6px | var(--space-3) | 按钮内边距水平、属性行间距 |
| --space-4 | 8px | var(--space-4) | 默认内边距、组件间距 |
| --space-5 | 10px | var(--space-5) | 面板内分组间距 |
| --space-6 | 12px | var(--space-6) | 面板内容区 padding |
| --space-8 | 16px | var(--space-8) | 分区间距 |
| --space-10 | 20px | var(--space-10) | 弹窗内容 padding |
| --space-12 | 24px | var(--space-12) | 大分区间距 |
| --space-16 | 32px | var(--space-16) | 页面级间距 |

### Layout Constants

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| --toolbar-height | 48px | var(--toolbar-height) | 顶部工具栏高度 |
| --panel-width | 260px | var(--panel-width) | 左侧面板宽度 |
| --status-bar-height | 28px | var(--status-bar-height) | 底部状态栏高度 |
| --panel-padding | 12px | var(--panel-padding) | 面板内容区内边距 |
| --prop-row-height | 30px | var(--prop-row-height) | 属性行最小高度 |
| --accordion-header-height | 36px | var(--accordion-header-height) | 折叠分组标题高度 |

---

## 6. Depth & Elevation（深度与层级）

### Shadow Scale

| Level | Shadow | CSS Variable | Usage |
|-------|--------|-------------|-------|
| Flat | none | var(--shadow-flat) | 默认表面、面板 |
| Subtle | 0 1px 2px rgba(0,0,0,0.06) | var(--shadow-subtle) | hover 态卡片 |
| Raised | 0 2px 8px rgba(0,0,0,0.08) | var(--shadow-raised) | 下拉菜单、弹出层 |
| Floating | 0 4px 16px rgba(0,0,0,0.12) | var(--shadow-floating) | Toast、Modal |
| Overlay | 0 8px 32px rgba(0,0,0,0.18) | var(--shadow-overlay) | 全屏遮罩上的弹窗 |

### Z-index Scale

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| --z-base | 0 | var(--z-base) | 默认层 |
| --z-canvas | 1 | var(--z-canvas) | 画布层 |
| --z-canvas-overlay | 10 | var(--z-canvas-overlay) | 辅助线、标尺 |
| --z-panel | 20 | var(--z-panel) | 左侧面板 |
| --z-dropdown | 100 | var(--z-dropdown) | 下拉菜单、右键菜单 |
| --z-toolbar | 50 | var(--z-toolbar) | 工具栏 |
| --z-tooltip | 250 | var(--z-tooltip) | 提示框 |
| --z-modal | 300 | var(--z-modal) | 弹窗遮罩 + 弹窗 |
| --z-toast | 400 | var(--z-toast) | Toast 通知 |

---

## 7. Iconography（图标规范）

### 图标风格

- **类型**: 线性描边图标（Outline）
- **Stroke 宽度**: 1.5px
- **尺寸基准**: 16px（默认） / 20px（工具栏）
- **对齐**: 像素对齐（pixel-perfect），避免 0.5px 偏移导致的模糊
- **Cap**: round
- **Join**: round
- **色彩**: 继承当前文字颜色 `currentColor`

### 图标尺寸规范

| 场景 | 尺寸 | Stroke | CSS Variable |
|------|------|--------|-------------|
| 工具栏按钮 | 20px | 1.5px | var(--icon-md) |
| 面板内标签 | 16px | 1.5px | var(--icon-sm) |
| Toast/弹窗 | 16px | 1.5px | var(--icon-sm) |
| 状态栏 | 14px | 1.5px | var(--icon-xs) |

### Resize Handle 规范

```css
/* 8 方向 resize 手柄 */
.resize-handle {
  width: 8px;
  height: 8px;
  background: var(--color-handle);
  border: 1.5px solid var(--color-handle-border);
  border-radius: 1px;  /* 微圆角方形，区别于圆形 */
  position: absolute;
  z-index: 15;
}
/* 角落手柄: nw, ne, sw, se */
.resize-handle-corner { cursor: nwse-resize; } /* 或 nesw-resize */
/* 边手柄: n, s, e, w */
.resize-handle-n { cursor: ns-resize; }
.resize-handle-e { cursor: ew-resize; }
```

---

## 8. Motion & Animation（动效规范）

### 时长标准

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| --duration-instant | 60ms | var(--duration-instant) | 颜色变化、微反馈 |
| --duration-fast | 120ms | var(--duration-fast) | hover、focus 过渡 |
| --duration-normal | 200ms | var(--duration-normal) | 展开/折叠、面板切换 |
| --duration-slow | 300ms | var(--duration-slow) | 页面转场 |
| --duration-slower | 500ms | var(--duration-slower) | 复杂动画 |

### 缓动函数

| Token | Value | CSS Variable | Usage |
|-------|-------|-------------|-------|
| --ease-default | cubic-bezier(0.25, 0.1, 0.25, 1) | var(--ease-default) | 通用过渡 |
| --ease-in | cubic-bezier(0.4, 0, 1, 1) | var(--ease-in) | 退出动画 |
| --ease-out | cubic-bezier(0, 0, 0.2, 1) | var(--ease-out) | 进入动画 |
| --ease-in-out | cubic-bezier(0.4, 0, 0.2, 1) | var(--ease-in-out) | 对称动画 |

### 动效原则

1. **克制**：编辑器工具的动效应是功能性的，不添加纯装饰性动画
2. **快速**：所有过渡 ≤ 200ms，让操作感觉即时响应
3. **可中断**：hover/focus 动效应可即时反转，不造成"等待动画结束"的体验
4. **减少动效**：尊重 `prefers-reduced-motion: reduce`，提供无动效降级

### 关键动效

| 场景 | 时长 | 缓动 | 说明 |
|------|------|------|------|
| 按钮/输入框 hover | 120ms | ease-default | 颜色/背景过渡 |
| Focus ring 出现 | 120ms | ease-default | box-shadow 渐显 |
| Accordion 展开/折叠 | 200ms | ease-out | 高度过渡 |
| Toast 滑入 | 200ms | ease-out | translateY + opacity |
| Toast 滑出 | 150ms | ease-in | translateY + opacity |
| Modal 出现 | 200ms | ease-out | scale(0.95→1) + opacity |
| Modal 消失 | 150ms | ease-in | scale(1→0.95) + opacity |
| Dropdown 出现 | 120ms | ease-out | scale(0.96→1) + opacity |
| 选中边框高亮 | 60ms | ease-default | border-color 变化 |
| 辅助线出现 | instant | — | 无动画，即时显示 |

---

## 9. Cautions（注意事项）

### Never Do（禁止）

- ❌ 不使用圆角 > 6px（保持工具感，避免消费产品气质）
- ❌ 不使用大面积渐变背景（干扰画布内容识别）
- ❌ 不使用彩色投影（保持克制，投影只用灰色）
- ❌ 不使用粗体 > 700（标题最多 semibold 600）
- ❌ 不在面板中使用 > 14px 的字号（破坏紧凑感）
- ❌ 不使用填充图标（filled icons），全部使用描边风格
- ❌ 不在浅色背景上使用浅色文字（WCAG AA 对比度最低 4.5:1）
- ❌ 不使用纯黑 #000000 作为文字色（使用 #1a1d23 深灰，更柔和）
- ❌ 不使用弹性/弹性动画（bounce/spring），编辑器需要精确感
- ❌ 不在画布区域添加装饰性元素（水印、纹理背景等）

### Prefer（推荐替代）

- ✅ 用 4px 圆角做按钮/输入框，6px 圆角做面板/弹窗
- ✅ 用 shadow 区分层级而非 border 堆叠
- ✅ 用 color 变化表示状态而非 size 变化
- ✅ 用 opacity 0.5-0.7 表示禁用态而非灰度化
- ✅ 用 1px border 分隔区域而非留白
- ✅ 用 subtle 背景色区分面板和画布区域
- ✅ 用 monospace 字体显示数值，proportional 字体显示文字

---

## 10. Responsive Behavior（响应式行为）

### Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| Desktop Full | ≥ 1440px | 完整布局：260px 面板 + 48px 工具栏 + 画布 |
| Desktop | 1280–1439px | 完整布局，画布略窄 |
| Desktop Compact | 1024–1279px | 面板缩窄至 220px，工具栏图标模式（隐藏文字标签） |
| Tablet | 768–1023px | ⚠️ 非目标尺寸，面板浮层化，画布全屏 |
| Mobile | < 768px | ❌ 不支持，显示"请使用桌面设备"提示 |

### Adaptation Rules

1. **桌面端优先**：1280px+ 是主要支持宽度，设计以此为基准
2. **面板最小宽度**：面板不可窄于 220px，否则属性行无法容纳
3. **画布最小尺寸**：画布区域不可小于 640×480，否则影响操作精度
4. **工具栏响应**：宽度不足时，工具栏按钮从"图标+文字"切换为"仅图标"
5. **浮层降级**：1024px 以下，面板变为可收起浮层，默认收起

---

## 11. Agent Prompt Guide（AI 生成指南）

### Key Instructions

1. **主色 #5e6ad2 不可更改**——所有涉及品牌色的地方必须使用此值
2. **面板宽度固定 260px**——不使用响应式宽度，固定值
3. **工具栏高度固定 48px**——不使用响应式高度
4. **圆角二元制**——4px（小元素）和 6px（大元素），没有中间值
5. **字号偏小**——body 13px 是编辑器工具的标准，不要放大到 14/16px
6. **描边图标 1.5px**——不是 1px（太细）也不是 2px（太粗）
7. **间距以 2px 为基数**——所有间距必须是 2 的倍数（2, 4, 6, 8, 10, 12...）
8. **画布区域背景必须比面板深**——用 #ebedf0 vs #ffffff 形成层级对比
9. **选中态用主色浅底**——`var(--color-primary-subtle)` 而非高饱和填充
10. **过渡时长不超过 200ms**——编辑器交互追求即时感

### Quick CSS Snippet

```css
:root {
  /* Primary */
  --color-primary: #5e6ad2;
  --color-primary-hover: #4f5bc4;
  --color-primary-active: #434db3;
  --color-primary-subtle: #ecedf8;
  --color-primary-text: #ffffff;

  /* Neutral */
  --color-bg-page: #f9fafb;
  --color-bg-surface: #ffffff;
  --color-bg-subtle: #f4f5f7;
  --color-bg-muted: #e8eaed;
  --color-border: #e2e5e9;
  --color-border-strong: #c9cdd4;
  --color-border-focus: #5e6ad2;
  --color-text-primary: #1a1d23;
  --color-text-secondary: #6b7084;
  --color-text-tertiary: #7c829a;
  --color-text-inverse: #ffffff;

  /* Semantic */
  --color-success: #3dab5e;
  --color-success-subtle: #e8f5ec;
  --color-warning: #d4860a;
  --color-warning-subtle: #fef4e1;
  --color-danger: #d94841;
  --color-danger-subtle: #fce8e7;
  --color-info: #5e6ad2;

  /* Canvas */
  --color-canvas-bg: #ebedf0;
  --color-canvas-grid: #d8dbe1;
  --color-selection: #5e6ad2;
  --color-selection-fill: rgba(94,106,210,0.08);
  --color-handle: #ffffff;
  --color-handle-border: #5e6ad2;
  --color-guide: #f59e0b;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Liberation Mono', Menlo, monospace;

  /* Spacing */
  --space-1: 2px;
  --space-2: 4px;
  --space-3: 6px;
  --space-4: 8px;
  --space-5: 10px;
  --space-6: 12px;
  --space-8: 16px;
  --space-10: 20px;
  --space-12: 24px;
  --space-16: 32px;

  /* Layout */
  --toolbar-height: 48px;
  --panel-width: 260px;
  --status-bar-height: 28px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;

  /* Shadows */
  --shadow-flat: none;
  --shadow-subtle: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-raised: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-floating: 0 4px 16px rgba(0,0,0,0.12);
  --shadow-overlay: 0 8px 32px rgba(0,0,0,0.18);

  /* Z-index */
  --z-base: 0;
  --z-canvas: 1;
  --z-canvas-overlay: 10;
  --z-panel: 20;
  --z-toolbar: 50;
  --z-dropdown: 100;
  --z-tooltip: 250;
  --z-modal: 300;
  --z-toast: 400;

  /* Duration */
  --duration-instant: 60ms;
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;

  /* Easing */
  --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Icons */
  --icon-xs: 14px;
  --icon-sm: 16px;
  --icon-md: 20px;
  --icon-stroke: 1.5px;
}
```

---

## 附录：WCAG 对比度校验

| 前景色 | 背景色 | 对比度 | WCAG AA | 用途 |
|--------|--------|--------|---------|------|
| #1a1d23 | #ffffff | 15.8:1 | ✅ Pass | 正文 → 白底 |
| #1a1d23 | #f9fafb | 15.1:1 | ✅ Pass | 正文 → 页面底色 |
| #6b7084 | #ffffff | 4.8:1 | ✅ Pass | 辅助文字 → 白底 |
| #6b7084 | #f9fafb | 4.6:1 | ✅ Pass | 辅助文字 → 页面底色 |
| #9da2b3 | #ffffff | 2.9:1 | ⚠️ AA Large | 占位符（仅非关键信息） |
| #5e6ad2 | #ffffff | 4.6:1 | ✅ Pass | 主色 → 白底 |
| #ffffff | #5e6ad2 | 4.6:1 | ✅ Pass | 白字 → 主色底 |
| #3dab5e | #ffffff | 3.0:1 | ⚠️ AA Large | 成功色（搭配 icon 使用） |
| #d94841 | #ffffff | 3.8:1 | ⚠️ AA Large | 危险色（搭配 icon + 文字使用） |

> 注：语义色在 Toast/徽章场景中多搭配图标使用，确保信息不依赖颜色唯一传达。
