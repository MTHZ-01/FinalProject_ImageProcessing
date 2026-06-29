const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        frame: false,
        titleBarStyle: 'hidden',
        
        transparent: true,
        backgroundColor: '#00000000',
        
        hasShadow: true,
        roundedCorners: true,
        
        thickFrame: false,
        
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.cjs"),
            hardwareAcceleration: false,     // Very important
        }
    });

    mainWindow.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// Controls
ipcMain.on("window-minimize", () => mainWindow.minimize());
ipcMain.on("window-maximize", () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
});
ipcMain.on("window-close", () => mainWindow.close());