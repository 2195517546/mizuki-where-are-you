<script setup>
import { ref } from 'vue'
import { getImageUrl } from '../../config/constants.js'

const props = defineProps({
  cocoData: {
    type: Object,
    required: true
  },
  passwordRules: {
    type: Array,
    required: true
  },
  citizens: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['toast', 'evidence-coco'])

const cocoAccount = ref('')
const cocoPwd = ref('')
const cocoShowPwd = ref(false)
const cocoLoggedUser = ref(null)
const cocoActiveChat = ref(null)

function cocoLogin() {
  const acc = cocoAccount.value.trim(), pwd = cocoPwd.value.trim()
  if (!acc || !pwd) {
    emit('toast', '请输入账号和密码')
    return
  }
  const userData = props.cocoData[acc]
  if (!userData) {
    emit('toast', '账号不存在')
    return
  }
  const rule = props.passwordRules.find(r => r.targetName === userData.owner)
  if (!rule || rule.cocoPassword !== pwd) {
    emit('toast', '密码错误')
    return
  }
  const citizen = props.citizens.find(c => c.name === userData.owner)
  cocoLoggedUser.value = { account: acc, avatar: citizen?.avatar || '', ...userData }
}

function getContactAvatar(contactName) {
  const citizen = props.citizens.find(c => c.nickname === contactName || c.name === contactName)
  return citizen?.avatar || ''
}

function openChat(chat) {
  cocoActiveChat.value = chat
  if (cocoLoggedUser.value.account === '1930409680' && chat.contactName === '█怪█核█') {
    emit('evidence-coco')
  }
}
</script>

<template>
  <div class="coco-app">
    <div v-if="!cocoLoggedUser" class="login-form">
      <p class="login-title">💬 CoCo - 登录</p>
      <input v-model="cocoAccount" class="game-input" placeholder="CoCo号" />
      <div class="pwd-row">
        <input v-model="cocoPwd" class="game-input pwd-input" :type="cocoShowPwd ? 'text' : 'password'" placeholder="密码" />
        <button class="pwd-eye" @click="cocoShowPwd = !cocoShowPwd">
          <img class="pwd-eye-img" :src="getImageUrl(cocoShowPwd ? '大眼mzk.png' : '打坐mzk.png')" alt="" />
        </button>
      </div>
      <button class="game-btn game-btn-primary" @click="cocoLogin">登录</button>
    </div>
    <div v-else-if="!cocoActiveChat" class="chat-list">
      <p class="chat-owner">{{ cocoLoggedUser.owner }}的聊天记录</p>
      <div v-for="chat in cocoLoggedUser.chats" :key="chat.contactId" class="chat-item" @click="openChat(chat)">
        <span class="chat-contact">👤 {{ chat.contactName }}</span>
        <span class="chat-last">{{ chat.messages.filter(m => !m.isDeleted).slice(-1)[0]?.content.slice(0, 20) }}...</span>
      </div>
      <button class="game-btn game-btn-secondary" @click="cocoLoggedUser = null">退出登录</button>
    </div>
    <div v-else class="chat-detail">
      <p class="chat-with">与 {{ cocoActiveChat.contactName }} 的聊天</p>
      <div class="msg-list">
        <div v-for="(msg, i) in cocoActiveChat.messages" :key="i" class="message-wrapper" :class="msg.sender === cocoLoggedUser.nickname ? 'user' : 'character'">
          <img v-if="msg.sender !== cocoLoggedUser.nickname" :src="getContactAvatar(cocoActiveChat.contactName)" class="message-avatar" alt="" />
          <div class="message-bubble" :class="{ deleted: msg.isDeleted }">
            <span class="msg-content" v-if="!msg.isDeleted">{{ msg.content }}</span>
            <span class="msg-content deleted-text" v-else>[已撤回的消息]</span>
            <span class="msg-time">{{ msg.time }}</span>
          </div>
          <img v-if="msg.sender === cocoLoggedUser.nickname" :src="cocoLoggedUser.avatar" class="message-avatar" alt="" />
        </div>
      </div>
      <button class="game-btn game-btn-secondary" @click="cocoActiveChat = null">返回列表</button>
    </div>
  </div>
</template>

<style scoped>
.coco-app {
  padding: var(--spacing-md);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.login-title {
  font-weight: bold;
  font-size: var(--font-size-md);
  text-align: center;
  margin-bottom: var(--spacing-sm);
}

.login-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
}

.pwd-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.pwd-input {
  flex: 1;
  margin-bottom: 0;
}

.pwd-eye {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}

.pwd-eye-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 50%;
}

.chat-owner {
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chat-item {
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-contact {
  font-weight: bold;
  font-size: var(--font-size-base);
}

.chat-last {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.chat-with {
  font-weight: bold;
  margin-bottom: var(--spacing-md);
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 50vh;
  overflow-y: auto;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-wrapper.user {
  flex-direction: row;
  justify-content: flex-end;
}

.message-wrapper.character {
  flex-direction: row;
  justify-content: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-wrapper.user .message-bubble {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-wrapper.character .message-bubble {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid #f6c8cc;
  border-bottom-left-radius: 4px;
}

.message-bubble.deleted {
  opacity: 0.5;
}

.msg-content {
  font-size: var(--font-size-base);
  line-height: 1.4;
  word-wrap: break-word;
}

.deleted-text {
  font-style: italic;
  color: var(--color-text-light);
}

.message-wrapper.user .deleted-text {
  color: rgba(255, 255, 255, 0.7);
}

.msg-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  align-self: flex-end;
}

.message-wrapper.user .msg-time {
  color: rgba(255, 255, 255, 0.8);
}
</style>
