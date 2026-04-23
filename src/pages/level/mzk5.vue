<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import forumData from '../../data/forum.json'
import LoadingScreen from '../../components/LoadingScreen.vue'
import TopBar from '../../components/game/TopBar.vue'
import ResultModal from '../../components/game/ResultModal.vue'

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

function goHome() {
  router.push('/index')
}

</script>

<template>
  <LoadingScreen text="正在加载中" />
  <div class="forum-container">
    <!-- 顶部栏 -->
    <TopBar
      title="调查晓山瑞希"
      subtitle="在论坛中找到关键线索！"
      level="5"
      @home="goHome"
    />

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
  <ResultModal
    :show="won"
    :success="true"
    title="没有第六关了"
    message="第 5 关 · 调查晓山瑞希 · 通关"
    :show-next="false"
    :show-replay="false"
    :enable-glitch="true"
    @home="goHome"
  >
    <template #custom-content>
      <p class="result-eerie">这已经是最后一关了。</p>
      <p class="result-eerie flicker">没有第六关。</p>
    </template>
  </ResultModal>
</template>

<style scoped>
.forum-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fdf6ff 0%, #f0e6ff 100%);
  padding-bottom: 40px;
}

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

/* ── 通关弹窗特殊样式 ── */
.result-eerie {
  font-size: 0.82rem;
  color: #999;
  margin: 0;
  transition: color 0.3s;
}

.result-eerie.flicker {
  color: #c44;
  font-size: 0.78rem;
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
</style>
