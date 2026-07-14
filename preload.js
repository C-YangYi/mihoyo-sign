const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('signAPI', {
  openLoginWindow: () => ipcRenderer.invoke('open-login-window'),
  getLoginCookies: () => ipcRenderer.invoke('get-login-cookies'),
  closeLoginWindow: () => ipcRenderer.invoke('close-login-window'),
  clearLoginSession: () => ipcRenderer.invoke('clear-login-session'),
  fetchAccounts: (cookie) => ipcRenderer.invoke('fetch-accounts', cookie),
  signInAll: (cookie, accounts) => ipcRenderer.invoke('sign-in-all', cookie, accounts),
});