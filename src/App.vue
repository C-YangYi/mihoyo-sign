<template>
  <div class="app">
    <div class="header">SignMiao</div>
    <div class="content">
      <GameList :games="gameStatus" />
      <SignButton :disabled="!configured || signing || signedToday" :signing="signing" :label="btnLabel"
        @sign="doSign" />
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
import starRail from "./assets/崩铁.png";
import zzz from "./assets/绝区零.png";

const GAME_DEFS = {
  genshin: { name: '原神', icon: genshin },
  starrail: { name: '崩坏：星穹铁道', icon: starRail },
  zzz: { name: '绝区零', icon: zzz },
};

const STORAGE_KEY = 'mihoyo-sign-config';

const showSettings = ref(false);
const signing = ref(false);
const signedToday = ref(false);
const btnLabel = ref('一键签到所有游戏');
const resultText = ref('');
const resultError = ref(false);
const resultTooltip = ref('');

const config = ref(loadConfig());

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const gameStatus = reactive({});

const configured = computed(() => {
  const c = config.value;
  return !!(c.cookie && c.accounts && Object.keys(c.accounts).length > 0);
});

function refreshGameList() {
  const c = config.value;
  const accounts = c.accounts || {};
  const streaks = c.streaks || {};
  Object.keys(GAME_DEFS).forEach(k => {
    gameStatus[k] = {
      ...GAME_DEFS[k],
      uid: accounts[k]?.uid || null,
      streak: streaks[k] || 0,
    };
  });
  if (c.lastSignDate === getToday()) {
    signedToday.value = true;
    btnLabel.value = '今日已签到，明天别忘了哟';
  }
}

// Auto-sign on startup if configured and not signed today
async function autoSign() {
  const c = config.value;
  if (!configured.value) return;
  if (c.lastSignDate === getToday()) {
    signedToday.value = true;
    btnLabel.value = '今日已签到，明天别忘了哟';
    // Refresh streak data even if already signed
    refreshStreaks();
    return;
  }
  // Auto sign
  signing.value = true;
  btnLabel.value = '正在签到...';
  resultText.value = '';
  try {
    const cookie = String(c.cookie);
    const accounts = JSON.parse(JSON.stringify(c.accounts));
    const results = await window.signAPI.signInAll(cookie, accounts);
    const expired = results.some(r => r.expired);
    if (expired) {
      localStorage.removeItem(STORAGE_KEY);
      config.value = {};
      signedToday.value = false;
      btnLabel.value = '一键签到所有游戏';
      refreshGameList();
      resultError.value = true;
      resultText.value = 'Cookie 已过期，请重新设置';
      return;
    }
    c.lastSignDate = getToday();
    c.streaks = {};
    results.forEach(r => { if (r.streak) c.streaks[r.gameKey] = r.streak; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    signedToday.value = true;
    btnLabel.value = '今日已签到，明天别忘了哟';
    config.value = c;
    refreshGameList();
    const ok = results.filter(r => r.signed).length;
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

// Refresh streaks for already-signed-today state
async function refreshStreaks() {
  const c = config.value;
  if (!c.cookie || !c.accounts) return;
  try {
    const accounts = JSON.parse(JSON.stringify(c.accounts));
    const results = await window.signAPI.signInAll(c.cookie, accounts);
    c.streaks = {};
    results.forEach(r => { if (r.streak) c.streaks[r.gameKey] = r.streak; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    config.value = c;
    refreshGameList();
  } catch (_) {}
}

function onSaved() {
  config.value = loadConfig();
  signedToday.value = false;
  btnLabel.value = '正在签到...';
  refreshGameList();
  showSettings.value = false;
  autoSign();
}

async function doSign() {
  const c = config.value;
  signing.value = true;
  resultText.value = '';
  resultError.value = false;
  resultTooltip.value = '';

  try {
    const cookie = String(c.cookie);
    const accounts = JSON.parse(JSON.stringify(c.accounts));
    const results = await window.signAPI.signInAll(cookie, accounts);
    const expired = results.some(r => r.expired);
    if (expired) {
      localStorage.removeItem(STORAGE_KEY);
      config.value = {};
      signedToday.value = false;
      btnLabel.value = '一键签到所有游戏';
      refreshGameList();
      resultError.value = true;
      resultText.value = 'Cookie 已过期，正在打开登录窗口...';
      showSettings.value = true;
      return;
    }
    // Record today's sign-in
    c.lastSignDate = getToday();
    c.streaks = {};
    results.forEach(r => { if (r.streak) c.streaks[r.gameKey] = r.streak; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    signedToday.value = true;
    btnLabel.value = '今日已签到，明天别忘了哟';
    config.value = c;
    refreshGameList();

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
autoSign();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
  background: #f5f6fa;
  color: #333;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-app-region: drag;
}

.header {
  background: #000;
  padding: 16px 20px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  border-bottom: 2px solid #2d8cf0;
}

.content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.result {
  margin-top: 8px;
  font-size: 14px;
  text-align: center;
  min-height: 24px;
  color: #2d8cf0;
}

.result.error {
  color: #e74c3c;
}

.footer {
  padding: 12px 20px;
  border-top: 1px solid #e8e8e8;
  background: #fff;
  -webkit-app-region: no-drag;
}

.btn-settings {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  background: transparent;
  color: #999;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
}

.btn-settings:hover {
  color: #2d8cf0;
  border-color: #2d8cf0;
}
</style>
