<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2>Cookie 设置</h2>
      <p>点击下方按钮打开米游社登录页，登录后点击"获取 Cookie"。</p>

      <button class="btn btn-primary btn-block" @click="openLogin">打开米游社登录</button>
      <div class="preview" :class="{ empty: !cookiePreview }">{{ cookiePreview || '未获取 Cookie' }}</div>
      <button class="btn btn-primary btn-block" @click="getCookies" :disabled="loading">{{ loading ? '获取中...' : '获取 Cookie' }}</button>
      <button class="btn btn-secondary btn-block" @click="clearSession">清除登录状态</button>

      <div class="btn-row">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="save" :disabled="!cookie || saving">{{ saving ? '保存中...' : '保存' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close', 'saved']);

const STORAGE_KEY = 'mihoyo-sign-config';
const cookie = ref('');
const cookiePreview = ref('');
const loading = ref(false);
const saving = ref(false);

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveConfig(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

// Init from saved config
const c = loadConfig();
if (c.cookie) {
  cookie.value = c.cookie;
  cookiePreview.value = c.cookie.substring(0, 80) + '...';
}

async function openLogin() {
  await window.signAPI.openLoginWindow();
}

async function getCookies() {
  loading.value = true;
  cookiePreview.value = '获取中...';
  const result = await window.signAPI.getLoginCookies();
  if (result.cookie) {
    cookie.value = result.cookie;
    cookiePreview.value = result.cookie;
  } else {
    cookiePreview.value = `未获取到。全部cookie(${result.allNames?.length || 0}): ${(result.allNames || []).slice(0, 10).join(', ')}`;
  }
  loading.value = false;
}

async function clearSession() {
  await window.signAPI.clearLoginSession();
  cookie.value = '';
  cookiePreview.value = '';
}

async function save() {
  if (!cookie.value) return;
  saving.value = true;
  cookiePreview.value = '正在获取游戏账号...';
  try {
    const accounts = await window.signAPI.fetchAccounts(cookie.value);
    saveConfig({ cookie: cookie.value, accounts });
    emit('saved');
  } catch (err) {
    cookiePreview.value = '获取账号失败: ' + err.message;
  }
  saving.value = false;
}
</script>

<style scoped>
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; -webkit-app-region: no-drag; }
.modal { background: #16213e; border: 1px solid #0f3460; border-radius: 10px; padding: 20px; width: 400px; }
.modal h2 { font-size: 16px; margin-bottom: 12px; text-align: center; }
.modal p { font-size: 13px; color: #aaa; margin-bottom: 12px; line-height: 1.6; }
.btn { padding: 10px 16px; font-size: 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: #533483; color: #e0e0e0; }
.btn-primary:hover:not(:disabled) { background: #6b40a0; }
.btn-secondary { background: transparent; color: #888; border: 1px solid #0f3460; }
.btn-secondary:hover:not(:disabled) { color: #e0e0e0; }
.btn-block { display: block; width: 100%; margin-bottom: 10px; }
.btn-row { display: flex; gap: 10px; }
.btn-row .btn { flex: 1; }
.preview { font-size: 12px; color: #52b788; margin-bottom: 10px; word-break: break-all; max-height: 120px; overflow: auto; min-height: 18px; }
.preview.empty { color: #888; }
</style>