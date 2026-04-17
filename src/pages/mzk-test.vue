<template>
  <div class="container">
    <!-- Intro Screen -->
    <div v-if="currentScreen === 'intro'" class="screen intro-screen">
      <img
        class="mzk-img"
        src="https://faceround.cn/games/find-mzk/普通mzk.png"
        alt="普通mzk"
        fetchpriority="high"
      />

      <h1 class="title">测测你是哪种晓山瑞希</h1>
      <p class="subtitle">{{ mzkCount }}种瑞希，找到属于你的那个MZK</p>

      <div class="btns">
        <button class="btn btn-main" @click="startTest">开始测试</button>
        <button class="btn btn-secondary" @click="router.push('/index')">返回主页</button>
      </div>

      <div class="card intro-content">
        <h2>🎀 可测出的MZK类型</h2>
        <div class="mzk-list">
          <div v-for="(mzk, name) in testData.mzkTypes" :key="name" class="mzk-item">
            <img :src="mzk.image" :alt="mzk.name" />
            <span>{{ mzk.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Screen -->
    <div v-if="currentScreen === 'test'" class="screen test-screen">
      <div class="card test-card">
        <div class="topbar">
          <div class="progress">
            <span :style="{ width: progressPercent + '%' }"></span>
          </div>
          <div class="progress-text">{{ currentQuestionIndex + 1 }} / {{ testData.questions.length }}</div>
        </div>

        <div v-if="currentQuestion" class="question-container">
          <div class="question-number">问题 {{ currentQuestionIndex + 1 }}</div>
          <h3 class="question-text">{{ currentQuestion.text }}</h3>

          <div class="options">
            <button
              v-for="(opt, idx) in currentQuestion.options"
              :key="idx"
              class="option-btn"
              @click="selectOption(opt)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="test-actions">
          <button class="btn-secondary" @click="previousQuestion" :disabled="currentQuestionIndex === 0">
            上一题
          </button>
          <button class="btn-secondary" @click="currentScreen = 'intro'">退出</button>
        </div>
      </div>
    </div>

    <!-- Result Screen -->
    <div v-if="currentScreen === 'result'" class="screen result-screen">
      <div class="card result-card">
        <div class="result-header">
          <h1>你是：{{ result.name }}</h1>
          <p class="result-subtitle">{{ result.subtitle }}</p>
        </div>

        <div class="result-image">
          <img :src="result.image" :alt="result.name" />
        </div>

        <div class="result-description">
          <h3>人格特征</h3>
          <p>{{ result.description }}</p>
        </div>

        <div class="result-keywords">
          <span v-for="keyword in result.keywords" :key="keyword" class="keyword-tag">
            {{ keyword }}
          </span>
        </div>

        <div class="result-actions">
          <button class="btn-primary" @click="copyLink">分享结果</button>
          <button class="btn-secondary" @click="startTest">重新测试</button>
          <button class="btn-secondary" @click="router.push('/index')">返回主页</button>
        </div>

        <div class="author-info">
          <p>作者B站：<a href="https://space.bilibili.com/3493077794687210" target="_blank" rel="noopener">@尤珞理希</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import testData from '../data/test.json'

const router = useRouter()
const currentScreen = ref('intro')
const currentQuestionIndex = ref(0)
const answers = ref({})
const result = ref(null)

const mzkCount = computed(() => {
  return Object.keys(testData.mzkTypes).length
})

const currentQuestion = computed(() => {
  return testData.questions[currentQuestionIndex.value]
})

const progressPercent = computed(() => {
  return ((currentQuestionIndex.value + 1) / testData.questions.length) * 100
})

function startTest() {
  answers.value = {}
  result.value = null
  currentQuestionIndex.value = 0
  currentScreen.value = 'test'
}

function selectOption(option) {
  const questionId = currentQuestion.value.id
  answers.value[questionId] = option.traits

  if (currentQuestionIndex.value < testData.questions.length - 1) {
    currentQuestionIndex.value++
  } else {
    calculateResult()
  }
}

function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function calculateResult() {
  const traitScores = {}

  Object.values(answers.value).forEach(traits => {
    Object.entries(traits).forEach(([trait, score]) => {
      traitScores[trait] = (traitScores[trait] || 0) + score
    })
  })

  let bestMatch = null
  let bestScore = -1

  Object.values(testData.mzkTypes).forEach(type => {
    let score = 0
    Object.entries(type.traits).forEach(([trait, weight]) => {
      if (traitScores[trait]) {
        score += traitScores[trait] * weight
      }
    })

    if (score > bestScore) {
      bestScore = score
      bestMatch = type
    }
  })

  result.value = bestMatch || testData.mzkTypes['普通mzk']
  currentScreen.value = 'result'
}

function copyLink() {
  const url = window.location.origin + window.location.pathname
  const shareText = `我测出来是${result.value.name}！快来测测你是哪种晓山瑞希：${url}`

  navigator.clipboard.writeText(shareText).then(() => {
    alert('分享内容已复制到剪贴板！')
  }).catch(() => {
    alert('复制失败，请手动复制：' + shareText)
  })
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.container {
  min-height: 100vh;
  background: linear-gradient(160deg, #fff0f5 0%, #fdf6ff 100%);
}

.intro-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 10vh;
  padding-bottom: 32px;
  gap: clamp(14px, 3.5vw, 24px);
}

.mzk-img {
  width: clamp(180px, 40vw, 320px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(255, 105, 180, 0.25));
}

.title {
  font-size: clamp(28px, 6vw, 48px);
  font-weight: 700;
  margin: 0;
  color: #ff69b4;
  text-align: center;
  line-height: 1.2;
}

.subtitle {
  font-size: clamp(14px, 3vw, 18px);
  color: #666;
  margin: 0;
  text-align: center;
}

.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding: 0 16px;
}

.btn {
  padding: 14px 28px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-main {
  background: #ff69b4;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
}

.btn-main:hover {
  background: #ff1493;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 105, 180, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.test-screen, .result-screen {
  padding: 24px 16px 56px;
}

.shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 16px 56px;
  min-height: 100vh;
  background: #f6faf6;
}

.card {
  background: #ffffff;
  border: 1px solid #dbe8dd;
  border-radius: 22px;
  box-shadow: 0 16px 40px rgba(47, 73, 55, 0.08);
  margin: 24px auto;
  max-width: 980px;
}

.intro-content {
  padding: 28px;
  margin: 0 16px;
}

.intro-content h2 {
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
  color: #ff69b4;
}

.hero {
  padding: 28px;
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: "";
  position: absolute;
  right: -60px;
  top: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255, 105, 180, 0.18), rgba(255, 105, 180, 0.02));
  pointer-events: none;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #ff69b4;
  border: 1px solid #ffc0cb;
  background: #fff0f5;
  border-radius: 999px;
  padding: 8px 12px;
  margin-bottom: 16px;
}

h1, h2, h3, p {
  margin: 0;
}

.hero h1 {
  font-size: clamp(28px, 5vw, 52px);
  line-height: 1.08;
  letter-spacing: -0.03em;
  margin-bottom: 12px;
}

.lead {
  font-size: 18px;
  color: #6a786f;
  margin-bottom: 24px;
}

.btn-primary, .btn-secondary {
  padding: 14px 28px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 12px;
}

.btn-primary {
  background: #6c8d71;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4d6a53;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #edf6ef;
  color: #4d6a53;
}

.btn-secondary:hover:not(:disabled) {
  background: #dbe8dd;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.intro-content {
  padding: 28px;
}

.intro-content h2 {
  font-size: 24px;
  margin-bottom: 20px;
}

.cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.mzk-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.mzk-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fff0f5;
  border: 1px solid #ffc0cb;
  border-radius: 12px;
  text-align: center;
  font-size: 14px;
  color: #ff69b4;
  font-weight: 500;
}

.mzk-item img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.mzk-item span {
  display: block;
}

.test-card {
  padding: 28px;
  max-width: 800px;
}

.cluster-item {
  padding: 16px;
  background: #edf6ef;
  border-radius: 12px;
}

.cluster-item h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.cluster-item p {
  font-size: 14px;
  color: #6a786f;
}

.test-card {
  padding: 28px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.progress {
  flex: 1;
  min-width: 240px;
  height: 10px;
  background: #edf6ef;
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.progress > span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #97b59c, #5b7a62);
  border-radius: inherit;
  transition: width 0.3s ease;
}

.progress-text {
  color: #6a786f;
  font-size: 13px;
  white-space: nowrap;
}

.question-container {
  margin-bottom: 32px;
}

.question-number {
  font-size: 12px;
  color: #6a786f;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.question-text {
  font-size: 22px;
  margin-bottom: 24px;
  line-height: 1.5;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  padding: 18px 24px;
  background: #edf6ef;
  border: 2px solid #dbe8dd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  text-align: left;
  color: #1e2a22;
}

.option-btn:hover {
  background: #dbe8dd;
  border-color: #6c8d71;
  transform: translateX(4px);
}

.test-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #dbe8dd;
}

.result-card {
  padding: 40px;
  text-align: center;
}

.result-header h1 {
  font-size: 36px;
  margin-bottom: 8px;
}

.result-subtitle {
  font-size: 20px;
  color: #6a786f;
  margin-bottom: 12px;
}

.result-cluster {
  display: inline-block;
  padding: 8px 16px;
  background: #edf6ef;
  color: #4d6a53;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
}

.result-image {
  margin-bottom: 32px;
}

.result-image img {
  max-width: 300px;
  width: 100%;
  height: auto;
  border-radius: 16px;
}

.result-description {
  margin-bottom: 24px;
  text-align: left;
}

.result-description h3 {
  font-size: 20px;
  margin-bottom: 12px;
}

.result-description p {
  font-size: 16px;
  line-height: 1.6;
  color: #6a786f;
}

.result-keywords {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.keyword-tag {
  padding: 8px 16px;
  background: #edf6ef;
  color: #4d6a53;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.author-info {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #ffc0cb;
  margin-top: 16px;
}

.author-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.author-info a {
  color: #ff69b4;
  text-decoration: none;
  font-weight: 600;
}

.author-info a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .hero h1 {
    font-size: 28px;
  }

  .lead {
    font-size: 16px;
  }

  .cluster-grid {
    grid-template-columns: 1fr;
  }

  .test-card, .result-card {
    padding: 20px;
  }

  .question-text {
    font-size: 18px;
  }

  .result-header h1 {
    font-size: 28px;
  }

  .result-subtitle {
    font-size: 18px;
  }

  .test-actions {
    flex-direction: column;
    gap: 12px;
  }

  .test-actions button {
    width: 100%;
  }

  .result-actions {
    flex-direction: column;
  }

  .result-actions button {
    width: 100%;
  }
}
</style>
