<script setup>
import { ref } from 'vue'

const props = defineProps({
  filesData: {
    type: Object,
    required: true
  },
  filesPrivateUnlocked: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['unlock-private'])

const currentFolder = ref('root')
const selectedFile = ref(null)
const privatePassword = ref('')

function openFolder(folder) {
  currentFolder.value = folder
}

function openFile(file) {
  selectedFile.value = file
}

function closeFile() {
  selectedFile.value = null
  privatePassword.value = ''
}

function tryUnlockPrivate() {
  if (privatePassword.value === '0827') {
    emit('unlock-private')
    privatePassword.value = ''
  }
}

function getCurrentFiles() {
  if (currentFolder.value === 'root') {
    return props.filesData.root
  } else if (currentFolder.value === 'private') {
    return props.filesPrivateUnlocked ? props.filesData.private : []
  }
  return []
}
</script>

<template>
  <div class="files-app">
    <div class="app-head">
      <button v-if="currentFolder !== 'root'" class="back-btn" @click="currentFolder = 'root'">
        ← 返回
      </button>
      <span>{{ currentFolder === 'root' ? '文件管理' : currentFolder }}</span>
    </div>

    <div class="files-list">
      <!-- Root目录 -->
      <div v-if="currentFolder === 'root'">
        <div
          v-for="item in filesData.root"
          :key="item.name"
          class="file-item"
          @click="item.type === 'folder' ? openFolder(item.name) : openFile(item)"
        >
          <span class="file-icon">{{ item.type === 'folder' ? '📁' : '📄' }}</span>
          <span class="file-name">{{ item.name }}</span>
        </div>
      </div>

      <!-- Private目录 -->
      <div v-else-if="currentFolder === 'private'">
        <div v-if="!filesPrivateUnlocked" class="folder-locked">
          <p>🔒 此文件夹已加密</p>
          <input
            v-model="privatePassword"
            type="password"
            class="game-input"
            placeholder="输入密码解锁"
            @keyup.enter="tryUnlockPrivate"
          />
          <button class="game-btn game-btn-primary" @click="tryUnlockPrivate">解锁</button>
        </div>
        <div v-else>
          <div
            v-for="item in filesData.private"
            :key="item.name"
            class="file-item"
            @click="openFile(item)"
          >
            <span class="file-icon">📄</span>
            <span class="file-name">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件查看器 -->
    <div v-if="selectedFile" class="file-viewer" @click="closeFile">
      <div class="file-viewer-content" @click.stop>
        <h3>{{ selectedFile.name }}</h3>
        <div class="file-content">
          <p style="white-space: pre-wrap;">{{ selectedFile.content }}</p>
        </div>
        <button class="game-btn game-btn-secondary" @click="closeFile">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.files-app {
  background: #f5f5f5;
  min-height: 100%;
}

.app-head {
  background: #fff;
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.back-btn {
  background: none;
  border: none;
  font-size: var(--font-size-base);
  cursor: pointer;
  padding: var(--spacing-xs);
  color: var(--color-primary-dark);
}

.files-list {
  padding: var(--spacing-md);
}

.file-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.file-item:active {
  transform: scale(0.98);
}

.file-icon {
  font-size: 1.5rem;
}

.file-name {
  flex: 1;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.folder-locked {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-xl);
  background: white;
  border-radius: var(--radius-md);
}

.folder-locked p {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
}

.file-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-md);
}

.file-viewer-content {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.file-viewer-content h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.file-content {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.file-content p {
  margin: 0;
  color: var(--color-text-primary);
  line-height: 1.6;
  font-size: var(--font-size-sm);
}
</style>
