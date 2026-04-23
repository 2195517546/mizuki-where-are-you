<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  messagesData: {
    type: Object,
    required: true
  },
  dateChangedToBirthday: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toast'])

const smsInput = ref('')
const smsLog = reactive([...props.messagesData.conversation])

function sendSms() {
  const text = smsInput.value.trim()
  if (!text) return
  smsLog.push({ from: 'self', text, time: nowTime() })
  smsInput.value = ''
  setTimeout(() => {
    const lower = text.toLowerCase()
    let reply = props.messagesData.defaultReply
    if (props.dateChangedToBirthday) {
      reply = props.messagesData.afterDateChangeReply
    } else {
      for (const r of props.messagesData.replies) {
        if (lower.includes(r.key.toLowerCase())) {
          reply = r.text
          break
        }
      }
    }
    smsLog.push({ from: 'other', text: reply, time: nowTime() })
  }, 500)
}

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="messages-app">
    <div class="app-head">
      <span>未知号码</span>
    </div>
    <div class="sms-body">
      <div v-for="(m, i) in smsLog" :key="i" class="sms-bubble" :class="{ self: m.from === 'self' }">
        <p>{{ m.text }}</p>
        <span class="sms-time">{{ m.time }}</span>
      </div>
    </div>
    <div class="sms-input">
      <input v-model="smsInput" placeholder="回复..." @keyup.enter="sendSms" />
      <button class="game-btn game-btn-primary" @click="sendSms">发送</button>
    </div>
  </div>
</template>

<style scoped>
.messages-app {
  background: #f5f5f7;
  color: #222;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-head {
  background: #fff;
  color: #333;
  padding: var(--spacing-md);
  text-align: center;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
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
</style>
