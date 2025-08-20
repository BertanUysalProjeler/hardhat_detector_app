const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  chooseVideoFile: async () => ipcRenderer.invoke("open-video-dialog"),
  readVideoFile: async (filePath) => ipcRenderer.invoke("read-video-file", filePath),
  uploadVideoFile: async (filePath) => ipcRenderer.invoke("upload-video-file", filePath),
});
