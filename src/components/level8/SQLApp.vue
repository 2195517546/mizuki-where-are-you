<script setup>
import { ref } from 'vue'
import { getImageUrl } from '../../config/constants.js'

const props = defineProps({
  citizens: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['query-detective'])

const sqlName = ref('')
const sqlExtra = ref('')
const sqlResult = ref(null)

function searchCitizen() {
  const name = sqlName.value.trim()
  const extra = sqlExtra.value.trim()
  if (!name) {
    emit('toast', '请输入姓名')
    return
  }
  const found = props.citizens.find(c => {
    if (c.name !== name) return false
    if (!extra) return true
    return c.CoCo === extra || c.phone === extra || c.socialSecurity === extra || c.birthDate === extra || c.email === extra
  })
  sqlResult.value = found || 'NOT_FOUND'
  if (found && found.name === '侦探mzk') {
    emit('query-detective')
  }
}

function copyCitizenInfo(c) {
  const info = `姓名：${c.name}\n社会保障号：${c.socialSecurity}\n出生日期：${c.birthDate}\n地址：${c.address}\n电话：${c.phone}\nCoCo号：${c.CoCo}\n邮箱：${c.email}`
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(info).then(() => emit('toast', '户籍信息已复制'))
  }
}
</script>

<template>
  <div class="sql-app">
    <div class="sql-search">
      <input v-model="sqlName" class="game-input" placeholder="姓名" />
      <input v-model="sqlExtra" class="game-input" placeholder="补充信息（昵称/CoCo号/邮箱/电话/社会保障号，可选）" />
      <button class="game-btn game-btn-primary" @click="searchCitizen">查询</button>
    </div>
    <div v-if="sqlResult && sqlResult !== 'NOT_FOUND'" class="citizen-card">
      <img :src="sqlResult.avatar" class="citizen-avatar" alt="" />
      <div class="citizen-info">
        <p><strong>姓名：</strong>{{ sqlResult.name }}</p>
        <p><strong>社会保障号：</strong>{{ sqlResult.socialSecurity }}</p>
        <p><strong>出生日期：</strong>{{ sqlResult.birthDate }}</p>
        <p><strong>地址：</strong>{{ sqlResult.address }}</p>
        <p><strong>电话：</strong>{{ sqlResult.phone }}</p>
        <p><strong>CoCo号：</strong>{{ sqlResult.CoCo }}</p>
        <p><strong>邮箱：</strong>{{ sqlResult.email }}</p>
      </div>
      <button class="game-btn game-btn-secondary" style="margin-top: 12px;" @click="copyCitizenInfo(sqlResult)">复制户籍信息</button>
    </div>
    <p v-else-if="sqlResult === 'NOT_FOUND'" class="no-result">❌ 未找到匹配的公民信息</p>
  </div>
</template>

<style scoped>
.sql-app {
  padding: var(--spacing-md);
}

.sql-search {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.citizen-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.citizen-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: var(--spacing-md);
}

.citizen-info p {
  margin: 4px 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.no-result {
  text-align: center;
  color: var(--color-error);
  font-size: var(--font-size-base);
  padding: var(--spacing-lg);
}
</style>
