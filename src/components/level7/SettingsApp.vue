<script setup>
import { ref } from 'vue'

const props = defineProps({
  settingsData: {
    type: Object,
    required: true
  },
  devTapCount: {
    type: Number,
    default: 0
  },
  terminalUnlocked: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['dev-tap', 'show-date-picker'])

const showDatePicker = ref(false)

function handleDevTap() {
  emit('dev-tap')
}

function openDatePicker() {
  emit('show-date-picker')
}
</script>

<template>
  <div class="settings-app">
    <div class="app-head">
      <span>设置</span>
    </div>
    <ul class="settings-list">
      <li>Wi-Fi：<span class="muted">受限</span></li>
      <li>蓝牙：<span class="muted">无法连接</span></li>
      <li>显示：<span class="muted">亮度最大</span></li>
      <li class="sep">系统</li>
      <li class="tapable" @click="openDatePicker">
        日期与时间：<span class="muted">{{ settingsData.currentDate }}</span>
      </li>
      <li>存储空间：<span class="muted">{{ settingsData.storage }}</span></li>
      <li>系统版本：<span class="muted">{{ settingsData.version }}</span></li>
      <li class="sep">关于</li>
      <li @click="handleDevTap">
        设备名称：<span class="muted">{{ settingsData.deviceName }}</span>
        <span v-if="devTapCount > 0 && !terminalUnlocked" class="dev">
          ({{ 7 - devTapCount }})
        </span>
      </li>
      <li v-if="terminalUnlocked" class="dev">
        开发者模式：<span class="dev">已启用</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.settings-app {
  background: #111;
  color: #ddd;
  min-height: 100%;
}

.app-head {
  background: #222;
  color: #fff;
  padding: var(--spacing-md);
  text-align: center;
  font-weight: 600;
  border-bottom: 1px solid #333;
}

.settings-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.settings-list li {
  padding: 12px 14px;
  border-bottom: 1px solid #222;
  color: #ddd;
  font-size: var(--font-size-sm);
}

.settings-list li.sep {
  background: #111;
  color: #888;
  font-size: var(--font-size-xs);
  padding: 6px 14px;
}

.settings-list .muted {
  color: #888;
}

.settings-list .tapable {
  cursor: pointer;
}

.settings-list .tapable:hover {
  background: #222;
}

.settings-list .dev {
  color: #bfff7a;
}
</style>
