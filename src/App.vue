<template>
  <div class="app">
    <div class="header">MiHoYo Sign</div>
    <div class="content">
      <GameList :games="gameStatus" />
      <SignButton :disabled="!configured || signing" :signing="signing" @sign="doSign" />
      <div class="result" :class="{ error: resultError }" :title="resultTooltip">{{ resultText }}</div>
    </div>
    <div class="footer">
      <button class="btn-settings" @click="showSettings = true">Cookie 设置</button>
    </div>
    <CookieSettings v-if="showSettings" @close="showSettings = false" @saved="onSaved" />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import GameList from './components/GameList.vue';
import SignButton from './components/SignButton.vue';
import CookieSettings from './components/CookieSettings.vue';
import genshin from "./assets/原神.png";
import starRail  from "./assets/崩铁.png";
import zzz from "./assets/绝区零.png";

const GAME_DEFS = {
  genshin:  { name: '原神', icon: genshin },
  starrail: { name: '崩坏：星穹铁道', icon: starRail },
  zzz:      { name: '绝区零', icon: zzz },
};

const STORAGE_KEY = 'mihoyo-sign-config';

const showSettings = ref(false);
const signing = ref(false);
const resultText = ref('');
const resultError = ref(false);
const resultTooltip = ref('');

const config = ref(loadConfig());

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

const gameStatus = reactive({});

const configured = computed(() => {
  const c = config.value;
  return !!(c.cookie && c.accounts && Object.keys(c.accounts).length > 0);
});

function refreshGameList() {
  const c = config.value;
  const accounts = c.accounts || {};
  Object.keys(GAME_DEFS).forEach(k => {
    gameStatus[k] = {
      ...GAME_DEFS[k],
      configured: configured.value && !!accounts[k],
    };
  });
}

function onSaved() {
  config.value = loadConfig();
  refreshGameList();
  showSettings.value = false;
}

async function doSign() {
  const c = config.value;
  signing.value = true;
  resultText.value = '';
  resultError.value = false;
  resultTooltip.value = '';

  try {
    // Clone to plain objects to avoid IPC serialization issues
    const cookie = String(c.cookie);
    const accounts = JSON.parse(JSON.stringify(c.accounts));
    const results = await window.signAPI.signInAll(cookie, accounts);
    const expired = results.some(r => r.expired);
    if (expired) {
      localStorage.removeItem(STORAGE_KEY);
      config.value = {};
      refreshGameList();
      resultError.value = true;
      resultText.value = 'Cookie 已过期，正在打开登录窗口...';
      showSettings.value = true;
      return;
    }
    const ok = results.filter(r => r.signed).length;
    resultError.value = ok !== results.length;
    resultText.value = `✔ 签到成功 ${ok}/${results.length}`;
    resultTooltip.value = results.map(r => {
      if (r.error) return `${r.icon} ${r.name}: ❌ ${r.error}`;
      if (r.alreadyClaimed) return `${r.icon} ${r.name}: 今日已签到(连续${r.streak}天)`;
      return `${r.icon} ${r.name}: ✅ 签到成功(连续${r.streak}天)`;
    }).join('\n');
  } catch (err) {
    resultError.value = true;
    resultText.value = err.message;
  } finally {
    signing.value = false;
  }
}

refreshGameList();
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif; background: #1a1a2e; color: #e0e0e0; }
.app { height: 100vh; display: flex; flex-direction: column; -webkit-app-region: drag; }
.header { background: #16213e; padding: 16px 20px; text-align: center; font-size: 18px; font-weight: 700; letter-spacing: 1px; border-bottom: 1px solid #0f3460; }
.content { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 10px; -webkit-app-region: no-drag; }
.result { margin-top: 8px; font-size: 14px; text-align: center; min-height: 24px; color: #52b788; }
.result.error { color: #e76f6f; }
.footer { padding: 12px 20px; border-top: 1px solid #0f3460; -webkit-app-region: no-drag; }
.btn-settings { width: 100%; padding: 10px; font-size: 14px; background: transparent; color: #888; border: 1px solid #0f3460; border-radius: 8px; cursor: pointer; }
.btn-settings:hover { color: #e0e0e0; border-color: #533483; }
</style>