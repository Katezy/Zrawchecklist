const {
  app,
  BrowserWindow,
  Menu,
  dialog,
} = require("electron")

const path = require("path")

const {
  autoUpdater,
} = require("electron-updater")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

    minWidth: 900,
    minHeight: 600,

    backgroundColor: "#0a0a0a",

    autoHideMenuBar: false,

    icon: path.join(
      __dirname,
      "../build/icon.ico"
    ),

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,

      preload: path.join(
        __dirname,
        "preload.cjs"
      ),
    },
  })

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    mainWindow.loadURL(
      "http://localhost:5173"
    )
  } else {
    mainWindow.loadFile(
      path.join(
        __dirname,
        "../dist/index.html"
      )
    )
  }
}

/* --------------------------------
   About
-------------------------------- */

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: "info",

    title: "About ZRAW Checklist",

    message: "ZRAW Checklist",

    detail:
      "Version " +
      app.getVersion() +
      "\n\n" +
      "Created by ZRAW HOUSE\n" +
      "Designed & Developed by ZRAW\n\n" +
      "© 2026 ZRAW",

    buttons: ["Close"],
  })
}

/* --------------------------------
   Settings
-------------------------------- */

function showSettings() {
  dialog.showMessageBox(mainWindow, {
    type: "info",

    title: "Settings",

    message: "ZRAW Checklist Settings",

    detail:
      "Appearance\n" +
      "Dark Mode\n\n" +
      "Storage\n" +
      "Local Storage\n\n" +
      "Version " +
      app.getVersion(),

    buttons: ["Close"],
  })
}

/* --------------------------------
   Check Update
-------------------------------- */

function checkForUpdates() {
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    return
  }

  autoUpdater.checkForUpdates()
}

/* --------------------------------
   Update Available
-------------------------------- */

autoUpdater.on(
  "update-available",
  (info) => {
    dialog
      .showMessageBox(mainWindow, {
        type: "info",

        title:
          "ZRAW Checklist Update",

        message:
          "New version available",

        detail:
          "Current version: " +
          app.getVersion() +
          "\n" +
          "New version: " +
          info.version +
          "\n\n" +
          "ต้องการอัปเดตตอนนี้หรือไม่?",

        buttons: [
          "Update Now",
          "Later",
        ],

        defaultId: 0,

        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  }
)

/* --------------------------------
   Download Progress
-------------------------------- */

autoUpdater.on(
  "download-progress",
  (progress) => {
    if (!mainWindow) {
      return
    }

    mainWindow.setProgressBar(
      progress.percent / 100
    )
  }
)

/* --------------------------------
   Update Downloaded
-------------------------------- */

autoUpdater.on(
  "update-downloaded",
  () => {
    if (!mainWindow) {
      return
    }

    mainWindow.setProgressBar(-1)

    dialog
      .showMessageBox(mainWindow, {
        type: "info",

        title:
          "Update Ready",

        message:
          "Update downloaded",

        detail:
          "ดาวน์โหลด Update เรียบร้อยแล้ว\n\n" +
          "โปรแกรมจะ Restart เพื่อติดตั้ง Update",

        buttons: [
          "Restart & Update",
          "Later",
        ],

        defaultId: 0,

        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  }
)

/* --------------------------------
   Update Error
-------------------------------- */

autoUpdater.on(
  "error",
  (error) => {
    console.error(
      "Auto Update Error:",
      error
    )
  }
)

/* --------------------------------
   Menu
-------------------------------- */

function createMenu() {
  const template = [
    {
      label: "File",

      submenu: [
        {
          label: "New Project",

          accelerator: "Ctrl+N",

          click() {
            mainWindow.webContents.send(
              "menu-new-project"
            )
          },
        },

        {
          type: "separator",
        },

        {
          label: "Quit",

          accelerator: "Ctrl+Q",

          click() {
            app.quit()
          },
        },
      ],
    },

    {
      label: "Edit",

      submenu: [
        {
          label: "Undo",

          accelerator: "Ctrl+Z",

          click() {
            mainWindow.webContents.send(
              "menu-undo"
            )
          },
        },

        {
          label: "Redo",

          accelerator:
            "Ctrl+Shift+Z",

          click() {
            mainWindow.webContents.send(
              "menu-redo"
            )
          },
        },

        {
          type: "separator",
        },

        {
          role: "cut",
        },

        {
          role: "copy",
        },

        {
          role: "paste",
        },

        {
          role: "selectAll",
        },
      ],
    },

    {
      label: "View",

      submenu: [
        {
          role: "reload",
        },

        {
          role: "toggleDevTools",
        },

        {
          type: "separator",
        },

        {
          role: "resetZoom",
        },

        {
          role: "zoomIn",
        },

        {
          role: "zoomOut",
        },

        {
          type: "separator",
        },

        {
          role: "togglefullscreen",
        },
      ],
    },

    {
      label: "Window",

      submenu: [
        {
          role: "minimize",
        },

        {
          role: "close",
        },
      ],
    },

    {
      label: "Help",

      submenu: [
        {
          label: "Check for Updates",

          click() {
            checkForUpdates()
          },
        },

        {
          type: "separator",
        },

        {
          label: "Settings",

          click() {
            showSettings()
          },
        },

        {
          type: "separator",
        },

        {
          label:
            "About ZRAW Checklist",

          click() {
            showAbout()
          },
        },
      ],
    },
  ]

  const menu =
    Menu.buildFromTemplate(
      template
    )

  Menu.setApplicationMenu(menu)
}

/* --------------------------------
   Start
-------------------------------- */

app.whenReady().then(() => {
  createWindow()

  createMenu()

  // เช็ก Update หลังเปิดโปรแกรม
  setTimeout(() => {
    checkForUpdates()
  }, 3000)

  app.on(
    "activate",
    () => {
      if (
        BrowserWindow.getAllWindows()
          .length === 0
      ) {
        createWindow()
      }
    }
  )
})

app.on(
  "window-all-closed",
  () => {
    if (
      process.platform !== "darwin"
    ) {
      app.quit()
    }
  }
)