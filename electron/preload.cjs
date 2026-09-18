const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  newProject: (callback) => {
    ipcRenderer.on("menu-new-project", callback)

    return () => {
      ipcRenderer.removeListener(
        "menu-new-project",
        callback
      )
    }
  },

  undo: (callback) => {
    ipcRenderer.on("menu-undo", callback)

    return () => {
      ipcRenderer.removeListener(
        "menu-undo",
        callback
      )
    }
  },

  redo: (callback) => {
    ipcRenderer.on("menu-redo", callback)

    return () => {
      ipcRenderer.removeListener(
        "menu-redo",
        callback
      )
    }
  },
})