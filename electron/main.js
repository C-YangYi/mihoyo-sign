const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { signInAll, fetchGameAccounts } = require('./sign-api');

let mainWindow;
let loginWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 620,
    resizable: false,
    title: 'MiHoYo Sign',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// ---- Login window ----
ipcMain.handle('open-login-window', async () => {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }

  loginWindow = new BrowserWindow({
    width: 430,
    height: 680,
    title: '登录米游社',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  loginWindow.setMenuBarVisibility(false);
  loginWindow.loadURL('https://user.miyoushe.com/');
  loginWindow.on('closed', () => { loginWindow = null; });
});

ipcMain.handle('get-login-cookies', async () => {
  if (!loginWindow || loginWindow.isDestroyed()) return { cookie: '', names: [], allNames: [] };

  const ses = loginWindow.webContents.session;
  const cookies = await ses.cookies.get({});

  const relevant = [
    'ltoken_v2', 'ltuid_v2', 'cookie_token_v2', 'account_id_v2',
    'ltoken', 'ltuid', 'cookie_token', 'account_id',
    'account_mid_v2', 'ltmid_v2', 'stoken', 'stuid', 'mid',
  ];
  const filtered = cookies.filter(c => relevant.includes(c.name));

  // Deduplicate: keep last occurrence of each cookie name
  const seen = new Map();
  for (const c of filtered) seen.set(c.name, c.value);
  const found = Array.from(seen.entries()).map(([k, v]) => `${k}=${v}`).join('; ');

  const allNames = cookies.map(c => `${c.domain}:${c.name}`);

  return { cookie: found, names: Array.from(seen.keys()), allNames };
});

ipcMain.handle('close-login-window', async () => {
  if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
});

ipcMain.handle('clear-login-session', async () => {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.webContents.session.clearStorageData();
    loginWindow.close();
  }
});

// ---- Sign-in ----
ipcMain.handle('fetch-accounts', async (_event, cookie) => {
  return await fetchGameAccounts(cookie);
});

ipcMain.handle('sign-in-all', async (_event, cookie, accounts) => {
  return await signInAll(cookie, accounts);
});