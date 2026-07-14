const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { signInAll, fetchGameAccounts } = require('./sign-api');

let mainWindow;
let loginWindow = null;
let capturedCookies = {};

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
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// --- Login window ---
ipcMain.handle('open-login-window', async () => {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }
  capturedCookies = {};

  loginWindow = new BrowserWindow({
    width: 430,
    height: 680,
    title: '登录米游社',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  loginWindow.setMenuBarVisibility(false);

  const ses = loginWindow.webContents.session;
  ses.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
    if (setCookie) {
      for (const h of setCookie) {
        const m = h.match(/^([^=]+)=([^;]*)/);
        if (m) capturedCookies[m[1]] = m[2];
      }
    }
    callback({ responseHeaders: headers });
  });

  loginWindow.loadURL('https://user.miyoushe.com/');
  loginWindow.on('closed', () => { loginWindow = null; });
});

ipcMain.handle('get-login-cookies', async () => {
  const entries = Object.entries(capturedCookies);
  const cookie = entries.map(([k, v]) => `${k}=${v}`).join('; ');
  const names = entries.map(([k]) => k);
  return { cookie, names };
});

ipcMain.handle('close-login-window', async () => {
  if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
});

ipcMain.handle('clear-login-session', async () => {
  capturedCookies = {};
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.webContents.session.clearStorageData();
    loginWindow.close();
  }
});

// --- Sign-in ---
ipcMain.handle('fetch-accounts', async (_event, cookie) => {
  return await fetchGameAccounts(cookie);
});

ipcMain.handle('sign-in-all', async (_event, cookie, accounts) => {
  return await signInAll(cookie, accounts);
});