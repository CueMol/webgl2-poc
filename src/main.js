
'use strict';

const electron = require("electron");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
// app.allowRendererProcessReuse = false;
// app.disableHardwareAcceleration();
// console.log(app.getGPUInfo("basic"));


let mainWindow;
let subWindow;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
	    app.quit();
    }
});

const createWindow = () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
        },
    });
    // mainWindow.loadURL('file://' + __dirname + '/index.html');
    mainWindow.loadFile('./index.html');

    mainWindow.on('ready-to-show', function () {
        mainWindow.show();
        mainWindow.focus();
    });


    mainWindow.on('closed', function() {
	    mainWindow = null;
    });

    mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

const {ipcMain} = require('electron');

ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg);
    event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('resize', (event, x, y, w, h) => {
	console.log("resize called", x, y, w, h);
});
