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


/* --------------------------------
   Auto Update Settings
-------------------------------- */

// ไม่ดาวน์โหลดเองทันที
autoUpdater.autoDownload = false

// ไม่ติดตั้งอัตโนมัติทันทีตอนปิดโปรแกรม
autoUpdater.autoInstallOnAppQuit = false

// ไม่อนุญาตให้ downgrade
autoUpdater.allowDowngrade = false

// เปิดโปรแกรมกลับหลังติดตั้งเสร็จ
autoUpdater.autoRunAppAfterInstall = true


/* --------------------------------
   Create Window
-------------------------------- */

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


  // Development
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    mainWindow.loadURL(
      "http://localhost:5173"
    )
  }

  // Production
  else {
    mainWindow.loadFile(
      path.join(
        __dirname,
        "../dist/index.html"
      )
    )
  }


  // เปิด DevTools ถ้าต้องการ debug
  // mainWindow.webContents.openDevTools()
}


/* --------------------------------
   About
-------------------------------- */

function showAbout() {
  if (!mainWindow) {
    return
  }

  dialog.showMessageBox(mainWindow, {
    type: "info",

    title: "About ZRAW Checklist",

    message: "ZRAW Checklist By Sirawit Saetang",

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
  if (!mainWindow) {
    return
  }

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

async function checkForUpdates() {

  // ห้ามเช็ก Update ตอน Development
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.log(
      "[Updater] Disabled in development mode."
    )

    return
  }


  try {

    console.log(
      "================================="
    )

    console.log(
      "[Updater] Checking for updates..."
    )

    console.log(
      "[Updater] Current version:",
      app.getVersion()
    )

    console.log(
      "[Updater] App path:",
      app.getAppPath()
    )

    console.log(
      "================================="
    )


    const result =
      await autoUpdater.checkForUpdates()


    console.log(
      "[Updater] checkForUpdates finished."
    )


    if (result?.updateInfo) {

      console.log(
        "[Updater] Latest version:",
        result.updateInfo.version
      )

    }

  }

  catch (error) {

    console.error(
      "[Updater] CHECK UPDATE ERROR"
    )

    console.error(error)
    console.error(error?.stack)


    if (!mainWindow) {
      return
    }


    dialog.showMessageBox(
      mainWindow,
      {
        type: "error",

        title: "Update Error",

        message:
          "ไม่สามารถตรวจสอบ Update ได้",

        detail:
          error?.stack ||
          error?.message ||
          String(error),

        buttons: ["OK"],
      }
    )
  }
}


/* --------------------------------
   Checking Update
-------------------------------- */

autoUpdater.on(
  "checking-for-update",
  () => {

    console.log(
      "[Updater] Checking for update..."
    )

  }
)


/* --------------------------------
   No Update
-------------------------------- */

autoUpdater.on(
  "update-not-available",
  (info) => {

    console.log(
      "[Updater] No update available."
    )

    console.log(
      "[Updater] Current version:",
      app.getVersion()
    )

    console.log(
      "[Updater] Latest version:",
      info?.version
    )

  }
)


/* --------------------------------
   Update Available
-------------------------------- */

autoUpdater.on(
  "update-available",
  async (info) => {

    console.log(
      "================================="
    )

    console.log(
      "[Updater] UPDATE AVAILABLE"
    )

    console.log(
      "[Updater] Current:",
      app.getVersion()
    )

    console.log(
      "[Updater] New:",
      info?.version
    )

    console.log(
      "[Updater] Release name:",
      info?.releaseName
    )

    console.log(
      "[Updater] Release date:",
      info?.releaseDate
    )

    console.log(
      "================================="
    )


    if (!mainWindow) {
      return
    }


    const result =
      await dialog.showMessageBox(
        mainWindow,
        {
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
            "ต้องการดาวน์โหลด Update ตอนนี้หรือไม่?",

          buttons: [
            "Update Now",
            "Later",
          ],

          defaultId: 0,

          cancelId: 1,
        }
      )


    /* -------------------------
       Later
    ------------------------- */

    if (result.response !== 0) {

      console.log(
        "[Updater] User selected Later."
      )

      return
    }


    /* -------------------------
       Download Update
    ------------------------- */

    console.log(
      "[Updater] User selected Update Now."
    )

    console.log(
      "[Updater] Starting download..."
    )


    try {

      // Reset progress
      if (mainWindow) {
        mainWindow.setProgressBar(0)
      }


      /*
        สำคัญ:
        downloadUpdate() จะดาวน์โหลด
        installer จาก GitHub Release
      */

      const downloadResult =
        await autoUpdater.downloadUpdate()


      console.log(
        "[Updater] downloadUpdate() finished."
      )

      console.log(
        "[Updater] Download result:",
        downloadResult
      )

    }

    catch (error) {

      console.error(
        "================================="
      )

      console.error(
        "[Updater] DOWNLOAD ERROR"
      )

      console.error(error)
      console.error(error?.stack)

      console.error(
        "================================="
      )


      if (!mainWindow) {
        return
      }


      mainWindow.setProgressBar(-1)


      dialog.showMessageBox(
        mainWindow,
        {
          type: "error",

          title:
            "Update Download Error",

          message:
            "ดาวน์โหลด Update ไม่สำเร็จ",

          detail:
            error?.stack ||
            error?.message ||
            String(error),

          buttons: ["OK"],
        }
      )

    }

  }
)


/* --------------------------------
   Download Progress
-------------------------------- */

autoUpdater.on(
  "download-progress",
  (progress) => {

    const percent =
      Number(progress.percent || 0)


    console.log(
      "[Updater] Downloading:",
      percent.toFixed(1) + "%",
      "| speed:",
      progress.bytesPerSecond,
      "bytes/s",
      "| transferred:",
      progress.transferred,
      "| total:",
      progress.total
    )


    if (!mainWindow) {
      return
    }


    mainWindow.setProgressBar(
      percent / 100
    )

  }
)


/* --------------------------------
   Update Downloaded
-------------------------------- */

autoUpdater.on(
  "update-downloaded",
  async (info) => {

    console.log(
      "================================="
    )

    console.log(
      "[Updater] UPDATE DOWNLOADED"
    )

    console.log(
      "[Updater] Version:",
      info?.version
    )

    console.log(
      "================================="
    )


    if (mainWindow) {
      mainWindow.setProgressBar(-1)
    }


    const result =
      await dialog.showMessageBox(
        mainWindow,
        {
          type: "info",

          title:
            "ZRAW Checklist Update Ready",

          message:
            "Update downloaded",

          detail:
            "ดาวน์โหลด Update เรียบร้อยแล้ว\n\n" +
            "Version ใหม่: " +
            (info?.version || "Unknown") +
            "\n\n" +
            "ต้องการ Restart เพื่อติดตั้ง Update หรือไม่?",

          buttons: [
            "Restart & Update",
            "Later",
          ],

          defaultId: 0,

          cancelId: 1,
        }
      )


    /* -------------------------
       Restart & Update
    ------------------------- */

    if (result.response === 0) {

      console.log(
        "[Updater] Installing update..."
      )


      /*
        quitAndInstall(
          isSilent,
          isForceRunAfter
        )
      */

      autoUpdater.quitAndInstall(
        false,
        true
      )

    }

    else {

      console.log(
        "[Updater] User selected Later."
      )

    }

  }
)


/* --------------------------------
   Update Cancelled
-------------------------------- */

autoUpdater.on(
  "update-cancelled",
  (info) => {

    console.log(
      "[Updater] UPDATE CANCELLED"
    )

    console.log(
      "[Updater] Version:",
      info?.version
    )


    if (mainWindow) {
      mainWindow.setProgressBar(-1)
    }

  }
)


/* --------------------------------
   Update Error
-------------------------------- */

autoUpdater.on(
  "error",
  (error) => {

    console.error(
      "================================="
    )

    console.error(
      "[Updater] AUTO UPDATE ERROR"
    )

    console.error(
      error
    )

    console.error(
      error?.stack
    )

    console.error(
      "================================="
    )


    if (!mainWindow) {
      return
    }


    mainWindow.setProgressBar(-1)


    dialog.showMessageBox(
      mainWindow,
      {
        type: "error",

        title:
          "ZRAW Checklist Update Error",

        message:
          "ไม่สามารถอัปเดตโปรแกรมได้",

        detail:
          error?.stack ||
          error?.message ||
          String(error),

        buttons: ["OK"],
      }
    )

  }
)


/* --------------------------------
   Menu
-------------------------------- */

function createMenu() {

  const template = [

    /* =========================
       FILE
    ========================= */

    {
      label: "File",

      submenu: [

        {
          label: "New Project",

          accelerator: "Ctrl+N",

          click() {

            if (!mainWindow) {
              return
            }


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


    /* =========================
       EDIT
    ========================= */

    {
      label: "Edit",

      submenu: [

        {
          label: "Undo",

          accelerator: "Ctrl+Z",

          click() {

            if (!mainWindow) {
              return
            }


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

            if (!mainWindow) {
              return
            }


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


    /* =========================
       VIEW
    ========================= */

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


    /* =========================
       WINDOW
    ========================= */

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


    /* =========================
       HELP
    ========================= */

    {
      label: "Help",

      submenu: [

        {
          label:
            "Check for Updates",

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
   App Ready
-------------------------------- */

app.whenReady().then(() => {

  createWindow()

  createMenu()


  /*
    รอ 3 วินาทีหลังเปิดโปรแกรม
    แล้วค่อยเช็ก Update
  */

  setTimeout(() => {

    checkForUpdates()

  }, 3000)


  app.on(
    "activate",
    () => {

      if (
        BrowserWindow
          .getAllWindows()
          .length === 0
      ) {

        createWindow()

      }

    }
  )

})


/* --------------------------------
   Close
-------------------------------- */

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