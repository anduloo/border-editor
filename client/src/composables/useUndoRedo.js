// 撤销/重做功能组合式函数

import { ref, computed } from 'vue'

export function useUndoRedo(maxHistory = 50) {
  const history = ref([])
  const currentIndex = ref(-1)
  const isUndoAvailable = computed(() => currentIndex.value > 0)
  const isRedoAvailable = computed(() => currentIndex.value < history.value.length - 1)

  /**
   * 保存状态到历史记录
   * @param {any} state 要保存的状态
   */
  const saveState = (state) => {
    // 深拷贝状态
    const stateCopy = JSON.parse(JSON.stringify(state))
    
    // 如果当前不在历史记录末尾，删除后面的记录
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }
    
    // 添加新状态
    history.value.push(stateCopy)
    currentIndex.value = history.value.length - 1
    
    // 限制历史记录数量
    if (history.value.length > maxHistory) {
      history.value.shift()
      currentIndex.value--
    }
  }

  /**
   * 撤销
   * @returns {any|null} 撤销后的状态
   */
  const undo = () => {
    if (!isUndoAvailable.value) return null
    
    currentIndex.value--
    return JSON.parse(JSON.stringify(history.value[currentIndex.value]))
  }

  /**
   * 重做
   * @returns {any|null} 重做后的状态
   */
  const redo = () => {
    if (!isRedoAvailable.value) return null
    
    currentIndex.value++
    return JSON.parse(JSON.stringify(history.value[currentIndex.value]))
  }

  /**
   * 清空历史记录
   */
  const clearHistory = () => {
    history.value = []
    currentIndex.value = -1
  }

  /**
   * 获取当前状态
   * @returns {any|null} 当前状态
   */
  const getCurrentState = () => {
    if (currentIndex.value >= 0 && currentIndex.value < history.value.length) {
      return JSON.parse(JSON.stringify(history.value[currentIndex.value]))
    }
    return null
  }

  /**
   * 获取历史记录信息
   * @returns {Object} 历史记录信息
   */
  const getHistoryInfo = () => {
    return {
      total: history.value.length,
      current: currentIndex.value + 1,
      canUndo: isUndoAvailable.value,
      canRedo: isRedoAvailable.value
    }
  }

  return {
    isUndoAvailable,
    isRedoAvailable,
    saveState,
    undo,
    redo,
    clearHistory,
    getCurrentState,
    getHistoryInfo
  }
} 