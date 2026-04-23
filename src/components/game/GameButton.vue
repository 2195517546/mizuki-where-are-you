<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // primary, secondary, success, error
    validator: (value) => ['primary', 'secondary', 'success', 'error'].includes(value)
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

function handleClick(event) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :class="[
      'game-button',
      `game-button-${variant}`,
      `game-button-${size}`,
      { 'game-button-block': block, 'game-button-loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="button-spinner">⏳</span>
    <slot></slot>
  </button>
</template>

<style scoped>
.game-button {
  padding: 0 var(--spacing-lg);
  border: none;
  border-radius: var(--radius-xl);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  white-space: nowrap;
}

.game-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 尺寸变体 */
.game-button-sm {
  height: var(--button-height-sm);
  font-size: var(--font-size-sm);
  padding: 0 var(--spacing-md);
}

.game-button-md {
  height: var(--button-height-md);
}

.game-button-lg {
  height: var(--button-height-lg);
  font-size: var(--font-size-md);
  padding: 0 var(--spacing-xl);
}

/* 颜色变体 */
.game-button-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
}

.game-button-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.game-button-primary:active:not(:disabled) {
  transform: translateY(0);
}

.game-button-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.game-button-secondary:hover:not(:disabled) {
  background: var(--color-border);
}

.game-button-success {
  background: var(--color-success);
  color: white;
}

.game-button-success:hover:not(:disabled) {
  filter: brightness(1.1);
}

.game-button-error {
  background: var(--color-error);
  color: white;
}

.game-button-error:hover:not(:disabled) {
  filter: brightness(1.1);
}

/* 块级按钮 */
.game-button-block {
  width: 100%;
}

/* 加载状态 */
.game-button-loading {
  pointer-events: none;
}

.button-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
