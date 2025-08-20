const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs").promises;
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#0b5cff",
    icon: process.platform === "win32"
      ? path.join(__dirname, "icon.ico")
      : path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.ELECTRON_DEV === "1") {
    win.loadURL("http://localhost:5713"); // Vite dev server (matches vite.config.js)
    win.webContents.openDevTools({ mode: "detach" });
  } else {
  // for packaged app
  const prodIndex = path.join(process.resourcesPath, "web", "index.html");
  win.loadFile(prodIndex);
}
}

app.whenReady().then(() => {
  // Expose native file dialog to renderer
  ipcMain.handle("open-video-dialog", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Select a video file",
      properties: ["openFile"],
      filters: [
        { name: "Videos", extensions: ["mp4", "mov", "avi", "mkv", "webm"] },
      ],
    });
    if (canceled || !filePaths || filePaths.length === 0) return null;
    return filePaths[0];
  });

  ipcMain.handle("read-video-file", async (_event, filePath) => {
    const data = await fs.readFile(filePath);
    return {
      name: path.basename(filePath),
      base64: data.toString("base64"),
    };
  });

  // Upload the selected file to backend from the main process to avoid large base64 in renderer
  ipcMain.handle("upload-video-file", async (_event, filePath) => {
    const data = await fs.readFile(filePath);
    const blob = new Blob([data]);
    const form = new FormData();
    form.append("file", blob, path.basename(filePath));
    const resp = await fetch("http://127.0.0.1:8000/upload/", { method: "POST", body: form });
    let json = null;
    try {
      json = await resp.json();
    } catch (_) {}
    return { ok: resp.ok, status: resp.status, data: json };
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
