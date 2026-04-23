<script setup>
import { ref } from 'vue'

const props = defineProps({
  calendarData: {
    type: Object,
    required: true
  },
  calYear: {
    type: Number,
    required: true
  },
  calMonth: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['change-date-to-birthday'])

const selectedDateEvent = ref(null)

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate()
}

function clickDate(d) {
  const key = `${props.calMonth}-${d}`
  const ev = props.calendarData.events[key]
  if (ev) {
    selectedDateEvent.value = { date: key, ...ev }
  } else {
    selectedDateEvent.value = null
  }
}

function changeSystemDateToBirthday() {
  emit('change-date-to-birthday')
}
</script>

<template>
  <div class="calendar-app">
    <div class="app-head">
      <span>日历 · {{ calYear }}-{{ calMonth }}</span>
    </div>
    <div class="cal-grid">
      <div
        v-for="d in daysInMonth(calYear, calMonth)"
        :key="d"
        class="cal-cell"
        :class="{ marked: !!calendarData.events[`${calMonth}-${d}`] }"
        @click="clickDate(d)"
      >
        {{ d }}
      </div>
    </div>
    <div v-if="selectedDateEvent" class="cal-detail">
      <h3>{{ selectedDateEvent.date }}</h3>
      <p>{{ selectedDateEvent.label }}</p>
      <p class="cal-hint">{{ selectedDateEvent.detail }}</p>
      <button
        v-if="selectedDateEvent.date === '8-27'"
        class="game-btn game-btn-primary"
        @click="changeSystemDateToBirthday"
      >
        修改系统日期为 8 月 27 日
      </button>
    </div>
  </div>
</template>

<style scoped>
.calendar-app {
  background: #111;
  color: #fff;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.app-head {
  background: #222;
  color: #fff;
  padding: var(--spacing-md);
  text-align: center;
  font-weight: 600;
  border-bottom: 1px solid #333;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding: 10px;
}

.cal-cell {
  aspect-ratio: 1;
  background: #222;
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.cal-cell:hover {
  background: #333;
}

.cal-cell.marked {
  background: #ff4b7d;
  color: #fff;
  font-weight: bold;
}

.cal-detail {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.cal-detail h3 {
  margin: 0;
  color: #fff;
  font-size: var(--font-size-lg);
}

.cal-detail p {
  margin: 0;
  color: #ccc;
  line-height: 1.6;
}

.cal-hint {
  color: #888;
  font-size: var(--font-size-sm);
}
</style>
