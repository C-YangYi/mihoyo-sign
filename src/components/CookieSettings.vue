<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2>Cookie 设置</h2>
      <p>点击下方按钮打开米游社登录页，登录后点击"获取 Cookie"将自动保存。</p>

      <button class="btn btn-primary btn-block" @click="openLogin">打开米游社登录</button>
      <div class="preview" :class="{ empty: !cookiePreview }">{{ previewText }}</div>
      <button class="btn btn-primary btn-block" @click="getCookies" :disabled="loading">{{ loading ? '获取中...' : '获取 Cookie' }}</button>
      <button class="btn btn-secondary btn-block" @click="clearSession">清除登录状态</button>

      <div class="btn-row">
        <button class="btn btn-secondary" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['close', 'saved']);

const STORAGE_KEY = 'mihoyo-sign-config';
const cookie = ref('');
const cookiePreview = ref('');
const loading = ref(false);
const statusText = ref('');

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveConfig(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

const c = loadConfig();
if (c.cookie) {
  cookie.value = c.cookie;
  cookiePreview.value = c.cookie;
}

const previewText = computed(() => {
  if (statusText.value) return statusText.value;
  if (cookiePreview.value) return cookiePreview.value;
  return '未获取 Cookie';
});

async function openLogin() {
  await window.signAPI.openLoginWindow();
}

async function getCookies() {
  loading.value = true;
  statusText.value = '获取中...';
  const result = await window.signAPI.getLoginCookies();
  if (result.cookie) {
    cookie.value = result.cookie;
    cookiePreview.value = result.cookie;
    // Auto-save: fetch accounts and save, then close login window
    statusText.value = '正在获取游戏账号...';
    try {
      const accounts = await window.signAPI.fetchAccounts(result.cookie);
      saveConfig({ cookie: result.cookie, accounts });
      await window.signAPI.closeLoginWindow();
      statusText.value = '已自动保存';
      emit('saved');
    } catch (err) {
      statusText.value = '获取账号失败: ' + err.message;
    }
  } else {
    statusText.value = `未获取到。全部cookie(${result.allNames?.length || 0}): ${(result.allNames || []).slice(0, 10).join(', ')}`;
  }
  loading.value = false;
}

async function clearSession() {
  await window.signAPI.clearLoginSession();
  cookie.value = '';
  cookiePreview.value = '';
  statusText.value = '';
}
</script>

<style scoped>
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; -webkit-app-region: no-drag; }
.modal { background: #fff; border-radius: 12px; padding: 24px; width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
.modal h2 { font-size: 18px; margin-bottom: 12px; text-align: center; color: #333; }
.modal p { font-size: 13px; color: #999; margin-bottom: 16px; line-height: 1.6; text-align: center; }
.btn { padding: 10px 16px; font-size: 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #2d8cf0; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #4ba1f5; }
.btn-secondary { background: transparent; color: #999; border: 1px solid #e8e8e8; }
.btn-secondary:hover:not(:disabled) { color: #2d8cf0; border-color: #2d8cf0; }
.btn-block { display: block; width: 100%; margin-bottom: 10px; }
.btn-row { display: flex; gap: 10px; }
.btn-row .btn { flex: 1; }
.preview { font-size: 12px; color: #2d8cf0; margin-bottom: 10px; word-break: break-all; max-height: 120px; overflow: auto; min-height: 18px; }
.preview.empty { color: #999; }
</style>
