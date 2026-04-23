// 游戏全局配置
export const CONFIG = {
  // CDN基础路径
  CDN_BASE: 'https://faceround.cn/games/find-mzk/',

  // 游戏版本
  VERSION: '1.0.0',

  // 关卡配置
  TOTAL_LEVELS: 8,

  // localStorage键名
  STORAGE_KEYS: {
    COMPLETED_LEVELS: 'mzk-completed-levels',
    LEVEL_UNLOCK_PREFIX: 'mzk-level-',
    AVATAR: 'mzk-level6-avatar'
  }
}

// 关卡元数据
export const LEVEL_META = {
  1: { name: '找眼镜', target: 91, type: 'find' },
  2: { name: '找mzk', target: 67, type: 'find' },
  3: { name: '连连看', target: null, type: 'game' },
  4: { name: '聊天', target: 10, type: 'chat' },
  5: { name: '论坛', target: null, type: 'forum' },
  6: { name: '视频', target: 30, type: 'video' },
  7: { name: '手机', target: null, type: 'phone' },
  8: { name: '出道晓山瑞希', target: null, type: 'detective' }
}

// 获取图片URL
export function getImageUrl(filename) {
  return `${CONFIG.CDN_BASE}${filename}`
}

// 获取关卡路径
export function getLevelPath(level) {
  return `/${level}`
}

// 检查关卡是否解锁
export function isLevelUnlocked(level, completedLevels) {
  if (level === 1) return true
  if (level === 8) return completedLevels.includes(6)
  return completedLevels.includes(level - 1)
}
