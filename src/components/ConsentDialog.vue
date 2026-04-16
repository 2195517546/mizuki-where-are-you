<script setup>
import { useConsentStore } from '../store/consent.js'

const consent = useConsentStore()
</script>

<template>
  <Teleport to="body">
    <div class="overlay">
      <div class="card">
        <div class="icon">🌸</div>

        <h2 class="card-title">是否允许本地存档？</h2>

        <p class="desc">
          游戏进度（通关记录）将保存在<strong>您的浏览器本地</strong>，
          不会上传到任何服务器。
        </p>
        <p class="desc">
          若选择<strong>不同意</strong>，关闭网页后进度将全部丢失，
          下次打开需要从第 1 关重新开始。
        </p>

        <div class="actions">
          <button class="btn btn-agree" @click="consent.agree()">同意存档</button>
          <button class="btn btn-deny"  @click="consent.deny()">暂不存档</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.card {
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px 24px;
  width: min(400px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.icon {
  font-size: 2.4rem;
  line-height: 1;
}

.card-title {
  font-size: 1.2rem;
  color: #F6B1B5;  margin: 0;
}

.desc {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.desc strong {
  color: #333;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 4px;
}

.btn {
  width: 100%;
  min-height: 48px;
  border-radius: 32px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s, transform 0.15s;
}

.btn:active {
  transform: scale(0.97);
}

.btn-agree {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: #fff;
  font-weight: bold;
}

.btn-deny {
  background: transparent;
  border: 2px solid #ddd;
  color: #888;
}

@media (min-width: 400px) {
  .actions {
    flex-direction: row;
  }
}
</style>
