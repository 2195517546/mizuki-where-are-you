<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import forumData from '../../data/forum.json'
import LoadingScreen from '../../components/LoadingScreen.vue'

const router = useRouter()
const store = useGameStore()
const won = ref(false)

const BASE = 'https://faceround.cn/games/find-mzk/'

// 搜索相关
const searchQuery = ref('')
const searchHistory = ref([...forumData.searchHistory])
const selectedPost = ref(null)
const showImageModal = ref(false)
const modalImage = ref('')

// 过滤帖子
const filteredPosts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return []
  }
  return forumData.posts.filter(post => {
    const titleMatch = post.title.toLowerCase().includes(query)
    const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(query))
    return titleMatch || tagMatch
  })
})

// 搜索功能
function handleSearch() {
  const query = searchQuery.value.trim()

  // 检查是否输入通关密钥
  if (query === 'dingding10') {
    store.completeLevel(5)
    sessionStorage.setItem('showWeirdMode', 'true')
    won.value = true
    return
  }

  if (query && !searchHistory.value.includes(query)) {
    searchHistory.value.unshift(query)
    if (searchHistory.value.length > 5) {
      searchHistory.value.pop()
    }
  }
  // 如果在帖子详情页，返回列表页
  if (selectedPost.value) {
    selectedPost.value = null
  }
}

function quickSearch(keyword) {
  searchQuery.value = keyword
  handleSearch()
}

function clearSearch() {
  searchQuery.value = ''
}

// 帖子详情
function openPost(post) {
  selectedPost.value = post
}

function closePost() {
  selectedPost.value = null
}

// 图片查看
function viewImage(imageUrl) {
  modalImage.value = imageUrl
  showImageModal.value = true
}

function closeImageModal() {
  showImageModal.value = false
  modalImage.value = ''
}

function imgUrl(path) {
  return `${BASE}${path}`
}

function avatarUrl(path) {
  return `${BASE}${path}`
}

</script>

<template>
  <LoadingScreen text="正在加载中" />
  <div class="forum-container">
    <!-- 顶部栏（与其他关卡一致） -->
    <header class="top-bar">
      <router-link class="home-link" to="/index">
        <img class="home-link-icon" src="https://faceround.cn/games/find-mzk/%E5%A4%A7%E7%9C%BCmzk.png" alt="首页" />
        <span class="home-link-text">首页</span>
      </router-link>
      <div class="hint">
        <span class="hint-title">调查晓山瑞希</span>
        <span class="hint-sub">在论坛中找到关键线索！</span>
      </div>
      <span class="level-tag">第 5 关</span>
    </header>

    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索帖子、标签..."
          @keyup.enter="handleSearch"
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn">✕</button>
        <button @click="handleSearch" class="search-btn">搜索</button>
      </div>

      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0" class="search-history">
        <span class="history-label">搜索历史：</span>
        <button
          v-for="keyword in searchHistory"
          :key="keyword"
          @click="quickSearch(keyword)"
          class="history-tag"
        >
          {{ keyword }}
        </button>
      </div>

      <!-- 热门标签 -->
      <div class="hot-tags">
        <span class="tags-label">热门标签：</span>
        <button
          v-for="tag in forumData.hotTags"
          :key="tag"
          @click="quickSearch(tag)"
          class="hot-tag"
        >
          # {{ tag }}
        </button>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div v-if="!selectedPost" class="posts-list">
      <div v-if="filteredPosts.length === 0" class="no-results">
        <p>没有找到相关帖子</p>
      </div>

      <article
        v-for="post in filteredPosts"
        :key="post.id"
        @click="openPost(post)"
        class="post-card"
      >
        <div class="post-header">
          <img :src="avatarUrl(post.authorAvatar)" :alt="post.author" class="author-avatar" />
          <div class="author-info">
            <span class="author-name">{{ post.author }}</span>
            <span class="post-time">{{ post.timestamp }}</span>
          </div>
        </div>

        <h2 class="post-title">{{ post.title }}</h2>

        <div class="post-preview">
          {{ post.content.slice(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}
        </div>

        <div v-if="post.images.length > 0" class="post-images-preview">
          <img
            v-for="(img, idx) in post.images.slice(0, 3)"
            :key="idx"
            :src="imgUrl(img)"
            :alt="`图片${idx + 1}`"
            class="preview-img"
          />
          <span v-if="post.images.length > 3" class="more-images">+{{ post.images.length - 3 }}</span>
        </div>

        <div class="post-footer">
          <span class="post-tags">
            <span v-for="tag in post.tags" :key="tag" class="tag"># {{ tag }}</span>
          </span>
          <span class="post-stats">
            <span>👁 {{ post.views }}</span>
            <span>💬 {{ post.comments.length }}</span>
          </span>
        </div>
      </article>
    </div>

    <!-- 帖子详情 -->
    <div v-else class="post-detail">
      <button @click="closePost" class="back-to-list">← 返回列表</button>

      <div class="detail-header">
        <img :src="avatarUrl(selectedPost.authorAvatar)" :alt="selectedPost.author" class="author-avatar-large" />
        <div class="author-info">
          <span class="author-name">{{ selectedPost.author }}</span>
          <span class="post-time">{{ selectedPost.timestamp }}</span>
        </div>
      </div>

      <h1 class="detail-title">{{ selectedPost.title }}</h1>

      <div class="detail-content">
        <p v-for="(line, idx) in selectedPost.content.split('\n')" :key="idx">
          {{ line }}
        </p>
      </div>

      <div v-if="selectedPost.images.length > 0" class="detail-images">
        <img
          v-for="(img, idx) in selectedPost.images"
          :key="idx"
          :src="imgUrl(img)"
          :alt="`图片${idx + 1}`"
          @click="viewImage(imgUrl(img))"
          class="detail-img"
        />
      </div>

      <div class="detail-tags">
        <span v-for="tag in selectedPost.tags" :key="tag" class="tag"># {{ tag }}</span>
      </div>

      <div class="detail-stats">
        <span>👁 {{ selectedPost.views }} 浏览</span>
        <span>💬 {{ selectedPost.comments.length }} 评论</span>
      </div>

      <!-- 评论区 -->
      <div class="comments-section">
        <h3 class="comments-title">评论 ({{ selectedPost.comments.length }})</h3>

        <div v-if="selectedPost.comments.length === 0" class="no-comments">
          <p>暂无评论</p>
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in selectedPost.comments" :key="comment.id" class="comment-item">
            <img :src="avatarUrl(comment.avatar)" :alt="comment.author" class="comment-avatar" />
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.author }}</span>
                <span class="comment-time">{{ comment.timestamp }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>

              <!-- 回复列表 -->
              <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                  <img :src="avatarUrl(reply.avatar)" :alt="reply.author" class="reply-avatar" />
                  <div class="reply-content">
                    <div class="reply-header">
                      <span class="reply-author">{{ reply.author }}</span>
                      <span class="reply-time">{{ reply.timestamp }}</span>
                    </div>
                    <p class="reply-text">{{ reply.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片查看模态框 -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeImageModal">✕</button>
        <img :src="modalImage" alt="查看大图" class="modal-image" />
      </div>
    </div>
  </div>

  <!-- 通关弹窗 -->
  <Teleport to="body">
    <div v-if="won" class="overlay">
      <div class="result-wrapper">
        <div class="result-mzk-wrap">
          <img class="result-mzk" :src="`${BASE}生气mzk.png`" alt="生气mzk" />
          <img class="result-mzk result-mzk-glitch" :src="`${BASE}怪核mzk.png`" alt="怪核mzk" />
        </div>
        <div class="result-card eerie">
          <h2 class="result-title">你找到了隐藏线索！</h2>
          <p class="result-sub">第 5 关 · 调查晓山瑞希 · 通关</p>
          <p class="result-eerie">这已经是最后一关了。</p>
          <p class="result-eerie flicker">没有第六关。</p>
          <div class="result-btns">
            <button class="btn btn-home" @click="router.push('/index')">返回首页</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.forum-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fdf6ff 0%, #f0e6ff 100%);
  padding-bottom: 40px;
}

/* 顶部栏（与其他关卡一致） */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 240, 245, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid #f6c8cc;
}
@media (max-width: 640px) {
  .top-bar { padding: 6px 10px; gap: 8px; }
}
.home-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  background: #fff;
  border: 1.5px solid #f6c8cc;
  color: #c07090;
  font-size: 0.82rem;
  white-space: nowrap;
  flex-shrink: 0;
  touch-action: manipulation;
  transition: background 0.15s;
}
@media (max-width: 640px) {
  .home-link { padding: 4px 8px; font-size: 0.75rem; }
}
.home-link:active { background: #ffe0e8; }
@media (hover: hover) { .home-link:hover { background: #ffe0e8; } }
.home-link-icon { height: 1em; width: auto; object-fit: contain; flex-shrink: 0; }
.hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.hint-title { font-size: 0.95rem; font-weight: bold; color: #F6B1B5; }
@media (max-width: 640px) { .hint-title { font-size: 0.8rem; } }
.hint-sub {
  font-size: 0.72rem;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
@media (max-width: 640px) { .hint-sub { font-size: 0.65rem; } }
.level-tag {
  font-size: 0.78rem;
  font-weight: bold;
  color: #c07090;
  background: #fff;
  border: 1.5px solid #f6c8cc;
  border-radius: 20px;
  padding: 5px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
@media (max-width: 640px) { .level-tag { font-size: 0.7rem; padding: 4px 8px; } }

/* 搜索区域 */
.search-section {
  background: white;
  padding: 20px;
  margin: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0d4f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #9b6dd6;
}

.clear-btn {
  background: #f0e6ff;
  border: none;
  color: #7b4fb8;
  padding: 0 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.search-btn {
  background: linear-gradient(135deg, #9b6dd6 0%, #7b4fb8 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s;
}

.search-btn:hover {
  transform: scale(1.05);
}

.search-history,
.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
}

.history-label,
.tags-label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
}

.history-tag,
.hot-tag {
  background: #f0e6ff;
  border: none;
  color: #7b4fb8;
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.history-tag:hover,
.hot-tag:hover {
  background: #9b6dd6;
  color: white;
}

/* 帖子列表 */
.posts-list {
  padding: 0 20px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(155, 109, 214, 0.2);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.post-preview {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-images-preview {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  position: relative;
}

.preview-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.more-images {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.post-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: #f0e6ff;
  color: #7b4fb8;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.post-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #888;
}

/* 帖子详情 */
.post-detail {
  background: white;
  margin: 20px;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.back-to-list {
  background: #f0e6ff;
  border: none;
  color: #7b4fb8;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: background 0.3s;
}

.back-to-list:hover {
  background: #e0d4f0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.author-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.detail-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.detail-content {
  color: #444;
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 24px;
}

.detail-content p {
  margin: 8px 0;
}

.detail-images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.detail-img {
  width: 100%;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s;
}

.detail-img:hover {
  transform: scale(1.02);
}

.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.detail-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #888;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

/* 评论区 */
.comments-section {
  margin-top: 32px;
}

.comments-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.no-comments {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  color: #555;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

/* 回复列表 */
.replies-list {
  margin-top: 12px;
  padding-left: 20px;
  border-left: 2px solid #e0e0e0;
}

.reply-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
}

.reply-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.reply-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.reply-author {
  font-weight: 600;
  color: #555;
  font-size: 13px;
}

.reply-time {
  font-size: 11px;
  color: #aaa;
}

.reply-text {
  color: #666;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}

/* 图片模态框 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  transition: background 0.3s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-image {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .forum-header {
    padding: 12px 16px;
  }

  .forum-title {
    font-size: 18px;
  }

  .search-section {
    margin: 16px;
    padding: 16px;
  }

  .posts-list {
    padding: 0 16px;
  }

  .post-card {
    padding: 16px;
  }

  .post-title {
    font-size: 16px;
  }

  .post-detail {
    margin: 16px;
    padding: 16px;
  }

  .detail-title {
    font-size: 20px;
  }

  .detail-images {
    grid-template-columns: 1fr;
  }
}

/* ── 通关弹窗 ── */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 20px;
  animation: overlay-glitch 5s infinite;
}
@keyframes overlay-glitch {
  0%, 96.5% { background: rgba(0,0,0,0.55); }
  97% { background: rgba(0,0,0,0.72); }
  97.5% { background: rgba(0,0,0,0.45); }
  98% { background: rgba(0,0,0,0.78); }
  98.5% { background: rgba(0,0,0,0.5); }
  99% { background: rgba(0,0,0,0.65); }
  99.5% { background: rgba(0,0,0,0.55); }
}
.result-wrapper {
  position: relative; width: min(380px, 100%);
  display: flex; flex-direction: column; align-items: center;
}
.result-mzk-wrap {
  position: relative; z-index: 2;
  width: 120px; height: 120px;
  margin-bottom: -60px;
}
.result-mzk {
  position: absolute; inset: 0;
  width: 120px; height: 120px; object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}
.result-mzk-glitch {
  opacity: 0;
  animation: mzk-glitch 5s infinite;
}
@keyframes mzk-glitch {
  0%, 96.5% { opacity: 0; transform: none; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
  97% { opacity: 1; transform: scale(1.12) translate(-3px, 2px); filter: drop-shadow(0 0 10px rgba(255,0,0,0.5)); }
  97.5% { opacity: 0.5; transform: scale(1.05) translate(4px, -1px); filter: drop-shadow(0 0 6px rgba(255,0,0,0.3)); }
  98% { opacity: 1; transform: scale(1.18) translate(-2px, -3px); filter: drop-shadow(0 0 16px rgba(255,0,0,0.7)); }
  98.5% { opacity: 0.3; transform: scale(0.97) translate(2px, 1px); filter: drop-shadow(0 0 4px rgba(255,0,0,0.2)); }
  99% { opacity: 1; transform: scale(1.08); filter: drop-shadow(0 0 8px rgba(255,0,0,0.4)); }
  99.5% { opacity: 0; transform: none; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
}
.result-card {
  position: relative; z-index: 1; background: #fff; border-radius: 20px;
  padding: 72px 24px 24px; width: 100%;
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; text-align: center;
  animation: card-glitch 5s infinite;
}
@keyframes card-glitch {
  0%, 96.5% { transform: none; box-shadow: none; }
  97% { transform: translate(-2px, 1px); box-shadow: 0 0 15px rgba(255,0,0,0.15); }
  97.5% { transform: translate(3px, -1px); }
  98% { transform: translate(-1px, -2px); box-shadow: 0 0 25px rgba(255,0,0,0.25); }
  98.5% { transform: translate(2px, 1px); }
  99% { transform: translate(-1px, 0); box-shadow: 0 0 10px rgba(255,0,0,0.1); }
  99.5% { transform: none; box-shadow: none; }
}
.result-title { font-size: 1.3rem; color: #F6B1B5; margin: 0; }
.result-sub { font-size: 0.85rem; color: #aaa; margin: 0; }
.result-eerie {
  font-size: 0.82rem; color: #999; margin: 0;
  transition: color 0.3s;
}
.result-eerie.flicker {
  color: #c44; font-size: 0.78rem;
  animation: eerie-flicker 3s infinite;
}
@keyframes eerie-flicker {
  0%, 100% { opacity: 1; }
  40% { opacity: 1; }
  42% { opacity: 0.2; }
  44% { opacity: 1; }
  80% { opacity: 1; }
  82% { opacity: 0.3; }
  83% { opacity: 1; }
}
.result-btns {
  display: flex; flex-direction: column; gap: 10px;
  width: 100%; margin-top: 8px;
}
.btn {
  width: 100%; min-height: 48px; border-radius: 32px; border: none;
  font-size: 1rem; cursor: pointer; touch-action: manipulation;
  -webkit-tap-highlight-color: transparent; transition: transform 0.15s;
}
@media (max-width: 640px) { .btn { min-height: 42px; font-size: 0.9rem; } }
.btn:active { transform: scale(0.97); }
.btn-next {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: #fff; font-weight: bold;
}
.btn-home {
  background: transparent; border: 2px solid #ddd; color: #888;
}
@media (min-width: 400px) { .result-btns { flex-direction: row; } }
</style>
