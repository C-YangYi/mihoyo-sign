const GAME_DEFS = {
  genshin:  { name: '原神', icon: '🍃' },
  starrail: { name: '崩坏：星穹铁道', icon: '🚂' },
  zzz:      { name: '绝区零', icon: '⚡' },
};

const STORAGE_KEY = 'mihoyo-sign-config';

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveConfig(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
function isConfigured() {
  const c = loadConfig();
  return !!(c.cookie && c.accounts && Object.keys(c.accounts).length > 0);
}

function renderGameList() {
  const c = loadConfig();
  const accounts = c.accounts || {};
  document.getElementById('gameList').innerHTML = Object.entries(GAME_DEFS)
    .map(([k, g]) => {
      const has = isConfigured() && accounts[k];
      return `<div class="game-row">
        <span class="game-icon">${g.icon}</span>
        <span class="game-name">${g.name}</span>
        <span class="game-status ${has ? 'status-configured' : 'status-not-configured'}">${has ? '✅ 已配置' : '❌ 未配置'}</span>
      </div>`;
    }).join('');
}

// ---- Settings ----
function openSettings() {
  document.getElementById('modalOverlay').classList.add('active');
  const c = loadConfig();
  const preview = document.getElementById('cookiePreview');
  if (c.cookie) {
    preview.textContent = '已配置 Cookie: ' + c.cookie.substring(0, 80) + '...';
    preview.className = 'cookie-preview';
  } else {
    preview.textContent = '未获取 Cookie';
    preview.className = 'cookie-preview empty';
  }
}

function closeSettings() { document.getElementById('modalOverlay').classList.remove('active'); }

// ---- 网页登录 ----
async function openLogin() {
  await window.signAPI.openLoginWindow();
}

async function getCookies() {
  const preview = document.getElementById('cookiePreview');
  preview.textContent = '正在获取...';
  preview.className = 'cookie-preview';
  const result = await window.signAPI.getLoginCookies();
  if (!result.cookie) {
    preview.textContent = '未获取到 Cookie，请确认已登录';
    preview.className = 'cookie-preview empty';
    return;
  }
  const c = loadConfig();
  c.cookie = result.cookie;
  saveConfig(c);
  preview.textContent = '已获取: ' + result.cookie.substring(0, 80) + '...';
  preview.className = 'cookie-preview';
  await window.signAPI.closeLoginWindow();
}

async function clearSession() {
  await window.signAPI.clearLoginSession();
  const c = loadConfig();
  delete c.cookie;
  delete c.accounts;
  saveConfig(c);
  document.getElementById('cookiePreview').textContent = '未获取 Cookie';
  document.getElementById('cookiePreview').className = 'cookie-preview empty';
}

// ---- 保存 ----
async function save() {
  const c = loadConfig();
  if (!c.cookie) {
    document.getElementById('cookiePreview').textContent = '请先获取 Cookie';
    document.getElementById('cookiePreview').className = 'cookie-preview empty';
    return;
  }
  const preview = document.getElementById('cookiePreview');
  preview.textContent = '正在获取游戏账号...';
  preview.className = 'cookie-preview';
  try {
    c.accounts = await window.signAPI.fetchAccounts(c.cookie);
    saveConfig(c);
    const names = Object.entries(c.accounts).map(([k, a]) => `${GAME_DEFS[k].icon}${a.uid}`).join(' ');
    preview.textContent = '已保存: ' + names;
    preview.className = 'cookie-preview';
    closeSettings();
    renderGameList();
  } catch (err) {
    preview.textContent = '获取账号失败: ' + err.message;
    preview.className = 'cookie-preview empty';
  }
}

// ---- 签到 ----
async function signAll() {
  const c = loadConfig();
  const btn = document.getElementById('btnSignAll');
  const area = document.getElementById('resultArea');
  if (!isConfigured()) { area.className = 'result-area error'; area.textContent = '请先设置 Cookie'; return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>签到中...';
  area.className = 'result-area';
  area.textContent = '';
  try {
    const results = await window.signAPI.signInAll(c.cookie, c.accounts);
    const ok = results.filter(r => r.signed).length;
    const expired = results.some(r => r.expired);
    area.className = ok === results.length ? 'result-area' : 'result-area error';
    area.textContent = expired ? 'Cookie 已过期，请重新获取' : `✔ 签到成功 ${ok}/${results.length}`;
    area.title = results.map(r => `${r.icon} ${r.name}: ${r.error || (r.alreadyClaimed ? `今日已签到(连续${r.streak}天)` : `✅ 签到成功(连续${r.streak}天)`)}`).join('\n');
  } catch (err) {
    area.className = 'result-area error';
    area.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '一键签到所有游戏';
  }
}

// ---- Events ----
document.getElementById('btnSettings').addEventListener('click', openSettings);
document.getElementById('btnSignAll').addEventListener('click', signAll);
document.getElementById('btnOpenLogin').addEventListener('click', openLogin);
document.getElementById('btnGetCookies').addEventListener('click', getCookies);
document.getElementById('btnClearSession').addEventListener('click', clearSession);
document.getElementById('btnSave').addEventListener('click', save);
document.getElementById('btnCancel').addEventListener('click', closeSettings);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeSettings();
});

renderGameList();