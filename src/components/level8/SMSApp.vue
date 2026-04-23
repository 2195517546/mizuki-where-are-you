<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  smsData: {
    type: Array,
    required: true
  },
  citizens: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['win', 'wrong-attempt'])

const smsInput = ref('')
const smsLog = reactive([...props.smsData])

function sendSms() {
  const text = smsInput.value.trim()
  if (!text) return
  smsLog.push({ id: 'user_' + Date.now(), sender: '侦探mzk', content: text, timestamp: nowTime(), read: true })
  smsInput.value = ''

  setTimeout(() => {
    // 检查是否是正确答案（怪核mzk的户籍信息）
    const weirdMzk = props.citizens.find(c => c.name === '怪核mzk')
    if (text.includes('怪核mzk') && (text.includes(weirdMzk.socialSecurity) || text.includes(weirdMzk.address) || text.includes(weirdMzk.birthDate))) {
      emit('win')
    } else {
      smsLog.push({
        id: 'reply_err_' + Date.now(),
        sender: 'mzk市公安局',
        content: '大名鼎鼎的侦探mzk，很明显你找错人了，请再试试！\n提示：真正的凶手可能另有其人...',
        timestamp: nowTime(),
        read: true
      })
      emit('wrong-attempt')
    }
  }, 500)
}

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

defineExpose({ smsLog })
</script>

<template>
  <div class="sms-app">
    <div class="sms-body">
      <div v-for="(m, i) in smsLog" :key="i" class="sms-bubble" :class="{ self: m.sender === '侦探mzk' }">
        <p>{{ m.content }}</p>
        <span class="sms-time">{{ m.timestamp }}</span>
      </div>
    </div>
    <div class="sms-input">
      <input v-model="smsInput" placeholder="发短信给公安局" @keyup.enter="sendSms" />
      <button class="game-btn game-btn-primary" @click="sendSms">发送</button>
    </div>
  </div>
</template>

<style scoped>
.sms-app {
  background: #f5f5f7;
  color: #222;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sms-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sms-bubble {
  background: #fff;
  padding: 8px 12px;
  border-radius: 14px;
  max-width: 75%;
  align-self: flex-start;
}

.sms-bubble.self {
  background: #ff4b7d;
  color: #fff;
  align-self: flex-end;
}

.sms-bubble p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.4;
}

.sms-time {
  font-size: 0.65rem;
  color: #aaa;
}

.sms-bubble.self .sms-time {
  color: rgba(255, 255, 255, 0.75);
}

.sms-input {
  display: flex;
  gap: var(--spacing-sm);
  padding: 10px;
  background: #fff;
  border-top: 1px solid #eee;
}

.sms-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 18px;
  outline: none;
  font-size: 0.88rem;
}

.sms-input .game-btn {
  width: auto;
  padding: 8px 16px;
  margin-bottom: 0;
}
</style>
