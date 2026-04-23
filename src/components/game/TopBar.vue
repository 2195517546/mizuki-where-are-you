<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  level: {
    type: [Number, String],
    default: ''
  }
})

defineEmits(['home'])
</script>

<template>
  <header class="top-bar">
    <button class="home-link" @click="$emit('home')">
      <img class="home-link-icon" src="/大眼mzk.png" alt="首页" />
      <span class="home-link-text">首页</span>
    </button>
    <div class="hint">
      <span class="hint-title">{{ title }}</span>
      <span v-if="subtitle" class="hint-sub">{{ subtitle }}</span>
    </div>
    <span class="level-tag">第 {{ level }} 关</span>
  </header>
</template>

<style scoped>
.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 18px;
  background: rgba(255, 240, 245, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid #f6c8cc;
}

@media (max-width: 640px) {
  .top-bar {
    padding: 9px 15px;
    gap: 12px;
  }
}

.home-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 30px;
  background: #fff;
  border: 2px solid #f6c8cc;
  color: #c07090;
  font-size: 1.23rem;
  white-space: nowrap;
  flex-shrink: 0;
  touch-action: manipulation;
  transition: background 0.15s;
  cursor: pointer;
}

@media (max-width: 640px) {
  .home-link {
    padding: 6px 12px;
    font-size: 1.125rem;
  }
}

.home-link:active {
  background: #ffe0e8;
}

@media (hover: hover) {
  .home-link:hover {
    background: #ffe0e8;
  }
}

.home-link-icon {
  height: 1em;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.hint-title {
  font-size: 1.425rem;
  font-weight: bold;
  color: #F6B1B5;
}

@media (max-width: 640px) {
  .hint-title {
    font-size: 1.2rem;
  }
}

.hint-sub {
  font-size: 1.08rem;
  color: #aaa;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 640px) {
  .hint-sub {
    font-size: 0.75rem;
  }
}

.level-tag {
  font-size: 1.17rem;
  font-weight: bold;
  color: #c07090;
  background: #fff;
  border: 2px solid #f6c8cc;
  border-radius: 30px;
  padding: 7.5px 15px;
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .level-tag {
    font-size: 1.05rem;
    padding: 6px 12px;
  }
}
</style>
