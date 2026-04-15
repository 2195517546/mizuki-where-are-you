<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/game.js'
import LevelSelect from '../components/LevelSelect.vue'

const router = useRouter()
const store = useGameStore()
const showSelect = ref(false)

function startOrContinue() {
  router.push(`/${store.nextLevel}`)
}
</script>

<template>
  <div class="home">
    <img
      class="mzk-img"
      src="https://faceround.cn/games/find-mzk/%E5%A4%A7%E7%9C%BCmzk.png"
      alt="大眼mzk"
    />

    <h1 class="title">晓山瑞希，你在哪？</h1>
    <p class="subtitle">共 10 关，找到她吧！</p>

    <div class="btns">
      <button class="btn btn-main" @click="startOrContinue">
        {{ store.hasProgress ? '继续游戏' : '开始游戏' }}
      </button>
      <button class="btn btn-secondary" @click="showSelect = true">选 关</button>
    </div>
  </div>

  <LevelSelect v-if="showSelect" @close="showSelect = false" />
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 12vh;
  gap: 20px;
  background: linear-gradient(160deg, #fff0f5 0%, #fdf6ff 100%);
}

.mzk-img {
  width: 300px;
  height: 300px;
  object-fit: contain;
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(246, 177, 181, 0.45);
  transition: transform 0.3s;
}

.mzk-img:hover {
  transform: scale(1.03);
}

.title {
  font-size: 2.2rem;
  color: #F6B1B5;
  -webkit-text-stroke: 1.5px #000;
  paint-order: stroke fill;
  margin: 0;
  text-align: center;
  letter-spacing: 0.05em;
}

.subtitle {
  color: #aaa;
  font-size: 0.95rem;
  margin: 0;
}

.btns {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 12px 40px;
  border-radius: 32px;
  border: none;
  font-size: 1.05rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.btn-main {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: #fff;
  font-weight: bold;
  -webkit-text-stroke: 0.5px #000;
  paint-order: stroke fill;
}

.btn-secondary {
  background: transparent;
  border: 2px solid #F6B1B5;
  color: #c07090;
  font-weight: bold;
}

.btn-secondary:hover {
  background: #ffe0e5;
}
</style>
