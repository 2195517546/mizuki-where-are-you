<script setup>
import { ref } from 'vue'

const props = defineProps({
  citizens: {
    type: Array,
    required: true
  },
  passwordRules: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['toast', 'password-cracked'])

const crackName = ref('')
const crackSS = ref('')
const crackNick = ref('')
const crackCoCo = ref('')
const crackBirth = ref('')
const crackAddr = ref('')
const crackResult = ref(null)
const crackProgress = ref(0)
const cracking = ref(false)

function crackPassword() {
  const name = crackName.value.trim(), ss = crackSS.value.trim()
  const nick = crackNick.value.trim(), coco = crackCoCo.value.trim()
  const birth = crackBirth.value.trim(), addr = crackAddr.value.trim()
  if (!name || !ss || !nick || !coco || !birth || !addr) {
    emit('toast', '请填写全部六项信息')
    return
  }

  const target = props.citizens.find(c =>
    c.name === name && c.socialSecurity === ss &&
    c.nickname === nick && c.CoCo === coco &&
    c.birthDate === birth && c.address.includes(addr)
  )
  if (!target) {
    crackResult.value = 'FAIL'
    return
  }
  const rule = props.passwordRules.find(r => r.targetName === target.name)
  if (!rule) {
    crackResult.value = 'FAIL'
    return
  }

  // 开始破解动画
  cracking.value = true
  crackProgress.value = 0
  crackResult.value = null

  const interval = setInterval(() => {
    crackProgress.value += 10
    if (crackProgress.value >= 100) {
      clearInterval(interval)
      cracking.value = false

      // 判断密码是否相同
      if (rule.cocoPassword === rule.emailPassword) {
        crackResult.value = { name: target.name, password: rule.cocoPassword, samePassword: true }
      } else {
        crackResult.value = { name: target.name, coco: rule.cocoPassword, email: rule.emailPassword, samePassword: false }
      }
      emit('password-cracked', target.name, { coco: rule.cocoPassword, email: rule.emailPassword })
    }
  }, 150)
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => emit('toast', '已复制')).catch(() => emit('toast', '复制失败'))
  } else {
    emit('toast', '浏览器不支持复制功能')
  }
}
</script>

<template>
  <div class="cracker-app">
    <p class="cracker-title">🔐 目标账号破解</p>
    <input v-model="crackName" class="game-input" placeholder="姓名" />
    <input v-model="crackSS" class="game-input" placeholder="社会保障号" />
    <input v-model="crackNick" class="game-input" placeholder="常用网名" />
    <input v-model="crackCoCo" class="game-input" placeholder="CoCo号" />
    <input v-model="crackBirth" class="game-input" placeholder="出生日期(如20100515)" />
    <input v-model="crackAddr" class="game-input" placeholder="门牌号(如66)" />
    <button class="game-btn game-btn-primary" @click="crackPassword" :disabled="cracking">
      {{ cracking ? '破解中...' : '破解密码' }}
    </button>

    <div v-if="cracking" class="crack-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: crackProgress + '%' }"></div>
      </div>
      <p class="progress-text">正在破解密码... {{ crackProgress }}%</p>
    </div>

    <div v-if="crackResult && crackResult !== 'FAIL'" class="crack-success">
      <p>✅ 成功获取 <b>{{ crackResult.name }}</b> 的密码！</p>
      <p v-if="crackResult.samePassword">
        常用密码: <code>{{ crackResult.password }}</code>
        <button class="btn-copy" @click="copyToClipboard(crackResult.password)">📋</button>
      </p>
      <p v-else>
        CoCo密码: <code>{{ crackResult.coco }}</code>
        <button class="btn-copy" @click="copyToClipboard(crackResult.coco)">📋</button>
      </p>
    </div>
    <p v-else-if="crackResult === 'FAIL'" class="no-result">❌ 破解失败，信息不匹配。</p>
  </div>
</template>

<style scoped>
.cracker-app {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.cracker-title {
  font-weight: bold;
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-sm);
}

.crack-progress {
  margin-top: var(--spacing-md);
}

.progress-bar {
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark));
  transition: width 0.15s linear;
}

.progress-text {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.crack-success {
  background: #e8f5e9;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.crack-success p {
  margin: 4px 0;
  font-size: var(--font-size-sm);
}

.crack-success code {
  background: #c8e6c9;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.btn-copy {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0 4px;
}

.no-result {
  text-align: center;
  color: var(--color-error);
  font-size: var(--font-size-base);
  padding: var(--spacing-lg);
}
</style>
