<script setup>
defineProps({
  memoData: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="memo-app">
    <div v-for="(note, i) in memoData.notes" :key="i" class="memo-card">
      <h3>{{ note.title }}</h3>
      <p style="white-space:pre-wrap">{{ note.content }}</p>
    </div>
  </div>
</template>

<style scoped>
.memo-app {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.memo-card {
  background: #fffbe6;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  border: 1px solid #f0e6b0;
}

.memo-card h3 {
  margin: 0 0 var(--spacing-sm);
  color: #8b7000;
  font-size: var(--font-size-base);
}

.memo-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}
</style>
