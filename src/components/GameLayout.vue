<template>
  <div class="layout">
    <main class="layout-body">
      <slot />
    </main>
    <footer class="layout-footer">
      <div class="footer-inner">
        <a href="https://space.bilibili.com/3493077794687210" target="_blank" rel="noopener">by 尤珞理希</a>
        <span class="sep">｜</span>
        <img
          src="/公安.png"
          alt="公安备案"
          class="beian-icon"
        />
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=35082302000267"
          target="_blank"
          rel="noopener"
        >闽公网安备35082302000267号</a>
        <span class="sep">｜</span>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">闽ICP备2025113173号-1</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
}

.layout-body {
  flex: 1;
}

.layout-footer {
  padding: 14px 16px;
  background: #1a1a1a;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}

.footer-inner a {
  color: #ccc;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-inner a:hover {
  color: #F6B1B5;
}

.sep {
  color: #555;
  user-select: none;
}

.beian-icon {
  height: 14px;
  width: 14px;
  vertical-align: middle;
}
</style>
