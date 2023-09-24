const { app, BrowserWindow ,ipcMain } = require('electron');
const path = require('path');
const runScript = require('./theLogic.js');
let mainWindow;

app.on('ready', () => {

  
  // const screenWidth = Math.floor(0.4 * screen.availWidth); 
  // const screenHeight = Math.floor(0.5 * screen.availHeight); 

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // width: screenWidth,
    // height: screenHeight,
    center: true, // Center the window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') 
    }
  });
  mainWindow.loadFile('index.html');
  let username;
  let password;

  ipcMain.on('user-input', (event, userInput) => {
     username = userInput.rollNO;
     password = userInput.passkey;
  });
    runScript(username, password);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
