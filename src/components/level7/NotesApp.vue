<script setup>
import { ref } from 'vue'

const props = defineProps({
  notesData: {
    type: Object,
    required: true
  },
  note3Unlocked: {
    type: Boolean,
    default: false
  },
  note8Unlocked: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['unlock-note3', 'unlock-note8'])

const selectedNote = ref(null)
const note3Password = ref('')
const note8Password = ref('')

function viewNote(note) {
  selectedNote.value = note
}

function closeNote() {
  selectedNote.value = null
  note3Password.value = ''
  note8Password.value = ''
}

function tryUnlockNote3() {
  if (note3Password.value === '0827') {
    emit('unlock-note3')
    note3Password.value = ''
  }
}

function tryUnlockNote8() {
  if (note8Password.value === 'dingding10') {
    emit('unlock-note8')
    note8Password.value = ''
  }
}
</script>

<template>
  <div class="notes-app">
    <div class="notes-list">
      <div
        v-for="note in notesData.notes"
        :key="note.id"
        class="note-item"
        @click="viewNote(note)"
      >
        <div class="note-title">{{ note.title }}</div>
        <div class="note-preview">{{ note.content.slice(0, 30) }}...</div>
      </div>
    </div>

    <!-- 备忘录详情 -->
    <div v-if="selectedNote" class="note-viewer" @click="closeNote">
      <div class="note-viewer-content" @click.stop>
        <h3>{{ selectedNote.title }}</h3>

        <!-- 普通备忘录 -->
        <div v-if="!selectedNote.locked" class="note-content">
          <p style="white-space: pre-wrap;">{{ selectedNote.content }}</p>
        </div>

        <!-- 加密备忘录3 -->
        <div v-else-if="selectedNote.id === 3 && !note3Unlocked" class="note-locked">
          <p>🔒 此备忘录已加密</p>
          <input
            v-model="note3Password"
            type="password"
            class="game-input"
            placeholder="输入密码解锁"
            @keyup.enter="tryUnlockNote3"
          />
          <button class="game-btn game-btn-primary" @click="tryUnlockNote3">解锁</button>
        </div>
        <div v-else-if="selectedNote.id === 3 && note3Unlocked" class="note-content">
          <p style="white-space: pre-wrap;">{{ selectedNote.content }}</p>
        </div>

        <!-- 加密备忘录8 -->
        <div v-else-if="selectedNote.id === 8 && !note8Unlocked" class="note-locked">
          <p>🔒 此备忘录已加密</p>
          <input
            v-model="note8Password"
            type="password"
            class="game-input"
            placeholder="输入密码解锁"
            @keyup.enter="tryUnlockNote8"
          />
          <button class="game-btn game-btn-primary" @click="tryUnlockNote8">解锁</button>
        </div>
        <div v-else-if="selectedNote.id === 8 && note8Unlocked" class="note-content">
          <p style="white-space: pre-wrap;">{{ selectedNote.content }}</p>
        </div>

        <button class="game-btn game-btn-secondary" @click="closeNote">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notes-app {
  padding: var(--spacing-md);
  background: #fffbe6;
  min-height: 100%;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.note-item {
  background: white;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid #f0e6b0;
  transition: transform var(--transition-fast);
}

.note-item:active {
  transform: scale(0.98);
}

.note-title {
  font-weight: bold;
  font-size: var(--font-size-base);
  color: #8b7000;
  margin-bottom: var(--spacing-xs);
}

.note-preview {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.note-viewer {
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

.note-viewer-content {
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

.note-viewer-content h3 {
  margin: 0;
  color: #8b7000;
  font-size: var(--font-size-lg);
}

.note-content p {
  margin: 0;
  color: var(--color-text-primary);
  line-height: 1.6;
  font-size: var(--font-size-base);
}

.note-locked {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-lg);
}

.note-locked p {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
}
</style>
