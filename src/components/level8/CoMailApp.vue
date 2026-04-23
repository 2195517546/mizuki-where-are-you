<script setup>
import { ref } from 'vue'
import { getImageUrl } from '../../config/constants.js'

const props = defineProps({
  comailData: {
    type: Object,
    required: true
  },
  passwordRules: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['toast'])

const comailAccount = ref('')
const comailPwd = ref('')
const comailShowPwd = ref(false)
const comailLoggedUser = ref(null)
const comailActiveEmail = ref(null)

function comailLogin() {
  const acc = comailAccount.value.trim(), pwd = comailPwd.value.trim()
  if (!acc || !pwd) {
    emit('toast', '请输入邮箱和密码')
    return
  }
  const userData = props.comailData[acc]
  if (!userData) {
    emit('toast', '邮箱不存在')
    return
  }
  const rule = props.passwordRules.find(r => r.targetName === userData.owner)
  if (!rule || rule.emailPassword !== pwd) {
    emit('toast', '密码错误')
    return
  }
  comailLoggedUser.value = { account: acc, ...userData }
}
</script>

<template>
  <div class="comail-app">
    <div v-if="!comailLoggedUser" class="login-form">
      <p class="login-title">📧 CoMail - 登录</p>
      <input v-model="comailAccount" class="game-input" placeholder="邮箱地址" />
      <div class="pwd-row">
        <input v-model="comailPwd" class="game-input pwd-input" :type="comailShowPwd ? 'text' : 'password'" placeholder="密码" />
        <button class="pwd-eye" @click="comailShowPwd = !comailShowPwd">
          <img class="pwd-eye-img" :src="getImageUrl(comailShowPwd ? '大眼mzk.png' : '打坐mzk.png')" alt="" />
        </button>
      </div>
      <button class="game-btn game-btn-primary" @click="comailLogin">登录</button>
    </div>
    <div v-else-if="!comailActiveEmail" class="email-list">
      <p class="email-owner">收件箱 - {{ comailLoggedUser.account }}</p>
      <div v-for="mail in comailLoggedUser.inbox" :key="mail.id" class="email-item" :class="{ unread: !mail.read }" @click="comailActiveEmail = mail">
        <span class="email-from">📨 {{ mail.from }}</span>
        <span class="email-subject">{{ mail.subject || '（无主题）' }}</span>
        <span class="email-time">{{ mail.time }}</span>
      </div>
      <button class="game-btn game-btn-secondary" @click="comailLoggedUser = null">退出登录</button>
    </div>
    <div v-else class="email-detail">
      <p class="email-detail-from"><strong>发件人：</strong>{{ comailActiveEmail.from }}</p>
      <p class="email-detail-time"><strong>时间：</strong>{{ comailActiveEmail.time }}</p>
      <p class="email-detail-subject"><strong>主题：</strong>{{ comailActiveEmail.subject || '（无主题）' }}</p>
      <div class="email-body" style="white-space:pre-wrap">{{ comailActiveEmail.body }}</div>
      <button class="game-btn game-btn-secondary" @click="comailActiveEmail = null">返回收件箱</button>
    </div>
  </div>
</template>

<style scoped>
.comail-app {
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

.email-owner {
  font-weight: bold;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.email-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.email-item {
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid var(--color-border);
}

.email-item.unread {
  border-left: 3px solid var(--color-primary);
}

.email-from {
  font-weight: bold;
  font-size: var(--font-size-sm);
  display: block;
}

.email-subject {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  display: block;
  margin-top: 2px;
}

.email-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
  display: block;
  margin-top: 2px;
}

.email-detail-from,
.email-detail-time,
.email-detail-subject {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 4px 0;
}

.email-body {
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  line-height: 1.6;
}
</style>
