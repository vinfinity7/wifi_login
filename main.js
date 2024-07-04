const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const runScript = require('./theLogic.js');

let mainWindow;
let credentials = {
  username: '',
  password: ''
};

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true, // Center the window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  ipcMain.on('user-input', (event, userInput) => {
    credentials.username = userInput.rollNO;
    credentials.password = userInput.passkey;

    // Call runScript after receiving the credentials
    runScript(credentials.username, credentials.password);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
