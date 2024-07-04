const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  sendUserInput: (userInput) => ipcRenderer.send('user-input', userInput)
});
