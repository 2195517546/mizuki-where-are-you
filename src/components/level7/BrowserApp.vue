<script setup>
import { ref } from 'vue'

const props = defineProps({
  browserData: {
    type: Object,
    required: true
  },
  testData: {
    type: Object,
    required: true
  },
  forumData: {
    type: Object,
    required: true
  },
  level4MsgData: {
    type: Array,
    required: true
  },
  level6MsgData: {
    type: Object,
    required: true
  },
  level6CommentData: {
    type: Object,
    required: true
  }
})

const browserView = ref('home')
const searchQuery = ref('')
const searchResults = ref([])
const currentPage = ref(null)

function doSearch() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return

  const results = []

  // 搜索浏览器数据
  for (const [key, page] of Object.entries(props.browserData.pages)) {
    if (page.title.toLowerCase().includes(q) || page.content.toLowerCase().includes(q)) {
      results.push({ type: 'page', key, ...page })
    }
  }

  searchResults.value = results
  browserView.value = 'search'
}

function openPage(page) {
  currentPage.value = page
  browserView.value = 'page'
}

function goBack() {
  if (browserView.value === 'page') {
    browserView.value = 'search'
  } else {
    browserView.value = 'home'
  }
}
</script>

<template>
  <div class="browser-app">
    <!-- 首页 -->
    <div v-if="browserView === 'home'" class="browser-home">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          class="game-input"
          placeholder="搜索..."
          @keyup.enter="doSearch"
        />
        <button class="game-btn game-btn-primary" @click="doSearch">搜索</button>
      </div>
      <div class="shortcuts">
        <div class="shortcut-item" @click="openPage(browserData.pages.forum)">
          <span class="shortcut-icon">📰</span>
          <span>论坛</span>
        </div>
        <div class="shortcut-item" @click="openPage(browserData.pages.test)">
          <span class="shortcut-icon">📝</span>
          <span>测试</span>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="browserView === 'search'" class="search-results">
      <button class="game-btn game-btn-secondary" @click="goBack">← 返回</button>
      <p class="results-label">搜索结果 ({{ searchResults.length }})</p>
      <div v-for="(result, i) in searchResults" :key="i" class="result-item" @click="openPage(result)">
        <h4>{{ result.title }}</h4>
        <p>{{ result.content.slice(0, 100) }}...</p>
      </div>
      <p v-if="searchResults.length === 0" class="no-results">未找到相关内容</p>
    </div>

    <!-- 页面详情 -->
    <div v-else-if="browserView === 'page'" class="page-view">
      <button class="game-btn game-btn-secondary" @click="goBack">← 返回</button>
      <div class="page-content">
        <h2>{{ currentPage.title }}</h2>
        <p style="white-space: pre-wrap;">{{ currentPage.content }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.browser-app {
  padding: var(--spacing-md);
  background: #fff;
  min-height: 100%;
}

.browser-home {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.search-bar {
  display: flex;
  gap: var(--spacing-sm);
}

.search-bar .game-input {
  flex: 1;
  margin-bottom: 0;
}

.shortcuts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.shortcut-item:active {
  transform: scale(0.95);
}

.shortcut-icon {
  font-size: 2rem;
}

.search-results,
.page-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.results-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.result-item {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.result-item:active {
  transform: scale(0.98);
}

.result-item h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-base);
  color: var(--color-primary-dark);
}

.result-item p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.no-results {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--spacing-xl);
}

.page-content {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.page-content h2 {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.page-content p {
  margin: 0;
  line-height: 1.6;
  color: var(--color-text-secondary);
}
</style>
