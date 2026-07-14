// Sign-in API for MiHoYo BBS (CN only)
const crypto = require('crypto');

const CN_SIGNIN_SALT = 'LyD1rXqMv2GJhnwdvCBjFOKGiKuLY3aO';

const GAMES = {
  genshin:  { name: '原神', icon: '🍃', signGame: 'hk4e',  url: 'https://api-takumi.mihoyo.com/event/luna/hk4e?act_id=e202311201442471' },
  starrail: { name: '崩坏：星穹铁道', icon: '🚂', signGame: 'hkrpg', url: 'https://api-takumi.mihoyo.com/event/luna/hkrpg?act_id=e202304121516551' },
  zzz:      { name: '绝区零', icon: '⚡', signGame: 'zzz',   url: 'https://api-takumi.mihoyo.com/event/luna/zzz?act_id=e202406242138391' },
};

function generateDS() {
  const t = Math.floor(Date.now() / 1000);
  const r = Array.from({ length: 6 }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 52)]
  ).join('');
  const h = crypto.createHash('md5').update(`salt=${CN_SIGNIN_SALT}&t=${t}&r=${r}`).digest('hex');
  return `${t},${r},${h}`;
}

function buildUrl(gameKey, endpoint) {
  const url = new URL(GAMES[gameKey].url);
  url.pathname = url.pathname.replace(/\/$/, '') + '/' + endpoint;
  return url.toString();
}

function buildHeaders(gameKey, cookie) {
  return {
    Cookie: cookie.replace(/[\n\r]/g, '').trim(),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'x-rpc-signgame': GAMES[gameKey].signGame,
    'x-rpc-app_version': '2.70.1',
    'x-rpc-client_type': '5',
    'x-rpc-sys_version': '12',
    'x-rpc-platform': 'android',
    'x-rpc-channel': 'miyousheluodi',
    ds: generateDS(),
  };
}

async function request(url, options) {
  const { net } = require('electron');
  return new Promise((resolve, reject) => {
    const req = net.request({
      url,
      method: options.method || 'GET',
      redirect: 'follow',
    });
    if (options.headers) {
      Object.entries(options.headers).forEach(([k, v]) => req.setHeader(k, v));
    }
    req.on('response', (resp) => {
      let data = '';
      resp.on('data', (chunk) => (data += chunk));
      resp.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`HTTP ${resp.statusCode}: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchGameAccounts(cookie) {
  const cleanCookie = cookie.replace(/[\n\r]/g, '').trim();
  const data = await request('https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie', {
    method: 'GET',
    headers: {
      Cookie: cleanCookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'x-rpc-app_version': '2.11.1',
      'x-rpc-client_type': '5',
    },
  });
  if (data.retcode !== 0) throw new Error(data.message || `retcode=${data.retcode}`);

  const bizMap = { hk4e_cn: 'genshin', hkrpg_cn: 'starrail', nap_cn: 'zzz' };
  const accounts = {};
  for (const acc of data.data.list) {
    const k = bizMap[acc.game_biz];
    if (k && !accounts[k]) accounts[k] = { uid: acc.game_uid, server: acc.region };
  }
  return accounts;
}

async function checkSignIn(gameKey, cookie, account) {
  const url = buildUrl(gameKey, 'info');
  const p = new URLSearchParams(); p.set('uid', account.uid); p.set('region', account.server);
  return await request(url + '&' + p.toString(), { method: 'GET', headers: buildHeaders(gameKey, cookie) });
}

async function claimReward(gameKey, cookie, account) {
  const url = buildUrl(gameKey, 'sign');
  const p = new URLSearchParams(); p.set('uid', account.uid); p.set('region', account.server);
  return await request(url + '&' + p.toString(), { method: 'POST', headers: buildHeaders(gameKey, cookie) });
}

async function signIn(gameKey, cookie, account) {
  const game = GAMES[gameKey];
  try {
    const info = await checkSignIn(gameKey, cookie, account);
    if (info.retcode !== 0) {
      const expired = info.retcode === -100;
      return { gameKey, name: game.name, icon: game.icon, signed: false, alreadyClaimed: false, streak: 0, error: expired ? 'Cookie 已过期' : (info.message || String(info.retcode)), expired };
    }
    if (info.data.is_sign) {
      return { gameKey, name: game.name, icon: game.icon, signed: true, alreadyClaimed: true, streak: info.data.total_sign_day, error: null };
    }
    const result = await claimReward(gameKey, cookie, account);
    if (result.retcode !== 0 && result.retcode !== -5003) {
      return { gameKey, name: game.name, icon: game.icon, signed: false, alreadyClaimed: false, streak: 0, error: result.message || String(result.retcode) };
    }
    return { gameKey, name: game.name, icon: game.icon, signed: true, alreadyClaimed: result.retcode === -5003, streak: result.data?.total_sign_day || 0, error: null };
  } catch (err) {
    return { gameKey, name: game.name, icon: game.icon, signed: false, alreadyClaimed: false, streak: 0, error: err.message };
  }
}

async function signInAll(cookie, accounts) {
  return await Promise.all(Object.entries(accounts).map(([k, a]) => signIn(k, cookie, a)));
}

module.exports = { GAMES, signInAll, fetchGameAccounts };