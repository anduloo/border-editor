<template>
  <div class="guides-container">
    <div 
      v-for="(guide, index) in guides" 
      :key="index"
      class="guide-line"
      :class="`guide-${guide.type}`"
      :style="getGuideStyle(guide)"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  guides: {
    type: Array,
    default: () => []
  }
})

const getGuideStyle = (guide) => {
  if (guide.type === 'vertical') {
    return {
      left: `${guide.x}px`,
      top: '0',
      width: '1px',
      height: '100%'
    }
  } else if (guide.type === 'horizontal') {
    return {
      top: `${guide.y}px`,
      left: '0',
      height: '1px',
      width: '100%'
    }
  }
  return {}
}
</script>

<style scoped>
.guides-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
}

.guide-line {
  position: absolute;
  background: #3b82f6;
  opacity: 0.8;
  animation: guideAppear 0.2s ease-out;
}

.guide-vertical {
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.5);
}

.guide-horizontal {
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.5);
}

@keyframes guideAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 0.8;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-line {
    background: #3b82f6;
    opacity: 0.6;
  }
}
</style> 