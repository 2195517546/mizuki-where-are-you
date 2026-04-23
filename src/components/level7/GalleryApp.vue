<script setup>
import { ref } from 'vue'
import { getImageUrl } from '../../config/constants.js'

const props = defineProps({
  photosData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['real-name-found'])

const selectedPhoto = ref(null)

function viewPhoto(photo) {
  selectedPhoto.value = photo
  if (photo.id === 'real_name') {
    emit('real-name-found')
  }
}

function closePhoto() {
  selectedPhoto.value = null
}
</script>

<template>
  <div class="gallery-app">
    <div class="photo-grid">
      <div
        v-for="photo in photosData.photos"
        :key="photo.id"
        class="photo-item"
        @click="viewPhoto(photo)"
      >
        <img :src="getImageUrl(photo.src)" :alt="photo.title" />
      </div>
    </div>

    <!-- 照片查看器 -->
    <div v-if="selectedPhoto" class="photo-viewer" @click="closePhoto">
      <div class="photo-viewer-content" @click.stop>
        <img :src="getImageUrl(selectedPhoto.src)" :alt="selectedPhoto.title" />
        <p class="photo-title">{{ selectedPhoto.title }}</p>
        <button class="game-btn game-btn-secondary" @click="closePhoto">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-app {
  padding: var(--spacing-md);
  background: #000;
  min-height: 100%;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.photo-item {
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #222;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.photo-item:active img {
  transform: scale(0.95);
}

.photo-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-md);
}

.photo-viewer-content {
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.photo-viewer-content img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.photo-title {
  color: white;
  font-size: var(--font-size-base);
  text-align: center;
}
</style>
